import { ArrowLeft, ExternalLink, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui";
import { DeleteClientButton } from "@/features/clients/delete-client-button";
import { getClient } from "@/features/clients/queries";
import {
  formatCurrency,
  formatCurrencyGroups,
  formatDate,
  getClientMetrics,
  stageLabels,
} from "@/features/clients/utils";

export async function generateMetadata({ params }: PageProps<"/clients/[id]">) {
  const { id } = await params;
  const client = await getClient(id);
  return { title: client?.name ?? "Cliente" };
}

export default async function ClientDetailPage({
  params,
  searchParams,
}: PageProps<"/clients/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const client = await getClient(id);
  if (!client) notFound();

  const metrics = getClientMetrics(client.opportunities);
  const feedback = query.created === "1"
    ? "Cliente creado correctamente."
    : query.updated === "1"
      ? "Cliente actualizado correctamente."
      : null;

  return (
    <>
      <Link className="back-link" href="/clients"><ArrowLeft size={14} /> Todos los clientes</Link>

      <header className="detail-header">
        <div>
          <div className="detail-title-row">
            <h1>{client.name}</h1>
            {metrics.total > 1 && <Badge tone="success">Cliente recurrente</Badge>}
          </div>
          <p>{[client.company_name, client.country].filter(Boolean).join(" · ") || "Sin empresa ni país registrados"}</p>
        </div>
        <div className="page-actions">
          <Link className="button" href={`/clients/${client.id}/edit`}><Pencil size={15} /> Editar</Link>
          <Link className="button button-primary" href={`/opportunities/new?client=${client.id}`}>
            <Plus size={15} /> Nueva oportunidad
          </Link>
        </div>
      </header>

      {feedback && <div className="feedback-banner feedback-success">{feedback}</div>}

      <section className="client-metrics" aria-label="Resumen del cliente">
        <div><span>Oportunidades</span><strong>{metrics.total}</strong></div>
        <div><span>Activas</span><strong>{metrics.active}</strong></div>
        <div><span>Ganadas</span><strong>{metrics.won}</strong></div>
        <div><span>Perdidas</span><strong>{metrics.lost}</strong></div>
        <div className="client-value-metric"><span>Valor total ganado</span><strong>{formatCurrencyGroups(metrics.wonByCurrency)}</strong></div>
      </section>

      <div className="client-detail-grid section">
        <section className="panel detail-panel">
          <div className="section-heading"><h2>Información</h2></div>
          <dl className="detail-list">
            <div><dt>Nombre</dt><dd>{client.name}</dd></div>
            <div><dt>Empresa</dt><dd>{client.company_name ?? "—"}</dd></div>
            <div><dt>País</dt><dd>{client.country ?? "—"}</dd></div>
            <div>
              <dt>Perfil Workana</dt>
              <dd>{client.workana_profile_url ? (
                <a className="external-link" href={client.workana_profile_url} target="_blank" rel="noreferrer">
                  Abrir perfil <ExternalLink size={13} />
                </a>
              ) : "—"}</dd>
            </div>
          </dl>
        </section>

        <section className="panel detail-panel">
          <div className="section-heading"><h2>Notas</h2></div>
          <p className={client.notes ? "client-notes" : "client-notes client-notes-empty"}>
            {client.notes ?? "No hay notas sobre este cliente."}
          </p>
        </section>
      </div>

      <section className="section">
        <div className="section-heading">
          <h2>Oportunidades</h2>
          <span className="section-count">{metrics.total}</span>
        </div>
        <div className="panel table-scroll">
          <table className="data-table client-opportunities-table">
            <thead><tr><th>Proyecto</th><th>Estado</th><th>Precio</th><th>Resultado</th><th>Fecha</th></tr></thead>
            <tbody>
              {client.opportunities.length === 0 ? (
                <tr><td className="empty-table-cell" colSpan={5}>
                  <div className="inline-empty-state">
                    <p>Este cliente todavía no tiene oportunidades.</p>
                    <Link className="button" href={`/opportunities/new?client=${client.id}`}><Plus size={14} /> Crear oportunidad</Link>
                  </div>
                </td></tr>
              ) : client.opportunities.map((opportunity) => (
                <tr className="data-row" key={opportunity.id}>
                  <td><Link className="client-name-link" href={`/opportunities/${opportunity.id}`}>{opportunity.title}</Link></td>
                  <td><Badge tone={opportunity.stage === "won" ? "success" : opportunity.stage === "lost" ? "warning" : "neutral"}>{stageLabels[opportunity.stage] ?? opportunity.stage}</Badge></td>
                  <td>{opportunity.planned_price !== null && opportunity.planned_price_currency ? formatCurrency(opportunity.planned_price, opportunity.planned_price_currency) : "—"}</td>
                  <td>{opportunity.final_value !== null && opportunity.final_value_currency ? formatCurrency(opportunity.final_value, opportunity.final_value_currency) : opportunity.lost_at ? "Perdida" : "Pendiente"}</td>
                  <td>{formatDate(opportunity.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="danger-zone section">
        <div>
          <h2>Eliminar cliente</h2>
          <p>{metrics.total > 0 ? "No puede eliminarse mientras tenga oportunidades asociadas." : "Elimina definitivamente este cliente del CRM."}</p>
        </div>
        <DeleteClientButton clientId={client.id} disabled={metrics.total > 0} />
      </section>
    </>
  );
}
