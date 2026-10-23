alter table public.routine_sessions
  add column peek_left_repetitions smallint not null default 0 check (peek_left_repetitions between 0 and 20),
  add column peek_right_repetitions smallint not null default 0 check (peek_right_repetitions between 0 and 20),
  add column strafe_close_repetitions smallint not null default 0 check (strafe_close_repetitions between 0 and 60),
  add column strafe_mid_repetitions smallint not null default 0 check (strafe_mid_repetitions between 0 and 60),
  add column strafe_long_repetitions smallint not null default 0 check (strafe_long_repetitions between 0 and 60);

grant update (
  peek_left_repetitions,
  peek_right_repetitions,
  strafe_close_repetitions,
  strafe_mid_repetitions,
  strafe_long_repetitions
) on public.routine_sessions to authenticated;
