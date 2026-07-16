import { Activity, HeartHandshake, Sigma } from 'lucide-react';
import Card from './Card.jsx';

const points = [
  {
    icon: Activity,
    title: 'Tennis first',
    body: 'The product starts from real court problems: launch angle, comfort, depth, spin, timing, and confidence in your setup.',
  },
  {
    icon: Sigma,
    title: 'Statistics-minded',
    body: 'GearVision turns quiz answers into player vectors, setup scores, confidence, and feedback loops that can improve with real data.',
  },
  {
    icon: HeartHandshake,
    title: 'Access matters',
    body: 'The long-term goal is not just better recommendations. It is using gear data to understand what local players need and where support can help.',
  },
];

export default function AboutGearVision() {
  return (
    <section className="section-pad bg-slate-50">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-court-blue">Why it exists</p>
          <h2 className="mt-2 text-4xl font-black leading-tight text-court-ink sm:text-5xl">Gear advice should be explainable.</h2>
          <p className="mt-4 text-base leading-8 text-slate-600">
            GearVision combines tennis experience, statistical thinking, recommendation logic, and feedback data. It explains its reasoning, asks what happened after the recommendation, and avoids pretending to replace demos, coaches, or professional fitting.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {points.map(({ icon: Icon, title, body }) => (
            <Card key={title} className="bg-white">
              <Icon className="text-court-blue" size={28} />
              <h3 className="mt-4 text-xl font-black text-court-ink">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
