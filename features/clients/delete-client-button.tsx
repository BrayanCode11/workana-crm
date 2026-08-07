"use client";

import { Trash2 } from "lucide-react";
import { deleteClientAction } from "./actions";

export function DeleteClientButton({
  clientId,
  disabled,
}: {
  clientId: string;
  disabled: boolean;
}) {
  const action = deleteClientAction.bind(null, clientId);

  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm("¿Eliminar este cliente? Esta acción no se puede deshacer.")) {
          event.preventDefault();
        }
      }}
    >
      <button className="danger-button" disabled={disabled} type="submit">
        <Trash2 size={15} aria-hidden="true" />
        Eliminar cliente
      </button>
    </form>
  );
}
