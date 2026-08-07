import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { updateExperimentAction } from "@/features/experiments/actions";
import { ExperimentForm } from "@/features/experiments/experiment-form";
import { getExperiment } from "@/features/experiments/queries";

export default async function EditExperimentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const experiment = await getExperiment(id);
  if (!experiment) notFound();

  const action = updateExperimentAction.bind(null, experiment.id);

  return (
    <>
      <Link className="back-link" href={`/experiments/${experiment.id}`}><ArrowLeft size={14} /> Volver al experimento</Link>
      <div className="entity-page-heading">
        <PageHeader
          eyebrow="Edición"
          title={`Editar ${experiment.name}`}
          description="Actualiza el objetivo, las fechas o el estado sin alterar los resultados acumulados."
        />
      </div>
      <section className="panel form-panel">
        <ExperimentForm
          action={action}
          values={experiment}
          cancelHref={`/experiments/${experiment.id}`}
          submitLabel="Guardar cambios"
        />
      </section>
    </>
  );
}
