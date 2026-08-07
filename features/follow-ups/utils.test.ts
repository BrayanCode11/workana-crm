import assert from "node:assert/strict";
import test from "node:test";
import type { FollowUpOpportunity } from "./types";
import { bogotaDateKey, groupFollowUps } from "./utils";

function followUp(id: string, nextFollowUpAt: string): FollowUpOpportunity {
  return {
    id,
    client_id: null,
    title: `Oportunidad ${id}`,
    stage: "contacted",
    last_contact_at: null,
    next_follow_up_at: nextFollowUpAt,
    experiment_id: null,
    experiment_variant_id: null,
    clients: null,
    experiments: null,
    experiment_variants: null,
  };
}

test("convierte timestamps a la fecha local de Bogotá", () => {
  assert.equal(bogotaDateKey("2026-08-08T04:59:00Z"), "2026-08-07");
  assert.equal(bogotaDateKey("2026-08-08T05:00:00Z"), "2026-08-08");
});

test("agrupa seguimientos en vencidos, hoy y próximos", () => {
  const groups = groupFollowUps([
    followUp("overdue", "2026-08-06T15:00:00Z"),
    followUp("today", "2026-08-07T20:00:00Z"),
    followUp("upcoming", "2026-08-08T15:00:00Z"),
  ], new Date("2026-08-07T15:00:00Z"));

  assert.deepEqual(groups.overdue.map(({ id }) => id), ["overdue"]);
  assert.deepEqual(groups.today.map(({ id }) => id), ["today"]);
  assert.deepEqual(groups.upcoming.map(({ id }) => id), ["upcoming"]);
});
