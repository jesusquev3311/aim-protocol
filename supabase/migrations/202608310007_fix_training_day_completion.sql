create or replace function public.sync_training_day_completion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_training_day_id uuid;
  v_owner_id uuid;
begin
  if tg_op = 'DELETE' then
    v_training_day_id := old.training_day_id;
  else
    v_training_day_id := new.training_day_id;
  end if;

  select challenges.user_id
  into v_owner_id
  from public.training_days
  join public.challenges on challenges.id = training_days.challenge_id
  where training_days.id = v_training_day_id;

  if v_owner_id is distinct from (select auth.uid()) then
    raise exception 'Cannot update another user''s training day' using errcode = '42501';
  end if;

  update public.training_days
  set completed = (
    select count(*)
    from public.deathmatches
    where deathmatches.training_day_id = v_training_day_id
  ) >= (
    select challenges.matches_per_day
    from public.challenges
    where challenges.id = training_days.challenge_id
  )
  where training_days.id = v_training_day_id;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function public.sync_training_day_completion() from public, anon, authenticated;

-- Repair completion state for any records inserted before this fix.
update public.training_days
set completed = (
  select count(*)
  from public.deathmatches
  where deathmatches.training_day_id = training_days.id
) >= (
  select challenges.matches_per_day
  from public.challenges
  where challenges.id = training_days.challenge_id
);
