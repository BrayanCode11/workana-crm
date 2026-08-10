"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { commercialUpdate, type CommercialAction } from "./cadence";

export type CommercialActionState = { ok?: boolean; message?: string };

const messageTypes: Record<CommercialAction, string> = {
  initial_sent: "initial", follow_up_1_sent: "follow_up_1", follow_up_2_sent: "follow_up_2", outbound_reply_sent: "reply", proposal_sent: "proposal",
};

export async function registerCommercialAction(
  opportunityId: string,
  action: CommercialAction,
  content: string,
): Promise<CommercialActionState> {
  if (!Object.prototype.hasOwnProperty.call(messageTypes, action)) return { message: "La acción comercial no es válida." };
  const message = content.trim();
  if (!message) return { message: "Revisa o escribe el mensaje antes de registrarlo como enviado." };
  if (message.length > 20000) return { message: "El mensaje es demasiado largo." };
  const { userId } = await requireUser();
  const supabase = await createClient();
  const { data: opportunity } = await supabase.from("opportunities").select("id, first_contacted_at, follow_up_1_at, follow_up_2_at, stage").eq("id", opportunityId).eq("user_id", userId).maybeSingle();
  if (!opportunity) return { message: "La oportunidad ya no está disponible." };
  if (["won", "lost"].includes(opportunity.stage)) return { message: "No puedes registrar envíos en una oportunidad cerrada." };
  if (action === "initial_sent" && opportunity.first_contacted_at) return { message: "La consulta inicial ya fue registrada." };
  if (action === "follow_up_1_sent" && (!opportunity.first_contacted_at || opportunity.follow_up_1_at)) return { message: "F1 no corresponde al estado actual de la cadencia." };
  if (action === "follow_up_2_sent" && (!opportunity.follow_up_1_at || opportunity.follow_up_2_at)) return { message: "F2 no corresponde al estado actual de la cadencia." };
  const update = commercialUpdate(action, opportunity.first_contacted_at, new Date());
  const { data: savedMessage, error: messageError } = await supabase.from("opportunity_messages").insert({ user_id: userId, opportunity_id: opportunityId, direction: "outbound", message_type: messageTypes[action], content: message }).select("id").single();
  if (messageError || !savedMessage) return { message: "No pudimos guardar el mensaje enviado." };
  const { error } = await supabase.from("opportunities").update(update).eq("id", opportunityId).eq("user_id", userId);
  if (error) {
    await supabase.from("opportunity_messages").delete().eq("id", savedMessage.id).eq("user_id", userId);
    return { message: "No pudimos actualizar la etapa; no se registró el envío. Intenta nuevamente." };
  }
  revalidatePath(`/opportunities/${opportunityId}`); revalidatePath("/dashboard"); revalidatePath("/follow-ups"); revalidatePath("/pipeline");
  return { ok: true, message: "Acción registrada correctamente." };
}
