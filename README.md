# Modern Alchemy - Free AI Business Tools

**A free, AI-powered platform with business tools for coaches and entrepreneurs. Bring Your Own Key (BYOK).**

[![Status](https://img.shields.io/badge/Status-Live-brightgreen)]()
[![Firebase](https://img.shields.io/badge/Backend-Firebase-orange)]()
[![License](https://img.shields.io/badge/License-MIT-green)]()
[![BYOK](https://img.shields.io/badge/AI-Bring%20Your%20Own%20Key-blue)]()

---

## 🎯 Overview

Modern Alchemy is a **completely free** platform that provides AI-powered business tools. Users simply:

1. **Create a free account**
2. **Add their own AI API key** (Gemini, OpenAI, Claude, or Grok)
3. **Use all tools** with no limits or payments

### Why BYOK (Bring Your Own Key)?

- **Free forever** - No subscription fees
- **Complete privacy** - Your API keys stay in your browser
- **Your choice** - Use whichever AI provider you prefer
- **No middleman** - Direct connection to AI providers

---

## 🛠️ The Tools

### 1. 🏥 Business Health Diagnostic
Comprehensive business assessment that analyzes your operations across 4 pillars:
- Management & Operations
- Marketing & Lead Generation  
- Sales & Conversion
- Finances & Scalability

Get AI-generated recommendations and a detailed report.

### 2. 📝 Blog Builder
Generate SEO-optimized blog posts for local businesses:
- Batch generate 1-200 posts
- Local keyword targeting
- Multiple content types
- Export-ready content

### 3. ⚗️ Offer Architect
Create compelling business offers with AI assistance:
- Value proposition design
- Pricing strategy
- Sales page copy
- Funnel structure

---

## 🤖 Supported AI Providers

Users can choose from any of these providers:

| Provider | Key Format | Get Key |
|----------|-----------|---------|
| 🤖 **Google Gemini** | `AIza...` | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| 🧠 **OpenAI GPT** | `sk-...` | [OpenAI Platform](https://platform.openai.com/api-keys) |
| 📖 **Anthropic Claude** | `sk-ant-...` | [Anthropic Console](https://console.anthropic.com/) |
| ⚡ **xAI Grok** | `xai-...` | [xAI Console](https://console.x.ai/) |

Only one API key is needed - the platform auto-detects which provider you're using.

---

## 🚀 Quick Start

### Live Site
Visit: **https://modern-aichemy-dashboard-dec25.web.app**

1. Click **Sign Up** and create a free account
2. Go to **Settings** and add your AI API key
3. Start using any tool!

### Local Development

```bash
# Clone the repo
git clone https://github.com/thinkingcaptech/ModernAiChemy.git
cd ModernAiChemy

# Install Firebase CLI (if needed)
npm install -g firebase-tools

# Start local server
firebase emulators:start

# Visit
http://localhost:5000
```

---

## 📂 Project Structure

```
ModernAiChemy/
│
├── Frontend
│   ├── index.html              # Landing page
│   ├── login.html              # Free signup/login
│   ├── dashboard.html          # Tool hub
│   └── settings.html           # API key manager (BYOK)
│
├── Tools
│   └── tools/
│       ├── diagnostic/         # Business Health Diagnostic
│       ├── blog-builder/       # Blog Generator
│       └── offer-architect/    # Offer Builder
│
├── Backend
│   ├── functions/              # Cloud Functions
│   ├── firestore.rules         # Security rules
│   └── firebase.json           # Firebase config
│
└── Assets
    ├── css/                    # Stylesheets
    ├── js/                     # JavaScript
    └── icons/                  # PWA icons
```

---

## 🔐 Security & Privacy

### Your API Keys Are Safe
- **Stored locally** in your browser's localStorage
- **Never sent** to our servers
- **Direct connection** to AI providers
- **You control** your own usage and billing

### Authentication
- Firebase Email/Password authentication
- Secure session management
- Optional Google Sign-In

### Data
- User data stored in Firebase Firestore
- Each user can only access their own data
- No payment information collected

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Firebase (Auth, Firestore, Functions, Hosting)
- **AI**: Client-side integration with multiple providers
- **Design**: Custom AuriLux theme (Burgundy + Gold)

---

## 📈 Features

- ✅ **Completely Free** - No payments, no subscriptions
- ✅ **BYOK** - Use your own AI API keys
- ✅ **Privacy First** - Keys stored locally only
- ✅ **Multi-Provider** - Gemini, OpenAI, Claude, Grok
- ✅ **3 Business Tools** - Diagnostic, Blog Builder, Offer Architect
- ✅ **Beautiful UI** - Responsive, dark theme design
- ✅ **PWA Ready** - Install as an app
- ✅ **Open Source** - MIT License

---

## 🤝 Contributing

Contributions welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

---

## 📄 License

MIT License - Free to use, modify, and distribute.

---

## 🔗 Links

- **Live Site**: https://modern-aichemy-dashboard-dec25.web.app
- **GitHub**: https://github.com/thinkingcaptech/ModernAiChemy
- **Firebase Console**: https://console.firebase.google.com/project/modern-aichemy-dashboard-dec25

---

## 📝 Version

**v2.0.0** - Free BYOK Release
- Date: December 6, 2025
- Status: Live
- Model: Free with Bring Your Own Key

---

**Modern Alchemy** - *Free AI-powered business tools for everyone*
