import { CheckCircle2, LogIn, Mail, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { isSupabaseConfigured, signInWithGoogle, signInWithMagicLink, signOut } from '../lib/supabaseClient.js';
import Card from './Card.jsx';

export default function LoginPage({ session, authStatus = 'ready', authMessage = '' }) {
  const [email, setEmail] = useState(session?.user?.email || '');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const authLoading = authStatus === 'loading';
  const authError = authStatus === 'error';
  const userName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'player';

  async function submit(event) {
    event.preventDefault();
    setStatus('sending');
    setMessage('');
    const result = await signInWithMagicLink(email);
    setStatus(result.ok ? 'sent' : 'error');
    setMessage(result.ok ? 'Check your email for the GearVision sign-in link.' : result.message || 'Could not send magic link.');
  }

  async function handleGoogleSignIn() {
    setStatus('google');
    setMessage('');
    const result = await signInWithGoogle();
    if (!result.ok) {
      setStatus('error');
      setMessage(result.message || 'Could not start Google sign-in.');
    }
  }

  async function handleSignOut() {
    await signOut();
    setStatus('idle');
    setMessage('Signed out.');
  }

  return (
    <section id="login" className="section-pad bg-white">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-court-blue">GearVision Account</p>
          <h1 className="mt-3 text-5xl font-black leading-tight text-court-ink sm:text-6xl">Save your gear story.</h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Google sign-in lets players keep a private profile, track setup changes, and build personalized analytics over time without depending on email delivery.
          </p>
          <div className="mt-6 grid gap-3">
            {[
              'Save quiz results to your account, even when research consent is off.',
              'Track racket, string, tension, comfort, and performance ratings.',
              'Turn follow-up feedback into a personal recommendation accuracy record.',
            ].map((item) => (
              <div key={item} className="flex gap-3 rounded-lg border border-court-line bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                <CheckCircle2 className="mt-1 shrink-0 text-court-blue" size={17} />
                {item}
              </div>
            ))}
          </div>
        </div>

        <Card className="bg-gradient-to-br from-white via-court-blue/5 to-court-lime/20">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-lg bg-court-blue text-white">
              {session ? <ShieldCheck size={24} /> : <Mail size={24} />}
            </span>
            <div>
              <h2 className="text-2xl font-black text-court-ink">{authLoading ? 'Finishing sign-in' : session ? 'Welcome to GearVision' : 'Sign in to GearVision'}</h2>
              <p className="text-sm text-slate-600">
                {authLoading ? 'Securely checking your Google session...' : session ? `Signed in as ${session.user.email}` : 'Use Google first. Email link stays available as a fallback.'}
              </p>
            </div>
          </div>

          {!isSupabaseConfigured && (
            <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-800">
              Supabase env vars are missing, so login is disabled locally.
            </p>
          )}

          {authLoading ? (
            <div className="mt-6 rounded-lg border border-court-line bg-white p-4 text-sm font-bold text-slate-600">
              Hold tight. GearVision is completing the OAuth callback and loading your account.
            </div>
          ) : session ? (
            <div className="mt-6">
              <div className="rounded-lg border border-court-blue/20 bg-white p-4">
                <p className="text-sm font-black uppercase tracking-[0.16em] text-court-blue">Account active</p>
                <h3 className="mt-2 text-2xl font-black text-court-ink">Good to see you, {userName}.</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Your private GearVision profile is ready. Quiz results, setup notes, and feedback can now stay tied to your account.
                </p>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <a href="/profile" className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-court-blue px-4 py-3 text-sm font-black text-white transition hover:bg-court-green hover:text-court-ink">
                  <ShieldCheck size={17} />
                  Open profile
                </a>
                <button onClick={handleSignOut} className="focus-ring rounded-lg border border-court-ink/15 px-4 py-3 text-sm font-black text-court-ink transition hover:border-court-blue hover:bg-court-blue/10">
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6 grid gap-5">
              <button
                onClick={handleGoogleSignIn}
                disabled={!isSupabaseConfigured || status === 'google' || authLoading}
                className="focus-ring inline-flex items-center justify-center gap-3 rounded-lg bg-court-ink px-4 py-3 text-sm font-black text-white transition hover:bg-court-blue disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-sm font-black text-court-ink">G</span>
                {status === 'google' ? 'Opening Google...' : 'Continue with Google'}
              </button>
              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-court-line" />
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Email fallback</span>
                <span className="h-px flex-1 bg-court-line" />
              </div>
              <form onSubmit={submit} className="grid gap-4">
                <label className="grid gap-2 text-sm font-bold text-court-ink">
                  Email
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="focus-ring rounded-lg border border-court-line bg-white px-4 py-3 text-sm font-medium text-court-ink shadow-sm outline-none placeholder:text-slate-400"
                  />
                </label>
                <button disabled={!isSupabaseConfigured || status === 'sending'} className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg border border-court-ink/15 bg-white px-4 py-3 text-sm font-black text-court-ink transition hover:border-court-blue hover:bg-court-blue/10 disabled:cursor-not-allowed disabled:opacity-60">
                  <LogIn size={17} />
                  {status === 'sending' ? 'Sending link...' : 'Send magic link'}
                </button>
              </form>
            </div>
          )}

          {authError && <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm font-bold text-rose-700">{authMessage || 'Could not finish sign-in. Try Google again.'}</p>}
          {message && <p className={`mt-4 rounded-lg p-3 text-sm font-bold ${status === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-court-green/20 text-court-ink'}`}>{message}</p>}
          <p className="mt-5 text-xs leading-5 text-slate-500">
            Personal account data is private to you. Public dashboards only use aggregates and only include quiz/feedback data when you opt in.
          </p>
        </Card>
      </div>
    </section>
  );
}
