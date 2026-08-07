import { z } from "zod";
import { experimentStatuses } from "./constants";
import type {
  ExperimentFormField,
  ExperimentFormState,
  ExperimentInsert,
  ExperimentVariantInsert,
  VariantFormField,
  VariantFormState,
} from "./types";

const optionalDate = z.union([
  z.literal(""),
  z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Selecciona una fecha válida.")
    .refine(isCalendarDate, "Selecciona una fecha válida."),
]);

const experimentSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio.").max(180, "Utiliza como máximo 180 caracteres."),
  description: z.string().trim().max(5000, "Utiliza como máximo 5.000 caracteres."),
  status: z.enum(experimentStatuses, { message: "Selecciona un estado válido." }),
  started_at: optionalDate,
  ended_at: optionalDate,
}).superRefine((values, context) => {
  if (values.ended_at && !values.started_at) {
    context.addIssue({ code: "custom", path: ["started_at"], message: "Añade la fecha de inicio antes de finalizar el experimento." });
  }
  if (values.started_at && values.ended_at && values.ended_at < values.started_at) {
    context.addIssue({ code: "custom", path: ["ended_at"], message: "La fecha final no puede ser anterior al inicio." });
  }
  if (values.status === "completed" && !values.ended_at) {
    context.addIssue({ code: "custom", path: ["ended_at"], message: "Indica cuándo finalizó el experimento." });
  }
});

const variantSchema = z.object({
  code: z.string().trim().min(1, "El código es obligatorio.").max(20, "Utiliza como máximo 20 caracteres."),
  name: z.string().trim().min(1, "El nombre es obligatorio.").max(160, "Utiliza como máximo 160 caracteres."),
  description: z.string().trim().max(5000, "Utiliza como máximo 5.000 caracteres."),
  is_active: z.boolean(),
});

function isCalendarDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

function errorsFor<T extends string>(error: z.ZodError, fields: readonly T[]) {
  const errors: Partial<Record<T, string>> = {};
  error.issues.forEach((issue) => {
    const field = issue.path[0] as T | undefined;
    if (field && fields.includes(field) && !errors[field]) errors[field] = issue.message;
  });
  return errors;
}

export function parseExperimentForm(formData: FormData):
  | { values: Omit<ExperimentInsert, "user_id"> }
  | { state: ExperimentFormState } {
  const parsed = experimentSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    status: String(formData.get("status") ?? ""),
    started_at: String(formData.get("started_at") ?? ""),
    ended_at: String(formData.get("ended_at") ?? ""),
  });

  if (!parsed.success) {
    const fields: ExperimentFormField[] = ["name", "description", "status", "started_at", "ended_at"];
    return { state: { message: "Revisa los campos indicados.", errors: errorsFor(parsed.error, fields) } };
  }

  return {
    values: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      status: parsed.data.status,
      started_at: parsed.data.started_at || null,
      ended_at: parsed.data.ended_at || null,
    },
  };
}

export function parseVariantForm(formData: FormData):
  | { values: Omit<ExperimentVariantInsert, "user_id" | "experiment_id"> }
  | { state: VariantFormState } {
  const parsed = variantSchema.safeParse({
    code: String(formData.get("code") ?? ""),
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    is_active: formData.get("is_active") === "on",
  });

  if (!parsed.success) {
    const fields: VariantFormField[] = ["code", "name", "description", "is_active"];
    return { state: { message: "Revisa los campos indicados.", errors: errorsFor(parsed.error, fields) } };
  }

  return {
    values: {
      code: parsed.data.code.toLocaleUpperCase("es"),
      name: parsed.data.name,
      description: parsed.data.description || null,
      is_active: parsed.data.is_active,
    },
  };
}
