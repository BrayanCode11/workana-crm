import { ArrowUpRight, CheckCircle2, Clock3 } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { PrimaryLink } from "@/components/ui";

const metrics = [
  { label: "Oportunidades activas", value: "0", note: "En 7 etapas abiertas" },
  { label: "Esperando respuesta", value: "0", note: "Contactados y seguimientos" },
  { label: "Tasa de respuesta", value: "—", note: "Sin contactos todavía" },
  { label: "Valor ganado", value: "—", note: "Agrupado por moneda" },
];

const stages = [
  "Detectado",
  "Contactado",
  "Seguimiento 1",
  "Seguimiento 2",
  "Respondió",
  "Propuesta",
  "Negociación",
  "Ganado",
  "Perdido",
];

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        eyebrow="Resumen general"
        title="Dashboard"
        description="Tu prospección, el pipeline y los seguimientos importantes en un solo lugar."
        actions={<PrimaryLink href="/opportunities/new">Nueva oportunidad</PrimaryLink>}
      />

      <section className="metrics-grid" aria-label="Indicadores principales">
        {metrics.map((metric) => (
          <article className="metric" key={metric.label}>
            <span className="metric-label">{metric.label}</span>
            <strong className="metric-value">{metric.value}</strong>
            <span className="metric-note">{metric.note}</span>
          </article>
        ))}
      </section>

      <div className="dashboard-grid section">
        <div>
          <div className="section-heading">
            <h2>Necesitan seguimiento</h2>
            <Link className="section-link" href="/follow-ups">
              Ver seguimientos <ArrowUpRight size={12} aria-hidden="true" />
            </Link>
          </div>
          <section className="panel follow-up-summary">
            <div className="follow-up-box">
              <strong className="follow-up-count">0</strong>
              <span className="follow-up-label">Vencidos</span>
            </div>
            <div className="follow-up-box">
              <strong className="follow-up-count">0</strong>
              <span className="follow-up-label">Para hoy</span>
            </div>
          </section>

          <div className="section-heading section">
            <h2>Pipeline</h2>
            <Link className="section-link" href="/pipeline">
              Abrir pipeline <ArrowUpRight size={12} aria-hidden="true" />
            </Link>
          </div>
          <section className="panel pipeline-summary" aria-label="Resumen por etapa">
            {stages.map((stage) => (
              <div className="pipeline-summary-item" key={stage}>
                <span>{stage}</span>
                <strong>0</strong>
              </div>
            ))}
          </section>
        </div>

        <aside className="panel setup-panel">
          <CheckCircle2 size={19} strokeWidth={1.7} aria-hidden="true" />
          <h2>Espacio listo para empezar</h2>
          <p>La estructura visual está preparada. En la próxima fase conectaremos tus datos de forma segura.</p>
          <ol className="setup-steps">
            <li>
              <span className="step-number">1</span>
              <span>Crear y conectar Supabase</span>
            </li>
            <li>
              <span className="step-number">2</span>
              <span>Configurar acceso privado</span>
            </li>
            <li>
              <span className="step-number">3</span>
              <span>Registrar la primera oportunidad</span>
            </li>
          </ol>
          <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 8, color: "#8fa098", fontSize: 10 }}>
            <Clock3 size={13} aria-hidden="true" />
            Sin acciones pendientes por ahora
          </div>
        </aside>
      </div>
    </>
  );
}
