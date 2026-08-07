import type { Database } from "@/lib/supabase/database.types";
import type { OpportunityStage } from "@/features/opportunities/constants";
import type { LostReason, OpportunityClient } from "@/features/opportunities/types";

type OpportunityRow = Database["public"]["Tables"]["opportunities"]["Row"];

export type PipelineOpportunity = Pick<
  OpportunityRow,
  | "id"
  | "client_id"
  | "title"
  | "stage"
  | "planned_price"
  | "planned_price_currency"
  | "final_value"
  | "final_value_currency"
  | "lost_reason_id"
  | "lost_reason_notes"
  | "won_at"
  | "lost_at"
  | "next_follow_up_at"
  | "created_at"
> & {
  clients: OpportunityClient | null;
  experiment_variants: { id: string; code: string; name: string } | null;
};

export type PipelineData = {
  opportunities: PipelineOpportunity[];
  lostReasons: LostReason[];
};

export type PipelineStageUpdate = Pick<
  PipelineOpportunity,
  | "id"
  | "stage"
  | "next_follow_up_at"
  | "final_value"
  | "final_value_currency"
  | "lost_reason_id"
  | "lost_reason_notes"
  | "won_at"
  | "lost_at"
>;

export type PipelineActionResult =
  | { ok: true; opportunity: PipelineStageUpdate }
  | { ok: false; message: string; errors?: Record<string, string> };

export type PipelineCloseInput = {
  stage: Extract<OpportunityStage, "won" | "lost">;
  final_value?: string;
  final_value_currency?: string;
  won_at?: string;
  lost_reason_id?: string;
  lost_reason_notes?: string;
  lost_at?: string;
};

