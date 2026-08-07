"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import { useActionState } from "react";
import { deleteExperimentAction } from "./actions";
import type { DeleteExperimentState } from "./types";

const initialState: DeleteExperimentState = {};

export function DeleteExperimentButton({
  experimentId,
  disabled,
}: {
  experimentId: string;
  disabled: boolean;
}) {
  const action = deleteExperimentAction.bind(null, experimentId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <div className="delete-action-stack">
      {state.message && <p className="field-error" role="alert">{state.message}</p>}
      <form
        action={formAction}
        onSubmit={(event) => {
          if (!window.confirm("¿Eliminar este experimento y sus variantes? Esta acción no se puede deshacer.")) {
            event.preventDefault();
          }
        }}
      >
        <button className="danger-button" disabled={disabled || pending} type="submit">
          {pending ? <LoaderCircle className="spin" size={15} aria-hidden="true" /> : <Trash2 size={15} aria-hidden="true" />}
          {pending ? "Eliminando…" : "Eliminar experimento"}
        </button>
      </form>
    </div>
  );
}
