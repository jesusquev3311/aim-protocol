create policy "Users can update their own deathmatches"
  on public.deathmatches for update
  to authenticated
  using (exists (
    select 1
    from public.training_days
    join public.challenges on challenges.id = training_days.challenge_id
    where training_days.id = deathmatches.training_day_id
      and challenges.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1
    from public.training_days
    join public.challenges on challenges.id = training_days.challenge_id
    where training_days.id = deathmatches.training_day_id
      and challenges.user_id = (select auth.uid())
  ));

grant update (weapon, kills, deaths, rating, notes) on public.deathmatches to authenticated;
