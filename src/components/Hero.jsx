import { ArrowRight, Cable, Gauge, Sparkles } from 'lucide-react';

export default function Hero({ onStartQuiz }) {
  return (
    <section id="home" className="section-pad hero-parallax relative overflow-hidden lg:min-h-[calc(100vh-72px)]">
      <div className="court-lines" aria-hidden="true" />
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.82fr_1.18fr]">
        <div className="reveal-up relative z-10">
          <p className="mb-4 inline-flex rounded-lg border border-court-lime/40 bg-court-lime/10 px-3 py-1 text-sm font-semibold text-court-lime">
            Gear intelligence
          </p>
          <h1 className="max-w-4xl text-5xl font-black leading-tight text-court-ink sm:text-6xl lg:text-7xl">
            Gear Vision
            <span className="block accent-text">for smarter tennis gear.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Discover how your racket, strings, tension, and frame specs can change your power, spin, control, comfort, and confidence on court.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button onClick={onStartQuiz} className="focus-ring action-button inline-flex items-center justify-center gap-2 rounded-lg bg-court-green px-5 py-3 font-bold text-court-ink hover:bg-court-blue hover:text-white">
              Take the quiz <ArrowRight size={18} />
            </button>
            <a href="#gear" className="focus-ring action-button inline-flex items-center justify-center rounded-lg border border-court-ink/15 px-5 py-3 font-bold text-court-ink hover:border-court-blue hover:bg-court-blue/10">
              Browse gear
            </a>
          </div>
        </div>

        <div className="reveal-up relative min-h-[520px] overflow-hidden rounded-lg border border-white/10 bg-court-panel shadow-card [animation-delay:140ms]">
          <img src="/images/editorial/sinner-clay.jpg" alt="Tennis player striking on a clay court" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-court-ink/95 via-court-ink/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-court-ink/80 via-transparent to-court-ink/15" />
          <div className="absolute left-6 top-6 text-[clamp(4rem,11vw,9rem)] font-black leading-none tracking-normal text-white/20 sm:left-8">
            GEAR
          </div>
          <div className="absolute bottom-5 left-5 right-5 grid gap-4 sm:bottom-6 sm:left-6 sm:right-6 lg:grid-cols-[1fr_0.82fr]">
            <div className="rounded-lg border border-white/10 bg-black/35 p-4 backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-300">Live profile</p>
                  <h2 className="mt-1 text-2xl font-black text-white">Aggressive Baseliner</h2>
                </div>
                <Sparkles className="text-court-lime" />
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  ['Power', '88%'],
                  ['Control', '74%'],
                  ['Spin', '81%'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-white/10 bg-white/[0.08] p-3">
                    <p className="text-xs text-slate-300">{label}</p>
                    <p className="stat-pop mt-1 text-xl font-black text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-3">
              <div className="rounded-lg border border-white/10 bg-white/[0.08] p-4 backdrop-blur">
                <Gauge className="mb-3 text-court-blue" />
                <h3 className="font-bold text-white">Frame effects</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">Weight, stiffness, swingweight, and head size shift what the ball does after contact.</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.08] p-4 backdrop-blur">
                <Cable className="mb-3 text-court-lime" />
                <h3 className="font-bold text-white">String tuning</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">Tension and material tune launch, snapback, feel, and arm comfort.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
