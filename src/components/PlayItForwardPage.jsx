import { ArrowRight, Gift, HeartHandshake, Mail, MapPin, PackageCheck, UserRound } from 'lucide-react';
import Card from './Card.jsx';
import { DonationTierCard, Field, ImpactStatCard, useLocalForm } from './ImpactShared.jsx';

const nominationDefaults = {
  playerName: '',
  age: '',
  location: '',
  contactEmail: '',
  currentSetup: '',
  helpNeeded: '',
  explanation: '',
};

const tiers = [
  { amount: '$10', title: 'Overgrips / Tennis Balls', description: 'Covers smaller essentials that players run through quickly during practice.' },
  { amount: '$25', title: 'String Fund', description: 'Helps pay for a fresh set of strings when an old setup loses tension or breaks.' },
  { amount: '$75', title: 'Restring + Accessories', description: 'Supports stringing labor plus practical items like grips, dampeners, or practice balls.' },
  { amount: '$150+', title: 'Full Setup Support', description: 'Goes toward a racket, string setup, shoes, bag, or bundled gear support for a player.' },
];

function PlayerNominationForm() {
  const { values, success, updateValue, submit } = useLocalForm(nominationDefaults, 'CourtVision player nomination');

  return (
    <Card as="form" onSubmit={submit} className="bg-white">
      <div className="flex items-center gap-3">
        <UserRound className="text-court-blue" />
        <h2 className="text-2xl font-black text-court-ink">Nominate a Player</h2>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Tell us about a local player who could use help getting reliable gear. This is an early community form, so submissions are saved locally for now.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Field label="Player name" name="playerName" value={values.playerName} onChange={updateValue} />
        <Field label="Age" name="age" value={values.age} onChange={updateValue} type="number" />
        <Field label="Location" name="location" value={values.location} onChange={updateValue} />
        <Field label="Contact email" name="contactEmail" value={values.contactEmail} onChange={updateValue} type="email" />
        <div className="md:col-span-2">
          <Field label="Current setup" name="currentSetup" value={values.currentSetup} onChange={updateValue} as="textarea" />
        </div>
        <div className="md:col-span-2">
          <Field label="What they need help with" name="helpNeeded" value={values.helpNeeded} onChange={updateValue} as="textarea" />
        </div>
        <div className="md:col-span-2">
          <Field label="Short explanation of financial/equipment need" name="explanation" value={values.explanation} onChange={updateValue} as="textarea" />
        </div>
      </div>
      {success && (
        <p className="mt-4 rounded-lg border border-court-green/30 bg-court-green/10 p-3 text-sm font-bold text-court-ink">
          Nomination received locally. When a backend is added, this will become a real submission flow.
        </p>
      )}
      <button className="focus-ring mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-court-green px-5 py-3 font-black text-court-ink transition hover:bg-court-blue hover:text-white">
        Submit nomination <ArrowRight size={18} />
      </button>
    </Card>
  );
}

export default function PlayItForwardPage() {
  return (
    <section id="play-it-forward" className="section-pad bg-slate-50">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="inline-flex rounded-lg border border-court-lime/40 bg-court-lime/10 px-3 py-1 text-sm font-bold uppercase tracking-[0.16em] text-court-blue">
              CourtVision Impact
            </p>
            <h1 className="mt-4 text-5xl font-black leading-tight text-court-ink sm:text-6xl">Play It Forward</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              CourtVision can help raise money to sponsor tennis gear setups for players who cannot afford expensive rackets, strings, shoes, and accessories.
            </p>
            <a href="#player-nomination" className="focus-ring action-button mt-7 inline-flex items-center justify-center gap-2 rounded-lg bg-court-green px-5 py-3 font-black text-court-ink transition hover:bg-court-blue hover:text-white">
              Support a Player <HeartHandshake size={18} />
            </a>
          </div>
          <Card className="bg-court-panel text-white">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-white/10 bg-white/[0.08] p-4">
                <Gift className="text-court-lime" />
                <p className="mt-4 text-2xl font-black">$10+</p>
                <p className="mt-1 text-sm text-slate-300">Small gear needs add up fast.</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.08] p-4">
                <PackageCheck className="text-court-lime" />
                <p className="mt-4 text-2xl font-black">Local</p>
                <p className="mt-1 text-sm text-slate-300">Built around real nearby players.</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.08] p-4">
                <MapPin className="text-court-lime" />
                <p className="mt-4 text-2xl font-black">Access</p>
                <p className="mt-1 text-sm text-slate-300">Less friction to keep playing.</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {tiers.map((tier) => <DonationTierCard key={tier.amount} {...tier} />)}
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <ImpactStatCard label="Dollars raised" value="$0" caption="Ready for the first local drive or sponsorship partner." />
          <ImpactStatCard label="Players helped" value="0" caption="Nomination data will help identify the first recipients." />
          <ImpactStatCard label="Setups donated" value="0" caption="Full setup support can include racket, strings, shoes, and accessories." />
        </div>

        <div id="player-nomination" className="mt-10">
          <PlayerNominationForm />
        </div>

        <Card className="mt-10 bg-white">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-black text-court-ink">Support a Player</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                This starts as a student-built local effort: identify real needs, collect nominations, and turn gear advice into gear access.
              </p>
            </div>
            <a href="#player-nomination" className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-court-blue px-5 py-3 font-black text-white transition hover:bg-court-green hover:text-court-ink">
              Support a Player <Mail size={18} />
            </a>
          </div>
        </Card>
      </div>
    </section>
  );
}
