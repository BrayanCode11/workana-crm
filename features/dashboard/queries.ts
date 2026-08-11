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
  follow_up_1_message,
  follow_up_2_at,
  follow_up_2_message,
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
  const [opportunitiesResult, clientsResult, messagesResult, stagesResult] = await Promise.all([
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
    supabase.from("pipeline_stages").select("slug, name").eq("user_id", userId).order("position").order("created_at"),
  ]);

  const error = opportunitiesResult.error ?? clientsResult.error ?? messagesResult.error ?? stagesResult.error;
  if (error) {
    console.error("Unable to load dashboard", { code: error.code });
    throw new Error("No pudimos cargar el dashboard.");
  }

  const opportunities = (opportunitiesResult.data ?? []) as unknown as DashboardOpportunity[];
  const now = Date.now();
  const latestDirection = new Map<string, string>();
  (messagesResult.data ?? []).forEach((message) => latestDirection.set(message.opportunity_id, message.direction));
  const active = opportunities.filter((item) => !["no_response", "won", "lost"].includes(item.stage));
  const followUp1Pending = active.filter((item) => item.first_contacted_at && !item.follow_up_1_at && item.next_follow_up_at && new Date(item.next_follow_up_at).getTime() <= now);
  const followUp2Pending = active.filter((item) => item.follow_up_1_at && !item.follow_up_2_at && item.next_follow_up_at && new Date(item.next_follow_up_at).getTime() <= now);

  return {
    opportunities,
    clientIds: (clientsResult.data ?? []).map((client) => client.id),
    pipelineStages: stagesResult.data ?? [],
    attention: {
      consultationPending: active.filter((item) => !item.first_contacted_at).length,
      followUp1Pending: followUp1Pending.length,
      followUp1Prepared: followUp1Pending.filter((item) => Boolean(item.follow_up_1_message?.trim())).length,
      followUp2Pending: followUp2Pending.length,
      followUp2Prepared: followUp2Pending.filter((item) => Boolean(item.follow_up_2_message?.trim())).length,
      repliesPending: active.filter((item) => item.stage === "responded" && latestDirection.get(item.id) === "inbound").length,
    },
  };
}
