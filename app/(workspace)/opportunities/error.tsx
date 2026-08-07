"use client";

import { CircleAlert, RotateCcw } from "lucide-react";

export default function OpportunitiesError({ reset }: { reset: () => void }) {
  return (
    <div className="panel empty-state">
      <span className="empty-icon" aria-hidden="true"><CircleAlert size={21} /></span>
      <h2>No pudimos cargar las oportunidades</h2>
      <p>Comprueba tu conexión e intenta nuevamente.</p>
      <button className="button" onClick={reset} type="button"><RotateCcw size={15} /> Reintentar</button>
    </div>
  );
}

