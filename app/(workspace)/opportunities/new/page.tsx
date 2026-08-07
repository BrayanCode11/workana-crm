import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { createOpportunityAction } from "@/features/opportunities/actions";
import { OpportunityForm } from "@/features/opportunities/opportunity-form";
import { getOpportunityFormOptions } from "@/features/opportunities/queries";

export default async function NewOpportunityPage({ searchParams }: PageProps<"/opportunities/new">) {
  const [params, options] = await Promise.all([searchParams, getOpportunityFormOptions()]);
  const requestedClient = typeof params.client === "string" ? params.client : "";
  const defaultClientId = options.clients.some((client) => client.id === requestedClient) ? requestedClient : undefined;

  return (
    <>
      <Link className="back-link" href="/opportunities"><ArrowLeft size={14} /> Volver a oportunidades</Link>
      <div className="entity-page-heading">
        <PageHeader
          eyebrow="Nuevo registro"
          title="Nueva oportunidad"
          description="El título es lo único obligatorio. Añade ahora solo la información que ayude a decidir y hacer seguimiento."
        />
      </div>
      <section className="panel opportunity-form-panel">
        <OpportunityForm
          action={createOpportunityAction}
          options={options}
          defaultClientId={defaultClientId}
          cancelHref="/opportunities"
          submitLabel="Crear oportunidad"
        />
      </section>
    </>
  );
}
