"use client";

import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { GripVertical, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { currencies, stageLabels } from "@/features/opportunities/constants";
import type { LostReason } from "@/features/opportunities/types";
import { dateInputValue, formatDateTime, formatMoney } from "@/features/opportunities/utils";
import { closePipelineOpportunityAction, movePipelineOpportunityAction } from "./actions";
import type {
  PipelineActionResult,
  PipelineCloseInput,
  PipelineOpportunity,
  PipelineStage,
} from "./types";

type ClosureRequest = {
  opportunity: PipelineOpportunity;
  stage: "won" | "lost";
};

export function PipelineBoard({
  initialOpportunities,
  lostReasons,
  stages,
}: {
  initialOpportunities: PipelineOpportunity[];
  lostReasons: LostReason[];
  stages: PipelineStage[];
}) {
  const [opportunities, setOpportunities] = useState(initialOpportunities);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [closure, setClosure] = useState<ClosureRequest | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );
  const activeOpportunity = opportunities.find((opportunity) => opportunity.id === activeId) ?? null;
  const stageName = (slug: string) => stages.find((stage) => stage.slug === slug)?.name ?? slug;

  function requestMove(opportunityId: string, targetStage: string) {
    const opportunity = opportunities.find((item) => item.id === opportunityId);
    if (!opportunity || opportunity.stage === targetStage || pendingIds.includes(opportunityId)) return;
    if (targetStage === "won" || targetStage === "lost") {
      setClosure({ opportunity, stage: targetStage });
      return;
    }
    void persistMove(opportunity, targetStage);
  }

  async function persistMove(opportunity: PipelineOpportunity, targetStage: string) {
    const previous = opportunity;
    setFeedback(null);
    setPendingIds((current) => [...current, opportunity.id]);
    setOpportunities((current) => current.map((item) => (
      item.id === opportunity.id ? { ...item, stage: targetStage } : item
    )));

    try {
      const result = await movePipelineOpportunityAction(opportunity.id, targetStage, opportunity.stage);
      if (!result.ok) {
        setOpportunities((current) => current.map((item) => item.id === opportunity.id ? previous : item));
        setFeedback({ tone: "error", message: result.message });
      } else {
        setOpportunities((current) => current.map((item) => (
          item.id === opportunity.id ? { ...item, ...result.opportunity } : item
        )));
        setFeedback({ tone: "success", message: `${opportunity.title} se movió a ${stageName(targetStage)}.` });
      }
    } catch {
      setOpportunities((current) => current.map((item) => item.id === opportunity.id ? previous : item));
      setFeedback({ tone: "error", message: "Perdimos la conexión. El pipeline fue restaurado." });
    } finally {
      setPendingIds((current) => current.filter((id) => id !== opportunity.id));
    }
  }

  async function persistClosure(input: PipelineCloseInput): Promise<PipelineActionResult> {
    if (!closure) return { ok: false, message: "La oportunidad ya no está disponible." };
    const previous = closure.opportunity;
    setFeedback(null);
    setPendingIds((current) => [...current, previous.id]);
    setOpportunities((current) => current.map((item) => (
      item.id === previous.id ? { ...item, stage: input.stage } : item
    )));

    try {
      const result = await closePipelineOpportunityAction(previous.id, previous.stage, input);
      if (!result.ok) {
        setOpportunities((current) => current.map((item) => item.id === previous.id ? previous : item));
      } else {
        setOpportunities((current) => current.map((item) => (
          item.id === previous.id ? { ...item, ...result.opportunity } : item
        )));
        setFeedback({ tone: "success", message: `${previous.title} se marcó como ${stageLabels[input.stage].toLocaleLowerCase("es")}.` });
      }
      return result;
    } catch {
      setOpportunities((current) => current.map((item) => item.id === previous.id ? previous : item));
      return { ok: false, message: "Perdimos la conexión. El pipeline fue restaurado." };
    } finally {
      setPendingIds((current) => current.filter((id) => id !== previous.id));
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    if (!event.over) return;
    const targetStage = String(event.over.id);
    if (!stages.some((stage) => stage.slug === targetStage)) return;
    requestMove(String(event.active.id), targetStage);
  }

  const accessibility = {
    screenReaderInstructions: {
      draggable: "Para tomar una oportunidad, presiona espacio o enter. Muévela con las flechas y vuelve a presionar espacio o enter para soltarla. Escape cancela. También puedes usar el selector de etapa de cada tarjeta.",
    },
    announcements: {
      onDragStart: ({ active }: { active: { id: string | number } }) => {
        const item = opportunities.find((opportunity) => opportunity.id === String(active.id));
        return item ? `Tomaste ${item.title}.` : "Tomaste una oportunidad.";
      },
      onDragOver: ({ over }: { over: { id: string | number } | null }) => over
        ? `Sobre la etapa ${stageName(String(over.id))}.`
        : "Fuera de una etapa.",
      onDragEnd: ({ over }: { over: { id: string | number } | null }) => over
        ? `Oportunidad soltada en ${stageName(String(over.id))}.`
        : "Movimiento cancelado.",
      onDragCancel: () => "Movimiento cancelado.",
    },
  };

  return (
    <>
      {feedback && (
        <div className={`feedback-banner ${feedback.tone === "success" ? "feedback-success" : "feedback-error"}`} role={feedback.tone === "success" ? "status" : "alert"}>
          {feedback.message}
        </div>
      )}

      <p className="pipeline-instructions">Arrastra una tarjeta por el asa o cambia su etapa con el selector.</p>
      <DndContext
        accessibility={accessibility}
        collisionDetection={closestCenter}
        sensors={sensors}
        onDragStart={({ active }) => setActiveId(String(active.id))}
        onDragCancel={() => setActiveId(null)}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-scroll">
          <section className="kanban-board" aria-label="Pipeline de oportunidades">
            {stages.map((stage) => {
              const stageOpportunities = opportunities.filter((opportunity) => opportunity.stage === stage.slug);
              return (
                <PipelineColumn
                  key={stage.id}
                  stage={stage}
                  stages={stages}
                  opportunities={stageOpportunities}
                  pendingIds={pendingIds}
                  onStageChange={requestMove}
                />
              );
            })}
          </section>
        </div>
        <DragOverlay dropAnimation={null}>
          {activeOpportunity ? <PipelineCardPreview opportunity={activeOpportunity} /> : null}
        </DragOverlay>
      </DndContext>

      {closure && (
        <PipelineClosureDialog
          request={closure}
          lostReasons={lostReasons}
          onCancel={() => setClosure(null)}
          onSubmit={persistClosure}
        />
      )}
    </>
  );
}

function PipelineColumn({
  stage,
  stages,
  opportunities,
  pendingIds,
  onStageChange,
}: {
  stage: PipelineStage;
  stages: PipelineStage[];
  opportunities: PipelineOpportunity[];
  pendingIds: string[];
  onStageChange: (id: string, stage: string) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: stage.slug, data: { stage: stage.slug } });
  const terminalClass = stage.slug === "won"
    ? "kanban-column-won"
    : stage.slug === "lost"
      ? "kanban-column-lost"
      : "";
  return (
    <article className={`kanban-column ${terminalClass} ${isOver ? "kanban-column-over" : ""}`.trim()} ref={setNodeRef}>
      <header className="kanban-heading">
        <h2>{stage.name}</h2>
        <span className="kanban-count">{opportunities.length}</span>
      </header>
      <div className="kanban-cards">
        {opportunities.length === 0 ? (
          <p className="kanban-empty">Suelta una oportunidad aquí</p>
        ) : opportunities.map((opportunity) => (
          <PipelineCard
            key={opportunity.id}
            opportunity={opportunity}
            pending={pendingIds.includes(opportunity.id)}
            stages={stages}
            onStageChange={onStageChange}
          />
        ))}
      </div>
    </article>
  );
}

function PipelineCard({
  opportunity,
  pending,
  stages,
  onStageChange,
}: {
  opportunity: PipelineOpportunity;
  pending: boolean;
  stages: PipelineStage[];
  onStageChange: (id: string, stage: string) => void;
}) {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: opportunity.id,
    data: { title: opportunity.title, stage: opportunity.stage },
    disabled: pending,
    attributes: { roleDescription: "oportunidad movible" },
  });
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scaleX(${transform.scaleX}) scaleY(${transform.scaleY})`,
  } : undefined;

  return (
    <article className={`kanban-card ${isDragging ? "kanban-card-dragging" : ""}`} ref={setNodeRef} style={style} aria-busy={pending}>
      <div className="kanban-card-heading">
        <Link href={`/opportunities/${opportunity.id}`}>{opportunity.title}</Link>
        <button
          className="kanban-drag-handle"
          ref={setActivatorNodeRef}
          disabled={pending}
          type="button"
          aria-label={`Mover ${opportunity.title}`}
          {...attributes}
          {...listeners}
        >
          {pending ? <LoaderCircle className="spin" size={14} /> : <GripVertical size={15} />}
        </button>
      </div>
      <p className="kanban-card-client">{opportunity.clients?.name ?? "Sin cliente"}</p>
      <dl className="kanban-card-data">
        <div><dt>Precio</dt><dd>{formatMoney(opportunity.planned_price, opportunity.planned_price_currency)}</dd></div>
        <div><dt>Seguimiento</dt><dd>{formatDateTime(opportunity.next_follow_up_at)}</dd></div>
        <div><dt>Variante</dt><dd>{opportunity.experiment_variants ? `${opportunity.experiment_variants.code} · ${opportunity.experiment_variants.name}` : "—"}</dd></div>
      </dl>
      <label className="kanban-stage-select">
        <span>Etapa</span>
        <select
          value={opportunity.stage}
          disabled={pending}
          onChange={(event) => onStageChange(opportunity.id, event.target.value)}
        >
          {stages.map((stage) => <option key={stage.id} value={stage.slug}>{stage.name}</option>)}
        </select>
      </label>
    </article>
  );
}

function PipelineCardPreview({ opportunity }: { opportunity: PipelineOpportunity }) {
  return (
    <article className="kanban-card kanban-card-overlay">
      <div className="kanban-card-heading"><strong>{opportunity.title}</strong><GripVertical size={15} /></div>
      <p className="kanban-card-client">{opportunity.clients?.name ?? "Sin cliente"}</p>
    </article>
  );
}

function PipelineClosureDialog({
  request,
  lostReasons,
  onCancel,
  onSubmit,
}: {
  request: ClosureRequest;
  lostReasons: LostReason[];
  onCancel: () => void;
  onSubmit: (input: PipelineCloseInput) => Promise<PipelineActionResult>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const opportunity = request.opportunity;
  const noResponseReason = lostReasons.find((reason) => reason.slug === "no_response");
  const today = dateInputValue(new Date().toISOString());

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const input: PipelineCloseInput = request.stage === "won"
      ? {
          stage: "won",
          final_value: String(formData.get("final_value") ?? ""),
          final_value_currency: String(formData.get("final_value_currency") ?? ""),
          won_at: String(formData.get("won_at") ?? ""),
        }
      : {
          stage: "lost",
          lost_reason_id: String(formData.get("lost_reason_id") ?? ""),
          lost_reason_notes: String(formData.get("lost_reason_notes") ?? ""),
          lost_at: String(formData.get("lost_at") ?? ""),
        };
    setPending(true);
    setError(null);
    setErrors({});
    const result = await onSubmit(input);
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      setErrors(result.errors ?? {});
      return;
    }
    dialogRef.current?.close();
    onCancel();
  }

  return (
    <dialog
      aria-labelledby={`pipeline-closure-title-${opportunity.id}`}
      aria-describedby={`pipeline-closure-description-${opportunity.id}`}
      className="action-dialog"
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) {
          dialogRef.current?.close();
          onCancel();
        }
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !pending) {
          event.currentTarget.close();
          onCancel();
        }
      }}
    >
      <form className="action-dialog-card" onSubmit={handleSubmit}>
        <div className="action-dialog-heading">
          <div><span>Cierre de oportunidad</span><h2 id={`pipeline-closure-title-${opportunity.id}`}>{request.stage === "won" ? "Marcar como ganada" : "Marcar como perdida"}</h2></div>
          <button aria-label="Cerrar" disabled={pending} onClick={() => { dialogRef.current?.close(); onCancel(); }} type="button">×</button>
        </div>
        <p className="action-dialog-description" id={`pipeline-closure-description-${opportunity.id}`}>Completa el cierre de <strong>{opportunity.title}</strong>. Sus hitos anteriores se conservarán.</p>
        {error && <p className="form-error" role="alert">{error}</p>}

        {request.stage === "won" ? (
          <div className="form-grid">
            <div className="field-group">
              <label htmlFor={`pipeline-value-${opportunity.id}`}>Valor final</label>
              <input id={`pipeline-value-${opportunity.id}`} name="final_value" type="number" min="0" step="0.01" defaultValue={opportunity.final_value ?? opportunity.planned_price ?? ""} required disabled={pending} aria-invalid={Boolean(errors.final_value)} />
              {errors.final_value && <span className="field-error">{errors.final_value}</span>}
            </div>
            <div className="field-group">
              <label htmlFor={`pipeline-currency-${opportunity.id}`}>Moneda</label>
              <select id={`pipeline-currency-${opportunity.id}`} name="final_value_currency" defaultValue={opportunity.final_value_currency ?? opportunity.planned_price_currency ?? "USD"} required disabled={pending} aria-invalid={Boolean(errors.final_value_currency)}>
                {currencies.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
              </select>
              {errors.final_value_currency && <span className="field-error">{errors.final_value_currency}</span>}
            </div>
            <div className="field-group form-field-wide">
              <label htmlFor={`pipeline-won-date-${opportunity.id}`}>Fecha de cierre</label>
              <input id={`pipeline-won-date-${opportunity.id}`} name="won_at" type="date" defaultValue={dateInputValue(opportunity.won_at) || today} disabled={pending} aria-invalid={Boolean(errors.won_at)} />
              {errors.won_at && <span className="field-error">{errors.won_at}</span>}
            </div>
          </div>
        ) : (
          <div className="form-grid">
            <div className="field-group">
              <label htmlFor={`pipeline-reason-${opportunity.id}`}>Motivo</label>
              <select id={`pipeline-reason-${opportunity.id}`} name="lost_reason_id" defaultValue={opportunity.lost_reason_id ?? noResponseReason?.id ?? ""} required disabled={pending} aria-invalid={Boolean(errors.lost_reason_id)}>
                <option value="">Seleccionar motivo</option>
                {lostReasons.map((reason) => <option key={reason.id} value={reason.id}>{reason.name}</option>)}
              </select>
              {errors.lost_reason_id && <span className="field-error">{errors.lost_reason_id}</span>}
            </div>
            <div className="field-group">
              <label htmlFor={`pipeline-lost-date-${opportunity.id}`}>Fecha de cierre</label>
              <input id={`pipeline-lost-date-${opportunity.id}`} name="lost_at" type="date" defaultValue={dateInputValue(opportunity.lost_at) || today} disabled={pending} aria-invalid={Boolean(errors.lost_at)} />
              {errors.lost_at && <span className="field-error">{errors.lost_at}</span>}
            </div>
            <div className="field-group form-field-wide">
              <label htmlFor={`pipeline-lost-notes-${opportunity.id}`}>Detalle opcional</label>
              <textarea id={`pipeline-lost-notes-${opportunity.id}`} name="lost_reason_notes" rows={3} maxLength={2000} defaultValue={opportunity.lost_reason_notes ?? ""} disabled={pending} aria-invalid={Boolean(errors.lost_reason_notes)} placeholder="Añade contexto, especialmente si seleccionaste Otro…" />
              {errors.lost_reason_notes && <span className="field-error">{errors.lost_reason_notes}</span>}
            </div>
          </div>
        )}

        <div className="action-dialog-footer">
          <button className="button" disabled={pending} onClick={() => { dialogRef.current?.close(); onCancel(); }} type="button">Cancelar</button>
          <button className={request.stage === "won" ? "button button-primary" : "danger-button"} disabled={pending} type="submit">
            {pending && <LoaderCircle className="spin" size={14} />}
            {pending ? "Guardando…" : request.stage === "won" ? "Marcar ganada" : "Marcar perdida"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
