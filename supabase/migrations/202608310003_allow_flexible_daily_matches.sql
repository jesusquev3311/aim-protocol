alter table public.challenges
  drop constraint if exists challenges_matches_per_day_allowed;

alter table public.challenges
  add constraint challenges_matches_per_day_allowed
  check (matches_per_day between 1 and 10);
