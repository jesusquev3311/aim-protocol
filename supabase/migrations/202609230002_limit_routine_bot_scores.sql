update public.routine_sessions
set
  overaim_bots = least(overaim_bots, 30),
  underaim_bots = least(underaim_bots, 30),
  flick_bots = least(flick_bots, 30)
where overaim_bots > 30
   or underaim_bots > 30
   or flick_bots > 30;

alter table public.routine_sessions
  drop constraint routine_sessions_overaim_bots_check,
  drop constraint routine_sessions_underaim_bots_check,
  drop constraint routine_sessions_flick_bots_check,
  add constraint routine_sessions_overaim_bots_check check (overaim_bots between 0 and 30),
  add constraint routine_sessions_underaim_bots_check check (underaim_bots between 0 and 30),
  add constraint routine_sessions_flick_bots_check check (flick_bots between 0 and 30);
