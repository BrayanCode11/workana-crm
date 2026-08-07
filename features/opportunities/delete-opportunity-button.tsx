"use client";

import { Trash2 } from "lucide-react";
import { deleteOpportunityAction } from "./actions";

export function DeleteOpportunityButton({ opportunityId }: { opportunityId: string }) {
  const action = deleteOpportunityAction.bind(null, opportunityId);

  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm("¿Eliminar esta oportunidad y sus notas? Esta acción no se puede deshacer.")) {
          event.preventDefault();
        }
      }}
    >
      <button className="danger-button" type="submit">
        <Trash2 size={15} aria-hidden="true" />
        Eliminar oportunidad
      </button>
    </form>
  );
}

