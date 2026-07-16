import { FEATURE_SCHEMA_VERSION, normalizeRacketRecord, normalizeStringRecord } from './equipmentSchema.js';

export const featureSchema = {
  version: FEATURE_SCHEMA_VERSION,
  playerFeatures: [
    'skillScore',
    'swingSpeedScore',
    'budgetCeiling',
    'spinDemand',
    'powerDemand',
    'controlDemand',
    'comfortDemand',
    'serveDemand',
    'netDemand',
    'armSensitivity',
  ],
  equipmentFeatures: [
    'retailPrice',
    'headSizeSqIn',
    'strungWeightGrams',
    'swingweight',
    'stiffnessRA',
    'powerLevel',
    'controlLevel',
    'spinPotential',
    'comfortLevel',
    'dataConfidence',
  ],
  setupFeatures: [
    'effectivePower',
    'effectiveControl',
    'effectiveSpin',
    'effectiveComfort',
    'effectiveStability',
    'effectiveManeuverability',
    'armStressWarningScore',
    'skillDemandScore',
    'configurationCost',
    'confidence',
  ],
};

export function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

export function clamp01(value) {
  return Math.min(1, Math.max(0, Number(value) || 0));
}

export function normalizeMinMax(value, min, max) {
  if (max === min) return 0;
  return clamp01((Number(value) - min) / (max - min));
}

export function zScore(value, mean, sd) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || !sd) return 0;
  return Math.min(3, Math.max(-3, (parsed - mean) / sd));
}

export function closeness(demand, supply, tolerance = 100) {
  return clamp(100 - (Math.abs(Number(demand) - Number(supply)) / tolerance) * 100);
}

export function cosineSimilarity(a, b) {
  const keys = [...new Set([...Object.keys(a || {}), ...Object.keys(b || {})])];
  const dot = keys.reduce((sum, key) => sum + (Number(a?.[key]) || 0) * (Number(b?.[key]) || 0), 0);
  const magA = Math.sqrt(keys.reduce((sum, key) => sum + (Number(a?.[key]) || 0) ** 2, 0));
  const magB = Math.sqrt(keys.reduce((sum, key) => sum + (Number(b?.[key]) || 0) ** 2, 0));
  return magA && magB ? dot / (magA * magB) : 0;
}

export function weightedMean(components, weights) {
  const entries = Object.entries(weights);
  const weightTotal = entries.reduce((sum, [, weight]) => sum + weight, 0) || 1;
  return entries.reduce((sum, [key, weight]) => sum + (Number(components[key]) || 0) * weight, 0) / weightTotal;
}

export function buildEquipmentFeatureRecord(racket, string) {
  const frame = normalizeRacketRecord(racket);
  const stringRecord = normalizeStringRecord(string);

  return {
    frame,
    string: stringRecord,
    combinedDataConfidence: Math.round(((frame.dataConfidence + stringRecord.dataConfidence) / 2) * 100),
    setupType: stringRecord.material === 'Hybrid' ? 'hybrid' : stringRecord.material === 'Polyester' ? 'full-poly' : 'full-bed',
  };
}

export function calculateArmStressScore({ frame, string, tensionMidpoint = 52, playerHasPain = false }) {
  const frameStress = normalizeMinMax(frame.stiffnessRA || 64, 56, 72) * 38;
  const stringStress = normalizeMinMax(string.comfortLevel ? 100 - string.comfortLevel : 50, 20, 80) * 28;
  const tensionStress = normalizeMinMax(tensionMidpoint, 42, 60) * 18;
  const painMultiplier = playerHasPain ? 1.22 : 1;

  return Math.round(clamp((frameStress + stringStress + tensionStress) * painMultiplier, 0, 100));
}

export function calculateSkillDemandScore({ frame, string }) {
  const swingweightDemand = normalizeMinMax(frame.swingweight || 318, 300, 335) * 35;
  const headDemand = (1 - normalizeMinMax(frame.headSizeSqIn || 100, 95, 105)) * 22;
  const stiffnessDemand = normalizeMinMax(frame.stiffnessRA || 64, 58, 72) * 16;
  const stringDemand = string.material === 'Polyester' ? 18 : string.material === 'Hybrid' ? 10 : 4;

  return Math.round(clamp(22 + swingweightDemand + headDemand + stiffnessDemand + stringDemand));
}

export function confidencePenaltyFromMissingData(records) {
  const confidences = records.map((record) => Number(record.dataConfidence || 0.6));
  const average = confidences.reduce((sum, value) => sum + value, 0) / (confidences.length || 1);
  return Math.round(clamp((1 - average) * 22, 0, 22));
}
