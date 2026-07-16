import { BarChart3, Brain, ShieldCheck } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Radar,
  RadarChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { FEATURE_SCHEMA_VERSION, MODEL_ASSUMPTIONS, RECOMMENDATION_MODEL_VERSION } from '../data/recommendationModel.js';
import { featureSchema } from '../lib/featureEngineering.js';
import { modelFeatureRows } from '../lib/modelEvaluation.js';
import Card from './Card.jsx';

const radarData = [
  { trait: 'Spin', player: 86, setup: 82, mismatch: 48 },
  { trait: 'Control', player: 72, setup: 76, mismatch: 52 },
  { trait: 'Comfort', player: 64, setup: 78, mismatch: 39 },
  { trait: 'Power', player: 58, setup: 61, mismatch: 88 },
  { trait: 'Budget', player: 70, setup: 84, mismatch: 42 },
];

export default function MethodologyPage() {
  return (
    <section id="methodology" className="section-pad bg-white">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-court-blue">Model Methodology</p>
            <h1 className="mt-3 text-5xl font-black leading-tight text-court-ink sm:text-6xl">Transparent tennis decision science.</h1>
          </div>
          <p className="max-w-2xl text-base leading-8 text-slate-600 lg:justify-self-end">
            GearVision is an explainable scoring system: it turns quiz answers into player features, compares them with racket and string traits, applies risk penalties, and improves through opt-in feedback.
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {[
            { icon: Brain, title: 'Feature engineering', text: 'Inputs become player vectors for spin, power, control, comfort, serve reliance, budget, swing speed, and skill.' },
            { icon: BarChart3, title: 'Weighted scoring', text: 'Each setup receives fit, confidence, comfort, budget, safety, and archetype similarity components.' },
            { icon: ShieldCheck, title: 'Honest limits', text: 'The current engine is rule-based and explainable. Real predictive claims require user outcome data.' },
          ].map(({ icon: Icon, title, text }) => (
            <Card key={title}>
              <Icon className="text-court-blue" size={28} />
              <h2 className="mt-4 text-xl font-black text-court-ink">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
            </Card>
          ))}
        </div>

        <Card className="mt-4">
          <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-court-blue">Production model</p>
              <h2 className="mt-2 text-2xl font-black text-court-ink">Versioned, explainable, and still honest.</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                The live engine is a deterministic decision model, not a black-box ML model. It is designed so future feedback data can evaluate or replace pieces of the scoring system.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border border-court-line bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Model version</p>
                <p className="mt-2 text-sm font-black text-court-ink">{RECOMMENDATION_MODEL_VERSION}</p>
              </div>
              <div className="rounded-lg border border-court-line bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Feature schema</p>
                <p className="mt-2 text-sm font-black text-court-ink">{FEATURE_SCHEMA_VERSION}</p>
              </div>
              <div className="rounded-lg border border-court-line bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Feature count</p>
                <p className="mt-2 text-sm font-black text-court-ink">{featureSchema.playerFeatures.length + featureSchema.equipmentFeatures.length + featureSchema.setupFeatures.length} tracked signals</p>
              </div>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {MODEL_ASSUMPTIONS.map((assumption) => (
              <div key={assumption} className="rounded-lg bg-white p-3 text-sm leading-6 text-slate-600 ring-1 ring-court-line">
                {assumption}
              </div>
            ))}
          </div>
        </Card>

        <div className="mt-4 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <Card>
            <h2 className="text-xl font-black text-court-ink">Player vector vs setup fit</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">A good recommendation is not just the highest-performance gear. It is the closest useful match to the player vector after comfort, skill, and budget penalties.</p>
            <div className="mt-5 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="trait" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar name="Player" dataKey="player" stroke="#047EA8" fill="#047EA8" fillOpacity={0.16} />
                  <Radar name="Recommended" dataKey="setup" stroke="#8CFF00" fill="#8CFF00" fillOpacity={0.22} />
                  <Radar name="Mismatch" dataKey="mismatch" stroke="#94A3B8" fill="#94A3B8" fillOpacity={0.08} />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-black text-court-ink">Feature weights</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Weights are visible by design so the project reads as decision support, not a black-box fitting authority.</p>
            <div className="mt-5 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modelFeatureRows}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="feature" tick={{ fontSize: 11 }} interval={0} angle={-18} textAnchor="end" height={72} />
                  <YAxis domain={[0, 30]} />
                  <Tooltip />
                  <Bar dataKey="weight" fill="#047EA8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <Card className="mt-4">
          <h2 className="text-xl font-black text-court-ink">Model pipeline</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-5">
            {['Quiz inputs', 'Feature vector', 'Constraint filter', 'Setup simulator', 'Feedback evaluation'].map((step, index) => (
              <div key={step} className="rounded-lg border border-court-line bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-court-blue">Step {index + 1}</p>
                <h3 className="mt-2 text-sm font-black text-court-ink">{step}</h3>
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm leading-6 text-slate-600">
            The next statistical milestone is calibration: comparing predicted confidence with real feedback accuracy. Until GearVision has enough opt-in responses, dashboard metrics are labeled as early signals rather than proof.
          </p>
        </Card>
      </div>
    </section>
  );
}
