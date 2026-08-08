import { ArrowUpRight, BriefcaseBusiness, ClipboardPaste, Search } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge, PrimaryLink } from "@/components/ui";
import { opportunityStages, stageLabels } from "@/features/opportunities/constants";
import { getOpportunities, getOpportunityFormOptions } from "@/features/opportunities/queries";
import { formatBudget, formatDate, formatDateTime, formatMoney, stageTone } from "@/features/opportunities/utils";

const headers = ["Proyecto", "Cliente", "Estado", "Presupuesto", "Precio planeado", "Experimento", "Seguimiento", "Fecha"];

function stringParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

export default async function OpportunitiesPage({ searchParams }: PageProps<"/opportunities">) {
  const params = await searchParams;
  const filters = {
    q: stringParam(params.q),
    stage: stringParam(params.stage),
    client: stringParam(params.client),
    experiment: stringParam(params.experiment),
    status: stringParam(params.status),
  };
  const [opportunities, options] = await Promise.all([
    getOpportunities(filters),
    getOpportunityFormOptions(),
  ]);
  const hasFilters = Object.values(filters).some(Boolean);
  const deleted = params.deleted === "1";

  return (
    <>
      <PageHeader
        eyebrow="Prospección"
        title="Oportunidades"
        description="Organiza cada proyecto potencial desde que lo detectas hasta su cierre."
        actions={(
          <>
            <Link className="button" href="/opportunities/import"><ClipboardPaste size={16} aria-hidden="true" /> Pegar desde Workana</Link>
            <PrimaryLink href="/opportunities/new">Nueva oportunidad</PrimaryLink>
          </>
        )}
      />

      {deleted && <div className="feedback-banner feedback-success" role="status">Oportunidad eliminada correctamente.</div>}

      <section className="panel">
        <form className="table-toolbar opportunity-toolbar" method="get">
          <Link className="button mobile-import-link" href="/opportunities/import"><ClipboardPaste size={15} aria-hidden="true" /> Pegar desde Workana</Link>
          <label className="search-field">
            <span className="sr-only">Buscar oportunidades</span>
            <Search size={15} aria-hidden="true" />
            <input defaultValue={filters.q} name="q" placeholder="Buscar proyecto o cliente…" type="search" />
          </label>
          <div className="filter-row">
            <select aria-label="Filtrar por estado" className="filter-select" defaultValue={filters.status} name="status">
              <option value="">Todas</option>
              <option value="active">Activas</option>
              <option value="closed">Cerradas</option>
            </select>
            <select aria-label="Filtrar por etapa" className="filter-select" defaultValue={filters.stage} name="stage">
              <option value="">Todas las etapas</option>
              {opportunityStages.map((stage) => <option key={stage} value={stage}>{stageLabels[stage]}</option>)}
            </select>
            <select aria-label="Filtrar por cliente" className="filter-select" defaultValue={filters.client} name="client">
              <option value="">Todos los clientes</option>
              {options.clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
            </select>
            <select aria-label="Filtrar por experimento" className="filter-select" defaultValue={filters.experiment} name="experiment">
              <option value="">Todos los experimentos</option>
              {options.experiments.map((experiment) => <option key={experiment.id} value={experiment.id}>{experiment.name}</option>)}
            </select>
            {hasFilters && <Link className="filter-chip filter-link" href="/opportunities">Limpiar</Link>}
            <button className="filter-chip" type="submit">Aplicar</button>
          </div>
        </form>
        <div className="table-scroll">
          <table className="data-table opportunities-table">
            <thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
            <tbody>
              {opportunities.length === 0 ? (
                <tr><td className="empty-table-cell" colSpan={headers.length}>
                  <EmptyState
                    icon={BriefcaseBusiness}
                    title={hasFilters ? "No encontramos oportunidades" : "Todavía no has registrado oportunidades"}
                    description={hasFilters ? "Prueba con otros filtros o limpia la búsqueda." : "Añade un proyecto interesante en segundos y empieza a organizar tu seguimiento."}
                    action={!hasFilters ? <PrimaryLink href="/opportunities/new">Nueva oportunidad</PrimaryLink> : undefined}
                  />
                </td></tr>
              ) : opportunities.map((opportunity) => (
                <tr className="data-row" key={opportunity.id}>
                  <td>
                    <Link className="client-name-link" href={`/opportunities/${opportunity.id}`}>
                      <span>{opportunity.title}</span><ArrowUpRight size={13} aria-hidden="true" />
                    </Link>
                  </td>
                  <td>{opportunity.clients ? <Link className="table-link" href={`/clients/${opportunity.clients.id}`}>{opportunity.clients.name}</Link> : "—"}</td>
                  <td><Badge tone={stageTone(opportunity.stage)}>{stageLabels[opportunity.stage as keyof typeof stageLabels] ?? opportunity.stage}</Badge></td>
                  <td className="currency-cell">{formatBudget(opportunity.published_budget_min, opportunity.published_budget_max, opportunity.published_budget_currency)}</td>
                  <td className="currency-cell">{formatMoney(opportunity.planned_price, opportunity.planned_price_currency)}</td>
                  <td>{opportunity.experiments ? <><span className="table-primary">{opportunity.experiments.name}</span>{opportunity.experiment_variants && <span className="table-secondary">{opportunity.experiment_variants.code}</span>}</> : "—"}</td>
                  <td>{formatDateTime(opportunity.next_follow_up_at)}</td>
                  <td>{formatDate(opportunity.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
