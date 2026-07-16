export const supportTiers = [
  {
    id: 'site-upkeep',
    amountLabel: '$10',
    amountCents: 1000,
    title: 'Site Upkeep',
    description: 'Helps cover hosting, domain costs, testing tools, and the basics that keep GearVision online.',
  },
  {
    id: 'data-tools',
    amountLabel: '$25',
    amountCents: 2500,
    title: 'Data Tools',
    description: 'Supports catalog research, model evaluation, and the data work behind better recommendations.',
  },
  {
    id: 'product-sprint',
    amountLabel: '$75',
    amountCents: 7500,
    title: 'Product Sprint',
    description: 'Funds deeper feature work: account analytics, recommendation quality, and real user feedback loops.',
  },
  {
    id: 'builder-sponsor',
    amountLabel: '$150',
    amountCents: 15000,
    title: 'Builder Sponsor',
    description: 'A larger contribution toward making GearVision a serious public data product, not just a class project.',
  },
];

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
