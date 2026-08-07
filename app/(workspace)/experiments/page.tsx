import { ArrowUpRight, FlaskConical, Search } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge, PrimaryLink } from "@/components/ui";
import {
  experimentStatuses,
  experimentStatusLabels,
  experimentStatusTone,
} from "@/features/experiments/constants";
import { getExperiments } from "@/features/experiments/queries";
import {
  formatExperimentPeriod,
  formatRate,
  getExperimentMetrics,
} from "@/features/experiments/utils";

const headers = ["Experimento", "Estado", "Variantes", "Oportunidades", "Contactados", "Respuesta", "Ganados", "Periodo"];

function stringParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

export default async function ExperimentsPage({ searchParams }: PageProps<"/experiments">) {
  const params = await searchParams;
  const query = stringParam(params.q);
  const status = stringParam(params.status);
  const experiments = await getExperiments(query, status);
  const hasFilters = Boolean(query || status);
  const deleted = params.deleted === "1";

  return (
    <>
      <PageHeader
        eyebrow="Aprendizaje"
        title="Experimentos"
        description="Compara estrategias de contacto usando resultados reales y el tamaño de cada muestra."
        actions={<PrimaryLink href="/experiments/new">Nuevo experimento</PrimaryLink>}
      />

      {deleted && <div className="feedback-banner feedback-success" role="status">Experimento eliminado correctamente.</div>}

      <section className="panel">
        <form className="table-toolbar" method="get">
          <label className="search-field">
            <span className="sr-only">Buscar experimentos</span>
            <Search size={15} aria-hidden="true" />
            <input defaultValue={query} name="q" placeholder="Buscar experimento…" type="search" />
          </label>
          <div className="filter-row">
            <Link className="filter-chip filter-link experiment-toolbar-create" href="/experiments/new">Nuevo</Link>
            <select aria-label="Filtrar por estado" className="filter-select" defaultValue={status} name="status">
              <option value="">Todos los estados</option>
              {experimentStatuses.map((item) => <option key={item} value={item}>{experimentStatusLabels[item]}</option>)}
            </select>
            {hasFilters && <Link className="filter-chip filter-link" href="/experiments">Limpiar</Link>}
            <button className="filter-chip" type="submit">Aplicar</button>
          </div>
        </form>

        <div className="table-scroll">
          <table className="data-table experiments-table">
            <thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
            <tbody>
              {experiments.length === 0 ? (
                <tr><td className="empty-table-cell" colSpan={headers.length}>
                  <EmptyState
                    icon={FlaskConical}
                    title={hasFilters ? "No encontramos experimentos" : "Todavía no has creado experimentos"}
                    description={hasFilters ? "Prueba con otro nombre o estado." : "Crea variantes de estrategia y mide respuesta, propuestas y cierres sin guardar mensajes."}
                    action={!hasFilters ? <PrimaryLink href="/experiments/new">Nuevo experimento</PrimaryLink> : undefined}
                  />
                </td></tr>
              ) : experiments.map((experiment) => {
                const metrics = getExperimentMetrics(experiment.opportunities);
                return (
                  <tr className="data-row" key={experiment.id}>
                    <td>
                      <Link className="client-name-link" href={`/experiments/${experiment.id}`}>
                        <span>{experiment.name}</span><ArrowUpRight size={13} aria-hidden="true" />
                      </Link>
                      {experiment.description && <span className="table-secondary experiment-description-preview">{experiment.description}</span>}
                    </td>
                    <td><Badge tone={experimentStatusTone(experiment.status)}>{experimentStatusLabels[experiment.status as keyof typeof experimentStatusLabels] ?? experiment.status}</Badge></td>
                    <td className="numeric-cell">{experiment.experiment_variants.length}</td>
                    <td className="numeric-cell">{metrics.assigned}</td>
                    <td className="numeric-cell">{metrics.contacted}</td>
                    <td className="numeric-cell">{formatRate(metrics.responseRate)}</td>
                    <td className="numeric-cell">{metrics.won}</td>
                    <td>{formatExperimentPeriod(experiment.started_at, experiment.ended_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
