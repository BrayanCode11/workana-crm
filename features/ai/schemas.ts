import { z } from "zod";

const price = z.object({
  min: z.number().nullable(),
  max: z.number().nullable(),
  target: z.number().nullable(),
  currency: z.string().nullable(),
  uncertainty: z.enum(["low", "medium", "high"]),
  factors: z.array(z.string()),
});

const readiness = z.object({
  status: z.enum(["yes", "partial", "no"]),
  confidence: z.enum(["high", "medium", "low"]),
  critical_pending: z.array(z.string()),
});

export const projectAnalysisSchema = z.object({
  summary: z.string(),
  missing_information: z.array(z.string()),
  risks: z.array(z.string()),
  complexity: z.enum(["low", "medium", "high"]),
  fit: z.enum(["low", "medium", "high"]),
  pricing: price,
  initial_message: z.string(),
  follow_up_1: z.string(),
  follow_up_2: z.string(),
  proposal_readiness: readiness,
  next_best_action: z.string(),
});

export const replyAnalysisSchema = z.object({
  new_information: z.array(z.string()),
  missing_information: z.array(z.string()),
  scope_impact: z.string(),
  updated_pricing: price,
  change_explanation: z.string(),
  next_best_action: z.string(),
  suggested_reply: z.string(),
  proposal_readiness: readiness,
});

export const proposalSchema = z.object({
  scope: z.array(z.string()),
  assumptions: z.array(z.string()),
  exclusions: z.array(z.string()),
  estimated_timeline: z.string(),
  price: price,
  workana_proposal: z.string(),
  readiness_warning: z.string().nullable(),
  suggested_question: z.string().nullable(),
});

export type ProjectAnalysis = z.infer<typeof projectAnalysisSchema>;
export type ReplyAnalysis = z.infer<typeof replyAnalysisSchema>;
export type Proposal = z.infer<typeof proposalSchema>;

const priceJson = {
  type: "object", additionalProperties: false,
  properties: {
    min: { type: ["number", "null"] }, max: { type: ["number", "null"] }, target: { type: ["number", "null"] },
    currency: { type: ["string", "null"] }, uncertainty: { type: "string", enum: ["low", "medium", "high"] },
    factors: { type: "array", items: { type: "string" } },
  },
  required: ["min", "max", "target", "currency", "uncertainty", "factors"],
} as const;

const readinessJson = {
  type: "object", additionalProperties: false,
  properties: {
    status: { type: "string", enum: ["yes", "partial", "no"] }, confidence: { type: "string", enum: ["high", "medium", "low"] },
    critical_pending: { type: "array", items: { type: "string" } },
  }, required: ["status", "confidence", "critical_pending"],
} as const;

export const projectAnalysisJsonSchema = {
  type: "object", additionalProperties: false,
  properties: {
    summary: { type: "string" }, missing_information: { type: "array", items: { type: "string" } }, risks: { type: "array", items: { type: "string" } },
    complexity: { type: "string", enum: ["low", "medium", "high"] }, fit: { type: "string", enum: ["low", "medium", "high"] }, pricing: priceJson,
    initial_message: { type: "string" }, follow_up_1: { type: "string" }, follow_up_2: { type: "string" }, proposal_readiness: readinessJson, next_best_action: { type: "string" },
  }, required: ["summary", "missing_information", "risks", "complexity", "fit", "pricing", "initial_message", "follow_up_1", "follow_up_2", "proposal_readiness", "next_best_action"],
} as const;

export const replyAnalysisJsonSchema = {
  type: "object", additionalProperties: false,
  properties: {
    new_information: { type: "array", items: { type: "string" } }, missing_information: { type: "array", items: { type: "string" } }, scope_impact: { type: "string" },
    updated_pricing: priceJson, change_explanation: { type: "string" }, next_best_action: { type: "string" }, suggested_reply: { type: "string" }, proposal_readiness: readinessJson,
  }, required: ["new_information", "missing_information", "scope_impact", "updated_pricing", "change_explanation", "next_best_action", "suggested_reply", "proposal_readiness"],
} as const;

export const proposalJsonSchema = {
  type: "object", additionalProperties: false,
  properties: {
    scope: { type: "array", items: { type: "string" } }, assumptions: { type: "array", items: { type: "string" } }, exclusions: { type: "array", items: { type: "string" } },
    estimated_timeline: { type: "string" }, price: priceJson, workana_proposal: { type: "string" }, readiness_warning: { type: ["string", "null"] }, suggested_question: { type: ["string", "null"] },
  }, required: ["scope", "assumptions", "exclusions", "estimated_timeline", "price", "workana_proposal", "readiness_warning", "suggested_question"],
} as const;
