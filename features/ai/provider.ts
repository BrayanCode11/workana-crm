import "server-only";
import type { z } from "zod";

export class AiConfigurationError extends Error {}

export type StructuredGenerationRequest<T> = {
  name: string;
  prompt: string;
  jsonSchema: Record<string, unknown>;
  schema: z.ZodType<T>;
};

export type AiProvider = {
  model: string;
  generateStructured<T>(request: StructuredGenerationRequest<T>): Promise<T>;
};

function outputText(response: unknown) {
  if (!response || typeof response !== "object") return null;
  const output = (response as { output?: unknown[] }).output;
  if (!Array.isArray(output)) return null;
  for (const item of output) {
    if (!item || typeof item !== "object" || !Array.isArray((item as { content?: unknown[] }).content)) continue;
    for (const content of (item as { content: Array<Record<string, unknown>> }).content) {
      if (content.type === "output_text" && typeof content.text === "string") return content.text;
    }
  }
  return null;
}

export function createOpenAiProvider(fetcher: typeof fetch = fetch): AiProvider {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-5.6-sol";
  if (!apiKey) throw new AiConfigurationError("Falta configurar OPENAI_API_KEY en el servidor.");
  return {
    model,
    async generateStructured<T>({ name, prompt, jsonSchema, schema }: StructuredGenerationRequest<T>) {
      const response = await fetcher("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model, store: false, reasoning: { effort: "low" }, max_output_tokens: 5000,
          input: [{ role: "user", content: [{ type: "input_text", text: prompt }] }],
          text: { format: { type: "json_schema", name, strict: true, schema: jsonSchema } },
        }),
      });
      if (!response.ok) {
        const body = await response.text();
        console.error("OpenAI request failed", { status: response.status, body: body.slice(0, 300) });
        throw new Error(response.status === 429 ? "El servicio de IA está ocupado. Intenta nuevamente en unos segundos." : "No pudimos generar el contenido con IA.");
      }
      const text = outputText(await response.json());
      if (!text) throw new Error("La IA no devolvió un resultado utilizable.");
      let value: unknown;
      try { value = JSON.parse(text); } catch { throw new Error("La IA devolvió un formato inválido. Intenta nuevamente."); }
      const parsed = schema.safeParse(value);
      if (!parsed.success) throw new Error("La IA devolvió datos incompletos. Intenta nuevamente.");
      return parsed.data;
    },
  };
}
