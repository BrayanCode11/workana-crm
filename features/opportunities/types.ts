import type { Database } from "@/lib/supabase/database.types";
import type { OpportunityStage } from "./constants";

export type OpportunityRow = Database["public"]["Tables"]["opportunities"]["Row"];
export type OpportunityInsert = Database["public"]["Tables"]["opportunities"]["Insert"];

export type OpportunityClient = {
  id: string;
  name: string;
  company_name: string | null;
};

export type OpportunityExperiment = {
  id: string;
  name: string;
};

export type OpportunityVariant = {
  id: string;
  experiment_id?: string;
  code: string;
  name: string;
  is_active?: boolean;
};

export type LostReason = {
  id: number;
  name: string;
  slug: string;
};

export type OpportunityNote = {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export type OpportunityWithRelations = OpportunityRow & {
  clients: OpportunityClient | null;
  experiments: OpportunityExperiment | null;
  experiment_variants: Omit<OpportunityVariant, "experiment_id" | "is_active"> | null;
  lost_reasons: LostReason | null;
  opportunity_notes?: OpportunityNote[];
};

export type ExperimentOption = OpportunityExperiment & {
  status: string;
  experiment_variants: OpportunityVariant[];
};

export type OpportunityFormOptions = {
  clients: OpportunityClient[];
  experiments: ExperimentOption[];
  lostReasons: LostReason[];
  pipelineStages: Database["public"]["Tables"]["pipeline_stages"]["Row"][];
};

export type OpportunityFormField =
  | "title"
  | "workana_url"
  | "description"
  | "contact_name"
  | "contact_country"
  | "client_id"
  | "new_client_name"
  | "new_client_company"
  | "published_budget_min"
  | "published_budget_max"
  | "published_budget_currency"
  | "planned_price"
  | "planned_price_currency"
  | "project_type"
  | "technologies"
  | "stage"
  | "experiment_id"
  | "experiment_variant_id"
  | "published_at"
  | "next_follow_up_at"
  | "final_value"
  | "final_value_currency"
  | "won_at"
  | "lost_reason_id"
  | "lost_reason_notes"
  | "lost_at";

export type OpportunityFormState = {
  message?: string;
  duplicateOpportunityId?: string;
  errors?: Partial<Record<OpportunityFormField, string>>;
};

export type NoteFormState = {
  message?: string;
  errors?: { content?: string };
};

export type OpportunityFilters = {
  q?: string;
  stage?: string;
  client?: string;
  experiment?: string;
  status?: string;
};

export type OpportunityFormValues = Partial<OpportunityRow> & {
  stage: OpportunityStage | string;
};
