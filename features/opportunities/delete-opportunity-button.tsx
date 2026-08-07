"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";
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
      <DeleteOpportunitySubmit />
    </form>
  );
}

function DeleteOpportunitySubmit() {
  const { pending } = useFormStatus();
  return (
    <button className="danger-button" disabled={pending} type="submit">
      {pending ? <LoaderCircle className="spin" size={15} aria-hidden="true" /> : <Trash2 size={15} aria-hidden="true" />}
      {pending ? "Eliminando…" : "Eliminar oportunidad"}
    </button>
  );
}
