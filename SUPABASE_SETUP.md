# Gear Vision Supabase Setup

Gear Vision can run without Supabase keys, but adding a free Supabase project turns opt-in quiz results, recommendation feedback, player nominations, and ball donations into a real dataset.
Supabase also powers magic-link accounts, private player profiles, setup tracking, and personal analytics.

## 1. Create the project

1. Go to Supabase and create a free project.
2. Open SQL Editor.
3. Paste and run `supabase/schema.sql`.

Run the schema again after pulling new backend changes. It uses `if not exists` where possible, so it can safely add new columns and refresh the public aggregate dashboard view without wiping existing rows.

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

## 4. Configure Auth redirects

In Supabase:

1. Open Authentication -> URL Configuration.
2. Set the site URL to your Vercel production URL.
3. Add redirect URLs for:
   - `http://127.0.0.1:5173/profile`
   - `http://localhost:5173/profile`
   - `https://your-vercel-domain.vercel.app/profile`

Magic links redirect users back to `/profile`.

## 5. What gets saved

- `quiz_submissions`: anonymous player profile, traits, playstyle scores, consent flag, and recommendation snapshot.
- `recommendation_feedback`: structured fit feedback, 1-10 ratings, mismatch reasons, actual setup notes, and consent flag.
- `profiles`: private signed-in player profile.
- `user_setups`: private setup history for signed-in users.
- `player_nominations`: Play It Forward nomination form.
- `ball_donations`: Recycle Tennis Balls donation form.
- `impact_stats`: public read table for future impact counters.
- `public_dashboard_metrics`: public-safe aggregate view for the Impact dashboard. It does not expose names, emails, comments, or private form details.

## 6. Free-tier MVP note

This is designed for Supabase Free. Keep exports/backups manually while the project is early. When the dataset becomes important, upgrade or add a backup workflow.
