alter table public.routine_sessions
  drop constraint if exists routine_sessions_user_id_session_date_key,
  alter column session_date drop not null;

update public.routine_sessions
set session_date = case
  when completed_at is not null then (completed_at at time zone 'UTC')::date
  else null
end
where routine_program_id is not null;

drop function if exists public.create_routine_program(text, date, smallint, smallint[]);

create function public.create_routine_program(
  p_name text,
  p_start_date date,
  p_duration_days smallint
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_program_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_duration_days not in (7, 15, 30) then
    raise exception 'Routine Program length must be 7, 15, or 30 sessions' using errcode = '22023';
  end if;
  if exists (select 1 from public.routine_programs where user_id = v_user_id and status = 'active') then
    raise exception 'Finish the active Routine Program before creating another' using errcode = '23505';
  end if;

  insert into public.routine_programs (user_id, name, start_date, duration_days, weekdays)
  values (v_user_id, btrim(p_name), p_start_date, p_duration_days, array[1, 2, 3, 4, 5, 6, 7]::smallint[])
  returning id into v_program_id;

  insert into public.routine_sessions (user_id, routine_program_id, day_number, session_date)
  select v_user_id, v_program_id, day_number, null
  from generate_series(1, p_duration_days) as generated(day_number);

  return v_program_id;
end;
$$;

drop function if exists public.finish_routine_day(uuid);

create function public.finish_routine_day(p_session_id uuid, p_performed_on date)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_completed_at timestamptz;
  v_program_id uuid;
begin
  if p_performed_on is null then
    raise exception 'Completion date is required' using errcode = '22023';
  end if;

  perform set_config('app.finishing_routine', 'true', true);

  update public.routine_sessions
  set
    started_at = coalesce(started_at, now()),
    completed_at = coalesce(completed_at, now()),
    session_date = coalesce(session_date, p_performed_on)
  where id = p_session_id
    and user_id = (select auth.uid())
  returning completed_at, routine_program_id into v_completed_at, v_program_id;

  if not found then
    raise exception 'Routine day not found' using errcode = 'P0002';
  end if;

  if v_program_id is not null and not exists (
    select 1 from public.routine_sessions
    where routine_program_id = v_program_id and completed_at is null
  ) then
    update public.routine_programs
    set status = 'completed', completed_at = coalesce(completed_at, now())
    where id = v_program_id and user_id = (select auth.uid());
  end if;

  return v_completed_at;
end;
$$;

revoke all on function public.create_routine_program(text, date, smallint) from public, anon;
revoke all on function public.finish_routine_day(uuid, date) from public, anon;
grant execute on function public.create_routine_program(text, date, smallint) to authenticated;
grant execute on function public.finish_routine_day(uuid, date) to authenticated;

notify pgrst, 'reload schema';
