export const FEATURE_SCHEMA_VERSION = 'gv-feature-schema-2.0.0';
export const RECOMMENDATION_MODEL_VERSION = 'gv-rules-engine-2.0.0';

export const racketFieldSchema = [
  ['id', 'Stable product identifier'],
  ['brand', 'Manufacturer brand'],
  ['model', 'Model family and variant'],
  ['retailPrice', 'Approximate retail price in USD'],
  ['headSizeSqIn', 'Head size in square inches'],
  ['strungWeightGrams', 'Approximate strung or catalog weight in grams'],
  ['swingweight', 'Approximate swingweight'],
  ['stiffnessRA', 'Frame stiffness rating'],
  ['stringPatternMains', 'Main-string count'],
  ['stringPatternCrosses', 'Cross-string count'],
  ['powerLevel', 'Normalized power score, 0-100'],
  ['controlLevel', 'Normalized control score, 0-100'],
  ['spinPotential', 'Normalized spin score, 0-100'],
  ['comfortLevel', 'Normalized comfort score, 0-100'],
  ['dataConfidence', 'How complete and reliable the local record is'],
];

export const stringFieldSchema = [
  ['id', 'Stable product identifier'],
  ['brand', 'Manufacturer brand'],
  ['model', 'Model and gauge'],
  ['material', 'Primary string material family'],
  ['gauge', 'Gauge label'],
  ['diameterMm', 'Diameter in millimeters when available'],
  ['stiffness', 'Ordinal stiffness family'],
  ['energyReturn', 'Normalized power/energy return estimate, 0-100'],
  ['spinPotential', 'Normalized spin score, 0-100'],
  ['comfortLevel', 'Normalized comfort score, 0-100'],
  ['controlLevel', 'Normalized control score, 0-100'],
  ['durabilityLevel', 'Normalized durability score, 0-100'],
  ['dataConfidence', 'How complete and reliable the local record is'],
];

export function slugifyId(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function parseMoney(value) {
  return Number(String(value ?? '').replace(/[^0-9.]/g, '')) || 0;
}

export function parseFirstNumber(value, fallback = null) {
  const match = String(value ?? '').match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : fallback;
}

export function parseStringPattern(pattern) {
  const [mains, crosses] = String(pattern || '').match(/\d+/g)?.map(Number) || [];
  return {
    mains: mains || null,
    crosses: crosses || null,
  };
}

export function normalizeRacketRecord(racket) {
  const pattern = parseStringPattern(racket.stringPattern);
  const missingCriticalFields = [
    racket.price,
    racket.headSize,
    racket.weight,
    racket.swingweight,
    racket.stiffness,
    racket.stringPattern,
  ].filter((value) => value === undefined || value === null || value === '').length;

  return {
    id: slugifyId(racket.name),
    brand: String(racket.brandLine || racket.name || '').split(' ')[0],
    model: racket.model || racket.name,
    modelYear: null,
    retailPrice: parseMoney(racket.price),
    headSizeSqIn: parseFirstNumber(racket.headSize),
    unstrungWeightGrams: parseFirstNumber(racket.weight),
    strungWeightGrams: parseFirstNumber(racket.weight),
    balanceMm: null,
    balancePointsHeadLight: null,
    swingweight: Number(racket.swingweight || 0) || null,
    stiffnessRA: Number(racket.stiffness || 0) || null,
    beamWidthMin: null,
    beamWidthMax: null,
    lengthInches: 27,
    stringPatternMains: pattern.mains,
    stringPatternCrosses: pattern.crosses,
    recommendedTensionMin: null,
    recommendedTensionMax: null,
    powerLevel: Number(racket.power || 0) * 10,
    controlLevel: Number(racket.control || 0) * 10,
    spinPotential: Number(racket.spin || 0) * 10,
    comfortLevel: Number(racket.comfort || 0) * 10,
    stabilityLevel: Math.min(100, Math.max(0, Number(racket.swingweight || 315) - 275)),
    maneuverabilityLevel: Math.min(100, Math.max(0, 100 - (Number(racket.swingweight || 315) - 300) * 2)),
    launchAngle: pattern.mains && pattern.crosses ? (pattern.mains <= 16 && pattern.crosses <= 19 ? 'medium-high' : 'medium-low') : 'unknown',
    skillLevelMin: racket.difficulty === 'High' ? 70 : racket.difficulty === 'Medium-High' ? 55 : 25,
    skillLevelMax: 100,
    imageUrl: racket.image || null,
    productUrl: racket.productUrl || null,
    dataSource: racket.dataSource || 'local seed catalog',
    dataConfidence: Math.max(0.45, 0.9 - missingCriticalFields * 0.08),
    lastVerifiedAt: racket.lastVerifiedAt || null,
  };
}

export function normalizeStringRecord(string) {
  const diameterMm = parseFirstNumber(string.gauge);
  const missingCriticalFields = [
    string.price,
    string.gauge,
    string.stringType,
    string.tensionRange,
  ].filter((value) => value === undefined || value === null || value === '').length;

  return {
    id: slugifyId(string.name),
    brand: string.brand || String(string.name || '').split(' ')[0],
    model: string.model || string.name,
    material: string.stringType || 'Unknown',
    construction: string.construction || string.stringType || 'Unknown',
    gauge: string.gauge || null,
    diameterMm,
    stiffness: string.stiffness || 'Unknown',
    energyReturn: Number(string.power || 0) * 10,
    tensionLoss: string.tensionLoss ?? null,
    spinPotential: Number(string.spin || 0) * 10,
    comfortLevel: Number(string.comfort || 0) * 10,
    controlLevel: Number(string.control || 0) * 10,
    durabilityLevel: Number(string.durability || 0) * 10,
    recommendedTensionMin: parseFirstNumber(string.tensionRange),
    recommendedTensionMax: String(string.tensionRange || '').match(/\d+/g)?.map(Number)?.[1] || null,
    retailPrice: parseMoney(string.price),
    dataSource: string.dataSource || 'local seed catalog',
    dataConfidence: Math.max(0.45, 0.88 - missingCriticalFields * 0.08),
    lastVerifiedAt: string.lastVerifiedAt || null,
  };
}
