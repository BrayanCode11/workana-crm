"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { parseExperimentForm, parseVariantForm } from "./schema";
import type { ExperimentFormState, VariantFormState } from "./types";

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
