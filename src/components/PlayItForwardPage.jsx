import { ArrowRight, Gift, HeartHandshake, Mail, MapPin, PackageCheck, UserRound } from 'lucide-react';
import Card from './Card.jsx';
import { DonationTierCard, Field, ImpactStatCard, useLocalForm } from './ImpactShared.jsx';
import { savePlayerNomination } from '../lib/supabaseClient.js';
import { trackEvent } from '../lib/analytics.js';

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

const processSteps = [
  { title: 'Nominate', text: 'A player, coach, parent, or teammate explains the current setup and gear need.' },
  { title: 'Review', text: 'GearVision uses the recommendation model and budget context to understand what support would help most.' },
  { title: 'Fulfill', text: 'Approved support can become strings, grips, accessories, shoes, or a full setup when resources allow.' },
];

function PlayerNominationForm() {
  const { values, success, remoteStatus, updateValue, submit } = useLocalForm(nominationDefaults, 'GearVision player nomination', savePlayerNomination);

  return (
    <Card as="form" onSubmit={submit} className="bg-white">
      <div className="flex items-center gap-3">
        <UserRound className="text-court-blue" />
        <h2 className="text-2xl font-black text-court-ink">Nominate a Player</h2>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Tell us about a local player who could use help getting reliable gear. Contact details stay private and are used only for follow-up.
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
          {remoteStatus === 'saved' ? 'Nomination received.' : remoteStatus === 'error' ? 'Nomination saved locally, but could not reach the database.' : 'Nomination received locally.'}
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
              Gear Access Initiative
            </p>
            <h1 className="mt-4 text-5xl font-black leading-tight text-court-ink sm:text-6xl">Play It Forward</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              GearVision is building a nomination pipeline for players who need help with practical tennis equipment costs: strings, grips, shoes, rackets, and accessories.
            </p>
            <a onClick={() => trackEvent('gear_access_clicked', { target: 'player_nomination_hero' })} href="#player-nomination" className="focus-ring action-button mt-7 inline-flex items-center justify-center gap-2 rounded-lg bg-court-green px-5 py-3 font-black text-court-ink transition hover:bg-court-blue hover:text-white">
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
                <p className="mt-1 text-sm text-slate-300">Designed for nearby teams, coaches, and players.</p>
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

        <Card className="mt-10 bg-white">
          <h2 className="text-2xl font-black text-court-ink">How gear support works</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            The goal is a practical local pipeline: identify real needs, match them to useful setups, and track outcomes honestly.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {processSteps.map((step, index) => (
              <div key={step.title} className="rounded-lg border border-court-line bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-court-blue">Step {index + 1}</p>
                <h3 className="mt-2 text-lg font-black text-court-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{step.text}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <ImpactStatCard label="Funding status" value="Open" caption="Ready for local sponsors, donors, or team-based drives." />
          <ImpactStatCard label="Nomination status" value="Collecting" caption="Submissions help identify the first players and equipment needs." />
          <ImpactStatCard label="Fulfillment status" value="Pending" caption="Public donation numbers will appear only after support is completed." />
        </div>

        <div id="player-nomination" className="mt-10">
          <PlayerNominationForm />
        </div>

        <Card className="mt-10 bg-white">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-black text-court-ink">Support a Player</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                This starts locally: identify real needs, collect nominations, and turn gear advice into practical gear access.
              </p>
            </div>
            <a onClick={() => trackEvent('gear_access_clicked', { target: 'player_nomination_footer' })} href="#player-nomination" className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-court-blue px-5 py-3 font-black text-white transition hover:bg-court-green hover:text-court-ink">
              Support a Player <Mail size={18} />
            </a>
          </div>
        </Card>
      </div>
    </section>
  );
}
