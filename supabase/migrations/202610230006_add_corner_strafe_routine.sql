alter table public.routine_programs
  add column template_code text not null default 'mechanics_protocol',
  add column sets_per_side smallint;

alter table public.routine_programs
  add constraint routine_programs_template_code_check
    check (template_code in ('mechanics_protocol', 'corner_strafe_benchmark')),
  add constraint routine_programs_template_configuration_check
    check (
      (template_code = 'mechanics_protocol' and sets_per_side is null)
      or (template_code = 'corner_strafe_benchmark' and sets_per_side in (5, 7))
    );

create table public.routine_benchmark_sets (
  id uuid primary key default gen_random_uuid(),
  routine_session_id uuid not null references public.routine_sessions(id) on delete cascade,
  side text not null check (side in ('left', 'right')),
  set_number smallint not null check (set_number between 1 and 7),
  weapon text not null default 'Vandal' check (weapon in ('Vandal', 'Sheriff')),
  bots_completed smallint not null default 0 check (bots_completed between 0 and 100),
  duration_seconds smallint check (duration_seconds between 1 and 900),
  execution_quality text check (execution_quality in ('clean', 'mixed', 'rushed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (routine_session_id, side, set_number)
);

create index routine_benchmark_sets_session_id_idx
  on public.routine_benchmark_sets (routine_session_id);

alter table public.routine_benchmark_sets enable row level security;

create policy "Users can read their own benchmark sets"
  on public.routine_benchmark_sets for select to authenticated
  using (exists (
    select 1 from public.routine_sessions
    where routine_sessions.id = routine_benchmark_sets.routine_session_id
      and routine_sessions.user_id = (select auth.uid())
  ));

create policy "Users can create their own benchmark sets"
  on public.routine_benchmark_sets for insert to authenticated
  with check (exists (
    select 1 from public.routine_sessions
    join public.routine_programs on routine_programs.id = routine_sessions.routine_program_id
    where routine_sessions.id = routine_benchmark_sets.routine_session_id
      and routine_sessions.user_id = (select auth.uid())
      and routine_programs.template_code = 'corner_strafe_benchmark'
      and routine_benchmark_sets.set_number <= routine_programs.sets_per_side
  ));

create policy "Users can update their own benchmark sets"
  on public.routine_benchmark_sets for update to authenticated
  using (exists (
    select 1 from public.routine_sessions
    where routine_sessions.id = routine_benchmark_sets.routine_session_id
      and routine_sessions.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.routine_sessions
    join public.routine_programs on routine_programs.id = routine_sessions.routine_program_id
    where routine_sessions.id = routine_benchmark_sets.routine_session_id
      and routine_sessions.user_id = (select auth.uid())
      and routine_programs.template_code = 'corner_strafe_benchmark'
      and routine_benchmark_sets.set_number <= routine_programs.sets_per_side
  ));

grant select, insert on public.routine_benchmark_sets to authenticated;
grant update (weapon, bots_completed, duration_seconds, execution_quality, updated_at)
  on public.routine_benchmark_sets to authenticated;
revoke all on public.routine_benchmark_sets from anon;

drop function if exists public.create_routine_program(text, date, smallint);

create function public.create_routine_program(
  p_name text,
  p_start_date date,
  p_duration_days smallint,
  p_template_code text,
  p_sets_per_side smallint
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
  if v_user_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if p_duration_days not in (7, 15, 30) then raise exception 'Routine Program length must be 7, 15, or 30 sessions' using errcode = '22023'; end if;
  if p_template_code not in ('mechanics_protocol', 'corner_strafe_benchmark') then raise exception 'Unknown routine template' using errcode = '22023'; end if;
  if (p_template_code = 'mechanics_protocol' and p_sets_per_side is not null)
    or (p_template_code = 'corner_strafe_benchmark' and p_sets_per_side not in (5, 7)) then
    raise exception 'Invalid routine template configuration' using errcode = '22023';
  end if;
  if exists (select 1 from public.routine_programs where user_id = v_user_id and status = 'active') then
    raise exception 'Finish the active Routine Program before creating another' using errcode = '23505';
  end if;

  insert into public.routine_programs (user_id, name, start_date, duration_days, weekdays, template_code, sets_per_side)
  values (v_user_id, btrim(p_name), p_start_date, p_duration_days, array[1, 2, 3, 4, 5, 6, 7]::smallint[], p_template_code, p_sets_per_side)
  returning id into v_program_id;

  insert into public.routine_sessions (user_id, routine_program_id, day_number, session_date)
  select v_user_id, v_program_id, day_number, null
  from generate_series(1, p_duration_days) as generated(day_number);
  return v_program_id;
end;
$$;

revoke all on function public.create_routine_program(text, date, smallint, text, smallint) from public, anon;
grant execute on function public.create_routine_program(text, date, smallint, text, smallint) to authenticated;

notify pgrst, 'reload schema';
