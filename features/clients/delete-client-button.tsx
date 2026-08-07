"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";
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
      <DeleteClientSubmit disabled={disabled} />
    </form>
  );
}

function DeleteClientSubmit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button className="danger-button" disabled={disabled || pending} type="submit">
      {pending ? <LoaderCircle className="spin" size={15} aria-hidden="true" /> : <Trash2 size={15} aria-hidden="true" />}
      {pending ? "Eliminando…" : "Eliminar cliente"}
    </button>
  );
}
