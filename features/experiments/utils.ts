import type { ExperimentMetrics, ExperimentOpportunity } from "./types";

export function getExperimentMetrics(opportunities: ExperimentOpportunity[]): ExperimentMetrics {
  const wonByCurrency: Record<string, number> = {};
  const wonCountsByCurrency: Record<string, number> = {};
  let contacted = 0;
  let responded = 0;
  let proposals = 0;
  let negotiations = 0;
  let won = 0;
  let lost = 0;

  opportunities.forEach((opportunity) => {
    if (opportunity.first_contacted_at) contacted += 1;
    if (opportunity.first_response_at) responded += 1;
    if (opportunity.proposal_at) proposals += 1;
    if (opportunity.negotiation_at) negotiations += 1;
    if (opportunity.won_at) won += 1;
    if (opportunity.lost_at) lost += 1;

    if (opportunity.won_at && opportunity.final_value !== null && opportunity.final_value_currency) {
      const currency = opportunity.final_value_currency;
      wonByCurrency[currency] = (wonByCurrency[currency] ?? 0) + opportunity.final_value;
      wonCountsByCurrency[currency] = (wonCountsByCurrency[currency] ?? 0) + 1;
    }
  });

  const averageWonByCurrency = Object.fromEntries(
    Object.entries(wonByCurrency).map(([currency, total]) => [currency, total / wonCountsByCurrency[currency]]),
  );

  return {
    assigned: opportunities.length,
    contacted,
    responded,
    responseRate: rate(responded, contacted),
    proposals,
    proposalRate: rate(proposals, contacted),
    negotiations,
    won,
    lost,
    closeRate: rate(won, contacted),
    proposalCloseRate: rate(won, proposals),
    wonByCurrency,
    averageWonByCurrency,
  };
}

export function getVariantMetrics(opportunities: ExperimentOpportunity[], variantId: string) {
  return getExperimentMetrics(
    opportunities.filter((opportunity) => opportunity.experiment_variant_id === variantId),
  );
}

export function formatRate(value: number | null) {
  if (value === null) return "—";
  return new Intl.NumberFormat("es-CO", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatExperimentDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" })
    .format(new Date(`${value}T12:00:00-05:00`));
}

export function formatExperimentPeriod(startedAt: string | null, endedAt: string | null) {
  if (!startedAt && !endedAt) return "Sin fechas";
  return `${formatExperimentDate(startedAt)} – ${endedAt ? formatExperimentDate(endedAt) : "En curso"}`;
}

function rate(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : null;
}
