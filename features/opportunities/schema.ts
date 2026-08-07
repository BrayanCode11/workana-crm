import { z } from "zod";
import { currencies, opportunityStages } from "./constants";
import type { OpportunityFormField, OpportunityInsert } from "./types";

const optionalText = (maximum: number) => z.string().trim().max(maximum, `Utiliza como máximo ${maximum} caracteres.`);
const optionalUuid = z.union([z.literal(""), z.string().uuid("Selecciona una opción válida.")]);
const optionalDate = z.union([
  z.literal(""),
  z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Selecciona una fecha válida.")
    .refine(isCalendarDate, "Selecciona una fecha válida."),
]);
const optionalDateTime = z.union([
  z.literal(""),
  z.string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Selecciona una fecha y hora válidas.")
    .refine((value) => {
      const [date, time] = value.split("T");
      const [hour, minute] = time.split(":").map(Number);
      return isCalendarDate(date) && hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
    }, "Selecciona una fecha y hora válidas."),
]);
const money = z.string().trim().refine(
  (value) => value === "" || /^\d+(?:[.,]\d{1,2})?$/.test(value),
  "Escribe un valor positivo con máximo dos decimales.",
).refine(
  (value) => value === "" || Number(value.replace(",", ".")) <= 999_999_999_999.99,
  "El valor es demasiado alto.",
);
const currency = z.union([z.literal(""), z.enum(currencies)]);

function isCalendarDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

export const opportunityFormSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio.").max(240, "Utiliza como máximo 240 caracteres."),
  workana_url: optionalText(2000).refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }, "Escribe una URL completa que empiece por http:// o https://."),
  description: optionalText(10_000),
  client_id: optionalUuid,
  new_client_name: optionalText(160),
  new_client_company: optionalText(160),
  published_budget_min: money,
  published_budget_max: money,
  published_budget_currency: currency,
  planned_price: money,
  planned_price_currency: currency,
  project_type: optionalText(160),
  technologies: optionalText(1000),
  stage: z.enum(opportunityStages, { message: "Selecciona una etapa válida." }),
  experiment_id: optionalUuid,
  experiment_variant_id: optionalUuid,
  published_at: optionalDate,
  next_follow_up_at: optionalDateTime,
  final_value: money,
  final_value_currency: currency,
  won_at: optionalDate,
  lost_reason_id: z.union([z.literal(""), z.string().regex(/^\d+$/, "Selecciona un motivo válido.")]),
  lost_reason_notes: optionalText(2000),
  lost_at: optionalDate,
}).superRefine((values, context) => {
  const budgetMin = parseMoney(values.published_budget_min);
  const budgetMax = parseMoney(values.published_budget_max);

  if (values.client_id && values.new_client_name) {
    context.addIssue({ code: "custom", path: ["new_client_name"], message: "Usa el cliente seleccionado o crea uno nuevo, no ambos." });
  }
  if (values.new_client_company && !values.new_client_name) {
    context.addIssue({ code: "custom", path: ["new_client_name"], message: "Escribe el nombre del cliente nuevo." });
  }
  if ((budgetMin !== null || budgetMax !== null) && !values.published_budget_currency) {
    context.addIssue({ code: "custom", path: ["published_budget_currency"], message: "Selecciona la moneda del presupuesto." });
  }
  if (budgetMin === null && budgetMax === null && values.published_budget_currency) {
    context.addIssue({ code: "custom", path: ["published_budget_currency"], message: "Añade un valor al presupuesto o deja la moneda vacía." });
  }
  if (budgetMin !== null && budgetMax !== null && budgetMin > budgetMax) {
    context.addIssue({ code: "custom", path: ["published_budget_max"], message: "El máximo debe ser igual o mayor que el mínimo." });
  }
  validateMoneyPair(values.planned_price, values.planned_price_currency, "planned_price", "planned_price_currency", "precio planeado", context);
  validateMoneyPair(values.final_value, values.final_value_currency, "final_value", "final_value_currency", "valor final", context);

  if (values.experiment_variant_id && !values.experiment_id) {
    context.addIssue({ code: "custom", path: ["experiment_id"], message: "Selecciona el experimento de esta variante." });
  }
  if (values.stage === "won" && !values.final_value) {
    context.addIssue({ code: "custom", path: ["final_value"], message: "El valor final es obligatorio al marcar como ganada." });
  }
  if (values.stage === "lost" && !values.lost_reason_id) {
    context.addIssue({ code: "custom", path: ["lost_reason_id"], message: "Selecciona por qué se perdió la oportunidad." });
  }
});

function validateMoneyPair(
  amount: string,
  selectedCurrency: string,
  amountField: OpportunityFormField,
  currencyField: OpportunityFormField,
  label: string,
  context: z.RefinementCtx,
) {
  if (amount && !selectedCurrency) {
    context.addIssue({ code: "custom", path: [currencyField], message: `Selecciona la moneda del ${label}.` });
  }
  if (!amount && selectedCurrency) {
    context.addIssue({ code: "custom", path: [amountField], message: `Escribe el ${label} o deja la moneda vacía.` });
  }
}

function parseMoney(value: string) {
  return value ? Number(value.replace(",", ".")) : null;
}

function nullable(value: string) {
  return value || null;
}

function dateToIso(value: string) {
  return value ? new Date(`${value}T12:00:00-05:00`).toISOString() : null;
}

function dateTimeToIso(value: string) {
  return value ? new Date(`${value}:00-05:00`).toISOString() : null;
}

const opportunityFormFields: OpportunityFormField[] = [
  "title",
  "workana_url",
  "description",
  "client_id",
  "new_client_name",
  "new_client_company",
  "published_budget_min",
  "published_budget_max",
  "published_budget_currency",
  "planned_price",
  "planned_price_currency",
  "project_type",
  "technologies",
  "stage",
  "experiment_id",
  "experiment_variant_id",
  "published_at",
  "next_follow_up_at",
  "final_value",
  "final_value_currency",
  "won_at",
  "lost_reason_id",
  "lost_reason_notes",
  "lost_at",
];

export function formDataToObject(formData: FormData) {
  const keys = opportunityFormFields;
  return Object.fromEntries(keys.map((key) => [key, String(formData.get(key) ?? "")]));
}

export function toOpportunityInsert(values: z.infer<typeof opportunityFormSchema>): Omit<OpportunityInsert, "user_id"> {
  const technologies = Array.from(new Set(
    values.technologies.split(",").map((item) => item.trim()).filter(Boolean),
  ));

  return {
    title: values.title,
    workana_url: nullable(values.workana_url),
    description: nullable(values.description),
    client_id: nullable(values.client_id),
    published_budget_min: parseMoney(values.published_budget_min),
    published_budget_max: parseMoney(values.published_budget_max),
    published_budget_currency: nullable(values.published_budget_currency),
    planned_price: parseMoney(values.planned_price),
    planned_price_currency: nullable(values.planned_price_currency),
    project_type: nullable(values.project_type),
    technologies,
    stage: values.stage,
    experiment_id: nullable(values.experiment_id),
    experiment_variant_id: nullable(values.experiment_variant_id),
    published_at: dateToIso(values.published_at),
    next_follow_up_at: dateTimeToIso(values.next_follow_up_at),
    final_value: parseMoney(values.final_value),
    final_value_currency: nullable(values.final_value_currency),
    won_at: dateToIso(values.won_at),
    lost_reason_id: values.lost_reason_id ? Number(values.lost_reason_id) : null,
    lost_reason_notes: nullable(values.lost_reason_notes),
    lost_at: dateToIso(values.lost_at),
  };
}

export function getFieldErrors(error: z.ZodError): Partial<Record<OpportunityFormField, string>> {
  const errors: Partial<Record<OpportunityFormField, string>> = {};
  error.issues.forEach((issue) => {
    const field = issue.path[0] as OpportunityFormField | undefined;
    if (field && !errors[field]) errors[field] = issue.message;
  });
  return errors;
}
