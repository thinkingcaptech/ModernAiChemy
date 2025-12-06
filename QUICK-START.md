# 🚀 QUICK START REFERENCE

## Current Status: **READY FOR LOCAL TESTING** ✅

Your Modern Alchemy platform is fully built and ready to test **without Stripe**. Here's what to do next.

---

## 1️⃣ TEST LOCALLY (Right Now - No Stripe Needed)

```bash
# Start Firebase Emulator
firebase emulators:start
```

**Then visit**: http://localhost:5000

**Test these flows:**
- ✅ Landing page (see animated pricing: $2,500 → $997 → $797)
- ✅ Sign up (create test account)
- ✅ Login (with test account)
- ✅ View dashboard (with manual payment flag in Firestore)
- ✅ Settings page (add test API keys)

**Detailed guide**: See `SETUP-AND-TESTING.md`

---

## 2️⃣ GET STRIPE CREDENTIALS (Next Step)

You need 3 things from Stripe:

### **A. Publishable Key**
- Go to: https://dashboard.stripe.com
- Click: **Developers** → **API Keys**
- Copy: `pk_test_...` or `pk_live_...`

### **B. Secret Key**
- Same page as above
- Copy: `sk_test_...` or `sk_live_...`

### **C. Webhook Signing Secret**
- Go to: **Developers** → **Webhooks**
- Click: **Add endpoint**
- Endpoint URL: `https://modern-aichemy-dashboard-dec25.web.app/.netlify/functions/stripeWebhook`
- Events: `checkout.session.completed` + `payment_intent.succeeded`
- Click: **Add endpoint** → View details → Copy: `whsec_...`

---

## 3️⃣ CONFIGURE FIREBASE (After Getting Credentials)

```bash
# Set environment variables
firebase functions:config:set stripe.key="sk_YOUR_KEY_HERE"
firebase functions:config:set stripe.webhook_secret="whsec_YOUR_SECRET_HERE"

# Update index.html manually
# Find line with: const stripe = Stripe('pk_live_YOUR_STRIPE_KEY_HERE');
# Replace with your Publishable Key
```

---

## 4️⃣ DEPLOY TO FIREBASE

```bash
# Deploy Cloud Functions
firebase deploy --only functions

# Deploy hosting
firebase deploy --only hosting
```

---

## 5️⃣ TEST PAYMENT FLOW

1. Go to: https://modern-aichemy-dashboard-dec25.web.app
2. Click: **Get Lifetime Access Now**
3. Use test card: **4242 4242 4242 4242**
4. Any future date (e.g., 12/25)
5. Any 3-digit CVC (e.g., 123)
6. Verify: 
   - ✅ Redirects to success page
   - ✅ Firestore updated with `hasLifetimeAccess: true`
   - ✅ Can login and access dashboard

---

## 📂 KEY FILES

| File | Purpose | Status |
|------|---------|--------|
| `index.html` | Landing page | ✅ Ready |
| `login.html` | Auth | ✅ Ready |
| `dashboard.html` | Tool hub | ✅ Ready |
| `settings.html` | BYOK manager | ✅ Ready |
| `functions/index.js` | Stripe integration | ✅ Ready (needs keys) |
| `firestore.rules` | Security | ✅ Ready |

---

## 💰 PRICING (What You're Selling)

- **Price**: $797 (one-time, lifetime access)
- **Marked down from**: $997 (2nd tier shown with strikethrough)
- **Originally**: $2,500 (shown with strikethrough animation)
- **Payment**: Stripe checkout
- **No recurring**: One-time purchase
- **AI keys**: User provides their own (Gemini, OpenAI, Anthropic, Grok)

---

## 📋 CHECKLIST

### Before Testing Locally
- [ ] Firebase CLI installed
- [ ] Node.js v20+ installed
- [ ] You're in the project directory: `c:\Users\think\OneDrive\Desktop\launch\modern-aichemy-dashboard-dec25`

### Before Deploying
- [ ] Stripe credentials obtained (all 3: Publishable, Secret, Webhook)
- [ ] Environment variables set in Firebase
- [ ] Tested payment flow locally
- [ ] Reviewed firestore.rules

### Before Going Live (Production)
- [ ] All 5 tools ported
- [ ] End-to-end testing passed
- [ ] Switched to live Stripe keys
- [ ] Custom domain configured (optional)

---

## 🆘 TROUBLESHOOTING

### Emulator won't start
```bash
# Clear everything and try again
firebase emulators:stop
firebase emulators:start
```

### Firestore documents not visible
1. Open: http://localhost:4000 (Emulator UI)
2. Go to **Firestore** tab
3. Hard refresh the page (Ctrl+Shift+R)

### Login loop
1. Check that user has `hasLifetimeAccess: true` in Firestore
2. User path should be: `users/[USER_ID]/`

### "Cannot find Stripe"
```bash
cd functions
npm install
cd ..
firebase emulators:start
```

---

## 📞 WHAT YOU NEED TO PROVIDE

To integrate Stripe:

1. **Stripe Publishable Key**: `pk_test_...` or `pk_live_...`
2. **Stripe Secret Key**: `sk_test_...` or `sk_live_...`
3. **Webhook Signing Secret**: `whsec_...`

Once you have these, we can:
- ✅ Integrate Stripe checkout
- ✅ Test payment flow
- ✅ Deploy to Firebase
- ✅ Start porting the 5 tools

---

## 🎯 NEXT PHASES (After Stripe)

### Phase 4: Tool Integration (12-15 hours)
1. **Book Learning Module** - Remove comments, add BYOK
2. **Business Diagnostic** - BYOK reference implementation
3. **Blog Builder** - Backend refactor for BYOK
4. **Sales CRM** - Add BYOK UI
5. **Offer Architect** - Full BYOK refactor

### Phase 5: Testing & Launch (2-3 hours)
1. End-to-end testing
2. Security review
3. Production deployment
4. Monitor logs

---

## 📖 DOCUMENTATION

For detailed guides, see:
- **Testing**: `SETUP-AND-TESTING.md`
- **Stripe Setup**: `STRIPE-SETUP.md`
- **Deployment**: `DEPLOYMENT-CHECKLIST.md`
- **Full Summary**: `BUILD-SUMMARY.md`

---

## 🚀 YOU ARE HERE

```
Foundation (Phase 1-2) ✅ COMPLETE
         ↓
Stripe Integration (Phase 3) ← YOU ARE HERE
         ↓
Tool Integration (Phase 4)
         ↓
Testing & Launch (Phase 5)
```

**Ready?** Start with `firebase emulators:start` and follow `SETUP-AND-TESTING.md`

---

*Last Updated: December 3, 2025*
*Project: Modern Alchemy - Business in a Box*
