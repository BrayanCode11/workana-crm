import { CalendarCheck, Search } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

const headers = ["Proyecto", "Cliente", "Estado", "Último contacto", "Próximo seguimiento", "Tiempo transcurrido"];

export default function FollowUpsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Acción diaria"
        title="Seguimientos"
        description="Una lista clara de las personas a las que debes escribir y cuándo hacerlo."
      />
      <div className="follow-up-tabs" role="tablist" aria-label="Periodo de seguimiento">
        <button className="follow-up-tab follow-up-tab-active" type="button" role="tab" aria-selected="true">Vencidos <span>0</span></button>
        <button className="follow-up-tab" type="button" role="tab" aria-selected="false">Hoy <span>0</span></button>
        <button className="follow-up-tab" type="button" role="tab" aria-selected="false">Próximos <span>0</span></button>
      </div>
      <section className="panel">
        <div className="table-toolbar">
          <label className="search-field">
            <span className="sr-only">Buscar seguimientos</span>
            <Search size={15} aria-hidden="true" />
            <input disabled placeholder="Buscar proyecto o cliente…" type="search" />
          </label>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
            <tbody>
              <tr><td className="empty-table-cell" colSpan={headers.length}>
                <EmptyState
                  icon={CalendarCheck}
                  title="No tienes seguimientos pendientes"
                  description="Cuando programes un próximo contacto, aparecerá aquí en el momento adecuado."
                />
              </td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
