import { ArrowRight, BookOpen, Target } from 'lucide-react';
import { gearGuides } from '../data/gearGuides.js';
import { trackEvent } from '../lib/analytics.js';
import Card from './Card.jsx';

export default function GearGuidesPage() {
  return (
    <section id="guides" className="section-pad bg-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-court-blue">Gear guides</p>
            <h1 className="mt-2 text-5xl font-black leading-tight text-court-ink sm:text-6xl">Learn the setup tradeoffs.</h1>
          </div>
          <p className="max-w-2xl text-base leading-8 text-slate-600 lg:justify-self-end">
            Short explainers for common racket, string, and tension questions. The guides are educational, then the quiz personalizes the answer.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {gearGuides.map((guide) => (
            <Card key={guide.slug} as="article" className="bg-slate-50">
              <BookOpen className="text-court-blue" size={26} />
              <h2 className="mt-4 text-2xl font-black leading-tight text-court-ink">{guide.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{guide.summary}</p>
              <ul className="mt-4 space-y-2">
                {guide.takeaways.map((takeaway) => (
                  <li key={takeaway} className="flex gap-2 text-sm leading-6 text-slate-700">
                    <Target className="mt-1 shrink-0 text-court-green" size={15} />
                    {takeaway}
                  </li>
                ))}
              </ul>
              <p className="mt-5 rounded-lg border border-court-line bg-white p-3 text-xs leading-5 text-slate-500">
                GearVision recommendations are educational. Demo rackets and strings when possible before buying.
              </p>
              <a
                onClick={() => trackEvent('gear_guide_clicked', { guide: guide.slug })}
                href="/#quiz"
                className="focus-ring mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-court-blue px-4 py-3 text-sm font-black text-white transition hover:bg-court-green hover:text-court-ink"
              >
                Take the setup quiz <ArrowRight size={17} />
              </a>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
