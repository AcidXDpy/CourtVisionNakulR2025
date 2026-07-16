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
  assert.ok(['one_setup', 'ranked_shortlist', 'demo_sequence'].includes(recommendations.recommendedOutputType));
  assert.ok(recommendations.diagnosis.primaryProblem);
  assert.ok(recommendations.decisionChangingQuestion);
  assert.ok(setup.configuration.racket);
  assert.ok(setup.configuration.string);
  assert.ok(setup.tensionPlan.startingPoint);
  assert.ok(setup.tensionPlan.range);
  assert.ok(setup.tensionPlan.adjustmentRules.length >= 2);
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

test('heavy topspin high-launch profile returns spin-friendly but confidence-aware options', () => {
  const result = clone(defaultModelResult);
  result.primary = 'Heavy Topspin Player';
  result.profileInputs.playingStyle = 'Heavy topspin baseliner';
  result.profileInputs.swingSpeed = 'Fast';
  result.profileInputs.strokeLength = 'Long/full';
  result.profileInputs.topspinLevel = 9;
  result.profileInputs.launchPreference = 'Higher heavy ball';
  result.profileInputs.missPattern = 'Short';
  result.profileInputs.paceGeneration = 'I create my own pace';
  result.profileInputs.budgetAmount = 420;
  result.traits.spinIntent = 90;

  const recommendations = buildAdvancedRecommendations(result);
  const racketNames = recommendations.topSetups.map((setup) => setup.racket.name).join(' ');

  assert.match(recommendations.diagnosis.primaryProblem, /higher|launch/i);
  assert.match(racketNames, /Aero|VCORE|Extreme|Strike/i);
  assert.equal(recommendations.recommendedOutputType, 'ranked_shortlist');
});

test('flat hitter with long misses avoids high-launch Aero-style defaults', () => {
  const result = clone(defaultModelResult);
  result.primary = 'Aggressive Baseliner';
  result.profileInputs.playingStyle = 'Flat power hitter';
  result.profileInputs.swingSpeed = 'Fast';
  result.profileInputs.strokeLength = 'Long/full';
  result.profileInputs.topspinLevel = 2;
  result.profileInputs.launchPreference = 'Lower penetrating ball';
  result.profileInputs.missPattern = 'Long';
  result.profileInputs.paceGeneration = 'I create my own pace';
  result.profileInputs.controlMeaning = 'Lower launch';
  result.profileInputs.budgetAmount = 420;
  result.traits.spinIntent = 20;
  result.traits.controlIntent = 86;

  const recommendations = buildAdvancedRecommendations(result);
  const topRacket = recommendations.topSetups[0].racket;

  assert.doesNotMatch(topRacket.name, /Pure Aero/i);
  assert.ok(topRacket.control >= 7);
  assert.match(recommendations.diagnosis.primaryProblem, /launch|predictability|long/i);
});

test('mild soreness starts with comfort-oriented non-poly setup choices', () => {
  const result = clone(defaultModelResult);
  result.comfortPriority = 1;
  result.armIssue = 'Mild soreness';
  result.profileInputs.painArea = 'Elbow';
  result.profileInputs.painSeverity = 'Mild soreness after long play';
  result.profileInputs.swingSpeed = 'Fast';
  result.profileInputs.topspinLevel = 7;
  result.profileInputs.budgetAmount = 420;

  const recommendations = buildAdvancedRecommendations(result);

  recommendations.recommendedSetups.forEach((setup) => {
    assert.ok(setup.racket.stiffness <= 64);
    assert.notEqual(setup.string.stringType, 'Polyester');
  });
});

test('active pain blocks full polyester recommendations as a starting point', () => {
  const result = clone(defaultModelResult);
  result.comfortPriority = 2;
  result.armIssue = 'Active pain';
  result.profileInputs.painArea = 'Elbow';
  result.profileInputs.painSeverity = 'Active pain changes my swing';
  result.profileInputs.budgetAmount = 420;

  const recommendations = buildAdvancedRecommendations(result);

  recommendations.topSetups.forEach((setup) => {
    assert.notEqual(setup.string.stringType, 'Polyester');
  });
  assert.ok(recommendations.expertWarnings.some((warning) => warning.includes('full polyester')));
});

test('frequent breaker prioritizes durable string families before tension changes', () => {
  const result = clone(defaultModelResult);
  result.profileInputs.stringBreakFrequency = 'Every 3-6 hours';
  result.profileInputs.painArea = 'None';
  result.profileInputs.painSeverity = 'None';
  result.profileInputs.budgetAmount = 420;
  result.traits.durabilityNeed = 96;

  const recommendations = buildAdvancedRecommendations(result);

  assert.ok(recommendations.topStrings.every((string) => ['Polyester', 'Hybrid'].includes(string.stringType)));
  assert.ok(recommendations.expertWarnings.some((warning) => warning.includes('string model/gauge')));
});

test('low-confidence profiles produce demo sequence instead of fake certainty', () => {
  const result = clone(defaultModelResult);
  result.profileInputs.launchPreference = 'Not sure yet';
  result.profileInputs.missPattern = 'Not sure yet';
  result.profileInputs.swingweightTolerance = 'Not sure yet';
  result.profileInputs.fatigueBreakdown = 'Not sure yet';
  result.profileInputs.stringBreakFrequency = 'Not sure yet';
  result.profileInputs.controlMeaning = 'Not sure yet';
  result.profileInputs.spinMeaning = 'Not sure yet';
  result.profileInputs.demoReadiness = 'Give me a demo sequence';

  const recommendations = buildAdvancedRecommendations(result);

  assert.equal(recommendations.recommendedOutputType, 'demo_sequence');
  assert.equal(recommendations.demoSequence.length, 3);
  assert.match(recommendations.decisionChangingQuestion, /higher|flatter|miss/i);
});

test('high-confidence profiles collapse to one primary setup', () => {
  const result = clone(defaultModelResult);
  result.primary = 'Heavy Topspin Player';
  result.profileInputs.demoReadiness = 'Give me one strong answer';
  result.profileInputs.launchPreference = 'Higher heavy ball';
  result.profileInputs.missPattern = 'Short';
  result.profileInputs.swingweightTolerance = 'Balanced';
  result.profileInputs.fatigueBreakdown = 'No major issue';
  result.profileInputs.stringBreakFrequency = 'Every 10-20 hours';
  result.profileInputs.controlMeaning = 'Predictable depth';
  result.profileInputs.spinMeaning = 'Heavier bounce';
  result.profileInputs.playingStyle = 'Heavy topspin baseliner';
  result.profileInputs.swingSpeed = 'Fast';
  result.profileInputs.topspinLevel = 9;
  result.profileInputs.paceGeneration = 'I create my own pace';
  result.profileInputs.budgetAmount = 420;

  const recommendations = buildAdvancedRecommendations(result);

  assert.equal(recommendations.recommendedOutputType, 'one_setup');
  assert.equal(recommendations.recommendedSetups.length, 1);
});
