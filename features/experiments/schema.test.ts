import assert from "node:assert/strict";
import test from "node:test";
import { parseVariantForm } from "./schema";

test("las instrucciones de mensajería son datos dinámicos de la variante", () => {
  const form = new FormData();
  form.set("code", "c");
  form.set("name", "Enfoque específico");
  form.set("description", "Estrategia C");
  form.set("message_instructions", "Cambiar el enfoque sin depender del código C.");
  form.set("is_active", "on");
  const result = parseVariantForm(form);
  assert.ok("values" in result);
  assert.equal(result.values.code, "C");
  assert.equal(result.values.message_instructions, "Cambiar el enfoque sin depender del código C.");
});
