import { ArrowRight, HeartHandshake, Recycle } from 'lucide-react';
import Card from './Card.jsx';

const impactCards = [
  {
    title: 'Play It Forward',
    description: 'Sponsor tennis gear for players who need help affording their setup.',
    button: 'Support a Player',
    href: '/play-it-forward',
    icon: HeartHandshake,
  },
  {
    title: 'Recycle Tennis Balls',
    description: 'Donate used tennis balls to shelters, senior homes, schools, and beginner programs.',
    button: 'Donate Balls',
    href: '/recycle',
    icon: Recycle,
  },
];

export default function CourtVisionImpact() {
  return (
    <section className="section-pad bg-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-court-blue">CourtVision Impact</p>
            <h2 className="mt-2 max-w-3xl text-4xl font-black leading-tight text-court-ink sm:text-5xl">
              Gear advice should lead to gear access.
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-8 text-slate-600 lg:justify-self-end">
            CourtVision can grow beyond recommendations by helping local players get equipment and giving used tennis balls a practical second life.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {impactCards.map(({ title, description, button, href, icon: Icon }) => (
            <Card key={title} className="group bg-gradient-to-br from-white via-slate-50 to-court-lime/10">
              <div className="flex min-h-64 flex-col justify-between gap-8">
                <div>
                  <div className="grid h-12 w-12 place-items-center rounded-lg bg-court-blue text-white transition group-hover:bg-court-green group-hover:text-court-ink">
                    <Icon size={24} />
                  </div>
                  <h3 className="mt-5 text-3xl font-black text-court-ink">{title}</h3>
                  <p className="mt-3 max-w-xl text-base leading-7 text-slate-600">{description}</p>
                </div>
                <a href={href} className="focus-ring inline-flex w-fit items-center justify-center gap-2 rounded-lg bg-court-green px-5 py-3 font-black text-court-ink transition hover:bg-court-blue hover:text-white">
                  {button} <ArrowRight size={18} />
                </a>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
