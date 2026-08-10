alter table public.experiments
  add column is_default_for_new_opportunities boolean not null default false;

create unique index experiments_one_default_per_user_idx
  on public.experiments (user_id)
  where is_default_for_new_opportunities;

alter table public.experiment_variants
  add column ai_instructions text,
  add constraint experiment_variants_ai_instructions_length
    check (char_length(ai_instructions) <= 10000);

create table public.opportunity_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id uuid not null,
  direction text not null check (direction in ('inbound', 'outbound')),
  message_type text not null check (message_type in ('initial', 'follow_up_1', 'follow_up_2', 'reply', 'proposal', 'other')),
  content text not null check (char_length(trim(content)) between 1 and 20000),
  created_at timestamptz not null default now(),
  constraint opportunity_messages_opportunity_fk
    foreign key (opportunity_id, user_id)
    references public.opportunities(id, user_id)
    on delete cascade
);

create index opportunity_messages_opportunity_created_idx
  on public.opportunity_messages (opportunity_id, created_at);

create table public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id uuid not null,
  generation_type text not null check (generation_type in ('project_analysis', 'reply_analysis', 'proposal')),
  content text,
  structured_data jsonb not null,
  prompt_version text not null,
  model text not null,
  created_at timestamptz not null default now(),
  constraint ai_generations_opportunity_fk
    foreign key (opportunity_id, user_id)
    references public.opportunities(id, user_id)
    on delete cascade
);

create index ai_generations_opportunity_created_idx
  on public.ai_generations (opportunity_id, generation_type, created_at desc);

alter table public.opportunity_messages enable row level security;
alter table public.ai_generations enable row level security;

create policy "Users can read own opportunity messages"
  on public.opportunity_messages for select
  using ((select auth.uid()) = user_id);
create policy "Users can insert own opportunity messages"
  on public.opportunity_messages for insert
  with check ((select auth.uid()) = user_id);
create policy "Users can update own opportunity messages"
  on public.opportunity_messages for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users can delete own opportunity messages"
  on public.opportunity_messages for delete
  using ((select auth.uid()) = user_id);

create policy "Users can read own AI generations"
  on public.ai_generations for select
  using ((select auth.uid()) = user_id);
create policy "Users can insert own AI generations"
  on public.ai_generations for insert
  with check ((select auth.uid()) = user_id);
create policy "Users can delete own AI generations"
  on public.ai_generations for delete
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.opportunity_messages to authenticated;
grant select, insert, delete on public.ai_generations to authenticated;
revoke all on public.opportunity_messages from anon;
revoke all on public.ai_generations from anon;

-- Si el usuario solo tiene un experimento activo, es el único candidato no ambiguo.
update public.experiments e
set is_default_for_new_opportunities = true
where e.status = 'active'
  and 1 = (
    select count(*) from public.experiments active_e
    where active_e.user_id = e.user_id and active_e.status = 'active'
  );

-- Configuración de datos del experimento actual. La aplicación nunca interpreta A/B.
update public.experiment_variants v
set ai_instructions = case v.code
  when 'A' then 'Redacta una apertura consultiva: demuestra comprensión concreta del proyecto y termina con una sola pregunta útil para aclarar alcance. Evita presentaciones largas, listas genéricas y presión comercial.'
  when 'B' then 'Redacta una apertura orientada a diagnóstico: señala brevemente el principal riesgo o decisión técnica del proyecto y formula una sola pregunta que ayude al cliente a avanzar. Mantén un tono profesional, directo y humano.'
  else v.ai_instructions
end
from public.experiments e
where v.experiment_id = e.id
  and v.user_id = e.user_id
  and e.name = 'Consulta Workana — Apertura v1'
  and v.code in ('A', 'B')
  and v.ai_instructions is null;

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
    elsif new.stage = 'responded' then
      new.first_response_at := coalesce(new.first_response_at, old.first_response_at, event_time);
      new.next_follow_up_at := null;
    elsif new.stage = 'proposal_sent' then
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
