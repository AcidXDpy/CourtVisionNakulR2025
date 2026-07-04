export const fallbackDashboardMetrics = {
  quiz_submissions: 0,
  feedback_count: 0,
  player_nominations: 0,
  ball_donations: 0,
  balls_collected: 0,
  would_try_rate: 0,
  accuracy_rate: 0,
  average_fit_score: 0,
  archetype_distribution: [
    { name: 'Heavy topspin', value: 0 },
    { name: 'All-court', value: 0 },
    { name: 'Arm-sensitive', value: 0 },
  ],
  budget_distribution: [
    { name: 'Value', value: 0 },
    { name: 'Balanced', value: 0 },
    { name: 'Premium', value: 0 },
  ],
  confidence_calibration: [
    { bucket: '1-3', count: 0, accuracy: 0 },
    { bucket: '4-7', count: 0, accuracy: 0 },
    { bucket: '8-10', count: 0, accuracy: 0 },
  ],
  mismatch_reasons: [],
  impact_stats: {
    playersHelped: 0,
    setupsDonated: 0,
    dollarsRaised: 0,
    ballsCollected: 0,
    sheltersSupported: 0,
    seniorHomesSupported: 0,
    organizationsHelped: 0,
  },
};

export const modelFeatureRows = [
  { feature: 'Spin demand', role: 'Matches topspin intent to racket/string spin supply', weight: 22 },
  { feature: 'Control demand', role: 'Balances launch, precision, and string response', weight: 24 },
  { feature: 'Comfort risk', role: 'Penalizes stiff frames or harsh strings when pain is flagged', weight: 22 },
  { feature: 'Budget fit', role: 'Keeps full setup price inside the selected ceiling', weight: 12 },
  { feature: 'Archetype similarity', role: 'Compares the player vector with tennis style archetypes', weight: 16 },
];

export function normalizeMetrics(metrics) {
  return {
    ...fallbackDashboardMetrics,
    ...(metrics || {}),
    archetype_distribution: metrics?.archetype_distribution?.length ? metrics.archetype_distribution : fallbackDashboardMetrics.archetype_distribution,
    budget_distribution: metrics?.budget_distribution?.length ? metrics.budget_distribution : fallbackDashboardMetrics.budget_distribution,
    confidence_calibration: metrics?.confidence_calibration?.length ? metrics.confidence_calibration : fallbackDashboardMetrics.confidence_calibration,
    mismatch_reasons: metrics?.mismatch_reasons || [],
    impact_stats: { ...fallbackDashboardMetrics.impact_stats, ...(metrics?.impact_stats || {}) },
  };
}

export function sampleSizeLabel(count) {
  if (count >= 50) return 'usable sample';
  if (count >= 15) return 'early signal';
  if (count > 0) return 'tiny sample';
  return 'waiting for data';
}

export function sampleSizeWarning(count) {
  if (count >= 50) return 'Enough responses to start comparing model variants.';
  if (count >= 15) return 'Early signal only: useful directionally, not statistically stable yet.';
  if (count > 0) return 'Very small sample: show the pipeline, not final conclusions.';
  return 'No public opt-in responses yet. Charts use empty-state placeholders until users submit data.';
}

export function buildEvaluationKpis(metrics) {
  const data = normalizeMetrics(metrics);

  return [
    { label: 'Opt-in quiz rows', value: data.quiz_submissions, caption: sampleSizeLabel(data.quiz_submissions) },
    { label: 'Feedback rows', value: data.feedback_count, caption: sampleSizeWarning(data.feedback_count) },
    { label: 'Accuracy rate', value: `${data.accuracy_rate}%`, caption: 'Percent of feedback marked accurate.' },
    { label: 'Would-try rate', value: `${data.would_try_rate}%`, caption: 'Behavioral interest in the recommended setup.' },
  ];
}

export function buildImpactKpis(metrics) {
  const data = normalizeMetrics(metrics);
  const impact = data.impact_stats;

  return [
    { label: 'Players nominated', value: data.player_nominations, caption: 'Private nomination details stay in Supabase.' },
    { label: 'Players helped', value: impact.playersHelped, caption: 'Manual impact counter for fulfilled support.' },
    { label: 'Balls pledged', value: data.balls_collected || impact.ballsCollected, caption: 'Used balls committed through the recycle flow.' },
    { label: 'Organizations helped', value: impact.organizationsHelped, caption: 'Schools, shelters, senior homes, and programs.' },
  ];
}
