import { formatCurrency, formatDate } from "@/features/clients/utils";
import { stageLabels, type OpportunityStage } from "./constants";

export { formatCurrency, formatDate, stageLabels };

export function isOpportunityStage(value: string): value is OpportunityStage {
  return Object.hasOwn(stageLabels, value);
}

export function stageLabel(value: string) {
  return isOpportunityStage(value) ? stageLabels[value] : value;
}

export function stageTone(stage: string): "neutral" | "warning" | "success" {
  if (stage === "won") return "success";
  if (stage === "lost") return "warning";
  return "neutral";
}

export function formatMoney(value: number | null, currency: string | null) {
  return value !== null && currency ? formatCurrency(value, currency) : "—";
}

export function formatBudget(min: number | null, max: number | null, currency: string | null) {
  if (!currency || (min === null && max === null)) return "—";
  if (min !== null && max !== null) {
    if (min === max) return formatCurrency(min, currency);
    return `${formatCurrency(min, currency)} – ${formatCurrency(max, currency)}`;
  }
  return min !== null ? `Desde ${formatCurrency(min, currency)}` : `Hasta ${formatCurrency(max!, currency)}`;
}

export function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Bogota",
  }).format(new Date(value));
}

export function dateInputValue(value: string | null) {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Bogota",
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function dateTimeInputValue(value: string | null) {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "America/Bogota",
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

