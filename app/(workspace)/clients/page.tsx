import { ArrowUpRight, Search, Users } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge, PrimaryLink } from "@/components/ui";
import { getClients } from "@/features/clients/queries";
import {
  formatCurrencyGroups,
  formatDate,
  getClientMetrics,
} from "@/features/clients/utils";

const headers = ["Nombre", "Empresa", "País", "Oportunidades", "Activas", "Ganadas", "Valor ganado", "Última oportunidad"];

export default async function ClientsPage({ searchParams }: PageProps<"/clients">) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const deleted = params.deleted === "1";
  const clients = await getClients(query);

  return (
    <>
      <PageHeader
        eyebrow="Relaciones"
        title="Clientes"
        description="Reúne el historial comercial de cada persona y detecta clientes recurrentes."
        actions={<PrimaryLink href="/clients/new">Nuevo cliente</PrimaryLink>}
      />

      {deleted && <div className="feedback-banner feedback-success" role="status">Cliente eliminado correctamente.</div>}

      <section className="panel">
        <form className="table-toolbar" method="get">
          <label className="search-field">
            <span className="sr-only">Buscar clientes</span>
            <Search size={15} aria-hidden="true" />
            <input defaultValue={query} name="q" placeholder="Buscar nombre o empresa…" type="search" />
          </label>
          <div className="filter-row">
            {query && <Link className="filter-chip filter-link" href="/clients">Limpiar</Link>}
            <button className="filter-chip" type="submit">Buscar</button>
          </div>
        </form>
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
            <tbody>
              {clients.length === 0 ? (
                <tr><td className="empty-table-cell" colSpan={headers.length}>
                  <EmptyState
                    icon={Users}
                    title={query ? "No encontramos clientes" : "Todavía no has registrado clientes"}
                    description={query ? "Prueba con otro nombre o empresa." : "Crea el primer cliente o regístralo al añadir una oportunidad."}
                    action={!query ? <PrimaryLink href="/clients/new">Nuevo cliente</PrimaryLink> : undefined}
                  />
                </td></tr>
              ) : clients.map((client) => {
                const metrics = getClientMetrics(client.opportunities);

                return (
                  <tr className="data-row" key={client.id}>
                    <td>
                      <Link className="client-name-link" href={`/clients/${client.id}`}>
                        <span>{client.name}</span>
                        <ArrowUpRight size={13} aria-hidden="true" />
                      </Link>
                      {metrics.total > 1 && <Badge tone="success">Recurrente</Badge>}
                    </td>
                    <td>{client.company_name ?? "—"}</td>
                    <td>{client.country ?? "—"}</td>
                    <td className="numeric-cell">{metrics.total}</td>
                    <td className="numeric-cell">{metrics.active}</td>
                    <td className="numeric-cell">{metrics.won}</td>
                    <td className="currency-cell">{formatCurrencyGroups(metrics.wonByCurrency)}</td>
                    <td>{formatDate(metrics.lastOpportunityAt)}</td>
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
