import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { createExperimentAction } from "@/features/experiments/actions";
import { ExperimentForm } from "@/features/experiments/experiment-form";

export default function NewExperimentPage() {
  return (
    <>
      <Link className="back-link" href="/experiments"><ArrowLeft size={14} /> Volver a experimentos</Link>
      <div className="entity-page-heading">
        <PageHeader
          eyebrow="Nuevo aprendizaje"
          title="Nuevo experimento"
          description="Define qué estrategia quieres comparar. Después podrás crear sus variantes."
        />
      </div>
      <section className="panel form-panel">
        <ExperimentForm
          action={createExperimentAction}
          cancelHref="/experiments"
          submitLabel="Crear experimento"
        />
      </section>
    </>
  );
}
