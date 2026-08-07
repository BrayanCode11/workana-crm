import "server-only";

import { cache } from "react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isExperimentStatus } from "./constants";
import type { ExperimentVariantRow, ExperimentWithRelations } from "./types";

const experimentSelect = `
  *,
  experiment_variants (*),
  opportunities (
    id,
    title,
    stage,
    experiment_variant_id,
    first_contacted_at,
    first_response_at,
    proposal_at,
    negotiation_at,
    won_at,
    lost_at,
    final_value,
    final_value_currency
  )
`;

export async function getExperiments(query = "", status = "") {
  const { userId } = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("experiments")
    .select(experimentSelect)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .order("code", { referencedTable: "experiment_variants" });

  if (error) {
    console.error("Unable to load experiments", { code: error.code });
    throw new Error("No pudimos cargar los experimentos.");
  }

  let experiments = data as unknown as ExperimentWithRelations[];
  const normalizedQuery = query.trim().toLocaleLowerCase("es");
  if (normalizedQuery) {
    experiments = experiments.filter((experiment) =>
      [experiment.name, experiment.description]
        .filter(Boolean)
        .some((value) => value?.toLocaleLowerCase("es").includes(normalizedQuery)),
    );
  }
  if (isExperimentStatus(status)) {
    experiments = experiments.filter((experiment) => experiment.status === status);
  }

  return experiments;
}

export const getExperiment = cache(async (id: string) => {
  const { userId } = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("experiments")
    .select(experimentSelect)
    .eq("id", id)
    .eq("user_id", userId)
    .order("code", { referencedTable: "experiment_variants" })
    .maybeSingle();

  if (error) {
    console.error("Unable to load experiment", { code: error.code });
    throw new Error("No pudimos cargar el experimento.");
  }

  return data as unknown as ExperimentWithRelations | null;
});

export async function getExperimentVariant(experimentId: string, variantId: string) {
  const { userId } = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("experiment_variants")
    .select("*")
    .eq("id", variantId)
    .eq("experiment_id", experimentId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Unable to load experiment variant", { code: error.code });
    throw new Error("No pudimos cargar la variante.");
  }

  return data as ExperimentVariantRow | null;
}
