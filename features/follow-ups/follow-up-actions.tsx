"use client";

import { Check, ChevronDown, ExternalLink, LoaderCircle, MessageCircleReply, RefreshCw, XCircle } from "lucide-react";
import Link from "next/link";
import { useActionState, useRef } from "react";
import { useFormStatus } from "react-dom";
import type { LostReason } from "@/features/opportunities/types";
import { dateInputValue, dateTimeInputValue } from "@/features/opportunities/utils";
import {
  markLostFromFollowUpAction,
  markRespondedAction,
  registerFollowUpAction,
  rescheduleFollowUpAction,
} from "./actions";
import type { FollowUpFormState, FollowUpOpportunity, FollowUpPeriod } from "./types";

const initialState: FollowUpFormState = {};

export function FollowUpActions({
  opportunity,
  lostReasons,
  period,
  query,
}: {
  opportunity: FollowUpOpportunity;
  lostReasons: LostReason[];
  period: FollowUpPeriod;
  query: string;
}) {
  const rescheduleDialog = useRef<HTMLDialogElement>(null);
  const lostDialog = useRef<HTMLDialogElement>(null);
  const registerAction = registerFollowUpAction.bind(null, opportunity.id, period, query);
  const respondedAction = markRespondedAction.bind(null, opportunity.id, period, query);
  const rescheduleAction = rescheduleFollowUpAction.bind(null, opportunity.id, period, query);
  const lostAction = markLostFromFollowUpAction.bind(null, opportunity.id, period, query);
  const [rescheduleState, rescheduleFormAction, reschedulePending] = useActionState(rescheduleAction, initialState);
  const [lostState, lostFormAction, lostPending] = useActionState(lostAction, initialState);
  const nextFollowUp = opportunity.stage === "contacted"
    ? { label: "Registrar seguimiento 1", confirm: "¿Confirmas que ya enviaste el Seguimiento 1?" }
    : opportunity.stage === "follow_up_1"
      ? { label: "Registrar seguimiento 2", confirm: "¿Confirmas que ya enviaste el Seguimiento 2?" }
      : null;
  const canMarkResponded = ["contacted", "follow_up_1", "follow_up_2"].includes(opportunity.stage);
  const noResponseReason = lostReasons.find((reason) => reason.slug === "no_response");
  const today = dateInputValue(new Date().toISOString());

  return (
    <>
      <details className="follow-up-actions">
        <summary>Acciones <ChevronDown size={13} aria-hidden="true" /></summary>
        <div className="follow-up-actions-menu">
          <Link href={`/opportunities/${opportunity.id}`}><ExternalLink size={14} /> Abrir oportunidad</Link>

          {nextFollowUp && (
            <form
              action={registerAction}
              onSubmit={(event) => {
                if (!window.confirm(nextFollowUp.confirm)) event.preventDefault();
              }}
            >
              <MenuSubmitButton icon="check" label={nextFollowUp.label} />
            </form>
          )}

          <button onClick={() => rescheduleDialog.current?.showModal()} type="button">
            <RefreshCw size={14} /> Reprogramar
          </button>

          {canMarkResponded && (
            <form
              action={respondedAction}
              onSubmit={(event) => {
                if (!window.confirm("¿Confirmas que el cliente respondió? Se cancelará este seguimiento pendiente.")) {
                  event.preventDefault();
                }
              }}
            >
              <MenuSubmitButton icon="reply" label="Marcar respondió" />
            </form>
          )}

          <button className="follow-up-lost-action" onClick={() => lostDialog.current?.showModal()} type="button">
            <XCircle size={14} /> Marcar perdida
          </button>
        </div>
      </details>

      <dialog
        className="action-dialog"
        ref={rescheduleDialog}
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
      >
        <form action={rescheduleFormAction} className="action-dialog-card">
          <div className="action-dialog-heading">
            <div><span>Seguimiento</span><h2>Reprogramar contacto</h2></div>
            <button aria-label="Cerrar" onClick={() => rescheduleDialog.current?.close()} type="button">×</button>
          </div>
          <p className="action-dialog-description">Elige cuándo quieres volver a contactar por <strong>{opportunity.title}</strong>.</p>
          {rescheduleState.message && <p className="form-error" role="alert">{rescheduleState.message}</p>}
          <div className="field-group">
            <label htmlFor={`schedule-${opportunity.id}`}>Nueva fecha y hora</label>
            <input
              id={`schedule-${opportunity.id}`}
              name="next_follow_up_at"
              type="datetime-local"
              defaultValue={dateTimeInputValue(opportunity.next_follow_up_at)}
              required
              disabled={reschedulePending}
              aria-invalid={Boolean(rescheduleState.errors?.next_follow_up_at)}
            />
            {rescheduleState.errors?.next_follow_up_at && <span className="field-error">{rescheduleState.errors.next_follow_up_at}</span>}
          </div>
          <div className="action-dialog-footer">
            <button className="button" disabled={reschedulePending} onClick={() => rescheduleDialog.current?.close()} type="button">Cancelar</button>
            <button className="button button-primary" disabled={reschedulePending} type="submit">
              {reschedulePending ? <LoaderCircle className="spin" size={14} /> : <RefreshCw size={14} />}
              {reschedulePending ? "Guardando…" : "Reprogramar"}
            </button>
          </div>
        </form>
      </dialog>

      <dialog
        className="action-dialog"
        ref={lostDialog}
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
      >
        <form action={lostFormAction} className="action-dialog-card">
          <div className="action-dialog-heading">
            <div><span>Cierre</span><h2>Marcar como perdida</h2></div>
            <button aria-label="Cerrar" onClick={() => lostDialog.current?.close()} type="button">×</button>
          </div>
          <p className="action-dialog-description">El seguimiento pendiente se cancelará y conservarás los hitos anteriores.</p>
          {lostState.message && <p className="form-error" role="alert">{lostState.message}</p>}
          <div className="field-group">
            <label htmlFor={`lost-date-${opportunity.id}`}>Fecha de cierre</label>
            <input
              id={`lost-date-${opportunity.id}`}
              name="lost_at"
              type="date"
              defaultValue={today}
              required
              disabled={lostPending}
              aria-invalid={Boolean(lostState.errors?.lost_at)}
            />
            {lostState.errors?.lost_at && <span className="field-error">{lostState.errors.lost_at}</span>}
          </div>
          <div className="field-group">
            <label htmlFor={`lost-reason-${opportunity.id}`}>Motivo</label>
            <select
              id={`lost-reason-${opportunity.id}`}
              name="lost_reason_id"
              defaultValue={noResponseReason?.id ?? ""}
              required
              disabled={lostPending}
              aria-invalid={Boolean(lostState.errors?.lost_reason_id)}
            >
              <option value="">Seleccionar motivo</option>
              {lostReasons.map((reason) => <option key={reason.id} value={reason.id}>{reason.name}</option>)}
            </select>
            {lostState.errors?.lost_reason_id && <span className="field-error">{lostState.errors.lost_reason_id}</span>}
          </div>
          <div className="field-group">
            <label htmlFor={`lost-notes-${opportunity.id}`}>Detalle opcional</label>
            <textarea
              id={`lost-notes-${opportunity.id}`}
              name="lost_reason_notes"
              rows={3}
              maxLength={2000}
              disabled={lostPending}
              placeholder="Contexto breve sobre el cierre…"
              aria-invalid={Boolean(lostState.errors?.lost_reason_notes)}
            />
            {lostState.errors?.lost_reason_notes && <span className="field-error">{lostState.errors.lost_reason_notes}</span>}
          </div>
          <div className="action-dialog-footer">
            <button className="button" disabled={lostPending} onClick={() => lostDialog.current?.close()} type="button">Cancelar</button>
            <button className="danger-button" disabled={lostPending} type="submit">
              {lostPending ? <LoaderCircle className="spin" size={14} /> : <XCircle size={14} />}
              {lostPending ? "Guardando…" : "Marcar perdida"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}

function MenuSubmitButton({ icon, label }: { icon: "check" | "reply"; label: string }) {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} type="submit">
      {pending
        ? <LoaderCircle className="spin" size={14} />
        : icon === "check"
          ? <Check size={14} />
          : <MessageCircleReply size={14} />}
      {pending ? "Guardando…" : label}
    </button>
  );
}
