import { Activity, Database, HeartHandshake, Recycle } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fetchPublicDashboardMetrics } from '../lib/supabaseClient.js';
import { buildEvaluationKpis, buildImpactKpis, normalizeMetrics, sampleSizeWarning } from '../lib/modelEvaluation.js';
import Card from './Card.jsx';

const COLORS = ['#047EA8', '#8CFF00', '#0F172A', '#94A3B8', '#14B8A6'];

function StatCard({ label, value, caption }) {
  return (
    <Card>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-court-blue">{label}</p>
      <p className="mt-2 text-3xl font-black text-court-ink">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{caption}</p>
    </Card>
  );
}

export default function ImpactDashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let active = true;

    async function loadMetrics() {
      const response = await fetchPublicDashboardMetrics();
      if (!active) return;
      setMetrics(normalizeMetrics(response.data));
      setStatus(response.ok ? 'live' : response.skipped ? 'local' : 'error');
    }

    loadMetrics();
    return () => {
      active = false;
    };
  }, []);

  const data = normalizeMetrics(metrics);
  const evaluationKpis = buildEvaluationKpis(data);
  const impactKpis = buildImpactKpis(data);
  const sampleWarning = sampleSizeWarning(data.feedback_count);
  const funnelData = [
    { name: 'Nominations', value: data.player_nominations },
    { name: 'Players helped', value: data.impact_stats.playersHelped },
    { name: 'Ball donations', value: data.ball_donations },
    { name: 'Organizations helped', value: data.impact_stats.organizationsHelped },
  ];

  return (
    <section id="impact" className="section-pad bg-white">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-court-blue">Impact Dashboard</p>
            <h1 className="mt-3 text-5xl font-black leading-tight text-court-ink sm:text-6xl">The dataset behind the product.</h1>
          </div>
          <p className="max-w-2xl text-base leading-8 text-slate-600 lg:justify-self-end">
            This page shows public-safe aggregate metrics only. Raw quiz feedback, nominations, emails, and donation logistics stay private inside Supabase.
          </p>
        </div>

        <div className="mt-6 rounded-lg border border-court-line bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          <span className="font-bold text-court-ink">Data status:</span> {status === 'live' ? 'Connected to Supabase aggregate view.' : status === 'loading' ? 'Loading aggregate metrics.' : 'Using empty-state metrics until Supabase data is available.'} {sampleWarning}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {evaluationKpis.map((kpi) => <StatCard key={kpi.label} {...kpi} />)}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card>
            <div className="flex items-center gap-3">
              <Activity className="text-court-blue" />
              <h2 className="text-xl font-black text-court-ink">Confidence calibration</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">As feedback grows, this checks whether high confidence actually corresponds to higher accuracy.</p>
            <div className="mt-5 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.confidence_calibration}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="bucket" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="accuracy" stroke="#047EA8" strokeWidth={3} dot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <Database className="text-court-blue" />
              <h2 className="text-xl font-black text-court-ink">Player archetypes</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">Opt-in quiz submissions become an aggregate view of what player profiles GearVision is serving.</p>
            <div className="mt-5 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.archetype_distribution} dataKey="value" nameKey="name" outerRadius={92} label>
                    {data.archetype_distribution.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {impactKpis.map((kpi) => <StatCard key={kpi.label} {...kpi} />)}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <Card>
            <div className="flex items-center gap-3">
              <HeartHandshake className="text-court-blue" />
              <h2 className="text-xl font-black text-court-ink">Impact funnel</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">The community side turns gear advice into gear access and local reuse.</p>
            <div className="mt-5 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-12} textAnchor="end" height={58} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#047EA8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <Recycle className="text-court-blue" />
              <h2 className="text-xl font-black text-court-ink">Mismatch reasons</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">This is how the model learns what users reject: price, stiffness, skill mismatch, or feel.</p>
            <div className="mt-5 space-y-3">
              {(data.mismatch_reasons.length ? data.mismatch_reasons : [{ name: 'Waiting for feedback', value: 0 }]).map((item) => (
                <div key={item.name}>
                  <div className="mb-1 flex justify-between text-xs text-slate-500">
                    <span>{item.name}</span>
                    <span>{item.value}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-gradient-to-r from-court-blue to-court-green" style={{ width: `${Math.min(100, Math.max(4, item.value * 16))}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
