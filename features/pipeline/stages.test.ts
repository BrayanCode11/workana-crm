import assert from "node:assert/strict";
import test from "node:test";
import { pipelineStageSlug } from "./stages";

test("crea slugs estables para etapas personalizadas", () => {
  assert.equal(pipelineStageSlug("  Revisión técnica  "), "revision_tecnica");
  assert.equal(pipelineStageSlug("Cotización / Alcance"), "cotizacion_alcance");
});

test("un nombre sin caracteres utilizables produce slug vacío", () => {
  assert.equal(pipelineStageSlug("---"), "");
});
