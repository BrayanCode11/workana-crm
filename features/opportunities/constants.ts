export const opportunityStages = [
  "detected",
  "contacted",
  "follow_up_1",
  "follow_up_2",
  "responded",
  "proposal",
  "negotiation",
  "won",
  "lost",
] as const;

export type OpportunityStage = (typeof opportunityStages)[number];

export const stageLabels: Record<OpportunityStage, string> = {
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

export const activeOpportunityStages = opportunityStages.filter(
  (stage) => stage !== "won" && stage !== "lost",
);

export const currencies = ["USD", "COP", "EUR", "MXN", "ARS", "CLP", "BRL"] as const;

export const projectTypes = [
  "Landing page",
  "Sitio corporativo",
  "Ecommerce",
  "Corrección",
  "Mantenimiento",
  "Desarrollo personalizado",
  "Integración",
  "Optimización",
] as const;

