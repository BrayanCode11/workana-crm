import type { FollowUpGroups, FollowUpOpportunity, FollowUpPeriod } from "./types";

export const followUpPeriodLabels: Record<FollowUpPeriod, string> = {
  overdue: "Vencidos",
  today: "Hoy",
  upcoming: "Próximos",
};

export function isFollowUpPeriod(value: string): value is FollowUpPeriod {
  return value === "overdue" || value === "today" || value === "upcoming";
}

export function bogotaDateKey(value: Date | string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Bogota",
  }).formatToParts(typeof value === "string" ? new Date(value) : value);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function groupFollowUps(opportunities: FollowUpOpportunity[], now = new Date()): FollowUpGroups {
  const today = bogotaDateKey(now);
  const groups: FollowUpGroups = { overdue: [], today: [], upcoming: [] };

  opportunities.forEach((opportunity) => {
    if (!opportunity.next_follow_up_at) return;
    const date = bogotaDateKey(opportunity.next_follow_up_at);
    if (date < today) groups.overdue.push(opportunity);
    else if (date === today) groups.today.push(opportunity);
    else groups.upcoming.push(opportunity);
  });

  return groups;
}

export function defaultFollowUpPeriod(groups: FollowUpGroups): FollowUpPeriod {
  if (groups.overdue.length > 0) return "overdue";
  if (groups.today.length > 0) return "today";
  return "upcoming";
}

export function formatElapsed(value: string | null, now = new Date()) {
  if (!value) return "Sin contacto registrado";
  const elapsedMs = Math.max(0, now.getTime() - new Date(value).getTime());
  const minutes = Math.floor(elapsedMs / 60_000);
  if (minutes < 1) return "Hace menos de 1 min";
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} ${days === 1 ? "día" : "días"}`;
}

export function followUpUrl(period: FollowUpPeriod, query: string, feedback?: string) {
  const params = new URLSearchParams();
  params.set("period", period);
  if (query.trim()) params.set("q", query.trim());
  if (feedback) params.set(feedback, "1");
  return `/follow-ups?${params.toString()}`;
}

