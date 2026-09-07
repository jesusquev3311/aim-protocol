create or replace function public.finish_challenge(p_challenge_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.challenges
  set status = 'completed', completed_at = coalesce(completed_at, now())
  where id = p_challenge_id
    and user_id = (select auth.uid())
    and status = 'active';

  if not found then
    raise exception 'Active challenge not found' using errcode = '42501';
  end if;
end;
$$;

update public.achievements
set description = 'Finish a challenge and preserve its results.'
where code = 'challenge-complete';

create or replace function public.reset_challenge(p_challenge_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.challenges
    where id = p_challenge_id and user_id = (select auth.uid())
  ) then
    raise exception 'Challenge not found' using errcode = '42501';
  end if;

  delete from public.deathmatches
  where training_day_id in (
    select id from public.training_days where challenge_id = p_challenge_id
  );

  delete from public.skill_results
  where training_day_id in (
    select id from public.training_days where challenge_id = p_challenge_id
  );

  update public.training_days
  set status = 'pending', completed_at = null, notes = null
  where challenge_id = p_challenge_id;

  update public.challenges
  set status = 'active', completed_at = null
  where id = p_challenge_id;

  -- Status triggers may evaluate achievements, so clear unlocks last.
  delete from public.challenge_achievements
  where challenge_id = p_challenge_id;
end;
$$;

revoke all on function public.finish_challenge(uuid) from public, anon;
revoke all on function public.reset_challenge(uuid) from public, anon;
grant execute on function public.finish_challenge(uuid) to authenticated;
grant execute on function public.reset_challenge(uuid) to authenticated;
