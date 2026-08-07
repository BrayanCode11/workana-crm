import "server-only";

import { cache } from "react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ClientWithOpportunities } from "./types";

const clientSelect = `
  id,
  user_id,
  name,
  company_name,
  country,
  workana_profile_url,
  notes,
  created_at,
  updated_at,
  opportunities (
    id,
    title,
    stage,
    planned_price,
    planned_price_currency,
    final_value,
    final_value_currency,
    won_at,
    lost_at,
    created_at
  )
`;

export async function getClients(search = "") {
  const { userId } = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select(clientSelect)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .order("created_at", { referencedTable: "opportunities", ascending: false });

  if (error) {
    console.error("Unable to load clients", { code: error.code });
    throw new Error("No pudimos cargar los clientes.");
  }

  const clients = data as ClientWithOpportunities[];
  const normalizedSearch = search.trim().toLocaleLowerCase("es");

  if (!normalizedSearch) return clients;

  return clients.filter((client) =>
    [client.name, client.company_name]
      .filter(Boolean)
      .some((value) => value?.toLocaleLowerCase("es").includes(normalizedSearch)),
  );
}

export const getClient = cache(async (id: string) => {
  const { userId } = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select(clientSelect)
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Unable to load client", { code: error.code });
    throw new Error("No pudimos cargar el cliente.");
  }

  return data as ClientWithOpportunities | null;
});
