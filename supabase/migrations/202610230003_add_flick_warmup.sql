alter table public.routine_sessions
  add column flick_warmup_minutes smallint not null default 0
  check (flick_warmup_minutes = 0 or flick_warmup_minutes between 3 and 10);

grant update (flick_warmup_minutes) on public.routine_sessions to authenticated;

notify pgrst, 'reload schema';
