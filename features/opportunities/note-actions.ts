"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { NoteFormState } from "./types";

const noteSchema = z.object({
  content: z.string().trim()
    .min(1, "Escribe una nota antes de guardarla.")
    .max(10_000, "Utiliza como máximo 10.000 caracteres."),
});

function validateNote(formData: FormData):
  | { content: string }
  | { state: NoteFormState } {
  const parsed = noteSchema.safeParse({ content: String(formData.get("content") ?? "") });
  if (!parsed.success) {
    return {
      state: {
        message: "Revisa el contenido de la nota.",
        errors: { content: parsed.error.issues[0]?.message ?? "La nota no es válida." },
      },
    };
  }
  return parsed.data;
}

export async function createOpportunityNoteAction(
  opportunityId: string,
  _previousState: NoteFormState,
  formData: FormData,
): Promise<NoteFormState> {
  const { userId } = await requireUser();
  const validation = validateNote(formData);
  if ("state" in validation) return validation.state;

  const supabase = await createClient();
  const { data: opportunity, error: opportunityError } = await supabase
    .from("opportunities")
    .select("id")
    .eq("id", opportunityId)
    .eq("user_id", userId)
    .maybeSingle();

  if (opportunityError || !opportunity) {
    console.error("Unable to validate opportunity for note", { code: opportunityError?.code });
    return { message: "La oportunidad ya no está disponible." };
  }

  const { error } = await supabase.from("opportunity_notes").insert({
    opportunity_id: opportunityId,
    user_id: userId,
    content: validation.content,
  });

  if (error) {
    console.error("Unable to create opportunity note", { code: error.code });
    return { message: "No pudimos guardar la nota. Intenta nuevamente." };
  }

  revalidatePath(`/opportunities/${opportunityId}`);
  redirect(`/opportunities/${opportunityId}?note_created=1#notes`);
}

export async function updateOpportunityNoteAction(
  opportunityId: string,
  noteId: string,
  _previousState: NoteFormState,
  formData: FormData,
): Promise<NoteFormState> {
  const { userId } = await requireUser();
  const validation = validateNote(formData);
  if ("state" in validation) return validation.state;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("opportunity_notes")
    .update({ content: validation.content })
    .eq("id", noteId)
    .eq("opportunity_id", opportunityId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    console.error("Unable to update opportunity note", { code: error?.code });
    return { message: "No pudimos actualizar la nota." };
  }

  revalidatePath(`/opportunities/${opportunityId}`);
  redirect(`/opportunities/${opportunityId}?note_updated=1#notes`);
}

export async function deleteOpportunityNoteAction(opportunityId: string, noteId: string) {
  const { userId } = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("opportunity_notes")
    .delete()
    .eq("id", noteId)
    .eq("opportunity_id", opportunityId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    console.error("Unable to delete opportunity note", { code: error?.code });
    throw new Error("No pudimos eliminar la nota.");
  }

  revalidatePath(`/opportunities/${opportunityId}`);
  redirect(`/opportunities/${opportunityId}?note_deleted=1#notes`);
}

