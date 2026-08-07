import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { updateOpportunityAction } from "@/features/opportunities/actions";
import { OpportunityForm } from "@/features/opportunities/opportunity-form";
import { getOpportunity, getOpportunityFormOptions } from "@/features/opportunities/queries";

export default async function EditOpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [opportunity, options] = await Promise.all([
    getOpportunity(id),
    getOpportunityFormOptions(),
  ]);
  if (!opportunity) notFound();
  const action = updateOpportunityAction.bind(null, opportunity.id);

  return (
    <>
      <Link className="back-link" href={`/opportunities/${opportunity.id}`}>
        <ArrowLeft size={14} /> Volver a la oportunidad
      </Link>
      <div className="entity-page-heading">
        <PageHeader
          eyebrow="Edición"
          title={`Editar ${opportunity.title}`}
          description="Actualiza el contexto comercial, la etapa o los datos de cierre de esta oportunidad."
        />
      </div>
      <section className="panel opportunity-form-panel">
        <OpportunityForm
          action={action}
          options={options}
          values={opportunity}
          cancelHref={`/opportunities/${opportunity.id}`}
          submitLabel="Guardar cambios"
        />
      </section>
    </>
  );
}
