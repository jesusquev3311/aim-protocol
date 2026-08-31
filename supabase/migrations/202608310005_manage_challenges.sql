-- Defer date uniqueness until transaction end so all generated days can shift safely.
alter table public.training_days
  drop constraint if exists training_days_challenge_date_unique;

alter table public.training_days
  add constraint training_days_challenge_date_unique
  unique (challenge_id, date)
  deferrable initially deferred;

create or replace function public.reschedule_challenge_training_days()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.user_id <> (select auth.uid()) then
    raise exception 'Cannot reschedule another user''s challenge' using errcode = '42501';
  end if;

  update public.training_days
  set date = new.start_date + (day_number - 1)
  where challenge_id = new.id;

  return new;
end;
$$;

create trigger after_challenge_start_date_update_reschedule_days
  after update of start_date on public.challenges
  for each row
  when (old.start_date is distinct from new.start_date)
  execute procedure public.reschedule_challenge_training_days();

-- The trigger must update the derived completed column even though clients cannot.
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

  if v_owner_id <> (select auth.uid()) then
    raise exception 'Cannot update another user''s training day' using errcode = '42501';
  end if;

  update public.training_days
  set completed = (
    select count(*) >= challenges.matches_per_day
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

-- Validation only needs the permissions and RLS scope of the calling user.
create or replace function public.validate_deathmatch_number()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_matches_per_day smallint;
begin
  select challenges.matches_per_day
  into v_matches_per_day
  from public.training_days
  join public.challenges on challenges.id = training_days.challenge_id
  where training_days.id = new.training_day_id;

  if v_matches_per_day is null or new.match_number > v_matches_per_day then
    raise exception 'Match number exceeds the daily target' using errcode = '23514';
  end if;

  return new;
end;
$$;

create policy "Users can delete their own challenges"
  on public.challenges for delete
  to authenticated
  using ((select auth.uid()) = user_id);

grant delete on public.challenges to authenticated;

revoke all on function public.reschedule_challenge_training_days() from public, anon, authenticated;
revoke all on function public.sync_training_day_completion() from public, anon, authenticated;
revoke all on function public.validate_deathmatch_number() from public, anon, authenticated;
