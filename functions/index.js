const { onRequest } = require('firebase-functions/v2/https');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();

// Define secrets
const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');
const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');

// ======================
// PRODUCT/TIER CONFIGURATION
// Map Stripe Product Names to tools
// ======================
const PRODUCT_MAPPING = {
  // Single tools by product name (case-insensitive partial match)
  'diagnostic': { tools: ['diagnostic'], name: 'Business Diagnostic Tool', tier: 'single_diagnostic' },
  'business health': { tools: ['diagnostic'], name: 'Business Diagnostic Tool', tier: 'single_diagnostic' },
  'profit optimizer': { tools: ['diagnostic'], name: 'Business Diagnostic Tool', tier: 'single_diagnostic' },
  'blog builder': { tools: ['blog-builder'], name: 'Blog Builder', tier: 'single_blog' },
  'local seo': { tools: ['blog-builder'], name: 'Blog Builder', tier: 'single_blog' },
  'auto-rank': { tools: ['blog-builder'], name: 'Blog Builder', tier: 'single_blog' },
  'offer architect': { tools: ['offer-architect'], name: 'Offer Architect', tier: 'single_offer' },
  'conversion blueprint': { tools: ['offer-architect'], name: 'Offer Architect', tier: 'single_offer' },
  // Bundle products
  'alchemist vault': { tools: ['diagnostic', 'blog-builder', 'offer-architect'], name: 'Complete Bundle', tier: 'standard' },
  'lifetime access': { tools: ['diagnostic', 'blog-builder', 'offer-architect'], name: 'Complete Bundle', tier: 'standard' },
  '4 app bundle': { tools: ['diagnostic', 'blog-builder', 'offer-architect'], name: 'Complete Bundle', tier: 'standard' },
  // VIP
  'vip package': { tools: ['diagnostic', 'blog-builder', 'offer-architect'], name: 'VIP Package Deposit', tier: 'vip_deposit' },
  'white glove': { tools: ['diagnostic', 'blog-builder', 'offer-architect'], name: 'VIP Package Deposit', tier: 'vip_deposit' },
  'custom app': { tools: ['diagnostic', 'blog-builder', 'offer-architect'], name: 'VIP Package Deposit', tier: 'vip_deposit' },
};

// Fallback by tier metadata
const TIERS = {
  single_diagnostic: { tools: ['diagnostic'], name: 'Business Diagnostic Tool' },
  single_blog: { tools: ['blog-builder'], name: 'Blog Builder' },
  single_offer: { tools: ['offer-architect'], name: 'Offer Architect' },
  standard: { tools: ['diagnostic', 'blog-builder', 'offer-architect'], name: 'Complete Bundle' },
  vip_deposit: { tools: ['diagnostic', 'blog-builder', 'offer-architect'], name: 'VIP Package Deposit' },
};

// Helper: Detect product from line items or product name
function detectProductFromSession(session, lineItems) {
  // First check metadata
  if (session.metadata?.tier) {
    const tierConfig = TIERS[session.metadata.tier];
    if (tierConfig) {
      return { ...tierConfig, tier: session.metadata.tier };
    }
  }
  
  // Try to detect from line items (product names)
  if (lineItems && lineItems.data) {
    for (const item of lineItems.data) {
      const productName = item.description?.toLowerCase() || '';
      for (const [key, config] of Object.entries(PRODUCT_MAPPING)) {
        if (productName.includes(key.toLowerCase())) {
          console.log(`Detected product: "${key}" from "${item.description}"`);
          return config;
        }
      }
    }
  }
  
  // Fallback: detect by amount
  const amount = session.amount_total / 100;
  if (amount >= 4500) return { ...TIERS.vip_deposit, tier: 'vip_deposit' };
  if (amount >= 450) return { ...TIERS.standard, tier: 'standard' };
  // Single tools are all same price, default to diagnostic if can't determine
  return { ...TIERS.single_diagnostic, tier: 'single_diagnostic' };
}

// ======================
// STRIPE WEBHOOK HANDLER
// Handles Buy Buttons, Payment Links and Checkout Sessions
// ======================
exports.stripeWebhook = onRequest(
  { secrets: [stripeSecretKey, stripeWebhookSecret] },
  async (req, res) => {
    const stripe = require('stripe')(stripeSecretKey.value());
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        stripeWebhookSecret.value()
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const customerEmail = session.customer_details?.email || session.customer_email;
        const amount = session.amount_total / 100;
        
        console.log('Payment completed:', {
          sessionId: session.id,
          email: customerEmail,
          amount: amount,
        });

        if (!customerEmail) {
          console.error('No customer email found in session');
          return res.status(400).json({ error: 'No customer email' });
        }

        // Retrieve line items to detect product
        let lineItems = null;
        try {
          lineItems = await stripe.checkout.sessions.listLineItems(session.id);
        } catch (e) {
          console.log('Could not retrieve line items:', e.message);
        }
        
        // Detect which product was purchased
        const productConfig = detectProductFromSession(session, lineItems);
        console.log('Detected product config:', productConfig);
        
        // Check if user exists with this email
        const users = await db
          .collection('users')
          .where('email', '==', customerEmail)
          .get();

        const accessData = {
          tier: productConfig.tier,
          tierName: productConfig.name,
          tools: productConfig.tools,
          stripeSessionId: session.id,
          stripeCustomerId: session.customer,
          purchaseDate: admin.firestore.FieldValue.serverTimestamp(),
          paidAmount: amount,
        };

        if (users.empty) {
          // Create a pending payment document
          const pendingId = `pending_${customerEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
          await db.collection('pendingPayments').doc(pendingId).set({
            email: customerEmail,
            ...accessData,
            processed: false,
          });
          console.log('Created pending payment for:', customerEmail, 'Tier:', productConfig.tier, 'Tools:', productConfig.tools);
        } else {
          // Update existing user document
          const userDoc = users.docs[0];
          const existingData = userDoc.data();
          
          // Merge tools if user is upgrading
          let allTools = [...new Set([...(existingData.tools || []), ...productConfig.tools])];
          
          await userDoc.ref.update({
            ...accessData,
            tools: allTools,
            hasLifetimeAccess: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          console.log('Updated existing user:', customerEmail, 'Tools:', allTools);
        }
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// ======================
// REGISTER USER AFTER PAYMENT
// Called when user signs up after paying
// ======================
exports.registerPaidUser = onCall(async (request) => {
  const { email, password, displayName } = request.data;
  
  if (!email || !password) {
    throw new HttpsError('invalid-argument', 'Email and password required');
  }

  try {
    // Check if this email has a pending payment
    const pendingId = `pending_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const pendingDoc = await db.collection('pendingPayments').doc(pendingId).get();
    
    if (!pendingDoc.exists) {
      throw new HttpsError('permission-denied', 'No payment found for this email. Please purchase first.');
    }

    const pendingData = pendingDoc.data();
    
    // Create Firebase Auth user
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: displayName || email.split('@')[0],
    });

    // Create user document with tier-based access
    await db.collection('users').doc(userRecord.uid).set({
      email: email,
      displayName: displayName || email.split('@')[0],
      hasLifetimeAccess: true,
      tier: pendingData.tier,
      tierName: pendingData.tierName,
      tools: pendingData.tools,
      stripeSessionId: pendingData.stripeSessionId,
      stripeCustomerId: pendingData.stripeCustomerId,
      purchaseDate: pendingData.purchaseDate,
      paidAmount: pendingData.paidAmount,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Mark pending payment as processed
    await pendingDoc.ref.update({ processed: true });

    // Create custom token for auto-login
    const customToken = await admin.auth().createCustomToken(userRecord.uid);

    return { 
      success: true, 
      customToken: customToken,
      uid: userRecord.uid,
      tools: pendingData.tools,
    };
  } catch (error) {
    console.error('Register paid user error:', error);
    if (error.code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'An account with this email already exists. Please sign in.');
    }
    throw new HttpsError('internal', error.message);
  }
});

// ======================
// VERIFY USER ACCESS
// Returns which tools user has access to
// ======================
exports.verifyAccess = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User not authenticated');
  }

  try {
    const userDoc = await db.collection('users').doc(request.auth.uid).get();
    
    if (!userDoc.exists) {
      return { hasAccess: false, tools: [] };
    }

    const userData = userDoc.data();
    return {
      hasAccess: userData.hasLifetimeAccess === true,
      tools: userData.tools || [],
      tier: userData.tier,
      tierName: userData.tierName,
      purchaseDate: userData.purchaseDate,
      paidAmount: userData.paidAmount,
    };
  } catch (error) {
    console.error('Verify access error:', error);
    throw new HttpsError('internal', error.message);
  }
});

// ======================
// CHECK PENDING PAYMENT
// ======================
exports.checkPendingPayment = onCall(async (request) => {
  const { email } = request.data;
  
  if (!email) {
    throw new HttpsError('invalid-argument', 'Email required');
  }

  try {
    const pendingId = `pending_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const pendingDoc = await db.collection('pendingPayments').doc(pendingId).get();
    
    if (pendingDoc.exists && !pendingDoc.data().processed) {
      return { 
        hasPending: true,
        tier: pendingDoc.data().tier,
        tools: pendingDoc.data().tools,
      };
    }
    return { hasPending: false };
  } catch (error) {
    console.error('Check pending payment error:', error);
    throw new HttpsError('internal', error.message);
  }
});

// ======================
// TEST WEBHOOK (for verification)
// Call this to verify the webhook endpoint is working
// ======================
exports.testWebhook = onRequest(async (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Webhook endpoint is reachable!',
    timestamp: new Date().toISOString(),
    method: req.method
  });
});

// ======================
// MANUAL GRANT ACCESS (admin emergency use)
// Use this if webhook fails and you need to manually grant access
// ======================
exports.grantAccess = onRequest(async (req, res) => {
  // Security: Only allow with secret key
  const secretKey = req.query.key;
  if (secretKey !== 'TCTC-GRANT-2025') {
    return res.status(403).json({ error: 'Invalid key' });
  }

  const email = req.query.email;
  const tier = req.query.tier || 'standard'; // standard, vip_deposit, single_diagnostic, single_blog, single_offer
  
  if (!email) {
    return res.status(400).json({ error: 'Email required. Use ?email=user@example.com&tier=standard' });
  }

  const tierConfig = TIERS[tier];
  if (!tierConfig) {
    return res.status(400).json({ 
      error: 'Invalid tier', 
      validTiers: Object.keys(TIERS) 
    });
  }

  try {
    // Create pending payment for this email
    const pendingId = `pending_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
    await db.collection('pendingPayments').doc(pendingId).set({
      email: email,
      tier: tier,
      tierName: tierConfig.name,
      tools: tierConfig.tools,
      stripeSessionId: 'manual_grant_' + Date.now(),
      stripeCustomerId: null,
      purchaseDate: admin.firestore.FieldValue.serverTimestamp(),
      paidAmount: 0,
      processed: false,
      manualGrant: true,
      grantedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ 
      success: true, 
      message: `Access granted for ${email}`,
      tier: tier,
      tools: tierConfig.tools,
      nextStep: 'User can now create account at login page with this email'
    });
  } catch (error) {
    console.error('Grant access error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ======================
// CHECK PENDING PAYMENTS (admin view)
// See all pending payments waiting for account creation
// ======================
exports.listPending = onRequest(async (req, res) => {
  const secretKey = req.query.key;
  if (secretKey !== 'TCTC-ADMIN-2025') {
    return res.status(403).json({ error: 'Invalid key' });
  }

  try {
    const pending = await db.collection('pendingPayments').where('processed', '==', false).get();
    const results = [];
    pending.forEach(doc => {
      const data = doc.data();
      results.push({
        id: doc.id,
        email: data.email,
        tier: data.tier,
        tools: data.tools,
        paidAmount: data.paidAmount,
        purchaseDate: data.purchaseDate
      });
    });
    
    res.json({ 
      count: results.length,
      pendingPayments: results 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ======================
// SETUP ADMIN (one-time use)
// Call this endpoint to create admin user
// ======================
exports.setupAdmin = onRequest(async (req, res) => {
  // Security: Only allow with secret key
  const secretKey = req.query.key;
  if (secretKey !== 'TCTC-SETUP-2025') {
    return res.status(403).json({ error: 'Invalid key' });
  }

  const email = 'Will@tctcusa.com';
  const password = 'inGODwetrust7!';

  try {
    // Check if user already exists
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
      console.log('User already exists:', userRecord.uid);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Create new user
        userRecord = await admin.auth().createUser({
          email: email,
          password: password,
          displayName: 'Will Admin'
        });
        console.log('Created new user:', userRecord.uid);
      } else {
        throw error;
      }
    }

    // Create/update user document with full access
    await db.collection('users').doc(userRecord.uid).set({
      email: email,
      displayName: 'Will Admin',
      hasLifetimeAccess: true,
      tier: 'admin',
      tierName: 'Administrator',
      tools: ['diagnostic', 'blog-builder', 'offer-architect'],
      isAdmin: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    res.json({ 
      success: true, 
      message: 'Admin user created/updated!',
      email: email,
      uid: userRecord.uid,
      tools: ['diagnostic', 'blog-builder', 'offer-architect']
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({ error: error.message });
  }
});
