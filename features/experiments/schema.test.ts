import assert from "node:assert/strict";
import test from "node:test";
import { parseVariantForm } from "./schema";

test("procesa la variante usando únicamente su descripción", () => {
  const form = new FormData();
  form.set("code", "c");
  form.set("name", "Enfoque específico");
  form.set("description", "Estrategia C");
  form.set("is_active", "on");
  const result = parseVariantForm(form);
  assert.ok("values" in result);
  assert.equal(result.values.code, "C");
  assert.equal(result.values.description, "Estrategia C");
  assert.ok(!("message_instructions" in result.values));
});
