/**
 * API Key Manager for Diagnostic Tool
 * Handles storage, retrieval, and validation of user-provided API keys
 * Updated to use unified api_keys storage from Settings page
 * 
 * Supports 4 AI Providers:
 * - Google Gemini
 * - OpenAI GPT
 * - Anthropic Claude
 * - xAI Grok
 */

// Use unified storage key from Settings page
const UNIFIED_STORAGE_KEY = 'api_keys';

// Legacy key for backwards compatibility
const LEGACY_KEY = 'gemini_api_key';

// Provider configurations
const PROVIDER_CONFIG = {
    gemini: {
        name: 'Google Gemini',
        keyPrefix: 'AIza',
        testEndpoint: (key) => `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
        testBody: { contents: [{ parts: [{ text: 'Say "OK"' }] }] }
    },
    openai: {
        name: 'OpenAI GPT',
        keyPrefix: 'sk-',
        testEndpoint: () => 'https://api.openai.com/v1/chat/completions',
        testHeaders: (key) => ({ 'Authorization': `Bearer ${key}` }),
        testBody: { model: 'gpt-4o-mini', messages: [{ role: 'user', content: 'Say OK' }], max_tokens: 5 }
    },
    anthropic: {
        name: 'Anthropic Claude',
        keyPrefix: 'sk-ant-',
        testEndpoint: () => 'https://api.anthropic.com/v1/messages',
        testHeaders: (key) => ({ 
            'x-api-key': key, 
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
        }),
        testBody: { model: 'claude-3-5-sonnet-20241022', max_tokens: 10, messages: [{ role: 'user', content: 'Say OK' }] }
    },
    grok: {
        name: 'xAI Grok',
        keyPrefix: 'xai-',
        testEndpoint: () => 'https://api.x.ai/v1/chat/completions',
        testHeaders: (key) => ({ 'Authorization': `Bearer ${key}` }),
        testBody: { model: 'grok-beta', messages: [{ role: 'user', content: 'Say OK' }], max_tokens: 5 }
    }
};

const ApiKeyManager = {
    /**
     * Store API key in unified localStorage
     * @param {string} apiKey - The API key to store
     * @param {string} provider - Provider name (default: 'gemini')
     */
    save: (apiKey, provider = 'gemini') => {
        if (!apiKey || typeof apiKey !== 'string') {
            throw new Error('Invalid API key');
        }
        try {
            const keys = JSON.parse(localStorage.getItem(UNIFIED_STORAGE_KEY) || '{}');
            keys[provider] = apiKey.trim();
            keys[provider + '_updated'] = new Date().toISOString();
            localStorage.setItem(UNIFIED_STORAGE_KEY, JSON.stringify(keys));
        } catch (e) {
            console.error('Error saving key:', e);
            throw e;
        }
    },

    /**
     * Retrieve API key from unified localStorage
     * @param {string} provider - Provider name (default: 'gemini')
     */
    get: (provider = 'gemini') => {
        try {
            // Try unified storage first
            const stored = localStorage.getItem(UNIFIED_STORAGE_KEY);
            if (stored) {
                const keys = JSON.parse(stored);
                if (keys[provider]) return keys[provider];
            }
            
            // Fallback to legacy storage for gemini
            if (provider === 'gemini') {
                const legacy = localStorage.getItem(LEGACY_KEY);
                if (legacy) {
                    // Try to decode if obfuscated
                    try {
                        return decodeURIComponent(atob(legacy));
                    } catch {
                        return legacy;
                    }
                }
            }
        } catch (e) {
            console.error('Error reading key:', e);
        }
        return null;
    },
    
    /**
     * Get all stored keys
     */
    getAll: () => {
        try {
            const stored = localStorage.getItem(UNIFIED_STORAGE_KEY);
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            return {};
        }
    },
    
    /**
     * Get list of configured providers
     */
    getConfiguredProviders: () => {
        const providers = [];
        const keys = ApiKeyManager.getAll();
        ['gemini', 'openai', 'anthropic', 'grok'].forEach(p => {
            if (keys[p] && keys[p].length > 10) {
                providers.push(p);
            }
        });
        return providers;
    },
    
    /**
     * Get preferred (first available) provider
     */
    getPreferredProvider: () => {
        const order = ['gemini', 'openai', 'anthropic', 'grok'];
        for (const provider of order) {
            if (ApiKeyManager.exists(provider)) return provider;
        }
        return null;
    },

    /**
     * Remove API key from localStorage
     * @param {string} provider - Provider name (default: 'gemini')
     */
    remove: (provider = 'gemini') => {
        try {
            const keys = JSON.parse(localStorage.getItem(UNIFIED_STORAGE_KEY) || '{}');
            delete keys[provider];
            delete keys[provider + '_updated'];
            localStorage.setItem(UNIFIED_STORAGE_KEY, JSON.stringify(keys));
            if (provider === 'gemini') {
                localStorage.removeItem(LEGACY_KEY);
            }
        } catch (e) {
            console.error('Error removing key:', e);
        }
    },

    /**
     * Check if API key exists
     * @param {string} provider - Provider name (default: 'gemini')
     */
    exists: (provider = 'gemini') => {
        const key = ApiKeyManager.get(provider);
        return key && key.length > 10;
    },
    
    /**
     * Check if any API key exists
     */
    hasAnyKey: () => {
        return ApiKeyManager.getPreferredProvider() !== null;
    },

    /**
     * Validate API key format (basic check)
     * @param {string} apiKey - The API key to validate
     * @param {string} provider - Provider name (default: 'gemini')
     */
    validate: (apiKey, provider = 'gemini') => {
        if (!apiKey || typeof apiKey !== 'string') {
            return { valid: false, error: 'API key is required' };
        }
        
        const trimmed = apiKey.trim();
        const config = PROVIDER_CONFIG[provider];
        
        if (!config) {
            return { valid: false, error: `Unknown provider: ${provider}` };
        }
        
        if (config.keyPrefix && !trimmed.startsWith(config.keyPrefix)) {
            return { valid: false, error: `Invalid ${config.name} key format. Keys should start with "${config.keyPrefix}"` };
        }
        
        if (trimmed.length < 20) {
            return { valid: false, error: 'API key appears too short' };
        }
        
        return { valid: true };
    },

    /**
     * Test API key by making a minimal request
     * @param {string} apiKey - The API key to test
     * @param {string} provider - Provider name (default: 'gemini')
     */
    test: async (apiKey, provider = 'gemini') => {
        const config = PROVIDER_CONFIG[provider];
        if (!config) {
            return { valid: false, error: `Unknown provider: ${provider}` };
        }
        
        try {
            const headers = { 'Content-Type': 'application/json' };
            if (config.testHeaders) {
                Object.assign(headers, config.testHeaders(apiKey));
            }
            
            const endpoint = typeof config.testEndpoint === 'function' 
                ? config.testEndpoint(apiKey) 
                : config.testEndpoint;
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(config.testBody)
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    return { valid: false, error: 'Invalid API key - authentication failed' };
                }
                const data = await response.json().catch(() => ({}));
                return { valid: false, error: data?.error?.message || `API returned status ${response.status}` };
            }

            return { valid: true };
        } catch (error) {
            return { valid: false, error: `Network error: ${error.message}` };
        }
    },
    
    /**
     * Get provider display name
     */
    getProviderName: (provider) => {
        return PROVIDER_CONFIG[provider]?.name || provider;
    },
    
    /**
     * Get all provider names
     */
    getAllProviders: () => {
        return Object.keys(PROVIDER_CONFIG);
    }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.ApiKeyManager = ApiKeyManager;
    window.PROVIDER_CONFIG = PROVIDER_CONFIG;
}

