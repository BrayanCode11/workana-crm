import type { Database } from "@/lib/supabase/database.types";
import type { LostReason, OpportunityClient, OpportunityExperiment } from "@/features/opportunities/types";

type OpportunityRow = Database["public"]["Tables"]["opportunities"]["Row"];

export type FollowUpOpportunity = Pick<
  OpportunityRow,
  | "id"
  | "client_id"
  | "title"
  | "stage"
  | "last_contact_at"
  | "next_follow_up_at"
  | "experiment_id"
  | "experiment_variant_id"
> & {
  clients: OpportunityClient | null;
  experiments: OpportunityExperiment | null;
  experiment_variants: { id: string; code: string; name: string } | null;
};

export type FollowUpPeriod = "overdue" | "today" | "upcoming";

export type FollowUpGroups = Record<FollowUpPeriod, FollowUpOpportunity[]>;

export type FollowUpData = {
  groups: FollowUpGroups;
  lostReasons: LostReason[];
};

export type FollowUpFormState = {
  message?: string;
  errors?: {
    next_follow_up_at?: string;
    lost_at?: string;
    lost_reason_id?: string;
    lost_reason_notes?: string;
  };
};
