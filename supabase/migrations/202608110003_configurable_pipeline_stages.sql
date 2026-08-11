create table public.pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null,
  name text not null,
  position integer not null default 0,
  is_protected boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pipeline_stages_user_slug_key unique (user_id, slug),
  constraint pipeline_stages_name_length check (char_length(trim(name)) between 1 and 80),
  constraint pipeline_stages_slug_format check (slug ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$')
);

insert into public.pipeline_stages (user_id, slug, name, position, is_protected)
select profiles.id, defaults.slug, defaults.name, defaults.position, true
from public.profiles
cross join (values
  ('detected', 'Detectado', 10),
  ('contacted', 'Contactado', 20),
  ('follow_up_1', 'Seguimiento 1', 30),
  ('follow_up_2', 'Seguimiento 2', 40),
  ('no_response', 'No responde', 50),
  ('responded', 'Respondió', 60),
  ('proposal', 'Propuesta', 70),
  ('negotiation', 'Negociación', 80),
  ('won', 'Ganado', 10000),
  ('lost', 'Perdido', 10010)
) as defaults(slug, name, position);

alter table public.opportunities
  drop constraint opportunities_stage_valid,
  add constraint opportunities_pipeline_stage_fk
    foreign key (user_id, stage)
    references public.pipeline_stages(user_id, slug)
    on update cascade
    on delete restrict;

create index pipeline_stages_user_position_idx
  on public.pipeline_stages (user_id, position, created_at);

alter table public.pipeline_stages enable row level security;

create policy "Users can read own pipeline stages"
  on public.pipeline_stages for select
  using ((select auth.uid()) = user_id);
create policy "Users can insert own pipeline stages"
  on public.pipeline_stages for insert
  with check ((select auth.uid()) = user_id and not is_protected);
create policy "Users can update own custom pipeline stages"
  on public.pipeline_stages for update
  using ((select auth.uid()) = user_id and not is_protected)
  with check ((select auth.uid()) = user_id and not is_protected);
create policy "Users can delete own custom pipeline stages"
  on public.pipeline_stages for delete
  using ((select auth.uid()) = user_id and not is_protected);

grant select, insert, update, delete on public.pipeline_stages to authenticated;
revoke all on public.pipeline_stages from anon;

create trigger pipeline_stages_set_updated_at
  before update on public.pipeline_stages
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(split_part(new.email, '@', 1), '')
    )
  )
  on conflict (id) do nothing;

  insert into public.pipeline_stages (user_id, slug, name, position, is_protected)
  values
    (new.id, 'detected', 'Detectado', 10, true),
    (new.id, 'contacted', 'Contactado', 20, true),
    (new.id, 'follow_up_1', 'Seguimiento 1', 30, true),
    (new.id, 'follow_up_2', 'Seguimiento 2', 40, true),
    (new.id, 'no_response', 'No responde', 50, true),
    (new.id, 'responded', 'Respondió', 60, true),
    (new.id, 'proposal', 'Propuesta', 70, true),
    (new.id, 'negotiation', 'Negociación', 80, true),
    (new.id, 'won', 'Ganado', 10000, true),
    (new.id, 'lost', 'Perdido', 10010, true)
  on conflict (user_id, slug) do nothing;

  return new;
end;
$$;

create or replace function public.set_opportunity_stage_timestamps()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  event_time timestamptz := now();
  contacted_time timestamptz;
begin
  if new.stage is distinct from old.stage then
    contacted_time := coalesce(new.first_contacted_at, old.first_contacted_at, event_time);

    if new.stage = 'contacted' then
      new.first_contacted_at := contacted_time;
      new.last_contact_at := event_time;
      new.next_follow_up_at := contacted_time + interval '24 hours';
    elsif new.stage = 'follow_up_1' then
      new.first_contacted_at := contacted_time;
      new.follow_up_1_at := coalesce(new.follow_up_1_at, old.follow_up_1_at, event_time);
      new.last_contact_at := event_time;
      new.next_follow_up_at := contacted_time + interval '48 hours';
    elsif new.stage = 'follow_up_2' then
      new.first_contacted_at := contacted_time;
      new.follow_up_2_at := coalesce(new.follow_up_2_at, old.follow_up_2_at, event_time);
      new.last_contact_at := event_time;
      new.next_follow_up_at := null;
    elsif new.stage = 'no_response' then
      new.next_follow_up_at := null;
    elsif new.stage = 'responded' then
      new.first_response_at := coalesce(new.first_response_at, old.first_response_at, event_time);
      new.next_follow_up_at := null;
    elsif new.stage = 'proposal' then
      new.proposal_at := coalesce(new.proposal_at, old.proposal_at, event_time);
      new.next_follow_up_at := null;
    elsif new.stage = 'negotiation' then
      new.negotiation_at := coalesce(new.negotiation_at, old.negotiation_at, event_time);
      new.next_follow_up_at := null;
    elsif new.stage = 'won' then
      new.won_at := coalesce(new.won_at, old.won_at, event_time);
      new.next_follow_up_at := null;
    elsif new.stage = 'lost' then
      new.lost_at := coalesce(new.lost_at, old.lost_at, event_time);
      new.next_follow_up_at := null;
    end if;
  end if;
  return new;
end;
$$;
