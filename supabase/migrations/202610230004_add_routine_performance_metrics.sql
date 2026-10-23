alter table public.routine_sessions
  add column warmup_hits smallint check (warmup_hits between 0 and 999),
  add column microflick_hits smallint check (microflick_hits between 0 and 999),
  add column deathmatch_kills smallint check (deathmatch_kills between 0 and 999),
  add column deathmatch_deaths smallint check (deathmatch_deaths between 0 and 999),
  add column deathmatch_weapon text check (deathmatch_weapon is null or char_length(trim(deathmatch_weapon)) between 1 and 40),
  add column perceived_difficulty smallint check (perceived_difficulty between 1 and 5),
  add column confidence_before smallint check (confidence_before between 1 and 5),
  add column confidence_after smallint check (confidence_after between 1 and 5),
  add column session_focus text check (session_focus is null or char_length(trim(session_focus)) between 1 and 80);

grant update (
  warmup_hits,
  microflick_hits,
  deathmatch_kills,
  deathmatch_deaths,
  deathmatch_weapon,
  perceived_difficulty,
  confidence_before,
  confidence_after,
  session_focus
) on public.routine_sessions to authenticated;
