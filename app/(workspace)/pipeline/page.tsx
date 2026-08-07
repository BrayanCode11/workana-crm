import { PageHeader } from "@/components/page-header";
import { PrimaryLink } from "@/components/ui";
import { PipelineBoard } from "@/features/pipeline/pipeline-board";
import { getPipelineData } from "@/features/pipeline/queries";

export default async function PipelinePage() {
  const data = await getPipelineData();

  return (
    <>
      <PageHeader
        eyebrow="Vista comercial"
        title="Pipeline"
        description="Visualiza el avance real de tus oportunidades. Cada etapa representa algo que ya ocurrió."
        actions={<PrimaryLink href="/opportunities/new">Nueva oportunidad</PrimaryLink>}
      />
      <PipelineBoard initialOpportunities={data.opportunities} lostReasons={data.lostReasons} />
    </>
  );
}
