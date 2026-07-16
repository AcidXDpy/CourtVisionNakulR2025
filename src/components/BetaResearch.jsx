import { ArrowRight, BarChart3, ClipboardCheck, QrCode, Share2 } from 'lucide-react';
import { useState } from 'react';
import { trackEvent } from '../lib/analytics.js';
import { shareGearVision } from '../lib/share.js';
import Card from './Card.jsx';

export default function BetaResearch({ onStartQuiz }) {
  const [shareStatus, setShareStatus] = useState('');

  function contribute() {
    trackEvent('hero_cta_clicked', { target: 'beta_report' });
    onStartQuiz();
  }

  async function share() {
    const result = await shareGearVision('beta_research');
    setShareStatus(result.ok ? 'Link copied for a teammate.' : 'Copy failed.');
  }

  return (
    <section className="section-pad bg-white">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-stretch">
        <Card className="bg-gradient-to-br from-white via-court-blue/5 to-court-lime/15">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-court-blue">Beta research</p>
          <h2 className="mt-3 max-w-4xl text-4xl font-black leading-tight text-court-ink sm:text-5xl">
            Help build the Player Gear Report.
          </h2>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
            We are collecting opt-in player profiles to study how level, playstyle, arm health, budget, and equipment choices connect. Take the quiz, get a setup recommendation, and help turn real player inputs into a useful public gear report.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button onClick={contribute} className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-court-blue px-5 py-3 font-black text-white transition hover:bg-court-green hover:text-court-ink">
              Take the quiz <ArrowRight size={18} />
            </button>
            <a onClick={() => trackEvent('gear_guide_clicked', { source: 'beta_research' })} href="/methodology" className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg border border-court-ink/15 px-5 py-3 font-black text-court-ink transition hover:border-court-blue hover:bg-court-blue/10">
              How the model works <BarChart3 size={18} />
            </a>
          </div>
          <p className="mt-4 text-sm font-bold text-slate-500">Profile count will appear once the beta dataset is connected to public reporting.</p>
        </Card>

        <div className="grid gap-4">
          <Card className="bg-court-ink text-white">
            <QrCode className="text-court-green" size={30} />
            <h3 className="mt-4 text-2xl font-black">Share GearVision with a teammate</h3>
            <p className="mt-3 text-sm leading-6 text-white/70">
              The best beta feedback comes from players who know what they use, what hurts, and what they want the ball to do.
            </p>
            <button onClick={share} className="focus-ring mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-court-green px-4 py-3 text-sm font-black text-court-ink transition hover:bg-white">
              Copy link <Share2 size={17} />
            </button>
            {shareStatus && <p className="mt-3 text-sm font-bold text-court-green">{shareStatus}</p>}
          </Card>
          <Card className="bg-white">
            <ClipboardCheck className="text-court-blue" size={28} />
            <h3 className="mt-4 text-2xl font-black text-court-ink">Feedback is being collected carefully</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Public quotes and results will only appear after real players choose to share them. Until then, the beta stays focused on useful setup data.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}
