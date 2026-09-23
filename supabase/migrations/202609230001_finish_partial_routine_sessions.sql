create or replace function public.prepare_routine_session()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();

  if tg_op = 'INSERT' then
    new.completed_at := null;
  elsif current_setting('app.finishing_routine', true) is distinct from 'true' then
    new.completed_at := old.completed_at;
  end if;

  return new;
end;
$$;

create or replace function public.finish_routine_session(p_session_date date)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_completed_at timestamptz;
begin
  perform set_config('app.finishing_routine', 'true', true);

  update public.routine_sessions
  set completed_at = coalesce(completed_at, now())
  where user_id = (select auth.uid())
    and session_date = p_session_date
  returning completed_at into v_completed_at;

  if not found then
    raise exception 'Save the routine session before finishing the day' using errcode = 'P0002';
  end if;

  return v_completed_at;
end;
$$;

revoke all on function public.finish_routine_session(date) from public, anon;
grant execute on function public.finish_routine_session(date) to authenticated;
