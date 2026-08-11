-- La etapa real del CRM se llama `proposal`. La automatización anterior utilizó
-- por error `proposal_sent`, por lo que restauramos el nombre canónico sin
-- cambiar la cadencia exacta de Consulta/F1/F2.
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
