# GearVision Model Card

## Model Name

`gv-rules-engine-2.0.0`

## Intended Use

GearVision provides educational tennis equipment decision support. It helps players compare racket-and-string configurations and understand tradeoffs around power, control, spin, comfort, skill demand, and budget.

## Non-Intended Use

GearVision should not be used as:

- medical advice
- injury diagnosis or prevention
- a professional fitting guarantee
- proof that a player should buy a specific product
- a trained machine-learning model claim

## Model Type

Deterministic, explainable rules engine with:

- feature engineering
- weighted scoring
- archetype similarity
- hard and soft constraints
- multi-objective ranking
- confidence scoring
- conservative comfort warnings

## Inputs

- player skill level
- age, height, and weight when provided
- swing speed
- spin level
- playing style
- court-position preference
- serve importance
- power/control preference
- pain or comfort concern
- current racket
- current string
- current tension
- setup dislikes
- budget

## Outputs

- top racket recommendations
- top string recommendations
- complete setup recommendations
- suggested tension range
- fit score
- confidence score
- objective rankings
- predicted setup attributes
- warnings
- explanation bullets

## Data

The current equipment catalog is local seed data with product images and approximate product attributes. Some values are estimated, and data confidence is tracked. Real user outcome data is just beginning to be collected through optional feedback.

## Evaluation Status

Current status: pre-outcome-data.

The system can compute evaluation metrics, but those metrics are not statistically meaningful until enough real feedback rows exist. A reasonable early threshold is 50+ opt-in feedback rows.

## Known Failure Modes

- incomplete equipment specs can distort confidence
- players may misjudge their swing speed or skill level
- comfort outcomes vary by technique, health, and stringing quality
- budget constraints may exclude otherwise useful setups
- current setup text is not yet parsed into a verified equipment object
- product availability and pricing are not live

## Safety Notes

Arm, elbow, shoulder, and wrist warnings are conservative equipment-risk signals. GearVision does not predict or prevent injury. Users with pain should consult a qualified coach, stringer, or medical professional.

## Future Improvements

- verified equipment ingestion pipeline
- stronger current-setup parsing
- outcome follow-up after users test gear
- offline evaluation notebooks
- supervised models only after enough validated feedback exists
- admin tooling for data quality and model-error review
