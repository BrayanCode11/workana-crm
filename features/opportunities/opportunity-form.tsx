"use client";

import { LoaderCircle, Plus, Save } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { currencies, opportunityStages, projectTypes, stageLabels, type OpportunityStage } from "./constants";
import type {
  OpportunityFormField,
  OpportunityFormOptions,
  OpportunityFormState,
  OpportunityFormValues,
} from "./types";
import { dateInputValue, dateTimeInputValue } from "./utils";

const initialState: OpportunityFormState = {};

type OpportunityFormAction = (
  state: OpportunityFormState,
  formData: FormData,
) => Promise<OpportunityFormState>;

function FieldError({ field, state }: { field: OpportunityFormField; state: OpportunityFormState }) {
  const error = state.errors?.[field];
  return error ? <span className="field-error" id={`${field}-error`}>{error}</span> : null;
}

function describedBy(field: OpportunityFormField, state: OpportunityFormState) {
  return state.errors?.[field] ? `${field}-error` : undefined;
}

export function OpportunityForm({
  action,
  options,
  values,
  defaultClientId,
  cancelHref,
  submitLabel,
}: {
  action: OpportunityFormAction;
  options: OpportunityFormOptions;
  values?: OpportunityFormValues;
  defaultClientId?: string;
  cancelHref: string;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const initialStage = opportunityStages.includes(values?.stage as OpportunityStage)
    ? values?.stage as OpportunityStage
    : "detected";
  const [stage, setStage] = useState<OpportunityStage>(initialStage);
  const [experimentId, setExperimentId] = useState(values?.experiment_id ?? "");
  const [variantId, setVariantId] = useState(values?.experiment_variant_id ?? "");
  const variants = (options.experiments.find((experiment) => experiment.id === experimentId)?.experiment_variants ?? [])
    .filter((variant) => variant.is_active !== false || variant.id === values?.experiment_variant_id);
  const customProjectType = values?.project_type && !projectTypes.includes(values.project_type as (typeof projectTypes)[number])
    ? values.project_type
    : null;
  const today = dateInputValue(new Date().toISOString());

  return (
    <form action={formAction} className="entity-form opportunity-form">
      {state.message && (
        <p className="form-error form-message" role="alert">{state.message}</p>
      )}

      <fieldset className="form-section" disabled={pending}>
        <legend>Proyecto</legend>
        <div className="form-grid">
          <div className="field-group form-field-wide">
            <label htmlFor="title">Título <span aria-hidden="true">*</span></label>
            <input
              id="title"
              name="title"
              defaultValue={values?.title}
              maxLength={240}
              required
              autoFocus
              aria-invalid={Boolean(state.errors?.title)}
              aria-describedby={describedBy("title", state)}
            />
            <FieldError field="title" state={state} />
          </div>

          <div className="field-group form-field-wide">
            <label htmlFor="workana_url">URL del proyecto en Workana</label>
            <input
              id="workana_url"
              name="workana_url"
              type="url"
              inputMode="url"
              placeholder="https://www.workana.com/job/..."
              defaultValue={values?.workana_url ?? ""}
              aria-invalid={Boolean(state.errors?.workana_url)}
              aria-describedby={describedBy("workana_url", state)}
            />
            <FieldError field="workana_url" state={state} />
          </div>

          <div className="field-group form-field-wide">
            <label htmlFor="description">Descripción</label>
            <textarea
              id="description"
              name="description"
              rows={5}
              maxLength={10_000}
              defaultValue={values?.description ?? ""}
              placeholder="Alcance, necesidades del cliente y contexto relevante…"
              aria-invalid={Boolean(state.errors?.description)}
              aria-describedby={describedBy("description", state)}
            />
            <FieldError field="description" state={state} />
          </div>

          <div className="field-group">
            <label htmlFor="project_type">Tipo de proyecto</label>
            <select id="project_type" name="project_type" defaultValue={values?.project_type ?? ""}>
              <option value="">Sin especificar</option>
              {customProjectType && <option value={customProjectType}>{customProjectType}</option>}
              {projectTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>

          <div className="field-group">
            <label htmlFor="published_at">Fecha de publicación</label>
            <input id="published_at" name="published_at" type="date" defaultValue={dateInputValue(values?.published_at ?? null)} />
            <FieldError field="published_at" state={state} />
          </div>

          <div className="field-group form-field-wide">
            <label htmlFor="technologies">Tecnologías</label>
            <input
              id="technologies"
              name="technologies"
              defaultValue={values?.technologies.join(", ") ?? ""}
              placeholder="Next.js, Supabase, Stripe"
              maxLength={1000}
              aria-invalid={Boolean(state.errors?.technologies)}
              aria-describedby="technologies-help"
            />
            <span className="field-help" id="technologies-help">Separa cada tecnología con una coma.</span>
            <FieldError field="technologies" state={state} />
          </div>
        </div>
      </fieldset>

      <fieldset className="form-section" disabled={pending}>
        <legend>Cliente</legend>
        <div className="form-grid">
          <div className="field-group form-field-wide">
            <label htmlFor="client_id">Cliente existente</label>
            <select
              id="client_id"
              name="client_id"
              defaultValue={values?.client_id ?? defaultClientId ?? ""}
              aria-invalid={Boolean(state.errors?.client_id)}
              aria-describedby={describedBy("client_id", state)}
            >
              <option value="">Sin cliente asociado</option>
              {options.clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}{client.company_name ? ` · ${client.company_name}` : ""}
                </option>
              ))}
            </select>
            <FieldError field="client_id" state={state} />
          </div>

          <details className="quick-create form-field-wide" open={Boolean(state.errors?.new_client_name || state.errors?.new_client_company)}>
            <summary><Plus size={14} aria-hidden="true" /> Crear un cliente sin salir</summary>
            <p>Deja “Cliente existente” vacío y completa estos datos.</p>
            <div className="form-grid">
              <div className="field-group">
                <label htmlFor="new_client_name">Nombre del cliente</label>
                <input
                  id="new_client_name"
                  name="new_client_name"
                  maxLength={160}
                  aria-invalid={Boolean(state.errors?.new_client_name)}
                  aria-describedby={describedBy("new_client_name", state)}
                />
                <FieldError field="new_client_name" state={state} />
              </div>
              <div className="field-group">
                <label htmlFor="new_client_company">Empresa</label>
                <input
                  id="new_client_company"
                  name="new_client_company"
                  maxLength={160}
                  aria-invalid={Boolean(state.errors?.new_client_company)}
                  aria-describedby={describedBy("new_client_company", state)}
                />
                <FieldError field="new_client_company" state={state} />
              </div>
            </div>
          </details>
        </div>
      </fieldset>

      <fieldset className="form-section" disabled={pending}>
        <legend>Valores</legend>
        <div className="form-grid money-grid">
          <div className="field-group">
            <label htmlFor="published_budget_min">Presupuesto mínimo</label>
            <input id="published_budget_min" name="published_budget_min" type="number" min="0" step="0.01" defaultValue={values?.published_budget_min ?? ""} aria-invalid={Boolean(state.errors?.published_budget_min)} />
            <FieldError field="published_budget_min" state={state} />
          </div>
          <div className="field-group">
            <label htmlFor="published_budget_max">Presupuesto máximo</label>
            <input id="published_budget_max" name="published_budget_max" type="number" min="0" step="0.01" defaultValue={values?.published_budget_max ?? ""} aria-invalid={Boolean(state.errors?.published_budget_max)} />
            <FieldError field="published_budget_max" state={state} />
          </div>
          <div className="field-group">
            <label htmlFor="published_budget_currency">Moneda del presupuesto</label>
            <CurrencySelect id="published_budget_currency" defaultValue={values?.published_budget_currency} invalid={Boolean(state.errors?.published_budget_currency)} />
            <FieldError field="published_budget_currency" state={state} />
          </div>
          <div className="field-group">
            <label htmlFor="planned_price">Precio planeado</label>
            <input id="planned_price" name="planned_price" type="number" min="0" step="0.01" defaultValue={values?.planned_price ?? ""} aria-invalid={Boolean(state.errors?.planned_price)} />
            <FieldError field="planned_price" state={state} />
          </div>
          <div className="field-group">
            <label htmlFor="planned_price_currency">Moneda del precio</label>
            <CurrencySelect id="planned_price_currency" defaultValue={values?.planned_price_currency} invalid={Boolean(state.errors?.planned_price_currency)} />
            <FieldError field="planned_price_currency" state={state} />
          </div>
        </div>
      </fieldset>

      <fieldset className="form-section" disabled={pending}>
        <legend>Seguimiento y atribución</legend>
        <div className="form-grid">
          <div className="field-group">
            <label htmlFor="stage">Etapa <span aria-hidden="true">*</span></label>
            <select id="stage" name="stage" value={stage} onChange={(event) => setStage(event.target.value as OpportunityStage)}>
              {opportunityStages.map((item) => <option key={item} value={item}>{stageLabels[item]}</option>)}
            </select>
            <FieldError field="stage" state={state} />
          </div>
          <div className="field-group">
            <label htmlFor="next_follow_up_at">Próximo seguimiento</label>
            <input id="next_follow_up_at" name="next_follow_up_at" type="datetime-local" defaultValue={dateTimeInputValue(values?.next_follow_up_at ?? null)} />
            <FieldError field="next_follow_up_at" state={state} />
          </div>
          <div className="field-group">
            <label htmlFor="experiment_id">Experimento</label>
            <select
              id="experiment_id"
              name="experiment_id"
              value={experimentId}
              onChange={(event) => {
                setExperimentId(event.target.value);
                setVariantId("");
              }}
              aria-invalid={Boolean(state.errors?.experiment_id)}
            >
              <option value="">Sin experimento</option>
              {options.experiments.map((experiment) => (
                <option key={experiment.id} value={experiment.id}>
                  {experiment.name}{experiment.status !== "active" ? ` · ${experiment.status === "paused" ? "Pausado" : "Finalizado"}` : ""}
                </option>
              ))}
            </select>
            <FieldError field="experiment_id" state={state} />
          </div>
          <div className="field-group">
            <label htmlFor="experiment_variant_id">Variante</label>
            <select
              id="experiment_variant_id"
              name="experiment_variant_id"
              value={variantId}
              onChange={(event) => setVariantId(event.target.value)}
              disabled={pending || !experimentId}
              aria-invalid={Boolean(state.errors?.experiment_variant_id)}
            >
              <option value="">Sin variante</option>
              {variants.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.code} · {variant.name}{variant.is_active === false ? " (inactiva)" : ""}
                </option>
              ))}
            </select>
            <FieldError field="experiment_variant_id" state={state} />
          </div>
        </div>
      </fieldset>

      {stage === "won" && (
        <fieldset className="form-section terminal-section terminal-won" disabled={pending}>
          <legend>Cierre ganado</legend>
          <p className="form-section-description">Registra el importe acordado. La fecha de hoy se usará si no eliges otra.</p>
          <div className="form-grid money-grid">
            <div className="field-group">
              <label htmlFor="final_value">Valor final <span aria-hidden="true">*</span></label>
              <input id="final_value" name="final_value" type="number" min="0" step="0.01" defaultValue={values?.final_value ?? ""} required aria-invalid={Boolean(state.errors?.final_value)} />
              <FieldError field="final_value" state={state} />
            </div>
            <div className="field-group">
              <label htmlFor="final_value_currency">Moneda <span aria-hidden="true">*</span></label>
              <CurrencySelect id="final_value_currency" defaultValue={values?.final_value_currency ?? values?.planned_price_currency} invalid={Boolean(state.errors?.final_value_currency)} required />
              <FieldError field="final_value_currency" state={state} />
            </div>
            <div className="field-group">
              <label htmlFor="won_at">Fecha de cierre</label>
              <input id="won_at" name="won_at" type="date" defaultValue={dateInputValue(values?.won_at ?? null) || today} required />
              <FieldError field="won_at" state={state} />
            </div>
          </div>
        </fieldset>
      )}

      {stage === "lost" && (
        <fieldset className="form-section terminal-section terminal-lost" disabled={pending}>
          <legend>Cierre perdido</legend>
          <p className="form-section-description">El motivo permitirá detectar patrones cuando acumules más oportunidades.</p>
          <div className="form-grid">
            <div className="field-group">
              <label htmlFor="lost_reason_id">Motivo <span aria-hidden="true">*</span></label>
              <select id="lost_reason_id" name="lost_reason_id" defaultValue={values?.lost_reason_id ?? ""} required aria-invalid={Boolean(state.errors?.lost_reason_id)}>
                <option value="">Seleccionar motivo</option>
                {options.lostReasons.map((reason) => <option key={reason.id} value={reason.id}>{reason.name}</option>)}
              </select>
              <FieldError field="lost_reason_id" state={state} />
            </div>
            <div className="field-group">
              <label htmlFor="lost_at">Fecha de cierre</label>
              <input id="lost_at" name="lost_at" type="date" defaultValue={dateInputValue(values?.lost_at ?? null) || today} required />
              <FieldError field="lost_at" state={state} />
            </div>
            <div className="field-group form-field-wide">
              <label htmlFor="lost_reason_notes">Detalle del motivo</label>
              <textarea id="lost_reason_notes" name="lost_reason_notes" rows={3} maxLength={2000} defaultValue={values?.lost_reason_notes ?? ""} placeholder="Añade contexto útil, especialmente si seleccionaste Otro…" aria-invalid={Boolean(state.errors?.lost_reason_notes)} />
              <FieldError field="lost_reason_notes" state={state} />
            </div>
          </div>
        </fieldset>
      )}

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

function CurrencySelect({
  id,
  defaultValue,
  invalid,
  required,
}: {
  id: "published_budget_currency" | "planned_price_currency" | "final_value_currency";
  defaultValue?: string | null;
  invalid: boolean;
  required?: boolean;
}) {
  return (
    <select id={id} name={id} defaultValue={defaultValue ?? ""} required={required} aria-invalid={invalid}>
      <option value="">Sin moneda</option>
      {currencies.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
    </select>
  );
}
