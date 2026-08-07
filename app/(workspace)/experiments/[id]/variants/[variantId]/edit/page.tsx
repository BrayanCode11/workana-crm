import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { updateVariantAction } from "@/features/experiments/actions";
import { getExperiment, getExperimentVariant } from "@/features/experiments/queries";
import { VariantForm } from "@/features/experiments/variant-form";

export default async function EditVariantPage({
  params,
}: {
  params: Promise<{ id: string; variantId: string }>;
}) {
  const { id, variantId } = await params;
  const [experiment, variant] = await Promise.all([
    getExperiment(id),
    getExperimentVariant(id, variantId),
  ]);
  if (!experiment || !variant) notFound();

  const action = updateVariantAction.bind(null, experiment.id, variant.id);

  return (
    <>
      <Link className="back-link" href={`/experiments/${experiment.id}`}><ArrowLeft size={14} /> Volver al experimento</Link>
      <div className="entity-page-heading">
        <PageHeader
          eyebrow="Edición de variante"
          title={`Editar ${variant.code} · ${variant.name}`}
          description="Puedes desactivarla para conservar sus resultados sin usarla en nuevas oportunidades."
        />
      </div>
      <section className="panel form-panel">
        <VariantForm
          action={action}
          values={variant}
          cancelHref={`/experiments/${experiment.id}`}
          submitLabel="Guardar variante"
        />
      </section>
    </>
  );
}
