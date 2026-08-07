"use client";

import { useEffect } from "react";
import "./globals.css";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="es">
      <body>
        <main className="standalone-state-page">
          <section className="panel empty-state" role="alert">
            <span className="brand-mark" aria-hidden="true">W</span>
            <h1>No pudimos abrir Prospecta</h1>
            <p>Ocurrió un error inesperado. Intenta cargar la aplicación nuevamente.</p>
            <button className="button button-primary" onClick={retry} type="button">Reintentar</button>
          </section>
        </main>
      </body>
    </html>
  );
}
