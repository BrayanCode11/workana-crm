import assert from "node:assert/strict";
import test from "node:test";
import type { DashboardOpportunity } from "./types";
import { getDashboardMetrics } from "./utils";

function opportunity(id: string, overrides: Partial<DashboardOpportunity> = {}): DashboardOpportunity {
  return {
    id,
    title: `Oportunidad ${id}`,
    client_id: null,
    stage: "detected",
    first_contacted_at: "2026-08-01T12:00:00Z",
    first_response_at: null,
    follow_up_1_at: null,
    follow_up_1_message: null,
    follow_up_2_at: null,
    follow_up_2_message: null,
    proposal_at: null,
    negotiation_at: null,
    won_at: null,
    lost_at: null,
    next_follow_up_at: null,
    final_value: null,
    final_value_currency: null,
    clients: null,
    ...overrides,
  };
}

test("resume pipeline, resultados, clientes y agenda sin mezclar monedas", () => {
  const metrics = getDashboardMetrics({
    clientIds: ["client-1", "client-2", "client-3"],
    pipelineStages: [
      { slug: "detected", name: "Detectado" },
      { slug: "contacted", name: "Contactado" },
      { slug: "won", name: "Ganado" },
      { slug: "lost", name: "Perdido" },
    ],
    attention: { consultationPending: 0, followUp1Pending: 0, followUp1Prepared: 0, followUp2Pending: 0, followUp2Prepared: 0, repliesPending: 0 },
    opportunities: [
      opportunity("1", { client_id: "client-1", stage: "contacted", next_follow_up_at: "2026-08-06T15:00:00Z" }),
      opportunity("2", { client_id: "client-1", stage: "won", first_response_at: "2026-08-02T12:00:00Z", proposal_at: "2026-08-03T12:00:00Z", negotiation_at: "2026-08-04T12:00:00Z", won_at: "2026-08-05T12:00:00Z", final_value: 100, final_value_currency: "USD" }),
      opportunity("3", { client_id: "client-2", stage: "lost", lost_at: "2026-08-05T12:00:00Z" }),
      opportunity("4", { stage: "won", won_at: "2026-08-05T12:00:00Z", final_value: 200000, final_value_currency: "COP" }),
    ],
  }, new Date("2026-08-07T15:00:00Z"));

  assert.equal(metrics.active, 1);
  assert.equal(metrics.waiting, 1);
  assert.equal(metrics.contacted, 4);
  assert.equal(metrics.responseRate, 1 / 4);
  assert.equal(metrics.closeRate, 2 / 4);
  assert.equal(metrics.recurrentClients, 1);
  assert.equal(metrics.clientsWithActiveOpportunities, 1);
  assert.equal(metrics.stageCounts.contacted, 1);
  assert.equal(metrics.stageCounts.won, 2);
  assert.deepEqual(metrics.followUps.overdue.map(({ id }) => id), ["1"]);
  assert.deepEqual(metrics.wonByCurrency, { USD: 100, COP: 200000 });
});

test("No responde cierra la agenda sin contar como ganada o perdida", () => {
  const metrics = getDashboardMetrics({
    clientIds: [],
    pipelineStages: [{ slug: "no_response", name: "No responde" }],
    attention: { consultationPending: 0, followUp1Pending: 0, followUp1Prepared: 0, followUp2Pending: 0, followUp2Prepared: 0, repliesPending: 0 },
    opportunities: [opportunity("nr", { stage: "no_response", next_follow_up_at: null })],
  });
  assert.equal(metrics.active, 0);
  assert.equal(metrics.waiting, 0);
  assert.equal(metrics.won, 0);
  assert.equal(metrics.lost, 0);
  assert.equal(metrics.stageCounts.no_response, 1);
});
