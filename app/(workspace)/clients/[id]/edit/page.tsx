import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { updateClientAction } from "@/features/clients/actions";
import { ClientForm } from "@/features/clients/client-form";
import { getClient } from "@/features/clients/queries";

export default async function EditClientPage({ params }: PageProps<"/clients/[id]/edit">) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  const action = updateClientAction.bind(null, client.id);

  return (
    <>
      <Link className="back-link" href={`/clients/${client.id}`}>
        <ArrowLeft size={14} /> Volver al cliente
      </Link>
      <div className="entity-page-heading">
        <PageHeader
          eyebrow="Edición"
          title={`Editar ${client.name}`}
          description="Actualiza únicamente la información que realmente necesitas para el seguimiento comercial."
        />
      </div>
      <section className="panel form-panel">
        <ClientForm
          action={action}
          values={client}
          cancelHref={`/clients/${client.id}`}
          submitLabel="Guardar cambios"
        />
      </section>
    </>
  );
}
