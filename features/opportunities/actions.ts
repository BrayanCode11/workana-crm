"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { chooseLeastUsedVariant } from "@/features/experiments/assignment";
import { activeOpportunityStages } from "./constants";
import {
  formDataToObject,
  getFieldErrors,
  opportunityFormSchema,
  toOpportunityInsert,
} from "./schema";
import type { OpportunityFormState, OpportunityInsert } from "./types";

async function validateReferences(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  values: OpportunityInsert,
) {
  if (values.client_id) {
    const { data } = await supabase
      .from("clients")
      .select("id")
      .eq("id", values.client_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (!data) return { field: "client_id" as const, message: "El cliente seleccionado ya no está disponible." };
  }

  if (values.experiment_id) {
    const { data } = await supabase
      .from("experiments")
      .select("id")
      .eq("id", values.experiment_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (!data) return { field: "experiment_id" as const, message: "El experimento seleccionado ya no está disponible." };
  }

  if (values.experiment_variant_id) {
    const { data } = await supabase
      .from("experiment_variants")
      .select("id")
      .eq("id", values.experiment_variant_id)
      .eq("experiment_id", values.experiment_id!)
      .eq("user_id", userId)
      .maybeSingle();
    if (!data) return { field: "experiment_variant_id" as const, message: "La variante no pertenece al experimento seleccionado." };
  }

  if (values.lost_reason_id) {
    const { data } = await supabase
      .from("lost_reasons")
      .select("id, slug")
      .eq("id", values.lost_reason_id)
      .eq("is_active", true)
      .maybeSingle();
    if (!data) return { field: "lost_reason_id" as const, message: "El motivo seleccionado ya no está disponible." };
    if (data.slug === "other" && !values.lost_reason_notes) {
      return { field: "lost_reason_notes" as const, message: "Describe brevemente el otro motivo." };
    }
  }

  return null;
}

async function findDuplicateWorkanaOpportunity(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  workanaUrl: string | null | undefined,
  excludeOpportunityId?: string,
) {
  if (!workanaUrl) return null;
  let query = supabase
    .from("opportunities")
    .select("id")
    .eq("user_id", userId)
    .eq("workana_url", workanaUrl);
  if (excludeOpportunityId) query = query.neq("id", excludeOpportunityId);
  const { data } = await query.maybeSingle();
  return data?.id ?? null;
}

function duplicateState(opportunityId: string): OpportunityFormState {
  return {
    message: "Ya existe una oportunidad registrada con esta URL.",
    duplicateOpportunityId: opportunityId,
    errors: { workana_url: "Utiliza otra URL o abre la oportunidad existente." },
  };
}

async function assignDefaultExperiment(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  values: OpportunityInsert,
) {
  if (values.experiment_id || values.experiment_variant_id) return;
  const { data: experiment } = await supabase.from("experiments")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .eq("is_default_for_new_opportunities", true)
    .maybeSingle();
  if (!experiment) return;
  const [{ data: variants }, { data: assignments }] = await Promise.all([
    supabase.from("experiment_variants").select("id, code, created_at").eq("user_id", userId).eq("experiment_id", experiment.id).eq("is_active", true),
    supabase.from("opportunities").select("experiment_variant_id").eq("user_id", userId).eq("experiment_id", experiment.id),
  ]);
  const variant = chooseLeastUsedVariant(variants ?? [], assignments ?? []);
  if (!variant) return;
  values.experiment_id = experiment.id;
  values.experiment_variant_id = variant.id;
}

async function prepareOpportunity(formData: FormData): Promise<
  | { state: OpportunityFormState }
  | { values: OpportunityInsert; newClient: { name: string; company_name: string | null } | null }
> {
  const parsed = opportunityFormSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return { state: { message: "Revisa los campos indicados.", errors: getFieldErrors(parsed.error) } };
  }

  const values = toOpportunityInsert(parsed.data);
  return {
    values,
    newClient: parsed.data.new_client_name
      ? { name: parsed.data.new_client_name, company_name: parsed.data.new_client_company || null }
      : null,
  };
}

export async function createOpportunityAction(
  _previousState: OpportunityFormState,
  formData: FormData,
): Promise<OpportunityFormState> {
  const prepared = await prepareOpportunity(formData);
  if ("state" in prepared) return prepared.state;

  const { userId } = await requireUser();
  const supabase = await createClient();
  await assignDefaultExperiment(supabase, userId, prepared.values);
  const referenceError = await validateReferences(supabase, userId, prepared.values);
  if (referenceError) {
    return { message: "Revisa los campos indicados.", errors: { [referenceError.field]: referenceError.message } };
  }

  const duplicateId = await findDuplicateWorkanaOpportunity(supabase, userId, prepared.values.workana_url);
  if (duplicateId) return duplicateState(duplicateId);

  if (prepared.newClient) {
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .insert({ ...prepared.newClient, user_id: userId })
      .select("id")
      .single();
    if (clientError) {
      console.error("Unable to create quick client", { code: clientError.code });
      return { message: "No pudimos crear el cliente asociado.", errors: { new_client_name: "Intenta nuevamente." } };
    }
    prepared.values.client_id = client.id;
  }

  const { data, error } = await supabase
    .from("opportunities")
    .insert({ ...prepared.values, user_id: userId })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505" && prepared.values.workana_url) {
      const raceDuplicateId = await findDuplicateWorkanaOpportunity(supabase, userId, prepared.values.workana_url);
      if (raceDuplicateId) return duplicateState(raceDuplicateId);
    }
    console.error("Unable to create opportunity", { code: error.code });
    return { message: "No pudimos guardar la oportunidad. Revisa los datos e intenta nuevamente." };
  }

  revalidatePath("/opportunities");
  revalidatePath("/clients");
  if (prepared.values.client_id) revalidatePath(`/clients/${prepared.values.client_id}`);
  redirect(`/opportunities/${data.id}?created=1`);
}

export async function updateOpportunityAction(
  opportunityId: string,
  _previousState: OpportunityFormState,
  formData: FormData,
): Promise<OpportunityFormState> {
  const prepared = await prepareOpportunity(formData);
  if ("state" in prepared) return prepared.state;

  const { userId } = await requireUser();
  const supabase = await createClient();
  const { data: current } = await supabase
    .from("opportunities")
    .select("id, client_id, won_at, lost_at, final_value, final_value_currency, lost_reason_id, lost_reason_notes")
    .eq("id", opportunityId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!current) return { message: "La oportunidad ya no está disponible." };

  const referenceError = await validateReferences(supabase, userId, prepared.values);
  if (referenceError) {
    return { message: "Revisa los campos indicados.", errors: { [referenceError.field]: referenceError.message } };
  }

  const duplicateId = await findDuplicateWorkanaOpportunity(
    supabase,
    userId,
    prepared.values.workana_url,
    opportunityId,
  );
  if (duplicateId) return duplicateState(duplicateId);

  // Los hitos de cierre son históricos: cambiar nuevamente la etapa no debe borrarlos.
  if (prepared.values.stage !== "won") {
    prepared.values.won_at = current.won_at;
    prepared.values.final_value = current.final_value;
    prepared.values.final_value_currency = current.final_value_currency;
  }
  if (prepared.values.stage !== "lost") {
    prepared.values.lost_at = current.lost_at;
    prepared.values.lost_reason_id = current.lost_reason_id;
    prepared.values.lost_reason_notes = current.lost_reason_notes;
  }

  if (prepared.newClient) {
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .insert({ ...prepared.newClient, user_id: userId })
      .select("id")
      .single();
    if (clientError) {
      console.error("Unable to create quick client", { code: clientError.code });
      return { message: "No pudimos crear el cliente asociado.", errors: { new_client_name: "Intenta nuevamente." } };
    }
    prepared.values.client_id = client.id;
  }

  const { data, error } = await supabase
    .from("opportunities")
    .update(prepared.values)
    .eq("id", opportunityId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    if (error?.code === "23505" && prepared.values.workana_url) {
      const raceDuplicateId = await findDuplicateWorkanaOpportunity(
        supabase,
        userId,
        prepared.values.workana_url,
        opportunityId,
      );
      if (raceDuplicateId) return duplicateState(raceDuplicateId);
    }
    console.error("Unable to update opportunity", { code: error?.code });
    return { message: "No pudimos actualizar la oportunidad." };
  }

  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${opportunityId}`);
  revalidatePath("/clients");
  if (current.client_id) revalidatePath(`/clients/${current.client_id}`);
  if (prepared.values.client_id) revalidatePath(`/clients/${prepared.values.client_id}`);
  redirect(`/opportunities/${opportunityId}?updated=1`);
}

export async function changeOpportunityStageAction(opportunityId: string, formData: FormData) {
  const stage = String(formData.get("stage") ?? "");
  if (!activeOpportunityStages.includes(stage as (typeof activeOpportunityStages)[number])) {
    redirect(`/opportunities/${opportunityId}?stage_error=1`);
  }

  const { userId } = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("opportunities")
    .update({ stage })
    .eq("id", opportunityId)
    .eq("user_id", userId)
    .select("id, client_id")
    .maybeSingle();

  if (error || !data) {
    console.error("Unable to change opportunity stage", { code: error?.code });
    redirect(`/opportunities/${opportunityId}?stage_error=1`);
  }

  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${opportunityId}`);
  if (data.client_id) revalidatePath(`/clients/${data.client_id}`);
  redirect(`/opportunities/${opportunityId}?stage_updated=1`);
}

export async function deleteOpportunityAction(opportunityId: string) {
  const { userId } = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("opportunities")
    .delete()
    .eq("id", opportunityId)
    .eq("user_id", userId)
    .select("client_id")
    .maybeSingle();

  if (error || !data) {
    console.error("Unable to delete opportunity", { code: error?.code });
    throw new Error("No pudimos eliminar la oportunidad.");
  }

  revalidatePath("/opportunities");
  revalidatePath("/clients");
  if (data.client_id) revalidatePath(`/clients/${data.client_id}`);
  redirect("/opportunities?deleted=1");
}
