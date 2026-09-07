comment on column public.challenges.matches_per_day is
  'Maximum number of Deathmatches that may be recorded for each training day.';

alter table public.training_days
  add column completed_at timestamptz;

update public.training_days
set
  status = 'completed',
  completed_at = coalesce(
    (select max(deathmatches.created_at) from public.deathmatches where deathmatches.training_day_id = training_days.id),
    timezone('utc', training_days.date::timestamp)
  )
where status in ('partial', 'completed');

alter table public.training_days
  drop constraint if exists training_days_status_allowed;

alter table public.training_days
  add constraint training_days_status_allowed check (status in ('pending', 'completed'));

alter table public.challenges
  add column completed_at timestamptz;

create or replace function public.sync_training_day_completion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_training_day_id uuid;
  v_challenge_id uuid;
  v_owner_id uuid;
  v_match_count bigint;
  v_match_limit smallint;
begin
  if tg_op = 'DELETE' then
    v_training_day_id := old.training_day_id;
  else
    v_training_day_id := new.training_day_id;
  end if;

  select challenges.id, challenges.user_id, challenges.matches_per_day
  into v_challenge_id, v_owner_id, v_match_limit
  from public.training_days
  join public.challenges on challenges.id = training_days.challenge_id
  where training_days.id = v_training_day_id;

  if v_owner_id is distinct from (select auth.uid()) then
    raise exception 'Cannot update another user''s training day' using errcode = '42501';
  end if;

  select count(*) into v_match_count
  from public.deathmatches
  where deathmatches.training_day_id = v_training_day_id;

  if v_match_count >= v_match_limit then
    update public.training_days
    set status = 'completed', completed_at = coalesce(completed_at, now())
    where id = v_training_day_id;
  end if;

  if not exists (
    select 1 from public.training_days
    where challenge_id = v_challenge_id and status = 'pending'
  ) then
    update public.challenges
    set status = 'completed', completed_at = coalesce(completed_at, now())
    where id = v_challenge_id and status = 'active';
  end if;

  if tg_op = 'DELETE' then return old; end if;
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
  v_challenge_id uuid;
  v_challenge_status text;
  v_owner_id uuid;
  v_match_count bigint;
  v_match_limit smallint;
begin
  select challenges.id, challenges.status, challenges.user_id, challenges.matches_per_day
  into v_challenge_id, v_challenge_status, v_owner_id, v_match_limit
  from public.training_days
  join public.challenges on challenges.id = training_days.challenge_id
  where training_days.id = p_training_day_id;

  if v_owner_id is distinct from (select auth.uid()) then
    raise exception 'Training day not found' using errcode = '42501';
  end if;

  if p_status not in ('pending', 'completed') then
    raise exception 'Day status can only be pending or completed' using errcode = '22023';
  end if;

  select count(*) into v_match_count
  from public.deathmatches
  where training_day_id = p_training_day_id;

  if p_status = 'completed' and v_match_count = 0 then
    raise exception 'Record at least one match before completing the day' using errcode = '22023';
  end if;

  if p_status = 'pending' and (v_challenge_status <> 'active' or v_match_count >= v_match_limit) then
    raise exception 'This training day cannot be reopened' using errcode = '22023';
  end if;

  update public.training_days
  set
    status = p_status,
    completed_at = case when p_status = 'completed' then coalesce(completed_at, now()) else null end
  where id = p_training_day_id;

  if p_status = 'completed' and not exists (
    select 1 from public.training_days
    where challenge_id = v_challenge_id and status = 'pending'
  ) then
    update public.challenges
    set status = 'completed', completed_at = coalesce(completed_at, now())
    where id = v_challenge_id and status = 'active';
  end if;

  return p_status;
end;
$$;

revoke all on function public.sync_training_day_completion() from public, anon, authenticated;
revoke all on function public.set_training_day_status(uuid, text) from public, anon;
grant execute on function public.set_training_day_status(uuid, text) to authenticated;

update public.challenges
set completed_at = (
  select max(training_days.completed_at)
  from public.training_days
  where training_days.challenge_id = challenges.id
)
where status = 'completed' and completed_at is null;
