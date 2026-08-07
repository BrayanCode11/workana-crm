import type { Metadata } from "next";
import { LockKeyhole } from "lucide-react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

export default function LoginPage() {
  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand">
          <span className="brand-mark" aria-hidden="true">W</span>
          <span>
            <strong>Prospecta</strong>
            <small>CRM para Workana</small>
          </span>
        </div>

        <div className="login-heading">
          <span className="login-lock" aria-hidden="true">
            <LockKeyhole size={18} strokeWidth={1.8} />
          </span>
          <h1 id="login-title">Bienvenido de nuevo</h1>
          <p>Entra a tu espacio privado para continuar con la prospección.</p>
        </div>

        <LoginForm />
        <p className="login-footnote">El acceso está limitado a usuarios creados por el administrador.</p>
      </section>
    </main>
  );
}
