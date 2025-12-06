/**
 * Unified AI Client
 * Handles direct client-side communication with multiple AI providers
 * Supports: Gemini, OpenAI, Anthropic Claude, xAI Grok
 */

const AIClient = {
    // Provider configurations
    providers: {
        gemini: {
            name: 'Google Gemini',
            endpoint: (key, model = 'gemini-2.0-flash') => 
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
            buildRequest: (prompt) => ({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 8192,
                }
            }),
            extractText: (data) => data?.candidates?.[0]?.content?.parts?.[0]?.text,
            headers: () => ({ 'Content-Type': 'application/json' })
        },
        openai: {
            name: 'OpenAI GPT',
            endpoint: () => 'https://api.openai.com/v1/chat/completions',
            buildRequest: (prompt, model = 'gpt-4o-mini') => ({
                model: model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 8192
            }),
            extractText: (data) => data?.choices?.[0]?.message?.content,
            headers: (key) => ({
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
            })
        },
        anthropic: {
            name: 'Anthropic Claude',
            endpoint: () => 'https://api.anthropic.com/v1/messages',
            buildRequest: (prompt, model = 'claude-3-5-sonnet-20241022') => ({
                model: model,
                max_tokens: 8192,
                messages: [{ role: 'user', content: prompt }]
            }),
            extractText: (data) => data?.content?.[0]?.text,
            headers: (key) => ({
                'Content-Type': 'application/json',
                'x-api-key': key,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            })
        },
        grok: {
            name: 'xAI Grok',
            endpoint: () => 'https://api.x.ai/v1/chat/completions',
            buildRequest: (prompt, model = 'grok-beta') => ({
                model: model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 8192
            }),
            extractText: (data) => data?.choices?.[0]?.message?.content,
            headers: (key) => ({
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
            })
        }
    },

    /**
     * Generate content using any supported AI provider
     * @param {string} apiKey - The API key
     * @param {string} prompt - The prompt to send
     * @param {string} provider - Provider name (default: 'gemini')
     * @param {string} model - Optional model override
     */
    generateContent: async (apiKey, prompt, provider = 'gemini', model = null) => {
        if (!apiKey) {
            throw new Error('API key is required');
        }

        const config = AIClient.providers[provider];
        if (!config) {
            throw new Error(`Unknown provider: ${provider}`);
        }

        try {
            const endpoint = config.endpoint(apiKey, model);
            const headers = config.headers(apiKey);
            const body = config.buildRequest(prompt, model);

            console.log(`[AIClient] Calling ${config.name}...`);

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData?.error?.message || `API request failed with status ${response.status}`);
            }

            const data = await response.json();
            const text = config.extractText(data);
            
            if (!text) {
                throw new Error('No content generated');
            }

            return text;
        } catch (error) {
            console.error(`${config.name} API error:`, error);
            throw error;
        }
    },

    /**
     * Generate content using the best available provider
     * Automatically selects from configured keys
     */
    generateWithAnyProvider: async (prompt) => {
        // Check for ModernAlchemyKeys (from parent dashboard)
        if (typeof ModernAlchemyKeys !== 'undefined') {
            const provider = ModernAlchemyKeys.getPreferredProvider();
            if (provider) {
                const key = ModernAlchemyKeys.get(provider);
                return await AIClient.generateContent(key, prompt, provider);
            }
        }
        
        // Check for ApiKeyManager (local diagnostic tool)
        if (typeof ApiKeyManager !== 'undefined') {
            const provider = ApiKeyManager.getPreferredProvider();
            if (provider) {
                const key = ApiKeyManager.get(provider);
                return await AIClient.generateContent(key, prompt, provider);
            }
        }
        
        throw new Error('No AI API keys configured. Please add your API key in Settings.');
    },

    /**
     * Get the currently available provider
     */
    getAvailableProvider: () => {
        if (typeof ModernAlchemyKeys !== 'undefined') {
            return ModernAlchemyKeys.getPreferredProvider();
        }
        if (typeof ApiKeyManager !== 'undefined') {
            return ApiKeyManager.getPreferredProvider();
        }
        return null;
    },

    /**
     * Get the API key for a provider
     */
    getApiKey: (provider = null) => {
        const targetProvider = provider || AIClient.getAvailableProvider();
        if (!targetProvider) return null;
        
        if (typeof ModernAlchemyKeys !== 'undefined') {
            return ModernAlchemyKeys.get(targetProvider);
        }
        if (typeof ApiKeyManager !== 'undefined') {
            return ApiKeyManager.get(targetProvider);
        }
        return null;
    },

    /**
     * Build prompt for business diagnostic
     */
    buildDiagnosticPrompt: (answers, scores) => {
        return `You are an elite management consultant with 25+ years of experience diagnosing and transforming businesses. You've worked with Fortune 500 companies and high-growth startups alike. Your diagnostic reports are legendary for their depth, actionable insights, and transformative impact.

A business owner has just completed a comprehensive diagnostic questionnaire. Generate a THOROUGH, DETAILED business diagnostic report that they would expect from a $10,000+ consulting engagement.

## BUSINESS HEALTH SCORES:
- Management & Operations: ${scores.management}/100
- Marketing & Lead Generation: ${scores.marketing}/100
- Sales & Conversion: ${scores.sales}/100
- Finances & Scalability: ${scores.finances}/100
- **Overall Business Health Score: ${scores.total}/100**

## RAW QUESTIONNAIRE RESPONSES:
${JSON.stringify(answers, null, 2)}

---

## YOUR TASK: Generate a comprehensive 2-page diagnostic report with the following sections:

### SECTION 1: EXECUTIVE SUMMARY (3-4 paragraphs)
Provide a high-level assessment of the business's current state. What's working? What's at risk? What's the single biggest opportunity? Write this as if you're briefing a CEO who needs to understand the situation in 60 seconds but wants substance, not fluff.

### SECTION 2: PILLAR-BY-PILLAR DEEP DIVE

For EACH of the four pillars, provide:

**A. Management & Operations Analysis**
- Current state assessment based on their score
- 2-3 specific observations from their answers
- What this score typically indicates about day-to-day operations
- Hidden risks if not addressed

**B. Marketing & Lead Generation Analysis**
- Current state assessment based on their score
- 2-3 specific observations from their answers
- Lead flow health and channel effectiveness insights
- Competitive positioning implications

**C. Sales & Conversion Analysis**
- Current state assessment based on their score
- 2-3 specific observations from their answers
- Pipeline and conversion insights
- Revenue velocity implications

**D. Finances & Scalability Analysis**
- Current state assessment based on their score
- 2-3 specific observations from their answers
- Cash flow and margin health indicators
- Scaling readiness assessment

### SECTION 3: CRITICAL PRIORITIES (The "Fix These First" List)
Identify the TOP 3 issues that, if addressed in the next 90 days, would have the biggest positive impact. For each:
- The specific problem
- Why it matters NOW
- The cost of inaction
- Recommended first step

### SECTION 4: STRATEGIC RECOMMENDATIONS
Provide 5-7 detailed, actionable recommendations. Each should include:
- Clear action item (verb-first)
- Expected outcome/benefit
- Rough timeline (quick win vs. longer initiative)
- Success metrics to track

### SECTION 5: 90-DAY ACTION ROADMAP
Break down the next 90 days into three phases:
- Days 1-30: Foundation & Quick Wins
- Days 31-60: Systems & Process Improvements
- Days 61-90: Optimization & Scaling Preparation

For each phase, provide 2-3 specific actions with expected outcomes.

### SECTION 6: CLOSING INSIGHTS
End with:
- One powerful insight about their business potential
- A cautionary note about the biggest risk if they don't act
- An encouraging statement about what's possible with focused execution

---

IMPORTANT FORMATTING GUIDELINES:
- Use clear section headers with markdown formatting (## for main sections, ### for subsections)
- Use bullet points for easy scanning
- Be specific and actionable - no vague platitudes
- Reference their actual scores when making points
- Write in a professional but accessible tone
- Aim for approximately 1,500-2,000 words total
- Make every sentence count - this is premium consulting advice`;
    },

    /**
     * Calculate business health scores from questionnaire answers
     */
    calculateScores: (answers = {}) => {
        const pillarWeights = {
            management: {
                process_maturity: 0.4,
                team_alignment: 0.35,
                kpi_cadence: 0.25,
            },
            marketing: {
                lead_volume: 0.4,
                channel_mix: 0.3,
                roi_tracking: 0.3,
            },
            sales: {
                pipeline_rigor: 0.4,
                enablement_strength: 0.35,
                close_rate: 0.25,
            },
            finances: {
                cashflow_visibility: 0.35,
                margin_health: 0.35,
                scaling_readiness: 0.3,
            },
        };

        const normalizeScore = (value) => {
            const numericValue = Number(value);
            if (Number.isNaN(numericValue)) return 0;
            return Math.min(Math.max(numericValue, 1), 5);
        };

        const results = {};
        const pillarEntries = Object.entries(pillarWeights);

        pillarEntries.forEach(([pillar, weights]) => {
            const answerGroup = answers[pillar] || {};
            let achieved = 0;
            let max = 0;
            Object.entries(weights).forEach(([question, weight]) => {
                const value = normalizeScore(answerGroup[question]);
                achieved += value * weight;
                max += 5 * weight;
            });
            results[pillar] = max ? Math.round((achieved / max) * 100) : 0;
        });

        const pillarScoreValues = pillarEntries.map(([pillar]) => results[pillar]);
        results.total = Math.round(
            pillarScoreValues.reduce((sum, value) => sum + value, 0) /
            pillarScoreValues.length
        );

        return results;
    },

    /**
     * Find the weakest pillar
     */
    getWeakestPillar: (scores) => {
        return Object.entries(scores)
            .filter(([pillar]) => pillar !== 'total')
            .sort(([, aScore], [, bScore]) => aScore - bScore)[0]?.[0] || null;
    }
};

// Legacy alias for backwards compatibility
const GeminiClient = {
    generateContent: (apiKey, prompt) => AIClient.generateContent(apiKey, prompt, 'gemini'),
    buildDiagnosticPrompt: AIClient.buildDiagnosticPrompt,
    calculateScores: AIClient.calculateScores,
    getWeakestPillar: AIClient.getWeakestPillar
};

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.AIClient = AIClient;
    window.GeminiClient = GeminiClient; // Legacy support
}
