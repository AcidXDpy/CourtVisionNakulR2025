import { ArrowRight, Building2, GraduationCap, Home, PawPrint, Recycle, School } from 'lucide-react';
import Card from './Card.jsx';
import { Field, ImpactFeatureCard, ImpactStatCard, useLocalForm } from './ImpactShared.jsx';
import { saveBallDonation } from '../lib/supabaseClient.js';

const ballDonationDefaults = {
  donorName: '',
  email: '',
  ballCount: '',
  organization: '',
  preference: 'Pickup',
  location: '',
  notes: '',
};

const reuseCards = [
  { icon: PawPrint, title: 'Animal shelters', description: 'Dead tennis balls can become enrichment toys for dogs and shelter programs.' },
  { icon: Home, title: 'Senior homes', description: 'Tennis balls can help with walkers, chair legs, and safer movement in shared spaces.' },
  { icon: School, title: 'Schools', description: 'Used balls can reduce classroom noise when placed on chair or desk legs.' },
  { icon: GraduationCap, title: 'Beginner programs', description: 'Practice balls are useful for first-time players, clinics, and low-pressure drills.' },
];

function BallDonationForm() {
  const { values, success, remoteStatus, updateValue, submit } = useLocalForm(ballDonationDefaults, 'Gear Vision ball donation', saveBallDonation);

  return (
    <Card as="form" onSubmit={submit} className="bg-white">
      <div className="flex items-center gap-3">
        <Recycle className="text-court-blue" />
        <h2 className="text-2xl font-black text-court-ink">Donate Balls</h2>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Share how many used tennis balls you have and where pickup or dropoff would make sense. Submissions can save to the Gear Vision Supabase dataset when the backend keys are configured.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Field label="Donor name" name="donorName" value={values.donorName} onChange={updateValue} />
        <Field label="Email" name="email" value={values.email} onChange={updateValue} type="email" />
        <Field label="Number of balls" name="ballCount" value={values.ballCount} onChange={updateValue} type="number" />
        <Field label="Club / school / organization" name="organization" value={values.organization} onChange={updateValue} />
        <label className="grid gap-2 text-sm font-bold text-court-ink">
          Pickup or dropoff preference
          <select
            name="preference"
            value={values.preference}
            onChange={updateValue}
            className="focus-ring rounded-lg border border-court-line bg-white px-4 py-3 text-sm font-medium text-court-ink shadow-sm outline-none transition"
          >
            <option>Pickup</option>
            <option>Dropoff</option>
            <option>Either works</option>
          </select>
        </label>
        <Field label="Location" name="location" value={values.location} onChange={updateValue} />
        <div className="md:col-span-2">
          <Field label="Notes" name="notes" value={values.notes} onChange={updateValue} as="textarea" required={false} />
        </div>
      </div>
      {success && (
        <p className="mt-4 rounded-lg border border-court-green/30 bg-court-green/10 p-3 text-sm font-bold text-court-ink">
          {remoteStatus === 'saved' ? 'Ball donation saved to Gear Vision.' : remoteStatus === 'error' ? 'Donation saved locally, but Supabase could not be reached.' : 'Donation received locally. Add Supabase keys to turn this into a live submission.'}
        </p>
      )}
      <button className="focus-ring mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-court-green px-5 py-3 font-black text-court-ink transition hover:bg-court-blue hover:text-white">
        Submit donation <ArrowRight size={18} />
      </button>
    </Card>
  );
}

export default function RecycleBallsPage() {
  return (
    <section id="recycle" className="section-pad bg-slate-50">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="inline-flex rounded-lg border border-court-lime/40 bg-court-lime/10 px-3 py-1 text-sm font-bold uppercase tracking-[0.16em] text-court-blue">
              Gear Vision Impact
            </p>
            <h1 className="mt-4 text-5xl font-black leading-tight text-court-ink sm:text-6xl">Give Tennis Balls a Second Life</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Donate dead or used tennis balls so Gear Vision can help reduce waste and pass them to animal shelters, senior living homes, schools, and other local organizations.
            </p>
            <a href="#ball-donation" className="focus-ring action-button mt-7 inline-flex items-center justify-center gap-2 rounded-lg bg-court-green px-5 py-3 font-black text-court-ink transition hover:bg-court-blue hover:text-white">
              Donate Used Balls <Recycle size={18} />
            </a>
          </div>
          <Card className="bg-court-panel text-white">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-white/[0.08] p-4">
                <Recycle className="text-court-lime" />
                <p className="mt-4 text-2xl font-black">Less waste</p>
                <p className="mt-1 text-sm text-slate-300">Keep useful balls out of the trash.</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.08] p-4">
                <Building2 className="text-court-lime" />
                <p className="mt-4 text-2xl font-black">More use</p>
                <p className="mt-1 text-sm text-slate-300">Send them where they still help.</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {reuseCards.map((card) => <ImpactFeatureCard key={card.title} {...card} />)}
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <ImpactStatCard label="Balls collected" value="0" caption="The first collection drive can start with local courts or school teams." />
          <ImpactStatCard label="Shelters supported" value="0" caption="Animal shelters can use balls for play and enrichment." />
          <ImpactStatCard label="Senior homes supported" value="0" caption="Senior living communities can reuse balls for practical accessibility needs." />
          <ImpactStatCard label="Organizations helped" value="0" caption="Schools, clubs, shelters, and beginner programs can all become partners." />
        </div>

        <div id="ball-donation" className="mt-10">
          <BallDonationForm />
        </div>

        <Card className="mt-10 bg-white">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-black text-court-ink">Donate Used Balls</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                This keeps the project practical and local: collect what tennis players already have, then redirect it to places that can use it.
              </p>
            </div>
            <a href="#ball-donation" className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-court-blue px-5 py-3 font-black text-white transition hover:bg-court-green hover:text-court-ink">
              Donate Used Balls <ArrowRight size={18} />
            </a>
          </div>
        </Card>
      </div>
    </section>
  );
}
