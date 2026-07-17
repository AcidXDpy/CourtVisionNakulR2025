import { ArrowRight, CreditCard, Gift, Mail, MapPin, PackageCheck, ShieldCheck, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import Card from './Card.jsx';
import { Field, ImpactStatCard, SupportTierCard, useLocalForm } from './ImpactShared.jsx';
import { savePlayerNomination } from '../lib/supabaseClient.js';
import { trackEvent } from '../lib/analytics.js';
import { supportTiers, startSupportCheckout, verifySupportCheckout } from '../lib/supportPayments.js';

const nominationDefaults = {
  playerName: '',
  age: '',
  location: '',
  contactEmail: '',
  currentSetup: '',
  helpNeeded: '',
  explanation: '',
};

const processSteps = [
  { title: 'Build', text: 'Support helps cover the boring but real costs: hosting, domains, tools, testing, and maintenance.' },
  { title: 'Improve', text: 'More time can go into better equipment data, recommendation scoring, account features, and feedback analytics.' },
  { title: 'Share', text: 'The project can stay public, polished, and useful while the community tools keep growing carefully.' },
];

function formatPaymentAmount(amountCents, currency = 'usd') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format((amountCents || 0) / 100);
}

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
  const [checkoutStatus, setCheckoutStatus] = useState({ state: 'idle', tierId: null, message: '' });

  useEffect(() => {
    let mounted = true;
    const params = new URLSearchParams(window.location.search);
    const supportState = params.get('support');
    const sessionId = params.get('session_id');

    async function verifySession() {
      if (!sessionId) {
        setCheckoutStatus({
          state: 'success',
          tierId: null,
          message: 'Thanks for supporting GearVision. Stripe redirected back successfully; the support total updates once the webhook confirms payment.',
        });
        return;
      }

      setCheckoutStatus({ state: 'loading', tierId: null, message: 'Verifying Stripe checkout status...' });

      try {
        const checkout = await verifySupportCheckout(sessionId);
        if (!mounted) return;
        const amount = formatPaymentAmount(checkout.amountTotal, checkout.currency);
        const tierCopy = checkout.supportTierLabel ? ` (${checkout.supportTierLabel} tier)` : '';

        if (checkout.paymentStatus === 'paid') {
          setCheckoutStatus({
            state: 'success',
            tierId: null,
            message: `Stripe confirmed ${amount}${tierCopy} in GearVision project support. The public total updates after the webhook records it.`,
          });
          trackEvent('support_checkout_completed', { tierId: checkout.supportTierId, amountTotal: checkout.amountTotal });
        } else {
          setCheckoutStatus({
            state: 'pending',
            tierId: null,
            message: `Stripe checkout returned with payment status "${checkout.paymentStatus}". If this was an async payment, the total updates after confirmation.`,
          });
        }

        window.history.replaceState(null, '', `${window.location.origin}/play-it-forward`);
      } catch (error) {
        if (!mounted) return;
        setCheckoutStatus({
          state: 'error',
          tierId: null,
          message: error.message || 'Stripe redirected back, but GearVision could not verify the session yet.',
        });
      }
    }

    if (supportState === 'success') {
      verifySession();
    }

    if (supportState === 'cancelled') {
      setCheckoutStatus({ state: 'cancelled', tierId: null, message: 'Checkout was cancelled. No payment was collected.' });
      trackEvent('support_checkout_cancelled', {});
      window.history.replaceState(null, '', `${window.location.origin}/play-it-forward`);
    }

    return () => {
      mounted = false;
    };
  }, []);

  async function supportProject(tierId) {
    setCheckoutStatus({ state: 'loading', tierId, message: '' });
    trackEvent('support_checkout_started', { tierId });

    try {
      await startSupportCheckout(tierId);
    } catch (error) {
      setCheckoutStatus({ state: 'error', tierId: null, message: error.message || 'Could not start Stripe Checkout.' });
    }
  }

  return (
    <section id="play-it-forward" className="section-pad bg-slate-50">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="inline-flex rounded-lg border border-court-lime/40 bg-court-lime/10 px-3 py-1 text-sm font-bold uppercase tracking-[0.16em] text-court-blue">
              GearVision Support
            </p>
            <h1 className="mt-4 text-5xl font-black leading-tight text-court-ink sm:text-6xl">Play It Forward</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Help keep GearVision online and improving: hosting, data collection, recommendation research, catalog maintenance, and community tools.
            </p>
            <a onClick={() => trackEvent('gear_access_clicked', { target: 'support_tiers_hero' })} href="#support-gearvision" className="focus-ring action-button mt-7 inline-flex items-center justify-center gap-2 rounded-lg bg-court-green px-5 py-3 font-black text-court-ink transition hover:bg-court-blue hover:text-white">
              Support GearVision <CreditCard size={18} />
            </a>
          </div>
          <Card className="bg-court-panel text-white">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-white/10 bg-white/[0.08] p-4">
                <Gift className="text-court-lime" />
                <p className="mt-4 text-2xl font-black">$10+</p>
                <p className="mt-1 text-sm text-slate-300">Small support keeps the beta running.</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.08] p-4">
                <PackageCheck className="text-court-lime" />
                <p className="mt-4 text-2xl font-black">Student-built</p>
                <p className="mt-1 text-sm text-slate-300">A real product with a real data pipeline.</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.08] p-4">
                <MapPin className="text-court-lime" />
                <p className="mt-4 text-2xl font-black">Public beta</p>
                <p className="mt-1 text-sm text-slate-300">Open for players, coaches, and feedback.</p>
              </div>
            </div>
          </Card>
        </div>

        <div id="support-gearvision" className="mt-10">
          <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <h2 className="text-2xl font-black text-court-ink">Support GearVision</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Choose a project support amount. Checkout is hosted by Stripe; GearVision never sees or stores card details. Contributions support the website and are not tax-deductible nonprofit gifts.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg border border-court-line bg-white px-3 py-2 text-xs font-bold text-slate-600">
              <ShieldCheck size={15} className="text-court-blue" />
              Secure Stripe Checkout
            </div>
          </div>
          {checkoutStatus.message && (
            <p
              className={`mb-4 rounded-lg border p-3 text-sm font-bold ${
                checkoutStatus.state === 'error'
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : checkoutStatus.state === 'cancelled'
                    ? 'border-amber-200 bg-amber-50 text-amber-800'
                    : checkoutStatus.state === 'pending'
                      ? 'border-court-blue/20 bg-court-blue/10 text-court-ink'
                    : 'border-court-green/30 bg-court-green/10 text-court-ink'
              }`}
            >
              {checkoutStatus.message}
            </p>
          )}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {supportTiers.map((tier) => (
              <SupportTierCard
                key={tier.id}
                amount={tier.amountLabel}
                title={tier.title}
                description={tier.description}
                actionLabel={`Support ${tier.amountLabel}`}
                busy={checkoutStatus.state === 'loading' && checkoutStatus.tierId === tier.id}
                onAction={() => supportProject(tier.id)}
              />
            ))}
          </div>
        </div>

        <Card className="mt-10 bg-white">
          <h2 className="text-2xl font-black text-court-ink">How project support helps</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            This is not positioned as a nonprofit fundraiser. Contributions support the GearVision website, data work, and product development.
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
          <ImpactStatCard label="Support status" value="Open" caption="Project contributions can help cover hosting, tools, and development time." />
          <ImpactStatCard label="Nomination status" value="Collecting" caption="Submissions help identify the first players and equipment needs." />
          <ImpactStatCard label="Transparency" value="Tracked" caption="Public counters show aggregate support only, never private payment details." />
        </div>

        <div id="player-nomination" className="mt-10">
          <PlayerNominationForm />
        </div>

        <Card className="mt-10 bg-white">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-black text-court-ink">Support GearVision</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Help keep the advisor online, improve the recommendation model, and support the community features around it.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a onClick={() => trackEvent('gear_access_clicked', { target: 'support_tiers_footer' })} href="#support-gearvision" className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-court-blue px-5 py-3 font-black text-white transition hover:bg-court-green hover:text-court-ink">
                Support the site <CreditCard size={18} />
              </a>
              <a onClick={() => trackEvent('gear_access_clicked', { target: 'player_nomination_footer' })} href="#player-nomination" className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg border border-court-ink/15 bg-white px-5 py-3 font-black text-court-ink transition hover:border-court-blue hover:bg-court-blue/10">
                Nominate a player <Mail size={18} />
              </a>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
