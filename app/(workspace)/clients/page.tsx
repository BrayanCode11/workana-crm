import { Search, Users } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

const headers = ["Nombre", "Empresa", "País", "Oportunidades", "Activas", "Ganadas", "Valor ganado", "Última oportunidad"];

export default function ClientsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Relaciones"
        title="Clientes"
        description="Reúne el historial comercial de cada persona y detecta clientes recurrentes."
      />
      <section className="panel">
        <div className="table-toolbar">
          <label className="search-field">
            <span className="sr-only">Buscar clientes</span>
            <Search size={15} aria-hidden="true" />
            <input disabled placeholder="Buscar nombre o empresa…" type="search" />
          </label>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
            <tbody>
              <tr><td className="empty-table-cell" colSpan={headers.length}>
                <EmptyState
                  icon={Users}
                  title="Todavía no has registrado clientes"
                  description="Los clientes podrán crearse aquí o rápidamente al registrar una oportunidad."
                />
              </td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
