import assert from "node:assert/strict";
import test from "node:test";
import { formatChatGPTContext } from "./chatgpt-context";

test("crea un contexto completo, legible y con instrucciones dinámicas", () => {
  const result = formatChatGPTContext({
    title: "Tienda para CalzaModa <SV>",
    contact_name: "Moisés & Ana",
    contact_country: "El Salvador",
    published_budget_min: 250,
    published_budget_max: 500,
    published_budget_currency: "USD",
    published_at: "2026-08-11",
    technologies: ["HTML", "CSS", "JavaScript"],
    description: "Primer párrafo.\n\nSegundo párrafo con ñ.",
    workana_url: "https://www.workana.com/job/tienda",
    experiment: { name: "Consulta Workana — Apertura v1" },
    variant: { code: "B", name: "Microdiagnóstico", message_instructions: "Incluye una observación real.\nDespués pregunta." },
  });
  assert.match(result, /EXPERIMENTO\nConsulta Workana/);
  assert.match(result, /VARIANTE\nB — Microdiagnóstico/);
  assert.match(result, /INSTRUCCIONES DE VARIANTE\nIncluye una observación real/);
  assert.match(result, /Presupuesto:\n[\s\S]*250[\s\S]*500/);
  assert.match(result, /Publicado:\n11 de agosto de 2026/);
  assert.match(result, /Tecnologías:\nHTML, CSS, JavaScript/);
  assert.match(result, /Primer párrafo\.\n\nSegundo párrafo con ñ\./);
  assert.match(result, /Tienda para CalzaModa <SV>/);
});

test("omite campos vacíos, instrucciones ausentes y no imprime placeholders", () => {
  const result = formatChatGPTContext({
    title: "Proyecto mínimo",
    contact_name: " ",
    technologies: [],
    experiment: { name: "Experimento" },
    variant: { code: "A", name: "Pregunta", message_instructions: null },
  });
  assert.match(result, /EXPERIMENTO\nExperimento/);
  assert.match(result, /VARIANTE\nA — Pregunta/);
  assert.doesNotMatch(result, /INSTRUCCIONES DE VARIANTE|Contacto:|Tecnologías:|undefined|null/);
});

test("sin experimento omite toda la atribución y conserva el proyecto", () => {
  const result = formatChatGPTContext({ title: "Solo proyecto", variant: { code: "B", name: "No debe salir" } });
  assert.equal(result, "PROYECTO\n\nTítulo:\nSolo proyecto");
  assert.doesNotMatch(result, /EXPERIMENTO|VARIANTE|No debe salir/);
});

test("soporta presupuesto único y oportunidad casi vacía", () => {
  const single = formatChatGPTContext({ published_budget_min: 1000, published_budget_max: 1000, published_budget_currency: "USD" });
  assert.match(single, /Presupuesto:\n.*1\.000/);
  assert.equal(formatChatGPTContext({}), "PROYECTO");
});
