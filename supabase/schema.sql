-- SOC Daily schema
-- Run this once in the Supabase SQL Editor (Dashboard > SQL Editor > New query).

-- ------------------------------------------------------------
-- Tables
-- ------------------------------------------------------------

-- Public challenge content. No answers live here.
create table if not exists public.challenges (
  id            uuid primary key default gen_random_uuid(),
  publish_date  date unique not null,
  slug          text unique not null,
  title         text not null,
  category      text not null check (category in ('phishing','windows_logs','network','cloud','web','linux','malware')),
  difficulty    smallint not null check (difficulty between 1 and 3),
  scenario      text not null,
  artifact      text not null,
  artifact_type text not null check (artifact_type in ('email','log','alert')),
  question      text not null,
  choices       jsonb not null check (jsonb_typeof(choices) = 'array' and jsonb_array_length(choices) between 2 and 6),
  created_at    timestamptz not null default now()
);

-- Answers and explanations. Only the server (service role) can read this.
create table if not exists public.challenge_answers (
  challenge_id     uuid primary key references public.challenges(id) on delete cascade,
  correct_index    smallint not null,
  explanation      text not null,
  attack_technique text
);

-- One row per signed-in user.
create table if not exists public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  username         text unique,
  current_streak   int not null default 0,
  longest_streak   int not null default 0,
  last_played_date date,
  created_at       timestamptz not null default now()
);

-- One attempt per user per challenge.
create table if not exists public.attempts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  challenge_id   uuid not null references public.challenges(id) on delete cascade,
  selected_index smallint not null,
  is_correct     boolean not null,
  created_at     timestamptz not null default now(),
  unique (user_id, challenge_id)
);

create index if not exists attempts_user_idx on public.attempts (user_id, created_at desc);

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------
alter table public.challenges        enable row level security;
alter table public.challenge_answers enable row level security;
alter table public.profiles          enable row level security;
alter table public.attempts          enable row level security;

-- Anyone can read challenges that have been published (future ones stay hidden).
drop policy if exists "Published challenges are public" on public.challenges;
create policy "Published challenges are public"
  on public.challenges for select
  using (publish_date <= (now() at time zone 'America/New_York')::date);

-- challenge_answers: no policies at all, so anon and authenticated users get nothing.
-- The service role key bypasses RLS and is only ever used on the server.

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users update own username" on public.profiles;
create policy "Users update own username"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Users can read their own attempts. Inserts happen only through record_attempt().
drop policy if exists "Users read own attempts" on public.attempts;
create policy "Users read own attempts"
  on public.attempts for select
  using (auth.uid() = user_id);

-- Stop users from editing their own streak numbers through the API.
revoke update on public.profiles from authenticated, anon;
grant update (username) on public.profiles to authenticated;

-- ------------------------------------------------------------
-- Create a profile automatically when someone signs up
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- Record an attempt and update the streak in one transaction.
-- Called by the server with the service role key after it has
-- verified the user and checked the answer.
-- Streak rule: consecutive days played (right or wrong).
-- ------------------------------------------------------------
create or replace function public.record_attempt(
  p_user_id        uuid,
  p_challenge_id   uuid,
  p_selected_index smallint,
  p_is_correct     boolean,
  p_today          date
)
returns table (current_streak int, longest_streak int, already_played boolean)
language plpgsql
security definer set search_path = public
as $$
#variable_conflict use_column
declare
  v_inserted int := 0;
  v_last     date;
begin
  insert into public.profiles (id) values (p_user_id) on conflict do nothing;

  insert into public.attempts (user_id, challenge_id, selected_index, is_correct)
  values (p_user_id, p_challenge_id, p_selected_index, p_is_correct)
  on conflict (user_id, challenge_id) do nothing;
  get diagnostics v_inserted = row_count;

  select p.last_played_date into v_last
  from public.profiles p where p.id = p_user_id
  for update;

  if v_inserted > 0 then
    if v_last = p_today then
      null; -- already counted today (for example, played an archive challenge)
    elsif v_last = p_today - 1 then
      update public.profiles p
         set current_streak = p.current_streak + 1,
             longest_streak = greatest(p.longest_streak, p.current_streak + 1),
             last_played_date = p_today
       where p.id = p_user_id;
    else
      update public.profiles p
         set current_streak = 1,
             longest_streak = greatest(p.longest_streak, 1),
             last_played_date = p_today
       where p.id = p_user_id;
    end if;
  end if;

  return query
    select p.current_streak, p.longest_streak, v_inserted = 0
    from public.profiles p where p.id = p_user_id;
end;
$$;

revoke all on function public.record_attempt(uuid, uuid, smallint, boolean, date) from public, anon, authenticated;
grant execute on function public.record_attempt(uuid, uuid, smallint, boolean, date) to service_role;
