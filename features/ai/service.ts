import type { AiProvider } from "./provider";
import { buildProjectAnalysisPrompt, buildProposalPrompt, buildReplyAnalysisPrompt, type AiOpportunityContext } from "./prompts";
import { projectAnalysisJsonSchema, projectAnalysisSchema, proposalJsonSchema, proposalSchema, replyAnalysisJsonSchema, replyAnalysisSchema } from "./schemas";

export async function generateProjectAnalysis(provider: AiProvider, context: AiOpportunityContext) {
  return provider.generateStructured({ name: "project_analysis", prompt: buildProjectAnalysisPrompt(context), jsonSchema: projectAnalysisJsonSchema, schema: projectAnalysisSchema });
}

export async function generateReplyAnalysis(provider: AiProvider, context: AiOpportunityContext) {
  return provider.generateStructured({ name: "reply_analysis", prompt: buildReplyAnalysisPrompt(context), jsonSchema: replyAnalysisJsonSchema, schema: replyAnalysisSchema });
}

export async function generateProposal(provider: AiProvider, context: AiOpportunityContext) {
  return provider.generateStructured({ name: "proposal", prompt: buildProposalPrompt(context), jsonSchema: proposalJsonSchema, schema: proposalSchema });
}
