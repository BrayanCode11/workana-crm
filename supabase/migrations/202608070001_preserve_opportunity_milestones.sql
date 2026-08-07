-- Keep the first timestamp recorded for every commercial milestone.
-- A later return to the same stage must never replace its historical date.
create or replace function public.set_opportunity_stage_timestamps()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.stage is distinct from old.stage then
    case new.stage
      when 'contacted' then
        if tg_op = 'UPDATE' then
          new.first_contacted_at = coalesce(old.first_contacted_at, new.first_contacted_at, now());
        else
          new.first_contacted_at = coalesce(new.first_contacted_at, now());
        end if;
        new.last_contact_at = coalesce(new.last_contact_at, new.first_contacted_at);
        if new.next_follow_up_at is null
          or (tg_op = 'UPDATE' and new.next_follow_up_at is not distinct from old.next_follow_up_at)
        then
          new.next_follow_up_at = new.first_contacted_at + interval '36 hours';
        end if;
      when 'follow_up_1' then
        if tg_op = 'UPDATE' then
          new.follow_up_1_at = coalesce(old.follow_up_1_at, new.follow_up_1_at, now());
        else
          new.follow_up_1_at = coalesce(new.follow_up_1_at, now());
        end if;
        new.last_contact_at = new.follow_up_1_at;
        if new.next_follow_up_at is null
          or (tg_op = 'UPDATE' and new.next_follow_up_at is not distinct from old.next_follow_up_at)
        then
          new.next_follow_up_at = new.follow_up_1_at + interval '3 days';
        end if;
      when 'follow_up_2' then
        if tg_op = 'UPDATE' then
          new.follow_up_2_at = coalesce(old.follow_up_2_at, new.follow_up_2_at, now());
        else
          new.follow_up_2_at = coalesce(new.follow_up_2_at, now());
        end if;
        new.last_contact_at = new.follow_up_2_at;
        new.next_follow_up_at = null;
      when 'responded' then
        if tg_op = 'UPDATE' then
          new.first_response_at = coalesce(old.first_response_at, new.first_response_at, now());
        else
          new.first_response_at = coalesce(new.first_response_at, now());
        end if;
        new.next_follow_up_at = null;
      when 'proposal' then
        if tg_op = 'UPDATE' then
          new.proposal_at = coalesce(old.proposal_at, new.proposal_at, now());
        else
          new.proposal_at = coalesce(new.proposal_at, now());
        end if;
      when 'negotiation' then
        if tg_op = 'UPDATE' then
          new.negotiation_at = coalesce(old.negotiation_at, new.negotiation_at, now());
        else
          new.negotiation_at = coalesce(new.negotiation_at, now());
        end if;
      when 'won' then
        if tg_op = 'UPDATE' then
          new.won_at = coalesce(old.won_at, new.won_at, now());
        else
          new.won_at = coalesce(new.won_at, now());
        end if;
        new.next_follow_up_at = null;
      when 'lost' then
        if tg_op = 'UPDATE' then
          new.lost_at = coalesce(old.lost_at, new.lost_at, now());
        else
          new.lost_at = coalesce(new.lost_at, now());
        end if;
        new.next_follow_up_at = null;
      else
        null;
    end case;
  end if;

  return new;
end;
$$;
