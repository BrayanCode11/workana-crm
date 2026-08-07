import type { ClientMetrics, ClientOpportunity } from "./types";

export const stageLabels: Record<string, string> = {
  detected: "Detectado",
  contacted: "Contactado",
  follow_up_1: "Seguimiento 1",
  follow_up_2: "Seguimiento 2",
  responded: "Respondió",
  proposal: "Propuesta",
  negotiation: "Negociación",
  won: "Ganado",
  lost: "Perdido",
};

export function getClientMetrics(opportunities: ClientOpportunity[]): ClientMetrics {
  const wonByCurrency: Record<string, number> = {};
  let active = 0;
  let won = 0;
  let lost = 0;
  let lastOpportunityAt: string | null = null;

  opportunities.forEach((opportunity) => {
    if (opportunity.stage !== "won" && opportunity.stage !== "lost") active += 1;
    if (opportunity.won_at) won += 1;
    if (opportunity.lost_at) lost += 1;

    if (
      opportunity.won_at
      && opportunity.final_value !== null
      && opportunity.final_value_currency
    ) {
      wonByCurrency[opportunity.final_value_currency] =
        (wonByCurrency[opportunity.final_value_currency] ?? 0) + opportunity.final_value;
    }

    if (!lastOpportunityAt || opportunity.created_at > lastOpportunityAt) {
      lastOpportunityAt = opportunity.created_at;
    }
  });

  return {
    total: opportunities.length,
    active,
    won,
    lost,
    wonByCurrency,
    lastOpportunityAt,
  };
}

export function formatDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeZone: "America/Bogota",
  }).format(new Date(value));
}

export function formatCurrency(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString("es-CO")}`;
  }
}

export function formatCurrencyGroups(values: Record<string, number>) {
  const entries = Object.entries(values).sort(([currencyA], [currencyB]) =>
    currencyA.localeCompare(currencyB),
  );

  if (entries.length === 0) return "—";

  return entries
    .map(([currency, value]) => formatCurrency(value, currency))
    .join(" · ");
}
