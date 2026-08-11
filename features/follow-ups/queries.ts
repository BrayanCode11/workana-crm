import "server-only";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { FollowUpData, FollowUpOpportunity } from "./types";
import { groupFollowUps } from "./utils";

const followUpSelect = `
  id,
  title,
  stage,
  last_contact_at,
  next_follow_up_at
`;

export async function getFollowUpData(search = ""): Promise<FollowUpData> {
  const { userId } = await requireUser();
  const supabase = await createClient();
  const [opportunitiesResult, lostReasonsResult] = await Promise.all([
    supabase
      .from("opportunities")
      .select(followUpSelect)
      .eq("user_id", userId)
      .not("next_follow_up_at", "is", null)
      .order("next_follow_up_at", { ascending: true }),
    supabase
      .from("lost_reasons")
      .select("id, name, slug")
      .eq("is_active", true)
      .order("id"),
  ]);

  const error = opportunitiesResult.error ?? lostReasonsResult.error;
  if (error) {
    console.error("Unable to load follow-ups", { code: error.code });
    throw new Error("No pudimos cargar los seguimientos.");
  }

  let opportunities = (opportunitiesResult.data ?? []) as unknown as FollowUpOpportunity[];
  opportunities = opportunities.filter((opportunity) => !["no_response", "won", "lost"].includes(opportunity.stage));

  const normalizedSearch = search.trim().toLocaleLowerCase("es");
  if (normalizedSearch) {
    opportunities = opportunities.filter((opportunity) =>
      opportunity.title.toLocaleLowerCase("es").includes(normalizedSearch),
    );
  }

  return {
    groups: groupFollowUps(opportunities),
    lostReasons: lostReasonsResult.data ?? [],
  };
}
