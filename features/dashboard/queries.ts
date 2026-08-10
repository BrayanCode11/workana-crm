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
  follow_up_1_at,
  follow_up_2_at,
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
  const [opportunitiesResult, clientsResult, messagesResult, generationsResult] = await Promise.all([
    supabase
      .from("opportunities")
      .select(dashboardOpportunitySelect)
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("clients")
      .select("id")
      .eq("user_id", userId),
    supabase.from("opportunity_messages").select("opportunity_id, direction, created_at").eq("user_id", userId).order("created_at"),
    supabase.from("ai_generations").select("opportunity_id, generation_type, structured_data, created_at").eq("user_id", userId).order("created_at", { ascending: false }),
  ]);

  const error = opportunitiesResult.error ?? clientsResult.error ?? messagesResult.error ?? generationsResult.error;
  if (error) {
    console.error("Unable to load dashboard", { code: error.code });
    throw new Error("No pudimos cargar el dashboard.");
  }

  const opportunities = (opportunitiesResult.data ?? []) as unknown as DashboardOpportunity[];
  const now = Date.now();
  const latestDirection = new Map<string, string>();
  (messagesResult.data ?? []).forEach((message) => latestDirection.set(message.opportunity_id, message.direction));
  const ready = new Set<string>();
  const seenGeneration = new Set<string>();
  (generationsResult.data ?? []).forEach((generation) => {
    if (seenGeneration.has(generation.opportunity_id) || !["project_analysis", "reply_analysis"].includes(generation.generation_type)) return;
    seenGeneration.add(generation.opportunity_id);
    const value = generation.structured_data as { proposal_readiness?: { status?: string } };
    if (["yes", "partial"].includes(value.proposal_readiness?.status ?? "")) ready.add(generation.opportunity_id);
  });
  const active = opportunities.filter((item) => !["won", "lost"].includes(item.stage));

  return {
    opportunities,
    clientIds: (clientsResult.data ?? []).map((client) => client.id),
    attention: {
      consultationPending: active.filter((item) => !item.first_contacted_at).length,
      followUp1Pending: active.filter((item) => item.first_contacted_at && !item.follow_up_1_at && item.next_follow_up_at && new Date(item.next_follow_up_at).getTime() <= now).length,
      followUp2Pending: active.filter((item) => item.follow_up_1_at && !item.follow_up_2_at && item.next_follow_up_at && new Date(item.next_follow_up_at).getTime() <= now).length,
      repliesPending: active.filter((item) => latestDirection.get(item.id) === "inbound").length,
      proposalReady: active.filter((item) => ready.has(item.id) && !item.proposal_at).length,
    },
  };
}
