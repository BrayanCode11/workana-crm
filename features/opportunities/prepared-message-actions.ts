"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { preparedMessagesFromFormData, type PreparedMessageKey } from "./prepared-messages";

export type PreparedMessagesState = {
  ok?: boolean;
  message?: string;
  errors?: Partial<Record<PreparedMessageKey, string>>;
};

export async function savePreparedMessagesAction(
  opportunityId: string,
  _previousState: PreparedMessagesState,
  formData: FormData,
): Promise<PreparedMessagesState> {
  const parsed = preparedMessagesFromFormData(formData);
  if ("errors" in parsed) return { message: "Revisa los mensajes indicados.", errors: parsed.errors };
  const { userId } = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.from("opportunities")
    .update(parsed.values)
    .eq("id", opportunityId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();
  if (error || !data) return { message: "No pudimos guardar los mensajes. Intenta nuevamente." };
  revalidatePath(`/opportunities/${opportunityId}`);
  return { ok: true, message: "Mensajes guardados." };
}
