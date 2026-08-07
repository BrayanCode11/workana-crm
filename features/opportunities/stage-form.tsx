import { ArrowRight } from "lucide-react";
import { changeOpportunityStageAction } from "./actions";
import { activeOpportunityStages, stageLabels } from "./constants";

export function StageForm({ opportunityId, currentStage }: { opportunityId: string; currentStage: string }) {
  const action = changeOpportunityStageAction.bind(null, opportunityId);

  return (
    <form action={action} className="stage-form">
      <label htmlFor="quick-stage">Mover a etapa</label>
      <div>
        <select id="quick-stage" name="stage" defaultValue={currentStage}>
          {activeOpportunityStages.map((stage) => <option key={stage} value={stage}>{stageLabels[stage]}</option>)}
        </select>
        <button className="button" type="submit"><ArrowRight size={14} /> Actualizar</button>
      </div>
      <p>Para marcar como ganada o perdida, usa Editar y completa los datos de cierre.</p>
    </form>
  );
}

