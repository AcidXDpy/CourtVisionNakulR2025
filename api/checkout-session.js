import Stripe from 'stripe';

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(payload));
}

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return sendJson(response, 405, { error: 'Method not allowed.' });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return sendJson(response, 503, { error: 'Stripe is not configured yet.' });
  }

  const url = new URL(request.url, `https://${request.headers.host || 'gearvision.local'}`);
  const sessionId = url.searchParams.get('session_id');

  if (!sessionId || !sessionId.startsWith('cs_')) {
    return sendJson(response, 400, { error: 'Missing or invalid Stripe Checkout session id.' });
  }

  try {
    const stripe = new Stripe(stripeSecretKey);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.metadata?.initiative !== 'gearvision_site_support') {
      return sendJson(response, 404, { error: 'Checkout session was not created for GearVision support.' });
    }

    return sendJson(response, 200, {
      id: session.id,
      status: session.status,
      paymentStatus: session.payment_status,
      amountTotal: session.amount_total || 0,
      currency: session.currency || 'usd',
      supportTierId: session.metadata?.support_tier_id || null,
      supportTierLabel: session.metadata?.support_tier_label || null,
      customerEmail: session.customer_details?.email || session.customer_email || null,
    });
  } catch (error) {
    console.error('[GearVision] Stripe session lookup error:', error);
    return sendJson(response, 500, { error: 'Could not verify Stripe Checkout session.' });
  }
}
