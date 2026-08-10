import type { Database } from "@/lib/supabase/database.types";
import type { OpportunityStage } from "@/features/opportunities/constants";

type OpportunityRow = Database["public"]["Tables"]["opportunities"]["Row"];

export type DashboardOpportunity = Pick<
  OpportunityRow,
  | "id"
  | "title"
  | "client_id"
  | "stage"
  | "first_contacted_at"
  | "first_response_at"
  | "follow_up_1_at"
  | "follow_up_2_at"
  | "proposal_at"
  | "negotiation_at"
  | "won_at"
  | "lost_at"
  | "next_follow_up_at"
  | "final_value"
  | "final_value_currency"
> & {
  clients: { id: string; name: string } | null;
};

export type DashboardData = {
  opportunities: DashboardOpportunity[];
  clientIds: string[];
  attention: {
    consultationPending: number;
    followUp1Pending: number;
    followUp2Pending: number;
    repliesPending: number;
    proposalReady: number;
  };
};

export type DashboardMetrics = {
  active: number;
  waiting: number;
  contacted: number;
  responded: number;
  proposals: number;
  negotiations: number;
  won: number;
  lost: number;
  responseRate: number | null;
  closeRate: number | null;
  proposalCloseRate: number | null;
  wonByCurrency: Record<string, number>;
  clients: number;
  recurrentClients: number;
  clientsWithActiveOpportunities: number;
  stageCounts: Record<OpportunityStage, number>;
  followUps: {
    overdue: DashboardOpportunity[];
    today: DashboardOpportunity[];
    upcoming: DashboardOpportunity[];
  };
};
