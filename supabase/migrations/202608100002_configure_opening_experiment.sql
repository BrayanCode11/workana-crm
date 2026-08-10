do $$
declare
  owner_id uuid;
  current_experiment_id uuid;
begin
  for owner_id in select id from public.profiles loop
    select id into current_experiment_id
    from public.experiments
    where user_id = owner_id and name = 'Consulta Workana — Apertura v1'
    order by created_at
    limit 1;

    if current_experiment_id is null then
      insert into public.experiments (user_id, name, description, status, started_at)
      values (
        owner_id,
        'Consulta Workana — Apertura v1',
        'Compara el enfoque del primer mensaje de consulta para aumentar la tasa de respuesta.',
        'active',
        current_date
      )
      returning id into current_experiment_id;
    end if;

    if not exists (
      select 1 from public.experiments
      where user_id = owner_id and is_default_for_new_opportunities
    ) then
      update public.experiments
      set is_default_for_new_opportunities = true
      where id = current_experiment_id and user_id = owner_id and status = 'active';
    end if;

    update public.experiment_variants
    set name = 'Pregunta consultiva',
        ai_instructions = E'Construye la apertura principalmente alrededor de una pregunta estratégica directamente relacionada con el proyecto.\n\nDemuestra que entendiste el requerimiento, pero no hagas un diagnóstico técnico previo ni presentes una solución completa.\n\nUsa una o máximo dos preguntas. La prioridad absoluta es que el cliente responda.'
    where user_id = owner_id and experiment_id = current_experiment_id and lower(code) = 'a';
    if not found then
      insert into public.experiment_variants (user_id, experiment_id, code, name, ai_instructions)
      values (owner_id, current_experiment_id, 'A', 'Pregunta consultiva', E'Construye la apertura principalmente alrededor de una pregunta estratégica directamente relacionada con el proyecto.\n\nDemuestra que entendiste el requerimiento, pero no hagas un diagnóstico técnico previo ni presentes una solución completa.\n\nUsa una o máximo dos preguntas. La prioridad absoluta es que el cliente responda.');
    end if;

    update public.experiment_variants
    set name = 'Microdiagnóstico',
        ai_instructions = E'Antes de preguntar, identifica una implicación técnica o estratégica real derivada de la publicación.\n\nComunícala brevemente y después formula una pregunta relacionada.\n\nNo inventes problemas, no alarmes al cliente y no conviertas el mensaje en una auditoría gratuita.\n\nLa prioridad es demostrar criterio y conseguir respuesta.'
    where user_id = owner_id and experiment_id = current_experiment_id and lower(code) = 'b';
    if not found then
      insert into public.experiment_variants (user_id, experiment_id, code, name, ai_instructions)
      values (owner_id, current_experiment_id, 'B', 'Microdiagnóstico', E'Antes de preguntar, identifica una implicación técnica o estratégica real derivada de la publicación.\n\nComunícala brevemente y después formula una pregunta relacionada.\n\nNo inventes problemas, no alarmes al cliente y no conviertas el mensaje en una auditoría gratuita.\n\nLa prioridad es demostrar criterio y conseguir respuesta.');
    end if;

    current_experiment_id := null;
  end loop;
end;
$$;
