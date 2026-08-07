-- Prospecta: initial CRM schema
-- Business values use stable English slugs; the UI is responsible for Spanish labels.

create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (
    display_name is null or char_length(trim(display_name)) between 1 and 100
  )
);

create table public.clients (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  company_name text,
  country text,
  workana_profile_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clients_owner_key unique (id, user_id),
  constraint clients_name_length check (char_length(trim(name)) between 1 and 160),
  constraint clients_company_name_length check (
    company_name is null or char_length(trim(company_name)) between 1 and 160
  ),
  constraint clients_workana_profile_url_format check (
    workana_profile_url is null or workana_profile_url ~* '^https?://'
  )
);

create table public.experiments (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'active',
  started_at date,
  ended_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint experiments_owner_key unique (id, user_id),
  constraint experiments_name_length check (char_length(trim(name)) between 1 and 180),
  constraint experiments_status_valid check (status in ('active', 'paused', 'completed')),
  constraint experiments_dates_valid check (
    ended_at is null or started_at is null or ended_at >= started_at
  )
);

create table public.experiment_variants (
  id uuid primary key default extensions.gen_random_uuid(),
  experiment_id uuid not null,
  user_id uuid not null default auth.uid(),
  code text not null,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint experiment_variants_owner_key unique (id, experiment_id, user_id),
  constraint experiment_variants_experiment_fk
    foreign key (experiment_id, user_id)
    references public.experiments (id, user_id)
    on delete cascade,
  constraint experiment_variants_code_length check (char_length(trim(code)) between 1 and 20),
  constraint experiment_variants_name_length check (char_length(trim(name)) between 1 and 160)
);

create unique index experiment_variants_code_unique
  on public.experiment_variants (experiment_id, lower(code));

create table public.lost_reasons (
  id smallint generated always as identity primary key,
  name text not null,
  slug text not null unique,
  is_active boolean not null default true,
  constraint lost_reasons_name_length check (char_length(trim(name)) between 1 and 100),
  constraint lost_reasons_slug_format check (slug ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$')
);

create table public.opportunities (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  client_id uuid,
  title text not null,
  workana_url text,
  description text,
  published_budget_min numeric(14, 2),
  published_budget_max numeric(14, 2),
  published_budget_currency text,
  planned_price numeric(14, 2),
  planned_price_currency text,
  project_type text,
  technologies text[] not null default '{}',
  stage text not null default 'detected',
  experiment_id uuid,
  experiment_variant_id uuid,
  published_at timestamptz,
  first_contacted_at timestamptz,
  first_response_at timestamptz,
  follow_up_1_at timestamptz,
  follow_up_2_at timestamptz,
  proposal_at timestamptz,
  negotiation_at timestamptz,
  won_at timestamptz,
  lost_at timestamptz,
  last_contact_at timestamptz,
  next_follow_up_at timestamptz,
  final_value numeric(14, 2),
  final_value_currency text,
  lost_reason_id smallint references public.lost_reasons (id),
  lost_reason_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint opportunities_owner_key unique (id, user_id),
  constraint opportunities_client_fk
    foreign key (client_id, user_id)
    references public.clients (id, user_id),
  constraint opportunities_experiment_fk
    foreign key (experiment_id, user_id)
    references public.experiments (id, user_id),
  constraint opportunities_variant_fk
    foreign key (experiment_variant_id, experiment_id, user_id)
    references public.experiment_variants (id, experiment_id, user_id),
  constraint opportunities_title_length check (char_length(trim(title)) between 1 and 240),
  constraint opportunities_workana_url_format check (
    workana_url is null or workana_url ~* '^https?://'
  ),
  constraint opportunities_stage_valid check (
    stage in (
      'detected',
      'contacted',
      'follow_up_1',
      'follow_up_2',
      'responded',
      'proposal',
      'negotiation',
      'won',
      'lost'
    )
  ),
  constraint opportunities_budget_non_negative check (
    (published_budget_min is null or published_budget_min >= 0)
    and (published_budget_max is null or published_budget_max >= 0)
  ),
  constraint opportunities_budget_range_valid check (
    published_budget_min is null
    or published_budget_max is null
    or published_budget_min <= published_budget_max
  ),
  constraint opportunities_budget_currency_pair check (
    (
      published_budget_min is null
      and published_budget_max is null
      and published_budget_currency is null
    )
    or (
      (published_budget_min is not null or published_budget_max is not null)
      and published_budget_currency is not null
    )
  ),
  constraint opportunities_planned_price_pair check (
    (planned_price is null and planned_price_currency is null)
    or (planned_price is not null and planned_price >= 0 and planned_price_currency is not null)
  ),
  constraint opportunities_final_value_pair check (
    (final_value is null and final_value_currency is null)
    or (final_value is not null and final_value >= 0 and final_value_currency is not null)
  ),
  constraint opportunities_currency_codes_valid check (
    (published_budget_currency is null or published_budget_currency ~ '^[A-Z]{3}$')
    and (planned_price_currency is null or planned_price_currency ~ '^[A-Z]{3}$')
    and (final_value_currency is null or final_value_currency ~ '^[A-Z]{3}$')
  ),
  constraint opportunities_variant_requires_experiment check (
    experiment_variant_id is null or experiment_id is not null
  ),
  constraint opportunities_won_requires_value check (
    stage <> 'won' or (final_value is not null and final_value_currency is not null)
  ),
  constraint opportunities_lost_requires_reason check (
    stage <> 'lost' or lost_reason_id is not null
  )
);

create table public.opportunity_notes (
  id uuid primary key default extensions.gen_random_uuid(),
  opportunity_id uuid not null,
  user_id uuid not null default auth.uid(),
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint opportunity_notes_opportunity_fk
    foreign key (opportunity_id, user_id)
    references public.opportunities (id, user_id)
    on delete cascade,
  constraint opportunity_notes_content_length check (
    char_length(trim(content)) between 1 and 10000
  )
);

insert into public.lost_reasons (name, slug)
values
  ('Sin respuesta', 'no_response'),
  ('Presupuesto demasiado bajo', 'budget_too_low'),
  ('Eligió otro profesional', 'chose_another_professional'),
  ('Proyecto cancelado', 'project_cancelled'),
  ('Alcance poco claro', 'unclear_scope'),
  ('No tuve disponibilidad', 'no_availability'),
  ('Precio', 'price'),
  ('Tiempo de entrega', 'delivery_time'),
  ('Tecnología fuera de mi foco', 'technology_out_of_focus'),
  ('Cliente poco confiable', 'unreliable_client'),
  ('Otro', 'other'),
  ('Desconocido', 'unknown');

create index clients_user_created_idx
  on public.clients (user_id, created_at desc);

create index opportunities_user_created_idx
  on public.opportunities (user_id, created_at desc);

create index opportunities_user_stage_idx
  on public.opportunities (user_id, stage);

create index opportunities_client_idx
  on public.opportunities (client_id)
  where client_id is not null;

create index opportunities_experiment_idx
  on public.opportunities (experiment_id, experiment_variant_id)
  where experiment_id is not null;

create index opportunities_pending_follow_up_idx
  on public.opportunities (user_id, next_follow_up_at)
  where next_follow_up_at is not null and stage not in ('won', 'lost');

create index opportunity_notes_opportunity_created_idx
  on public.opportunity_notes (opportunity_id, created_at desc);

create index experiments_user_status_idx
  on public.experiments (user_id, status);

create index experiment_variants_experiment_active_idx
  on public.experiment_variants (experiment_id, is_active);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_opportunity_stage_timestamps()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.stage is distinct from old.stage then
    case new.stage
      when 'contacted' then
        new.first_contacted_at = coalesce(new.first_contacted_at, now());
        new.last_contact_at = coalesce(new.last_contact_at, new.first_contacted_at);
        if new.next_follow_up_at is null
          or (tg_op = 'UPDATE' and new.next_follow_up_at is not distinct from old.next_follow_up_at)
        then
          new.next_follow_up_at = new.first_contacted_at + interval '36 hours';
        end if;
      when 'follow_up_1' then
        new.follow_up_1_at = coalesce(new.follow_up_1_at, now());
        new.last_contact_at = new.follow_up_1_at;
        if new.next_follow_up_at is null
          or (tg_op = 'UPDATE' and new.next_follow_up_at is not distinct from old.next_follow_up_at)
        then
          new.next_follow_up_at = new.follow_up_1_at + interval '3 days';
        end if;
      when 'follow_up_2' then
        new.follow_up_2_at = coalesce(new.follow_up_2_at, now());
        new.last_contact_at = new.follow_up_2_at;
        new.next_follow_up_at = null;
      when 'responded' then
        new.first_response_at = coalesce(new.first_response_at, now());
        new.next_follow_up_at = null;
      when 'proposal' then
        new.proposal_at = coalesce(new.proposal_at, now());
      when 'negotiation' then
        new.negotiation_at = coalesce(new.negotiation_at, now());
      when 'won' then
        new.won_at = coalesce(new.won_at, now());
        new.next_follow_up_at = null;
      when 'lost' then
        new.lost_at = coalesce(new.lost_at, now());
        new.next_follow_up_at = null;
      else
        null;
    end case;
  end if;

  return new;
end;
$$;

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

  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

create trigger experiments_set_updated_at
  before update on public.experiments
  for each row execute function public.set_updated_at();

create trigger experiment_variants_set_updated_at
  before update on public.experiment_variants
  for each row execute function public.set_updated_at();

create trigger opportunities_set_stage_timestamps
  before insert or update of stage on public.opportunities
  for each row execute function public.set_opportunity_stage_timestamps();

create trigger opportunities_set_updated_at
  before update on public.opportunities
  for each row execute function public.set_updated_at();

create trigger opportunity_notes_set_updated_at
  before update on public.opportunity_notes
  for each row execute function public.set_updated_at();

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

revoke all on function public.set_updated_at() from public;
revoke all on function public.set_opportunity_stage_timestamps() from public;
revoke all on function public.handle_new_user() from public;

