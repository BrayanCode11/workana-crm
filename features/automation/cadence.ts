export type CommercialAction = "initial_sent" | "follow_up_1_sent" | "follow_up_2_sent" | "outbound_reply_sent" | "proposal_sent";

export function commercialUpdate(action: CommercialAction, firstContact: string | null, now: Date) {
  const timestamp = now.toISOString();
  const first = firstContact ?? timestamp;
  if (action === "initial_sent") return { stage: "contacted", first_contacted_at: first, last_contact_at: timestamp, next_follow_up_at: new Date(new Date(first).getTime() + 24 * 60 * 60 * 1000).toISOString() };
  if (action === "follow_up_1_sent") return { stage: "follow_up_1", first_contacted_at: first, follow_up_1_at: timestamp, last_contact_at: timestamp, next_follow_up_at: new Date(new Date(first).getTime() + 48 * 60 * 60 * 1000).toISOString() };
  if (action === "follow_up_2_sent") return { stage: "follow_up_2", first_contacted_at: first, follow_up_2_at: timestamp, last_contact_at: timestamp, next_follow_up_at: null };
  if (action === "proposal_sent") return { stage: "proposal_sent", proposal_at: timestamp, last_contact_at: timestamp, next_follow_up_at: null };
  return { last_contact_at: timestamp };
}
