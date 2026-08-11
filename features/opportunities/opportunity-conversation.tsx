"use client";

import { LoaderCircle, MessageCircleReply } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { registerInboundResponseAction, type CommercialActionState } from "@/features/automation/actions";
import type { Database } from "@/lib/supabase/database.types";
import { formatDateTime } from "./utils";

type OpportunityMessage = Database["public"]["Tables"]["opportunity_messages"]["Row"];

export function OpportunityConversation({ opportunityId, messages, closed }: { opportunityId: string; messages: OpportunityMessage[]; closed: boolean }) {
  const router = useRouter();
  const [incoming, setIncoming] = useState("");
  const [feedback, setFeedback] = useState<CommercialActionState>({});
  const [pending, startTransition] = useTransition();
  return (
    <section className="panel opportunity-conversation section" aria-labelledby="conversation-title">
      <div className="section-heading"><div><h2 id="conversation-title">Historial comercial</h2><p className="section-description">Solo contiene mensajes que realmente se enviaron o recibieron.</p></div></div>
      {messages.length ? (
        <div className="message-timeline">
          {messages.map((message) => (
            <article className={`message-item message-${message.direction}`} key={message.id}>
              <div><strong>{message.direction === "inbound" ? "Cliente" : "Tú"}</strong><span>{formatDateTime(message.created_at)}</span></div>
              <p>{message.content}</p>
            </article>
          ))}
        </div>
      ) : <p className="conversation-empty">Todavía no hay mensajes reales registrados.</p>}
      {!closed && (
        <div className="conversation-composer">
          <div className="field-group"><label htmlFor="incoming-reply">Registrar respuesta recibida</label><textarea id="incoming-reply" rows={5} value={incoming} maxLength={20000} onChange={(event) => setIncoming(event.target.value)} placeholder="Pega aquí el mensaje recibido del cliente…" /></div>
          <button className="button" type="button" disabled={pending || !incoming.trim()} onClick={() => startTransition(async () => {
            const result = await registerInboundResponseAction(opportunityId, incoming);
            setFeedback(result);
            if (result.ok) { setIncoming(""); router.refresh(); }
          })}>
            {pending ? <LoaderCircle className="spin" size={14} /> : <MessageCircleReply size={14} />} {pending ? "Guardando…" : "Registrar respuesta"}
          </button>
          {feedback.message && <span className={feedback.ok ? "inline-success" : "field-error"} role="status">{feedback.message}</span>}
        </div>
      )}
    </section>
  );
}
