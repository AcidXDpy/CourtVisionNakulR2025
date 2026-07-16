# GearVision Data Dictionary

## Feature Versions

`feature_versions`

- `id`: feature schema identifier, for example `gv-feature-schema-2.0.0`
- `player_features`: player vector fields used by the model
- `equipment_features`: racket/string fields used by the model
- `setup_features`: derived setup attributes

## Model Versions

`model_versions`

- `id`: model identifier, for example `gv-rules-engine-2.0.0`
- `status`: active, retired, or experimental
- `description`: summary of scoring approach
- `intended_use`: where the model should be used
- `limitations`: known limits and non-intended uses
- `coefficients`: model coefficient metadata
- `evaluation_summary`: current evaluation status

## Quiz Submissions

`quiz_submissions`

- `user_id`: optional signed-in user owner
- `anonymous_session_id`: browser-local anonymous identifier
- `consent_to_research`: whether the row may be used in aggregate research metrics
- `model_version`: model version that generated the recommendation
- `feature_schema_version`: feature schema used at generation time
- `candidate_count`: number of eligible candidate setups evaluated
- `top_setup_score`: score of the top complete setup
- `confidence_score`: confidence of the top complete setup
- `primary_playstyle`: top quiz playstyle
- `secondary_playstyle`: secondary quiz playstyle
- `budget_tier`: value, balanced, or premium
- `max_setup_price`: selected setup budget
- `arm_issue`: user-provided comfort/pain signal
- `profile`: raw player profile inputs
- `traits`: normalized player trait values
- `style_scores`: raw playstyle quiz scores
- `recommendations`: versioned recommendation snapshot

## Recommendation Feedback

`recommendation_feedback`

- `setup_id`: racket/string/playstyle key
- `setup_label`: UI label such as best statistical fit
- `racket`: recommended racket
- `string`: recommended string
- `final_score`: predicted setup fit score
- `confidence_score`: predicted confidence
- `total_price`: estimated setup cost
- `model_version`: model that produced the recommendation
- `feature_schema_version`: feature schema used by the model
- `predicted_scores`: predicted setup attributes
- `score_components`: component score breakdown
- `would_try`: yes, maybe, or no
- `accurate`: yes, mixed, or no
- `accuracy_rating`: 1-10 user rating
- `comfort_rating`: 1-10 user rating
- `confidence_rating`: 1-10 user rating
- `mismatch_reasons`: selected failure reasons
- `comments`: optional text feedback, private in raw table
- `actual_setup_used`: optional follow-up setup

## Private Account Data

`profiles`

- Stores signed-in player profile fields.
- Row ownership is controlled by `user_id`/`id` through RLS.

`user_setups`

- Stores private setup history, ratings, and current setup marker.

`saved_recommendations`

- Stores user-saved recommendation snapshots for future comparison.

`setup_simulations`

- Stores signed-in simulator history:
  - baseline setup
  - change set
  - predicted before/after
  - deltas

## Community Impact Data

`player_nominations`

- Stores Play It Forward nominations.
- Contains contact information and should not be exposed publicly.

`ball_donations`

- Stores used-ball donation logistics.
- Contains donor contact information and should not be exposed publicly.

`impact_stats`

- Manually maintained public counters for fulfilled impact outcomes.

`public_dashboard_metrics`

- Public aggregate view only.
- Does not expose names, emails, comments, or raw private records.
