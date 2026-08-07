-- Prospecta: Row Level Security and API grants

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.opportunities enable row level security;
alter table public.opportunity_notes enable row level security;
alter table public.experiments enable row level security;
alter table public.experiment_variants enable row level security;
alter table public.lost_reasons enable row level security;

create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "clients_manage_own"
  on public.clients
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "opportunities_manage_own"
  on public.opportunities
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "opportunity_notes_manage_own"
  on public.opportunity_notes
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "experiments_manage_own"
  on public.experiments
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "experiment_variants_manage_own"
  on public.experiment_variants
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "lost_reasons_read_authenticated"
  on public.lost_reasons
  for select
  to authenticated
  using (true);

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.clients from anon, authenticated;
revoke all on table public.opportunities from anon, authenticated;
revoke all on table public.opportunity_notes from anon, authenticated;
revoke all on table public.experiments from anon, authenticated;
revoke all on table public.experiment_variants from anon, authenticated;
revoke all on table public.lost_reasons from anon, authenticated;

grant select, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.clients to authenticated;
grant select, insert, update, delete on table public.opportunities to authenticated;
grant select, insert, update, delete on table public.opportunity_notes to authenticated;
grant select, insert, update, delete on table public.experiments to authenticated;
grant select, insert, update, delete on table public.experiment_variants to authenticated;
grant select on table public.lost_reasons to authenticated;

