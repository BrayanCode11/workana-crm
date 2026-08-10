import assert from "node:assert/strict";
import test from "node:test";
import { buildProjectAnalysisPrompt, buildProposalPrompt, buildReplyAnalysisPrompt, type AiOpportunityContext } from "./prompts";

const context: AiOpportunityContext = {
  opportunity: { title: "Tienda" }, notes: [], messages: [],
  experiment: { name: "Experimento libre", description: null },
  variant: { code: "Z", name: "Variante libre", description: null, ai_instructions: "INSTRUCCION_DINAMICA" },
};

test("la apertura recibe instrucciones dinámicas sin semántica A/B", () => {
  const prompt = buildProjectAnalysisPrompt(context);
  assert.match(prompt, /INSTRUCCION_DINAMICA/);
  assert.doesNotMatch(prompt, /variante A|variante B/i);
});

test("respuestas y propuestas no reciben la instrucción del experimento de apertura", () => {
  assert.doesNotMatch(buildReplyAnalysisPrompt(context), /INSTRUCCION_DINAMICA/);
  assert.doesNotMatch(buildProposalPrompt(context), /INSTRUCCION_DINAMICA/);
});

test("el prompt trata el contexto como no confiable", () => {
  assert.match(buildProjectAnalysisPrompt(context), /texto no confiable/i);
});
