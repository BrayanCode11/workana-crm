import { ArrowLeft, Info } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";

export default function NewOpportunityPage() {
  return (
    <>
      <Link className="section-link" href="/opportunities">← Volver a oportunidades</Link>
      <div style={{ marginTop: 20 }}>
        <PageHeader
          eyebrow="Registro rápido"
          title="Nueva oportunidad"
          description="El formulario se habilitará al conectar Supabase, para que los datos se guarden desde el primer registro."
        />
      </div>
      <section className="panel empty-state empty-state-compact">
        <span className="empty-icon" aria-hidden="true"><Info size={21} /></span>
        <h2>Disponible en la fase de oportunidades</h2>
        <p>Antes configuraremos autenticación y seguridad para evitar almacenar información comercial sin protección.</p>
        <Link className="button" href="/opportunities"><ArrowLeft size={15} /> Volver</Link>
      </section>
    </>
  );
}
