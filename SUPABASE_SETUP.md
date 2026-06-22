# CourtVision Supabase Setup

CourtVision can run without Supabase keys, but adding a free Supabase project turns quiz results, recommendation feedback, player nominations, and ball donations into a real dataset.

## 1. Create the project

1. Go to Supabase and create a free project.
2. Open SQL Editor.
3. Paste and run `supabase/schema.sql`.

## 2. Add local environment variables

Create `.env.local` in the project root:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

The anon key is allowed in the browser. Row Level Security in `supabase/schema.sql` lets public users insert submissions, but does not let them read private submission tables.

## 3. Add Vercel environment variables

In Vercel:

1. Open the CourtVision project.
2. Go to Settings -> Environment Variables.
3. Add `VITE_SUPABASE_URL`.
4. Add `VITE_SUPABASE_ANON_KEY`.
5. Redeploy.

## 4. What gets saved

- `quiz_submissions`: player profile, traits, playstyle scores, and recommendation snapshot.
- `recommendation_feedback`: “Would try” and “Feels accurate” feedback from results.
- `player_nominations`: Play It Forward nomination form.
- `ball_donations`: Recycle Tennis Balls donation form.
- `impact_stats`: public read table for future impact counters.

## 5. Free-tier MVP note

This is designed for Supabase Free. Keep exports/backups manually while the project is early. When the dataset becomes important, upgrade or add a backup workflow.
