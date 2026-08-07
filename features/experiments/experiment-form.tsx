"use client";

import { LoaderCircle, Save } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { dateInputValue } from "@/features/opportunities/utils";
import { experimentStatuses, experimentStatusLabels, isExperimentStatus } from "./constants";
import type { ExperimentFormField, ExperimentFormState, ExperimentRow } from "./types";

const initialState: ExperimentFormState = {};

type ExperimentFormAction = (
  state: ExperimentFormState,
  formData: FormData,
) => Promise<ExperimentFormState>;

function FieldError({ field, state }: { field: ExperimentFormField; state: ExperimentFormState }) {
  const error = state.errors?.[field];
  return error ? <span className="field-error" id={`${field}-error`}>{error}</span> : null;
}

export function ExperimentForm({
  action,
  values,
  cancelHref,
  submitLabel,
}: {
  action: ExperimentFormAction;
  values?: ExperimentRow;
  cancelHref: string;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const today = dateInputValue(new Date().toISOString());
  const initialStatus = values?.status && isExperimentStatus(values.status) ? values.status : "active";

  return (
    <form action={formAction} className="entity-form">
      {state.message && <p className="form-error form-message" role="alert">{state.message}</p>}

      <div className="form-grid">
        <div className="field-group form-field-wide">
          <label htmlFor="name">Nombre <span aria-hidden="true">*</span></label>
          <input id="name" name="name" defaultValue={values?.name} maxLength={180} required disabled={pending} autoFocus aria-invalid={Boolean(state.errors?.name)} aria-describedby={state.errors?.name ? "name-error" : undefined} />
          <FieldError field="name" state={state} />
        </div>

        <div className="field-group form-field-wide">
          <label htmlFor="description">Descripción</label>
          <textarea id="description" name="description" rows={5} maxLength={5000} defaultValue={values?.description ?? ""} disabled={pending} placeholder="Qué estrategia quieres comparar y qué aprendizaje buscas…" aria-invalid={Boolean(state.errors?.description)} aria-describedby={state.errors?.description ? "description-error" : undefined} />
          <FieldError field="description" state={state} />
        </div>

        <div className="field-group">
          <label htmlFor="status">Estado <span aria-hidden="true">*</span></label>
          <select id="status" name="status" defaultValue={initialStatus} required disabled={pending} aria-invalid={Boolean(state.errors?.status)}>
            {experimentStatuses.map((status) => <option key={status} value={status}>{experimentStatusLabels[status]}</option>)}
          </select>
          <FieldError field="status" state={state} />
        </div>

        <div className="field-group">
          <label htmlFor="started_at">Fecha de inicio</label>
          <input id="started_at" name="started_at" type="date" defaultValue={values?.started_at ?? today} disabled={pending} aria-invalid={Boolean(state.errors?.started_at)} />
          <FieldError field="started_at" state={state} />
        </div>

        <div className="field-group">
          <label htmlFor="ended_at">Fecha de finalización</label>
          <input id="ended_at" name="ended_at" type="date" defaultValue={values?.ended_at ?? ""} disabled={pending} aria-invalid={Boolean(state.errors?.ended_at)} />
          <FieldError field="ended_at" state={state} />
          <span className="field-help">Es obligatoria cuando el estado es Finalizado.</span>
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
