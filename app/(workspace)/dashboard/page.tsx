import { ArrowUpRight, CalendarClock, CheckCircle2, ClipboardPaste, ClockAlert, Users } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Badge, PrimaryLink } from "@/components/ui";
import { formatCurrencyGroups } from "@/features/clients/utils";
import { getDashboardData } from "@/features/dashboard/queries";
import { getDashboardMetrics } from "@/features/dashboard/utils";
import { formatRate } from "@/features/experiments/utils";
import { formatDateTime } from "@/features/opportunities/utils";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const metrics = getDashboardMetrics(data);
  const urgentFollowUps = [...metrics.followUps.overdue, ...metrics.followUps.today].slice(0, 5);
  const kpis = [
    { label: "Oportunidades activas", value: String(metrics.active), note: "Todas excepto ganadas y perdidas" },
    { label: "Esperando respuesta", value: String(metrics.waiting), note: "Contacto y seguimientos actuales" },
    { label: "Tasa de respuesta", value: formatRate(metrics.responseRate), note: `${metrics.responded} de ${metrics.contacted} contactos` },
    { label: "Tasa de cierre", value: formatRate(metrics.closeRate), note: `${metrics.won} de ${metrics.contacted} contactos` },
    { label: "Respondieron", value: String(metrics.responded), note: "Según su primer hito de respuesta" },
    { label: "Propuestas", value: String(metrics.proposals), note: "Oportunidades que alcanzaron propuesta" },
    { label: "Negociaciones", value: String(metrics.negotiations), note: "Oportunidades que alcanzaron negociación" },
    { label: "Ganados", value: String(metrics.won), note: "Según fecha histórica de cierre" },
    { label: "Perdidos", value: String(metrics.lost), note: "Según fecha histórica de pérdida" },
    { label: "Valor total ganado", value: formatCurrencyGroups(metrics.wonByCurrency), note: "Sin mezclar ni convertir monedas", money: true },
    { label: "Clientes", value: String(metrics.clients), note: `${metrics.clientsWithActiveOpportunities} con oportunidades activas` },
    { label: "Clientes recurrentes", value: String(metrics.recurrentClients), note: "Con más de una oportunidad" },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Resumen general"
        title="Dashboard"
        description="Tu prospección, el pipeline y los seguimientos importantes en un solo lugar."
        className="dashboard-page-header"
        actions={(
          <>
            <PrimaryLink href="/opportunities/new">Agregar oportunidad</PrimaryLink>
            <Link className="button" href="/opportunities/import">
              <ClipboardPaste size={16} aria-hidden="true" /> Pegar desde Workana
            </Link>
          </>
        )}
      />

      <section className="dashboard-kpi-grid" aria-label="Indicadores principales">
        {kpis.map((metric) => (
          <article className="metric" key={metric.label}>
            <span className="metric-label">{metric.label}</span>
            <strong className={`metric-value ${metric.money ? "metric-value-money" : ""}`}>{metric.value}</strong>
            <span className="metric-note">{metric.note}</span>
          </article>
        ))}
      </section>

      <section className="panel attention-panel section" aria-labelledby="attention-title">
        <div className="section-heading"><div><h2 id="attention-title">Requieren atención</h2><p className="section-description">Acciones comerciales pendientes calculadas con mensajes e hitos reales.</p></div></div>
        <div className="attention-grid">
          <Link href="/opportunities?stage=detected"><span>Consultas por enviar</span><strong>{data.attention.consultationPending}</strong></Link>
          <Link href="/follow-ups?period=overdue"><span>F1 pendientes<small>{data.attention.followUp1Prepared} con mensaje preparado</small></span><strong>{data.attention.followUp1Pending}</strong></Link>
          <Link href="/follow-ups?period=overdue"><span>F2 pendientes<small>{data.attention.followUp2Prepared} con mensaje preparado</small></span><strong>{data.attention.followUp2Pending}</strong></Link>
          <Link href="/opportunities?stage=responded"><span>Respuestas sin contestar</span><strong>{data.attention.repliesPending}</strong></Link>
        </div>
      </section>

      <div className="dashboard-grid section">
        <div>
          <div className="section-heading">
            <div>
              <h2>Necesitan seguimiento</h2>
              <p className="section-description">Prioridad operativa: vencidos y contactos programados para hoy.</p>
            </div>
            <Link className="section-link" href="/follow-ups">
              Ver todos <ArrowUpRight size={12} aria-hidden="true" />
            </Link>
          </div>

          <section className="panel dashboard-follow-up-panel">
            <div className="dashboard-follow-up-counts">
              <Link className="follow-up-box follow-up-box-overdue" href="/follow-ups?period=overdue">
                <ClockAlert size={17} aria-hidden="true" />
                <strong className="follow-up-count">{metrics.followUps.overdue.length}</strong>
                <span className="follow-up-label">Vencidos</span>
              </Link>
              <Link className="follow-up-box follow-up-box-today" href="/follow-ups?period=today">
                <CalendarClock size={17} aria-hidden="true" />
                <strong className="follow-up-count">{metrics.followUps.today.length}</strong>
                <span className="follow-up-label">Para hoy</span>
              </Link>
            </div>

            <div className="dashboard-follow-up-list">
              {urgentFollowUps.length === 0 ? (
                <div className="dashboard-follow-up-empty">
                  <CheckCircle2 size={18} aria-hidden="true" />
                  <div><strong>Agenda al día</strong><span>No tienes seguimientos vencidos ni para hoy.</span></div>
                </div>
              ) : urgentFollowUps.map((opportunity) => {
                const overdue = metrics.followUps.overdue.some((item) => item.id === opportunity.id);
                const prepared = opportunity.follow_up_1_at
                  ? Boolean(opportunity.follow_up_2_message?.trim())
                  : Boolean(opportunity.follow_up_1_message?.trim());
                return (
                  <Link className="dashboard-follow-up-item" href={`/opportunities/${opportunity.id}`} key={opportunity.id}>
                    <div>
                      <strong>{opportunity.title}</strong>
                      <span>{opportunity.clients?.name ?? "Sin cliente"} · {formatDateTime(opportunity.next_follow_up_at)}</span>
                    </div>
                    <Badge tone={overdue ? "warning" : "success"}>{overdue ? "Vencido" : "Hoy"}{prepared ? " · Mensaje preparado" : " · Sin mensaje"}</Badge>
                  </Link>
                );
              })}
            </div>
          </section>

          <div className="section-heading section">
            <div>
              <h2>Pipeline actual</h2>
              <p className="section-description">Distribución compacta según la etapa actual de cada oportunidad.</p>
            </div>
            <Link className="section-link" href="/pipeline">
              Abrir pipeline <ArrowUpRight size={12} aria-hidden="true" />
            </Link>
          </div>
          <section className="panel pipeline-summary" aria-label="Resumen por etapa">
            {data.pipelineStages.map((stage) => (
              <Link className="pipeline-summary-item" href={`/opportunities?stage=${stage.slug}`} key={stage.slug}>
                <span>{stage.name}</span>
                <strong>{metrics.stageCounts[stage.slug] ?? 0}</strong>
              </Link>
            ))}
          </section>
        </div>

        <aside className="dashboard-side-stack">
          <section className="panel dashboard-side-panel">
            <div className="dashboard-side-heading">
              <span>Resultados</span>
              <ArrowUpRight size={14} aria-hidden="true" />
            </div>
            <dl className="dashboard-mini-metrics">
              <div><dt>Contactados</dt><dd>{metrics.contacted}</dd></div>
              <div><dt>Cierre sobre propuestas</dt><dd>{formatRate(metrics.proposalCloseRate)}</dd></div>
              <div className="dashboard-mini-metric-wide"><dt>Valor ganado</dt><dd>{formatCurrencyGroups(metrics.wonByCurrency)}</dd></div>
            </dl>
            <Link className="section-link dashboard-panel-link" href="/opportunities?status=closed">Ver resultados cerrados <ArrowUpRight size={12} /></Link>
          </section>

          <section className="panel dashboard-side-panel">
            <div className="dashboard-side-heading">
              <span>Clientes</span>
              <Users size={15} aria-hidden="true" />
            </div>
            <dl className="dashboard-mini-metrics">
              <div><dt>Totales</dt><dd>{metrics.clients}</dd></div>
              <div><dt>Recurrentes</dt><dd>{metrics.recurrentClients}</dd></div>
              <div className="dashboard-mini-metric-wide"><dt>Con oportunidades activas</dt><dd>{metrics.clientsWithActiveOpportunities}</dd></div>
            </dl>
            <Link className="section-link dashboard-panel-link" href="/clients">Abrir clientes <ArrowUpRight size={12} /></Link>
          </section>

          <section className="panel dashboard-method-note">
            <strong>Métricas históricas fiables</strong>
            <p>Respuestas, propuestas y cierres se cuentan por sus fechas de hito, aunque la oportunidad haya avanzado a otra etapa.</p>
          </section>
        </aside>
      </div>
    </>
  );
}
