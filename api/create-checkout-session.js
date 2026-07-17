import Stripe from 'stripe';
import { supportTiersById } from '../src/data/supportTiers.js';

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
  const configuredUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (configuredUrl) return configuredUrl.startsWith('http') ? configuredUrl.replace(/\/$/, '') : `https://${configuredUrl.replace(/\/$/, '')}`;

  const origin = request.headers.origin;
  if (origin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) return origin.replace(/\/$/, '');

  const host = request.headers['x-forwarded-host'] || request.headers.host || 'court-vision-nakul-r2025.vercel.app';
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

  const tier = supportTiersById[body.tierId];
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
      client_reference_id: `gearvision_support:${body.tierId}`,
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
      payment_intent_data: {
        metadata: {
          initiative: 'gearvision_site_support',
          support_tier_id: body.tierId,
          support_tier_label: tier.amountLabel,
        },
      },
      metadata: {
        initiative: 'gearvision_site_support',
        support_tier_id: body.tierId,
        support_tier_label: tier.amountLabel,
      },
      custom_text: {
        submit: {
          message: 'Your contribution supports GearVision site hosting, data tooling, and product development. It is not a tax-deductible charitable donation.',
        },
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
