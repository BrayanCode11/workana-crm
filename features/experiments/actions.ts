"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { parseExperimentForm, parseVariantForm } from "./schema";
import type { DeleteExperimentState, ExperimentFormState, VariantFormState } from "./types";

function refreshExperimentPaths(experimentId?: string) {
  revalidatePath("/experiments");
  revalidatePath("/opportunities");
  if (experimentId) revalidatePath(`/experiments/${experimentId}`);
}

export async function createExperimentAction(
  _previousState: ExperimentFormState,
  formData: FormData,
): Promise<ExperimentFormState> {
  const parsed = parseExperimentForm(formData);
  if ("state" in parsed) return parsed.state;

  const { userId } = await requireUser();
  const supabase = await createClient();
  if (parsed.values.is_default_for_new_opportunities) {
    await supabase.from("experiments").update({ is_default_for_new_opportunities: false }).eq("user_id", userId);
  }
  const { data, error } = await supabase
    .from("experiments")
    .insert({ ...parsed.values, user_id: userId })
    .select("id")
    .single();

  if (error) {
    console.error("Unable to create experiment", { code: error.code });
    return { message: "No pudimos guardar el experimento. Intenta nuevamente." };
  }

  refreshExperimentPaths(data.id);
  redirect(`/experiments/${data.id}?created=1`);
}

export async function updateExperimentAction(
  experimentId: string,
  _previousState: ExperimentFormState,
  formData: FormData,
): Promise<ExperimentFormState> {
  const parsed = parseExperimentForm(formData);
  if ("state" in parsed) return parsed.state;

  const { userId } = await requireUser();
  const supabase = await createClient();
  if (parsed.values.is_default_for_new_opportunities) {
    await supabase.from("experiments").update({ is_default_for_new_opportunities: false }).eq("user_id", userId).neq("id", experimentId);
  }
  const { data, error } = await supabase
    .from("experiments")
    .update(parsed.values)
    .eq("id", experimentId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    console.error("Unable to update experiment", { code: error?.code });
    return { message: "No pudimos actualizar el experimento." };
  }

  refreshExperimentPaths(experimentId);
  redirect(`/experiments/${experimentId}?updated=1`);
}

export async function createVariantAction(
  experimentId: string,
  _previousState: VariantFormState,
  formData: FormData,
): Promise<VariantFormState> {
  const parsed = parseVariantForm(formData);
  if ("state" in parsed) return parsed.state;

  const { userId } = await requireUser();
  const supabase = await createClient();
  const { data: experiment } = await supabase
    .from("experiments")
    .select("id")
    .eq("id", experimentId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!experiment) return { message: "El experimento ya no está disponible." };

  const { error } = await supabase
    .from("experiment_variants")
    .insert({ ...parsed.values, experiment_id: experimentId, user_id: userId });

  if (error?.code === "23505") {
    return { message: "Revisa los campos indicados.", errors: { code: "Este código ya existe en el experimento." } };
  }
  if (error) {
    console.error("Unable to create experiment variant", { code: error.code });
    return { message: "No pudimos guardar la variante. Intenta nuevamente." };
  }

  refreshExperimentPaths(experimentId);
  redirect(`/experiments/${experimentId}?variant_created=1`);
}

export async function updateVariantAction(
  experimentId: string,
  variantId: string,
  _previousState: VariantFormState,
  formData: FormData,
): Promise<VariantFormState> {
  const parsed = parseVariantForm(formData);
  if ("state" in parsed) return parsed.state;

  const { userId } = await requireUser();
  const supabase = await createClient();
  const [{ data: current }, { count: contactedCount }] = await Promise.all([
    supabase.from("experiment_variants").select("*").eq("id", variantId).eq("experiment_id", experimentId).eq("user_id", userId).maybeSingle(),
    supabase.from("opportunities").select("id", { count: "exact", head: true }).eq("experiment_variant_id", variantId).eq("user_id", userId).not("first_contacted_at", "is", null),
  ]);
  if (!current) return { message: "La variante ya no está disponible." };
  if ((contactedCount ?? 0) > 0) {
    const semanticChanged = current.code !== parsed.values.code
      || current.name !== parsed.values.name
      || (current.description ?? null) !== parsed.values.description
      || (current.ai_instructions ?? null) !== parsed.values.ai_instructions;
    if (semanticChanged) return { message: "La estrategia de una variante contactada no puede modificarse. Solo puedes cambiar su estado activo." };
  }
  const { data, error } = await supabase
    .from("experiment_variants")
    .update(parsed.values)
    .eq("id", variantId)
    .eq("experiment_id", experimentId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error?.code === "23505") {
    return { message: "Revisa los campos indicados.", errors: { code: "Este código ya existe en el experimento." } };
  }
  if (error || !data) {
    console.error("Unable to update experiment variant", { code: error?.code });
    return { message: "No pudimos actualizar la variante." };
  }

  refreshExperimentPaths(experimentId);
  redirect(`/experiments/${experimentId}?variant_updated=1`);
}

export async function deleteExperimentAction(
  experimentId: string,
  _previousState: DeleteExperimentState,
  _formData: FormData,
): Promise<DeleteExperimentState> {
  void _previousState;
  void _formData;
  const { userId } = await requireUser();
  const supabase = await createClient();
  const { count, error: countError } = await supabase
    .from("opportunities")
    .select("id", { count: "exact", head: true })
    .eq("experiment_id", experimentId)
    .eq("user_id", userId);

  if (countError) {
    console.error("Unable to validate experiment deletion", { code: countError.code });
    return { message: "No pudimos comprobar las oportunidades asociadas." };
  }
  if ((count ?? 0) > 0) {
    return { message: "No puedes eliminar un experimento con oportunidades asociadas." };
  }

  const { data, error } = await supabase
    .from("experiments")
    .delete()
    .eq("id", experimentId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    console.error("Unable to delete experiment", { code: error?.code });
    return { message: "No pudimos eliminar el experimento." };
  }

  revalidatePath("/experiments");
  revalidatePath("/opportunities");
  redirect("/experiments?deleted=1");
}
