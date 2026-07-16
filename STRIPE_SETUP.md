# GearVision Stripe Setup

GearVision uses Stripe Checkout for project support payments. This is framed as support for the website, data tooling, and product development. It is not a charity, nonprofit, or tax-deductible giving flow.

## 1. Create or connect Stripe

Use either path:

- Vercel Marketplace: install Stripe on the GearVision Vercel project.
- Stripe Dashboard: create a normal Stripe account and copy API keys manually.

The app uses hosted Stripe Checkout, so GearVision never sees or stores card details.

## 2. Add Vercel environment variables

In Vercel, open the GearVision project, then Settings -> Environment Variables.

Add these for Production, Preview, and Development as needed:

```env
STRIPE_SECRET_KEY=sk_test_or_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SITE_URL=https://www.gearvision.dev
```

Optional, but recommended if you want completed support payments to appear in Supabase aggregate metrics:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
```

Never put `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, or `STRIPE_WEBHOOK_SECRET` in client-side `VITE_` variables.

## 3. Configure the webhook

In Stripe Dashboard, create a webhook endpoint:

```text
https://www.gearvision.dev/api/stripe-webhook
```

Listen for:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`

Copy the signing secret into `STRIPE_WEBHOOK_SECRET` in Vercel.

## 4. Apply the Supabase schema

Run the latest `supabase/schema.sql` in the Supabase SQL editor. It adds `support_payments` and refreshes the public aggregate dashboard view.

`support_payments` is intended as a private server-written mirror of completed Stripe Checkout sessions. The public app only reads aggregate totals through `public_dashboard_metrics`.

## 5. Test the flow

For local testing:

1. Add test keys to `.env.local`.
2. Run `pnpm run dev`.
3. Open `/play-it-forward`.
4. Start a support checkout.
5. Use Stripe test card `4242 4242 4242 4242` with any future expiration date and any CVC.

For production testing, redeploy after setting env vars and use a small Stripe test-mode payment before switching to live keys.

## 6. Public wording

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
