import { ArrowLeft, ExternalLink, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui";
import { formatChatGPTContext } from "@/features/opportunities/chatgpt-context";
import { CopyChatGPTContext } from "@/features/opportunities/copy-chatgpt-context";
import { DeleteOpportunityButton } from "@/features/opportunities/delete-opportunity-button";
import { OpportunityConversation } from "@/features/opportunities/opportunity-conversation";
import { OpportunityNotes } from "@/features/opportunities/opportunity-notes";
import { PreparedMessagesForm } from "@/features/opportunities/prepared-messages-form";
import { getOpportunity, getOpportunityFormOptions } from "@/features/opportunities/queries";
import { StageForm } from "@/features/opportunities/stage-form";
import {
  formatBudget,
  formatDate,
  formatDateTime,
  formatMoney,
  stageLabel,
  stageTone,
} from "@/features/opportunities/utils";

type OpportunityPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Pick<OpportunityPageProps, "params">) {
  const { id } = await params;
  const opportunity = await getOpportunity(id);
  return { title: opportunity?.title ?? "Oportunidad" };
}

export default async function OpportunityDetailPage({
  params,
  searchParams,
}: OpportunityPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [opportunity, options] = await Promise.all([getOpportunity(id), getOpportunityFormOptions()]);
  if (!opportunity) notFound();
  const currentStageName = options.pipelineStages.find((stage) => stage.slug === opportunity.stage)?.name ?? stageLabel(opportunity.stage);

  const feedback = query.created === "1"
    ? "Oportunidad creada correctamente."
    : query.updated === "1"
      ? "Oportunidad actualizada correctamente."
      : query.stage_updated === "1"
        ? "Etapa actualizada correctamente."
        : null;
  const noteFeedback = query.note_created === "1"
    ? "Nota guardada correctamente."
    : query.note_updated === "1"
      ? "Nota actualizada correctamente."
      : query.note_deleted === "1"
        ? "Nota eliminada correctamente."
        : null;
  const stageError = query.stage_error === "1";
  const notes = opportunity.opportunity_notes ?? [];
  const messages = opportunity.opportunity_messages ?? [];
  const chatGPTContext = formatChatGPTContext({
    ...opportunity,
    experiment: opportunity.experiments,
    variant: opportunity.experiment_variants,
  });

  return (
    <>
      <Link className="back-link" href="/opportunities"><ArrowLeft size={14} /> Todas las oportunidades</Link>

      <header className="detail-header opportunity-detail-header">
        <div>
          <div className="detail-title-row">
            <h1>{opportunity.title}</h1>
            <Badge tone={stageTone(opportunity.stage)}>{currentStageName}</Badge>
          </div>
          <p>
            {opportunity.clients ? (
              <>Cliente: <Link className="table-link" href={`/clients/${opportunity.clients.id}`}>{opportunity.clients.name}</Link></>
            ) : "Sin cliente asociado"}
            {opportunity.planned_price !== null && opportunity.planned_price_currency
              ? ` · ${formatMoney(opportunity.planned_price, opportunity.planned_price_currency)} planeados`
              : ""}
          </p>
        </div>
        <div className="page-actions">
          <CopyChatGPTContext value={chatGPTContext} />
          {opportunity.workana_url && (
            <a className="button" href={opportunity.workana_url} target="_blank" rel="noreferrer">
              <ExternalLink size={15} aria-hidden="true" /> Workana <span className="sr-only">(abre en una pestaña nueva)</span>
            </a>
          )}
          <Link className="button button-primary" href={`/opportunities/${opportunity.id}/edit`}>
            <Pencil size={15} /> Editar
          </Link>
        </div>
      </header>

      {feedback && <div className="feedback-banner feedback-success" role="status">{feedback}</div>}
      {stageError && <div className="feedback-banner feedback-error" role="alert">No pudimos actualizar la etapa. Intenta nuevamente.</div>}

      <section className="opportunity-summary" aria-label="Resumen de la oportunidad">
        <div><span>Etapa</span><strong>{currentStageName}</strong></div>
        <div><span>Presupuesto publicado</span><strong>{formatBudget(opportunity.published_budget_min, opportunity.published_budget_max, opportunity.published_budget_currency)}</strong></div>
        <div><span>Precio planeado</span><strong>{formatMoney(opportunity.planned_price, opportunity.planned_price_currency)}</strong></div>
        <div><span>Valor final</span><strong>{formatMoney(opportunity.final_value, opportunity.final_value_currency)}</strong></div>
      </section>

      <div className="opportunity-detail-grid section">
        <section className="panel detail-panel">
          <div className="section-heading"><h2>Proyecto</h2></div>
          <dl className="detail-list">
            <div><dt>Tipo</dt><dd>{opportunity.project_type ?? "—"}</dd></div>
            <div><dt>Publicado</dt><dd>{formatDate(opportunity.published_at)}</dd></div>
            <div><dt>Tecnologías</dt><dd>{opportunity.technologies.length > 0 ? opportunity.technologies.join(", ") : "—"}</dd></div>
            <div>
              <dt>Enlace</dt>
              <dd>{opportunity.workana_url ? (
                <a className="external-link" href={opportunity.workana_url} target="_blank" rel="noreferrer">Abrir en Workana <ExternalLink size={13} aria-hidden="true" /><span className="sr-only">(abre en una pestaña nueva)</span></a>
              ) : "—"}</dd>
            </div>
          </dl>
          <div className="detail-copy-block">
            <span>Descripción</span>
            <p>{opportunity.description ?? "No hay una descripción registrada."}</p>
          </div>
        </section>

        <section className="panel detail-panel">
          <div className="section-heading"><h2>Seguimiento</h2></div>
          <dl className="detail-list">
            <div><dt>Último contacto</dt><dd>{formatDateTime(opportunity.last_contact_at)}</dd></div>
            <div><dt>Próximo contacto</dt><dd>{formatDateTime(opportunity.next_follow_up_at)}</dd></div>
            <div><dt>Primer contacto</dt><dd>{formatDateTime(opportunity.first_contacted_at)}</dd></div>
            <div><dt>Primera respuesta</dt><dd>{formatDateTime(opportunity.first_response_at)}</dd></div>
          </dl>
          {!(["won", "lost"].includes(opportunity.stage)) && (
            <StageForm opportunityId={opportunity.id} currentStage={opportunity.stage} stages={options.pipelineStages} />
          )}
        </section>

        <section className="panel detail-panel">
          <div className="section-heading"><h2>Atribución</h2></div>
          <dl className="detail-list">
            <div><dt>Cliente</dt><dd>{opportunity.clients ? <Link className="table-link" href={`/clients/${opportunity.clients.id}`}>{opportunity.clients.name}</Link> : "—"}</dd></div>
            <div><dt>Contacto</dt><dd>{opportunity.contact_name ?? "—"}</dd></div>
            <div><dt>País</dt><dd>{opportunity.contact_country ?? "—"}</dd></div>
            <div><dt>Experimento</dt><dd>{opportunity.experiments?.name ?? "—"}</dd></div>
            <div><dt>Variante</dt><dd>{opportunity.experiment_variants ? `${opportunity.experiment_variants.code} · ${opportunity.experiment_variants.name}` : "—"}</dd></div>
            <div><dt>Registrada</dt><dd>{formatDateTime(opportunity.created_at)}</dd></div>
          </dl>
        </section>

        <section className="panel detail-panel">
          <div className="section-heading"><h2>Resultado</h2></div>
          <dl className="detail-list">
            <div><dt>Ganada</dt><dd>{formatDate(opportunity.won_at)}</dd></div>
            <div><dt>Perdida</dt><dd>{formatDate(opportunity.lost_at)}</dd></div>
            <div><dt>Motivo</dt><dd>{opportunity.lost_reasons?.name ?? "—"}</dd></div>
            <div><dt>Valor final</dt><dd>{formatMoney(opportunity.final_value, opportunity.final_value_currency)}</dd></div>
          </dl>
          {opportunity.lost_reason_notes && (
            <div className="detail-copy-block"><span>Detalle de pérdida</span><p>{opportunity.lost_reason_notes}</p></div>
          )}
        </section>
      </div>

      <PreparedMessagesForm
        opportunityId={opportunity.id}
        messages={{
          initial_message: opportunity.initial_message,
          follow_up_1_message: opportunity.follow_up_1_message,
          follow_up_2_message: opportunity.follow_up_2_message,
        }}
        stage={opportunity.stage}
        firstContactedAt={opportunity.first_contacted_at}
        followUp1At={opportunity.follow_up_1_at}
        followUp2At={opportunity.follow_up_2_at}
      />

      <OpportunityConversation opportunityId={opportunity.id} messages={messages} closed={["won", "lost"].includes(opportunity.stage)} />

      <OpportunityNotes opportunityId={opportunity.id} notes={notes} feedback={noteFeedback} />

      <section className="danger-zone section">
        <div><h2>Eliminar oportunidad</h2><p>Se eliminarán también sus notas y su historial comercial. Esta acción es permanente.</p></div>
        <DeleteOpportunityButton opportunityId={opportunity.id} />
      </section>
    </>
  );
}
