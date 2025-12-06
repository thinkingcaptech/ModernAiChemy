# Modern Alchemy - Platform Architecture & Data Flow

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER (Frontend)                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Landing    │  │    Auth      │  │  Dashboard   │              │
│  │   (Stripe)   │  │   (Firebase) │  │   (Tools)    │              │
│  │ index.html   │  │ login.html   │  │dashboard.html│              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│         ↓                  ↓                  ↓                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Success    │  │  Settings    │  │  5 Tools     │              │
│  │   (Post $)   │  │  (BYOK Keys) │  │  (To build)  │              │
│  │payment-      │  │settings.html │  │tools/*.html  │              │
│  │success.html  │  │              │  │              │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
      │ Firebase SDK │        │ REST API │        │ Database │
      ↓              ↓        ↓          ↓        ↓          ↓

┌─────────────────────────────────────────────────────────────────────┐
│                  FIREBASE BACKEND LAYER                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │         CLOUD FUNCTIONS (Node.js)                        │      │
│  ├──────────────────────────────────────────────────────────┤      │
│  │  • createCheckout()      → Creates Stripe session       │      │
│  │  • stripeWebhook()       → Handles payment completion   │      │
│  │  • verifyPayment()       → Checks user has paid         │      │
│  │  • testAPIKey()          → Validates user's API keys    │      │
│  └──────────────────────────────────────────────────────────┘      │
│                           ↕                                         │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │         FIRESTORE (NoSQL Database)                       │      │
│  ├──────────────────────────────────────────────────────────┤      │
│  │  /users/{uid}/                                           │      │
│  │    ├─ email, name, hasLifetimeAccess, paymentDate       │      │
│  │    └─ /private/api_keys/                                │      │
│  │       └─ [Encrypted] gemini, openai, anthropic, grok    │      │
│  │                                                          │      │
│  │  /payments/{paymentId}/                                 │      │
│  │    ├─ userId, amount, status, createdAt                 │      │
│  │                                                          │      │
│  │  /users/{uid}/courses/{courseId}/ [To build]            │      │
│  │  /users/{uid}/leads/{leadId}/ [To build]                │      │
│  │  /users/{uid}/blogs/{blogId}/ [To build]                │      │
│  │  /users/{uid}/diagnostics/{diagId}/ [To build]          │      │
│  │  /users/{uid}/offers/{offerId}/ [To build]              │      │
│  │                                                          │      │
│  └──────────────────────────────────────────────────────────┘      │
│                           ↕                                         │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │    AUTHENTICATION (Firebase Auth)                        │      │
│  ├──────────────────────────────────────────────────────────┤      │
│  │  • Email/Password authentication                         │      │
│  │  • User session management                              │      │
│  │  • JWT token generation                                 │      │
│  │  • Secure password hashing                              │      │
│  └──────────────────────────────────────────────────────────┘      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
      │ Stripe API │              │ HTTPS Webhook │
      ↓            ↓              ↓               ↓

┌─────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌────────────────┐              ┌─────────────────────────────┐  │
│  │   STRIPE       │              │  USER'S AI API KEYS         │  │
│  ├────────────────┤              ├─────────────────────────────┤  │
│  │ • Checkout     │              │ 🤖 Google Gemini            │  │
│  │ • Webhooks     │              │ 🧠 OpenAI (GPT-4)           │  │
│  │ • Payments     │              │ 📖 Anthropic Claude         │  │
│  │ • Test Cards   │              │ ⚡ xAI Grok                 │  │
│  └────────────────┘              │                             │  │
│                                  │ [Stored encrypted in        │  │
│                                  │  /users/{uid}/private/]     │  │
│                                  └─────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 User Journey & Data Flow

### Step 1: Landing → Sign Up

```
User visits index.html
     ↓
Views animated pricing ($2,500 → $997 → $797)
     ↓
Clicks "Get Lifetime Access Now"
     ↓
Stripe Checkout opens (embedded)
     ↓
User enters payment info
     ↓
Stripe processes payment
```

### Step 2: Payment → Webhook → Database Update

```
Payment successful
     ↓
Stripe sends webhook to Cloud Functions
     ↓
Function verifies webhook signature
     ↓
Function updates Firestore:
   /users/{uid}/
     ├─ hasLifetimeAccess: true
     ├─ paymentId: "stripe_xxx"
     └─ paymentDate: [timestamp]
     ↓
Firestore confirms update
```

### Step 3: User Logs In

```
User navigates to login.html
     ↓
Enters email & password
     ↓
Firebase Auth verifies credentials
     ↓
Cloud Function checks: hasPaid() = true?
     ↓
YES → Redirect to dashboard.html
NO  → Show "Access Denied" page
```

### Step 4: Dashboard Access

```
dashboard.html loads
     ↓
Displays 5 tool cards
     ├─ 📚 30-Day Course
     ├─ 🏥 Business Diagnostic
     ├─ 📝 Blog Builder
     ├─ 📊 Sales CRM
     ├─ ⚗️ Offer Architect
     └─ 🔑 Settings (BYOK)
     ↓
User clicks Settings card
```

### Step 5: API Key Management

```
settings.html loads
     ↓
Shows 4 API provider sections:
  🤖 Google Gemini
  🧠 OpenAI (GPT-4)
  📖 Anthropic Claude
  ⚡ xAI Grok
     ↓
User enters API key
     ↓
JavaScript encrypts key (client-side)
     ↓
Saves to Firestore:
  /users/{uid}/private/api_keys/
    └─ {provider}: [encrypted_key]
     ↓
Status badge updates: "Configured ✓"
```

### Step 6: Tool Access

```
User clicks tool card (e.g., "30-Day Course")
     ↓
Browser navigates to /tools/course.html
     ↓
Tool loads user data from Firestore
     ↓
Tool retrieves API key from /users/{uid}/private/api_keys/
     ↓
Tool uses user's API key for AI requests
     ↓
Results saved to /users/{uid}/courses/{id}/
```

---

## 🔐 Security Model

### Authentication & Authorization

```
User requests resource
     ↓
Firebase Auth validates JWT token
     ↓
Cloud Function extracts user UID from token
     ↓
Firestore rule checks: Can user access this document?
     ↓
Rule evaluates: isAuthenticated() && isOwner(uid) && hasPaid()
     ↓
Access granted → Return data
Access denied  → Return 403 Permission Denied
```

### API Key Protection

```
User's API Key
     ↓
NOT sent to server
     ↓
Stored client-side (encrypted in localStorage)
     ↓
Sent directly to AI provider (Gemini, OpenAI, etc.)
     ↓
BYOK = Backend can't access user keys
BYOK = User maintains complete privacy
```

### Firestore Rules

```
hasPaid() function:
  └─ Returns true if user.hasLifetimeAccess === true

Access patterns:
  ├─ /users/{uid}
  │  └─ Accessible only if: isAuthenticated() && isOwner(uid)
  │
  ├─ /users/{uid}/private/*
  │  └─ Accessible only if: isAuthenticated() && isOwner(uid)
  │
  ├─ /users/{uid}/courses/*
  │  └─ Accessible only if: isAuthenticated() && isOwner(uid) && hasPaid()
  │
  ├─ /users/{uid}/leads/*
  │  └─ Accessible only if: isAuthenticated() && isOwner(uid) && hasPaid()
  │
  └─ /admin/*
     └─ Accessible only if: request.auth.token.admin === true
```

---

## 💾 Data Model

### User Document

```javascript
/users/{uid}/
{
  email: "user@example.com",
  name: "User Name",
  hasLifetimeAccess: true,
  paymentId: "stripe_payment_xxx",
  paymentDate: timestamp,
  createdAt: timestamp
}
```

### API Keys (Private)

```javascript
/users/{uid}/private/api_keys/
{
  gemini: "encrypted_key_value",
  gemini_updated: timestamp,
  
  openai: "encrypted_key_value",
  openai_updated: timestamp,
  
  anthropic: "encrypted_key_value",
  anthropic_updated: timestamp,
  
  grok: "encrypted_key_value",
  grok_updated: timestamp
}
```

### Course Progress

```javascript
/users/{uid}/courses/{courseId}/
{
  dayNumber: 1,
  reflections: "user's response",
  completed: true,
  completedAt: timestamp,
  
  reflections: {
    "day_1": "text content",
    "day_2": "text content"
  }
}
```

### Leads (CRM)

```javascript
/users/{uid}/leads/{leadId}/
{
  name: "Lead Name",
  email: "lead@example.com",
  status: "prospect" | "qualified" | "contacted" | "closed",
  score: 85,
  createdAt: timestamp,
  lastContact: timestamp
}
```

### Blog Posts

```javascript
/users/{uid}/blogs/{blogId}/
{
  title: "Blog Post Title",
  content: "generated content",
  template: "template_name",
  language: "en",
  createdAt: timestamp,
  published: false
}
```

### Diagnostics

```javascript
/users/{uid}/diagnostics/{diagId}/
{
  businessName: "Company Name",
  bottlenecks: ["issue1", "issue2"],
  recommendations: ["rec1", "rec2"],
  completedAt: timestamp
}
```

### Offers

```javascript
/users/{uid}/offers/{offerId}/
{
  name: "Offer Name",
  price: 999,
  description: "generated copy",
  funnel: ["step1", "step2"],
  createdAt: timestamp
}
```

---

## 🔀 API Endpoints (Cloud Functions)

### 1. Create Checkout Session

```javascript
POST /.netlify/functions/createCheckout

Request:
{
  priceId: "price_regular",
  amount: 797
}

Response:
{
  sessionId: "cs_test_xxx"
}

Usage:
  ├─ Called when user clicks "Get Lifetime Access"
  ├─ Creates Stripe checkout session
  └─ Returns session ID for redirect
```

### 2. Stripe Webhook

```javascript
POST /.netlify/functions/stripeWebhook

Triggered by:
  ├─ checkout.session.completed
  └─ payment_intent.succeeded

Actions:
  ├─ Verifies webhook signature
  ├─ Extracts customer email/userId
  ├─ Updates Firestore: hasLifetimeAccess = true
  └─ Logs payment record

Security:
  └─ Only accepts requests with valid signature
```

### 3. Verify Payment

```javascript
GET /.netlify/functions/verifyPayment

Response:
{
  userId: "user_uid",
  hasAccess: true,
  paymentDate: timestamp
}

Usage:
  ├─ Called by dashboard.html to verify access
  └─ Returns before rendering tool cards
```

### 4. Test API Key (Future)

```javascript
POST /.netlify/functions/testAPIKey

Request:
{
  provider: "gemini" | "openai" | "anthropic" | "grok",
  key: "user_api_key"
}

Response:
{
  success: true,
  message: "Connection successful"
}
```

---

## 🚀 Deployment Flow

### Local Development

```
firebase emulators:start
  └─ Runs all Firebase services locally
     ├─ Firestore (port 8080)
     ├─ Functions (port 5001)
     ├─ Auth (port 9099)
     └─ Hosting (port 5000)
```

### Staging/Production

```
firebase deploy
  └─ Deploys all components
     ├─ Firestore rules
     ├─ Cloud Functions
     ├─ Hosting (HTML/CSS/JS)
     └─ Indexes
```

### Monitoring

```
firebase functions:log
  └─ Shows Cloud Function execution logs

Firebase Console
  └─ View:
     ├─ Firestore documents
     ├─ User authentication logs
     ├─ Function errors
     └─ Performance metrics
```

---

## 🎯 Current Build Status

```
✅ COMPLETE:
  • Landing page (with animated pricing)
  • Authentication (signup/login)
  • Dashboard (5 tool cards)
  • Settings (BYOK manager)
  • Cloud Functions (Stripe-ready)
  • Firestore (security + indexes)
  • Security rules (payment-gated)

🟡 READY TO BUILD:
  • Tool 1: 30-Day Course (remove comments)
  • Tool 2: Business Diagnostic
  • Tool 3: Blog Builder
  • Tool 4: Sales CRM
  • Tool 5: Offer Architect

⏳ NEXT:
  • Get Stripe credentials
  • Integrate Stripe payment
  • Deploy to Firebase
  • Port 5 tools
  • Production launch
```

---

*Architecture Documentation*
*Modern Alchemy - Business in a Box*
*December 3, 2025*
