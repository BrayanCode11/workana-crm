import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { createClientAction } from "@/features/clients/actions";
import { ClientForm } from "@/features/clients/client-form";

export default function NewClientPage() {
  return (
    <>
      <Link className="back-link" href="/clients"><ArrowLeft size={14} /> Volver a clientes</Link>
      <div className="entity-page-heading">
        <PageHeader
          eyebrow="Nuevo registro"
          title="Nuevo cliente"
          description="Solo el nombre es obligatorio. Podrás completar el resto cuando tengas más contexto."
        />
      </div>
      <section className="panel form-panel">
        <ClientForm
          action={createClientAction}
          cancelHref="/clients"
          submitLabel="Crear cliente"
        />
      </section>
    </>
  );
}
