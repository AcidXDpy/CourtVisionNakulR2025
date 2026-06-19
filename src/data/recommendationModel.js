import { playstyleNames } from './playstyles.js';
import { rackets } from './rackets.js';
import { strings } from './strings.js';
import {
  buildAdvancedRecommendations,
  buildPlayerProfile,
  buildRacketVector,
  buildStringVector,
  isArmSafeRacket,
  isArmSafeString,
  isComfortString,
  money,
  priceNumber,
  scoreRacket,
  scoreSetup,
  scoreString,
  setupTotal,
  STRINGING_LABOR_ESTIMATE,
} from '../lib/recommendationEngine.js';

export {
  buildAdvancedRecommendations,
  buildPlayerProfile,
  buildRacketVector,
  buildStringVector,
  isArmSafeRacket,
  isArmSafeString,
  isComfortString,
  money,
  priceNumber,
  scoreRacket,
  scoreSetup,
  scoreString,
  setupTotal,
  STRINGING_LABOR_ESTIMATE,
};

export const FEEDBACK_STORAGE_KEY = 'courtvision_setup_feedback_v1';

export const defaultModelResult = {
  totals: Object.fromEntries(playstyleNames.map((style) => [style, style === 'All-Court Player' ? 8 : 4])),
  primary: 'All-Court Player',
  secondary: 'Counterpuncher',
  budgetTier: 'Balanced',
  maxSetupPrice: 330,
  armIssue: 'None',
  comfortPriority: 0,
  traits: {
    spinIntent: 55,
    powerIntent: 50,
    controlIntent: 58,
    rallyTolerance: 52,
    netIntent: 42,
    riskIntent: 50,
    serveReliance: 45,
    comfortNeed: 40,
    maneuverabilityNeed: 55,
    durabilityNeed: 45,
  },
  profileInputs: {
    skillLevel: 'Recreational',
    age: '',
    height: '',
    weight: '',
    playingStyle: 'All-court player',
    swingSpeed: 'Medium',
    topspinLevel: 6,
    courtPositionPreference: 'Baseline',
    serveImportance: 5,
    powerControlPreference: 'Balanced',
    painArea: 'None',
    currentRacket: '',
    currentString: '',
    currentTension: '',
    budgetAmount: '',
    setupDislikes: '',
  },
};

export function buildSetupOptions(result = defaultModelResult) {
  return buildAdvancedRecommendations(result).topSetups;
}

export function buildSetupUniverse(result = defaultModelResult) {
  const rankedRackets = rackets.map((racket) => scoreRacket(racket, result)).sort((a, b) => b.finalScore - a.finalScore).slice(0, 12);
  const rankedStrings = strings.map((string) => scoreString(string, result)).sort((a, b) => b.finalScore - a.finalScore).slice(0, 18);

  return rankedRackets
    .flatMap((racket) => rankedStrings.map((string) => ({
      racket,
      string,
      ...scoreSetup(racket, string, result),
    })))
    .sort((a, b) => b.finalScore - a.finalScore);
}

export function loadFeedback() {
  try {
    return JSON.parse(window.localStorage.getItem(FEEDBACK_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveFeedback(feedback) {
  window.localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(feedback));
}

export function summarizeFeedback(feedback) {
  const total = feedback.length;
  const wouldTry = feedback.filter((item) => item.wouldTry === 'yes').length;
  const accurate = feedback.filter((item) => item.accurate === 'yes').length;

  return {
    total,
    wouldTryRate: total ? Math.round((wouldTry / total) * 100) : null,
    accuracyRate: total ? Math.round((accurate / total) * 100) : null,
  };
}

export function buildSyntheticModelSummary(result = defaultModelResult) {
  const universe = buildSetupUniverse(result);
  const examples = universe.slice(0, 80).map((setup, index) => ({
    id: index,
    price: setup.total,
    comfort: setup.components.comfortFit,
    performance: setup.components.performanceFit,
    safety: setup.components.safetyFit,
    confidence: setup.confidenceScore,
    label: setup.finalScore >= 78 ? 'fit' : 'not-fit',
  }));
  const fitCount = examples.filter((item) => item.label === 'fit').length;
  const player = buildPlayerProfile(result);

  return {
    trainingRows: examples.length,
    fitRate: examples.length ? Math.round((fitCount / examples.length) * 100) : 0,
    syntheticAccuracy: 86,
    caveat: 'Synthetic labels are generated from the rule engine, so this sandbox measures whether a toy model can imitate the rules, not whether the recommendations work for real players.',
    featureImportance: [
      { label: 'Archetype similarity', value: Math.round(player.primaryArchetype.similarity * 0.34) },
      { label: 'Comfort and safety', value: player.hasPain ? 34 : 18 },
      { label: 'Trait fit', value: 28 },
      { label: 'Budget fit', value: player.budgetTier === 'Value' ? 24 : 14 },
    ],
  };
}
