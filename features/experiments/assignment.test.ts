import assert from "node:assert/strict";
import test from "node:test";
import { chooseLeastUsedVariant } from "./assignment";

const variants = [
  { id: "a", code: "A", created_at: "2026-01-01" },
  { id: "b", code: "B", created_at: "2026-01-02" },
  { id: "c", code: "C", created_at: "2026-01-03" },
];

test("elige cualquier cantidad de variantes por menor uso", () => {
  assert.equal(chooseLeastUsedVariant(variants, [
    { experiment_variant_id: "a" },
    { experiment_variant_id: "a" },
    { experiment_variant_id: "b" },
  ])?.id, "c");
});

test("los empates son deterministas y una lista vacía no asigna", () => {
  assert.equal(chooseLeastUsedVariant(variants, [])?.id, "a");
  assert.equal(chooseLeastUsedVariant([], [])?.id, undefined);
});
