-- ============================================================================
--  "What's Your Number?" — Supabase backend
--  Paste this whole file into the Supabase SQL editor and run it once.
--
--  Security model (matters: this is a bank):
--    • Two tables. `entries` = the leaderboard (no PII). `leads` = emails (PII).
--    • RLS is ON for both and there are NO direct table grants to anon/auth.
--    • The browser (anon key) can ONLY call the SECURITY DEFINER functions below.
--      It can add to the room and read the top-N names+targets. It can write a
--      lead. It can NEVER read an email back out. Bankers read leads in the
--      Supabase dashboard (or a service-role export), not from the client.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---- tables ----------------------------------------------------------------
create table if not exists public.entries (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name       text not null check (char_length(name) between 1 and 40),
  country    text not null check (country in ('EE','LV','LT')),
  age        int  not null check (age between 16 and 100),
  retire     int  not null check (retire between 30 and 100),
  target     bigint not null check (target between 0 and 1000000000),
  monthly    bigint not null check (monthly >= 0)
);
create index if not exists entries_target_idx on public.entries (target desc);

create table if not exists public.leads (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email      text not null check (position('@' in email) > 1),
  consent    boolean not null default false,
  name       text,
  country    text,
  target     bigint
);

alter table public.entries enable row level security;
alter table public.leads   enable row level security;
-- No policies + RLS on = no direct anon/auth access. Functions below bypass it.

-- ---- stats helper ----------------------------------------------------------
create or replace function public._stats(p_target bigint)
returns json language sql stable security definer set search_path = public as $$
  with t as (select count(*)::int total,
                    count(*) filter (where target < p_target)::int below
             from public.entries)
  select json_build_object(
    'total', greatest(total, 1),
    'percentile', case when total = 0 then 50 else round(below::numeric / total * 100)::int end,
    'rank', (select count(*) from public.entries where target > p_target) + 1,
    'top', greatest(1, 100 - case when total = 0 then 50 else round(below::numeric / total * 100)::int end)
  ) from t;
$$;

-- ---- add a player to the room, return their standing ----------------------
create or replace function public.submit_entry(
  p_name text, p_country text, p_age int, p_retire int, p_target bigint, p_monthly bigint
) returns json language plpgsql security definer set search_path = public as $$
begin
  insert into public.entries(name, country, age, retire, target, monthly)
  values (left(trim(p_name), 40), p_country, p_age, p_retire, p_target, p_monthly);
  return public._stats(p_target);
end; $$;

-- ---- read the top of the room (names + targets only) ----------------------
create or replace function public.get_leaderboard(p_limit int default 8)
returns table(name text, target bigint)
language sql stable security definer set search_path = public as $$
  select name, target from public.entries
  order by target desc, created_at asc
  limit least(greatest(p_limit, 1), 50);
$$;

create or replace function public.get_stats(p_target bigint)
returns json language sql stable security definer set search_path = public as $$
  select public._stats(p_target);
$$;

-- ---- capture a lead (write-only from the client) --------------------------
create or replace function public.save_lead(
  p_email text, p_consent boolean, p_name text default null,
  p_target bigint default null, p_country text default null
) returns json language plpgsql security definer set search_path = public as $$
begin
  insert into public.leads(email, consent, name, target, country)
  values (lower(trim(p_email)), coalesce(p_consent,false), p_name, p_target, p_country);
  return json_build_object('ok', true);
end; $$;

-- ---- grants: anon may execute the functions, nothing else -----------------
revoke all on function public.submit_entry(text,text,int,int,bigint,bigint) from public;
revoke all on function public.get_leaderboard(int) from public;
revoke all on function public.get_stats(bigint) from public;
revoke all on function public.save_lead(text,boolean,text,bigint,text) from public;

grant execute on function public.submit_entry(text,text,int,int,bigint,bigint) to anon, authenticated;
grant execute on function public.get_leaderboard(int) to anon, authenticated;
grant execute on function public.get_stats(bigint) to anon, authenticated;
grant execute on function public.save_lead(text,boolean,text,bigint,text) to anon, authenticated;

-- Bankers: read leads with the service role / dashboard, e.g.
--   select created_at, name, email, country, target from public.leads
--   where consent order by created_at desc;
