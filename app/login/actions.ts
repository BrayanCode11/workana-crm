"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = {
  error?: string;
};

function getLoginErrorMessage(code?: string) {
  switch (code) {
    case "email_not_confirmed":
      return "Tu correo todavía no está confirmado en Supabase Auth.";
    case "invalid_credentials":
      return "Supabase no reconoce esa combinación de correo y contraseña.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Hubo demasiados intentos. Espera unos minutos y vuelve a probar.";
    case "user_banned":
      return "Este usuario está bloqueado en Supabase Auth.";
    case "validation_failed":
      return "El correo o la contraseña no tienen un formato válido.";
    default:
      return "Supabase rechazó el inicio de sesión. Revisa el estado del usuario en Auth.";
  }
}

export async function login(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Escribe tu correo y contraseña." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error("Supabase login rejected", {
      code: error.code,
      status: error.status,
    });

    return { error: getLoginErrorMessage(error.code) };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
