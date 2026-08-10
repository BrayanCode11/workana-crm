"use client";

import { Bot, Check, Copy, LoaderCircle, Send, Sparkles } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { registerCommercialAction, type CommercialActionState } from "@/features/automation/actions";
import type { OpportunityWithRelations } from "@/features/opportunities/types";
import { formatDateTime } from "@/features/opportunities/utils";
import { generateProjectAnalysisAction, generateProposalAction, registerInboundAndAnalyzeAction, type AiActionState } from "./actions";
import { projectAnalysisSchema, proposalSchema, replyAnalysisSchema, type ProjectAnalysis, type Proposal, type ReplyAnalysis } from "./schemas";

function latest<T>(opportunity: OpportunityWithRelations, type: string, parser: { safeParse(value: unknown): { success: boolean; data?: T } }) {
  const row = opportunity.ai_generations?.find((item) => item.generation_type === type);
  const parsed = row ? parser.safeParse(row.structured_data) : null;
  return parsed?.success ? parsed.data ?? null : null;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return <button className="button button-small" type="button" onClick={async () => { await navigator.clipboard.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }}>
    {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copiado" : "Copiar"}
  </button>;
}

function GeneratedMessage({ label, initialValue, actionLabel, onRegister }: { label: string; initialValue: string; actionLabel: string; onRegister: (value: string) => Promise<CommercialActionState> }) {
  const [value, setValue] = useState(initialValue);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<CommercialActionState>({});
  return <div className="ai-message-editor">
    <div className="ai-message-heading"><strong>{label}</strong><CopyButton value={value} /></div>
    <textarea value={value} onChange={(event) => setValue(event.target.value)} rows={5} aria-label={label} />
    <div className="ai-inline-actions">
      <button className="button button-primary" disabled={pending || !value.trim()} type="button" onClick={() => startTransition(async () => setFeedback(await onRegister(value)))}>
        {pending ? <LoaderCircle className="spin" size={14} /> : <Send size={14} />} {pending ? "Registrando…" : actionLabel}
      </button>
      {feedback.message && <span className={feedback.ok ? "inline-success" : "field-error"} role="status">{feedback.message}</span>}
    </div>
  </div>;
}

export function OpportunityAssistant({ opportunity }: { opportunity: OpportunityWithRelations }) {
  const analysis = latest<ProjectAnalysis>(opportunity, "project_analysis", projectAnalysisSchema);
  const reply = latest<ReplyAnalysis>(opportunity, "reply_analysis", replyAnalysisSchema);
  const proposal = latest<Proposal>(opportunity, "proposal", proposalSchema);
  const [incoming, setIncoming] = useState("");
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<AiActionState>({});
  const messages = useMemo(() => opportunity.opportunity_messages ?? [], [opportunity.opportunity_messages]);
  const run = (task: () => Promise<AiActionState>) => startTransition(async () => setFeedback(await task()));
  const send = (action: Parameters<typeof registerCommercialAction>[1]) => (content: string) => registerCommercialAction(opportunity.id, action, content);

  return <section className="panel ai-assistant section" aria-labelledby="ai-assistant-title">
    <div className="section-heading ai-assistant-header">
      <div><span className="eyebrow"><Bot size={14} /> Asistente contextual</span><h2 id="ai-assistant-title">Análisis y conversación</h2><p className="section-description">La IA propone; tú revisas, copias y confirmas cada acción comercial.</p></div>
      <button className="button button-primary" disabled={pending} type="button" onClick={() => run(() => generateProjectAnalysisAction(opportunity.id))}>
        {pending ? <LoaderCircle className="spin" size={15} /> : <Sparkles size={15} />} {analysis ? "Regenerar análisis" : "Analizar proyecto"}
      </button>
    </div>
    {feedback.message && <div className={`feedback-banner ${feedback.ok ? "feedback-success" : "feedback-error"}`} role="status">{feedback.message}</div>}

    {!analysis ? <div className="ai-empty"><Bot size={22} /><div><strong>Aún no hay análisis</strong><p>Se generará solo al pulsar el botón y nunca enviará mensajes automáticamente.</p></div></div> : <>
      <div className="ai-insight-grid">
        <article><span>Resumen</span><p>{analysis.summary}</p></article>
        <article><span>Complejidad · Encaje</span><strong>{analysis.complexity} · {analysis.fit}</strong><p>{analysis.next_best_action}</p></article>
        <article><span>Información faltante</span>{analysis.missing_information.length ? <ul>{analysis.missing_information.map((item) => <li key={item}>{item}</li>)}</ul> : <p>Ninguna detectada.</p>}</article>
        <article><span>Riesgos</span>{analysis.risks.length ? <ul>{analysis.risks.map((item) => <li key={item}>{item}</li>)}</ul> : <p>Ninguno detectado.</p>}</article>
        <article><span>Precio sugerido</span><strong>{analysis.pricing.currency ?? "—"} {analysis.pricing.target ?? "—"}</strong><p>Rango {analysis.pricing.min ?? "—"}–{analysis.pricing.max ?? "—"} · incertidumbre {analysis.pricing.uncertainty}</p></article>
        <article><span>Preparación de propuesta</span><strong>{analysis.proposal_readiness.status} · {analysis.proposal_readiness.confidence}</strong><p>{analysis.proposal_readiness.critical_pending.join(" · ") || "Sin pendientes críticos detectados."}</p></article>
      </div>
      {!opportunity.first_contacted_at && <GeneratedMessage label="Apertura sugerida" initialValue={analysis.initial_message} actionLabel="Consulta enviada" onRegister={send("initial_sent")} />}
      {opportunity.first_contacted_at && !opportunity.follow_up_1_at && <GeneratedMessage label="Seguimiento F1" initialValue={analysis.follow_up_1} actionLabel="F1 enviado" onRegister={send("follow_up_1_sent")} />}
      {opportunity.follow_up_1_at && !opportunity.follow_up_2_at && <GeneratedMessage label="Seguimiento F2" initialValue={analysis.follow_up_2} actionLabel="F2 enviado" onRegister={send("follow_up_2_sent")} />}
    </>}

    <div className="ai-conversation section">
      <div className="section-heading"><div><h3>Conversación</h3><p className="section-description">Registra únicamente mensajes que realmente se enviaron o recibieron.</p></div></div>
      {messages.length > 0 && <div className="message-timeline">{messages.map((message) => <article className={`message-item message-${message.direction}`} key={message.id}><div><strong>{message.direction === "inbound" ? "Cliente" : "Tú"}</strong><span>{formatDateTime(message.created_at)}</span></div><p>{message.content}</p></article>)}</div>}
      <div className="field-group"><label htmlFor="incoming-reply">Nueva respuesta del cliente</label><textarea id="incoming-reply" rows={5} value={incoming} onChange={(event) => setIncoming(event.target.value)} placeholder="Pega aquí la respuesta recibida…" /></div>
      <button className="button" type="button" disabled={pending || !incoming.trim()} onClick={() => run(async () => { const result = await registerInboundAndAnalyzeAction(opportunity.id, incoming); if (result.saved) setIncoming(""); return result; })}>{pending ? <LoaderCircle className="spin" size={14} /> : <Sparkles size={14} />} Guardar y analizar respuesta</button>
      {reply && <GeneratedMessage label="Respuesta sugerida" initialValue={reply.suggested_reply} actionLabel="Respuesta enviada" onRegister={send("outbound_reply_sent")} />}
    </div>

    <div className="ai-proposal section">
      <div className="section-heading"><div><h3>Propuesta</h3><p className="section-description">Se basa en el proyecto y la conversación registrada.</p></div><button className="button" type="button" disabled={pending} onClick={() => run(() => generateProposalAction(opportunity.id))}><Sparkles size={14} /> {proposal ? "Regenerar" : "Generar propuesta"}</button></div>
      {proposal && <><div className="ai-proposal-summary"><strong>{proposal.estimated_timeline}</strong><span>{proposal.price.currency ?? "—"} {proposal.price.target ?? "—"}</span></div>{proposal.readiness_warning && <div className="feedback-banner feedback-warning">{proposal.readiness_warning}</div>}<GeneratedMessage label="Propuesta para Workana" initialValue={proposal.workana_proposal} actionLabel="Propuesta enviada" onRegister={send("proposal_sent")} /></>}
    </div>
  </section>;
}
