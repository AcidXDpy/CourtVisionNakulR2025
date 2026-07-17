import Stripe from 'stripe';

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(payload));
}

async function readRawBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function getSupabaseUrl() {
  return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
}

async function recordSupportPayment(session) {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.info('[GearVision] Supabase service env vars missing. Skipping support payment mirror.');
    return;
  }

  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/support_payments?on_conflict=stripe_session_id`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify({
      stripe_session_id: session.id,
      stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null,
      status: session.payment_status || session.status || 'unknown',
      amount_total: session.amount_total || 0,
      currency: session.currency || 'usd',
      support_tier_id: session.metadata?.support_tier_id || null,
      supporter_email: session.customer_details?.email || session.customer_email || null,
      supporter_name: session.customer_details?.name || null,
      payload: session,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Supabase support payment mirror failed: ${message}`);
  }
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return sendJson(response, 405, { error: 'Method not allowed.' });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeSecretKey || !webhookSecret) {
    return sendJson(response, 503, { error: 'Stripe webhook is not configured yet.' });
  }

  const stripe = new Stripe(stripeSecretKey);
  const signature = request.headers['stripe-signature'];
  const rawBody = await readRawBody(request);

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.warn('[GearVision] Stripe webhook signature failed:', error.message);
    return sendJson(response, 400, { error: 'Invalid Stripe signature.' });
  }

  try {
    if (
      event.type === 'checkout.session.completed'
      || event.type === 'checkout.session.async_payment_succeeded'
      || event.type === 'checkout.session.async_payment_failed'
      || event.type === 'checkout.session.expired'
    ) {
      await recordSupportPayment(event.data.object);
    }
  } catch (error) {
    console.error('[GearVision] Stripe webhook processing error:', error);
    return sendJson(response, 500, { error: 'Webhook received, but support payment recording failed.' });
  }

  return sendJson(response, 200, { received: true });
}
