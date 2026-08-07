import { PageHeader } from "@/components/page-header";
import { PrimaryLink } from "@/components/ui";

const stages = ["Detectado", "Contactado", "Seguimiento 1", "Seguimiento 2", "Respondió", "Propuesta", "Negociación", "Ganado", "Perdido"];

export default function PipelinePage() {
  return (
    <>
      <PageHeader
        eyebrow="Vista comercial"
        title="Pipeline"
        description="Visualiza el avance real de tus oportunidades. Cada etapa representa algo que ya ocurrió."
        actions={<PrimaryLink href="/opportunities/new">Nueva oportunidad</PrimaryLink>}
      />
      <div className="kanban-scroll">
        <section className="kanban-board" aria-label="Pipeline de oportunidades">
          {stages.map((stage) => (
            <article className="kanban-column" key={stage}>
              <header className="kanban-heading">
                <h2>{stage}</h2>
                <span className="kanban-count">0</span>
              </header>
              <p className="kanban-empty">Sin oportunidades</p>
            </article>
          ))}
        </section>
      </div>
    </>
  );
}
