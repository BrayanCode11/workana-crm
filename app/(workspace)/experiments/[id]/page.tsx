import { ArrowLeft, Info, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui";
import { formatCurrencyGroups } from "@/features/clients/utils";
import {
  experimentStatusLabels,
  experimentStatusTone,
} from "@/features/experiments/constants";
import { DeleteExperimentButton } from "@/features/experiments/delete-experiment-button";
import { getExperiment } from "@/features/experiments/queries";
import {
  formatExperimentPeriod,
  formatRate,
  getExperimentMetrics,
  getVariantMetrics,
} from "@/features/experiments/utils";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const experiment = await getExperiment(id);
  return { title: experiment?.name ?? "Experimento" };
}

export default async function ExperimentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const experiment = await getExperiment(id);
  if (!experiment) notFound();

  const metrics = getExperimentMetrics(experiment.opportunities);
  const withoutVariant = experiment.opportunities.filter((opportunity) => !opportunity.experiment_variant_id).length;
  const feedback = query.created === "1"
    ? "Experimento creado. Ahora añade las variantes que quieras comparar."
    : query.updated === "1"
      ? "Experimento actualizado correctamente."
      : query.variant_created === "1"
        ? "Variante creada correctamente."
        : query.variant_updated === "1"
          ? "Variante actualizada correctamente."
          : null;

  return (
    <>
      <Link className="back-link" href="/experiments"><ArrowLeft size={14} /> Todos los experimentos</Link>

      <header className="detail-header experiment-detail-header">
        <div>
          <div className="detail-title-row">
            <h1>{experiment.name}</h1>
            <Badge tone={experimentStatusTone(experiment.status)}>
              {experimentStatusLabels[experiment.status as keyof typeof experimentStatusLabels] ?? experiment.status}
            </Badge>
            {experiment.is_default_for_new_opportunities && <Badge tone="success">Asignación automática</Badge>}
          </div>
          <p>{formatExperimentPeriod(experiment.started_at, experiment.ended_at)}</p>
        </div>
        <div className="page-actions">
          <Link className="button" href={`/experiments/${experiment.id}/edit`}><Pencil size={15} /> Editar</Link>
          <Link className="button button-primary" href={`/experiments/${experiment.id}/variants/new`}><Plus size={15} /> Nueva variante</Link>
        </div>
      </header>

      {feedback && <div className="feedback-banner feedback-success" role="status">{feedback}</div>}

      <section className="experiment-summary" aria-label="Resumen del experimento">
        <div><span>Oportunidades</span><strong>{metrics.assigned}</strong></div>
        <div><span>Contactados (n)</span><strong>{metrics.contacted}</strong></div>
        <div><span>Respondieron</span><strong>{metrics.responded}</strong></div>
        <div><span>Tasa de respuesta</span><strong>{formatRate(metrics.responseRate)}</strong></div>
        <div><span>Ganados</span><strong>{metrics.won}</strong></div>
        <div><span>Tasa de cierre</span><strong>{formatRate(metrics.closeRate)}</strong></div>
      </section>

      <section className="panel experiment-context section">
        <div>
          <span>Objetivo</span>
          <p>{experiment.description ?? "No se añadió una descripción para este experimento."}</p>
        </div>
        <div>
          <span>Valor total ganado</span>
          <strong>{formatCurrencyGroups(metrics.wonByCurrency)}</strong>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Resultados por variante</h2>
            <p className="section-description">Cada tasa muestra su cantidad de contactos para que puedas interpretar el tamaño de la muestra.</p>
          </div>
          <div className="experiment-section-actions">
            <span className="section-count">{experiment.experiment_variants.length}</span>
            <Link className="section-link" href={`/experiments/${experiment.id}/variants/new`}>Nueva variante</Link>
          </div>
        </div>

        <div className="panel table-scroll">
          <table className="data-table experiment-results-table">
            <thead>
              <tr>
                <th>Variante</th>
                <th>n</th>
                <th>Respondieron</th>
                <th>Tasa respuesta</th>
                <th>Propuestas</th>
                <th>Tasa propuesta</th>
                <th>Negociaciones</th>
                <th>Ganados</th>
                <th>Perdidos</th>
                <th>Tasa cierre</th>
                <th>Cierre / propuestas</th>
                <th>Valor ganado</th>
                <th>Promedio ganado</th>
              </tr>
            </thead>
            <tbody>
              {experiment.experiment_variants.length === 0 ? (
                <tr><td className="empty-table-cell" colSpan={13}>
                  <div className="inline-empty-state">
                    <p>Este experimento todavía no tiene variantes.</p>
                    <Link className="button" href={`/experiments/${experiment.id}/variants/new`}><Plus size={14} /> Crear variante</Link>
                  </div>
                </td></tr>
              ) : experiment.experiment_variants.map((variant) => {
                const variantMetrics = getVariantMetrics(experiment.opportunities, variant.id);
                return (
                  <tr className="data-row" key={variant.id}>
                    <td className="variant-name-cell">
                      <Link className="client-name-link" href={`/experiments/${experiment.id}/variants/${variant.id}/edit`}>
                        {variant.code} · {variant.name}
                      </Link>
                      <span className="table-secondary">{variant.is_active ? "Activa" : "Inactiva"} · {variantMetrics.assigned} asignadas</span>
                    </td>
                    <td className="numeric-cell"><strong>{variantMetrics.contacted}</strong></td>
                    <td className="numeric-cell">{variantMetrics.responded}</td>
                    <td><RateCell value={variantMetrics.responseRate} /></td>
                    <td className="numeric-cell">{variantMetrics.proposals}</td>
                    <td><RateCell value={variantMetrics.proposalRate} /></td>
                    <td className="numeric-cell">{variantMetrics.negotiations}</td>
                    <td className="numeric-cell">{variantMetrics.won}</td>
                    <td className="numeric-cell">{variantMetrics.lost}</td>
                    <td><RateCell value={variantMetrics.closeRate} /></td>
                    <td className="numeric-cell">{formatRate(variantMetrics.proposalCloseRate)}</td>
                    <td className="currency-cell">{formatCurrencyGroups(variantMetrics.wonByCurrency)}</td>
                    <td className="currency-cell">{formatCurrencyGroups(variantMetrics.averageWonByCurrency)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <aside className="experiment-sample-note section">
        <Info size={17} aria-hidden="true" />
        <div>
          <strong>Interpreta la muestra antes de decidir</strong>
          <p>No se declara una variante ganadora automáticamente. Compara las tasas junto con <b>n</b>, la cantidad de contactos de cada estrategia.</p>
        </div>
      </aside>

      {withoutVariant > 0 && (
        <div className="feedback-banner feedback-error section" role="status">
          {withoutVariant} {withoutVariant === 1 ? "oportunidad está asociada" : "oportunidades están asociadas"} al experimento sin una variante. Edítala para que sus resultados entren en la comparación.
        </div>
      )}

      <section className="danger-zone section">
        <div>
          <h2>Eliminar experimento</h2>
          <p>{metrics.assigned > 0 ? "No puede eliminarse mientras tenga oportunidades asociadas." : "Elimina definitivamente el experimento y todas sus variantes."}</p>
        </div>
        <DeleteExperimentButton experimentId={experiment.id} disabled={metrics.assigned > 0} />
      </section>
    </>
  );
}

function RateCell({ value }: { value: number | null }) {
  const percentage = value === null ? 0 : Math.min(100, Math.max(0, value * 100));
  return (
    <div className="rate-cell">
      <span>{formatRate(value)}</span>
      <span className="rate-track" aria-hidden="true"><span style={{ width: `${percentage}%` }} /></span>
    </div>
  );
}
