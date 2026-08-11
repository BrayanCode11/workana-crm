-- La mensajería pasa a ser completamente manual. Conservamos los mensajes
-- comerciales reales y eliminamos únicamente los resultados generados por modelos.
drop table if exists public.ai_generations;

alter table public.experiment_variants
  rename column ai_instructions to message_instructions;

alter table public.experiment_variants
  rename constraint experiment_variants_ai_instructions_length
  to experiment_variants_message_instructions_length;

alter table public.opportunities
  add column initial_message text,
  add column follow_up_1_message text,
  add column follow_up_2_message text,
  add constraint opportunities_initial_message_length
    check (char_length(initial_message) <= 20000),
  add constraint opportunities_follow_up_1_message_length
    check (char_length(follow_up_1_message) <= 20000),
  add constraint opportunities_follow_up_2_message_length
    check (char_length(follow_up_2_message) <= 20000);
