import { ArrowRight } from "lucide-react";
import { changeOpportunityStageAction } from "./actions";
import type { Database } from "@/lib/supabase/database.types";

type PipelineStage = Database["public"]["Tables"]["pipeline_stages"]["Row"];

export function StageForm({ opportunityId, currentStage, stages }: { opportunityId: string; currentStage: string; stages: PipelineStage[] }) {
  const action = changeOpportunityStageAction.bind(null, opportunityId);

  return (
    <form action={action} className="stage-form">
      <label htmlFor="quick-stage">Mover a etapa</label>
      <div>
        <select id="quick-stage" name="stage" defaultValue={currentStage}>
          {stages.filter((stage) => !["won", "lost"].includes(stage.slug)).map((stage) => <option key={stage.id} value={stage.slug}>{stage.name}</option>)}
        </select>
        <button className="button" type="submit"><ArrowRight size={14} /> Actualizar</button>
      </div>
      <p>Para marcar como ganada o perdida, usa Editar y completa los datos de cierre.</p>
    </form>
  );
}
