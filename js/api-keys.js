/**
 * Modern Alchemy - Unified API Key Manager
 * All tools use this to access API keys stored in Settings
 * 
 * Supports 4 AI Providers:
 * - Google Gemini (gemini-2.0-flash, gemini-1.5-pro)
 * - OpenAI (gpt-4o, gpt-4o-mini, gpt-3.5-turbo)
 * - Anthropic Claude (claude-3-5-sonnet, claude-3-opus)
 * - xAI Grok (grok-beta)
 * 
 * Keys are stored in localStorage under 'api_keys' as JSON:
 * { gemini: "AIza...", openai: "sk-...", anthropic: "sk-ant-...", grok: "xai-..." }
 */

const ModernAlchemyKeys = {
    // Storage key used by the Settings page
    STORAGE_KEY: 'api_keys',
    
    // Default models for each provider
    DEFAULT_MODELS: {
        gemini: 'gemini-2.0-flash',
        openai: 'gpt-4o-mini',
        anthropic: 'claude-3-5-sonnet-20241022',
        grok: 'grok-beta'
    },
    
    // Provider display names
    PROVIDER_NAMES: {
        gemini: 'Google Gemini',
        openai: 'OpenAI GPT',
        anthropic: 'Anthropic Claude',
        grok: 'xAI Grok'
    },
    
    /**
     * Get all stored API keys
     */
    getAll: function() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            console.error('Error reading API keys:', e);
            return {};
        }
    },
    
    /**
     * Get a specific provider's API key
     * @param {string} provider - 'gemini', 'openai', 'anthropic', or 'grok'
     */
    get: function(provider) {
        const keys = this.getAll();
        return keys[provider] || null;
    },
    
    /**
     * Check if a provider's key exists
     */
    has: function(provider) {
        const key = this.get(provider);
        return key && key.length > 10;
    },
    
    /**
     * Get list of all configured providers
     */
    getConfiguredProviders: function() {
        const providers = [];
        ['gemini', 'openai', 'anthropic', 'grok'].forEach(p => {
            if (this.has(p)) providers.push(p);
        });
        return providers;
    },
    
    /**
     * Get the first available provider (preference order: gemini, openai, anthropic, grok)
     */
    getPreferredProvider: function() {
        const order = ['gemini', 'openai', 'anthropic', 'grok'];
        for (const provider of order) {
            if (this.has(provider)) return provider;
        }
        return null;
    },
    
    /**
     * Get Gemini API key (most commonly used)
     */
    getGemini: function() {
        return this.get('gemini');
    },
    
    /**
     * Get OpenAI API key
     */
    getOpenAI: function() {
        return this.get('openai');
    },
    
    /**
     * Get Anthropic API key
     */
    getAnthropic: function() {
        return this.get('anthropic');
    },
    
    /**
     * Get Grok API key
     */
    getGrok: function() {
        return this.get('grok');
    },
    
    /**
     * Redirect to settings if no API key configured
     */
    requireKey: function(provider = 'gemini') {
        if (!this.has(provider)) {
            const providerName = this.PROVIDER_NAMES[provider] || provider;
            if (confirm(`No ${providerName} API key configured.\n\nWould you like to add your API key in Settings?`)) {
                window.location.href = '/settings.html';
            }
            return false;
        }
        return true;
    },
    
    /**
     * Require any API key (at least one provider configured)
     */
    requireAnyKey: function() {
        const provider = this.getPreferredProvider();
        if (!provider) {
            if (confirm('No AI API keys configured.\n\nYou need to add at least one API key (Gemini, OpenAI, Claude, or Grok) in Settings.\n\nWould you like to configure your keys now?')) {
                window.location.href = '/settings.html';
            }
            return false;
        }
        return true;
    },
    
    /**
     * Call Gemini API directly from client
     * @param {string} prompt - The prompt to send
     * @param {string} model - Model name (default: gemini-2.0-flash)
     */
    callGemini: async function(prompt, model = 'gemini-2.0-flash') {
        const apiKey = this.getGemini();
        
        if (!apiKey) {
            throw new Error('No Gemini API key configured. Please add your key in Settings.');
        }
        
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || `Gemini API Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
            throw new Error('Unexpected Gemini API response');
        }
        
        return data.candidates[0].content.parts[0].text;
    },
    
    /**
     * Call Gemini with a system prompt
     */
    callGeminiWithSystem: async function(systemPrompt, userPrompt, model = 'gemini-2.0-flash') {
        const apiKey = this.getGemini();
        
        if (!apiKey) {
            throw new Error('No Gemini API key configured. Please add your key in Settings.');
        }
        
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ text: systemPrompt }]
                },
                contents: [{
                    parts: [{ text: userPrompt }]
                }]
            })
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || `Gemini API Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
            throw new Error('Unexpected Gemini API response');
        }
        
        return data.candidates[0].content.parts[0].text;
    },
    
    /**
     * Call OpenAI API directly from client
     * @param {string} prompt - The prompt to send
     * @param {string} model - Model name (default: gpt-4o-mini)
     */
    callOpenAI: async function(prompt, model = 'gpt-4o-mini') {
        const apiKey = this.getOpenAI();
        
        if (!apiKey) {
            throw new Error('No OpenAI API key configured. Please add your key in Settings.');
        }
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || `OpenAI API Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.choices || !data.choices[0]?.message?.content) {
            throw new Error('Unexpected OpenAI API response');
        }
        
        return data.choices[0].message.content;
    },
    
    /**
     * Call OpenAI with a system prompt
     */
    callOpenAIWithSystem: async function(systemPrompt, userPrompt, model = 'gpt-4o-mini') {
        const apiKey = this.getOpenAI();
        
        if (!apiKey) {
            throw new Error('No OpenAI API key configured. Please add your key in Settings.');
        }
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || `OpenAI API Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.choices || !data.choices[0]?.message?.content) {
            throw new Error('Unexpected OpenAI API response');
        }
        
        return data.choices[0].message.content;
    },
    
    /**
     * Call Anthropic Claude API directly from client
     * Note: Anthropic requires CORS proxy in browser - this works via their API
     * @param {string} prompt - The prompt to send
     * @param {string} model - Model name (default: claude-3-5-sonnet-20241022)
     */
    callAnthropic: async function(prompt, model = 'claude-3-5-sonnet-20241022') {
        const apiKey = this.getAnthropic();
        
        if (!apiKey) {
            throw new Error('No Anthropic API key configured. Please add your key in Settings.');
        }
        
        // Anthropic API requires server-side proxy due to CORS
        // We'll use a direct call that works in environments with CORS disabled
        // or recommend using their official SDK
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
                model: model,
                max_tokens: 4096,
                messages: [{ role: 'user', content: prompt }]
            })
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || `Anthropic API Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.content || !data.content[0]?.text) {
            throw new Error('Unexpected Anthropic API response');
        }
        
        return data.content[0].text;
    },
    
    /**
     * Call Anthropic with a system prompt
     */
    callAnthropicWithSystem: async function(systemPrompt, userPrompt, model = 'claude-3-5-sonnet-20241022') {
        const apiKey = this.getAnthropic();
        
        if (!apiKey) {
            throw new Error('No Anthropic API key configured. Please add your key in Settings.');
        }
        
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
                model: model,
                max_tokens: 4096,
                system: systemPrompt,
                messages: [{ role: 'user', content: userPrompt }]
            })
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || `Anthropic API Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.content || !data.content[0]?.text) {
            throw new Error('Unexpected Anthropic API response');
        }
        
        return data.content[0].text;
    },
    
    /**
     * Call xAI Grok API directly from client
     * @param {string} prompt - The prompt to send
     * @param {string} model - Model name (default: grok-beta)
     */
    callGrok: async function(prompt, model = 'grok-beta') {
        const apiKey = this.getGrok();
        
        if (!apiKey) {
            throw new Error('No Grok API key configured. Please add your key in Settings.');
        }
        
        // xAI uses OpenAI-compatible API format
        const response = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || `Grok API Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.choices || !data.choices[0]?.message?.content) {
            throw new Error('Unexpected Grok API response');
        }
        
        return data.choices[0].message.content;
    },
    
    /**
     * Call Grok with a system prompt
     */
    callGrokWithSystem: async function(systemPrompt, userPrompt, model = 'grok-beta') {
        const apiKey = this.getGrok();
        
        if (!apiKey) {
            throw new Error('No Grok API key configured. Please add your key in Settings.');
        }
        
        const response = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || `Grok API Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.choices || !data.choices[0]?.message?.content) {
            throw new Error('Unexpected Grok API response');
        }
        
        return data.choices[0].message.content;
    },
    
    /**
     * UNIFIED AI CALL - Automatically uses the best available provider
     * This is the recommended method for all tools
     * 
     * @param {string} prompt - The prompt to send
     * @param {object} options - Optional settings
     * @param {string} options.provider - Force a specific provider ('gemini', 'openai', 'anthropic', 'grok')
     * @param {string} options.model - Force a specific model
     * @param {string} options.systemPrompt - System instructions
     */
    callAI: async function(prompt, options = {}) {
        const provider = options.provider || this.getPreferredProvider();
        
        if (!provider) {
            throw new Error('No AI API keys configured. Please add at least one API key in Settings.');
        }
        
        const model = options.model || this.DEFAULT_MODELS[provider];
        const systemPrompt = options.systemPrompt;
        
        console.log(`[ModernAlchemyKeys] Using ${this.PROVIDER_NAMES[provider]} (${model})`);
        
        if (systemPrompt) {
            switch (provider) {
                case 'gemini':
                    return await this.callGeminiWithSystem(systemPrompt, prompt, model);
                case 'openai':
                    return await this.callOpenAIWithSystem(systemPrompt, prompt, model);
                case 'anthropic':
                    return await this.callAnthropicWithSystem(systemPrompt, prompt, model);
                case 'grok':
                    return await this.callGrokWithSystem(systemPrompt, prompt, model);
                default:
                    throw new Error(`Unknown provider: ${provider}`);
            }
        } else {
            switch (provider) {
                case 'gemini':
                    return await this.callGemini(prompt, model);
                case 'openai':
                    return await this.callOpenAI(prompt, model);
                case 'anthropic':
                    return await this.callAnthropic(prompt, model);
                case 'grok':
                    return await this.callGrok(prompt, model);
                default:
                    throw new Error(`Unknown provider: ${provider}`);
            }
        }
    },
    
    /**
     * UNIFIED AI CALL WITH SYSTEM PROMPT
     * Shorthand for callAI with system prompt
     */
    callAIWithSystem: async function(systemPrompt, userPrompt, options = {}) {
        return await this.callAI(userPrompt, { ...options, systemPrompt });
    },
    
    /**
     * Get a friendly status message about configured providers
     */
    getStatusMessage: function() {
        const providers = this.getConfiguredProviders();
        if (providers.length === 0) {
            return 'No AI providers configured. Add your API keys in Settings.';
        }
        const names = providers.map(p => this.PROVIDER_NAMES[p]);
        return `Active: ${names.join(', ')}`;
    }
};

// Also export for legacy compatibility with tools that use different key names
// This ensures backwards compatibility
(function migrateOldKeys() {
    // Check for old key formats and migrate them
    const oldGeminiKey = localStorage.getItem('gemini_api_key') || localStorage.getItem('geminiApiKey');
    if (oldGeminiKey && !ModernAlchemyKeys.has('gemini')) {
        const keys = ModernAlchemyKeys.getAll();
        // Decode if it was obfuscated
        try {
            const decoded = decodeURIComponent(atob(oldGeminiKey));
            keys.gemini = decoded;
        } catch {
            keys.gemini = oldGeminiKey;
        }
        localStorage.setItem(ModernAlchemyKeys.STORAGE_KEY, JSON.stringify(keys));
    }
})();

// Make available globally
if (typeof window !== 'undefined') {
    window.ModernAlchemyKeys = ModernAlchemyKeys;
}
