-- CourtVision Supabase Free MVP schema
-- Paste this into Supabase SQL Editor, then add VITE_SUPABASE_URL and
-- VITE_SUPABASE_ANON_KEY to Vercel and local .env.

create extension if not exists "pgcrypto";

create table if not exists public.quiz_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  primary_playstyle text,
  secondary_playstyle text,
  budget_tier text,
  max_setup_price numeric,
  arm_issue text,
  comfort_priority integer,
  profile jsonb not null default '{}'::jsonb,
  traits jsonb not null default '{}'::jsonb,
  style_scores jsonb not null default '{}'::jsonb,
  recommendations jsonb not null default '{}'::jsonb
);

create table if not exists public.recommendation_feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  setup_id text,
  setup_label text,
  racket text,
  string text,
  primary_playstyle text,
  secondary_playstyle text,
  budget_tier text,
  arm_issue text,
  final_score numeric,
  total_price numeric,
  would_try text,
  accurate text,
  payload jsonb not null default '{}'::jsonb
);

create table if not exists public.player_nominations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  player_name text not null,
  age integer,
  location text not null,
  contact_email text not null,
  current_setup text not null,
  help_needed text not null,
  explanation text not null,
  status text not null default 'new',
  payload jsonb not null default '{}'::jsonb
);

create table if not exists public.ball_donations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  donor_name text not null,
  email text not null,
  ball_count integer,
  organization text not null,
  preference text not null,
  location text not null,
  notes text,
  status text not null default 'new',
  payload jsonb not null default '{}'::jsonb
);

create table if not exists public.impact_stats (
  id text primary key,
  updated_at timestamptz not null default now(),
  dollars_raised numeric not null default 0,
  players_helped integer not null default 0,
  setups_donated integer not null default 0,
  balls_collected integer not null default 0,
  shelters_supported integer not null default 0,
  senior_homes_supported integer not null default 0,
  organizations_helped integer not null default 0
);

insert into public.impact_stats (id)
values ('current')
on conflict (id) do nothing;

alter table public.quiz_submissions enable row level security;
alter table public.recommendation_feedback enable row level security;
alter table public.player_nominations enable row level security;
alter table public.ball_donations enable row level security;
alter table public.impact_stats enable row level security;

drop policy if exists "public can insert quiz submissions" on public.quiz_submissions;
create policy "public can insert quiz submissions"
on public.quiz_submissions
for insert
to anon
with check (true);

drop policy if exists "public can insert recommendation feedback" on public.recommendation_feedback;
create policy "public can insert recommendation feedback"
on public.recommendation_feedback
for insert
to anon
with check (true);

drop policy if exists "public can insert player nominations" on public.player_nominations;
create policy "public can insert player nominations"
on public.player_nominations
for insert
to anon
with check (true);

drop policy if exists "public can insert ball donations" on public.ball_donations;
create policy "public can insert ball donations"
on public.ball_donations
for insert
to anon
with check (true);

drop policy if exists "public can read impact stats" on public.impact_stats;
create policy "public can read impact stats"
on public.impact_stats
for select
to anon
using (true);
