alter table public.training_days
  add column status text;

update public.training_days
set status = case when completed then 'completed' else 'pending' end;

alter table public.training_days
  alter column status set default 'pending',
  alter column status set not null,
  add constraint training_days_status_allowed check (status in ('pending', 'partial', 'completed')),
  drop column completed;

create or replace function public.sync_training_day_completion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_training_day_id uuid;
  v_owner_id uuid;
  v_match_count bigint;
  v_match_target smallint;
  v_current_status text;
begin
  if tg_op = 'DELETE' then
    v_training_day_id := old.training_day_id;
  else
    v_training_day_id := new.training_day_id;
  end if;

  select challenges.user_id, challenges.matches_per_day, training_days.status
  into v_owner_id, v_match_target, v_current_status
  from public.training_days
  join public.challenges on challenges.id = training_days.challenge_id
  where training_days.id = v_training_day_id;

  if v_owner_id is distinct from (select auth.uid()) then
    raise exception 'Cannot update another user''s training day' using errcode = '42501';
  end if;

  select count(*)
  into v_match_count
  from public.deathmatches
  where deathmatches.training_day_id = v_training_day_id;

  update public.training_days
  set status = case
    when v_match_count >= v_match_target then 'completed'
    when v_current_status = 'partial' then 'partial'
    else 'pending'
  end
  where training_days.id = v_training_day_id;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function public.set_training_day_status(
  p_training_day_id uuid,
  p_status text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner_id uuid;
  v_match_count bigint;
  v_match_target smallint;
begin
  select challenges.user_id, challenges.matches_per_day
  into v_owner_id, v_match_target
  from public.training_days
  join public.challenges on challenges.id = training_days.challenge_id
  where training_days.id = p_training_day_id;

  if v_owner_id is distinct from (select auth.uid()) then
    raise exception 'Training day not found' using errcode = '42501';
  end if;

  if p_status is null or p_status not in ('pending', 'partial') then
    raise exception 'Day status can only be manually set to pending or partial' using errcode = '22023';
  end if;

  select count(*)
  into v_match_count
  from public.deathmatches
  where deathmatches.training_day_id = p_training_day_id;

  if p_status = 'partial' and (v_match_count = 0 or v_match_count >= v_match_target) then
    raise exception 'A partial day requires between 1 and % matches', v_match_target - 1 using errcode = '22023';
  end if;

  update public.training_days
  set status = p_status
  where id = p_training_day_id;

  return p_status;
end;
$$;

revoke all on function public.sync_training_day_completion() from public, anon, authenticated;
revoke all on function public.set_training_day_status(uuid, text) from public, anon;
grant execute on function public.set_training_day_status(uuid, text) to authenticated;
