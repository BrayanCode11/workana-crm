import assert from "node:assert/strict";
import test from "node:test";
import type { ExperimentOpportunity } from "./types";
import { getExperimentMetrics, getVariantMetrics } from "./utils";

function opportunity(id: string, overrides: Partial<ExperimentOpportunity> = {}): ExperimentOpportunity {
  return {
    id,
    title: `Oportunidad ${id}`,
    stage: "contacted",
    experiment_variant_id: "variant-a",
    first_contacted_at: "2026-08-01T12:00:00Z",
    first_response_at: null,
    proposal_at: null,
    negotiation_at: null,
    won_at: null,
    lost_at: null,
    final_value: null,
    final_value_currency: null,
    ...overrides,
  };
}

test("calcula tasas por hitos y no por la etapa actual", () => {
  const metrics = getExperimentMetrics([
    opportunity("1", { stage: "negotiation", first_response_at: "2026-08-02T12:00:00Z", proposal_at: "2026-08-03T12:00:00Z", negotiation_at: "2026-08-04T12:00:00Z" }),
    opportunity("2", { stage: "won", proposal_at: "2026-08-03T12:00:00Z", won_at: "2026-08-05T12:00:00Z", final_value: 100, final_value_currency: "USD" }),
    opportunity("3", { stage: "lost", lost_at: "2026-08-05T12:00:00Z" }),
  ]);

  assert.equal(metrics.contacted, 3);
  assert.equal(metrics.responded, 1);
  assert.equal(metrics.responseRate, 1 / 3);
  assert.equal(metrics.proposals, 2);
  assert.equal(metrics.proposalRate, 2 / 3);
  assert.equal(metrics.negotiations, 1);
  assert.equal(metrics.won, 1);
  assert.equal(metrics.lost, 1);
  assert.equal(metrics.closeRate, 1 / 3);
  assert.equal(metrics.proposalCloseRate, 1 / 2);
});

test("separa totales y promedios ganados por moneda y por variante", () => {
  const opportunities = [
    opportunity("1", { won_at: "2026-08-05T12:00:00Z", final_value: 100, final_value_currency: "USD" }),
    opportunity("2", { won_at: "2026-08-05T12:00:00Z", final_value: 300, final_value_currency: "USD" }),
    opportunity("3", { won_at: "2026-08-05T12:00:00Z", final_value: 800000, final_value_currency: "COP", experiment_variant_id: "variant-b" }),
  ];
  const allMetrics = getExperimentMetrics(opportunities);
  const variantMetrics = getVariantMetrics(opportunities, "variant-a");

  assert.deepEqual(allMetrics.wonByCurrency, { USD: 400, COP: 800000 });
  assert.deepEqual(allMetrics.averageWonByCurrency, { USD: 200, COP: 800000 });
  assert.deepEqual(variantMetrics.wonByCurrency, { USD: 400 });
  assert.equal(variantMetrics.assigned, 2);
});
