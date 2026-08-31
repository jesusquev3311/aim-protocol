create table public.skills (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint skills_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint skills_name_not_empty check (char_length(trim(name)) > 0)
);

create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  duration_days smallint not null default 20,
  matches_per_day smallint not null,
  start_date date not null,
  status text not null default 'active',
  recommended_mode boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  constraint challenges_duration_days_allowed check (duration_days in (5, 7, 15, 20, 30, 60)),
  constraint challenges_matches_per_day_allowed check (matches_per_day in (5, 10)),
  constraint challenges_status_allowed check (status in ('active', 'completed', 'abandoned'))
);

create table public.challenge_skills (
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  skill_id bigint not null references public.skills(id) on delete restrict,
  primary key (challenge_id, skill_id)
);

create index challenges_user_id_idx on public.challenges (user_id);
create unique index challenges_one_active_per_user_idx
  on public.challenges (user_id)
  where status = 'active';
create index challenge_skills_skill_id_idx on public.challenge_skills (skill_id);

insert into public.skills (slug, name)
values
  ('crosshair-placement', 'Crosshair Placement'),
  ('angle-clearing', 'Angle Clearing'),
  ('spray-control', 'Spray Control'),
  ('trigger-discipline', 'Trigger Discipline'),
  ('jiggle-peek', 'Jiggle Peek'),
  ('shoulder-peek', 'Shoulder Peek'),
  ('jump-peek', 'Jump Peek');

alter table public.skills enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_skills enable row level security;

create policy "Authenticated users can read skills"
  on public.skills for select
  to authenticated
  using (true);

create policy "Users can read their own challenges"
  on public.challenges for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own challenges"
  on public.challenges for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own challenges"
  on public.challenges for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can read skills for their own challenges"
  on public.challenge_skills for select
  to authenticated
  using (
    exists (
      select 1
      from public.challenges
      where challenges.id = challenge_skills.challenge_id
        and challenges.user_id = (select auth.uid())
    )
  );

create policy "Users can add skills to their own challenges"
  on public.challenge_skills for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.challenges
      where challenges.id = challenge_skills.challenge_id
        and challenges.user_id = (select auth.uid())
    )
  );

create or replace function public.create_challenge(
  p_duration_days smallint,
  p_matches_per_day smallint,
  p_start_date date,
  p_recommended_mode boolean,
  p_skill_ids bigint[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_challenge_id uuid;
begin
  if coalesce(cardinality(p_skill_ids), 0) = 0 then
    raise exception 'Select at least one skill' using errcode = '22023';
  end if;

  if cardinality(p_skill_ids) <> cardinality(array(select distinct unnest(p_skill_ids))) then
    raise exception 'Skill selections must be unique' using errcode = '22023';
  end if;

  insert into public.challenges (
    user_id,
    duration_days,
    matches_per_day,
    start_date,
    recommended_mode
  )
  values (
    (select auth.uid()),
    p_duration_days,
    p_matches_per_day,
    p_start_date,
    p_recommended_mode
  )
  returning id into v_challenge_id;

  insert into public.challenge_skills (challenge_id, skill_id)
  select v_challenge_id, selected_skill_id
  from unnest(p_skill_ids) as selected_skill_id;

  return v_challenge_id;
end;
$$;

revoke all on function public.create_challenge(smallint, smallint, date, boolean, bigint[]) from public, anon;
grant execute on function public.create_challenge(smallint, smallint, date, boolean, bigint[]) to authenticated;

revoke all on public.skills, public.challenges, public.challenge_skills from anon;
grant select on public.skills to authenticated;
grant select, insert, update on public.challenges to authenticated;
grant select, insert on public.challenge_skills to authenticated;
