"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { FollowUpFormState, FollowUpPeriod } from "./types";
import { followUpUrl, isFollowUpPeriod } from "./utils";

const dateTimeSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Selecciona una fecha y hora válidas.")
  .refine(isValidBogotaDateTime, "Selecciona una fecha y hora válidas.")
  .refine((value) => {
    const date = new Date(`${value}:00-05:00`);
    return !Number.isNaN(date.getTime()) && date.getTime() > Date.now();
  }, "El próximo seguimiento debe quedar en el futuro.");

const lostSchema = z.object({
  lost_reason_id: z.string().regex(/^\d+$/, "Selecciona un motivo."),
  lost_reason_notes: z.string().trim().max(2000, "Utiliza como máximo 2.000 caracteres."),
});

function isValidBogotaDateTime(value: string) {
  const [datePart, timePart] = value.split("T");
  if (!datePart || !timePart) return false;
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
    && hour >= 0
    && hour <= 23
    && minute >= 0
    && minute <= 59;
}

function safeContext(period: string, query: string) {
  return {
    period: (isFollowUpPeriod(period) ? period : "today") as FollowUpPeriod,
    query: query.trim().slice(0, 200),
  };
}

function refreshFollowUpPaths(opportunityId: string, clientId: string | null) {
  revalidatePath("/follow-ups");
  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${opportunityId}`);
  if (clientId) revalidatePath(`/clients/${clientId}`);
}

export async function registerFollowUpAction(
  opportunityId: string,
  period: string,
  query: string,
) {
  const context = safeContext(period, query);
  const { userId } = await requireUser();
  const supabase = await createClient();
  const { data: current, error: currentError } = await supabase
    .from("opportunities")
    .select("id, client_id, stage")
    .eq("id", opportunityId)
    .eq("user_id", userId)
    .maybeSingle();

  const nextStage = current?.stage === "contacted"
    ? "follow_up_1"
    : current?.stage === "follow_up_1"
      ? "follow_up_2"
      : null;

  if (currentError || !current || !nextStage) {
    console.error("Unable to validate follow-up registration", { code: currentError?.code });
    redirect(followUpUrl(context.period, context.query, "action_error"));
  }

  const { data, error } = await supabase
    .from("opportunities")
    .update({ stage: nextStage })
    .eq("id", opportunityId)
    .eq("user_id", userId)
    .eq("stage", current.stage)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    console.error("Unable to register follow-up", { code: error?.code });
    redirect(followUpUrl(context.period, context.query, "action_error"));
  }

  refreshFollowUpPaths(opportunityId, current.client_id);
  redirect(followUpUrl(context.period, context.query, nextStage));
}

export async function markRespondedAction(
  opportunityId: string,
  period: string,
  query: string,
) {
  const context = safeContext(period, query);
  const { userId } = await requireUser();
  const supabase = await createClient();
  const { data: current, error: currentError } = await supabase
    .from("opportunities")
    .select("id, client_id, stage")
    .eq("id", opportunityId)
    .eq("user_id", userId)
    .maybeSingle();

  if (currentError || !current || !["contacted", "follow_up_1", "follow_up_2"].includes(current.stage)) {
    console.error("Unable to validate response registration", { code: currentError?.code });
    redirect(followUpUrl(context.period, context.query, "action_error"));
  }

  const { data, error } = await supabase
    .from("opportunities")
    .update({ stage: "responded", next_follow_up_at: null })
    .eq("id", opportunityId)
    .eq("user_id", userId)
    .eq("stage", current.stage)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    console.error("Unable to mark opportunity as responded", { code: error?.code });
    redirect(followUpUrl(context.period, context.query, "action_error"));
  }

  refreshFollowUpPaths(opportunityId, current.client_id);
  redirect(followUpUrl(context.period, context.query, "responded"));
}

export async function rescheduleFollowUpAction(
  opportunityId: string,
  period: string,
  query: string,
  _previousState: FollowUpFormState,
  formData: FormData,
): Promise<FollowUpFormState> {
  const context = safeContext(period, query);
  const { userId } = await requireUser();
  const parsed = dateTimeSchema.safeParse(String(formData.get("next_follow_up_at") ?? ""));
  if (!parsed.success) {
    return { message: "Revisa la nueva fecha.", errors: { next_follow_up_at: parsed.error.issues[0]?.message } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("opportunities")
    .update({ next_follow_up_at: new Date(`${parsed.data}:00-05:00`).toISOString() })
    .eq("id", opportunityId)
    .eq("user_id", userId)
    .not("stage", "in", "(won,lost)")
    .select("id, client_id")
    .maybeSingle();

  if (error || !data) {
    console.error("Unable to reschedule follow-up", { code: error?.code });
    return { message: "No pudimos reprogramar el seguimiento." };
  }

  refreshFollowUpPaths(opportunityId, data.client_id);
  redirect(followUpUrl(context.period, context.query, "rescheduled"));
}

export async function markLostFromFollowUpAction(
  opportunityId: string,
  period: string,
  query: string,
  _previousState: FollowUpFormState,
  formData: FormData,
): Promise<FollowUpFormState> {
  const context = safeContext(period, query);
  const { userId } = await requireUser();
  const parsed = lostSchema.safeParse({
    lost_reason_id: String(formData.get("lost_reason_id") ?? ""),
    lost_reason_notes: String(formData.get("lost_reason_notes") ?? ""),
  });
  if (!parsed.success) {
    const errors: FollowUpFormState["errors"] = {};
    parsed.error.issues.forEach((issue) => {
      const field = issue.path[0] as "lost_reason_id" | "lost_reason_notes";
      if (!errors[field]) errors[field] = issue.message;
    });
    return { message: "Revisa los datos de cierre.", errors };
  }

  const supabase = await createClient();
  const reasonId = Number(parsed.data.lost_reason_id);
  const { data: reason, error: reasonError } = await supabase
    .from("lost_reasons")
    .select("id, slug")
    .eq("id", reasonId)
    .eq("is_active", true)
    .maybeSingle();

  if (reasonError || !reason) {
    return { message: "El motivo ya no está disponible.", errors: { lost_reason_id: "Selecciona otro motivo." } };
  }
  if (reason.slug === "other" && !parsed.data.lost_reason_notes) {
    return { message: "Revisa los datos de cierre.", errors: { lost_reason_notes: "Describe brevemente el otro motivo." } };
  }

  const { data, error } = await supabase
    .from("opportunities")
    .update({
      stage: "lost",
      lost_reason_id: reasonId,
      lost_reason_notes: parsed.data.lost_reason_notes || null,
    })
    .eq("id", opportunityId)
    .eq("user_id", userId)
    .not("stage", "in", "(won,lost)")
    .select("id, client_id")
    .maybeSingle();

  if (error || !data) {
    console.error("Unable to mark follow-up as lost", { code: error?.code });
    return { message: "No pudimos cerrar la oportunidad como perdida." };
  }

  refreshFollowUpPaths(opportunityId, data.client_id);
  redirect(followUpUrl(context.period, context.query, "lost"));
}
