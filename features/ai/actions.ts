"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import type { AiOpportunityContext } from "./prompts";
import { createOpenAiProvider, AiConfigurationError } from "./provider";
import { generateProjectAnalysis, generateProposal, generateReplyAnalysis } from "./service";

export type AiActionState = { ok?: boolean; saved?: boolean; message?: string };

type GenerationKind = "project_analysis" | "reply_analysis" | "proposal";

async function loadContext(opportunityId: string, userId: string): Promise<AiOpportunityContext | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("opportunities").select(`
    *,
    opportunity_notes (content, created_at),
    opportunity_messages (direction, message_type, content, created_at),
    experiments (name, description),
    experiment_variants (code, name, description, ai_instructions)
  `).eq("id", opportunityId).eq("user_id", userId)
    .order("created_at", { referencedTable: "opportunity_notes", ascending: true })
    .order("created_at", { referencedTable: "opportunity_messages", ascending: true })
    .maybeSingle();
  if (error || !data) return null;
  const row = data as unknown as Record<string, unknown> & {
    opportunity_notes: AiOpportunityContext["notes"];
    opportunity_messages: AiOpportunityContext["messages"];
    experiments: AiOpportunityContext["experiment"];
    experiment_variants: AiOpportunityContext["variant"];
  };
  const { opportunity_notes, opportunity_messages, experiments, experiment_variants, ...opportunity } = row;
  return { opportunity, notes: opportunity_notes ?? [], messages: opportunity_messages ?? [], experiment: experiments, variant: experiment_variants };
}

async function generate(opportunityId: string, kind: GenerationKind): Promise<AiActionState> {
  const { userId } = await requireUser();
  const context = await loadContext(opportunityId, userId);
  if (!context) return { message: "La oportunidad ya no está disponible." };
  try {
    const provider = createOpenAiProvider();
    let result: unknown;
    let content: string;
    if (kind === "project_analysis") {
      const value = await generateProjectAnalysis(provider, context);
      result = value; content = value.initial_message;
    } else if (kind === "reply_analysis") {
      const value = await generateReplyAnalysis(provider, context);
      result = value; content = value.suggested_reply;
    } else {
      const value = await generateProposal(provider, context);
      result = value; content = value.workana_proposal;
    }
    const supabase = await createClient();
    const { error } = await supabase.from("ai_generations").insert({
      user_id: userId, opportunity_id: opportunityId, generation_type: kind, content,
      structured_data: result as unknown as Json, prompt_version: "crm-assistant-v1", model: provider.model,
    });
    if (error) return { message: "La IA respondió, pero no pudimos guardar el resultado. Intenta nuevamente." };
    revalidatePath(`/opportunities/${opportunityId}`); revalidatePath("/dashboard");
    return { ok: true, message: "Contenido generado. Revísalo antes de usarlo." };
  } catch (error) {
    if (error instanceof AiConfigurationError) return { message: "El asistente aún no está configurado. Añade OPENAI_API_KEY en el servidor." };
    console.error("AI generation failed", { kind, error: error instanceof Error ? error.message : "unknown" });
    return { message: error instanceof Error ? error.message : "No pudimos generar el contenido con IA." };
  }
}

export async function generateProjectAnalysisAction(opportunityId: string) { return generate(opportunityId, "project_analysis"); }
export async function generateProposalAction(opportunityId: string) { return generate(opportunityId, "proposal"); }

export async function registerInboundAndAnalyzeAction(opportunityId: string, content: string): Promise<AiActionState> {
  const message = content.trim();
  if (!message) return { message: "Pega la respuesta del cliente." };
  if (message.length > 20000) return { message: "La respuesta es demasiado larga." };
  const { userId } = await requireUser();
  const supabase = await createClient();
  const { data: opportunity } = await supabase.from("opportunities").select("id, stage, first_response_at").eq("id", opportunityId).eq("user_id", userId).maybeSingle();
  if (!opportunity) return { message: "La oportunidad ya no está disponible." };
  if (["won", "lost"].includes(opportunity.stage)) return { message: "No puedes registrar respuestas en una oportunidad cerrada." };
  const now = new Date().toISOString();
  const { data: savedMessage, error } = await supabase.from("opportunity_messages").insert({ user_id: userId, opportunity_id: opportunityId, direction: "inbound", message_type: "reply", content: message }).select("id").single();
  if (error || !savedMessage) return { message: "No pudimos guardar la respuesta." };
  const { error: stageError } = await supabase.from("opportunities").update({ stage: "responded", first_response_at: opportunity.first_response_at ?? now, next_follow_up_at: null }).eq("id", opportunityId).eq("user_id", userId);
  if (stageError) {
    await supabase.from("opportunity_messages").delete().eq("id", savedMessage.id).eq("user_id", userId);
    return { message: "No pudimos actualizar el estado de la oportunidad." };
  }
  revalidatePath(`/opportunities/${opportunityId}`); revalidatePath("/dashboard");
  const analysis = await generate(opportunityId, "reply_analysis");
  return analysis.ok ? { ...analysis, saved: true } : { saved: true, message: `La respuesta quedó guardada. ${analysis.message}` };
}
