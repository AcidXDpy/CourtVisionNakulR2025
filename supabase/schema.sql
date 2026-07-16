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

alter table public.quiz_submissions
  add column if not exists consent_to_research boolean not null default false,
  add column if not exists anonymous_session_id text,
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists model_version text,
  add column if not exists feature_schema_version text,
  add column if not exists candidate_count integer,
  add column if not exists top_setup_score numeric,
  add column if not exists confidence_score numeric;

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

alter table public.recommendation_feedback
  add column if not exists anonymous_session_id text,
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists consent_to_research boolean not null default false,
  add column if not exists accuracy_rating integer,
  add column if not exists comfort_rating integer,
  add column if not exists confidence_rating integer,
  add column if not exists confidence_score numeric,
  add column if not exists model_version text,
  add column if not exists feature_schema_version text,
  add column if not exists predicted_scores jsonb not null default '{}'::jsonb,
  add column if not exists score_components jsonb not null default '{}'::jsonb,
  add column if not exists mismatch_reasons text[] not null default '{}'::text[],
  add column if not exists comments text,
  add column if not exists actual_setup_used text;

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

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  display_name text,
  skill_level text,
  utr numeric,
  ntrp numeric,
  age integer,
  height text,
  weight text,
  playstyle text,
  arm_issue text,
  budget_tier text,
  current_racket text,
  current_string text,
  current_tension numeric,
  notes text
);

create table if not exists public.user_setups (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  racket text not null,
  string text not null,
  tension numeric,
  notes text,
  comfort_rating integer,
  power_rating integer,
  control_rating integer,
  spin_rating integer,
  active boolean not null default false
);

create table if not exists public.model_versions (
  id text primary key,
  created_at timestamptz not null default now(),
  status text not null default 'active',
  description text not null,
  intended_use text not null,
  limitations text not null,
  coefficients jsonb not null default '{}'::jsonb,
  evaluation_summary jsonb not null default '{}'::jsonb
);

create table if not exists public.feature_versions (
  id text primary key,
  created_at timestamptz not null default now(),
  description text not null,
  player_features text[] not null default '{}'::text[],
  equipment_features text[] not null default '{}'::text[],
  setup_features text[] not null default '{}'::text[]
);

create table if not exists public.saved_recommendations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  model_version text,
  feature_schema_version text,
  player_profile jsonb not null default '{}'::jsonb,
  recommendation jsonb not null default '{}'::jsonb,
  notes text
);

create table if not exists public.setup_simulations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  model_version text,
  feature_schema_version text,
  baseline_setup jsonb not null default '{}'::jsonb,
  change_set jsonb not null default '{}'::jsonb,
  predicted_before jsonb not null default '{}'::jsonb,
  predicted_after jsonb not null default '{}'::jsonb,
  deltas jsonb not null default '{}'::jsonb
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

create table if not exists public.support_payments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  stripe_session_id text not null unique,
  stripe_payment_intent_id text,
  status text not null default 'unknown',
  amount_total integer not null default 0,
  currency text not null default 'usd',
  support_tier_id text,
  supporter_email text,
  supporter_name text,
  payload jsonb not null default '{}'::jsonb
);

insert into public.model_versions (id, status, description, intended_use, limitations, coefficients, evaluation_summary)
values (
  'gv-rules-engine-2.0.0',
  'active',
  'Deterministic complete-setup scoring engine using feature matching, constraints, objective ranking, and conservative comfort warnings.',
  'Educational tennis equipment decision support for comparing racket/string/tension configurations.',
  'Not a medical assessment, not a trained predictive ML model, and dependent on incomplete public equipment data.',
  '{"setup_weights":"stored in frontend source","confidence":"component agreement plus data-quality penalty"}'::jsonb,
  '{"status":"pre-outcome-data","minimum_feedback_rows_for_stable_metrics":50}'::jsonb
)
on conflict (id) do update set
  status = excluded.status,
  description = excluded.description,
  intended_use = excluded.intended_use,
  limitations = excluded.limitations,
  coefficients = excluded.coefficients,
  evaluation_summary = excluded.evaluation_summary;

insert into public.feature_versions (id, description, player_features, equipment_features, setup_features)
values (
  'gv-feature-schema-2.0.0',
  'Player, equipment, and setup features used by the complete-configuration recommendation engine.',
  array['skillScore','swingSpeedScore','budgetCeiling','spinDemand','powerDemand','controlDemand','comfortDemand','serveDemand','netDemand','armSensitivity'],
  array['retailPrice','headSizeSqIn','strungWeightGrams','swingweight','stiffnessRA','powerLevel','controlLevel','spinPotential','comfortLevel','dataConfidence'],
  array['effectivePower','effectiveControl','effectiveSpin','effectiveComfort','effectiveStability','effectiveManeuverability','armStressWarningScore','skillDemandScore','configurationCost','confidence']
)
on conflict (id) do update set
  description = excluded.description,
  player_features = excluded.player_features,
  equipment_features = excluded.equipment_features,
  setup_features = excluded.setup_features;

create index if not exists quiz_submissions_user_created_idx on public.quiz_submissions (user_id, created_at desc);
create index if not exists quiz_submissions_consent_created_idx on public.quiz_submissions (consent_to_research, created_at desc);
create index if not exists recommendation_feedback_user_created_idx on public.recommendation_feedback (user_id, created_at desc);
create index if not exists recommendation_feedback_consent_created_idx on public.recommendation_feedback (consent_to_research, created_at desc);
create index if not exists user_setups_user_created_idx on public.user_setups (user_id, created_at desc);
create index if not exists saved_recommendations_user_created_idx on public.saved_recommendations (user_id, created_at desc);
create index if not exists setup_simulations_user_created_idx on public.setup_simulations (user_id, created_at desc);
create index if not exists player_nominations_status_created_idx on public.player_nominations (status, created_at desc);
create index if not exists ball_donations_status_created_idx on public.ball_donations (status, created_at desc);
create index if not exists support_payments_status_created_idx on public.support_payments (status, created_at desc);
create index if not exists support_payments_tier_created_idx on public.support_payments (support_tier_id, created_at desc);

alter table public.quiz_submissions enable row level security;
alter table public.recommendation_feedback enable row level security;
alter table public.player_nominations enable row level security;
alter table public.profiles enable row level security;
alter table public.user_setups enable row level security;
alter table public.model_versions enable row level security;
alter table public.feature_versions enable row level security;
alter table public.saved_recommendations enable row level security;
alter table public.setup_simulations enable row level security;
alter table public.ball_donations enable row level security;
alter table public.impact_stats enable row level security;
alter table public.support_payments enable row level security;

drop policy if exists "public can insert quiz submissions" on public.quiz_submissions;
create policy "public can insert quiz submissions"
on public.quiz_submissions
for insert
to anon, authenticated
with check (user_id is null or auth.uid() = user_id);

drop policy if exists "users can read own quiz submissions" on public.quiz_submissions;
create policy "users can read own quiz submissions"
on public.quiz_submissions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "public can insert recommendation feedback" on public.recommendation_feedback;
create policy "public can insert recommendation feedback"
on public.recommendation_feedback
for insert
to anon, authenticated
with check (user_id is null or auth.uid() = user_id);

drop policy if exists "users can read own recommendation feedback" on public.recommendation_feedback;
create policy "users can read own recommendation feedback"
on public.recommendation_feedback
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "public can insert player nominations" on public.player_nominations;
create policy "public can insert player nominations"
on public.player_nominations
for insert
to anon
with check (true);

drop policy if exists "users can read own profile" on public.profiles;
create policy "users can read own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "users can insert own profile" on public.profiles;
create policy "users can insert own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "users can read own setups" on public.user_setups;
create policy "users can read own setups"
on public.user_setups
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users can insert own setups" on public.user_setups;
create policy "users can insert own setups"
on public.user_setups
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "users can update own setups" on public.user_setups;
create policy "users can update own setups"
on public.user_setups
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "public can read model versions" on public.model_versions;
create policy "public can read model versions"
on public.model_versions
for select
to anon, authenticated
using (true);

drop policy if exists "public can read feature versions" on public.feature_versions;
create policy "public can read feature versions"
on public.feature_versions
for select
to anon, authenticated
using (true);

drop policy if exists "users can read own saved recommendations" on public.saved_recommendations;
create policy "users can read own saved recommendations"
on public.saved_recommendations
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users can insert own saved recommendations" on public.saved_recommendations;
create policy "users can insert own saved recommendations"
on public.saved_recommendations
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "users can read own setup simulations" on public.setup_simulations;
create policy "users can read own setup simulations"
on public.setup_simulations
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users can insert own setup simulations" on public.setup_simulations;
create policy "users can insert own setup simulations"
on public.setup_simulations
for insert
to authenticated
with check (auth.uid() = user_id);

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

drop view if exists public.public_dashboard_metrics;
create view public.public_dashboard_metrics as
select
  (select count(*)::int from public.quiz_submissions where consent_to_research = true) as quiz_submissions,
  (select count(*)::int from public.recommendation_feedback where consent_to_research = true) as feedback_count,
  (select count(*)::int from public.player_nominations) as player_nominations,
  (select count(*)::int from public.ball_donations) as ball_donations,
  (select count(*)::int from public.support_payments where status = 'paid') as support_payments,
  (select coalesce(sum(ball_count), 0)::int from public.ball_donations) as balls_collected,
  (select coalesce(round(sum(amount_total)::numeric / 100, 2), 0)::numeric from public.support_payments where status = 'paid') as stripe_support_dollars,
  (select coalesce(round(avg(case when would_try = 'yes' then 1 else 0 end) * 100), 0)::int from public.recommendation_feedback where consent_to_research = true and would_try is not null) as would_try_rate,
  (select coalesce(round(avg(case when accurate = 'yes' then 1 else 0 end) * 100), 0)::int from public.recommendation_feedback where consent_to_research = true and accurate is not null) as accuracy_rate,
  (select coalesce(round(avg(final_score)), 0)::int from public.recommendation_feedback where consent_to_research = true and final_score is not null) as average_fit_score,
  (select coalesce(round(avg(confidence_score)), 0)::int from public.recommendation_feedback where consent_to_research = true and confidence_score is not null) as average_confidence_score,
  (
    select coalesce(jsonb_agg(jsonb_build_object('name', archetype, 'value', row_count) order by row_count desc), '[]'::jsonb)
    from (
      select coalesce(recommendations->>'archetype', 'Unknown') as archetype, count(*)::int as row_count
      from public.quiz_submissions
      where consent_to_research = true
      group by 1
    ) archetypes
  ) as archetype_distribution,
  (
    select coalesce(jsonb_agg(jsonb_build_object('name', budget_tier, 'value', row_count) order by row_count desc), '[]'::jsonb)
    from (
      select coalesce(budget_tier, 'Unknown') as budget_tier, count(*)::int as row_count
      from public.quiz_submissions
      where consent_to_research = true
      group by 1
    ) budgets
  ) as budget_distribution,
  (
    select coalesce(jsonb_agg(jsonb_build_object('bucket', bucket, 'count', row_count, 'accuracy', accuracy_rate) order by bucket), '[]'::jsonb)
    from (
      select
        case
          when confidence_rating is null then 'Unrated'
          when confidence_rating <= 3 then '1-3'
          when confidence_rating <= 7 then '4-7'
          else '8-10'
        end as bucket,
        count(*)::int as row_count,
        coalesce(round(avg(case when accurate = 'yes' then 1 else 0 end) * 100), 0)::int as accuracy_rate
      from public.recommendation_feedback
      where consent_to_research = true
      group by 1
    ) calibration
  ) as confidence_calibration,
  (
    select coalesce(jsonb_agg(jsonb_build_object('name', reason, 'value', row_count) order by row_count desc), '[]'::jsonb)
    from (
      select reason, count(*)::int as row_count
      from public.recommendation_feedback, unnest(mismatch_reasons) as reason
      where consent_to_research = true
      group by reason
      order by row_count desc
      limit 8
    ) reasons
  ) as mismatch_reasons,
  (
    select jsonb_build_object(
      'playersHelped', players_helped,
      'setupsDonated', setups_donated,
      'dollarsRaised', dollars_raised + (select coalesce(round(sum(amount_total)::numeric / 100, 2), 0)::numeric from public.support_payments where status = 'paid'),
      'ballsCollected', balls_collected,
      'sheltersSupported', shelters_supported,
      'seniorHomesSupported', senior_homes_supported,
      'organizationsHelped', organizations_helped
    )
    from public.impact_stats
    where id = 'current'
  ) as impact_stats;

grant select on public.public_dashboard_metrics to anon, authenticated;
grant insert, update, select on public.support_payments to service_role;
grant insert on public.quiz_submissions to anon, authenticated;
grant select on public.quiz_submissions to authenticated;
grant insert on public.recommendation_feedback to anon, authenticated;
grant select on public.recommendation_feedback to authenticated;
grant insert on public.player_nominations to anon;
grant insert on public.ball_donations to anon;
grant select on public.impact_stats to anon;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.user_setups to authenticated;
grant select on public.model_versions to anon, authenticated;
grant select on public.feature_versions to anon, authenticated;
grant select, insert on public.saved_recommendations to authenticated;
grant select, insert on public.setup_simulations to authenticated;
