-- This migration is self-contained because some existing deployments predate
-- the original profiles migration.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null check (char_length(username) between 3 and 24),
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists updated_at timestamptz not null default now();

alter table public.profiles enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

revoke all on public.profiles from anon;
grant select, update on public.profiles to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_requested_username text := trim(new.raw_user_meta_data ->> 'username');
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    case
      when char_length(v_requested_username) between 3 and 24 then v_requested_username
      else 'player-' || left(new.id::text, 8)
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create profiles for accounts that registered before this table existed.
insert into public.profiles (id, username, created_at)
select
  users.id,
  case
    when char_length(trim(users.raw_user_meta_data ->> 'username')) between 3 and 24
      then trim(users.raw_user_meta_data ->> 'username')
    else 'player-' || left(users.id::text, 8)
  end,
  users.created_at
from auth.users
on conflict (id) do nothing;

create or replace function public.set_profile_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists before_profile_update_set_updated_at on public.profiles;
create trigger before_profile_update_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_profile_updated_at();

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.set_profile_updated_at() from public, anon, authenticated;
