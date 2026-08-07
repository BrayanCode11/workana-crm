import { SearchX } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="standalone-state-page">
      <section className="panel empty-state" aria-labelledby="not-found-title">
        <span className="empty-icon" aria-hidden="true"><SearchX size={21} /></span>
        <h1 id="not-found-title">Página no encontrada</h1>
        <p>La dirección no existe o el registro ya no está disponible.</p>
        <Link className="button button-primary" href="/dashboard">Volver al dashboard</Link>
      </section>
    </main>
  );
}
