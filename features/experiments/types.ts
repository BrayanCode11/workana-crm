import type { Database } from "@/lib/supabase/database.types";

export type ExperimentRow = Database["public"]["Tables"]["experiments"]["Row"];
export type ExperimentInsert = Database["public"]["Tables"]["experiments"]["Insert"];
export type ExperimentVariantRow = Database["public"]["Tables"]["experiment_variants"]["Row"];
export type ExperimentVariantInsert = Database["public"]["Tables"]["experiment_variants"]["Insert"];
type OpportunityRow = Database["public"]["Tables"]["opportunities"]["Row"];

export type ExperimentOpportunity = Pick<
  OpportunityRow,
  | "id"
  | "title"
  | "stage"
  | "experiment_variant_id"
  | "first_contacted_at"
  | "first_response_at"
  | "proposal_at"
  | "negotiation_at"
  | "won_at"
  | "lost_at"
  | "final_value"
  | "final_value_currency"
>;

export type ExperimentWithRelations = ExperimentRow & {
  experiment_variants: ExperimentVariantRow[];
  opportunities: ExperimentOpportunity[];
};

export type ExperimentFormField = "name" | "description" | "status" | "started_at" | "ended_at";

export type ExperimentFormState = {
  message?: string;
  errors?: Partial<Record<ExperimentFormField, string>>;
};

export type VariantFormField = "code" | "name" | "description" | "is_active";

export type VariantFormState = {
  message?: string;
  errors?: Partial<Record<VariantFormField, string>>;
};

export type ExperimentMetrics = {
  assigned: number;
  contacted: number;
  responded: number;
  responseRate: number | null;
  proposals: number;
  proposalRate: number | null;
  negotiations: number;
  won: number;
  lost: number;
  closeRate: number | null;
  proposalCloseRate: number | null;
  wonByCurrency: Record<string, number>;
  averageWonByCurrency: Record<string, number>;
};
