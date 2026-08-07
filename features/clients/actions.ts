"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type {
  ClientFormField,
  ClientFormState,
  ClientFormValues,
} from "./types";

const emptyToNull = (value: FormDataEntryValue | null) => {
  const normalized = String(value ?? "").trim();
  return normalized || null;
};

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function validateClient(formData: FormData): {
  values?: ClientFormValues;
  errors?: Partial<Record<ClientFormField, string>>;
} {
  const name = String(formData.get("name") ?? "").trim();
  const companyName = emptyToNull(formData.get("company_name"));
  const country = emptyToNull(formData.get("country"));
  const workanaProfileUrl = emptyToNull(formData.get("workana_profile_url"));
  const notes = emptyToNull(formData.get("notes"));
  const errors: Partial<Record<ClientFormField, string>> = {};

  if (!name) errors.name = "El nombre es obligatorio.";
  else if (name.length > 160) errors.name = "Utiliza como máximo 160 caracteres.";

  if (companyName && companyName.length > 160) {
    errors.company_name = "Utiliza como máximo 160 caracteres.";
  }

  if (workanaProfileUrl && !isValidHttpUrl(workanaProfileUrl)) {
    errors.workana_profile_url = "Escribe una URL completa que empiece por http:// o https://.";
  }

  if (Object.keys(errors).length > 0) return { errors };

  return {
    values: {
      name,
      company_name: companyName,
      country,
      workana_profile_url: workanaProfileUrl,
      notes,
    },
  };
}

export async function createClientAction(
  _previousState: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const validation = validateClient(formData);
  if (!validation.values) {
    return { errors: validation.errors, message: "Revisa los campos indicados." };
  }

  const { userId } = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .insert({ ...validation.values, user_id: userId })
    .select("id")
    .single();

  if (error) {
    console.error("Unable to create client", { code: error.code });
    return { message: "No pudimos guardar el cliente. Intenta nuevamente." };
  }

  revalidatePath("/clients");
  redirect(`/clients/${data.id}?created=1`);
}

export async function updateClientAction(
  clientId: string,
  _previousState: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const validation = validateClient(formData);
  if (!validation.values) {
    return { errors: validation.errors, message: "Revisa los campos indicados." };
  }

  const { userId } = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .update(validation.values)
    .eq("id", clientId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    console.error("Unable to update client", { code: error?.code });
    return { message: "No pudimos actualizar el cliente." };
  }

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  redirect(`/clients/${clientId}?updated=1`);
}

export async function deleteClientAction(clientId: string) {
  const { userId } = await requireUser();
  const supabase = await createClient();
  const { count, error: countError } = await supabase
    .from("opportunities")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientId)
    .eq("user_id", userId);

  if (countError) {
    console.error("Unable to validate client deletion", { code: countError.code });
    throw new Error("No pudimos comprobar las oportunidades del cliente.");
  }

  if ((count ?? 0) > 0) {
    throw new Error("No puedes eliminar un cliente con oportunidades asociadas.");
  }

  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", clientId)
    .eq("user_id", userId);

  if (error) {
    console.error("Unable to delete client", { code: error.code });
    throw new Error("No pudimos eliminar el cliente.");
  }

  revalidatePath("/clients");
  redirect("/clients?deleted=1");
}
