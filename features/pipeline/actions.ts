"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { currencies, opportunityStages } from "@/features/opportunities/constants";
import { createClient } from "@/lib/supabase/server";
import type { PipelineActionResult, PipelineCloseInput } from "./types";

const activeStageSchema = z.enum(opportunityStages).refine(
  (stage) => stage !== "won" && stage !== "lost",
  "Completa los datos de cierre para esta etapa.",
);
const expectedStageSchema = z.enum(opportunityStages);
const optionalDateSchema = z.union([
  z.literal(""),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Selecciona una fecha válida.").refine(isCalendarDate, "Selecciona una fecha válida."),
]);
const moneySchema = z.string().trim()
  .regex(/^\d+(?:[.,]\d{1,2})?$/, "Escribe un valor positivo con máximo dos decimales.")
  .refine((value) => Number(value.replace(",", ".")) <= 999_999_999_999.99, "El valor es demasiado alto.");

const wonSchema = z.object({
  stage: z.literal("won"),
  final_value: moneySchema,
  final_value_currency: z.enum(currencies, { message: "Selecciona la moneda." }),
  won_at: optionalDateSchema,
});

const lostSchema = z.object({
  stage: z.literal("lost"),
  lost_reason_id: z.string().regex(/^\d+$/, "Selecciona un motivo."),
  lost_reason_notes: z.string().trim().max(2000, "Utiliza como máximo 2.000 caracteres."),
  lost_at: optionalDateSchema,
});

function isCalendarDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

function dateToIso(value: string) {
  return value ? new Date(`${value}T12:00:00-05:00`).toISOString() : null;
}

function refreshPipelinePaths(opportunityId: string, clientId: string | null) {
  revalidatePath("/pipeline");
  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${opportunityId}`);
  revalidatePath("/follow-ups");
  revalidatePath("/dashboard");
  revalidatePath("/clients");
  if (clientId) revalidatePath(`/clients/${clientId}`);
}

export async function movePipelineOpportunityAction(
  opportunityId: string,
  targetStage: string,
  expectedStage: string,
): Promise<PipelineActionResult> {
  const target = activeStageSchema.safeParse(targetStage);
  const expected = expectedStageSchema.safeParse(expectedStage);
  if (!target.success || !expected.success) {
    return { ok: false, message: "La etapa seleccionada no es válida." };
  }

  const { userId } = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("opportunities")
    .update({ stage: target.data })
    .eq("id", opportunityId)
    .eq("user_id", userId)
    .eq("stage", expected.data)
    .select("id, stage, next_follow_up_at, final_value, final_value_currency, lost_reason_id, lost_reason_notes, won_at, lost_at, client_id")
    .maybeSingle();

  if (error || !data) {
    console.error("Unable to move pipeline opportunity", { code: error?.code });
    return { ok: false, message: "No pudimos guardar el cambio. El pipeline fue restaurado." };
  }

  refreshPipelinePaths(opportunityId, data.client_id);
  return { ok: true, opportunity: data };
}

export async function closePipelineOpportunityAction(
  opportunityId: string,
  expectedStage: string,
  input: PipelineCloseInput,
): Promise<PipelineActionResult> {
  const expected = expectedStageSchema.safeParse(expectedStage);
  if (!expected.success) return { ok: false, message: "La etapa anterior no es válida." };

  const schema = input.stage === "won" ? wonSchema : lostSchema;
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      const field = String(issue.path[0] ?? "stage");
      if (!errors[field]) errors[field] = issue.message;
    });
    return { ok: false, message: "Revisa los datos de cierre.", errors };
  }

  const { userId } = await requireUser();
  const supabase = await createClient();
  let update: {
    stage: "won" | "lost";
    final_value?: number;
    final_value_currency?: string;
    won_at?: string | null;
    lost_reason_id?: number;
    lost_reason_notes?: string | null;
    lost_at?: string | null;
  };

  if (parsed.data.stage === "won") {
    update = {
      stage: "won",
      final_value: Number(parsed.data.final_value.replace(",", ".")),
      final_value_currency: parsed.data.final_value_currency,
      won_at: dateToIso(parsed.data.won_at),
    };
  } else {
    const reasonId = Number(parsed.data.lost_reason_id);
    const { data: reason, error: reasonError } = await supabase
      .from("lost_reasons")
      .select("id, slug")
      .eq("id", reasonId)
      .eq("is_active", true)
      .maybeSingle();
    if (reasonError || !reason) {
      return { ok: false, message: "El motivo ya no está disponible.", errors: { lost_reason_id: "Selecciona otro motivo." } };
    }
    if (reason.slug === "other" && !parsed.data.lost_reason_notes) {
      return { ok: false, message: "Revisa los datos de cierre.", errors: { lost_reason_notes: "Describe brevemente el otro motivo." } };
    }
    update = {
      stage: "lost",
      lost_reason_id: reasonId,
      lost_reason_notes: parsed.data.lost_reason_notes || null,
      lost_at: dateToIso(parsed.data.lost_at),
    };
  }

  const { data, error } = await supabase
    .from("opportunities")
    .update(update)
    .eq("id", opportunityId)
    .eq("user_id", userId)
    .eq("stage", expected.data)
    .select("id, stage, next_follow_up_at, final_value, final_value_currency, lost_reason_id, lost_reason_notes, won_at, lost_at, client_id")
    .maybeSingle();

  if (error || !data) {
    console.error("Unable to close pipeline opportunity", { code: error?.code });
    return { ok: false, message: "No pudimos guardar el cierre. El pipeline fue restaurado." };
  }

  refreshPipelinePaths(opportunityId, data.client_id);
  return { ok: true, opportunity: data };
}
