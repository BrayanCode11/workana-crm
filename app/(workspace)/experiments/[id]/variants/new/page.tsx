import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { createVariantAction } from "@/features/experiments/actions";
import { getExperiment } from "@/features/experiments/queries";
import { VariantForm } from "@/features/experiments/variant-form";

export default async function NewVariantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const experiment = await getExperiment(id);
  if (!experiment) notFound();

  const action = createVariantAction.bind(null, experiment.id);

  return (
    <>
      <Link className="back-link" href={`/experiments/${experiment.id}`}><ArrowLeft size={14} /> Volver al experimento</Link>
      <div className="entity-page-heading">
        <PageHeader
          eyebrow="Nueva estrategia"
          title="Nueva variante"
          description={`Añade una estrategia comparable a ${experiment.name}, sin guardar textos de mensajes.`}
        />
      </div>
      <section className="panel form-panel">
        <VariantForm
          action={action}
          cancelHref={`/experiments/${experiment.id}`}
          submitLabel="Crear variante"
        />
      </section>
    </>
  );
}
