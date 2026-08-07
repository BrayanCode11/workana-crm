import type { Database } from "@/lib/supabase/database.types";

export type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
export type OpportunityRow = Database["public"]["Tables"]["opportunities"]["Row"];

export type ClientOpportunity = Pick<
  OpportunityRow,
  | "id"
  | "title"
  | "stage"
  | "planned_price"
  | "planned_price_currency"
  | "final_value"
  | "final_value_currency"
  | "won_at"
  | "lost_at"
  | "created_at"
>;

export type ClientWithOpportunities = ClientRow & {
  opportunities: ClientOpportunity[];
};

export type ClientMetrics = {
  total: number;
  active: number;
  won: number;
  lost: number;
  wonByCurrency: Record<string, number>;
  lastOpportunityAt: string | null;
};

export type ClientFormValues = Pick<
  ClientRow,
  "name" | "company_name" | "country" | "workana_profile_url" | "notes"
>;

export type ClientFormField = keyof ClientFormValues;

export type ClientFormState = {
  message?: string;
  errors?: Partial<Record<ClientFormField, string>>;
};
