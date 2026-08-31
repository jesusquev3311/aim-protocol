create table public.training_days (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  day_number smallint not null,
  date date not null,
  completed boolean not null default false,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint training_days_day_number_positive check (day_number > 0),
  constraint training_days_challenge_day_unique unique (challenge_id, day_number),
  constraint training_days_challenge_date_unique unique (challenge_id, date)
);

create table public.deathmatches (
  id uuid primary key default gen_random_uuid(),
  training_day_id uuid not null references public.training_days(id) on delete cascade,
  match_number smallint not null,
  weapon text not null,
  kills smallint not null,
  deaths smallint not null,
  rating text not null,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint deathmatches_match_number_positive check (match_number > 0),
  constraint deathmatches_kills_nonnegative check (kills >= 0),
  constraint deathmatches_deaths_nonnegative check (deaths >= 0),
  constraint deathmatches_weapon_not_empty check (char_length(trim(weapon)) > 0),
  constraint deathmatches_rating_allowed check (rating in ('poor', 'average', 'good')),
  constraint deathmatches_day_match_unique unique (training_day_id, match_number)
);

create table public.skill_results (
  id uuid primary key default gen_random_uuid(),
  training_day_id uuid not null references public.training_days(id) on delete cascade,
  skill_id bigint not null references public.skills(id) on delete restrict,
  result text not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint skill_results_result_allowed check (result in ('poor', 'average', 'good')),
  constraint skill_results_day_skill_unique unique (training_day_id, skill_id)
);

create index training_days_challenge_id_idx on public.training_days (challenge_id);
create index deathmatches_training_day_id_idx on public.deathmatches (training_day_id);
create index skill_results_training_day_id_idx on public.skill_results (training_day_id);
create index skill_results_skill_id_idx on public.skill_results (skill_id);

create or replace function public.generate_challenge_training_days()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.user_id <> (select auth.uid()) then
    raise exception 'Cannot generate training days for another user' using errcode = '42501';
  end if;

  insert into public.training_days (challenge_id, day_number, date)
  select new.id, day_number, new.start_date + (day_number - 1)
  from generate_series(1, new.duration_days) as day_number;
  return new;
end;
$$;

create trigger on_challenge_created_generate_training_days
  after insert on public.challenges
  for each row execute procedure public.generate_challenge_training_days();

-- Generate days for challenges created before this migration.
insert into public.training_days (challenge_id, day_number, date)
select challenges.id, day_number, challenges.start_date + (day_number - 1)
from public.challenges
cross join lateral generate_series(1, challenges.duration_days) as day_number
on conflict (challenge_id, day_number) do nothing;

create or replace function public.validate_deathmatch_number()
returns trigger
language plpgsql
security definer
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

create trigger before_deathmatch_write_validate_number
  before insert or update on public.deathmatches
  for each row execute procedure public.validate_deathmatch_number();

create or replace function public.sync_training_day_completion()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_training_day_id uuid;
begin
  if tg_op = 'DELETE' then
    v_training_day_id := old.training_day_id;
  else
    v_training_day_id := new.training_day_id;
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

create trigger after_deathmatch_write_sync_day
  after insert or delete on public.deathmatches
  for each row execute procedure public.sync_training_day_completion();

revoke all on function public.generate_challenge_training_days() from public, anon, authenticated;
revoke all on function public.sync_training_day_completion() from public, anon, authenticated;

create or replace function public.validate_skill_result_selection()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.training_days
    join public.challenge_skills on challenge_skills.challenge_id = training_days.challenge_id
    where training_days.id = new.training_day_id
      and challenge_skills.skill_id = new.skill_id
  ) then
    raise exception 'Skill is not selected for this challenge' using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger before_skill_result_write_validate_selection
  before insert or update on public.skill_results
  for each row execute procedure public.validate_skill_result_selection();

alter table public.training_days enable row level security;
alter table public.deathmatches enable row level security;
alter table public.skill_results enable row level security;

create policy "Users can read their own training days"
  on public.training_days for select to authenticated
  using (exists (
    select 1 from public.challenges
    where challenges.id = training_days.challenge_id
      and challenges.user_id = (select auth.uid())
  ));

create policy "Users can update their own training days"
  on public.training_days for update to authenticated
  using (exists (
    select 1 from public.challenges
    where challenges.id = training_days.challenge_id
      and challenges.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.challenges
    where challenges.id = training_days.challenge_id
      and challenges.user_id = (select auth.uid())
  ));

create policy "Users can read their own deathmatches"
  on public.deathmatches for select to authenticated
  using (exists (
    select 1
    from public.training_days
    join public.challenges on challenges.id = training_days.challenge_id
    where training_days.id = deathmatches.training_day_id
      and challenges.user_id = (select auth.uid())
  ));

create policy "Users can add their own deathmatches"
  on public.deathmatches for insert to authenticated
  with check (exists (
    select 1
    from public.training_days
    join public.challenges on challenges.id = training_days.challenge_id
    where training_days.id = deathmatches.training_day_id
      and challenges.user_id = (select auth.uid())
  ));

create policy "Users can read their own skill results"
  on public.skill_results for select to authenticated
  using (exists (
    select 1
    from public.training_days
    join public.challenges on challenges.id = training_days.challenge_id
    where training_days.id = skill_results.training_day_id
      and challenges.user_id = (select auth.uid())
  ));

create policy "Users can add their own skill results"
  on public.skill_results for insert to authenticated
  with check (exists (
    select 1
    from public.training_days
    join public.challenges on challenges.id = training_days.challenge_id
    where training_days.id = skill_results.training_day_id
      and challenges.user_id = (select auth.uid())
  ));

create policy "Users can update their own skill results"
  on public.skill_results for update to authenticated
  using (exists (
    select 1
    from public.training_days
    join public.challenges on challenges.id = training_days.challenge_id
    where training_days.id = skill_results.training_day_id
      and challenges.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1
    from public.training_days
    join public.challenges on challenges.id = training_days.challenge_id
    where training_days.id = skill_results.training_day_id
      and challenges.user_id = (select auth.uid())
  ));

revoke all on public.training_days, public.deathmatches, public.skill_results from anon;
grant select, update (notes) on public.training_days to authenticated;
grant select, insert on public.deathmatches to authenticated;
grant select, insert, update on public.skill_results to authenticated;
