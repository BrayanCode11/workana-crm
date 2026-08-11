import assert from "node:assert/strict";
import test from "node:test";
import { commercialUpdate, responseUpdate } from "./cadence";

const first = "2026-08-10T10:00:00.000Z";
test("consulta programa F1 exactamente 24 horas después", () => {
  assert.equal(commercialUpdate("initial_sent", null, new Date(first)).next_follow_up_at, "2026-08-11T10:00:00.000Z");
});
test("F1 tardío mantiene F2 a 48 horas del primer contacto", () => {
  assert.equal(commercialUpdate("follow_up_1_sent", first, new Date("2026-08-12T15:00:00Z")).next_follow_up_at, "2026-08-12T10:00:00.000Z");
});
test("F2 cierra la cadencia sin crear F3", () => {
  const update = commercialUpdate("follow_up_2_sent", first, new Date());
  assert.equal(update.next_follow_up_at, null);
  assert.equal("follow_up_3_at" in update, false);
});

test("una respuesta cancela el seguimiento y conserva la primera respuesta", () => {
  const existing = "2026-08-11T09:00:00.000Z";
  const update = responseUpdate(existing, new Date("2026-08-12T10:00:00.000Z"));
  assert.equal(update.stage, "responded");
  assert.equal(update.first_response_at, existing);
  assert.equal(update.next_follow_up_at, null);
});
