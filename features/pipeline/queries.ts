import "server-only";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { PipelineData, PipelineOpportunity } from "./types";

const pipelineSelect = `
  id,
  client_id,
  title,
  stage,
  planned_price,
  planned_price_currency,
  final_value,
  final_value_currency,
  lost_reason_id,
  lost_reason_notes,
  won_at,
  lost_at,
  next_follow_up_at,
  created_at,
  clients (id, name, company_name),
  experiment_variants (id, code, name)
`;

export async function getPipelineData(): Promise<PipelineData> {
  const { userId } = await requireUser();
  const supabase = await createClient();
  const [opportunitiesResult, lostReasonsResult] = await Promise.all([
    supabase
      .from("opportunities")
      .select(pipelineSelect)
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("lost_reasons")
      .select("id, name, slug")
      .eq("is_active", true)
      .order("id"),
  ]);

  const error = opportunitiesResult.error ?? lostReasonsResult.error;
  if (error) {
    console.error("Unable to load pipeline", { code: error.code });
    throw new Error("No pudimos cargar el pipeline.");
  }

  return {
    opportunities: (opportunitiesResult.data ?? []) as unknown as PipelineOpportunity[],
    lostReasons: lostReasonsResult.data ?? [],
  };
}

