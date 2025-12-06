# Stripe Integration Guide

This guide explains how to integrate Stripe into the Modern Alchemy platform once you have your Stripe credentials.

## What You Need from Stripe

1. **Stripe Account** - https://dashboard.stripe.com
2. **Publishable Key** - `pk_test_...` (for testing) or `pk_live_...` (production)
3. **Secret Key** - `sk_test_...` (for testing) or `sk_live_...` (production)
4. **Webhook Endpoint Secret** - Generated when you create a webhook endpoint

## Getting Your Stripe Credentials

### 1. Get Your API Keys

1. Go to https://dashboard.stripe.com
2. Click **Developers** → **API Keys**
3. You'll see:
   - **Publishable key** (pk_...)
   - **Secret key** (sk_...)
4. Copy both (we'll use these later)

### 2. Create Webhook Endpoint

1. Still in Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your Firebase Hosting URL: `https://modern-aichemy-dashboard-dec25.web.app`
4. Add path: `/functions/stripeWebhook`
5. Full URL: `https://modern-aichemy-dashboard-dec25.web.app/.netlify/functions/stripeWebhook`
6. Select events to listen to:
   - `checkout.session.completed` ✓
   - `payment_intent.succeeded` ✓
7. Click **Add endpoint**
8. View details and copy **Signing secret** (whsec_...)

## Configuration Steps

### Step 1: Set Environment Variables in Firebase

```bash
firebase functions:config:set stripe.key="sk_YOUR_SECRET_KEY_HERE"
firebase functions:config:set stripe.webhook_secret="whsec_YOUR_WEBHOOK_SECRET_HERE"
```

### Step 2: Update functions/index.js

Replace the placeholder keys at the top of the file:

```javascript
const STRIPE_SECRET_KEY = process.env.STRIPE_KEY || 'sk_YOUR_SECRET_KEY_HERE';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_YOUR_WEBHOOK_SECRET_HERE';
```

### Step 3: Update index.html with Publishable Key

In `index.html`, update the Stripe initialization:

```javascript
const stripe = Stripe('pk_YOUR_PUBLISHABLE_KEY_HERE');
```

Change `pk_live_YOUR_STRIPE_KEY_HERE` to your actual Publishable Key.

### Step 4: Update Success/Cancel Redirect URLs

In `functions/index.js`, update the redirect URLs in `createCheckout()`:

```javascript
const session = await stripe.checkout.sessions.create({
  // ... other config ...
  success_url: 'https://modern-aichemy-dashboard-dec25.web.app/payment-success.html?session_id={CHECKOUT_SESSION_ID}',
  cancel_url: 'https://modern-aichemy-dashboard-dec25.web.app/index.html',
  // ... rest of config ...
});
```

## Testing Stripe Integration

### Using Stripe Test Mode

1. Keep `sk_test_...` and `pk_test_...` keys
2. Use Stripe's test card numbers:
   - **Successful payment**: `4242 4242 4242 4242`
   - **Failed payment**: `4000 0000 0000 0002`
   - **Requires authentication**: `4000 0025 0000 3155`

3. Any future expiry date (e.g., 12/25)
4. Any 3-digit CVC (e.g., 123)

### Test Payment Flow

1. Start Firebase emulator: `firebase emulators:start`
2. Go to landing page: http://localhost:5000
3. Click "Get Lifetime Access Now"
4. Enter test card: `4242 4242 4242 4242`
5. Complete checkout
6. Should redirect to `/payment-success.html`
7. Check Firebase Firestore - user document should have:
   ```
   hasLifetimeAccess: true
   paymentId: "stripe_payment_id"
   paymentDate: (timestamp)
   ```

## Deploying to Production

### 1. Deploy Cloud Functions with Config

```bash
firebase deploy --only functions
```

Firebase will use the environment variables you set earlier.

### 2. Deploy Hosting

```bash
firebase deploy --only hosting
```

### 3. Update Webhook Endpoint

Once you're in production with live keys:

1. Go to Stripe Dashboard → Webhooks
2. Create a NEW endpoint for production
3. Point to: `https://modern-aichemy-dashboard-dec25.web.app/.netlify/functions/stripeWebhook`
4. Copy the new Signing secret
5. Update Firebase config:

```bash
firebase functions:config:set stripe.webhook_secret="whsec_PRODUCTION_SECRET"
firebase deploy --only functions
```

## Payment Flow Summary

```
User clicks "Get Lifetime Access"
    ↓
Client calls createCheckout() Cloud Function
    ↓
Function creates Stripe Checkout Session
    ↓
User redirected to Stripe Hosted Checkout
    ↓
User completes payment
    ↓
Stripe sends webhook to /stripeWebhook
    ↓
Function verifies webhook signature
    ↓
Function updates user document: hasLifetimeAccess = true
    ↓
User redirected to payment-success.html
    ↓
User can login and access dashboard
```

## Troubleshooting

### Webhook Not Firing

1. Check webhook endpoint URL in Stripe Dashboard
2. Verify it matches: `https://modern-aichemy-dashboard-dec25.web.app/.netlify/functions/stripeWebhook`
3. Check Firebase Function logs:
   ```bash
   firebase functions:log
   ```
4. Check Stripe Webhook logs in Dashboard

### Payment Status Not Updating

1. Verify webhook signature verification is passing
2. Check that Cloud Function has permission to write to Firestore
3. Verify Firestore security rules allow webhook to update documents:
   ```
   hasPaid() function must return true for webhook operations
   ```

### Test vs Production Keys Mixed Up

If you accidentally mix test and live keys:

1. Check which keys are in your environment:
   ```bash
   firebase functions:config:get
   ```
2. Update with correct keys:
   ```bash
   firebase functions:config:set stripe.key="sk_test_..."
   firebase deploy --only functions
   ```

## Security Best Practices

1. **Never commit keys to git** - Use Firebase environment config instead
2. **Webhook signature verification** - Already implemented in functions/index.js
3. **HTTPS only** - Firebase Hosting provides this automatically
4. **Firestore rules** - Already include payment verification checks
5. **Test thoroughly** before going live

## Stripe Features We're Using

✅ **Checkout Sessions** - Secure hosted checkout
✅ **Webhooks** - Payment confirmation notifications
✅ **One-time payments** - Not recurring subscriptions
✅ **No PCI compliance needed** - Stripe handles card data
✅ **BYOK** - No API key exposure to Stripe

## Next: Tool Integration

Once Stripe is fully integrated and tested:

1. **Port Tool 1** - Book Learning Module (remove comments)
2. **Port Tool 2** - Business Diagnostic (reference BYOK pattern)
3. **Port Tool 3-5** - Blog Builder, CRM, Offer Architect

See `SETUP-AND-TESTING.md` for testing checklist.
