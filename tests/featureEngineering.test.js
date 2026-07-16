import assert from 'node:assert/strict';
import test from 'node:test';
import { rackets } from '../src/data/rackets.js';
import { strings } from '../src/data/strings.js';
import { FEATURE_SCHEMA_VERSION, normalizeRacketRecord, normalizeStringRecord } from '../src/lib/equipmentSchema.js';
import { calculateModelEvaluation } from '../src/lib/modelEvaluation.js';

test('normalizes local racket and string records into stable schema fields', () => {
  const racket = normalizeRacketRecord(rackets[0]);
  const string = normalizeStringRecord(strings[0]);

  assert.ok(racket.id.length > 0);
  assert.equal(racket.lengthInches, 27);
  assert.ok(racket.headSizeSqIn >= 95);
  assert.ok(racket.dataConfidence > 0.5);
  assert.ok(string.id.length > 0);
  assert.ok(string.retailPrice > 0);
  assert.ok(string.dataConfidence > 0.5);
});

test('model evaluation computes acceptance, accuracy, and calibration deterministically', () => {
  const summary = calculateModelEvaluation([
    { would_try: 'yes', accurate: 'yes', final_score: 84, confidence_score: 88, accuracy_rating: 8 },
    { would_try: 'no', accurate: 'no', final_score: 76, confidence_score: 55, accuracy_rating: 4 },
  ]);

  assert.equal(FEATURE_SCHEMA_VERSION, 'gv-feature-schema-2.0.0');
  assert.equal(summary.sampleSize, 2);
  assert.equal(summary.acceptanceRate, 50);
  assert.equal(summary.accuracyRate, 50);
  assert.ok(summary.meanAbsoluteError >= 0);
  assert.equal(summary.confidenceCalibration.length, 3);
});
