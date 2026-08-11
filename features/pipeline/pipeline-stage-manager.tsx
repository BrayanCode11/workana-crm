"use client";

import { LoaderCircle, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { createPipelineStageAction, deletePipelineStageAction } from "./actions";
import type { PipelineStage, PipelineStageActionState } from "./types";

const initialState: PipelineStageActionState = {};

export function PipelineStageManager({ stages }: { stages: PipelineStage[] }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createPipelineStageAction, initialState);
  const [deleteFeedback, setDeleteFeedback] = useState<PipelineStageActionState>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletePending, startDeleteTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <details className="panel pipeline-stage-manager">
      <summary>Administrar etapas <span>{stages.length}</span></summary>
      <div className="pipeline-stage-manager-body">
        <div>
          <h2>Etapas del pipeline</h2>
          <p>Agrega columnas propias. Las etapas base están protegidas porque sostienen seguimientos, cierres y métricas.</p>
        </div>
        <div className="pipeline-stage-list">
          {stages.map((stage) => (
            <div key={stage.id}>
              <span><strong>{stage.name}</strong><small>{stage.is_protected ? "Etapa base" : "Personalizada"}</small></span>
              {!stage.is_protected && (
                <button
                  className="icon-button"
                  type="button"
                  aria-label={`Eliminar etapa ${stage.name}`}
                  disabled={deletePending}
                  onClick={() => {
                    if (!window.confirm(`¿Eliminar la etapa “${stage.name}”?`)) return;
                    setDeletingId(stage.id);
                    startDeleteTransition(async () => {
                      const result = await deletePipelineStageAction(stage.id);
                      setDeleteFeedback(result);
                      if (result.ok) router.refresh();
                      setDeletingId(null);
                    });
                  }}
                >
                  {deletePending && deletingId === stage.id ? <LoaderCircle className="spin" size={14} /> : <Trash2 size={14} />}
                </button>
              )}
            </div>
          ))}
        </div>
        <form action={formAction} className="pipeline-stage-create-form" ref={formRef}>
          <div className="field-group">
            <label htmlFor="pipeline-stage-name">Nueva etapa</label>
            <input id="pipeline-stage-name" name="name" maxLength={80} placeholder="Ej. Revisión técnica" disabled={pending} aria-invalid={Boolean(state.errors?.name)} />
            {state.errors?.name && <span className="field-error">{state.errors.name}</span>}
          </div>
          <button className="button button-primary" type="submit" disabled={pending}>
            {pending ? <LoaderCircle className="spin" size={14} /> : <Plus size={14} />} {pending ? "Agregando…" : "Agregar etapa"}
          </button>
        </form>
        {deleteFeedback.message
          ? <div className={`feedback-banner ${deleteFeedback.ok ? "feedback-success" : "feedback-error"}`} role="status">{deleteFeedback.message}</div>
          : state.message
            ? <div className={`feedback-banner ${state.ok ? "feedback-success" : "feedback-error"}`} role="status">{state.message}</div>
            : null}
      </div>
    </details>
  );
}
