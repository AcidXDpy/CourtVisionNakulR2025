# GearVision Methodology

GearVision currently uses an explainable hybrid rules engine. It is not a trained machine-learning model yet.

## Player Representation

Quiz answers are transformed into a player vector:

- spin demand
- power demand
- control demand
- serve importance
- net/transition preference
- comfort demand
- aggression/risk tolerance
- skill score

The engine also stores raw profile fields such as current racket, current string, current tension, budget, swing speed, and pain/comfort concerns.

## Equipment Representation

Racket and string records are normalized into comparable features:

- price
- weight
- swingweight
- stiffness
- head size
- string pattern
- power
- control
- spin
- comfort
- durability
- data confidence

Some equipment values are estimated from the local catalog. Missing or uncertain data lowers confidence instead of being presented as verified.

## Setup Scoring

GearVision scores complete configurations:

```text
setup = racket + string + string configuration + suggested tension + estimated cost
```

Each setup receives component scores:

- playstyle fit
- trait fit
- performance fit
- comfort fit
- budget fit
- safety fit
- skill fit
- data quality

The final score is a weighted average with penalty adjustments for:

- active elbow, shoulder, or wrist pain
- full polyester strings for arm-sensitive players
- stiff frames
- beginner-inappropriate frames
- budget mismatch
- swing-speed mismatch

## Multi-Objective Ranking

The engine intentionally returns several useful answers:

- Best overall balance
- Lowest arm-stress configuration
- Maximum spin path
- Best performance within budget
- Easiest transition

This avoids pretending one setup is universally best.

## Counterfactual Simulator

The simulator estimates relative changes from:

- lowering or raising string tension
- adding lead weight
- changing lead placement
- frame/string stiffness interaction

The simulator outputs deltas for power, control, spin, comfort, stability, maneuverability, string-bed stiffness, and arm-stress warning score.

These formulas are transparent approximations for product guidance, not lab measurements.

## Confidence

Confidence increases when:

- component scores agree
- the player profile closely matches an archetype
- equipment data is complete
- there are fewer warnings

Confidence decreases when:

- data is missing
- warnings stack up
- the setup is near a hard constraint

## Evaluation Plan

The current feedback system stores:

- whether a user would try a setup
- whether it felt accurate
- accuracy, comfort, and confidence ratings
- mismatch reasons
- actual setup used later
- model version
- feature schema version
- predicted scores

Future evaluation should compute:

- mean absolute error by attribute
- recommendation acceptance rate
- confidence calibration
- performance by playstyle
- performance by skill level
- failure reasons by setup type

No supervised model should be claimed until enough real outcome rows exist to train and validate one.
