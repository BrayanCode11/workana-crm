export const experimentStatuses = ["active", "paused", "completed"] as const;

export type ExperimentStatus = (typeof experimentStatuses)[number];

export const experimentStatusLabels: Record<ExperimentStatus, string> = {
  active: "Activo",
  paused: "Pausado",
  completed: "Finalizado",
};

export function isExperimentStatus(value: string): value is ExperimentStatus {
  return experimentStatuses.includes(value as ExperimentStatus);
}

export function experimentStatusTone(status: string): "neutral" | "warning" | "success" {
  if (status === "active") return "success";
  if (status === "paused") return "warning";
  return "neutral";
}
