drop function if exists public.reset_challenge(uuid);

create function public.reset_challenge(
  p_challenge_id uuid,
  p_start_date date
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_start_date is null then
    raise exception 'A reset start date is required' using errcode = '22023';
  end if;

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

  -- The existing start-date trigger reschedules every generated training day.
  update public.challenges
  set status = 'active', completed_at = null, start_date = p_start_date
  where id = p_challenge_id;

  -- Status triggers may evaluate achievements, so clear unlocks last.
  delete from public.challenge_achievements
  where challenge_id = p_challenge_id;
end;
$$;

revoke all on function public.reset_challenge(uuid, date) from public, anon;
grant execute on function public.reset_challenge(uuid, date) to authenticated;
