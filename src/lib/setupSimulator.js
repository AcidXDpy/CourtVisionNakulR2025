import { buildEquipmentFeatureRecord, calculateArmStressScore, calculateSkillDemandScore, clamp, normalizeMinMax } from './featureEngineering.js';

const STIFFNESS_BY_STRING_TYPE = {
  Polyester: 78,
  Hybrid: 58,
  Multifilament: 42,
  'Natural Gut': 34,
  'Synthetic Gut': 48,
};

const PLACEMENT_SWINGWEIGHT_MULTIPLIERS = {
  '12': 3.2,
  '3_and_9': 2,
  throat: 0.7,
  handle: 0.25,
};

function tensionMidpoint(value) {
  const numbers = String(value || '').match(/\d+/g)?.map(Number) || [];
  if (numbers.length >= 2) return (numbers[0] + numbers[1]) / 2;
  return numbers[0] || 52;
}

function stringFamilyStiffness(string) {
  return STIFFNESS_BY_STRING_TYPE[string.stringType] || 55;
}

export function estimateStringBedStiffness(string, tension = tensionMidpoint(string?.tensionRange), gaugeAdjustment = 0) {
  const typeStiffness = stringFamilyStiffness(string || {});
  const tensionEffect = (Number(tension) - 50) * 1.7;
  const gaugeEffect = Number(gaugeAdjustment) * 5;
  return Math.round(clamp(typeStiffness + tensionEffect + gaugeEffect, 20, 95));
}

export function estimateCustomization(racket, customization = {}) {
  const baseWeight = Number(String(racket?.weight || '').match(/\d+/)?.[0]) || 300;
  const baseSwingweight = Number(racket?.swingweight || 318);
  const addedWeightGrams = Number(customization.addedWeightGrams || 0);
  const placement = customization.weightPlacement || '3_and_9';
  const multiplier = PLACEMENT_SWINGWEIGHT_MULTIPLIERS[placement] ?? PLACEMENT_SWINGWEIGHT_MULTIPLIERS['3_and_9'];
  const gripWeightGrams = Number(customization.gripWeightGrams || 0);
  const swingweightDelta = Math.round(addedWeightGrams * multiplier - gripWeightGrams * 0.08);
  const staticWeight = Math.round(baseWeight + addedWeightGrams + gripWeightGrams);
  const balanceDeltaMm = Math.round(
    placement === '12' ? addedWeightGrams * 1.35
      : placement === '3_and_9' ? addedWeightGrams * 0.75
        : placement === 'handle' ? -gripWeightGrams * 0.65
          : addedWeightGrams * 0.25,
  );

  return {
    staticWeight,
    addedWeightGrams,
    gripWeightGrams,
    weightPlacement: placement,
    balanceDeltaMm,
    swingweight: Math.max(0, baseSwingweight + swingweightDelta),
    swingweightDelta,
    stabilityDelta: Math.round(addedWeightGrams * (placement === '3_and_9' ? 2.1 : placement === '12' ? 1.5 : 0.8)),
    maneuverabilityDelta: Math.round(-Math.max(0, swingweightDelta) * 0.55 + (placement === 'handle' ? gripWeightGrams * 0.18 : 0)),
    explanation: `Adds ${addedWeightGrams + gripWeightGrams}g total. ${placement === '12' ? '12 o clock raises swingweight and power most.' : placement === '3_and_9' ? '3 and 9 o clock mainly improves torsional stability.' : placement === 'handle' ? 'Handle weight preserves maneuverability while changing balance.' : 'Throat weight gives a smaller, more neutral change.'}`,
  };
}

export function deriveSetupAttributes(racket, string, options = {}) {
  const equipment = buildEquipmentFeatureRecord(racket, string);
  const tension = Number(options.tension || tensionMidpoint(string?.tensionRange));
  const customization = estimateCustomization(racket, options.customization);
  const stringBedStiffness = estimateStringBedStiffness(string, tension, Number(options.gaugeAdjustment || 0));
  const comfortPenaltyFromTension = normalizeMinMax(tension, 44, 60) * 12;
  const controlBoostFromTension = normalizeMinMax(tension, 42, 58) * 10;
  const swingweightBoost = normalizeMinMax(customization.swingweight, 300, 335);
  const stringType = string?.stringType || '';
  const isHybrid = stringType === 'Hybrid' || options.configurationType === 'hybrid';
  const armStressWarningScore = calculateArmStressScore({
    frame: equipment.frame,
    string: equipment.string,
    tensionMidpoint: tension,
    playerHasPain: Boolean(options.playerHasPain),
  });

  return {
    effectivePower: Math.round(clamp((Number(racket?.power || 5) * 6.1) + (Number(string?.power || 5) * 3.5) - controlBoostFromTension * 0.55 + swingweightBoost * 8)),
    effectiveControl: Math.round(clamp((Number(racket?.control || 5) * 5.8) + (Number(string?.control || 5) * 4.2) + controlBoostFromTension)),
    effectiveSpin: Math.round(clamp((Number(racket?.spin || 5) * 5.4) + (Number(string?.spin || 5) * 4.6) - Math.max(0, tension - 54) * 0.55)),
    effectiveComfort: Math.round(clamp((Number(racket?.comfort || 5) * 5.4) + (Number(string?.comfort || 5) * 4.4) + (isHybrid ? 6 : 0) - comfortPenaltyFromTension - normalizeMinMax(racket?.stiffness || 64, 62, 72) * 8)),
    effectiveStability: Math.round(clamp(48 + swingweightBoost * 35 + customization.stabilityDelta)),
    effectiveManeuverability: Math.round(clamp(92 - swingweightBoost * 35 + customization.maneuverabilityDelta)),
    estimatedLaunchProfile: tension < 48 ? 'higher launch' : tension > 55 ? 'lower launch' : 'neutral launch',
    estimatedStringBedStiffness: stringBedStiffness,
    estimatedTensionMaintenance: Math.round(clamp(Number(string?.durability || 5) * 8 + (stringType === 'Polyester' ? -8 : 8))),
    armStressWarningScore,
    skillDemandScore: calculateSkillDemandScore(equipment),
    configurationCost: Number(options.total || 0),
    dataConfidence: equipment.combinedDataConfidence,
    customization,
  };
}

export function compareAttributes(baseline, changed) {
  return Object.fromEntries(
    Object.keys(changed)
      .filter((key) => typeof changed[key] === 'number' && typeof baseline[key] === 'number')
      .map((key) => [key, Math.round(changed[key] - baseline[key])]),
  );
}

export function simulateSetupChange({ racket, string, baselineOptions = {}, changeOptions = {} }) {
  const baseline = deriveSetupAttributes(racket, string, baselineOptions);
  const changed = deriveSetupAttributes(racket, string, { ...baselineOptions, ...changeOptions });
  const deltas = compareAttributes(baseline, changed);

  return {
    baseline,
    changed,
    deltas,
    explanation: [
      changeOptions.tension && Number(changeOptions.tension) < Number(baselineOptions.tension || tensionMidpoint(string?.tensionRange))
        ? 'Lower tension should raise launch and comfort, but may reduce directional control.'
        : 'Higher tension should tighten launch and control, but can raise string-bed stiffness.',
      changeOptions.customization?.addedWeightGrams
        ? changed.customization.explanation
        : 'No added mass means frame stability and maneuverability stay close to baseline.',
      changed.armStressWarningScore > baseline.armStressWarningScore
        ? 'The change increases the comfort-risk estimate. Treat this as a caution, not a medical prediction.'
        : 'The change does not increase the comfort-risk estimate.',
    ],
    confidence: Math.round(clamp((baseline.dataConfidence + changed.dataConfidence) / 2 - Math.abs(deltas.armStressWarningScore || 0) * 0.05, 40, 95)),
  };
}
