"use client";

import { Check, Copy, LoaderCircle, Save, Send } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { registerCommercialAction, type CommercialActionState } from "@/features/automation/actions";
import { copyText } from "@/lib/copy-text";
import { savePreparedMessagesAction, type PreparedMessagesState } from "./prepared-message-actions";
import { preparedMessageFields, type PreparedMessageKey, type PreparedMessages } from "./prepared-messages";

const initialState: PreparedMessagesState = {};

export function PreparedMessagesForm({
  opportunityId,
  messages,
  stage,
  firstContactedAt,
  followUp1At,
  followUp2At,
}: {
  opportunityId: string;
  messages: PreparedMessages;
  stage: string;
  firstContactedAt: string | null;
  followUp1At: string | null;
  followUp2At: string | null;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<PreparedMessageKey, string>>({
    initial_message: messages.initial_message ?? "",
    follow_up_1_message: messages.follow_up_1_message ?? "",
    follow_up_2_message: messages.follow_up_2_message ?? "",
  });
  const [copied, setCopied] = useState<PreparedMessageKey | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [commercialFeedback, setCommercialFeedback] = useState<CommercialActionState>({});
  const [commercialPending, startCommercialTransition] = useTransition();
  const action = savePreparedMessagesAction.bind(null, opportunityId);
  const [state, formAction, savePending] = useActionState(action, initialState);

  const canSend: Record<PreparedMessageKey, boolean> = {
    initial_message: stage === "detected" && !firstContactedAt,
    follow_up_1_message: stage === "contacted" && Boolean(firstContactedAt) && !followUp1At,
    follow_up_2_message: stage === "follow_up_1" && Boolean(followUp1At) && !followUp2At,
  };

  const handleCopy = async (key: PreparedMessageKey) => {
    const success = await copyText(values[key]);
    if (!success) {
      setCopyError("No pudimos copiar. Selecciona el texto manualmente.");
      return;
    }
    setCopyError(null);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1800);
  };

  return (
    <section className="panel prepared-messages section" aria-labelledby="prepared-messages-title">
      <div className="section-heading prepared-messages-heading">
        <div>
          <h2 id="prepared-messages-title">Mensajes preparados</h2>
          <p className="section-description">Guarda aquí los tres textos obtenidos externamente. Preparado no significa enviado.</p>
        </div>
      </div>
      <form action={formAction}>
        <div className="prepared-messages-grid">
          {preparedMessageFields.map((item) => (
            <div className="prepared-message-block" key={item.key}>
              <div className="prepared-message-heading">
                <label htmlFor={item.key}>{item.label}</label>
                <button className="button button-small" type="button" disabled={!values[item.key]} onClick={() => handleCopy(item.key)}>
                  {copied === item.key ? <Check size={14} /> : <Copy size={14} />}
                  {copied === item.key ? `${item.label} copiado` : "Copiar"}
                </button>
              </div>
              <textarea
                id={item.key}
                name={item.key}
                rows={8}
                maxLength={20000}
                value={values[item.key]}
                disabled={savePending}
                onChange={(event) => setValues((current) => ({ ...current, [item.key]: event.target.value }))}
                placeholder={`Pega aquí ${item.label.toLocaleLowerCase("es")}…`}
                aria-invalid={Boolean(state.errors?.[item.key])}
              />
              {state.errors?.[item.key] && <span className="field-error">{state.errors[item.key]}</span>}
              {canSend[item.key] && (
                <button
                  className="button prepared-sent-button"
                  type="button"
                  disabled={commercialPending}
                  onClick={() => startCommercialTransition(async () => {
                    const result = await registerCommercialAction(opportunityId, item.action, values[item.key]);
                    setCommercialFeedback(result);
                    if (result.ok) router.refresh();
                  })}
                >
                  {commercialPending ? <LoaderCircle className="spin" size={14} /> : <Send size={14} />} {item.sentLabel}
                </button>
              )}
            </div>
          ))}
        </div>
        {copyError ? <div className="feedback-banner feedback-error" role="alert">{copyError}</div>
          : commercialFeedback.message ? <div className={`feedback-banner ${commercialFeedback.ok ? "feedback-success" : "feedback-error"}`} role="status">{commercialFeedback.message}</div>
            : state.message ? <div className={`feedback-banner ${state.ok ? "feedback-success" : "feedback-error"}`} role="status">{state.message}</div>
              : null}
        <div className="prepared-messages-footer">
          <span>Guardar o copiar no cambia la etapa, la cadencia ni las métricas.</span>
          <button className="button button-primary" disabled={savePending} type="submit">
            {savePending ? <LoaderCircle className="spin" size={15} /> : <Save size={15} />}
            {savePending ? "Guardando…" : "Guardar mensajes"}
          </button>
        </div>
      </form>
    </section>
  );
}
