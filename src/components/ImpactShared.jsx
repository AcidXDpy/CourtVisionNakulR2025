import { useState } from 'react';
import Card from './Card.jsx';

export function ImpactStatCard({ label, value, caption }) {
  return (
    <Card className="bg-white">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-court-blue">{label}</p>
      <p className="mt-2 text-3xl font-black text-court-ink">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{caption}</p>
    </Card>
  );
}

export function DonationTierCard({ amount, title, description }) {
  return (
    <Card className="bg-gradient-to-br from-white via-court-blue/5 to-court-lime/15">
      <p className="text-3xl font-black text-court-ink">{amount}</p>
      <h3 className="mt-3 text-lg font-black text-court-ink">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </Card>
  );
}

export function ImpactFeatureCard({ icon: Icon, title, description }) {
  return (
    <Card className="bg-white">
      <Icon className="text-court-blue" size={28} />
      <h3 className="mt-4 text-xl font-black text-court-ink">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
    </Card>
  );
}

export function Field({ label, name, value, onChange, type = 'text', required = true, as = 'input', children }) {
  const Input = as;

  return (
    <label className="grid gap-2 text-sm font-bold text-court-ink">
      {label}
      <Input
        name={name}
        value={value}
        onChange={onChange}
        type={type}
        required={required}
        rows={as === 'textarea' ? 4 : undefined}
        className="focus-ring rounded-lg border border-court-line bg-white px-4 py-3 text-sm font-medium text-court-ink shadow-sm outline-none transition placeholder:text-slate-400"
      >
        {children}
      </Input>
    </label>
  );
}

export function useLocalForm(initialValues, logLabel, saveRemote) {
  const [values, setValues] = useState(initialValues);
  const [success, setSuccess] = useState(false);
  const [remoteStatus, setRemoteStatus] = useState('idle');

  function updateValue(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setSuccess(false);
    setRemoteStatus('idle');
  }

  async function submit(event) {
    event.preventDefault();
    console.log(logLabel, values);
    setRemoteStatus('saving');
    const result = saveRemote ? await saveRemote(values) : { ok: false, skipped: true };
    setRemoteStatus(result.ok ? 'saved' : result.skipped ? 'local' : 'error');
    setValues(initialValues);
    setSuccess(true);
  }

  return { values, success, remoteStatus, updateValue, submit };
}
