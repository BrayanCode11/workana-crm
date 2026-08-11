"use client";

import { Check, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";
import { copyText } from "@/lib/copy-text";

export function CopyChatGPTContext({ value }: { value: string }) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const copy = async () => {
    const copied = await copyText(value);
    setFeedback(copied ? "Contexto copiado." : "No pudimos copiar. Selecciona el texto manualmente.");
    window.setTimeout(() => setFeedback(null), 2200);
  };
  return (
    <div className="chatgpt-actions">
      <button className="button" type="button" onClick={copy} aria-label="Copiar contexto de la oportunidad para ChatGPT">
        {feedback === "Contexto copiado." ? <Check size={15} /> : <Copy size={15} />} Copiar para ChatGPT
      </button>
      <a className="button" href="https://chatgpt.com/" target="_blank" rel="noreferrer">
        <ExternalLink size={15} aria-hidden="true" /> Abrir ChatGPT <span className="sr-only">(abre en una pestaña nueva)</span>
      </a>
      {feedback && <span className={feedback === "Contexto copiado." ? "inline-success" : "field-error"} role="status">{feedback}</span>}
    </div>
  );
}
