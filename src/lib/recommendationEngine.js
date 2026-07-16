import { rackets } from '../data/rackets.js';
import { strings } from '../data/strings.js';
import { FEATURE_SCHEMA_VERSION, RECOMMENDATION_MODEL_VERSION } from './equipmentSchema.js';
import { buildEquipmentFeatureRecord, confidencePenaltyFromMissingData, featureSchema, weightedMean } from './featureEngineering.js';
import { deriveSetupAttributes } from './setupSimulator.js';

export { FEATURE_SCHEMA_VERSION, RECOMMENDATION_MODEL_VERSION };

export const STRINGING_LABOR_ESTIMATE = 25;
export const MODEL_ASSUMPTIONS = [
  'Scores are deterministic and rule-based until enough real outcome feedback exists.',
  'Manufacturer-style product traits are treated as noisy inputs, not objective truth.',
  'Comfort warnings are conservative gear-risk signals, not medical advice.',
  'A complete setup is evaluated as racket + string + tension + budget, not as an isolated racket.',
];
export const EXPERT_SOURCE_LABEL = 'expert-informed retail fitting logic';

const ARCHETYPE_KEYS = {
  HEAVY_TOPSPIN: 'heavyTopspinBaseliner',
  FLAT_POWER: 'flatPowerHitter',
  COUNTERPUNCHER: 'counterpuncher',
  ALL_COURT: 'allCourtPlayer',
  SERVE: 'serveFocusedPlayer',
  BEGINNER: 'beginnerRecreationalPlayer',
  ARM: 'armSensitivePlayer',
};

export const PLAYER_ARCHETYPES = [
  {
    id: ARCHETYPE_KEYS.HEAVY_TOPSPIN,
    name: 'Heavy topspin baseliner',
    vector: { spin: 94, power: 68, control: 64, serve: 48, net: 24, comfort: 54, aggression: 64, skill: 62 },
  },
  {
    id: ARCHETYPE_KEYS.FLAT_POWER,
    name: 'Flat power hitter',
    vector: { spin: 34, power: 88, control: 58, serve: 68, net: 34, comfort: 42, aggression: 82, skill: 68 },
  },
  {
    id: ARCHETYPE_KEYS.COUNTERPUNCHER,
    name: 'Counterpuncher',
    vector: { spin: 58, power: 42, control: 88, serve: 42, net: 34, comfort: 68, aggression: 34, skill: 60 },
  },
  {
    id: ARCHETYPE_KEYS.ALL_COURT,
    name: 'All-court player',
    vector: { spin: 60, power: 60, control: 72, serve: 60, net: 78, comfort: 58, aggression: 58, skill: 64 },
  },
  {
    id: ARCHETYPE_KEYS.SERVE,
    name: 'Serve-focused player',
    vector: { spin: 44, power: 82, control: 60, serve: 94, net: 58, comfort: 44, aggression: 78, skill: 66 },
  },
  {
    id: ARCHETYPE_KEYS.BEGINNER,
    name: 'Beginner/recreational player',
    vector: { spin: 42, power: 64, control: 60, serve: 36, net: 38, comfort: 74, aggression: 32, skill: 22 },
  },
  {
    id: ARCHETYPE_KEYS.ARM,
    name: 'Arm-sensitive player',
    vector: { spin: 48, power: 46, control: 72, serve: 42, net: 44, comfort: 96, aggression: 28, skill: 48 },
  },
];

export function priceNumber(price) {
  return Number(String(price).replace(/[^0-9.]/g, '')) || 0;
}

export function money(value) {
  return `$${Math.round(value)}`;
}

export function setupTotal(racket, string) {
  return priceNumber(racket.price) + priceNumber(string.price) + STRINGING_LABOR_ESTIMATE;
}

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function normalize(value, min, max) {
  return clamp01((value - min) / (max - min));
}

function closeness(demand, supply, tolerance = 100) {
  return clamp(100 - (Math.abs(demand - supply) / tolerance) * 100);
}

function trait(result, key, fallback = 50) {
  return Number(result?.traits?.[key] ?? fallback);
}

function grams(value) {
  return Number(String(value).match(/\d+/)?.[0]) || 300;
}

function parseSkill(value = 'Recreational') {
  const text = String(value).toLowerCase();
  if (text.includes('beginner')) return 18;
  if (text.includes('utr 7') || text.includes('4.5')) return 86;
  if (text.includes('utr 4') || text.includes('4.0')) return 70;
  if (text.includes('3.5')) return 56;
  if (text.includes('3.0') || text.includes('utr 1')) return 40;
  return 34;
}

function parseOptionalNumber(value) {
  const parsed = Number(String(value ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function zScore(value, mean, sd) {
  if (!Number.isFinite(value)) return 0;
  return clamp((value - mean) / sd, -3, 3);
}

function textIncludes(value, fragment) {
  return String(value || '').toLowerCase().includes(fragment);
}

function headSizeNumber(racket) {
  return Number(String(racket.headSize || '').match(/\d+/)?.[0]) || 100;
}

function patternDensity(racket) {
  const [mains, crosses] = String(racket.stringPattern || '16x19').match(/\d+/g)?.map(Number) || [16, 19];
  return mains >= 18 || crosses >= 20 ? 82 : mains <= 16 && crosses <= 18 ? 28 : 52;
}

function isFullPolyString(string) {
  return String(string.stringType || '').toLowerCase().includes('polyester') || String(string.stringType || '').toLowerCase() === 'poly';
}

function gaugeMm(string) {
  return Number(String(string.gauge || '').match(/\d\.\d{2}/)?.[0]) || 1.25;
}

function painSeverityLevel(playerOrResult = {}) {
  const profile = playerOrResult.profileInputs || playerOrResult.profile || {};
  const text = `${playerOrResult.armIssue || ''} ${playerOrResult.painArea || ''} ${profile.painArea || ''} ${profile.painSeverity || ''}`.toLowerCase();
  if (text.includes('active') || text.includes('changes my swing') || text.includes('significant')) return 3;
  if (text.includes('recurring') || text.includes('during')) return 2;
  if (text.includes('mild') || text.includes('soreness') || text.includes('elbow') || text.includes('shoulder') || text.includes('wrist') || text.includes('multiple')) return 1;
  return 0;
}

function controlMeaningFlags(value) {
  const text = String(value || '').toLowerCase();
  return {
    lowerLaunch: text.includes('lower launch') || text.includes('less free power'),
    stability: text.includes('stability'),
    feel: text.includes('feel'),
    predictableDepth: text.includes('predictable') || text.includes('depth'),
    unknown: text.includes('not sure'),
  };
}

function buildFitterSignals(profile = {}, traits = {}) {
  const launchPreference = profile.launchPreference || 'Neutral shape';
  const missPattern = profile.missPattern || 'Not sure yet';
  const paceGeneration = profile.paceGeneration || 'Neutral';
  const strokeLength = profile.strokeLength || 'Moderate';
  const swingweightTolerance = profile.swingweightTolerance || 'Balanced';
  const fatigueBreakdown = profile.fatigueBreakdown || 'No major issue';
  const stringBreakFrequency = profile.stringBreakFrequency || 'Rarely break strings';
  const controlFlags = controlMeaningFlags(profile.controlMeaning);
  const unknownCount = [
    launchPreference,
    missPattern,
    swingweightTolerance,
    fatigueBreakdown,
    stringBreakFrequency,
    profile.controlMeaning,
    profile.spinMeaning,
  ].filter((value) => String(value || '').toLowerCase().includes('not sure')).length;

  const wantsHighLaunch = launchPreference === 'Higher heavy ball' || profile.spinMeaning === 'Higher net clearance' || profile.spinMeaning === 'Heavier bounce';
  const wantsLowLaunch = launchPreference === 'Lower penetrating ball' || missPattern === 'Long' || controlFlags.lowerLaunch;
  const needsDepth = paceGeneration === 'I need help creating depth' || missPattern === 'Short' || missPattern === 'Into the net' || profile.powerMeaning === 'Free depth' || profile.powerMeaning === 'Easier defense';
  const createsPace = paceGeneration === 'I create my own pace';
  const needsManeuverability = swingweightTolerance === 'Need easy maneuverability' || fatigueBreakdown === 'Swing slows down' || fatigueBreakdown === 'Timing gets late' || strokeLength === 'Compact';
  const needsStability = swingweightTolerance === 'Want stability/plow-through' || fatigueBreakdown === 'Racket feels unstable' || controlFlags.stability;
  const frequentBreaker = stringBreakFrequency === 'Every 3-6 hours' || stringBreakFrequency === 'Every 6-10 hours';
  const chronicBreaker = stringBreakFrequency === 'Every 3-6 hours';

  return {
    launchPreference,
    missPattern,
    paceGeneration,
    strokeLength,
    swingweightTolerance,
    fatigueBreakdown,
    stringBreakFrequency,
    controlFlags,
    wantsHighLaunch,
    wantsLowLaunch,
    needsDepth,
    createsPace,
    needsManeuverability,
    needsStability,
    frequentBreaker,
    chronicBreaker,
    unknownCount,
    launchDemand: wantsHighLaunch ? 84 : wantsLowLaunch ? 32 : 58,
    forgivenessDemand: clamp((needsDepth ? 76 : 48) + (needsManeuverability ? 8 : 0) + (profile.demoReadiness === 'Give me one strong answer' ? 4 : 0)),
    stabilityDemand: clamp((needsStability ? 84 : 54) + (traits.controlIntent || 50) * 0.15),
    maneuverabilityDemand: needsManeuverability ? 84 : swingweightTolerance === 'Want stability/plow-through' ? 36 : 58,
    durabilityDemand: chronicBreaker ? 96 : frequentBreaker ? 82 : stringBreakFrequency === 'Every 10-20 hours' ? 64 : traits.durabilityNeed || 48,
  };
}

function styleToVectorBoost(style) {
  const text = String(style || '').toLowerCase();
  if (text.includes('heavy topspin')) return { spin: 18, aggression: 6 };
  if (text.includes('flat power')) return { power: 18, spin: -10, aggression: 10 };
  if (text.includes('counter')) return { control: 18, aggression: -8 };
  if (text.includes('serve')) return { serve: 22, power: 8 };
  if (text.includes('beginner')) return { comfort: 14, skill: -14, aggression: -12 };
  if (text.includes('arm')) return { comfort: 24, aggression: -10 };
  return { net: 8, control: 8 };
}

function vectorWithBoost(base, boost) {
  return Object.fromEntries(Object.entries(base).map(([key, value]) => [key, clamp(value + (boost[key] || 0))]));
}

function cosineSimilarity(a, b) {
  const keys = Object.keys(a);
  const dot = keys.reduce((sum, key) => sum + a[key] * (b[key] ?? 0), 0);
  const magA = Math.sqrt(keys.reduce((sum, key) => sum + a[key] ** 2, 0));
  const magB = Math.sqrt(keys.reduce((sum, key) => sum + (b[key] ?? 0) ** 2, 0));
  return magA && magB ? dot / (magA * magB) : 0;
}

function budgetTier(maxSetupPrice) {
  if (maxSetupPrice < 260) return 'Value';
  if (maxSetupPrice > 380) return 'Premium';
  return 'Balanced';
}

export function buildPlayerProfile(result = {}) {
  const profile = result.profileInputs || {};
  const profileTraits = result.traits || {};
  const age = parseOptionalNumber(profile.age);
  const weight = parseOptionalNumber(profile.weight);
  const skill = parseSkill(profile.skillLevel);
  const spin = Number(profile.topspinLevel || 0) ? Number(profile.topspinLevel) * 10 : trait(result, 'spinIntent', 58);
  const serve = Number(profile.serveImportance || 0) ? Number(profile.serveImportance) * 10 : trait(result, 'serveReliance', 50);
  const painLevel = painSeverityLevel({ ...result, profileInputs: profile });
  const comfortBase = Math.max((result.comfortPriority || 0) * 48, trait(result, 'comfortNeed', 44), painLevel > 0 ? 92 : 0);
  const maxSetupPrice = Number(result.maxSetupPrice || profile.budgetAmount || 330);
  const swingSpeedMap = { Slow: 34, Medium: 58, Fast: 84 };
  const courtMap = { Baseline: 34, 'All-court': 62, 'Net/transition': 86 };
  const preference = profile.powerControlPreference || 'Balanced';
  const power = preference === 'More power' ? Math.max(72, trait(result, 'powerIntent', 54)) : preference === 'More control' ? Math.min(56, trait(result, 'powerIntent', 54)) : trait(result, 'powerIntent', 54);
  const control = preference === 'More control' ? Math.max(76, trait(result, 'controlIntent', 62)) : preference === 'More power' ? Math.min(58, trait(result, 'controlIntent', 62)) : trait(result, 'controlIntent', 62);
  const baseVector = {
    spin: clamp(spin),
    power: clamp(power),
    control: clamp(control),
    serve: clamp(serve),
    net: courtMap[profile.courtPositionPreference] ?? trait(result, 'netIntent', 46),
    comfort: clamp(comfortBase),
    aggression: clamp(trait(result, 'riskIntent', 50) * 0.5 + power * 0.3 + serve * 0.2),
    skill: clamp(skill),
  };
  const fitterSignals = buildFitterSignals(profile, profileTraits);
  const playerVector = vectorWithBoost(baseVector, styleToVectorBoost(profile.playingStyle));
  const archetypeMatches = PLAYER_ARCHETYPES
    .map((archetype) => ({
      ...archetype,
      similarity: Math.round(cosineSimilarity(playerVector, archetype.vector) * 100),
    }))
    .sort((a, b) => b.similarity - a.similarity);

  return {
    profileInputs: profile,
    vector: playerVector,
    skillScore: skill,
    ageZScore: zScore(age, 30, 14),
    weightZScore: zScore(weight, 170, 35),
    swingSpeedScore: swingSpeedMap[profile.swingSpeed] ?? 58,
    budgetCeiling: maxSetupPrice,
    budgetTier: result.budgetTier || budgetTier(maxSetupPrice),
    painArea: profile.painArea || result.armIssue || 'None',
    painSeverity: painLevel,
    hasPain: painLevel > 0 || (result.comfortPriority || 0) > 0,
    dislikes: String(profile.setupDislikes || '').toLowerCase(),
    fitterSignals,
    primaryPlaystyle: result.primary || 'All-Court Player',
    secondaryPlaystyle: result.secondary || 'Counterpuncher',
    archetypeMatches,
    primaryArchetype: archetypeMatches[0],
  };
}

export function buildRacketVector(racket) {
  const headSize = headSizeNumber(racket);
  const density = patternDensity(racket);
  const openPatternBoost = density < 45 ? 10 : density > 70 ? -10 : 0;
  const launchSupply = clamp(racket.spin * 9 + openPatternBoost + (headSize >= 100 ? 5 : -4) + (racket.power - 6) * 2);
  const forgivenessSupply = clamp((headSize - 95) * 7 + racket.comfort * 7 + (racket.swingweight < 324 ? 8 : 0));
  const stabilitySupply = clamp(42 + normalize(racket.swingweight, 300, 335) * 42 + normalize(grams(racket.weight), 280, 330) * 22 + racket.control * 2);
  const maneuverabilitySupply = clamp(104 - normalize(racket.swingweight, 300, 335) * 48 - normalize(grams(racket.weight), 280, 330) * 34);

  return {
    price: priceNumber(racket.price),
    power: racket.power * 10,
    control: racket.control * 10,
    spin: racket.spin * 10,
    comfort: racket.comfort * 10,
    headSize,
    patternDensity: density,
    launchSupply,
    forgivenessSupply,
    stabilitySupply,
    maneuverabilitySupply,
    weight: grams(racket.weight),
    stiffness: racket.stiffness,
    swingweight: racket.swingweight,
    weightZScore: zScore(grams(racket.weight), 300, 15),
    stiffnessZScore: zScore(racket.stiffness, 65, 4),
    swingweightZScore: zScore(racket.swingweight, 320, 8),
    skillFloor: racket.difficulty === 'High' ? 76 : racket.difficulty === 'Medium-High' ? 62 : racket.difficulty === 'Medium' ? 44 : 24,
  };
}

export function buildStringVector(string) {
  const gauge = gaugeMm(string);
  const isPoly = isFullPolyString(string);
  const gaugeDurabilityBoost = gauge >= 1.3 ? 12 : gauge <= 1.2 ? -8 : 0;

  return {
    price: priceNumber(string.price),
    power: string.power * 10,
    control: string.control * 10,
    spin: string.spin * 10,
    comfort: string.comfort * 10,
    durability: clamp(string.durability * 10 + gaugeDurabilityBoost),
    gauge,
    armSafety: isArmSafeString(string) ? 95 : string.comfort >= 7 ? 72 : 38,
    isPoly,
  };
}

export function isComfortString(string) {
  return ['Hybrid', 'Multifilament', 'Natural Gut', 'Synthetic Gut'].includes(string.stringType) || string.comfort >= 8;
}

export function isArmSafeRacket(racket, playerOrResult = {}) {
  const player = playerOrResult.vector ? playerOrResult : buildPlayerProfile(playerOrResult);
  if (!player.hasPain) return racket.comfort >= 7 && racket.stiffness <= 67;
  return racket.comfort >= 8 && racket.stiffness <= 64 && racket.swingweight <= 326;
}

export function isArmSafeString(string) {
  return ['Hybrid', 'Multifilament', 'Natural Gut', 'Synthetic Gut'].includes(string.stringType) && string.comfort >= 7;
}

function budgetScore(total, budgetCeiling) {
  if (total <= budgetCeiling) return 100;
  return Math.round(clamp(100 - ((total - budgetCeiling) / 140) * 100));
}

function racketPenalty(racket, player, vector) {
  const penalties = [];
  const isBeginner = player.skillScore < 42;
  const fitter = player.fitterSignals;

  if (player.hasPain && !isArmSafeRacket(racket, player)) penalties.push({ label: 'Arm health risk from stiffness or swingweight', value: 20 });
  if (isBeginner && vector.skillFloor > 50) penalties.push({ label: 'May be too advanced for a newer player', value: 14 });
  if (player.swingSpeedScore < 45 && (vector.weight > 305 || vector.swingweight > 323)) penalties.push({ label: 'Slow swing speed may fight the frame weight', value: 12 });
  if (player.swingSpeedScore > 76 && vector.swingweight < 310) penalties.push({ label: 'Fast swing may want more stability than this frame gives', value: 8 });
  if (player.budgetCeiling < 285 && priceNumber(racket.price) > 260) penalties.push({ label: 'Frame price pressures a value budget', value: 10 });
  if (player.dislikes.includes('stiff') && racket.stiffness >= 66) penalties.push({ label: 'You flagged stiffness, and this frame is firm', value: 8 });
  if (player.dislikes.includes('control') && racket.control <= 7) penalties.push({ label: 'You flagged control, and this frame leans livelier', value: 7 });
  if (fitter.wantsLowLaunch && vector.launchSupply >= 72) penalties.push({ label: 'High-launch frame may fight your lower-trajectory control need', value: 14 });
  if (fitter.wantsHighLaunch && vector.launchSupply <= 48) penalties.push({ label: 'Lower-launch frame may make heavy net clearance harder', value: 10 });
  if (fitter.needsDepth && vector.power < 62 && vector.forgivenessSupply < 62) penalties.push({ label: 'Low-powered frame may not solve your depth problem', value: 10 });
  if (fitter.needsManeuverability && vector.maneuverabilitySupply < 50) penalties.push({ label: 'Swingweight may be too demanding when tired or rushed', value: 12 });
  if (fitter.needsStability && vector.stabilitySupply < 62) penalties.push({ label: 'May not give enough stability against pace', value: 9 });

  return penalties;
}

function stringPenalty(string, player, vector) {
  const penalties = [];
  const isBeginner = player.skillScore < 42;
  const fitter = player.fitterSignals;

  if (player.hasPain && !isArmSafeString(string)) penalties.push({ label: 'Not the safest string family for current arm pain', value: 22 });
  if (player.painSeverity >= 2 && vector.isPoly) penalties.push({ label: 'Recurring or active pain should start away from full polyester', value: 24 });
  if (player.painSeverity === 1 && vector.isPoly && string.stiffness !== 'Med') penalties.push({ label: 'Mild soreness makes stiff polyester a poor first experiment', value: 10 });
  if (isBeginner && vector.isPoly) penalties.push({ label: 'Full polyester can be unforgiving for newer players', value: 14 });
  if (player.budgetCeiling < 285 && vector.price > 26) penalties.push({ label: 'String price is high for the selected budget', value: 7 });
  if ((player.dislikes.includes('break') || fitter.frequentBreaker) && vector.durability <= 68) penalties.push({ label: 'Durability may not solve your breakage issue', value: 13 });
  if (fitter.chronicBreaker && !vector.isPoly && string.stringType !== 'Hybrid') penalties.push({ label: 'Frequent breakers usually need a durable poly or hybrid conversation', value: 16 });
  if (player.dislikes.includes('power') && string.power <= 5) penalties.push({ label: 'This string is low powered for your complaint', value: 6 });

  return penalties;
}

function warningLabels(penalties) {
  return penalties.map((penalty) => penalty.label).slice(0, 3);
}

function explainRacket(racket, player, components, warnings) {
  const reasons = [];
  const fitter = player.fitterSignals;
  if (racket.recommendedPlaystyles.includes(player.primaryPlaystyle)) reasons.push(`Matches your ${player.primaryPlaystyle.toLowerCase()} playstyle signal.`);
  if (components.launchFit >= 82 && fitter.wantsHighLaunch) reasons.push('Supports the higher, heavier launch window you described.');
  if (components.launchFit >= 82 && fitter.wantsLowLaunch) reasons.push('Keeps launch more controlled for your miss pattern and trajectory goal.');
  if (components.forgivenessFit >= 82 && fitter.needsDepth) reasons.push('Adds forgiveness and usable depth without making the choice extreme.');
  if (components.stabilityFit >= 82 && fitter.needsStability) reasons.push('Gives extra stability for pace, returns, or off-center contact.');
  if (components.maneuverabilityFit >= 82 && fitter.needsManeuverability) reasons.push('Keeps swingweight manageable when timing or fatigue matters.');
  if (components.archetypeFit >= 82) reasons.push(`Specs line up with the ${player.primaryArchetype.name.toLowerCase()} archetype.`);
  if (components.traitFit >= 82) reasons.push('Power, spin, control, and comfort scores are close to your player vector.');
  if (components.swingFit >= 82) reasons.push('Weight and swingweight fit your reported swing speed.');
  if (components.budgetFit >= 92) reasons.push('Leaves room in the setup budget for a smart string choice.');
  if (!warnings.length && player.hasPain) reasons.push('Passes the stricter arm-safety filter.');
  return reasons.slice(0, 4);
}

function explainString(string, player, components, warnings) {
  const reasons = [];
  const fitter = player.fitterSignals;
  if (string.recommendedPlaystyles.includes(player.primaryPlaystyle)) reasons.push(`Supports your ${player.primaryPlaystyle.toLowerCase()} string needs.`);
  if (components.traitFit >= 82) reasons.push('String power, spin, control, and comfort closely match the quiz profile.');
  if (components.armSafety >= 84 && player.hasPain) reasons.push('Prioritizes comfort for the pain/injury signal.');
  if (components.durabilityFit >= 82 && fitter.frequentBreaker) reasons.push('Prioritizes durability because you break strings often.');
  if (components.budgetFit >= 92) reasons.push('Fits the budget without consuming the whole setup.');
  if (!warnings.length && string.comfort >= 7) reasons.push('Comfort score is strong enough to keep as a safer default.');
  return reasons.slice(0, 4);
}

function confidenceFrom(components, warningCount, archetypeSimilarity) {
  const average = Object.values(components).reduce((sum, value) => sum + value, 0) / Object.keys(components).length;
  return Math.round(clamp(44 + average * 0.34 + archetypeSimilarity * 0.22 - warningCount * 5, 35, 96));
}

export function scoreRacket(racket, result = {}) {
  const player = buildPlayerProfile(result);
  const vector = buildRacketVector(racket);
  const fitter = player.fitterSignals;
  const traitFit = Math.round(
    closeness(player.vector.power, vector.power) * 0.22
      + closeness(player.vector.control, vector.control) * 0.22
      + closeness(player.vector.spin, vector.spin) * 0.22
      + closeness(player.vector.comfort, vector.comfort) * 0.22
      + closeness(player.vector.serve, vector.power) * 0.12,
  );
  const playstyleFit = Math.min(100, 42 + (racket.recommendedPlaystyles.includes(player.primaryPlaystyle) ? 34 : 0) + (racket.recommendedPlaystyles.includes(player.secondaryPlaystyle) ? 16 : 0));
  const swingSupply = Math.round(100 - (normalize(vector.swingweight, 300, 335) * 60 + normalize(vector.weight, 280, 330) * 40));
  const swingFit = Math.round(closeness(player.swingSpeedScore, swingSupply, 90));
  const launchFit = Math.round(closeness(fitter.launchDemand, vector.launchSupply, 88));
  const forgivenessFit = Math.round(closeness(fitter.forgivenessDemand, vector.forgivenessSupply, 92));
  const stabilityFit = Math.round(closeness(fitter.stabilityDemand, vector.stabilitySupply, 90));
  const maneuverabilityFit = Math.round(closeness(fitter.maneuverabilityDemand, vector.maneuverabilitySupply, 90));
  const safetyFit = player.hasPain ? (isArmSafeRacket(racket, player) ? 94 : 52) : Math.round(clamp(100 - Math.max(0, vector.stiffness - 67) * 6));
  const budgetFit = budgetScore(priceNumber(racket.price) + 75, player.budgetCeiling);
  const archetypeFit = Math.round(cosineSimilarity(
    { spin: vector.spin, power: vector.power, control: vector.control, serve: vector.power, net: swingSupply, comfort: vector.comfort, aggression: vector.power, skill: vector.skillFloor },
    player.primaryArchetype.vector,
  ) * 100);
  const penalties = racketPenalty(racket, player, vector);
  const penaltyTotal = penalties.reduce((sum, penalty) => sum + penalty.value, 0);
  const weights = player.hasPain
    ? { traitFit: 0.16, playstyleFit: 0.08, swingFit: 0.1, launchFit: 0.08, forgivenessFit: 0.1, stabilityFit: 0.04, maneuverabilityFit: 0.04, safetyFit: 0.22, budgetFit: 0.08, archetypeFit: 0.1 }
    : { traitFit: 0.18, playstyleFit: 0.14, swingFit: 0.1, launchFit: 0.14, forgivenessFit: 0.08, stabilityFit: 0.06, maneuverabilityFit: 0.06, safetyFit: 0.08, budgetFit: 0.08, archetypeFit: 0.08 };
  const components = { traitFit, playstyleFit, swingFit, launchFit, forgivenessFit, stabilityFit, maneuverabilityFit, safetyFit, budgetFit, archetypeFit };
  const finalScore = Math.round(clamp(Object.entries(weights).reduce((sum, [key, weight]) => sum + components[key] * weight, 0) - penaltyTotal));
  const warnings = warningLabels(penalties);

  return {
    ...racket,
    finalScore,
    confidenceScore: confidenceFrom(components, warnings.length, player.primaryArchetype.similarity),
    components,
    penalties,
    warnings,
    explanation: explainRacket(racket, player, components, warnings),
    player,
  };
}

export function scoreString(string, result = {}) {
  const player = buildPlayerProfile(result);
  const vector = buildStringVector(string);
  const fitter = player.fitterSignals;
  const traitFit = Math.round(
    closeness(player.vector.power, vector.power) * 0.18
      + closeness(player.vector.control, vector.control) * 0.22
      + closeness(player.vector.spin, vector.spin) * 0.22
      + closeness(player.vector.comfort, vector.comfort) * 0.25
      + closeness(fitter.durabilityDemand, vector.durability) * 0.13,
  );
  const playstyleFit = Math.min(100, 44 + (string.recommendedPlaystyles.includes(player.primaryPlaystyle) ? 32 : 0) + (string.recommendedPlaystyles.includes(player.secondaryPlaystyle) ? 16 : 0));
  const armSafety = player.hasPain ? vector.armSafety : Math.max(68, vector.armSafety - 8);
  const budgetFit = budgetScore(vector.price + 270 + STRINGING_LABOR_ESTIMATE, player.budgetCeiling);
  const durabilityFit = Math.round(closeness(fitter.durabilityDemand, vector.durability));
  const archetypeFit = Math.round(cosineSimilarity(
    { spin: vector.spin, power: vector.power, control: vector.control, serve: vector.power, net: 45, comfort: vector.comfort, aggression: vector.spin, skill: vector.isPoly ? 70 : 35 },
    player.primaryArchetype.vector,
  ) * 100);
  const penalties = stringPenalty(string, player, vector);
  const penaltyTotal = penalties.reduce((sum, penalty) => sum + penalty.value, 0);
  const weights = player.hasPain
    ? { traitFit: 0.2, playstyleFit: 0.1, armSafety: 0.3, budgetFit: 0.08, durabilityFit: 0.14, archetypeFit: 0.18 }
    : fitter.frequentBreaker
      ? { traitFit: 0.24, playstyleFit: 0.14, armSafety: 0.1, budgetFit: 0.08, durabilityFit: 0.26, archetypeFit: 0.18 }
      : { traitFit: 0.32, playstyleFit: 0.18, armSafety: 0.12, budgetFit: 0.1, durabilityFit: 0.12, archetypeFit: 0.16 };
  const components = { traitFit, playstyleFit, armSafety, budgetFit, durabilityFit, archetypeFit };
  const finalScore = Math.round(clamp(Object.entries(weights).reduce((sum, [key, weight]) => sum + components[key] * weight, 0) - penaltyTotal));
  const warnings = warningLabels(penalties);

  return {
    ...string,
    finalScore,
    confidenceScore: confidenceFrom(components, warnings.length, player.primaryArchetype.similarity),
    components,
    penalties,
    warnings,
    explanation: explainString(string, player, components, warnings),
    suggestedTensionRange: suggestTensionRange(string, result),
    player,
  };
}

export function buildTensionPlan(string, result = {}, racket = null, confidenceScore = 70) {
  const player = buildPlayerProfile(result);
  const fitter = player.fitterSignals;
  const isHybrid = String(string.stringType || '').toLowerCase().includes('hybrid');
  const isPoly = isFullPolyString(string);
  const isMultiFamily = ['Multifilament', 'Natural Gut', 'Synthetic Gut'].includes(string.stringType);
  let low = isPoly ? 45 : isHybrid ? 46 : isMultiFamily ? 50 : 48;
  let high = isPoly ? 52 : isHybrid ? 54 : isMultiFamily ? 57 : 55;
  let target = isPoly ? 48 : isHybrid ? 50 : isMultiFamily ? 53 : 51;

  if (fitter.wantsHighLaunch || fitter.needsDepth) target -= 2;
  if (fitter.wantsLowLaunch || fitter.controlFlags.lowerLaunch || fitter.missPattern === 'Long') target += 2;
  if (player.painSeverity > 0) target -= player.painSeverity >= 2 ? 3 : 1;
  if (racket?.power >= 8 || racket?.stiffness >= 68) target += 1;
  if (racket && headSizeNumber(racket) < 99 && racket.power <= 7) target -= 1;
  if (player.skillScore < 38 && !isPoly) target -= 1;

  target = Math.round(clamp(target, low, high));
  const clearInputs = fitter.unknownCount <= 1 || Boolean(player.profileInputs.currentRacket || player.profileInputs.currentString);
  const width = confidenceScore >= 85 && clearInputs ? 4 : 6;
  low = Math.round(clamp(target - Math.floor(width / 2), low, high));
  high = Math.round(clamp(low + width, low, high));
  if (high - low > width) high = low + width;

  const adjustmentRules = [
    'Move up 2 lb if launch is too high or balls fly long.',
    'Move down 2 lb if depth, comfort, or pocketing feels lacking.',
  ];

  if (isHybrid) {
    const polyStart = Math.round(clamp(target - 2, 45, 50));
    const crossStart = Math.round(clamp(target + 2, 50, 56));
    return {
      startingPoint: `Poly side ${polyStart} lb / comfort side ${crossStart} lb`,
      range: `Poly ${Math.max(45, polyStart - 2)}-${Math.min(50, polyStart + 2)} lb / comfort side ${Math.max(50, crossStart - 2)}-${Math.min(56, crossStart + 2)} lb`,
      low: Math.max(45, polyStart - 2),
      high: Math.min(56, crossStart + 2),
      adjustmentRules,
      rationale: 'Hybrid tensions separate the lower-powered poly side from the more elastic comfort side.',
    };
  }

  return {
    startingPoint: `${target} lb`,
    range: `${Math.min(low, high)}-${Math.max(low, high)} lb`,
    low: Math.min(low, high),
    high: Math.max(low, high),
    adjustmentRules,
    rationale: isPoly
      ? 'Full polyester usually works best in a lower, practical range because it is low-powered and firm.'
      : 'Elastic strings usually need a higher reference range for directional control.',
  };
}

export function suggestTensionRange(string, result = {}) {
  return `${buildTensionPlan(string, result).range}s`;
}

function tensionMidpoint(value) {
  const numbers = String(value || '').match(/\d+/g)?.map(Number) || [];
  if (numbers.length >= 2) return Math.round((numbers[0] + numbers[1]) / 2);
  return numbers[0] || 52;
}

export function evaluateSetupConstraints(racket, string, result = {}) {
  const player = buildPlayerProfile(result);
  const total = setupTotal(racket, string);
  const isFullPoly = String(string.stringType || '').toLowerCase().includes('poly');
  const hardFailures = [];
  const softWarnings = [];

  if (total > player.budgetCeiling * 1.18) {
    hardFailures.push(`Setup exceeds budget ceiling by more than 18% (${money(total)} vs ${money(player.budgetCeiling)}).`);
  } else if (total > player.budgetCeiling) {
    softWarnings.push(`Setup is slightly over budget (${money(total)} vs ${money(player.budgetCeiling)}).`);
  }

  if (player.hasPain && racket.stiffness >= 68 && isFullPoly) {
    hardFailures.push('Active pain plus a stiff frame/full-poly pairing is excluded by the comfort safeguard.');
  }

  if (player.painSeverity >= 2 && isFullPoly) {
    hardFailures.push('Recurring or active arm pain blocks full polyester as a starting point.');
  }

  if (player.skillScore < 38 && racket.difficulty === 'High') {
    hardFailures.push('High-demand frame excluded for a beginner/recreational skill signal.');
  }

  if (player.hasPain && isFullPoly) {
    softWarnings.push('Full polyester may be too harsh while arm pain is active.');
  }

  return {
    eligible: hardFailures.length === 0,
    hardFailures,
    softWarnings,
  };
}

function setupComponents(scoredRacket, scoredString, result, predictedAttributes = null) {
  const total = setupTotal(scoredRacket, scoredString);
  const player = buildPlayerProfile(result);
  const fitter = player.fitterSignals;
  const attrs = predictedAttributes || deriveSetupAttributes(scoredRacket, scoredString, {
    tension: tensionMidpoint(suggestTensionRange(scoredString, result)),
    playerHasPain: player.hasPain,
    total,
  });
  const setupPower = attrs.effectivePower;
  const setupSpin = attrs.effectiveSpin;
  const setupControl = attrs.effectiveControl;
  const setupComfort = attrs.effectiveComfort;

  return {
    playstyleFit: Math.round((scoredRacket.components.playstyleFit * 0.55) + (scoredString.components.playstyleFit * 0.45)),
    traitFit: Math.round(closeness(player.vector.spin, setupSpin) * 0.18 + closeness(player.vector.power, setupPower) * 0.18 + closeness(player.vector.control, setupControl) * 0.2 + closeness(player.vector.comfort, setupComfort) * 0.22 + closeness(fitter.launchDemand, scoredRacket.components.launchFit) * 0.1 + closeness(fitter.durabilityDemand, scoredString.durability * 10) * 0.12),
    performanceFit: Math.round((setupPower + setupSpin + setupControl + attrs.effectiveStability) / 4),
    comfortFit: Math.round(setupComfort),
    budgetFit: budgetScore(total, player.budgetCeiling),
    safetyFit: player.hasPain ? Math.round(clamp(100 - attrs.armStressWarningScore)) : Math.round(clamp(94 - attrs.armStressWarningScore * 0.35)),
    skillFit: Math.round(closeness(player.skillScore, attrs.skillDemandScore, 82)),
    dataQuality: attrs.dataConfidence,
  };
}

export function scoreSetup(racket, string, result = {}) {
  const scoredRacket = racket.finalScore !== undefined ? racket : scoreRacket(racket, result);
  const scoredString = string.finalScore !== undefined ? string : scoreString(string, result);
  const player = buildPlayerProfile(result);
  const total = setupTotal(racket, string);
  const tensionPlan = buildTensionPlan(string, result, racket, Math.min(scoredRacket.confidenceScore, scoredString.confidenceScore));
  const tensionRange = tensionPlan.range;
  const predictedAttributes = deriveSetupAttributes(racket, string, {
    tension: tensionMidpoint(tensionRange),
    playerHasPain: player.hasPain,
    total,
    configurationType: scoredString.stringType === 'Hybrid' ? 'hybrid' : 'full-bed',
  });
  const components = setupComponents(scoredRacket, scoredString, result, predictedAttributes);
  const constraints = evaluateSetupConstraints(scoredRacket, scoredString, result);
  const equipmentFeatures = buildEquipmentFeatureRecord(racket, string);
  const weights = player.hasPain
    ? { playstyleFit: 0.12, traitFit: 0.2, performanceFit: 0.11, comfortFit: 0.17, budgetFit: 0.1, safetyFit: 0.22, skillFit: 0.05, dataQuality: 0.03 }
    : { playstyleFit: 0.18, traitFit: 0.24, performanceFit: 0.18, comfortFit: 0.1, budgetFit: 0.1, safetyFit: 0.09, skillFit: 0.07, dataQuality: 0.04 };
  const warnings = [...new Set([...(scoredRacket.warnings || []), ...(scoredString.warnings || []), ...constraints.softWarnings, ...constraints.hardFailures])].slice(0, 5);
  const hardConstraintPenalty = constraints.hardFailures.length * 22;
  const finalScore = Math.round(clamp(weightedMean(components, weights) - warnings.length * 1.5 - hardConstraintPenalty));
  const confidenceScore = Math.round(clamp(confidenceFrom(components, warnings.length, player.primaryArchetype.similarity) - confidencePenaltyFromMissingData([equipmentFeatures.frame, equipmentFeatures.string])));

  return {
    modelVersion: RECOMMENDATION_MODEL_VERSION,
    featureSchemaVersion: FEATURE_SCHEMA_VERSION,
    finalScore,
    confidenceScore,
    components,
    weights,
    total,
    inBudget: total <= player.budgetCeiling,
    warnings,
    constraints,
    predictedAttributes,
    tensionRange,
    tensionPlan,
    configuration: {
      racket: racket.name,
      string: string.name,
      stringConfiguration: scoredString.stringType === 'Hybrid' ? 'hybrid' : 'full bed',
      mainString: scoredString.stringType === 'Hybrid' ? string.name.split('/')[0]?.trim() || string.name : string.name,
      crossString: scoredString.stringType === 'Hybrid' ? string.name.split('/')[1]?.trim() || 'comfort cross' : string.name,
      suggestedTensionRange: tensionRange,
      suggestedTensionStart: tensionPlan.startingPoint,
      estimatedTotal: total,
    },
    dataQuality: equipmentFeatures.combinedDataConfidence,
    contributionBreakdown: Object.entries(components)
      .map(([name, value]) => ({ name, value, weightedContribution: Math.round(value * (weights[name] || 0)) }))
      .sort((a, b) => b.weightedContribution - a.weightedContribution),
    explanation: [
      ...scoredRacket.explanation.slice(0, 2),
      ...scoredString.explanation.slice(0, 2),
      `Predicted arm-stress warning score: ${predictedAttributes.armStressWarningScore}/100 (${player.hasPain ? 'comfort-protected weighting' : 'standard weighting'}).`,
      `Closest data profile: ${player.primaryArchetype.name} (${player.primaryArchetype.similarity}% similarity).`,
    ].slice(0, 5),
  };
}

export function buildSetupUniverse(result = {}, limits = {}) {
  const racketLimit = limits.racketLimit || 14;
  const stringLimit = limits.stringLimit || 18;
  const scoredRackets = rackets.map((racket) => scoreRacket(racket, result)).sort((a, b) => b.finalScore - a.finalScore);
  const scoredStrings = strings.map((string) => scoreString(string, result)).sort((a, b) => b.finalScore - a.finalScore);

  return scoredRackets.slice(0, racketLimit).flatMap((racket) => scoredStrings.slice(0, stringLimit).map((string) => ({
    racket,
    string,
    ...scoreSetup(racket, string, result),
  })))
    .filter((setup) => setup.constraints.eligible || limits.includeIneligible)
    .sort((a, b) => b.finalScore - a.finalScore);
}

function uniqueTopSetups(scoredRackets, scoredStrings, result) {
  const candidates = buildSetupUniverse(result, { racketLimit: 10, stringLimit: 12 });
  const usedRackets = new Set();
  const usedStrings = new Set();

  return candidates.filter((setup) => {
    if (usedRackets.has(setup.racket.name) || usedStrings.has(setup.string.name)) return false;
    usedRackets.add(setup.racket.name);
    usedStrings.add(setup.string.name);
    return true;
  }).slice(0, 3).map((setup, index) => ({
    ...setup,
    label: index === 0 ? 'Best statistical fit' : index === 1 ? 'Alternative fit' : 'Risk-adjusted fit',
    intent: index === 0
      ? 'Highest weighted setup score from the player vector, archetype similarity, budget, and arm-safety constraints.'
      : index === 1
        ? 'A strong second option that changes the feel profile without abandoning the model fit.'
        : 'Keeps useful performance while protecting against the main mismatch risks.',
  }));
}

function selectObjectiveSetup(universe, sortFn, used = new Set()) {
  const ranked = [...universe].sort(sortFn);
  return ranked.find((setup) => !used.has(setup.racket.name)) || ranked[0] || null;
}

export function buildObjectiveRecommendations(result = {}) {
  const universe = buildSetupUniverse(result, { racketLimit: 14, stringLimit: 18 });
  const used = new Set();
  const definitions = [
    ['overall', 'Best overall balance', 'Highest complete-setup score after budget, comfort, skill, and confidence adjustments.', (a, b) => b.finalScore - a.finalScore],
    ['comfort', 'Lowest arm-stress configuration', 'Prioritizes comfort, softer string response, lower estimated arm-stress, and manageable skill demand.', (a, b) => (b.components.safetyFit + b.components.comfortFit) - (a.components.safetyFit + a.components.comfortFit)],
    ['spin', 'Maximum spin path', 'Maximizes predicted spin while keeping the setup eligible for the player profile.', (a, b) => b.predictedAttributes.effectiveSpin - a.predictedAttributes.effectiveSpin],
    ['value', 'Best performance within budget', 'Looks for the strongest fit score per dollar without crossing the budget guardrail.', (a, b) => (b.finalScore / Math.max(b.total, 1)) - (a.finalScore / Math.max(a.total, 1))],
    ['transition', 'Easiest transition', 'Avoids extreme changes in weight, stiffness, skill demand, and arm-stress profile.', (a, b) => (b.components.skillFit + b.components.safetyFit + b.components.dataQuality) - (a.components.skillFit + a.components.safetyFit + a.components.dataQuality)],
  ];

  return definitions.map(([id, label, description, sorter]) => {
    const setup = selectObjectiveSetup(universe, sorter, used);
    if (setup) used.add(setup.racket.name);
    return { id, label, description, setup };
  }).filter((objective) => objective.setup);
}

function buildDiagnosis(player) {
  const fitter = player.fitterSignals;
  const priorities = [];
  const redFlags = [];

  if (fitter.wantsHighLaunch) priorities.push('Support a higher, heavier launch window without losing depth control.');
  if (fitter.wantsLowLaunch) priorities.push('Reduce launch and improve predictability for long misses or flatter drives.');
  if (fitter.needsDepth) priorities.push('Create easier depth before asking for a more demanding frame.');
  if (fitter.needsStability) priorities.push('Add stability against pace and off-center contact.');
  if (fitter.needsManeuverability) priorities.push('Keep swingweight manageable when fatigue or timing breaks down.');
  if (fitter.frequentBreaker) priorities.push('Prioritize string durability before changing tension for durability alone.');
  if (player.painSeverity > 0) priorities.push('Treat comfort as a constraint, not a preference.');

  if (player.painSeverity >= 2) redFlags.push('Recurring or active arm pain blocks harsh full-poly starting setups.');
  if (player.skillScore < 42 && fitter.swingweightTolerance === 'Want stability/plow-through') redFlags.push('Developing players should move toward heavier swingweights gradually.');
  if (fitter.unknownCount >= 4) redFlags.push('Several fitting signals are still unknown, so a demo path may be more honest than one forced answer.');

  const primaryProblem = priorities[0] || 'Find the least extreme complete setup that improves fit without creating a new problem.';

  return {
    sourceLabel: EXPERT_SOURCE_LABEL,
    primaryProblem,
    priorities: priorities.slice(0, 5),
    redFlags,
    translatedPreferences: [
      `Control means: ${player.profileInputs.controlMeaning || 'predictable depth'}.`,
      `Power means: ${player.profileInputs.powerMeaning || 'free depth'}.`,
      `Feel means: ${player.profileInputs.feelMeaning || 'connected response'}.`,
      `Spin means: ${player.profileInputs.spinMeaning || 'more safety margin'}.`,
    ],
  };
}

function decisionChangingQuestion(player) {
  const fitter = player.fitterSignals;
  if (fitter.launchPreference === 'Not sure yet') return 'Do you want a higher, heavier ball or a flatter, more penetrating ball?';
  if (fitter.missPattern === 'Not sure yet') return 'When you miss under pressure, is it usually long, short, into the net, or a timing miss?';
  if (fitter.controlFlags.unknown) return 'When you ask for more control, do you mean lower launch, more stability, less power, better feel, or predictable depth?';
  if (fitter.swingweightTolerance === 'Not sure yet') return 'Does your racket slow down your swing late in a session, or do you need more stability against pace?';
  if (fitter.stringBreakFrequency === 'Not sure yet') return 'How many hours do you usually get before breaking or cutting out strings?';
  if (player.profileInputs.demoReadiness === 'Give me a demo sequence') return 'Which demo feels better after two hours: easier depth, neutral control, or feel/precision?';
  return 'Does the first setup miss by launching too high, feeling too harsh, lacking depth, or feeling unstable?';
}

function expertWarnings(player, topSetups) {
  const warnings = [];
  if (player.painSeverity >= 2) warnings.push('Comfort-first rule active: avoid full polyester until symptoms resolve or a qualified fitter/clinician clears it.');
  if (player.fitterSignals.chronicBreaker) warnings.push('String-break rule active: change string model/gauge before raising tension just for durability.');
  if (player.fitterSignals.wantsLowLaunch && topSetups.some((setup) => buildRacketVector(setup.racket).launchSupply > 72)) warnings.push('High-launch alternatives are included only as contrast options, not defaults.');
  if (player.fitterSignals.unknownCount >= 4) warnings.push('Low-information profile: use the demo sequence to answer the missing fitting question.');
  return warnings;
}

function confidenceMode(topSetups, player) {
  const top = topSetups[0];
  const second = topSetups[1];
  const raw = top?.confidenceScore || 60;
  const gap = second ? top.finalScore - second.finalScore : 12;
  const adjusted = Math.round(clamp(
    raw
      - player.fitterSignals.unknownCount * 6
      - (gap < 4 ? 8 : gap < 8 ? 4 : 0)
      - (player.profileInputs.demoReadiness === 'Give me a demo sequence' ? 8 : 0)
      + (player.profileInputs.demoReadiness === 'Give me one strong answer' ? 3 : 0),
    35,
    96,
  ));

  if (adjusted >= 85) return { score: adjusted, mode: 'high', recommendedOutputType: 'one_setup', label: 'High confidence' };
  if (adjusted >= 60) return { score: adjusted, mode: 'medium', recommendedOutputType: 'ranked_shortlist', label: 'Medium confidence' };
  return { score: adjusted, mode: 'low', recommendedOutputType: 'demo_sequence', label: 'Low confidence' };
}

function setupChoiceLabel(setup, player, index) {
  const vector = buildRacketVector(setup.racket);
  if (index === 0) return 'Start here';
  if (vector.launchSupply >= 72) return 'Choose if you want more launch and spin margin';
  if (patternDensity(setup.racket) >= 72 || vector.launchSupply <= 48) return 'Choose if you want lower launch and precision';
  if (setup.components.comfortFit >= 84) return 'Choose if comfort and pocketing matter most';
  if (setup.components.budgetFit >= 92 && player.budgetTier === 'Value') return 'Choose if you want the cleanest value path';
  return 'Choose if the primary setup misses your preferred feel';
}

function enrichSetupForFitter(setup, player, index) {
  return {
    ...setup,
    chooseIf: setupChoiceLabel(setup, player, index),
    adjustmentRules: setup.tensionPlan?.adjustmentRules || [],
    whatWouldChange: decisionChangingQuestion(player),
  };
}

function buildDemoSequence(topSetups, player) {
  const criteria = ['Forehand depth', 'Launch height', 'Return stability', 'Backhand timing', 'Comfort after two hours'];

  return topSetups.slice(0, 3).map((setup, index) => ({
    order: index + 1,
    racket: setup.racket.name,
    string: setup.string.name,
    tensionStart: setup.tensionPlan.startingPoint,
    test: setupChoiceLabel(setup, player, index),
    evaluationCriteria: criteria,
  }));
}

export function buildAdvancedRecommendations(result = {}) {
  const player = buildPlayerProfile(result);
  const topRackets = rackets.map((racket) => scoreRacket(racket, result)).sort((a, b) => b.finalScore - a.finalScore).slice(0, 3);
  const topStrings = strings.map((string) => scoreString(string, result)).sort((a, b) => b.finalScore - a.finalScore).slice(0, 3);
  const scoredRackets = rackets.map((racket) => scoreRacket(racket, result)).sort((a, b) => b.finalScore - a.finalScore);
  const scoredStrings = strings.map((string) => scoreString(string, result)).sort((a, b) => b.finalScore - a.finalScore);
  const rawTopSetups = uniqueTopSetups(scoredRackets, scoredStrings, result);
  const topSetups = rawTopSetups.map((setup, index) => enrichSetupForFitter(setup, player, index));
  const outputMode = confidenceMode(topSetups, player);
  const objectiveRecommendations = buildObjectiveRecommendations(result);
  const recommendedSetups = outputMode.recommendedOutputType === 'one_setup' ? topSetups.slice(0, 1) : topSetups;

  return {
    modelVersion: RECOMMENDATION_MODEL_VERSION,
    featureSchemaVersion: FEATURE_SCHEMA_VERSION,
    featureSchema,
    expertSourceLabel: EXPERT_SOURCE_LABEL,
    candidateCount: buildSetupUniverse(result, { racketLimit: 14, stringLimit: 18 }).length,
    player,
    diagnosis: buildDiagnosis(player),
    confidenceMode: outputMode,
    recommendedOutputType: outputMode.recommendedOutputType,
    recommendedSetups,
    decisionChangingQuestion: decisionChangingQuestion(player),
    demoSequence: buildDemoSequence(topSetups, player),
    expertWarnings: expertWarnings(player, topSetups),
    topRackets,
    topStrings,
    topSetups,
    objectiveRecommendations,
    modelNotes: [
      'Scores use weighted feature matching, z-score style spec normalization, archetype similarity, and penalty adjustments.',
      `Expert-fitter layer uses ${EXPERT_SOURCE_LABEL}: diagnose the equipment problem before selecting products.`,
      'Setups are evaluated as complete configurations: frame, string, tension range, total price, comfort risk, and skill demand.',
      'Confidence is higher when component scores agree and the player vector closely matches a known archetype.',
      'This is a local statistical rules engine, not a trained ML model or medical fitting authority.',
    ],
    assumptions: MODEL_ASSUMPTIONS,
  };
}
