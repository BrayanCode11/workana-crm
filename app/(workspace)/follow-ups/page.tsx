import { ArrowUpRight, CalendarCheck, Search } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui";
import { FollowUpActions } from "@/features/follow-ups/follow-up-actions";
import { getFollowUpData } from "@/features/follow-ups/queries";
import type { FollowUpPeriod } from "@/features/follow-ups/types";
import {
  defaultFollowUpPeriod,
  followUpPeriodLabels,
  followUpUrl,
  formatElapsed,
  isFollowUpPeriod,
} from "@/features/follow-ups/utils";
import { formatDateTime, stageLabel, stageTone } from "@/features/opportunities/utils";

const headers = ["Proyecto", "Estado", "Último contacto", "Próximo seguimiento", "Tiempo transcurrido", "Acciones"];
const periods: FollowUpPeriod[] = ["overdue", "today", "upcoming"];

function stringParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

export default async function FollowUpsPage({ searchParams }: PageProps<"/follow-ups">) {
  const params = await searchParams;
  const query = stringParam(params.q);
  const data = await getFollowUpData(query);
  const requestedPeriod = stringParam(params.period);
  const selectedPeriod = isFollowUpPeriod(requestedPeriod)
    ? requestedPeriod
    : defaultFollowUpPeriod(data.groups);
  const followUps = data.groups[selectedPeriod];
  const feedback = params.follow_up_1 === "1"
    ? "Seguimiento 1 registrado. Programamos el próximo contacto dentro de 3 días."
    : params.follow_up_2 === "1"
      ? "Seguimiento 2 registrado. No se programaron más contactos automáticamente."
      : params.rescheduled === "1"
        ? "Seguimiento reprogramado correctamente."
        : params.responded === "1"
          ? "Respuesta registrada. La oportunidad salió de los seguimientos pendientes."
          : params.no_response === "1"
            ? "Oportunidad marcada como No responde. La cadencia quedó cerrada."
          : params.lost === "1"
              ? "Oportunidad marcada como perdida."
              : null;
  const actionError = params.action_error === "1";
  const total = periods.reduce((sum, period) => sum + data.groups[period].length, 0);

  return (
    <>
      <PageHeader
        eyebrow="Acción diaria"
        title="Seguimientos"
        description="Una lista clara de las personas a las que debes escribir y cuándo hacerlo."
      />

      {feedback && <div className="feedback-banner feedback-success" role="status">{feedback}</div>}
      {actionError && <div className="feedback-banner feedback-error" role="alert">La oportunidad cambió o ya no admite esta acción. Actualiza e intenta nuevamente.</div>}

      <nav className="follow-up-tabs" aria-label="Periodo de seguimiento">
        {periods.map((period) => (
          <Link
            className={`follow-up-tab ${selectedPeriod === period ? "follow-up-tab-active" : ""}`}
            href={followUpUrl(period, query)}
            key={period}
            aria-current={selectedPeriod === period ? "page" : undefined}
          >
            {followUpPeriodLabels[period]} <span>{data.groups[period].length}</span>
          </Link>
        ))}
      </nav>

      <section className="panel">
        <form className="table-toolbar" method="get">
          <label className="search-field">
            <span className="sr-only">Buscar seguimientos</span>
            <Search size={15} aria-hidden="true" />
            <input defaultValue={query} name="q" placeholder="Buscar proyecto…" type="search" />
          </label>
          <input name="period" type="hidden" value={selectedPeriod} />
          <div className="filter-row">
            {query && <Link className="filter-chip filter-link" href={followUpUrl(selectedPeriod, "")}>Limpiar</Link>}
            <button className="filter-chip" type="submit">Buscar</button>
          </div>
        </form>
        <div className="table-scroll">
          <table className="data-table follow-ups-table">
            <thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
            <tbody>
              {followUps.length === 0 ? (
                <tr><td className="empty-table-cell" colSpan={headers.length}>
                  <EmptyState
                    icon={CalendarCheck}
                    title={query ? "No encontramos seguimientos" : total === 0 ? "No tienes seguimientos pendientes" : `No hay seguimientos ${selectedPeriod === "today" ? "para hoy" : selectedPeriod === "overdue" ? "vencidos" : "próximos"}`}
                    description={query ? "Prueba con otro proyecto." : total === 0 ? "Al mover una oportunidad a Contactado, aparecerá aquí con una fecha sugerida." : "Revisa las otras categorías para continuar con tu agenda."}
                  />
                </td></tr>
              ) : followUps.map((opportunity) => (
                <tr className="data-row" key={opportunity.id}>
                  <td>
                    <Link className="client-name-link" href={`/opportunities/${opportunity.id}`}>
                      {opportunity.title}<ArrowUpRight size={13} aria-hidden="true" />
                    </Link>
                  </td>
                  <td><Badge tone={stageTone(opportunity.stage)}>{stageLabel(opportunity.stage)}</Badge></td>
                  <td>{formatDateTime(opportunity.last_contact_at)}</td>
                  <td className={selectedPeriod === "overdue" ? "follow-up-overdue-date" : ""}>{formatDateTime(opportunity.next_follow_up_at)}</td>
                  <td>{formatElapsed(opportunity.last_contact_at)}</td>
                  <td><FollowUpActions opportunity={opportunity} lostReasons={data.lostReasons} period={selectedPeriod} query={query} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
