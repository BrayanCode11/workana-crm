"use client";

import { LoaderCircle, Save } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import type { ClientFormState, ClientFormValues } from "./types";

const initialState: ClientFormState = {};

type ClientFormAction = (
  state: ClientFormState,
  formData: FormData,
) => Promise<ClientFormState>;

export function ClientForm({
  action,
  values,
  cancelHref,
  submitLabel,
}: {
  action: ClientFormAction;
  values?: ClientFormValues;
  cancelHref: string;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="entity-form">
      {state.message && (
        <p className="form-error form-message" role="alert">
          {state.message}
        </p>
      )}

      <div className="form-grid">
        <div className="field-group form-field-wide">
          <label htmlFor="name">Nombre <span aria-hidden="true">*</span></label>
          <input
            id="name"
            name="name"
            defaultValue={values?.name}
            maxLength={160}
            required
            disabled={pending}
            aria-invalid={Boolean(state.errors?.name)}
            aria-describedby={state.errors?.name ? "name-error" : undefined}
            autoFocus
          />
          {state.errors?.name && <span className="field-error" id="name-error">{state.errors.name}</span>}
        </div>

        <div className="field-group">
          <label htmlFor="company_name">Empresa</label>
          <input
            id="company_name"
            name="company_name"
            defaultValue={values?.company_name ?? ""}
            maxLength={160}
            disabled={pending}
            aria-invalid={Boolean(state.errors?.company_name)}
            aria-describedby={state.errors?.company_name ? "company-error" : undefined}
          />
          {state.errors?.company_name && (
            <span className="field-error" id="company-error">{state.errors.company_name}</span>
          )}
        </div>

        <div className="field-group">
          <label htmlFor="country">País</label>
          <input
            id="country"
            name="country"
            defaultValue={values?.country ?? ""}
            maxLength={100}
            disabled={pending}
          />
        </div>

        <div className="field-group form-field-wide">
          <label htmlFor="workana_profile_url">Perfil de Workana</label>
          <input
            id="workana_profile_url"
            name="workana_profile_url"
            type="url"
            inputMode="url"
            placeholder="https://www.workana.com/..."
            defaultValue={values?.workana_profile_url ?? ""}
            disabled={pending}
            aria-invalid={Boolean(state.errors?.workana_profile_url)}
            aria-describedby={state.errors?.workana_profile_url ? "url-error" : undefined}
          />
          {state.errors?.workana_profile_url && (
            <span className="field-error" id="url-error">{state.errors.workana_profile_url}</span>
          )}
        </div>

        <div className="field-group form-field-wide">
          <label htmlFor="notes">Notas</label>
          <textarea
            id="notes"
            name="notes"
            rows={5}
            defaultValue={values?.notes ?? ""}
            disabled={pending}
            placeholder="Contexto útil sobre el cliente…"
          />
        </div>
      </div>

      <div className="form-actions">
        <Link className="button" href={cancelHref}>Cancelar</Link>
        <button className="button button-primary" disabled={pending} type="submit">
          {pending ? <LoaderCircle className="spin" size={16} aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}
          {pending ? "Guardando…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
