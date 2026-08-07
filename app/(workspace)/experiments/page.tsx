import { FlaskConical } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export default function ExperimentsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Aprendizaje"
        title="Experimentos"
        description="Compara estrategias de contacto usando resultados reales y el tamaño de cada muestra."
      />
      <section className="panel">
        <EmptyState
          icon={FlaskConical}
          title="Todavía no has creado experimentos"
          description="Crea variantes de estrategia y mide respuesta, propuestas y cierres sin guardar mensajes."
        />
      </section>
    </>
  );
}
