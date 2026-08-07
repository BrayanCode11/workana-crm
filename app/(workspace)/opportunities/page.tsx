import { BriefcaseBusiness, Search } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PrimaryLink } from "@/components/ui";

const headers = ["Proyecto", "Cliente", "Estado", "Presupuesto", "Precio planeado", "Seguimiento", "Fecha"];

export default function OpportunitiesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Prospección"
        title="Oportunidades"
        description="Organiza cada proyecto potencial desde que lo detectas hasta su cierre."
        actions={<PrimaryLink href="/opportunities/new">Nueva oportunidad</PrimaryLink>}
      />

      <section className="panel">
        <div className="table-toolbar">
          <label className="search-field">
            <span className="sr-only">Buscar oportunidades</span>
            <Search size={15} aria-hidden="true" />
            <input disabled placeholder="Buscar proyecto o cliente…" type="search" />
          </label>
          <div className="filter-row" aria-label="Filtros de oportunidades">
            <button className="filter-chip" disabled type="button">Estado</button>
            <button className="filter-chip" disabled type="button">Cliente</button>
            <button className="filter-chip" disabled type="button">Fecha</button>
          </div>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr>
            </thead>
            <tbody>
              <tr>
                <td className="empty-table-cell" colSpan={headers.length}>
                  <EmptyState
                    icon={BriefcaseBusiness}
                    title="Todavía no has registrado oportunidades"
                    description="Añade un proyecto interesante en segundos y empieza a organizar tu seguimiento."
                    action={<PrimaryLink href="/opportunities/new">Nueva oportunidad</PrimaryLink>}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
