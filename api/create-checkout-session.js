import Stripe from 'stripe';

const supportTiers = {
  'site-upkeep': {
    amountCents: 1000,
    amountLabel: '$10',
    title: 'Site Upkeep',
    description: 'Hosting, domain costs, testing tools, and the basics that keep GearVision online.',
  },
  'data-tools': {
    amountCents: 2500,
    amountLabel: '$25',
    title: 'Data Tools',
    description: 'Catalog research, model evaluation, and data work behind better recommendations.',
  },
  'product-sprint': {
    amountCents: 7500,
    amountLabel: '$75',
    title: 'Product Sprint',
    description: 'Feature work for account analytics, recommendation quality, and user feedback loops.',
  },
  'builder-sponsor': {
    amountCents: 15000,
    amountLabel: '$150',
    title: 'Builder Sponsor',
    description: 'A larger contribution toward making GearVision a serious public data product.',
  },
};

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(payload));
}

async function readJsonBody(request) {
  if (Buffer.isBuffer(request.body)) {
    const rawBody = request.body.toString('utf8');
    return rawBody ? JSON.parse(rawBody) : {};
  }

  if (request.body && typeof request.body === 'object') return request.body;
  if (typeof request.body === 'string') return JSON.parse(request.body || '{}');

  const chunks = [];
  for await (const chunk of request) {
    chunks.push(Buffer.from(chunk));
  }
  const rawBody = Buffer.concat(chunks).toString('utf8');
  return rawBody ? JSON.parse(rawBody) : {};
}

function getBaseUrl(request) {
  const configuredUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (configuredUrl) return configuredUrl.startsWith('http') ? configuredUrl.replace(/\/$/, '') : `https://${configuredUrl.replace(/\/$/, '')}`;

  const origin = request.headers.origin;
  if (origin) return origin.replace(/\/$/, '');

  const host = request.headers['x-forwarded-host'] || request.headers.host || 'www.gearvision.dev';
  const protocol = request.headers['x-forwarded-proto'] || 'https';
  return `${protocol}://${host}`;
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return sendJson(response, 405, { error: 'Method not allowed.' });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return sendJson(response, 503, { error: 'Stripe is not configured yet.' });
  }

  let body;
  try {
    body = await readJsonBody(request);
  } catch {
    return sendJson(response, 400, { error: 'Invalid checkout request.' });
  }

  const tier = supportTiers[body.tierId];
  if (!tier) {
    return sendJson(response, 400, { error: 'Unknown support tier.' });
  }

  try {
    const stripe = new Stripe(stripeSecretKey);
    const baseUrl = getBaseUrl(request);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      billing_address_collection: 'auto',
      customer_creation: 'if_required',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: tier.amountCents,
            product_data: {
              name: `GearVision Project Support - ${tier.title}`,
              description: tier.description,
            },
          },
        },
      ],
      metadata: {
        initiative: 'gearvision_site_support',
        support_tier_id: body.tierId,
        support_tier_label: tier.amountLabel,
      },
      success_url: `${baseUrl}/play-it-forward?support=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/play-it-forward?support=cancelled`,
    });

    return sendJson(response, 200, { url: session.url });
  } catch (error) {
    console.error('[GearVision] Stripe checkout error:', error);
    return sendJson(response, 500, { error: 'Could not create Stripe Checkout session.' });
  }
}
