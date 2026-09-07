alter table public.achievements
  add column milestone_days smallint;

alter table public.achievements
  add constraint achievements_milestone_days_positive
  check (milestone_days is null or milestone_days > 0);

update public.achievements set milestone_days = 1 where code = 'first-day';
update public.achievements set milestone_days = 5 where code = 'five-days';
update public.achievements set milestone_days = 10 where code = 'ten-days';

insert into public.achievements (code, name, description, icon, milestone_days)
values
  ('fifteen-days', 'Sharpened Focus', 'Complete fifteen training days.', 'zap', 15),
  ('twenty-days', 'Protocol Veteran', 'Complete twenty training days.', 'shield', 20),
  ('thirty-days', 'Aim Discipline', 'Complete thirty training days.', 'diamond', 30),
  ('forty-five-days', 'Elite Consistency', 'Complete forty-five training days.', 'crown', 45)
on conflict (code) do update
set milestone_days = excluded.milestone_days;

update public.achievements
set description = 'Complete every scheduled training day.'
where code = 'challenge-complete';

create or replace function public.evaluate_challenge_achievements(p_challenge_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner_id uuid;
  v_completed_days bigint;
begin
  select user_id into v_owner_id from public.challenges where id = p_challenge_id;
  if v_owner_id is distinct from (select auth.uid()) then
    raise exception 'Challenge not found' using errcode = '42501';
  end if;

  select count(*) into v_completed_days
  from public.training_days
  where challenge_id = p_challenge_id and status = 'completed';

  insert into public.challenge_achievements (challenge_id, achievement_id)
  select p_challenge_id, achievements.id
  from public.achievements
  where
    (achievements.milestone_days is not null and achievements.milestone_days <= v_completed_days)
    or (achievements.code = 'first-match' and exists (
      select 1 from public.deathmatches join public.training_days on training_days.id = deathmatches.training_day_id
      where training_days.challenge_id = p_challenge_id
    ))
    or (achievements.code = 'high-performer' and exists (
      select 1 from public.deathmatches join public.training_days on training_days.id = deathmatches.training_day_id
      where training_days.challenge_id = p_challenge_id
        and deathmatches.kills >= 10
        and deathmatches.kills::numeric / greatest(deathmatches.deaths, 1) >= 2
    ))
    or (achievements.code = 'weapon-explorer' and 4 <= (
      select count(distinct deathmatches.weapon)
      from public.deathmatches join public.training_days on training_days.id = deathmatches.training_day_id
      where training_days.challenge_id = p_challenge_id
    ))
    or (achievements.code = 'challenge-complete' and v_completed_days >= (
      select duration_days from public.challenges where id = p_challenge_id
    ))
  on conflict (challenge_id, achievement_id) do nothing;
end;
$$;

revoke all on function public.evaluate_challenge_achievements(uuid) from public, anon, authenticated;

-- Backfill newly introduced day milestones for existing challenge progress.
insert into public.challenge_achievements (challenge_id, achievement_id, unlocked_at)
select challenges.id, achievements.id, now()
from public.challenges
join public.achievements on achievements.milestone_days is not null
where achievements.milestone_days <= (
  select count(*) from public.training_days
  where training_days.challenge_id = challenges.id and training_days.status = 'completed'
)
on conflict (challenge_id, achievement_id) do nothing;

-- A manually finished challenge is not the same as completing every scheduled day.
delete from public.challenge_achievements challenge_achievements
using public.achievements achievements, public.challenges challenges
where challenge_achievements.achievement_id = achievements.id
  and challenge_achievements.challenge_id = challenges.id
  and achievements.code = 'challenge-complete'
  and challenges.duration_days > (
    select count(*) from public.training_days
    where training_days.challenge_id = challenges.id and training_days.status = 'completed'
  );
