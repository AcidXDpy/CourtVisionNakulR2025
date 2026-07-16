import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildAdvancedRecommendations,
  defaultModelResult,
  evaluateSetupConstraints,
  FEATURE_SCHEMA_VERSION,
  RECOMMENDATION_MODEL_VERSION,
} from '../src/data/recommendationModel.js';
import { rackets } from '../src/data/rackets.js';
import { strings } from '../src/data/strings.js';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test('advanced recommendations return versioned complete setup outputs', () => {
  const result = clone(defaultModelResult);
  result.profileInputs.playingStyle = 'Heavy topspin baseliner';
  result.profileInputs.topspinLevel = 9;
  result.profileInputs.swingSpeed = 'Fast';
  result.profileInputs.budgetAmount = 420;

  const recommendations = buildAdvancedRecommendations(result);
  const setup = recommendations.topSetups[0];

  assert.equal(recommendations.modelVersion, RECOMMENDATION_MODEL_VERSION);
  assert.equal(recommendations.featureSchemaVersion, FEATURE_SCHEMA_VERSION);
  assert.ok(recommendations.candidateCount > 20);
  assert.equal(recommendations.topSetups.length, 3);
  assert.ok(setup.configuration.racket);
  assert.ok(setup.configuration.string);
  assert.ok(Number.isFinite(setup.predictedAttributes.effectiveSpin));
  assert.ok(Number.isFinite(setup.predictedAttributes.armStressWarningScore));
  assert.ok(setup.contributionBreakdown.length >= 5);
});

test('comfort safeguard excludes stiff full-poly setups for active pain profiles', () => {
  const result = clone(defaultModelResult);
  result.comfortPriority = 2;
  result.armIssue = 'Active pain';
  result.profileInputs.painArea = 'Elbow';
  result.profileInputs.budgetAmount = 420;

  const stiffRacket = rackets.find((racket) => racket.name.includes('Pure Drive Tour'));
  const stiffPoly = strings.find((string) => string.name.includes('ALU Power 125'));
  const constraints = evaluateSetupConstraints(stiffRacket, stiffPoly, result);

  assert.equal(constraints.eligible, false);
  assert.ok(constraints.hardFailures.some((failure) => failure.includes('comfort safeguard')));
});

test('objective recommendations produce multiple decision paths', () => {
  const recommendations = buildAdvancedRecommendations(defaultModelResult);
  const labels = recommendations.objectiveRecommendations.map((objective) => objective.label);

  assert.ok(labels.includes('Best overall balance'));
  assert.ok(labels.includes('Lowest arm-stress configuration'));
  assert.ok(labels.includes('Best performance within budget'));
});
