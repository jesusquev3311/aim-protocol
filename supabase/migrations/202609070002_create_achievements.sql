create table public.achievements (
  id bigint generated always as identity primary key,
  code text not null unique,
  name text not null,
  description text not null,
  icon text not null,
  created_at timestamptz not null default now(),
  constraint achievements_code_format check (code ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.challenge_achievements (
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  achievement_id bigint not null references public.achievements(id) on delete restrict,
  unlocked_at timestamptz not null default now(),
  primary key (challenge_id, achievement_id)
);

create index challenge_achievements_achievement_id_idx
  on public.challenge_achievements (achievement_id);

insert into public.achievements (code, name, description, icon)
values
  ('first-match', 'First Match', 'Record your first Deathmatch.', 'crosshair'),
  ('first-day', 'Day One', 'Complete your first training day.', 'calendar-check'),
  ('five-days', 'Building Momentum', 'Complete five training days.', 'flame'),
  ('ten-days', 'Committed', 'Complete ten training days.', 'medal'),
  ('high-performer', 'High Performer', 'Record a match with a K/D of at least 2.0.', 'target'),
  ('weapon-explorer', 'Weapon Explorer', 'Record matches with four different weapons.', 'shuffle'),
  ('challenge-complete', 'Protocol Complete', 'Complete every day in a challenge.', 'trophy');

alter table public.achievements enable row level security;
alter table public.challenge_achievements enable row level security;

create policy "Authenticated users can read achievements"
  on public.achievements for select to authenticated using (true);

create policy "Users can read achievements for their challenges"
  on public.challenge_achievements for select to authenticated
  using (exists (
    select 1 from public.challenges
    where challenges.id = challenge_achievements.challenge_id
      and challenges.user_id = (select auth.uid())
  ));

revoke all on public.achievements, public.challenge_achievements from anon;
grant select on public.achievements, public.challenge_achievements to authenticated;

create or replace function public.evaluate_challenge_achievements(p_challenge_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner_id uuid;
begin
  select user_id into v_owner_id
  from public.challenges
  where id = p_challenge_id;

  if v_owner_id is distinct from (select auth.uid()) then
    raise exception 'Challenge not found' using errcode = '42501';
  end if;

  insert into public.challenge_achievements (challenge_id, achievement_id)
  select p_challenge_id, achievements.id
  from public.achievements
  where
    (achievements.code = 'first-match' and exists (
      select 1 from public.deathmatches
      join public.training_days on training_days.id = deathmatches.training_day_id
      where training_days.challenge_id = p_challenge_id
    ))
    or (achievements.code = 'first-day' and exists (
      select 1 from public.training_days
      where challenge_id = p_challenge_id and status = 'completed'
    ))
    or (achievements.code = 'five-days' and 5 <= (
      select count(*) from public.training_days
      where challenge_id = p_challenge_id and status = 'completed'
    ))
    or (achievements.code = 'ten-days' and 10 <= (
      select count(*) from public.training_days
      where challenge_id = p_challenge_id and status = 'completed'
    ))
    or (achievements.code = 'high-performer' and exists (
      select 1 from public.deathmatches
      join public.training_days on training_days.id = deathmatches.training_day_id
      where training_days.challenge_id = p_challenge_id
        and deathmatches.kills >= 10
        and deathmatches.kills::numeric / greatest(deathmatches.deaths, 1) >= 2
    ))
    or (achievements.code = 'weapon-explorer' and 4 <= (
      select count(distinct deathmatches.weapon)
      from public.deathmatches
      join public.training_days on training_days.id = deathmatches.training_day_id
      where training_days.challenge_id = p_challenge_id
    ))
    or (achievements.code = 'challenge-complete' and exists (
      select 1 from public.challenges
      where id = p_challenge_id and status = 'completed'
    ))
  on conflict (challenge_id, achievement_id) do nothing;
end;
$$;

create or replace function public.evaluate_achievements_after_deathmatch()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_challenge_id uuid;
begin
  select challenge_id into v_challenge_id from public.training_days where id = new.training_day_id;
  perform public.evaluate_challenge_achievements(v_challenge_id);
  return new;
end;
$$;

create or replace function public.evaluate_achievements_after_training_day()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.status is distinct from new.status then
    perform public.evaluate_challenge_achievements(new.challenge_id);
  end if;
  return new;
end;
$$;

create or replace function public.evaluate_achievements_after_challenge()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.status is distinct from new.status then
    perform public.evaluate_challenge_achievements(new.id);
  end if;
  return new;
end;
$$;

create trigger after_deathmatch_write_evaluate_achievements
  after insert or update on public.deathmatches
  for each row execute procedure public.evaluate_achievements_after_deathmatch();

create trigger after_training_day_status_update_evaluate_achievements
  after update of status on public.training_days
  for each row execute procedure public.evaluate_achievements_after_training_day();

create trigger after_challenge_status_update_evaluate_achievements
  after update of status on public.challenges
  for each row execute procedure public.evaluate_achievements_after_challenge();

revoke all on function public.evaluate_challenge_achievements(uuid) from public, anon, authenticated;
revoke all on function public.evaluate_achievements_after_deathmatch() from public, anon, authenticated;
revoke all on function public.evaluate_achievements_after_training_day() from public, anon, authenticated;
revoke all on function public.evaluate_achievements_after_challenge() from public, anon, authenticated;

-- Backfill qualifying achievements for existing challenges.
insert into public.challenge_achievements (challenge_id, achievement_id, unlocked_at)
select challenges.id, achievements.id, now()
from public.challenges
cross join public.achievements
where
  (achievements.code = 'first-match' and exists (
    select 1 from public.deathmatches join public.training_days on training_days.id = deathmatches.training_day_id
    where training_days.challenge_id = challenges.id
  ))
  or (achievements.code = 'first-day' and exists (
    select 1 from public.training_days where training_days.challenge_id = challenges.id and training_days.status = 'completed'
  ))
  or (achievements.code = 'five-days' and 5 <= (select count(*) from public.training_days where training_days.challenge_id = challenges.id and training_days.status = 'completed'))
  or (achievements.code = 'ten-days' and 10 <= (select count(*) from public.training_days where training_days.challenge_id = challenges.id and training_days.status = 'completed'))
  or (achievements.code = 'high-performer' and exists (
    select 1 from public.deathmatches join public.training_days on training_days.id = deathmatches.training_day_id
    where training_days.challenge_id = challenges.id
      and deathmatches.kills >= 10
      and deathmatches.kills::numeric / greatest(deathmatches.deaths, 1) >= 2
  ))
  or (achievements.code = 'weapon-explorer' and 4 <= (
    select count(distinct deathmatches.weapon)
    from public.deathmatches join public.training_days on training_days.id = deathmatches.training_day_id
    where training_days.challenge_id = challenges.id
  ))
  or (achievements.code = 'challenge-complete' and challenges.status = 'completed')
on conflict (challenge_id, achievement_id) do nothing;
