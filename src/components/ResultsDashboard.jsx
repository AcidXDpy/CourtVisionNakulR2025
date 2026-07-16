import { AlertTriangle, CheckCircle2, ClipboardCheck, Download, Share2, ShieldCheck, SlidersHorizontal, Target, Wallet, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { playstyles } from '../data/playstyles.js';
import { buildAdvancedRecommendations, loadFeedback, money, saveFeedback, STRINGING_LABOR_ESTIMATE } from '../data/recommendationModel.js';
import { shareGearVision } from '../lib/share.js';
import { simulateSetupChange } from '../lib/setupSimulator.js';
import { saveRecommendationFeedback } from '../lib/supabaseClient.js';
import Card from './Card.jsx';

const scoreLabels = {
  playstyleFit: 'Style',
  traitFit: 'Trait fit',
  performanceFit: 'Performance',
  comfortFit: 'Comfort',
  budgetFit: 'Budget',
  safetyFit: 'Safety',
  skillFit: 'Skill',
  dataQuality: 'Data',
  launchFit: 'Launch',
  forgivenessFit: 'Forgiveness',
  stabilityFit: 'Stability',
  maneuverabilityFit: 'Maneuver',
};

function confidenceLabel(score) {
  if (score >= 86) return 'Strong match';
  if (score >= 76) return 'Balanced match';
  return 'Experimental fit';
}

function bestUseLabel(option, setupOptions) {
  const topComfort = Math.max(...setupOptions.map((item) => item.components.comfortFit));
  const topBudget = Math.max(...setupOptions.map((item) => item.components.budgetFit));
  const topPerformance = Math.max(...setupOptions.map((item) => item.components.performanceFit));

  if (option.components.comfortFit === topComfort) return 'Best comfort';
  if (option.components.budgetFit === topBudget) return 'Best value';
  if (option.components.performanceFit === topPerformance) return 'Best upside';
  return 'Balanced option';
}

function ListBlock({ title, items }) {
  return (
    <Card>
      <h3 className="text-lg font-black text-court-ink">{title}</h3>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
            <CheckCircle2 className="mt-1 shrink-0 text-court-blue" size={16} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function ScoreBreakdown({ components }) {
  return (
    <div className="mt-4 space-y-2">
      {Object.entries(components).map(([key, value]) => (
        <div key={key}>
          <div className="mb-1 flex justify-between text-xs text-slate-500">
            <span>{scoreLabels[key]}</span>
            <span>{value}/100</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-gradient-to-r from-court-blue to-court-green" style={{ width: `${value}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function WarningList({ warnings }) {
  if (!warnings?.length) {
    return <p className="mt-3 rounded-lg border border-court-line bg-white p-3 text-xs leading-5 text-slate-600">No major mismatch warnings from the current model.</p>;
  }

  return (
    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-700">Watchouts</p>
      <ul className="mt-2 space-y-1">
        {warnings.map((warning) => (
          <li key={warning} className="text-xs leading-5 text-amber-800">{warning}</li>
        ))}
      </ul>
    </div>
  );
}

function midpoint(range) {
  const numbers = String(range || '').match(/\d+/g)?.map(Number) || [];
  if (numbers.length >= 2) return Math.round((numbers[0] + numbers[1]) / 2);
  return numbers[0] || 52;
}

function DeltaRow({ label, value, inverse = false }) {
  const positive = inverse ? value < 0 : value > 0;
  const neutral = value === 0;

  return (
    <div className="rounded-lg border border-court-line bg-white p-3">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-black ${neutral ? 'text-slate-500' : positive ? 'text-court-blue' : 'text-amber-700'}`}>
        {value > 0 ? '+' : ''}{value}
      </p>
    </div>
  );
}

function SetupSimulator({ option, result }) {
  const baseTension = midpoint(option.tensionRange);
  const [tension, setTension] = useState(baseTension);
  const [addedWeight, setAddedWeight] = useState(0);
  const [placement, setPlacement] = useState('3_and_9');
  const simulation = simulateSetupChange({
    racket: option.racket,
    string: option.string,
    baselineOptions: {
      tension: baseTension,
      total: option.total,
      playerHasPain: result.comfortPriority > 0,
    },
    changeOptions: {
      tension,
      customization: {
        addedWeightGrams: addedWeight,
        weightPlacement: placement,
      },
    },
  });

  return (
    <Card className="bg-gradient-to-br from-white via-court-blue/5 to-court-lime/10">
      <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="text-court-blue" size={26} />
            <h3 className="text-2xl font-black text-court-ink">Counterfactual setup simulator</h3>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Start from the top recommendation, then estimate what changes when tension or added weight changes. These are transparent approximations, not lab measurements.
          </p>
          <div className="mt-5 grid gap-3">
            <label className="text-sm font-bold text-court-ink">
              String tension: {tension} lbs
              <input type="range" min="40" max="60" value={tension} onChange={(event) => setTension(Number(event.target.value))} className="mt-2 w-full accent-court-blue" />
            </label>
            <label className="text-sm font-bold text-court-ink">
              Added weight: {addedWeight}g
              <input type="range" min="0" max="12" value={addedWeight} onChange={(event) => setAddedWeight(Number(event.target.value))} className="mt-2 w-full accent-court-blue" />
            </label>
            <label className="text-sm font-bold text-court-ink">
              Weight placement
              <select value={placement} onChange={(event) => setPlacement(event.target.value)} className="focus-ring mt-2 w-full rounded-lg border border-court-line bg-white px-3 py-2 text-sm text-court-ink">
                <option value="3_and_9">3 and 9 o'clock</option>
                <option value="12">12 o'clock</option>
                <option value="throat">Throat</option>
                <option value="handle">Under grip / handle</option>
              </select>
            </label>
          </div>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-court-blue">Estimated deltas vs baseline</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <DeltaRow label="Power" value={simulation.deltas.effectivePower || 0} />
            <DeltaRow label="Control" value={simulation.deltas.effectiveControl || 0} />
            <DeltaRow label="Spin" value={simulation.deltas.effectiveSpin || 0} />
            <DeltaRow label="Comfort" value={simulation.deltas.effectiveComfort || 0} />
            <DeltaRow label="Stability" value={simulation.deltas.effectiveStability || 0} />
            <DeltaRow label="Arm risk" value={simulation.deltas.armStressWarningScore || 0} inverse />
          </div>
          <div className="mt-4 rounded-lg border border-court-line bg-white p-4">
            <p className="text-sm font-black text-court-ink">
              String-bed stiffness estimate: {simulation.changed.estimatedStringBedStiffness}/100 - confidence {simulation.confidence}/100
            </p>
            <ul className="mt-3 space-y-2">
              {simulation.explanation.map((item) => (
                <li key={item} className="text-xs leading-5 text-slate-600">{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
}

function RankedFitCard({ item, type }) {
  return (
    <div className="rounded-lg border border-court-line bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-court-blue">{type}</p>
          <h4 className="mt-2 text-lg font-black text-court-ink">{item.name}</h4>
          <p className="mt-1 text-xs text-slate-500">
            Fit {item.finalScore}/100 - confidence {item.confidenceScore}/100
          </p>
        </div>
        <span className="rounded-lg bg-white px-2 py-1 text-xs font-bold text-slate-600">{item.price}</span>
      </div>
      {item.image && (
        <div className="mt-3 overflow-hidden rounded-lg bg-white">
          <img src={item.image} alt={item.imageAlt} className="h-24 w-full object-contain p-2" />
        </div>
      )}
      <ul className="mt-3 space-y-2">
        {item.explanation.slice(0, 2).map((reason) => (
          <li key={reason} className="text-xs leading-5 text-slate-600">{reason}</li>
        ))}
      </ul>
      {type === 'String' && item.suggestedTensionRange && (
        <p className="mt-3 rounded-lg bg-white p-2 text-xs font-bold text-court-ink">Suggested tension: {item.suggestedTensionRange}</p>
      )}
      <WarningList warnings={item.warnings} />
    </div>
  );
}

function FeedbackPanel({ option, result }) {
  const [feedback, setFeedback] = useState([]);
  const [draft, setDraft] = useState({
    wouldTry: '',
    accurate: '',
    accuracyRating: 7,
    comfortRating: 7,
    confidenceRating: 7,
    mismatchReasons: [],
    comments: '',
    actualSetupUsed: '',
    consentToResearch: Boolean(result.consentToResearch),
  });
  const setupId = `${option.racket.name}|${option.string.name}|${result.primary}`;
  const current = feedback.find((item) => item.setupId === setupId);

  useEffect(() => {
    setFeedback(loadFeedback());
  }, []);

  function updateDraft(field, value) {
    setDraft((currentDraft) => ({ ...currentDraft, [field]: value }));
  }

  function toggleMismatch(reason) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      mismatchReasons: currentDraft.mismatchReasons.includes(reason)
        ? currentDraft.mismatchReasons.filter((item) => item !== reason)
        : [...currentDraft.mismatchReasons, reason],
    }));
  }

  function recordFeedback(event) {
    event.preventDefault();
    const nextEntry = {
      setupId,
      setupLabel: option.label,
      racket: option.racket.name,
      string: option.string.name,
      primary: result.primary,
      secondary: result.secondary,
      budgetTier: result.budgetTier,
      armIssue: result.armIssue,
      finalScore: option.finalScore,
      confidenceScore: option.confidenceScore,
      total: option.total,
      modelVersion: option.modelVersion,
      featureSchemaVersion: option.featureSchemaVersion,
      predictedScores: option.predictedAttributes,
      scoreComponents: option.components,
      createdAt: new Date().toISOString(),
      ...(current || {}),
      ...draft,
    };
    const next = [...feedback.filter((item) => item.setupId !== setupId), nextEntry];
    setFeedback(next);
    saveFeedback(next);
    saveRecommendationFeedback(nextEntry);
    window.dispatchEvent(new Event('courtvision-feedback'));
  }

  return (
    <form onSubmit={recordFeedback} className="mt-4 rounded-lg border border-court-line bg-white p-3">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-court-blue">Improve future fits</p>
      <div className="mt-3 grid gap-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="text-xs font-bold text-slate-600">
            Would you try it?
            <select value={draft.wouldTry} onChange={(event) => updateDraft('wouldTry', event.target.value)} className="mt-1 w-full rounded-lg border border-court-line bg-white px-3 py-2 text-court-ink">
              <option value="">Choose</option>
              <option value="yes">Yes</option>
              <option value="maybe">Maybe</option>
              <option value="no">No</option>
            </select>
          </label>
          <label className="text-xs font-bold text-slate-600">
            Did it feel accurate?
            <select value={draft.accurate} onChange={(event) => updateDraft('accurate', event.target.value)} className="mt-1 w-full rounded-lg border border-court-line bg-white px-3 py-2 text-court-ink">
              <option value="">Choose</option>
              <option value="yes">Yes</option>
              <option value="mixed">Mixed</option>
              <option value="no">No</option>
            </select>
          </label>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            ['accuracyRating', 'Accuracy'],
            ['comfortRating', 'Comfort'],
            ['confidenceRating', 'Confidence'],
          ].map(([field, label]) => (
            <label key={field} className="text-xs font-bold text-slate-600">
              {label}: {draft[field]}/10
              <input type="range" min="1" max="10" value={draft[field]} onChange={(event) => updateDraft(field, Number(event.target.value))} className="mt-1 w-full accent-court-blue" />
            </label>
          ))}
        </div>
        <div>
          <p className="text-xs font-bold text-slate-600">What felt wrong?</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {['Too expensive', 'Too stiff/harsh', 'Too advanced', 'Not enough power', 'Not enough control', 'Wrong style fit'].map((reason) => (
              <label key={reason} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700">
                <input type="checkbox" checked={draft.mismatchReasons.includes(reason)} onChange={() => toggleMismatch(reason)} className="accent-court-blue" />
                {reason}
              </label>
            ))}
          </div>
        </div>
        <input value={draft.actualSetupUsed} onChange={(event) => updateDraft('actualSetupUsed', event.target.value)} placeholder="Actual setup you use now (optional)" className="rounded-lg border border-court-line bg-white px-3 py-2 text-xs text-court-ink placeholder:text-slate-400" />
        <textarea value={draft.comments} onChange={(event) => updateDraft('comments', event.target.value)} placeholder="Extra feedback for the model (optional)" rows="2" className="rounded-lg border border-court-line bg-white px-3 py-2 text-xs text-court-ink placeholder:text-slate-400" />
        <label className="flex items-start gap-2 text-xs leading-5 text-slate-600">
          <input type="checkbox" checked={draft.consentToResearch} onChange={(event) => updateDraft('consentToResearch', event.target.checked)} className="mt-1 accent-court-blue" />
          Share this feedback in anonymous aggregate model metrics. Signed-in users still keep it in their private account when unchecked.
        </label>
        <button className="focus-ring rounded-lg bg-court-blue px-3 py-2 text-xs font-black text-white transition hover:bg-court-green hover:text-court-ink">
          Save feedback
        </button>
        {current && <p className="text-xs font-bold text-court-blue">Feedback saved for this setup.</p>}
      </div>
    </form>
  );
}

function FeedbackExport() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function refreshCount() {
      setCount(loadFeedback().length);
    }

    refreshCount();
    window.addEventListener('courtvision-feedback', refreshCount);
    return () => window.removeEventListener('courtvision-feedback', refreshCount);
  }, []);

  function exportFeedback() {
    const data = JSON.stringify(loadFeedback(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'courtvision-feedback.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button onClick={exportFeedback} className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg border border-court-ink/15 px-4 py-2 text-sm font-bold text-court-ink transition hover:border-court-blue hover:bg-court-blue/10">
      <Download size={16} />
      Export fit feedback ({count})
    </button>
  );
}

function GearImpactBlock({ result }) {
  const impacts = [
    `Your ${result.primary.toLowerCase()} profile should prioritize frames that support your natural shot shape without forcing extra effort.`,
    `The secondary ${result.secondary.toLowerCase()} lean is useful for deciding whether to bias toward more control, comfort, spin, or free power.`,
    result.comfortPriority > 0
      ? 'Because you flagged arm sensitivity, avoid very stiff strings and consider hybrid, multifilament, natural gut, or lower-tension setups first.'
      : 'Use racket specs and string tension together: a powerful frame can be calmed down with control strings, while a control frame can be opened up with livelier strings.',
  ];

  return <ListBlock title="Gear Impact" items={impacts} />;
}

function FitterDiagnosis({ recommendations }) {
  const { diagnosis, expertWarnings, decisionChangingQuestion } = recommendations;

  return (
    <Card className="bg-gradient-to-br from-white via-court-blue/5 to-court-lime/10">
      <div className="flex items-start gap-3">
        <ClipboardCheck className="mt-1 text-court-blue" />
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-court-blue">Fit diagnosis</p>
          <h3 className="mt-2 text-2xl font-black text-court-ink">{diagnosis.primaryProblem}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">Source layer: {diagnosis.sourceLabel}.</p>
        </div>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Priority stack</p>
          <ul className="mt-3 space-y-2">
            {(diagnosis.priorities.length ? diagnosis.priorities : ['Use the least extreme setup that solves the player problem.']).map((item) => (
              <li key={item} className="text-sm leading-6 text-slate-700">{item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-court-line bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">What would change this</p>
          <p className="mt-2 text-sm font-bold leading-6 text-court-ink">{decisionChangingQuestion}</p>
          {expertWarnings.length > 0 && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-amber-700">
                <AlertTriangle size={15} />
                Expert watchouts
              </div>
              <ul className="mt-2 space-y-1">
                {expertWarnings.map((warning) => <li key={warning} className="text-xs leading-5 text-amber-800">{warning}</li>)}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function ConfidencePlan({ recommendations }) {
  const mode = recommendations.confidenceMode;
  const copy = {
    one_setup: 'The profile points strongly enough in one direction to lead with one setup and one adjustment rule.',
    ranked_shortlist: 'Two or three setups solve different versions of the same problem, so GearVision ranks them with a clear purpose.',
    demo_sequence: 'The missing information matters more than pretending one answer is certain, so GearVision gives a test order.',
  };

  return (
    <Card>
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-court-blue">Confidence-aware output</p>
      <div className="mt-3 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h3 className="text-2xl font-black text-court-ink">{mode.label}: {mode.score}/100</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{copy[recommendations.recommendedOutputType]}</p>
        </div>
        <span className="rounded-lg bg-court-lime/20 px-4 py-2 text-sm font-black text-court-ink">
          {recommendations.recommendedOutputType.replaceAll('_', ' ')}
        </span>
      </div>
    </Card>
  );
}

function DemoSequence({ sequence }) {
  if (!sequence?.length) return null;

  return (
    <Card className="bg-court-ink text-white">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-court-green">Demo sequence</p>
      <h3 className="mt-2 text-2xl font-black">Test the variable, not a random list.</h3>
      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {sequence.map((item) => (
          <div key={`${item.order}-${item.racket}`} className="rounded-lg border border-white/10 bg-white/[0.08] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-court-green">Demo {item.order}</p>
            <h4 className="mt-2 text-lg font-black">{item.racket}</h4>
            <p className="mt-1 text-sm text-white/70">{item.string} / start {item.tensionStart}</p>
            <p className="mt-3 text-sm leading-6 text-white/80">{item.test}</p>
            <p className="mt-3 text-xs leading-5 text-white/60">Compare: {item.evaluationCriteria.join(', ')}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ShareResultsBlock({ result }) {
  const [status, setStatus] = useState('');

  async function share() {
    const next = await shareGearVision('results_dashboard');
    setStatus(next.ok ? 'Link copied. Send it to a teammate who knows their setup.' : 'Copy failed.');
  }

  return (
    <Card className="bg-court-ink text-white">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-court-green">Share GearVision</p>
          <h3 className="mt-2 text-2xl font-black">Know another {result.primary.toLowerCase()}?</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
            Share the quiz with a teammate. More real player profiles make the beta gear report and recommendation model stronger.
          </p>
          {status && <p className="mt-3 text-sm font-bold text-court-green">{status}</p>}
        </div>
        <button onClick={share} className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-court-green px-5 py-3 font-black text-court-ink transition hover:bg-white">
          Copy link <Share2 size={18} />
        </button>
      </div>
    </Card>
  );
}

export default function ResultsDashboard({ result }) {
  if (!result) {
    return (
      <section id="results" className="section-pad">
        <div className="mx-auto max-w-7xl">
          <Card className="text-center">
            <Target className="mx-auto text-court-blue" size={34} />
            <h2 className="mt-4 text-2xl font-black">Your gear profile will appear here</h2>
            <p className="mt-2 text-slate-600">Complete the quiz to unlock racket, string, tension, and setup recommendations.</p>
          </Card>
        </div>
      </section>
    );
  }

  const primary = playstyles[result.primary];
  const secondary = playstyles[result.secondary];
  const recommendations = buildAdvancedRecommendations(result);
  const setupOptions = recommendations.recommendedSetups;
  const player = recommendations.player;

  return (
    <section id="results" className="section-pad">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="bg-gradient-to-br from-white via-court-blue/5 to-court-lime/20">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-court-blue">Gear Profile</p>
            <h2 className="mt-3 text-4xl font-black text-court-ink">{result.primary}</h2>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-700">{primary.identity}</p>
          </Card>
          <Card>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div>
                <p className="text-sm text-slate-500">Secondary style</p>
                <h3 className="mt-2 text-2xl font-black text-court-ink">{result.secondary}</h3>
                <p className="mt-4 text-sm leading-6 text-slate-600">{secondary.identity}</p>
              </div>
              <div className="grid gap-3">
                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-court-blue">
                    <Wallet size={16} />
                    Budget
                  </div>
                  <p className="mt-1 text-sm text-slate-700">{result.budgetTier} / max {money(result.maxSetupPrice)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-court-lime">
                    <ShieldCheck size={16} />
                    Arm status
                  </div>
                  <p className="mt-1 text-sm text-slate-700">{result.armIssue}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <ListBlock title="Strengths" items={primary.strengths} />
          <GearImpactBlock result={result} />
          <ListBlock title="Setup Watchouts" items={primary.weaknesses} />
        </div>

        <div className="mt-4 grid gap-4">
          <FitterDiagnosis recommendations={recommendations} />
          <ConfidencePlan recommendations={recommendations} />
          {recommendations.recommendedOutputType === 'demo_sequence' && <DemoSequence sequence={recommendations.demoSequence} />}
        </div>

        <Card className="mt-4">
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-court-blue">Recommendation Model</p>
              <h3 className="mt-2 text-2xl font-black text-court-ink">Analytics built into the fit</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                The engine converts your quiz into a player vector, compares it with tennis archetypes, normalizes spec signals, and then applies budget, skill, and arm-safety penalties.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Closest archetype</p>
                <p className="mt-2 text-lg font-black text-court-ink">{player.primaryArchetype.name}</p>
                <p className="mt-1 text-sm text-slate-600">{player.primaryArchetype.similarity}% similarity</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Skill signal</p>
                <p className="mt-2 text-lg font-black text-court-ink">{player.skillScore}/100</p>
                <p className="mt-1 text-sm text-slate-600">{result.profileInputs?.skillLevel || 'Recreational'}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Risk controls</p>
                <p className="mt-2 text-lg font-black text-court-ink">{player.hasPain ? 'Arm-safe bias' : 'Performance bias'}</p>
                <p className="mt-1 text-sm text-slate-600">{player.budgetTier} budget model</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Candidate search</p>
                <p className="mt-2 text-lg font-black text-court-ink">{recommendations.candidateCount} setups</p>
                <p className="mt-1 text-sm text-slate-600">{recommendations.modelVersion}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="mt-4">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-court-blue">Multi-objective ranking</p>
              <h3 className="mt-2 text-2xl font-black text-court-ink">Different good answers, not one fake best.</h3>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              GearVision ranks the candidate set through separate objectives so you can see where comfort, spin, value, and transition ease disagree.
            </p>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {recommendations.objectiveRecommendations.map((objective) => (
              <div key={objective.id} className="rounded-lg border border-court-line bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-court-blue">{objective.label}</p>
                <h4 className="mt-2 text-sm font-black text-court-ink">{objective.setup.racket.name}</h4>
                <p className="mt-1 text-xs text-slate-500">{objective.setup.string.name}</p>
                <p className="mt-3 text-xs leading-5 text-slate-600">{objective.description}</p>
                <p className="mt-3 text-xs font-black text-court-ink">Fit {objective.setup.finalScore}/100 - {money(objective.setup.total)}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="mt-4 grid gap-4">
          <Card>
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div className="flex items-center gap-3">
                <Zap className="text-court-lime" />
                <h3 className="text-lg font-black">Recommended Setup Options</h3>
              </div>
              <FeedbackExport />
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Each setup is ranked by a weighted fit score from 0-100 using stroke mechanics, launch window, miss pattern, comfort needs, string durability, swingweight tolerance, and budget. Estimated totals include one racket, one string set, and about {money(STRINGING_LABOR_ESTIMATE)} for stringing labor.
            </p>
            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              {setupOptions.map((option) => (
                <div key={option.label} className="rounded-lg border border-court-line bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-court-blue">{option.label}</p>
                      <h4 className="mt-2 text-2xl font-black text-court-ink">{money(option.total)}</h4>
                      <p className="mt-1 text-xs font-bold text-slate-500">{confidenceLabel(option.confidenceScore)} - fit {option.finalScore}/100 - confidence {option.confidenceScore}/100</p>
                    </div>
                    <span className={`rounded-lg px-2 py-1 text-xs font-bold ${option.inBudget ? 'bg-court-lime/20 text-court-ink' : 'bg-white text-slate-500'}`}>
                      {bestUseLabel(option, setupOptions)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{option.intent}</p>
                  <p className="mt-3 rounded-lg border border-court-line bg-white p-3 text-xs font-bold leading-5 text-court-ink">{option.chooseIf}</p>
                  <ScoreBreakdown components={option.components} />

                  <div className="mt-4 overflow-hidden rounded-lg bg-white">
                    <img src={option.racket.image} alt={option.racket.imageAlt} className="h-32 w-full object-contain p-3" />
                  </div>

                  <div className="mt-4 space-y-3 text-sm">
                    <div>
                      <p className="font-bold text-court-blue">Racket</p>
                      <p className="text-slate-700">{option.racket.name}</p>
                      <p className="text-xs text-slate-500">{option.racket.price} / {option.racket.archetype}</p>
                    </div>
                    <div>
                      <p className="font-bold text-court-lime">String</p>
                      <p className="text-slate-700">{option.string.name}</p>
                      <p className="text-xs text-slate-500">{option.string.price} / {option.string.stringType}</p>
                    </div>
                    <div className="rounded-lg border border-court-line bg-white p-3 text-xs leading-5 text-slate-600">
                      <p className="font-bold text-court-ink">Tension plan</p>
                      <p>Start: {option.tensionPlan.startingPoint}</p>
                      <p>Range: {option.tensionPlan.range}</p>
                      <p className="mt-1 text-slate-500">{option.tensionPlan.rationale}</p>
                      <ul className="mt-2 space-y-1">
                        {option.adjustmentRules.map((rule) => <li key={rule}>{rule}</li>)}
                      </ul>
                    </div>
                    <div className="rounded-lg border border-court-line bg-white p-3 text-xs leading-5 text-slate-600">
                      Racket {option.racket.price} + string {option.string.price} + labor {money(STRINGING_LABOR_ESTIMATE)}
                    </div>
                    <div className="rounded-lg border border-court-line bg-white p-3 text-xs leading-5 text-slate-600">
                      <span className="font-bold text-court-ink">Why this fits:</span> {option.explanation.join(' | ')}
                    </div>
                    <div className="rounded-lg border border-court-line bg-white p-3 text-xs leading-5 text-slate-600">
                      <span className="font-bold text-court-ink">What would change it:</span> {option.whatWouldChange}
                    </div>
                    <WarningList warnings={option.warnings} />
                  </div>
                  <FeedbackPanel option={option} result={result} />
                </div>
              ))}
            </div>
          </Card>

          {setupOptions[0] && <SetupSimulator option={setupOptions[0]} result={result} />}

          <ShareResultsBlock result={result} />

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <h3 className="text-lg font-black text-court-ink">Top 3 Rackets</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">Ranked independently before string pairing, so you can see the model's frame choices clearly.</p>
              <div className="mt-4 grid gap-3">
                {recommendations.topRackets.map((racket) => <RankedFitCard key={racket.name} item={racket} type="Racket" />)}
              </div>
            </Card>
            <Card>
              <h3 className="text-lg font-black text-court-ink">Top 3 Strings</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">Ranked for your comfort, spin, control, budget, and durability profile.</p>
              <div className="mt-4 grid gap-3">
                {recommendations.topStrings.map((string) => <RankedFitCard key={string.name} item={string} type="String" />)}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
