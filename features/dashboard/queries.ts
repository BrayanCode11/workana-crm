import "server-only";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { DashboardData, DashboardOpportunity } from "./types";

const dashboardOpportunitySelect = `
  id,
  title,
  client_id,
  stage,
  first_contacted_at,
  first_response_at,
  proposal_at,
  negotiation_at,
  won_at,
  lost_at,
  next_follow_up_at,
  final_value,
  final_value_currency,
  clients (id, name)
`;

export async function getDashboardData(): Promise<DashboardData> {
  const { userId } = await requireUser();
  const supabase = await createClient();
  const [opportunitiesResult, clientsResult] = await Promise.all([
    supabase
      .from("opportunities")
      .select(dashboardOpportunitySelect)
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("clients")
      .select("id")
      .eq("user_id", userId),
  ]);

  const error = opportunitiesResult.error ?? clientsResult.error;
  if (error) {
    console.error("Unable to load dashboard", { code: error.code });
    throw new Error("No pudimos cargar el dashboard.");
  }

  return {
    opportunities: (opportunitiesResult.data ?? []) as unknown as DashboardOpportunity[],
    clientIds: (clientsResult.data ?? []).map((client) => client.id),
  };
}
