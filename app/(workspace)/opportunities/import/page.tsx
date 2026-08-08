import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getOpportunityFormOptions } from "@/features/opportunities/queries";
import { WorkanaImportFlow } from "@/features/opportunities/workana-import-flow";

export default async function ImportWorkanaOpportunityPage() {
  const options = await getOpportunityFormOptions();

  return (
    <>
      <Link className="back-link" href="/opportunities"><ArrowLeft size={14} /> Volver a oportunidades</Link>
      <div className="entity-page-heading">
        <PageHeader
          eyebrow="Importación rápida"
          title="Pegar desde Workana"
          description="Pega, analiza y revisa el proyecto antes de registrarlo como oportunidad."
        />
      </div>
      <WorkanaImportFlow options={options} />
    </>
  );
}
