"use client";

import { ClipboardPaste, RotateCcw, ScanText } from "lucide-react";
import { useState, type FormEvent } from "react";
import { createOpportunityAction } from "./actions";
import { OpportunityForm } from "./opportunity-form";
import type { OpportunityFormOptions, OpportunityFormValues } from "./types";
import { parseWorkanaProject, type ParsedWorkanaProject } from "./workana-parser";

export function WorkanaImportFlow({ options }: { options: OpportunityFormOptions }) {
  const [rawText, setRawText] = useState("");
  const [parsed, setParsed] = useState<ParsedWorkanaProject | null>(null);
  const [analysisVersion, setAnalysisVersion] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function analyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!rawText.trim()) {
      setError("Pega primero la información copiada desde Workana.");
      setParsed(null);
      return;
    }

    setError(null);
    setParsed(parseWorkanaProject(rawText));
    setAnalysisVersion((version) => version + 1);
  }

  const values = parsed ? toFormValues(parsed) : null;
  const detectedFields = parsed ? countDetectedFields(parsed) : 0;

  return (
    <div className="workana-import-flow">
      <section className="panel workana-paste-panel" aria-labelledby="workana-paste-title">
        <div className="import-step-heading">
          <span aria-hidden="true">1</span>
          <div>
            <h2 id="workana-paste-title">Pega el proyecto</h2>
            <p>Copia el contenido del proyecto en Workana y pégalo aquí. Nada se crea hasta que revises y envíes el formulario.</p>
          </div>
        </div>
        <form onSubmit={analyze}>
          <label className="sr-only" htmlFor="workana-raw-text">Texto copiado desde Workana</label>
          <textarea
            id="workana-raw-text"
            value={rawText}
            onChange={(event) => setRawText(event.target.value)}
            rows={12}
            placeholder="# Título del proyecto&#10;&#10;Publicado el…&#10;&#10;Descripción, presupuesto, habilidades, contacto y URL…"
            spellCheck={false}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "workana-paste-error" : "workana-paste-help"}
          />
          <div className="workana-paste-footer">
            <p id="workana-paste-help">El texto original se procesa localmente y no se almacena.</p>
            <div>
              {parsed && (
                <button
                  className="button"
                  type="button"
                  onClick={() => {
                    setRawText("");
                    setParsed(null);
                    setError(null);
                  }}
                >
                  <RotateCcw size={15} aria-hidden="true" /> Limpiar
                </button>
              )}
              <button className="button button-primary" type="submit">
                <ScanText size={16} aria-hidden="true" /> Analizar
              </button>
            </div>
          </div>
          {error && <p className="field-error" id="workana-paste-error" role="alert">{error}</p>}
        </form>
      </section>

      {values && parsed && (
        <section className="workana-preview" aria-labelledby="workana-preview-title">
          <div className="import-step-heading import-preview-heading">
            <span aria-hidden="true">2</span>
            <div>
              <h2 id="workana-preview-title">Revisa y corrige</h2>
              <p>{detectedFields} de 9 campos detectados. Todos siguen siendo editables antes de crear la oportunidad.</p>
            </div>
          </div>
          <div className="feedback-banner import-safety-note" role="status">
            <ClipboardPaste size={16} aria-hidden="true" />
            El contacto importado pertenece solo a esta oportunidad; no crea ni asocia un cliente.
          </div>
          <div className="panel opportunity-form-panel">
            <OpportunityForm
              key={analysisVersion}
              action={createOpportunityAction}
              options={options}
              values={values}
              cancelHref="/opportunities"
              submitLabel="Crear oportunidad"
            />
          </div>
        </section>
      )}
    </div>
  );
}

function toFormValues(parsed: ParsedWorkanaProject): OpportunityFormValues {
  return {
    stage: "detected",
    title: parsed.title ?? "",
    description: parsed.description,
    contact_name: parsed.contactName,
    contact_country: parsed.contactCountry,
    client_id: null,
    workana_url: parsed.workanaUrl,
    published_budget_min: parsed.budgetMin,
    published_budget_max: parsed.budgetMax,
    published_budget_currency: parsed.budgetCurrency,
    technologies: parsed.technologies,
    published_at: parsed.publishedAt ? `${parsed.publishedAt}T12:00:00-05:00` : null,
  };
}

function countDetectedFields(parsed: ParsedWorkanaProject) {
  return [
    parsed.title,
    parsed.description,
    parsed.contactName,
    parsed.contactCountry,
    parsed.budgetMin !== null || parsed.budgetMax !== null ? "budget" : null,
    parsed.budgetCurrency,
    parsed.technologies.length ? "technologies" : null,
    parsed.publishedAt,
    parsed.workanaUrl,
  ].filter(Boolean).length;
}
