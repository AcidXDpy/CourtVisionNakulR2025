# GearVision Stripe Setup

GearVision uses Stripe Checkout for project support payments. The wording is intentionally product-support oriented: money helps keep the website, data tooling, and product development moving. It is not a charity, nonprofit, or tax-deductible donation flow.

## What Is Already Built

- `POST /api/create-checkout-session`: creates a hosted Stripe Checkout Session for one of the GearVision support tiers.
- `GET /api/checkout-session?session_id=...`: verifies the returned Checkout Session before the UI shows a confirmed payment message.
- `POST /api/stripe-webhook`: verifies Stripe webhook signatures and mirrors safe payment records into Supabase when server-only Supabase env vars exist.
- `/play-it-forward`: displays the support tiers, redirects to Stripe, and shows confirmed/cancelled/pending checkout states.

GearVision never sees or stores card details. Stripe handles the payment page.

## Required Vercel Environment Variables

In Vercel, open the GearVision project, then go to **Settings -> Environment Variables**.

Add these to Production and Preview:

```env
STRIPE_SECRET_KEY=sk_test_or_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SITE_URL=https://court-vision-nakul-r2025.vercel.app
```

Notes:

- Use `sk_test_...` while testing. Use `sk_live_...` only when you are ready to accept real payments.
- `SITE_URL` controls the success/cancel redirect URL. Keep it as the public production URL.
- This flow does not need a browser publishable key because it uses hosted Checkout through a serverless function.
- Never create `VITE_STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_SECRET_KEY`, or any client-exposed secret variable.

Optional, recommended for Supabase aggregate metrics:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
```

`SUPABASE_SERVICE_ROLE_KEY` must stay server-only. Do not expose it in the Vite client bundle.

## Stripe Dashboard Configuration

1. Open Stripe Dashboard.
2. Stay in **Test mode** first.
3. Copy your **Secret key** into `STRIPE_SECRET_KEY` in Vercel.
4. Go to **Developers -> Webhooks**.
5. Add an endpoint:

```text
https://court-vision-nakul-r2025.vercel.app/api/stripe-webhook
```

6. Select these events:

```text
checkout.session.completed
checkout.session.async_payment_succeeded
checkout.session.async_payment_failed
checkout.session.expired
```

7. Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET` in Vercel.
8. Redeploy the Vercel project after adding or changing env vars.

## Supabase Setup

Run the latest `supabase/schema.sql` in Supabase SQL Editor if you have not already. It includes the `support_payments` table and public aggregate dashboard metrics.

`support_payments` is a private server-written mirror. The public app only reads aggregate totals through `public_dashboard_metrics`.

## Local Testing

Create `.env.local`:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SITE_URL=http://127.0.0.1:5173
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
```

For UI-only local work, run the app with Vite:

```bash
pnpm run dev
```

For the full Stripe flow locally, use Vercel's local runtime so `/api/*` functions run too:

```bash
pnpm dlx vercel dev
```

Open the local URL Vercel prints, usually:

```text
http://127.0.0.1:3000/play-it-forward
```

Use Stripe's test card:

```text
4242 4242 4242 4242
```

Use any future expiration date, any CVC, and any ZIP code.

For webhook testing locally, use the Stripe CLI:

```bash
stripe listen --forward-to http://127.0.0.1:3000/api/stripe-webhook
```

Copy the `whsec_...` value from the CLI into `.env.local` as `STRIPE_WEBHOOK_SECRET`.

## Production Checklist

- Test-mode checkout succeeds on the production Vercel URL.
- Webhook endpoint returns 200 in Stripe's webhook log.
- `support_payments` receives a row when Supabase server env vars are configured.
- Public dashboard shows aggregate support dollars only, not private payer details.
- Switch from test keys to live keys only after the full test flow works.

## Public Wording

Use:

- Project support
- Support GearVision
- Contribution to keep the site online
- Helps cover hosting, tools, data work, and product improvements

Avoid:

- Charity
- Nonprofit
- Tax-deductible
- Fundraiser claims
- Invented traction or impact totals
