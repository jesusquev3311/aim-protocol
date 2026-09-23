create table public.routine_programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 3 and 60),
  start_date date not null,
  duration_days smallint not null check (duration_days in (7, 15, 30)),
  weekdays smallint[] not null check (
    cardinality(weekdays) between 1 and 7
    and weekdays <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[]
  ),
  status text not null default 'active' check (status in ('active', 'completed', 'abandoned')),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index routine_programs_one_active_per_user_idx
  on public.routine_programs (user_id)
  where status = 'active';
create index routine_programs_user_created_idx
  on public.routine_programs (user_id, created_at desc);

alter table public.routine_programs enable row level security;

create policy "Users can read their own routine programs"
  on public.routine_programs for select to authenticated
  using ((select auth.uid()) = user_id);

grant select on public.routine_programs to authenticated;
revoke all on public.routine_programs from anon;

alter table public.routine_sessions
  add column routine_program_id uuid references public.routine_programs(id) on delete cascade,
  add column day_number smallint check (day_number > 0),
  add column started_at timestamptz;

create index routine_sessions_program_id_idx
  on public.routine_sessions (routine_program_id);
create unique index routine_sessions_program_day_idx
  on public.routine_sessions (routine_program_id, day_number)
  where routine_program_id is not null;

drop policy "Users can create their own routine sessions" on public.routine_sessions;
revoke insert, update on public.routine_sessions from authenticated;
grant update (
  overaim_bots,
  underaim_bots,
  flick_bots,
  microflick_minutes,
  practice_minutes,
  deathmatches,
  ranked_matches,
  shooting_error_graph,
  stop_before_shooting,
  no_crouch_spray,
  burst_strafe,
  notes
) on public.routine_sessions to authenticated;

create or replace function public.create_routine_program(
  p_name text,
  p_start_date date,
  p_duration_days smallint,
  p_weekdays smallint[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_program_id uuid;
  v_generated_days integer := 0;
  v_schedule_date date;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_duration_days not in (7, 15, 30) then
    raise exception 'Routine program duration must be 7, 15, or 30 days' using errcode = '22023';
  end if;
  if cardinality(p_weekdays) is null or cardinality(p_weekdays) = 0
    or not (p_weekdays <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[]) then
    raise exception 'Choose at least one valid weekday' using errcode = '22023';
  end if;
  if exists (select 1 from public.routine_programs where user_id = v_user_id and status = 'active') then
    raise exception 'Finish the active routine program before creating another' using errcode = '23505';
  end if;

  insert into public.routine_programs (user_id, name, start_date, duration_days, weekdays)
  values (v_user_id, btrim(p_name), p_start_date, p_duration_days, array(select distinct unnest(p_weekdays) order by 1))
  returning id into v_program_id;

  for v_schedule_date in
    select p_start_date + offset_value
    from generate_series(0, p_duration_days - 1) as offsets(offset_value)
    where extract(isodow from p_start_date + offset_value)::smallint = any(p_weekdays)
    order by 1
  loop
    v_generated_days := v_generated_days + 1;

    if exists (
      select 1 from public.routine_sessions
      where user_id = v_user_id
        and session_date = v_schedule_date
        and routine_program_id is not null
    ) then
      raise exception 'A Routine Program already owns the session on %', v_schedule_date using errcode = '23505';
    end if;

    update public.routine_sessions
    set routine_program_id = v_program_id, day_number = v_generated_days
    where user_id = v_user_id
      and session_date = v_schedule_date
      and routine_program_id is null;

    if not found then
      insert into public.routine_sessions (user_id, routine_program_id, day_number, session_date)
      values (v_user_id, v_program_id, v_generated_days, v_schedule_date);
    end if;
  end loop;

  if v_generated_days = 0 then
    raise exception 'The selected schedule creates no routine days' using errcode = '22023';
  end if;

  return v_program_id;
end;
$$;

create or replace function public.finish_routine_program(p_program_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.routine_programs
  set status = 'completed', completed_at = coalesce(completed_at, now())
  where id = p_program_id
    and user_id = (select auth.uid())
    and status = 'active';

  if not found then
    raise exception 'Active Routine Program not found' using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.start_routine_session(p_session_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_started_at timestamptz;
begin
  update public.routine_sessions
  set started_at = coalesce(started_at, now())
  where id = p_session_id
    and user_id = (select auth.uid())
  returning started_at into v_started_at;

  if not found then
    raise exception 'Routine day not found' using errcode = 'P0002';
  end if;
  return v_started_at;
end;
$$;

create or replace function public.finish_routine_day(p_session_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_completed_at timestamptz;
  v_program_id uuid;
begin
  perform set_config('app.finishing_routine', 'true', true);

  update public.routine_sessions
  set
    started_at = coalesce(started_at, now()),
    completed_at = coalesce(completed_at, now())
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

revoke all on function public.create_routine_program(text, date, smallint, smallint[]) from public, anon;
revoke all on function public.start_routine_session(uuid) from public, anon;
revoke all on function public.finish_routine_day(uuid) from public, anon;
revoke all on function public.finish_routine_program(uuid) from public, anon;
grant execute on function public.create_routine_program(text, date, smallint, smallint[]) to authenticated;
grant execute on function public.start_routine_session(uuid) to authenticated;
grant execute on function public.finish_routine_day(uuid) to authenticated;
grant execute on function public.finish_routine_program(uuid) to authenticated;
