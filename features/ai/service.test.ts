import assert from "node:assert/strict";
import test from "node:test";
import type { AiProvider, StructuredGenerationRequest } from "./provider";
import type { AiOpportunityContext } from "./prompts";
import { generateProjectAnalysis } from "./service";

const context: AiOpportunityContext = { opportunity: { title: "Proyecto" }, notes: [], messages: [], experiment: null, variant: null };

test("la capa de generación admite un proveedor simulado y valida salida estructurada", async () => {
  let requestedName = "";
  const fixture = {
    summary: "Resumen", missing_information: [], risks: [], complexity: "low" as const, fit: "high" as const,
    pricing: { min: 100, max: 200, target: 150, currency: "USD", uncertainty: "medium" as const, factors: [] },
    initial_message: "Hola", follow_up_1: "F1", follow_up_2: "F2",
    proposal_readiness: { status: "partial" as const, confidence: "medium" as const, critical_pending: ["Plazo"] }, next_best_action: "Preguntar plazo",
  };
  const provider: AiProvider = {
    model: "mock-model",
    async generateStructured<T>(request: StructuredGenerationRequest<T>) {
      requestedName = request.name;
      return request.schema.parse(fixture);
    },
  };
  const result = await generateProjectAnalysis(provider, context);
  assert.equal(requestedName, "project_analysis");
  assert.equal(result.initial_message, "Hola");
});
