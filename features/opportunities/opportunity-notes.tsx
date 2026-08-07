"use client";

import { LoaderCircle, Pencil, Save, Send, Trash2, X } from "lucide-react";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  createOpportunityNoteAction,
  deleteOpportunityNoteAction,
  updateOpportunityNoteAction,
} from "./note-actions";
import type { NoteFormState, OpportunityNote } from "./types";
import { formatDateTime } from "./utils";

const initialState: NoteFormState = {};

export function OpportunityNotes({
  opportunityId,
  notes,
  feedback,
}: {
  opportunityId: string;
  notes: OpportunityNote[];
  feedback?: string | null;
}) {
  const action = createOpportunityNoteAction.bind(null, opportunityId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const composerError = state.errors?.content ?? state.message;

  return (
    <section className="section" id="notes">
      <div className="section-heading">
        <h2>Notas</h2>
        <span className="section-count" aria-label={`${notes.length} notas`}>{notes.length}</span>
      </div>

      {feedback && <div className="feedback-banner feedback-success note-feedback" role="status">{feedback}</div>}

      <form action={formAction} className="panel note-composer">
        <label htmlFor="new-note">Añadir nota</label>
        <textarea
          id="new-note"
          name="content"
          rows={4}
          maxLength={10_000}
          placeholder="Registra contexto de la conversación, decisiones o información útil…"
          required
          disabled={pending}
          aria-invalid={Boolean(composerError)}
          aria-describedby={composerError ? "new-note-error" : "new-note-help"}
        />
        <div className="note-composer-footer">
          <span className={composerError ? "field-error" : "field-help"} id={composerError ? "new-note-error" : "new-note-help"} role={composerError ? "alert" : undefined}>
            {composerError ?? "Texto simple, máximo 10.000 caracteres."}
          </span>
          <button className="button button-primary" disabled={pending} type="submit">
            {pending ? <LoaderCircle className="spin" size={15} aria-hidden="true" /> : <Send size={15} aria-hidden="true" />}
            {pending ? "Guardando…" : "Guardar nota"}
          </button>
        </div>
      </form>

      <div className="notes-list">
        {notes.length === 0 ? (
          <div className="panel notes-empty">
            <p>Todavía no hay notas. Usa este espacio para conservar el contexto importante de la oportunidad.</p>
          </div>
        ) : notes.map((note) => (
          <NoteCard key={note.id} note={note} opportunityId={opportunityId} />
        ))}
      </div>
    </section>
  );
}

function NoteCard({ note, opportunityId }: { note: OpportunityNote; opportunityId: string }) {
  const [editing, setEditing] = useState(false);
  const updateAction = updateOpportunityNoteAction.bind(null, opportunityId, note.id);
  const deleteAction = deleteOpportunityNoteAction.bind(null, opportunityId, note.id);
  const [state, formAction, pending] = useActionState(updateAction, initialState);
  const edited = new Date(note.updated_at).getTime() - new Date(note.created_at).getTime() > 1000;

  return (
    <article className="panel note-card">
      <header className="note-card-header">
        <div>
          <time dateTime={note.created_at}>{formatDateTime(note.created_at)}</time>
          {edited && <span>Editada {formatDateTime(note.updated_at)}</span>}
        </div>
        {!editing && (
          <div className="note-card-actions">
            <button className="note-action-button" onClick={() => setEditing(true)} type="button" aria-label="Editar nota">
              <Pencil size={14} aria-hidden="true" /> Editar
            </button>
            <form
              action={deleteAction}
              onSubmit={(event) => {
                if (!window.confirm("¿Eliminar esta nota? Esta acción no se puede deshacer.")) {
                  event.preventDefault();
                }
              }}
            >
              <DeleteNoteButton />
            </form>
          </div>
        )}
      </header>

      {editing ? (
        <form action={formAction} className="note-edit-form">
          <textarea
            name="content"
            rows={5}
            maxLength={10_000}
            defaultValue={note.content}
            required
            disabled={pending}
            autoFocus
            aria-invalid={Boolean(state.errors?.content)}
            aria-describedby={state.errors?.content ? `${note.id}-error` : undefined}
          />
          {(state.errors?.content || state.message) && (
            <span className="field-error" id={`${note.id}-error`} role="alert">{state.errors?.content ?? state.message}</span>
          )}
          <div className="note-edit-actions">
            <button className="button" disabled={pending} onClick={() => setEditing(false)} type="button"><X size={14} /> Cancelar</button>
            <button className="button button-primary" disabled={pending} type="submit">
              {pending ? <LoaderCircle className="spin" size={14} /> : <Save size={14} />}
              {pending ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </form>
      ) : <p className="note-content">{note.content}</p>}
    </article>
  );
}

function DeleteNoteButton() {
  const { pending } = useFormStatus();

  return (
    <button className="note-action-button note-delete-button" disabled={pending} type="submit" aria-label="Eliminar nota">
      {pending ? <LoaderCircle className="spin" size={14} aria-hidden="true" /> : <Trash2 size={14} aria-hidden="true" />}
      {pending ? "Eliminando…" : "Eliminar"}
    </button>
  );
}
