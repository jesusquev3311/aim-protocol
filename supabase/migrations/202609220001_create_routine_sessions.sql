create table public.routine_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_date date not null,
  overaim_bots smallint not null default 0 check (overaim_bots between 0 and 999),
  underaim_bots smallint not null default 0 check (underaim_bots between 0 and 999),
  flick_bots smallint not null default 0 check (flick_bots between 0 and 999),
  microflick_minutes smallint not null default 0 check (microflick_minutes between 0 and 120),
  practice_minutes smallint not null default 0 check (practice_minutes between 0 and 480),
  deathmatches smallint not null default 0 check (deathmatches between 0 and 20),
  ranked_matches smallint not null default 0 check (ranked_matches between 0 and 20),
  shooting_error_graph boolean not null default false,
  stop_before_shooting boolean not null default false,
  no_crouch_spray boolean not null default false,
  burst_strafe boolean not null default false,
  notes text check (char_length(notes) <= 2000),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, session_date)
);

alter table public.routine_sessions enable row level security;

create policy "Users can read their own routine sessions"
  on public.routine_sessions for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own routine sessions"
  on public.routine_sessions for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own routine sessions"
  on public.routine_sessions for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update on public.routine_sessions to authenticated;
revoke all on public.routine_sessions from anon;

create or replace function public.prepare_routine_session()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  if new.overaim_bots >= 30
    and new.underaim_bots >= 30
    and new.flick_bots >= 30
    and new.microflick_minutes >= 3
    and new.practice_minutes >= 30 then
    if tg_op = 'UPDATE' then
      new.completed_at := coalesce(old.completed_at, now());
    else
      new.completed_at := now();
    end if;
  else
    new.completed_at := null;
  end if;
  return new;
end;
$$;

create trigger before_routine_session_write_prepare
  before insert or update on public.routine_sessions
  for each row execute procedure public.prepare_routine_session();

revoke all on function public.prepare_routine_session() from public, anon, authenticated;
