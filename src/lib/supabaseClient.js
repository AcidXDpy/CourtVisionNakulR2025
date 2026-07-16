import { buildAdvancedRecommendations } from '../data/recommendationModel.js';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
const SESSION_STORAGE_KEY = 'gear_vision_anonymous_session_id';

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    })
  : null;

function cleanBaseUrl(url) {
  return String(url || '').replace(/\/$/, '');
}

async function authHeaders() {
  const token = supabase ? (await supabase.auth.getSession()).data.session?.access_token : null;

  return {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${token || supabaseAnonKey}`,
  };
}

async function currentUserId() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id || null;
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
        ...(await authHeaders()),
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
      headers: await authHeaders(),
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

async function upsertRow(tableName, payload, conflictTarget = 'id') {
  if (!isSupabaseConfigured) {
    console.info(`[Gear Vision] Supabase not configured. Skipping ${tableName} upsert.`, payload);
    return { ok: false, skipped: true };
  }

  try {
    const response = await fetch(`${cleanBaseUrl(supabaseUrl)}/rest/v1/${tableName}?on_conflict=${conflictTarget}`, {
      method: 'POST',
      headers: {
        ...(await authHeaders()),
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const message = await response.text();
      console.warn(`[Gear Vision] Supabase upsert failed for ${tableName}:`, message);
      return { ok: false, error: message, data: null };
    }

    return { ok: true, data: await response.json() };
  } catch (error) {
    console.warn(`[Gear Vision] Supabase upsert error for ${tableName}:`, error);
    return { ok: false, error, data: null };
  }
}

export async function getSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session || null;
}

export function onAuthStateChange(callback) {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session || null));
  return () => data.subscription.unsubscribe();
}

export async function signInWithMagicLink(email) {
  if (!supabase) return { ok: false, skipped: true, message: 'Supabase is not configured yet.' };
  const redirectTo = `${window.location.origin}/profile`;
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
      shouldCreateUser: true,
    },
  });

  return error ? { ok: false, error, message: error.message } : { ok: true };
}

export async function signInWithGoogle() {
  if (!supabase) return { ok: false, skipped: true, message: 'Supabase is not configured yet.' };
  const redirectTo = `${window.location.origin}/profile`;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
    },
  });

  return error ? { ok: false, error, message: error.message } : { ok: true };
}

export async function signOut() {
  if (!supabase) return { ok: false, skipped: true };
  const { error } = await supabase.auth.signOut();
  return error ? { ok: false, error, message: error.message } : { ok: true };
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
    model_version: recommendations.modelVersion,
    feature_schema_version: recommendations.featureSchemaVersion,
    candidate_count: recommendations.candidateCount,
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
      components: setup.components,
      predicted_attributes: setup.predictedAttributes,
      warnings: setup.warnings,
    })),
    objectives: recommendations.objectiveRecommendations.map((objective) => ({
      id: objective.id,
      label: objective.label,
      racket: objective.setup.racket.name,
      string: objective.setup.string.name,
      score: objective.setup.finalScore,
    })),
  };
}

export async function saveQuizSubmission(result) {
  if (!result) return { ok: false, skipped: true };
  const userId = await currentUserId();
  if (!result.consentToResearch && !userId) return { ok: false, skipped: true };
  const snapshot = recommendationSnapshot(result);

  return insertRow('quiz_submissions', {
    user_id: userId,
    anonymous_session_id: getAnonymousSessionId(),
    consent_to_research: Boolean(result.consentToResearch),
    model_version: snapshot.model_version,
    feature_schema_version: snapshot.feature_schema_version,
    candidate_count: snapshot.candidate_count,
    top_setup_score: snapshot.top_setups?.[0]?.score || null,
    confidence_score: snapshot.top_setups?.[0]?.confidence || null,
    primary_playstyle: result.primary,
    secondary_playstyle: result.secondary,
    budget_tier: result.budgetTier,
    max_setup_price: Number(result.maxSetupPrice || 0),
    arm_issue: result.armIssue,
    comfort_priority: Number(result.comfortPriority || 0),
    profile: result.profileInputs || {},
    traits: result.traits || {},
    style_scores: result.totals || {},
    recommendations: snapshot,
  });
}

export async function saveRecommendationFeedback(feedback) {
  const userId = await currentUserId();
  if (!feedback?.consentToResearch && !userId) return { ok: false, skipped: true };

  return insertRow('recommendation_feedback', {
    user_id: userId,
    anonymous_session_id: getAnonymousSessionId(),
    consent_to_research: Boolean(feedback.consentToResearch),
    setup_id: feedback.setupId,
    setup_label: feedback.setupLabel,
    racket: feedback.racket,
    string: feedback.string,
    primary_playstyle: feedback.primary,
    secondary_playstyle: feedback.secondary,
    budget_tier: feedback.budgetTier,
    arm_issue: feedback.armIssue,
    final_score: Number(feedback.finalScore || 0),
    confidence_score: Number(feedback.confidenceScore || 0),
    total_price: Number(feedback.total || 0),
    model_version: feedback.modelVersion || null,
    feature_schema_version: feedback.featureSchemaVersion || null,
    predicted_scores: feedback.predictedScores || {},
    score_components: feedback.scoreComponents || {},
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

export async function saveSetupSimulation(values) {
  const userId = await currentUserId();
  if (!userId) return { ok: false, skipped: true };

  return insertRow('setup_simulations', {
    user_id: userId,
    baseline_setup: values.baselineSetup || {},
    change_set: values.changeSet || {},
    predicted_before: values.predictedBefore || {},
    predicted_after: values.predictedAfter || {},
    deltas: values.deltas || {},
    model_version: values.modelVersion || null,
    feature_schema_version: values.featureSchemaVersion || null,
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

export async function fetchUserProfile() {
  const userId = await currentUserId();
  if (!userId) return { ok: false, skipped: true, data: null };
  const result = await selectRows(`profiles?select=*&id=eq.${encodeURIComponent(userId)}&limit=1`);
  return result.ok ? { ok: true, data: result.data?.[0] || null } : result;
}

export async function saveUserProfile(values) {
  const userId = await currentUserId();
  if (!userId) return { ok: false, skipped: true };
  return upsertRow('profiles', {
    id: userId,
    display_name: values.displayName || null,
    skill_level: values.skillLevel || null,
    utr: values.utr ? Number(values.utr) : null,
    ntrp: values.ntrp ? Number(values.ntrp) : null,
    age: values.age ? Number(values.age) : null,
    height: values.height || null,
    weight: values.weight || null,
    playstyle: values.playstyle || null,
    arm_issue: values.armIssue || null,
    budget_tier: values.budgetTier || null,
    current_racket: values.currentRacket || null,
    current_string: values.currentString || null,
    current_tension: values.currentTension ? Number(values.currentTension) : null,
    notes: values.notes || null,
    updated_at: new Date().toISOString(),
  });
}

export async function saveUserSetup(values) {
  const userId = await currentUserId();
  if (!userId) return { ok: false, skipped: true };
  return insertRow('user_setups', {
    user_id: userId,
    racket: values.racket,
    string: values.string,
    tension: values.tension ? Number(values.tension) : null,
    notes: values.notes || null,
    comfort_rating: values.comfortRating ? Number(values.comfortRating) : null,
    power_rating: values.powerRating ? Number(values.powerRating) : null,
    control_rating: values.controlRating ? Number(values.controlRating) : null,
    spin_rating: values.spinRating ? Number(values.spinRating) : null,
    active: Boolean(values.active),
  });
}

export async function fetchUserSetups() {
  const userId = await currentUserId();
  if (!userId) return { ok: false, skipped: true, data: [] };
  return selectRows(`user_setups?select=*&user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc`);
}

export async function fetchUserAnalytics() {
  const userId = await currentUserId();
  if (!userId) return { ok: false, skipped: true, data: null };
  const [profile, setups, quizzes, feedback] = await Promise.all([
    fetchUserProfile(),
    fetchUserSetups(),
    selectRows(`quiz_submissions?select=*&user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc&limit=25`),
    selectRows(`recommendation_feedback?select=*&user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc&limit=50`),
  ]);

  return {
    ok: true,
    data: {
      profile: profile.data,
      setups: setups.data || [],
      quizzes: quizzes.data || [],
      feedback: feedback.data || [],
    },
  };
}
