alter table public.opportunities
  add column contact_name text,
  add column contact_country text,
  add constraint opportunities_contact_name_length
    check (contact_name is null or char_length(trim(contact_name)) between 1 and 160),
  add constraint opportunities_contact_country_length
    check (contact_country is null or char_length(trim(contact_country)) between 1 and 100);

create unique index opportunities_user_workana_url_unique
  on public.opportunities (user_id, workana_url)
  where workana_url is not null;
