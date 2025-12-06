const STEPS = ['Management & Operations', 'Marketing & Lead Generation', 'Sales & Conversion', 'Finances & Scalability'];

const toast = (message, type = 'info') => {
    const toastEl = document.getElementById('formToast');
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.dataset.type = type;
    toastEl.classList.add('visible');
    setTimeout(() => toastEl.classList.remove('visible'), 4000);
};

const isFieldValid = (field) => {
    if (!field.required) return true;
    if (field.tagName === 'SELECT' || field.tagName === 'TEXTAREA') {
        return field.value.trim().length > 0;
    }
    return Boolean(field.value);
};

const validateStep = (stepEl) => {
    const fields = Array.from(stepEl.querySelectorAll('select[required], textarea[required], input[required]'));
    let isValid = true;
    fields.forEach((field) => {
        if (!isFieldValid(field)) {
            field.classList.add('invalid');
            isValid = false;
        } else {
            field.classList.remove('invalid');
        }
    });
    if (!isValid) {
        toast('Please complete all required questions before continuing.', 'error');
    }
    return isValid;
};

const collectAnswers = (formData) => {
    const payload = { management: {}, marketing: {}, sales: {}, finances: {}, metadata: {} };
    formData.forEach((value, key) => {
        const [pillar, ...rest] = key.split('_');
        if (payload[pillar]) {
            payload[pillar][rest.join('_') || 'value'] = value;
        } else {
            payload.metadata[key] = value;
        }
    });
    return payload;
};

const updateProgressUI = (currentStep) => {
    const progressFill = document.getElementById('progressFill');
    const stepsLabel = document.querySelectorAll('#progressSteps li');
    const percentage = ((currentStep + 1) / STEPS.length) * 100;
    if (progressFill) progressFill.style.width = `${percentage}%`;
    stepsLabel.forEach((label, index) => {
        label.classList.toggle('active', index <= currentStep);
    });
};

// API Key Modal Management
const showApiKeyModal = () => {
    const modal = document.getElementById('apiKeyModal');
    if (modal) {
        modal.classList.add('show');
    }
};

const hideApiKeyModal = () => {
    const modal = document.getElementById('apiKeyModal');
    if (modal) {
        modal.classList.remove('show');
    }
};

const initApiKeyModal = () => {
    const modal = document.getElementById('apiKeyModal');
    if (!modal) return;

    // Check if key already exists on load (from Settings or local)
    // Use hasAnyKey() to check for ANY provider, not just gemini
    if (ApiKeyManager.hasAnyKey() || sessionStorage.getItem('temp_gemini_key')) {
        hideApiKeyModal();
    } else {
        showApiKeyModal();
    }
};

const getApiKey = () => {
    // First try the new multi-provider system
    const provider = ApiKeyManager.getPreferredProvider?.();
    if (provider) {
        return { key: ApiKeyManager.get(provider), provider };
    }
    // Fallback to legacy single-key approach
    const legacyKey = ApiKeyManager.get?.() || sessionStorage.getItem('temp_gemini_key');
    if (legacyKey) {
        return { key: legacyKey, provider: 'gemini' };
    }
    return null;
};

// Store results locally and navigate to results page
const saveAndNavigateToResults = async (reportData) => {
    const reportId = 'report_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const reportWithId = { ...reportData, reportId, createdAt: new Date().toISOString() };
    
    // Store in localStorage
    localStorage.setItem(`diagnostic_${reportId}`, JSON.stringify(reportWithId));
    
    // Store report ID in session for easy retrieval
    sessionStorage.setItem('latest_report_id', reportId);

    // Attempt to store in Firestore for cross-device access
    try {
        if (typeof firebase !== 'undefined' && firebase.apps.length) {
            const user = firebase.auth().currentUser;
            if (user && window.db) {
                await window.db
                    .collection('users')
                    .doc(user.uid)
                    .collection('diagnostics')
                    .doc(reportId)
                    .set(reportWithId);
            }
        }
    } catch (cloudError) {
        console.warn('Could not sync diagnostic report to cloud:', cloudError);
    }
    
    // Navigate to results
    window.location.href = `results.html?reportId=${encodeURIComponent(reportId)}`;
};

const initMultiStepForm = () => {
    const form = document.getElementById('quizForm');
    if (!form) return;

    const steps = Array.from(form.querySelectorAll('.form-step'));
    let currentStep = 0;

    const showStep = (index) => {
        steps.forEach((step, idx) => {
            step.classList.toggle('active-step', idx === index);
        });
        updateProgressUI(index);
    };

    form.addEventListener('click', (event) => {
        const target = event.target;
        if (target.matches('.next-btn')) {
            if (validateStep(steps[currentStep]) && currentStep < steps.length - 1) {
                currentStep += 1;
                showStep(currentStep);
            }
        }
        if (target.matches('.prev-btn')) {
            if (currentStep > 0) {
                currentStep -= 1;
                showStep(currentStep);
            }
        }
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!validateStep(steps[currentStep])) return;

        const apiKeyData = getApiKey();
        if (!apiKeyData || !apiKeyData.key) {
            toast('Please configure your API key first', 'error');
            showApiKeyModal();
            return;
        }

        const { key: apiKey, provider } = apiKeyData;

        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Analyzing...';
        }
        
        const providerName = AIClient.providers[provider]?.name || 'AI';
        toast(`Analyzing your responses with ${providerName}. This takes ~10 seconds.`);

        const formData = new FormData(form);
        const answers = collectAnswers(formData);

        try {
            // Calculate scores client-side (uses AIClient which has legacy GeminiClient alias)
            const scores = AIClient.calculateScores(answers);
            const weakestPillar = AIClient.getWeakestPillar(scores);

            // Generate AI recommendations using the selected provider
            toast('Generating personalized recommendations...');
            const prompt = AIClient.buildDiagnosticPrompt(answers, scores);
            const recommendations = await AIClient.generateContent(apiKey, prompt, provider);

            // Save and navigate
            const reportData = {
                answers,
                scores,
                weakestPillar,
                recommendations,
                aiProvider: provider, // Track which AI generated the report
                publicShare: true
            };

            await saveAndNavigateToResults(reportData);

        } catch (error) {
            console.error('Submission error', error);
            const message = error?.message 
                ? `Could not generate your report: ${error.message}` 
                : 'Could not generate your report. Please try again.';
            toast(message, 'error');
            
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Generate My Report';
            }
        }
    });

    showStep(currentStep);
};

document.addEventListener('DOMContentLoaded', () => {
    initApiKeyModal();
    initMultiStepForm();
});
