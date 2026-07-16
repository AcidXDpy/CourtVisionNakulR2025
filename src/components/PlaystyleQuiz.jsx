import { RotateCcw, Trophy } from 'lucide-react';
import { useState } from 'react';
import { quizProfileFields, quizQuestions, quizSliders, scoreQuiz } from '../data/playstyles.js';
import { trackEvent } from '../lib/analytics.js';
import Card from './Card.jsx';

const consultSteps = [
  {
    title: 'Player baseline',
    eyebrow: 'Step 1 of 6',
    description: 'Start with level, body context, current setup, and budget so the model does not recommend gear outside the player in front of it.',
    fieldIds: ['skillLevel', 'age', 'height', 'weight', 'currentRacket', 'currentString', 'currentTension', 'budgetAmount', 'demoReadiness'],
    questionIds: ['budget'],
    sliderIds: [],
  },
  {
    title: 'Stroke mechanics',
    eyebrow: 'Step 2 of 6',
    description: 'These are the highest-value fitting signals: how you swing, create pace, shape the ball, and start points.',
    fieldIds: ['playingStyle', 'swingSpeed', 'strokeLength', 'paceGeneration', 'topspinLevel', 'serveImportance'],
    questionIds: ['rallyLength', 'wingStrength', 'serveStrength'],
    sliderIds: ['spinIntent', 'powerIntent', 'serveReliance'],
  },
  {
    title: 'Ball flight and misses',
    eyebrow: 'Step 3 of 6',
    description: 'Launch window and miss pattern separate similar rackets better than generic power/control labels.',
    fieldIds: ['launchPreference', 'missPattern', 'courtPositionPreference', 'swingweightTolerance', 'fatigueBreakdown'],
    questionIds: ['spinProfile', 'courtPosition', 'defense'],
    sliderIds: ['controlIntent', 'maneuverabilityNeed'],
  },
  {
    title: 'Problem diagnosis',
    eyebrow: 'Step 4 of 6',
    description: 'Translate fuzzy requests like control, feel, spin, and power into equipment changes the model can actually act on.',
    fieldIds: ['powerControlPreference', 'controlMeaning', 'powerMeaning', 'feelMeaning', 'spinMeaning', 'setupDislikes'],
    questionIds: ['riskTolerance', 'netComfort', 'secondServe', 'weakness'],
    sliderIds: ['rallyTolerance', 'netIntent', 'riskIntent'],
  },
  {
    title: 'Comfort and durability',
    eyebrow: 'Step 5 of 6',
    description: 'Arm status and string break frequency behave like constraints, especially for polyester and tension choices.',
    fieldIds: ['painArea', 'painSeverity', 'stringBreakFrequency'],
    questionIds: ['armHealth'],
    sliderIds: ['comfortNeed', 'durabilityNeed'],
  },
  {
    title: 'Review and consent',
    eyebrow: 'Step 6 of 6',
    description: 'Review the profile, choose whether to share anonymous research data, then generate the fitter-style report.',
    fieldIds: [],
    questionIds: [],
    sliderIds: [],
  },
];

export default function PlaystyleQuiz({ answers, setAnswers, onComplete, onReset }) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = consultSteps[currentStep];
  const fieldById = Object.fromEntries(quizProfileFields.map((field) => [field.id, field]));
  const questionById = Object.fromEntries(quizQuestions.map((question) => [question.id, question]));
  const sliderById = Object.fromEntries(quizSliders.map((slider) => [slider.id, slider]));
  const answeredChoiceCount = quizQuestions.filter((question) => Number.isInteger(answers[question.id])).length;
  const answeredCount = answeredChoiceCount + quizSliders.length + quizProfileFields.length;
  const totalInputs = quizQuestions.length + quizSliders.length + quizProfileFields.length;
  const complete = answeredChoiceCount === quizQuestions.length;
  const stepQuestions = step.questionIds.map((id) => questionById[id]).filter(Boolean);
  const stepFields = step.fieldIds.map((id) => fieldById[id]).filter(Boolean);
  const stepSliders = step.sliderIds.map((id) => sliderById[id]).filter(Boolean);
  const stepComplete = stepQuestions.every((question) => Number.isInteger(answers[question.id]));
  const firstStep = currentStep === 0;
  const lastStep = currentStep === consultSteps.length - 1;

  function choose(questionId, optionIndex) {
    if (!answers.__started) trackEvent('quiz_started', { source: 'first_answer' });
    setAnswers((current) => ({ ...current, __started: true, [questionId]: optionIndex }));
  }

  function chooseSlider(sliderId, value) {
    setAnswers((current) => ({ ...current, [sliderId]: Number(value) }));
  }

  function chooseProfileField(fieldId, value) {
    setAnswers((current) => ({ ...current, [fieldId]: value }));
  }

  function sliderValue(slider) {
    return Number(answers[slider.id] ?? slider.defaultValue);
  }

  function profileValue(field) {
    return answers[field.id] ?? field.defaultValue;
  }

  function finishQuiz() {
    if (!complete) return;
    const sliderDefaults = Object.fromEntries(quizSliders.map((slider) => [slider.id, slider.defaultValue]));
    const profileDefaults = Object.fromEntries(quizProfileFields.map((field) => [field.id, field.defaultValue]));
    onComplete({
      ...scoreQuiz({ ...sliderDefaults, ...profileDefaults, ...answers }),
      consentToResearch: Boolean(answers.researchConsent),
    });
  }

  function goNext() {
    if (!stepComplete) return;
    setCurrentStep((value) => Math.min(consultSteps.length - 1, value + 1));
  }

  function goBack() {
    setCurrentStep((value) => Math.max(0, value - 1));
  }

  function renderProfileField(field) {
    const sharedClassName = 'focus-ring mt-2 w-full rounded-lg border border-court-line bg-white px-3 py-2 text-sm text-court-ink outline-none transition focus:border-court-blue';

    if (field.type === 'select') {
      return (
        <select value={profileValue(field)} onChange={(event) => chooseProfileField(field.id, event.target.value)} className={sharedClassName}>
          {field.options.map((option) => <option key={option}>{option}</option>)}
        </select>
      );
    }

    if (field.type === 'range') {
      const value = Number(profileValue(field));
      return (
        <div>
          <div className="mt-2 flex items-center gap-3">
            <input
              aria-label={field.label}
              type="range"
              min="1"
              max="10"
              step="1"
              value={value}
              onChange={(event) => chooseProfileField(field.id, Number(event.target.value))}
              className="w-full accent-court-blue"
            />
            <span className="w-12 rounded-lg bg-court-lime/20 px-2 py-1 text-center text-sm font-black text-court-ink">{value}/10</span>
          </div>
        </div>
      );
    }

    if (field.type === 'textarea') {
      return (
        <textarea
          value={profileValue(field)}
          onChange={(event) => chooseProfileField(field.id, event.target.value)}
          placeholder={field.placeholder}
          rows="3"
          className={`${sharedClassName} min-h-24 resize-y`}
        />
      );
    }

    return (
      <input
        value={profileValue(field)}
        onChange={(event) => chooseProfileField(field.id, event.target.value)}
        type={field.type}
        placeholder={field.placeholder}
        min={field.type === 'number' ? '0' : undefined}
        className={sharedClassName}
      />
    );
  }

  return (
    <section id="quiz" className="section-pad border-y border-court-line bg-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-court-blue">Expert-Fitter Consult</p>
            <h2 className="mt-2 text-3xl font-black text-court-ink sm:text-4xl">{step.title}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{step.description}</p>
          </div>
          <div className="soft-panel min-w-64 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">{step.eyebrow}</span>
              <span className="font-bold">{answeredCount}/{totalInputs}</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-gradient-to-r from-court-blue to-court-green transition-all" style={{ width: `${((currentStep + 1) / consultSteps.length) * 100}%` }} />
            </div>
          </div>
        </div>

        {stepFields.length > 0 && (
          <Card className="mb-8 bg-gradient-to-br from-white via-court-blue/5 to-court-lime/10">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-court-blue">Fitter Inputs</p>
                <h3 className="mt-2 text-2xl font-black text-court-ink">Signals for this step</h3>
              </div>
              <p className="max-w-2xl text-sm leading-6 text-slate-600">
                The model uses these answers to diagnose the equipment problem before ranking products.
              </p>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {stepFields.map((field) => (
                <label key={field.id} className={field.type === 'textarea' ? 'md:col-span-2 lg:col-span-3' : ''}>
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{field.label}</span>
                  {renderProfileField(field)}
                </label>
              ))}
            </div>
          </Card>
        )}

        {stepQuestions.length > 0 && (
          <div className="grid gap-4 lg:grid-cols-2">
            {stepQuestions.map((question) => (
              <Card key={question.id}>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-court-blue">Decision signal</p>
                <h3 className="mt-2 text-lg font-bold text-court-ink">{question.question}</h3>
                {question.id === 'armHealth' && (
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    This is gear guidance, not medical advice. Pain that changes your swing is worth checking with a qualified clinician or coach.
                  </p>
                )}
                <div className="mt-4 grid gap-2">
                  {question.options.map((option, optionIndex) => {
                    const selected = answers[question.id] === optionIndex;
                    return (
                      <button
                        key={option.label}
                        onClick={() => choose(question.id, optionIndex)}
                        className={`focus-ring rounded-lg border px-4 py-3 text-left text-sm transition ${
                          selected ? 'border-court-green bg-court-green/25 text-court-ink' : 'border-court-line bg-slate-50 text-slate-700 hover:border-court-blue/60 hover:bg-court-blue/5'
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
        )}

        {stepSliders.length > 0 && (
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {stepSliders.map((slider) => {
              const value = sliderValue(slider);

              return (
                <Card key={slider.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-court-blue">1-10 scale</p>
                      <h4 className="mt-2 text-lg font-black text-court-ink">{slider.label}</h4>
                    </div>
                    <span className="rounded-lg bg-court-lime/20 px-3 py-1 text-sm font-black text-court-ink">{value}/10</span>
                  </div>
                  <input
                    aria-label={slider.label}
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={value}
                    onChange={(event) => chooseSlider(slider.id, event.target.value)}
                    className="mt-5 w-full accent-court-blue"
                  />
                  <div className="mt-2 flex justify-between gap-4 text-xs font-bold text-slate-500">
                    <span>{slider.lowLabel}</span>
                    <span className="text-right">{slider.highLabel}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {lastStep && (
          <Card className="mt-8 bg-slate-50">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-court-blue">Ready to score</p>
            <h3 className="mt-2 text-2xl font-black text-court-ink">GearVision will rank complete setups, not isolated rackets.</h3>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              The report will include a diagnosis, confidence mode, racket/string/tension plan, watchouts, and the question that would most change the recommendation.
            </p>
            <label className="mt-5 flex max-w-3xl items-start gap-3 rounded-lg border border-court-line bg-white p-4 text-sm leading-6 text-slate-600">
              <input
                type="checkbox"
                checked={Boolean(answers.researchConsent)}
                onChange={(event) => setAnswers((current) => ({ ...current, researchConsent: event.target.checked }))}
                className="mt-1 h-4 w-4 shrink-0 accent-court-blue"
              />
              <span>
                <span className="font-bold text-court-ink">Share anonymous quiz data for model improvement.</span> Optional: no name or email is used in public metrics. If you are signed in, the result can still save privately to your account when this is unchecked.
              </span>
            </label>
          </Card>
        )}

        {!stepComplete && (
          <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-800">
            Answer the decision signal{stepQuestions.length > 1 ? 's' : ''} on this step to continue.
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={goBack}
            disabled={firstStep}
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg border border-court-ink/15 px-5 py-3 font-bold text-court-ink transition hover:border-court-blue hover:bg-court-blue/10 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Back
          </button>
          {!lastStep ? (
            <button
              onClick={goNext}
              disabled={!stepComplete}
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-court-green px-5 py-3 font-black text-court-ink transition hover:bg-court-blue hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
            >
              Next step
            </button>
          ) : (
            <button
              onClick={finishQuiz}
              disabled={!complete}
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-court-green px-5 py-3 font-black text-court-ink transition hover:bg-court-blue hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Trophy size={18} />
              Show my fitter report
            </button>
          )}
          <button onClick={onReset} className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg border border-court-ink/15 px-5 py-3 font-bold text-court-ink transition hover:border-court-blue hover:bg-court-blue/10 sm:ml-auto">
            <RotateCcw size={18} />
            Reset quiz
          </button>
        </div>
      </div>
    </section>
  );
}
