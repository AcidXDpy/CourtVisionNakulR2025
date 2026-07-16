# Contributing

GearVision is still an early data product, so contributions should improve either recommendation quality, data quality, product clarity, or privacy.

## Development Workflow

1. Run tests before changing model logic.
2. Keep recommendation formulas in `src/lib`, not inside UI components.
3. Add model or feature version changes when scoring behavior changes materially.
4. Mark uncertain equipment data as estimated rather than verified.
5. Do not add medical claims.
6. Do not commit secrets or private Supabase keys.

## Data Guidelines

- Prefer manufacturer or reputable retailer data.
- Store source and confidence metadata when adding richer equipment records.
- Use null or conservative estimates when exact values are unavailable.
- Do not invent precise specs.

## Model Guidelines

- Keep formulas deterministic and explainable until real outcome data supports a trained model.
- Add tests for scoring, constraints, simulator calculations, and evaluation metrics.
- Explanations must refer to actual score factors, not generic marketing language.

## Privacy Guidelines

- Quiz research consent must remain optional.
- Public dashboards must show aggregate metrics only.
- Raw names, emails, comments, nominations, and donation logistics stay private in Supabase.
