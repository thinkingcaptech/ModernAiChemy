# Modern Alchemy - Setup & Testing Guide

This guide will help you test the entire application locally before setting up Stripe.

## Prerequisites

- Firebase CLI installed (`npm install -g firebase-tools`)
- Node.js v20+ installed
- Git installed
- Firebase project: `modern-aichemy-dashboard-dec25` created

## Local Setup Steps

### 1. Install Firebase CLI (if not already installed)

```bash
npm install -g firebase-tools
```

### 2. Login to Firebase

```bash
firebase login
```

### 3. Initialize Firebase in the project folder

```bash
cd c:\Users\think\OneDrive\Desktop\launch\modern-aichemy-dashboard-dec25
firebase init
```

When prompted:
- Select "Firestore", "Functions", and "Hosting"
- Use existing project: `modern-aichemy-dashboard-dec25`
- Accept defaults for most options
- Set public directory to `.` (current directory)

### 4. Install Cloud Functions dependencies

```bash
cd functions
npm install
cd ..
```

### 5. Start the Firebase Emulator Suite

```bash
firebase emulators:start
```

This will start:
- **Emulator UI**: http://localhost:4000
- **Firestore**: http://localhost:8080
- **Authentication**: http://localhost:9099
- **Cloud Functions**: http://localhost:5001
- **Hosting**: http://localhost:5000

## Testing Flow

### Step 1: Access the Landing Page

1. Open browser to `http://localhost:5000`
2. You should see:
   - Modern Alchemy hero
   - Features section with 5 tools
   - **Animated pricing** showing: $2,500 → $997 → $797
   - "Get Lifetime Access Now" button

### Step 2: Test Authentication Flow

1. Click "Already have access?" or navigate to `http://localhost:5000/login.html`
2. Click "Sign Up" tab
3. Fill in:
   - Email: `test@example.com`
   - Password: `TestPassword123!`
   - Confirm Password: `TestPassword123!`
4. Click "Create Account"
5. Should see success message

### Step 3: Test Payment Verification (Bypass for Testing)

Since we're not integrating Stripe yet, manually set payment status:

1. Open Firebase Emulator UI: http://localhost:4000
2. Go to **Firestore** tab
3. Create a document at path: `users/[USER_UID]/`
4. Add field: `hasLifetimeAccess: true`
5. Also add: `email: test@example.com`

### Step 4: Test Login with Payment Access

1. Return to `http://localhost:5000/login.html`
2. Login with:
   - Email: `test@example.com`
   - Password: `TestPassword123!`
3. Should redirect to **Dashboard** (`/dashboard.html`)

### Step 5: Verify Dashboard

1. Should see:
   - Header with user name and "Sign Out" button
   - Welcome message
   - Info box about BYOK
   - **5 Tool Cards**:
     - 📚 30-Day Course
     - 🏥 Business Diagnostic
     - 📝 Blog Builder
     - 📊 Sales CRM
     - ⚗️ Offer Architect
   - **Settings & API Keys** card

### Step 6: Test Settings Page

1. Click on "Settings & API Keys" card
2. Should see 4 API key sections:
   - 🤖 Google Gemini
   - 🧠 OpenAI (GPT-4)
   - 📖 Anthropic Claude
   - ⚡ xAI Grok
3. Each should have:
   - API Key input field
   - Status badge (showing "Not Configured")
   - Save / Test / Clear buttons

### Step 7: Test API Key Storage

1. Add a test Gemini key (use a dummy value like `test-key-12345`)
2. Click "Save Key"
3. Should see success message
4. Status badge should change to "Configured ✓"
5. Open Firebase Emulator → Firestore
6. Navigate to: `users/[USER_UID]/private/api_keys`
7. Should see the key stored

## Testing Checklist

- [ ] Landing page loads with animated pricing ($2,500 → $997 → $797)
- [ ] Sign up creates user account
- [ ] Manual payment flag (`hasLifetimeAccess: true`) works
- [ ] Login redirects to dashboard
- [ ] Dashboard loads all 5 tool cards
- [ ] Settings page shows all 4 API providers
- [ ] API keys can be saved and retrieved
- [ ] API key status badges update
- [ ] Logout works and returns to login page

## Before Setting Up Stripe

Once you confirm everything above works, we'll need:

1. **Stripe Account Credentials**:
   - Publishable Key (`pk_live_...` or `pk_test_...`)
   - Secret Key (`sk_live_...` or `sk_test_...`)
   - Webhook Secret (created in Stripe Dashboard)

2. **Configure Environment Variables**:
   ```bash
   firebase functions:config:set stripe.secret_key="sk_..."
   firebase functions:config:set stripe.webhook_secret="whsec_..."
   ```

3. **Update functions/index.js** with:
   - Stripe keys
   - Webhook endpoint URL
   - Success/Cancel redirect URLs

4. **Deploy to Firebase**:
   ```bash
   firebase deploy
   ```

## Troubleshooting

### "Cannot find module 'stripe'" error

```bash
cd functions
npm install
cd ..
firebase emulators:start
```

### Emulator UI not loading

Try clearing cache: http://localhost:4000 (hard refresh with Ctrl+Shift+R)

### Firestore documents not appearing

1. Make sure you're creating documents in the Emulator UI
2. Refresh the Firestore tab
3. Check the correct path: `users/[USER_UID]/...`

### Login loop (keeps redirecting)

1. Check that `hasLifetimeAccess: true` is set in Firestore
2. Verify user UID matches in Firestore
3. Check browser console for errors

## Next Steps

Once all tests pass:

1. Set up Stripe account (if not done)
2. Get Stripe keys
3. Create webhook endpoint in Stripe Dashboard
4. Update Cloud Functions with Stripe keys
5. Deploy to Firebase Hosting
6. Test end-to-end payment flow
7. Start Tool 1 integration (Book Learning Module)

## Questions?

Check Firebase logs:
```bash
firebase functions:log
```

Or inspect browser console (F12) for client-side errors.
