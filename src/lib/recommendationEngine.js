import { rackets } from '../data/rackets.js';
import { strings } from '../data/strings.js';

export const STRINGING_LABOR_ESTIMATE = 25;

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
  const age = parseOptionalNumber(profile.age);
  const weight = parseOptionalNumber(profile.weight);
  const skill = parseSkill(profile.skillLevel);
  const spin = Number(profile.topspinLevel || 0) ? Number(profile.topspinLevel) * 10 : trait(result, 'spinIntent', 58);
  const serve = Number(profile.serveImportance || 0) ? Number(profile.serveImportance) * 10 : trait(result, 'serveReliance', 50);
  const comfortBase = Math.max((result.comfortPriority || 0) * 48, trait(result, 'comfortNeed', 44), profile.painArea && profile.painArea !== 'None' ? 92 : 0);
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
    hasPain: Boolean((profile.painArea && profile.painArea !== 'None') || (result.comfortPriority || 0) > 0),
    dislikes: String(profile.setupDislikes || '').toLowerCase(),
    primaryPlaystyle: result.primary || 'All-Court Player',
    secondaryPlaystyle: result.secondary || 'Counterpuncher',
    archetypeMatches,
    primaryArchetype: archetypeMatches[0],
  };
}

export function buildRacketVector(racket) {
  return {
    price: priceNumber(racket.price),
    power: racket.power * 10,
    control: racket.control * 10,
    spin: racket.spin * 10,
    comfort: racket.comfort * 10,
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
  return {
    price: priceNumber(string.price),
    power: string.power * 10,
    control: string.control * 10,
    spin: string.spin * 10,
    comfort: string.comfort * 10,
    durability: string.durability * 10,
    armSafety: isArmSafeString(string) ? 95 : string.comfort >= 7 ? 72 : 38,
    isPoly: String(string.stringType).toLowerCase().includes('poly'),
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

  if (player.hasPain && !isArmSafeRacket(racket, player)) penalties.push({ label: 'Arm health risk from stiffness or swingweight', value: 20 });
  if (isBeginner && vector.skillFloor > 50) penalties.push({ label: 'May be too advanced for a newer player', value: 14 });
  if (player.swingSpeedScore < 45 && (vector.weight > 305 || vector.swingweight > 323)) penalties.push({ label: 'Slow swing speed may fight the frame weight', value: 12 });
  if (player.swingSpeedScore > 76 && vector.swingweight < 310) penalties.push({ label: 'Fast swing may want more stability than this frame gives', value: 8 });
  if (player.budgetCeiling < 285 && priceNumber(racket.price) > 260) penalties.push({ label: 'Frame price pressures a value budget', value: 10 });
  if (player.dislikes.includes('stiff') && racket.stiffness >= 66) penalties.push({ label: 'You flagged stiffness, and this frame is firm', value: 8 });
  if (player.dislikes.includes('control') && racket.control <= 7) penalties.push({ label: 'You flagged control, and this frame leans livelier', value: 7 });

  return penalties;
}

function stringPenalty(string, player, vector) {
  const penalties = [];
  const isBeginner = player.skillScore < 42;

  if (player.hasPain && !isArmSafeString(string)) penalties.push({ label: 'Not the safest string family for current arm pain', value: 22 });
  if (isBeginner && vector.isPoly) penalties.push({ label: 'Full polyester can be unforgiving for newer players', value: 14 });
  if (player.budgetCeiling < 285 && vector.price > 26) penalties.push({ label: 'String price is high for the selected budget', value: 7 });
  if (player.dislikes.includes('break') && string.durability <= 6) penalties.push({ label: 'Durability may not solve your breakage issue', value: 7 });
  if (player.dislikes.includes('power') && string.power <= 5) penalties.push({ label: 'This string is low powered for your complaint', value: 6 });

  return penalties;
}

function warningLabels(penalties) {
  return penalties.map((penalty) => penalty.label).slice(0, 3);
}

function explainRacket(racket, player, components, warnings) {
  const reasons = [];
  if (racket.recommendedPlaystyles.includes(player.primaryPlaystyle)) reasons.push(`Matches your ${player.primaryPlaystyle.toLowerCase()} playstyle signal.`);
  if (components.archetypeFit >= 82) reasons.push(`Specs line up with the ${player.primaryArchetype.name.toLowerCase()} archetype.`);
  if (components.traitFit >= 82) reasons.push('Power, spin, control, and comfort scores are close to your player vector.');
  if (components.swingFit >= 82) reasons.push('Weight and swingweight fit your reported swing speed.');
  if (components.budgetFit >= 92) reasons.push('Leaves room in the setup budget for a smart string choice.');
  if (!warnings.length && player.hasPain) reasons.push('Passes the stricter arm-safety filter.');
  return reasons.slice(0, 4);
}

function explainString(string, player, components, warnings) {
  const reasons = [];
  if (string.recommendedPlaystyles.includes(player.primaryPlaystyle)) reasons.push(`Supports your ${player.primaryPlaystyle.toLowerCase()} string needs.`);
  if (components.traitFit >= 82) reasons.push('String power, spin, control, and comfort closely match the quiz profile.');
  if (components.armSafety >= 84 && player.hasPain) reasons.push('Prioritizes comfort for the pain/injury signal.');
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
  const safetyFit = player.hasPain ? (isArmSafeRacket(racket, player) ? 94 : 52) : Math.round(clamp(100 - Math.max(0, vector.stiffness - 67) * 6));
  const budgetFit = budgetScore(priceNumber(racket.price) + 75, player.budgetCeiling);
  const archetypeFit = Math.round(cosineSimilarity(
    { spin: vector.spin, power: vector.power, control: vector.control, serve: vector.power, net: swingSupply, comfort: vector.comfort, aggression: vector.power, skill: vector.skillFloor },
    player.primaryArchetype.vector,
  ) * 100);
  const penalties = racketPenalty(racket, player, vector);
  const penaltyTotal = penalties.reduce((sum, penalty) => sum + penalty.value, 0);
  const weights = player.hasPain
    ? { traitFit: 0.24, playstyleFit: 0.14, swingFit: 0.14, safetyFit: 0.24, budgetFit: 0.1, archetypeFit: 0.14 }
    : { traitFit: 0.28, playstyleFit: 0.2, swingFit: 0.16, safetyFit: 0.1, budgetFit: 0.1, archetypeFit: 0.16 };
  const components = { traitFit, playstyleFit, swingFit, safetyFit, budgetFit, archetypeFit };
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
  const traitFit = Math.round(
    closeness(player.vector.power, vector.power) * 0.18
      + closeness(player.vector.control, vector.control) * 0.22
      + closeness(player.vector.spin, vector.spin) * 0.22
      + closeness(player.vector.comfort, vector.comfort) * 0.25
      + closeness(trait(result, 'durabilityNeed', 50), vector.durability) * 0.13,
  );
  const playstyleFit = Math.min(100, 44 + (string.recommendedPlaystyles.includes(player.primaryPlaystyle) ? 32 : 0) + (string.recommendedPlaystyles.includes(player.secondaryPlaystyle) ? 16 : 0));
  const armSafety = player.hasPain ? vector.armSafety : Math.max(68, vector.armSafety - 8);
  const budgetFit = budgetScore(vector.price + 270 + STRINGING_LABOR_ESTIMATE, player.budgetCeiling);
  const durabilityFit = Math.round(closeness(trait(result, 'durabilityNeed', 50), vector.durability));
  const archetypeFit = Math.round(cosineSimilarity(
    { spin: vector.spin, power: vector.power, control: vector.control, serve: vector.power, net: 45, comfort: vector.comfort, aggression: vector.spin, skill: vector.isPoly ? 70 : 35 },
    player.primaryArchetype.vector,
  ) * 100);
  const penalties = stringPenalty(string, player, vector);
  const penaltyTotal = penalties.reduce((sum, penalty) => sum + penalty.value, 0);
  const weights = player.hasPain
    ? { traitFit: 0.24, playstyleFit: 0.12, armSafety: 0.28, budgetFit: 0.1, durabilityFit: 0.1, archetypeFit: 0.16 }
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

export function suggestTensionRange(string, result = {}) {
  const player = buildPlayerProfile(result);
  const [low, high] = String(string.tensionRange || '45-55 lbs').match(/\d+/g)?.map(Number) || [45, 55];
  const middle = (low + high) / 2;
  let target = middle;

  if (player.hasPain) target -= 4;
  if (player.vector.power >= 74) target -= 2;
  if (player.vector.control >= 74) target += 2;
  if (player.skillScore < 38) target -= 2;
  if (String(string.stringType).toLowerCase().includes('poly')) target -= 2;

  const start = Math.round(clamp(target - 2, low, high));
  const end = Math.round(clamp(target + 2, low, high));
  return `${Math.min(start, end)}-${Math.max(start, end)} lbs`;
}

function setupComponents(scoredRacket, scoredString, result) {
  const total = setupTotal(scoredRacket, scoredString);
  const setupPower = scoredRacket.power * 6 + scoredString.power * 4;
  const setupSpin = scoredRacket.spin * 5.5 + scoredString.spin * 4.5;
  const setupControl = scoredRacket.control * 5.8 + scoredString.control * 4.2;
  const setupComfort = scoredRacket.comfort * 5.5 + scoredString.comfort * 4.5;
  const player = buildPlayerProfile(result);

  return {
    playstyleFit: Math.round((scoredRacket.components.playstyleFit * 0.55) + (scoredString.components.playstyleFit * 0.45)),
    traitFit: Math.round(closeness(player.vector.spin, setupSpin) * 0.22 + closeness(player.vector.power, setupPower) * 0.2 + closeness(player.vector.control, setupControl) * 0.24 + closeness(player.vector.comfort, setupComfort) * 0.24 + closeness(trait(result, 'durabilityNeed', 50), scoredString.durability * 10) * 0.1),
    performanceFit: Math.round((setupPower + setupSpin + setupControl) / 3),
    comfortFit: Math.round(setupComfort),
    budgetFit: budgetScore(total, player.budgetCeiling),
    safetyFit: player.hasPain ? Math.round((scoredRacket.components.safetyFit * 0.55) + (scoredString.components.armSafety * 0.45)) : 86,
  };
}

export function scoreSetup(racket, string, result = {}) {
  const scoredRacket = racket.finalScore !== undefined ? racket : scoreRacket(racket, result);
  const scoredString = string.finalScore !== undefined ? string : scoreString(string, result);
  const components = setupComponents(scoredRacket, scoredString, result);
  const player = buildPlayerProfile(result);
  const weights = player.hasPain
    ? { playstyleFit: 0.14, traitFit: 0.22, performanceFit: 0.12, comfortFit: 0.18, budgetFit: 0.12, safetyFit: 0.22 }
    : { playstyleFit: 0.2, traitFit: 0.25, performanceFit: 0.18, comfortFit: 0.12, budgetFit: 0.12, safetyFit: 0.13 };
  const warnings = [...new Set([...(scoredRacket.warnings || []), ...(scoredString.warnings || [])])].slice(0, 4);
  const finalScore = Math.round(clamp(Object.entries(weights).reduce((sum, [key, weight]) => sum + components[key] * weight, 0) - warnings.length * 2));
  const confidenceScore = confidenceFrom(components, warnings.length, player.primaryArchetype.similarity);
  const total = setupTotal(racket, string);

  return {
    finalScore,
    confidenceScore,
    components,
    weights,
    total,
    inBudget: total <= player.budgetCeiling,
    warnings,
    tensionRange: suggestTensionRange(string, result),
    explanation: [
      ...scoredRacket.explanation.slice(0, 2),
      ...scoredString.explanation.slice(0, 2),
      `Closest data profile: ${player.primaryArchetype.name} (${player.primaryArchetype.similarity}% similarity).`,
    ].slice(0, 5),
  };
}

function uniqueTopSetups(scoredRackets, scoredStrings, result) {
  const candidates = scoredRackets.slice(0, 10).flatMap((racket) => scoredStrings.slice(0, 12).map((string) => ({
    racket,
    string,
    ...scoreSetup(racket, string, result),
  }))).sort((a, b) => b.finalScore - a.finalScore);
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

export function buildAdvancedRecommendations(result = {}) {
  const player = buildPlayerProfile(result);
  const topRackets = rackets.map((racket) => scoreRacket(racket, result)).sort((a, b) => b.finalScore - a.finalScore).slice(0, 3);
  const topStrings = strings.map((string) => scoreString(string, result)).sort((a, b) => b.finalScore - a.finalScore).slice(0, 3);
  const scoredRackets = rackets.map((racket) => scoreRacket(racket, result)).sort((a, b) => b.finalScore - a.finalScore);
  const scoredStrings = strings.map((string) => scoreString(string, result)).sort((a, b) => b.finalScore - a.finalScore);
  const topSetups = uniqueTopSetups(scoredRackets, scoredStrings, result);

  return {
    player,
    topRackets,
    topStrings,
    topSetups,
    modelNotes: [
      'Scores use weighted feature matching, z-score style spec normalization, archetype similarity, and penalty adjustments.',
      'Confidence is higher when component scores agree and the player vector closely matches a known archetype.',
      'This is a local statistical rules engine, not a trained ML model or medical fitting authority.',
    ],
  };
}
