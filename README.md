# GearVision

GearVision is a tennis equipment intelligence project built on the existing CourtVision repo. It recommends complete racket-and-string setups using an explainable, deterministic scoring engine, then collects opt-in feedback so the model can be evaluated over time.

## What It Does

- Builds a detailed player profile from quiz inputs, sliders, current setup, budget, and comfort concerns.
- Scores complete configurations: racket, string, string type, suggested tension, estimated cost, comfort risk, and skill demand.
- Produces multiple recommendation paths instead of one fake "best" answer: overall fit, comfort, spin, value, and easiest transition.
- Includes a counterfactual setup simulator for tension and customization changes.
- Saves opt-in quiz/feedback data to Supabase for future statistical evaluation.
- Supports magic-link accounts, private setup tracking, public aggregate impact metrics, Play It Forward nominations, and ball recycling submissions.

## Tech Stack

- React 19 + Vite
- Tailwind CSS utility styling
- Recharts for public analytics
- Supabase Free for auth, Postgres, RLS, opt-in research data, and account data
- Local deterministic JavaScript recommendation engine, no AI API calls

## Local Development

```bash
pnpm install
pnpm run dev
```

Then open the local URL Vite prints, usually `http://127.0.0.1:5173/`.

## Verification

```bash
pnpm run test
pnpm run build
```

## Supabase

GearVision can render without Supabase keys, but persistence requires:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-or-publishable-key
```

Run `supabase/schema.sql` in the Supabase SQL editor after pulling backend changes. The schema enables RLS, adds aggregate-safe public metrics, and stores model/feature versions for future evaluation.

## Key Docs

- `ARCHITECTURE.md`: system modules and data flow
- `METHODOLOGY.md`: recommendation math and simulator assumptions
- `DATA_DICTIONARY.md`: database and feature definitions
- `MODEL_CARD.md`: intended use, limitations, failure modes, and evaluation status

## Current Limitation

The production engine is explainable and rule-based. It should not be described as trained machine learning until enough real user outcome data exists to validate a supervised model.
