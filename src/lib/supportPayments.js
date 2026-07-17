export { supportTiers } from '../data/supportTiers.js';

export async function startSupportCheckout(tierId) {
  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tierId }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || !payload.url) {
    throw new Error(payload.error || 'Could not start Stripe Checkout.');
  }

  window.location.assign(payload.url);
}

export async function verifySupportCheckout(sessionId) {
  const response = await fetch(`/api/checkout-session?session_id=${encodeURIComponent(sessionId)}`);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Could not verify Stripe Checkout status.');
  }

  return payload;
}
