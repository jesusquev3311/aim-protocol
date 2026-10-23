update public.routine_sessions
set practice_minutes = least(practice_minutes, 45)
where practice_minutes > 45;

alter table public.routine_sessions
  drop constraint routine_sessions_practice_minutes_check,
  add constraint routine_sessions_practice_minutes_check check (practice_minutes between 0 and 45);

revoke update (practice_minutes) on public.routine_sessions from authenticated;

create or replace function public.finish_routine_day(p_session_id uuid, p_performed_on date)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := now();
  v_started_at timestamptz;
  v_completed_at timestamptz;
  v_existing_completed_at timestamptz;
  v_program_id uuid;
begin
  if p_performed_on is null then
    raise exception 'Completion date is required' using errcode = '22023';
  end if;

  select started_at, completed_at
  into v_started_at, v_existing_completed_at
  from public.routine_sessions
  where id = p_session_id
    and user_id = (select auth.uid());

  if not found then
    raise exception 'Routine day not found' using errcode = 'P0002';
  end if;
  if v_started_at is null then
    raise exception 'Start the routine timer before finishing the day' using errcode = '22023';
  end if;

  perform set_config('app.finishing_routine', 'true', true);

  update public.routine_sessions
  set
    completed_at = coalesce(completed_at, v_now),
    session_date = coalesce(session_date, p_performed_on),
    practice_minutes = case
      when v_existing_completed_at is not null then practice_minutes
      else least(45, greatest(0, ceil(extract(epoch from (v_now - v_started_at)) / 60.0)::integer))
    end
  where id = p_session_id
    and user_id = (select auth.uid())
  returning completed_at, routine_program_id into v_completed_at, v_program_id;

  if v_program_id is not null and not exists (
    select 1 from public.routine_sessions
    where routine_program_id = v_program_id and completed_at is null
  ) then
    update public.routine_programs
    set status = 'completed', completed_at = coalesce(completed_at, v_now)
    where id = v_program_id and user_id = (select auth.uid());
  end if;

  return v_completed_at;
end;
$$;

revoke all on function public.finish_routine_day(uuid, date) from public, anon;
grant execute on function public.finish_routine_day(uuid, date) to authenticated;

notify pgrst, 'reload schema';
