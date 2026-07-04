import { buildAdvancedRecommendations } from '../data/recommendationModel.js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
const SESSION_STORAGE_KEY = 'gear_vision_anonymous_session_id';

function cleanBaseUrl(url) {
  return String(url || '').replace(/\/$/, '');
}

async function insertRow(tableName, payload) {
  if (!isSupabaseConfigured) {
    console.info(`[Gear Vision] Supabase not configured. Skipping ${tableName} insert.`, payload);
    return { ok: false, skipped: true };
  }

  try {
    const response = await fetch(`${cleanBaseUrl(supabaseUrl)}/rest/v1/${tableName}`, {
      method: 'POST',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const message = await response.text();
      console.warn(`[Gear Vision] Supabase insert failed for ${tableName}:`, message);
      return { ok: false, error: message };
    }

    return { ok: true };
  } catch (error) {
    console.warn(`[Gear Vision] Supabase insert error for ${tableName}:`, error);
    return { ok: false, error };
  }
}

async function selectRows(path) {
  if (!isSupabaseConfigured) {
    return { ok: false, skipped: true, data: null };
  }

  try {
    const response = await fetch(`${cleanBaseUrl(supabaseUrl)}/rest/v1/${path}`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    });

    if (!response.ok) {
      const message = await response.text();
      console.warn(`[Gear Vision] Supabase read failed for ${path}:`, message);
      return { ok: false, error: message, data: null };
    }

    return { ok: true, data: await response.json() };
  } catch (error) {
    console.warn(`[Gear Vision] Supabase read error for ${path}:`, error);
    return { ok: false, error, data: null };
  }
}

export function getAnonymousSessionId() {
  try {
    const current = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (current) return current;
    const next = `gv_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(SESSION_STORAGE_KEY, next);
    return next;
  } catch {
    return `gv_${Date.now()}`;
  }
}

function recommendationSnapshot(result) {
  const recommendations = buildAdvancedRecommendations(result);

  return {
    archetype: recommendations.player.primaryArchetype.name,
    archetype_similarity: recommendations.player.primaryArchetype.similarity,
    top_rackets: recommendations.topRackets.map((racket) => ({
      name: racket.name,
      score: racket.finalScore,
      confidence: racket.confidenceScore,
      warnings: racket.warnings,
    })),
    top_strings: recommendations.topStrings.map((string) => ({
      name: string.name,
      score: string.finalScore,
      confidence: string.confidenceScore,
      tension: string.suggestedTensionRange,
      warnings: string.warnings,
    })),
    top_setups: recommendations.topSetups.map((setup) => ({
      label: setup.label,
      racket: setup.racket.name,
      string: setup.string.name,
      score: setup.finalScore,
      confidence: setup.confidenceScore,
      total: setup.total,
      tension: setup.tensionRange,
      warnings: setup.warnings,
    })),
  };
}

export async function saveQuizSubmission(result) {
  if (!result) return { ok: false, skipped: true };
  if (!result.consentToResearch) return { ok: false, skipped: true };

  return insertRow('quiz_submissions', {
    anonymous_session_id: getAnonymousSessionId(),
    consent_to_research: true,
    primary_playstyle: result.primary,
    secondary_playstyle: result.secondary,
    budget_tier: result.budgetTier,
    max_setup_price: Number(result.maxSetupPrice || 0),
    arm_issue: result.armIssue,
    comfort_priority: Number(result.comfortPriority || 0),
    profile: result.profileInputs || {},
    traits: result.traits || {},
    style_scores: result.totals || {},
    recommendations: recommendationSnapshot(result),
  });
}

export async function saveRecommendationFeedback(feedback) {
  if (!feedback?.consentToResearch) return { ok: false, skipped: true };

  return insertRow('recommendation_feedback', {
    anonymous_session_id: getAnonymousSessionId(),
    consent_to_research: true,
    setup_id: feedback.setupId,
    setup_label: feedback.setupLabel,
    racket: feedback.racket,
    string: feedback.string,
    primary_playstyle: feedback.primary,
    secondary_playstyle: feedback.secondary,
    budget_tier: feedback.budgetTier,
    arm_issue: feedback.armIssue,
    final_score: Number(feedback.finalScore || 0),
    total_price: Number(feedback.total || 0),
    would_try: feedback.wouldTry || null,
    accurate: feedback.accurate || null,
    accuracy_rating: feedback.accuracyRating ? Number(feedback.accuracyRating) : null,
    comfort_rating: feedback.comfortRating ? Number(feedback.comfortRating) : null,
    confidence_rating: feedback.confidenceRating ? Number(feedback.confidenceRating) : null,
    mismatch_reasons: feedback.mismatchReasons || [],
    comments: feedback.comments || null,
    actual_setup_used: feedback.actualSetupUsed || null,
    payload: feedback,
  });
}

export async function savePlayerNomination(values) {
  return insertRow('player_nominations', {
    player_name: values.playerName,
    age: values.age ? Number(values.age) : null,
    location: values.location,
    contact_email: values.contactEmail,
    current_setup: values.currentSetup,
    help_needed: values.helpNeeded,
    explanation: values.explanation,
    payload: values,
  });
}

export async function saveBallDonation(values) {
  return insertRow('ball_donations', {
    donor_name: values.donorName,
    email: values.email,
    ball_count: values.ballCount ? Number(values.ballCount) : null,
    organization: values.organization,
    preference: values.preference,
    location: values.location,
    notes: values.notes,
    payload: values,
  });
}

export async function fetchPublicDashboardMetrics() {
  const result = await selectRows('public_dashboard_metrics?select=*');
  return result.ok ? { ok: true, data: result.data?.[0] || null } : result;
}
