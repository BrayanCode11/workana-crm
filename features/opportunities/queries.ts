import "server-only";

import { cache } from "react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { opportunityStages } from "./constants";
import type {
  ExperimentOption,
  OpportunityFilters,
  OpportunityFormOptions,
  OpportunityWithRelations,
} from "./types";

const opportunityListSelect = `
  *,
  clients (id, name, company_name),
  experiments (id, name),
  experiment_variants (id, code, name, ai_instructions),
  lost_reasons (id, name, slug)
`;

const opportunityDetailSelect = `
  ${opportunityListSelect},
  opportunity_notes (id, content, created_at, updated_at),
  opportunity_messages (id, direction, message_type, content, created_at, user_id, opportunity_id),
  ai_generations (id, generation_type, content, structured_data, prompt_version, model, created_at, user_id, opportunity_id)
`;

export async function getOpportunities(filters: OpportunityFilters = {}) {
  const { userId } = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("opportunities")
    .select(opportunityListSelect)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Unable to load opportunities", { code: error.code });
    throw new Error("No pudimos cargar las oportunidades.");
  }

  let opportunities = data as unknown as OpportunityWithRelations[];
  const query = filters.q?.trim().toLocaleLowerCase("es") ?? "";

  if (query) {
    opportunities = opportunities.filter((opportunity) =>
      [opportunity.title, opportunity.clients?.name, opportunity.clients?.company_name]
        .filter(Boolean)
        .some((value) => value?.toLocaleLowerCase("es").includes(query)),
    );
  }
  if (filters.stage && opportunityStages.includes(filters.stage as (typeof opportunityStages)[number])) {
    opportunities = opportunities.filter((opportunity) => opportunity.stage === filters.stage);
  }
  if (filters.client) {
    opportunities = opportunities.filter((opportunity) => opportunity.client_id === filters.client);
  }
  if (filters.experiment) {
    opportunities = opportunities.filter((opportunity) => opportunity.experiment_id === filters.experiment);
  }
  if (filters.status === "active") {
    opportunities = opportunities.filter((opportunity) => !["won", "lost"].includes(opportunity.stage));
  } else if (filters.status === "closed") {
    opportunities = opportunities.filter((opportunity) => ["won", "lost"].includes(opportunity.stage));
  }

  return opportunities;
}

export const getOpportunity = cache(async (id: string) => {
  const { userId } = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("opportunities")
    .select(opportunityDetailSelect)
    .eq("id", id)
    .eq("user_id", userId)
    .order("created_at", { referencedTable: "opportunity_notes", ascending: false })
    .order("created_at", { referencedTable: "opportunity_messages", ascending: true })
    .order("created_at", { referencedTable: "ai_generations", ascending: false })
    .maybeSingle();

  if (error) {
    console.error("Unable to load opportunity", { code: error.code });
    throw new Error("No pudimos cargar la oportunidad.");
  }

  return data as unknown as OpportunityWithRelations | null;
});

export async function getOpportunityFormOptions(): Promise<OpportunityFormOptions> {
  const { userId } = await requireUser();
  const supabase = await createClient();
  const [clientsResult, experimentsResult, lostReasonsResult] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, company_name")
      .eq("user_id", userId)
      .order("name"),
    supabase
      .from("experiments")
      .select("id, name, status, experiment_variants (id, experiment_id, code, name, is_active)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .order("code", { referencedTable: "experiment_variants" }),
    supabase
      .from("lost_reasons")
      .select("id, name, slug")
      .eq("is_active", true)
      .order("id"),
  ]);

  const error = clientsResult.error ?? experimentsResult.error ?? lostReasonsResult.error;
  if (error) {
    console.error("Unable to load opportunity options", { code: error.code });
    throw new Error("No pudimos cargar las opciones del formulario.");
  }

  return {
    clients: clientsResult.data ?? [],
    experiments: (experimentsResult.data ?? []) as ExperimentOption[],
    lostReasons: lostReasonsResult.data ?? [],
  };
}
