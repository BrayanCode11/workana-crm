"use client";

import { ArrowRight, LoaderCircle } from "lucide-react";
import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="login-form">
      <div className="field-group">
        <label htmlFor="email">Correo</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="tu@correo.com"
          required
          disabled={pending}
        />
      </div>

      <div className="field-group">
        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Tu contraseña"
          required
          disabled={pending}
        />
      </div>

      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}

      <button className="button button-primary login-submit" disabled={pending} type="submit">
        {pending ? (
          <>
            <LoaderCircle className="spin" size={16} aria-hidden="true" />
            Entrando…
          </>
        ) : (
          <>
            Entrar
            <ArrowRight size={16} aria-hidden="true" />
          </>
        )}
      </button>
    </form>
  );
}
