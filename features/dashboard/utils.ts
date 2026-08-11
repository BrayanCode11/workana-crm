import { bogotaDateKey } from "@/features/follow-ups/utils";
import type { DashboardData, DashboardMetrics, DashboardOpportunity } from "./types";

const waitingStages = new Set(["contacted", "follow_up_1", "follow_up_2"]);

export function getDashboardMetrics(data: DashboardData, now = new Date()): DashboardMetrics {
  const stageCounts = Object.fromEntries(data.pipelineStages.map((stage) => [stage.slug, 0])) as Record<string, number>;
  const wonByCurrency: Record<string, number> = {};
  const opportunitiesByClient = new Map<string, number>();
  const clientsWithActiveOpportunities = new Set<string>();
  const followUps: DashboardMetrics["followUps"] = { overdue: [], today: [], upcoming: [] };
  const today = bogotaDateKey(now);
  let active = 0;
  let waiting = 0;
  let contacted = 0;
  let responded = 0;
  let proposals = 0;
  let negotiations = 0;
  let won = 0;
  let lost = 0;

  data.opportunities.forEach((opportunity) => {
    if (opportunity.stage in stageCounts) {
      stageCounts[opportunity.stage] += 1;
    }

    const isActive = !["no_response", "won", "lost"].includes(opportunity.stage);
    if (isActive) active += 1;
    if (waitingStages.has(opportunity.stage)) waiting += 1;
    if (opportunity.first_contacted_at) contacted += 1;
    if (opportunity.first_response_at) responded += 1;
    if (opportunity.proposal_at) proposals += 1;
    if (opportunity.negotiation_at) negotiations += 1;
    if (opportunity.won_at) won += 1;
    if (opportunity.lost_at) lost += 1;

    if (opportunity.won_at && opportunity.final_value !== null && opportunity.final_value_currency) {
      const currency = opportunity.final_value_currency;
      wonByCurrency[currency] = (wonByCurrency[currency] ?? 0) + opportunity.final_value;
    }

    if (opportunity.client_id) {
      opportunitiesByClient.set(
        opportunity.client_id,
        (opportunitiesByClient.get(opportunity.client_id) ?? 0) + 1,
      );
      if (isActive) clientsWithActiveOpportunities.add(opportunity.client_id);
    }

    if (isActive && opportunity.next_follow_up_at) {
      const followUpDate = bogotaDateKey(opportunity.next_follow_up_at);
      if (followUpDate < today) followUps.overdue.push(opportunity);
      else if (followUpDate === today) followUps.today.push(opportunity);
      else followUps.upcoming.push(opportunity);
    }
  });

  sortFollowUps(followUps.overdue);
  sortFollowUps(followUps.today);
  sortFollowUps(followUps.upcoming);

  return {
    active,
    waiting,
    contacted,
    responded,
    proposals,
    negotiations,
    won,
    lost,
    responseRate: rate(responded, contacted),
    closeRate: rate(won, contacted),
    proposalCloseRate: rate(won, proposals),
    wonByCurrency,
    clients: data.clientIds.length,
    recurrentClients: Array.from(opportunitiesByClient.values()).filter((count) => count > 1).length,
    clientsWithActiveOpportunities: clientsWithActiveOpportunities.size,
    stageCounts,
    followUps,
  };
}

function sortFollowUps(opportunities: DashboardOpportunity[]) {
  opportunities.sort((a, b) =>
    (a.next_follow_up_at ?? "").localeCompare(b.next_follow_up_at ?? ""),
  );
}

function rate(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : null;
}
