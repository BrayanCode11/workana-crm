import assert from "node:assert/strict";
import test from "node:test";
import { parsePreparedMessages, preparedMessageFields } from "./prepared-messages";

test("guarda, edita y conserva los tres mensajes como texto plano", () => {
  const result = parsePreparedMessages({
    initial_message: "  Hola, Moisés.\n¿Hablamos?  ",
    follow_up_1_message: "F1 con símbolos: <>& ñ",
    follow_up_2_message: "F2\ncon varios\npárrafos",
  });
  assert.ok("values" in result);
  assert.deepEqual(result.values, {
    initial_message: "Hola, Moisés.\n¿Hablamos?",
    follow_up_1_message: "F1 con símbolos: <>& ñ",
    follow_up_2_message: "F2\ncon varios\npárrafos",
  });
});

test("los mensajes vacíos se persisten como null y no inventan contenido", () => {
  const result = parsePreparedMessages({ initial_message: "", follow_up_1_message: null, follow_up_2_message: "   " });
  assert.ok("values" in result);
  assert.deepEqual(result.values, { initial_message: null, follow_up_1_message: null, follow_up_2_message: null });
});

test("el update preparado no contiene etapas, timestamps, métricas ni historial", () => {
  const result = parsePreparedMessages({ initial_message: "Consulta", follow_up_1_message: "F1", follow_up_2_message: "F2" });
  assert.ok("values" in result);
  assert.deepEqual(Object.keys(result.values).sort(), ["follow_up_1_message", "follow_up_2_message", "initial_message"]);
  ["stage", "first_contacted_at", "follow_up_1_at", "follow_up_2_at", "last_contact_at", "next_follow_up_at", "opportunity_messages"].forEach((key) => {
    assert.equal(key in result.values, false);
  });
});

test("cada bloque de copia corresponde a Consulta, F1 y F2", () => {
  assert.deepEqual(preparedMessageFields.map(({ key, label }) => ({ key, label })), [
    { key: "initial_message", label: "Consulta inicial" },
    { key: "follow_up_1_message", label: "Seguimiento 1" },
    { key: "follow_up_2_message", label: "Seguimiento 2" },
  ]);
});

test("rechaza mensajes por encima del límite sin lanzar excepciones", () => {
  const result = parsePreparedMessages({ initial_message: "x".repeat(20001), follow_up_1_message: "", follow_up_2_message: "" });
  assert.ok("errors" in result);
  assert.match(result.errors.initial_message ?? "", /20\.000/);
});
