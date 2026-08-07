"use client";

import { CircleAlert, RotateCcw } from "lucide-react";
import { useEffect } from "react";

export function RouteError({
  error,
  retry,
  title,
}: {
  error: Error & { digest?: string };
  retry: () => void;
  title: string;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="panel empty-state" role="alert">
      <span className="empty-icon" aria-hidden="true"><CircleAlert size={21} /></span>
      <h2>{title}</h2>
      <p>Comprueba tu conexión e intenta nuevamente.</p>
      <button className="button" onClick={retry} type="button"><RotateCcw size={15} aria-hidden="true" /> Reintentar</button>
    </div>
  );
}
