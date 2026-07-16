# GearVision Architecture

GearVision is organized around a small but explicit data-product architecture.

## Runtime Stack

- Frontend: React + Vite
- Styling: Tailwind utility classes in `src/index.css`
- Analytics charts: Recharts
- Persistence: Supabase Auth + Postgres through the browser publishable/anon key
- Recommendation engine: local deterministic JavaScript modules

## Core Modules

### Equipment Data Layer

- Source files: `src/data/rackets.js`, `src/data/strings.js`
- Normalization: `src/lib/equipmentSchema.js`
- Purpose: convert catalog records into stable equipment fields with data-confidence metadata.

### Player Profile System

- Source files: `src/data/playstyles.js`, `src/components/PlaystyleQuiz.jsx`
- Output: quiz result with playstyle scores, slider traits, budget, arm-sensitivity signal, and raw profile inputs.

### Feature Engineering Pipeline

- Source file: `src/lib/featureEngineering.js`
- Responsibilities:
  - min-max normalization
  - z-score helpers
  - cosine similarity
  - arm-stress and skill-demand calculations
  - feature schema versioning

### Configuration Scoring Engine

- Source file: `src/lib/recommendationEngine.js`
- Responsibilities:
  - racket scoring
  - string scoring
  - complete setup scoring
  - hard and soft constraints
  - confidence scoring
  - contribution breakdowns
  - model versioning

### Multi-Objective Recommendation Engine

- Source file: `src/lib/recommendationEngine.js`
- Output categories:
  - best overall balance
  - lowest arm-stress configuration
  - maximum spin path
  - best performance within budget
  - easiest transition

### Counterfactual Setup Simulator

- Source file: `src/lib/setupSimulator.js`
- Estimates deltas from:
  - string tension changes
  - added weight
  - weight placement
  - string-family stiffness

### Feedback and Evaluation

- Source files: `src/lib/modelEvaluation.js`, `src/lib/supabaseClient.js`
- Storage:
  - localStorage feedback export for local demos
  - Supabase opt-in feedback rows for aggregate evaluation

### Supabase Schema

- Source file: `supabase/schema.sql`
- Includes:
  - quiz submissions
  - recommendation feedback
  - private user profiles
  - private setup tracking
  - saved recommendations
  - setup simulations
  - model versions
  - feature versions
  - public aggregate dashboard view

## Data Flow

1. User completes quiz.
2. `scoreQuiz` builds raw profile and trait values.
3. `buildPlayerProfile` converts the quiz into a normalized player vector.
4. Rackets and strings are scored independently.
5. Candidate setups are generated and filtered through constraints.
6. Each complete setup receives predicted attributes, fit components, warnings, confidence, and explanations.
7. Results UI shows top setups, objective paths, and simulator deltas.
8. If consent or login allows it, Supabase stores the profile, recommendation snapshot, model version, and feedback.

## Why This Shape

The architecture keeps product UI separate from model logic. That makes it possible to add real outcome data, offline notebooks, or supervised models later without rewriting the app around a component-level scoring hack.
