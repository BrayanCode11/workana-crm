"use client";

import { LoaderCircle, Save } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import type { ExperimentVariantRow, VariantFormField, VariantFormState } from "./types";

const initialState: VariantFormState = {};

type VariantFormAction = (
  state: VariantFormState,
  formData: FormData,
) => Promise<VariantFormState>;

function FieldError({ field, state }: { field: VariantFormField; state: VariantFormState }) {
  const error = state.errors?.[field];
  return error ? <span className="field-error" id={`${field}-error`}>{error}</span> : null;
}

export function VariantForm({
  action,
  values,
  cancelHref,
  submitLabel,
}: {
  action: VariantFormAction;
  values?: ExperimentVariantRow;
  cancelHref: string;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="entity-form">
      {state.message && <p className="form-error form-message" role="alert">{state.message}</p>}

      <div className="form-grid">
        <div className="field-group">
          <label htmlFor="code">Código <span aria-hidden="true">*</span></label>
          <input id="code" name="code" defaultValue={values?.code} maxLength={20} required disabled={pending} autoFocus placeholder="A" aria-invalid={Boolean(state.errors?.code)} aria-describedby={state.errors?.code ? "code-error" : "code-help"} />
          <span className="field-help" id="code-help">Debe ser único dentro de este experimento.</span>
          <FieldError field="code" state={state} />
        </div>

        <div className="field-group">
          <label htmlFor="name">Nombre <span aria-hidden="true">*</span></label>
          <input id="name" name="name" defaultValue={values?.name} maxLength={160} required disabled={pending} placeholder="Pregunta consultiva" aria-invalid={Boolean(state.errors?.name)} aria-describedby={state.errors?.name ? "name-error" : undefined} />
          <FieldError field="name" state={state} />
        </div>

        <div className="field-group form-field-wide">
          <label htmlFor="description">Descripción de la estrategia</label>
          <textarea id="description" name="description" rows={5} maxLength={5000} defaultValue={values?.description ?? ""} disabled={pending} placeholder="Describe la estrategia, sin guardar mensajes, prompts ni conversaciones…" aria-invalid={Boolean(state.errors?.description)} />
          <FieldError field="description" state={state} />
        </div>

        <label className="checkbox-field form-field-wide">
          <input name="is_active" type="checkbox" defaultChecked={values?.is_active ?? true} disabled={pending} />
          <span><strong>Variante activa</strong><small>Podrá asignarse normalmente a nuevas oportunidades.</small></span>
        </label>
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
