import { Activity, BarChart3, CheckCircle2, Gauge, LineChart as LineChartIcon, Save, UserRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fetchUserAnalytics, saveUserProfile, saveUserSetup } from '../lib/supabaseClient.js';
import Card from './Card.jsx';

const profileDefaults = {
  displayName: '',
  skillLevel: 'Recreational',
  utr: '',
  ntrp: '',
  age: '',
  height: '',
  weight: '',
  playstyle: 'All-court player',
  armIssue: 'None',
  budgetTier: 'Balanced',
  currentRacket: '',
  currentString: '',
  currentTension: '',
  notes: '',
};

const setupDefaults = {
  racket: '',
  string: '',
  tension: '',
  comfortRating: 7,
  powerRating: 7,
  controlRating: 7,
  spinRating: 7,
  notes: '',
  active: true,
};

function TextField({ label, name, value, onChange, type = 'text', placeholder = '', as = 'input', children }) {
  const Input = as;

  return (
    <label className="grid gap-2 text-sm font-bold text-court-ink">
      {label}
      <Input
        name={name}
        value={value}
        onChange={onChange}
        type={type}
        placeholder={placeholder}
        rows={as === 'textarea' ? 4 : undefined}
        className="focus-ring rounded-lg border border-court-line bg-white px-4 py-3 text-sm font-medium text-court-ink shadow-sm outline-none placeholder:text-slate-400"
      >
        {children}
      </Input>
    </label>
  );
}

function Kpi({ label, value, caption }) {
  return (
    <Card className="bg-white">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-court-blue">{label}</p>
      <p className="mt-2 text-3xl font-black text-court-ink">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{caption}</p>
    </Card>
  );
}

function average(values) {
  const clean = values.filter((value) => Number.isFinite(value));
  return clean.length ? Math.round(clean.reduce((sum, value) => sum + value, 0) / clean.length) : null;
}

function toForm(profile) {
  if (!profile) return profileDefaults;
  return {
    displayName: profile.display_name || '',
    skillLevel: profile.skill_level || 'Recreational',
    utr: profile.utr || '',
    ntrp: profile.ntrp || '',
    age: profile.age || '',
    height: profile.height || '',
    weight: profile.weight || '',
    playstyle: profile.playstyle || 'All-court player',
    armIssue: profile.arm_issue || 'None',
    budgetTier: profile.budget_tier || 'Balanced',
    currentRacket: profile.current_racket || '',
    currentString: profile.current_string || '',
    currentTension: profile.current_tension || '',
    notes: profile.notes || '',
  };
}

export default function ProfilePage({ session }) {
  const [profileValues, setProfileValues] = useState(profileDefaults);
  const [setupValues, setSetupValues] = useState(setupDefaults);
  const [analytics, setAnalytics] = useState({ profile: null, setups: [], quizzes: [], feedback: [] });
  const [status, setStatus] = useState('loading');
  const [saveStatus, setSaveStatus] = useState('');

  async function refresh() {
    if (!session) return;
    setStatus('loading');
    const result = await fetchUserAnalytics();
    if (result.ok) {
      setAnalytics(result.data);
      setProfileValues(toForm(result.data.profile));
      setStatus('ready');
    } else {
      setStatus('error');
    }
  }

  useEffect(() => {
    refresh();
  }, [session?.user?.id]);

  const personalStats = useMemo(() => {
    const feedback = analytics.feedback || [];
    const setups = analytics.setups || [];
    const quizzes = analytics.quizzes || [];
    const accuracy = feedback.length ? Math.round((feedback.filter((item) => item.accurate === 'yes').length / feedback.length) * 100) : null;
    const tryRate = feedback.length ? Math.round((feedback.filter((item) => item.would_try === 'yes').length / feedback.length) * 100) : null;
    const comfort = average(feedback.map((item) => Number(item.comfort_rating)));
    const activeSetup = setups.find((item) => item.active) || setups[0];

    return { accuracy, tryRate, comfort, activeSetup, feedbackCount: feedback.length, quizCount: quizzes.length, setupCount: setups.length };
  }, [analytics]);

  const feedbackTrend = useMemo(() => {
    return [...(analytics.feedback || [])].reverse().map((item, index) => ({
      label: `F${index + 1}`,
      accuracy: Number(item.accuracy_rating || 0),
      comfort: Number(item.comfort_rating || 0),
      confidence: Number(item.confidence_rating || 0),
    }));
  }, [analytics.feedback]);

  const setupRatings = useMemo(() => {
    return (analytics.setups || []).slice(0, 6).map((item, index) => ({
      name: item.racket ? `Setup ${index + 1}` : 'Setup',
      comfort: Number(item.comfort_rating || 0),
      power: Number(item.power_rating || 0),
      control: Number(item.control_rating || 0),
      spin: Number(item.spin_rating || 0),
    }));
  }, [analytics.setups]);

  function updateProfile(event) {
    const { name, value } = event.target;
    setProfileValues((current) => ({ ...current, [name]: value }));
    setSaveStatus('');
  }

  function updateSetup(event) {
    const { name, value, checked, type } = event.target;
    setSetupValues((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
    setSaveStatus('');
  }

  async function submitProfile(event) {
    event.preventDefault();
    setSaveStatus('saving');
    const result = await saveUserProfile(profileValues);
    setSaveStatus(result.ok ? 'Profile saved.' : 'Could not save profile.');
    await refresh();
  }

  async function submitSetup(event) {
    event.preventDefault();
    setSaveStatus('saving');
    const result = await saveUserSetup(setupValues);
    setSaveStatus(result.ok ? 'Setup update saved.' : 'Could not save setup.');
    if (result.ok) setSetupValues(setupDefaults);
    await refresh();
  }

  if (!session) {
    return (
      <section className="section-pad bg-white">
        <div className="mx-auto max-w-3xl">
          <Card className="text-center">
            <UserRound className="mx-auto text-court-blue" size={34} />
            <h1 className="mt-4 text-3xl font-black text-court-ink">Sign in to unlock personal analytics</h1>
            <p className="mt-3 text-slate-600">Your private profile, setup history, and model feedback timeline live here.</p>
            <a href="/login" className="focus-ring mt-6 inline-flex rounded-lg bg-court-blue px-5 py-3 text-sm font-black text-white transition hover:bg-court-green hover:text-court-ink">
              Sign in
            </a>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section id="profile" className="section-pad bg-white">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-court-blue">Personal Analytics</p>
            <h1 className="mt-3 text-5xl font-black leading-tight text-court-ink sm:text-6xl">Your gear lab.</h1>
          </div>
          <p className="max-w-2xl text-base leading-8 text-slate-600 lg:justify-self-end">
            Gear Vision tracks your profile, setup experiments, quiz history, and feedback so recommendations can become more personal over time.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Kpi label="Saved quizzes" value={personalStats.quizCount} caption="Recommendation snapshots tied to this account." />
          <Kpi label="Feedback rows" value={personalStats.feedbackCount} caption="Your personal model evaluation trail." />
          <Kpi label="Accuracy rate" value={personalStats.accuracy === null ? 'New' : `${personalStats.accuracy}%`} caption="Recommendations you marked accurate." />
          <Kpi label="Avg comfort" value={personalStats.comfort === null ? 'New' : `${personalStats.comfort}/10`} caption="Comfort ratings from your saved feedback." />
        </div>

        {saveStatus && <p className="mt-5 rounded-lg border border-court-line bg-court-green/20 p-3 text-sm font-bold text-court-ink">{saveStatus}</p>}

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <div className="flex items-center gap-3">
              <UserRound className="text-court-blue" size={26} />
              <h2 className="text-2xl font-black text-court-ink">Player profile</h2>
            </div>
            <form onSubmit={submitProfile} className="mt-5 grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Display name" name="displayName" value={profileValues.displayName} onChange={updateProfile} placeholder="Nakul" />
                <TextField label="Skill level" name="skillLevel" value={profileValues.skillLevel} onChange={updateProfile} as="select">
                  {['Beginner', 'Recreational', 'Intermediate', 'Advanced', 'Tournament'].map((item) => <option key={item}>{item}</option>)}
                </TextField>
                <TextField label="UTR" name="utr" value={profileValues.utr} onChange={updateProfile} type="number" placeholder="Optional" />
                <TextField label="NTRP" name="ntrp" value={profileValues.ntrp} onChange={updateProfile} type="number" placeholder="Optional" />
                <TextField label="Age" name="age" value={profileValues.age} onChange={updateProfile} type="number" placeholder="Optional" />
                <TextField label="Budget tier" name="budgetTier" value={profileValues.budgetTier} onChange={updateProfile} as="select">
                  {['Value', 'Balanced', 'Premium'].map((item) => <option key={item}>{item}</option>)}
                </TextField>
                <TextField label="Playstyle" name="playstyle" value={profileValues.playstyle} onChange={updateProfile} />
                <TextField label="Arm issue" name="armIssue" value={profileValues.armIssue} onChange={updateProfile} as="select">
                  {['None', 'Elbow', 'Wrist', 'Shoulder', 'Multiple'].map((item) => <option key={item}>{item}</option>)}
                </TextField>
                <TextField label="Current racket" name="currentRacket" value={profileValues.currentRacket} onChange={updateProfile} />
                <TextField label="Current string" name="currentString" value={profileValues.currentString} onChange={updateProfile} />
                <TextField label="Current tension" name="currentTension" value={profileValues.currentTension} onChange={updateProfile} type="number" placeholder="lbs" />
                <TextField label="Height" name="height" value={profileValues.height} onChange={updateProfile} placeholder="Optional" />
              </div>
              <TextField label="Notes" name="notes" value={profileValues.notes} onChange={updateProfile} as="textarea" placeholder="What you like, dislike, or want to improve." />
              <button className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-court-blue px-4 py-3 text-sm font-black text-white transition hover:bg-court-green hover:text-court-ink">
                <Save size={17} />
                Save profile
              </button>
            </form>
          </Card>

          <div className="grid gap-6">
            <Card>
              <div className="flex items-center gap-3">
                <Gauge className="text-court-blue" size={26} />
                <h2 className="text-2xl font-black text-court-ink">Setup tracker</h2>
              </div>
              <form onSubmit={submitSetup} className="mt-5 grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField label="Racket" name="racket" value={setupValues.racket} onChange={updateSetup} placeholder="Yonex VCORE 100" />
                  <TextField label="String" name="string" value={setupValues.string} onChange={updateSetup} placeholder="Hyper-G / Velocity hybrid" />
                  <TextField label="Tension" name="tension" value={setupValues.tension} onChange={updateSetup} type="number" placeholder="lbs" />
                  <label className="flex items-center gap-2 rounded-lg border border-court-line bg-slate-50 px-4 py-3 text-sm font-bold text-court-ink">
                    <input type="checkbox" name="active" checked={setupValues.active} onChange={updateSetup} className="accent-court-blue" />
                    Mark as current setup
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-4">
                  {[
                    ['comfortRating', 'Comfort'],
                    ['powerRating', 'Power'],
                    ['controlRating', 'Control'],
                    ['spinRating', 'Spin'],
                  ].map(([name, label]) => (
                    <label key={name} className="text-xs font-bold text-slate-600">
                      {label}: {setupValues[name]}/10
                      <input name={name} type="range" min="1" max="10" value={setupValues[name]} onChange={updateSetup} className="mt-1 w-full accent-court-blue" />
                    </label>
                  ))}
                </div>
                <TextField label="Setup notes" name="notes" value={setupValues.notes} onChange={updateSetup} as="textarea" placeholder="Comfort, launch angle, control, what changed." />
                <button className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-court-blue px-4 py-3 text-sm font-black text-white transition hover:bg-court-green hover:text-court-ink">
                  <Activity size={17} />
                  Add setup update
                </button>
              </form>
            </Card>

            <Card className="bg-court-ink text-white">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-court-green">Current setup</p>
              <h3 className="mt-3 text-2xl font-black">{personalStats.activeSetup?.racket || profileValues.currentRacket || 'No setup saved yet'}</h3>
              <p className="mt-2 text-sm leading-6 text-white/75">
                {personalStats.activeSetup?.string || profileValues.currentString || 'Add your racket/string/tension to start building a personal gear timeline.'}
                {personalStats.activeSetup?.tension ? ` at ${personalStats.activeSetup.tension} lbs` : ''}
              </p>
            </Card>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <div className="flex items-center gap-3">
              <LineChartIcon className="text-court-blue" size={24} />
              <h2 className="text-2xl font-black text-court-ink">Feedback trend</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">Accuracy, comfort, and confidence ratings from your saved recommendation feedback.</p>
            <div className="mt-5 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={feedbackTrend.length ? feedbackTrend : [{ label: 'Start', accuracy: 0, comfort: 0, confidence: 0 }]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dbe5e4" />
                  <XAxis dataKey="label" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="accuracy" stroke="#047ea8" strokeWidth={3} />
                  <Line type="monotone" dataKey="comfort" stroke="#8cff00" strokeWidth={3} />
                  <Line type="monotone" dataKey="confidence" stroke="#111827" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <BarChart3 className="text-court-blue" size={24} />
              <h2 className="text-2xl font-black text-court-ink">Setup ratings</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">Compare how your real setups felt across comfort, power, control, and spin.</p>
            <div className="mt-5 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={setupRatings.length ? setupRatings : [{ name: 'Add setup', comfort: 0, power: 0, control: 0, spin: 0 }]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dbe5e4" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Bar dataKey="comfort" fill="#047ea8" />
                  <Bar dataKey="power" fill="#8cff00" />
                  <Bar dataKey="control" fill="#111827" />
                  <Bar dataKey="spin" fill="#7dd3fc" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {status === 'loading' && <Card className="lg:col-span-3"><p className="text-sm font-bold text-slate-600">Loading personal dataset...</p></Card>}
          {status === 'error' && <Card className="lg:col-span-3"><p className="text-sm font-bold text-rose-700">Could not load personal analytics. Check Supabase schema/RLS.</p></Card>}
          {(analytics.setups || []).slice(0, 3).map((setup) => (
            <Card key={setup.id} className="bg-slate-50">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-court-blue">{setup.active ? 'Current setup' : 'Past setup'}</p>
              <h3 className="mt-2 text-xl font-black text-court-ink">{setup.racket}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{setup.string}{setup.tension ? ` at ${setup.tension} lbs` : ''}</p>
              {setup.notes && <p className="mt-3 text-sm leading-6 text-slate-500">{setup.notes}</p>}
            </Card>
          ))}
          {!analytics.setups?.length && status === 'ready' && (
            <Card className="lg:col-span-3">
              <CheckCircle2 className="text-court-blue" size={26} />
              <h3 className="mt-3 text-xl font-black text-court-ink">Your first saved setup will appear here.</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">Once you log a setup, Gear Vision can compare real comfort/performance against recommendation scores.</p>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}
