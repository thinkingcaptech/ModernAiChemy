// State
const state = {
    avatar: { role: '', pain: '' },
    content: '',
    generatedContent: '',
    step: 1
};

// System Prompts
const PROMPTS = {
    // 1. The Content Generator
    transmuter: `You are a world-class direct response copywriter. 
    Take the raw input and transmute it into a high-converting {{FORMAT}}.
    
    Target Audience: {{ROLE}}
    Their Pain: {{PAIN}}
    
    Rules:
    - Use punchy, scroll-stopping hooks.
    - Keep paragraphs short.
    - Focus on the "gap" between their pain and the solution.
    - Format nicely with line breaks.`,

    // 2. The Simulator (Feedback)
    simulator: `You are a simulation of a specific person.
    Role: {{ROLE}}
    Current Struggles: {{PAIN}}
    
    You just saw a piece of content in your feed. 
    Analyze it HONESTLY from your perspective.
    
    Output Format (HTML):
    <div class="space-y-3">
      <p class="italic text-gray-300">"{{Your immediate internal thought when reading headline}}..."</p>
      <ul class="list-disc pl-5 space-y-1 text-sm text-gray-400">
        <li><strong>Attention:</strong> Did it stop your scroll? (Yes/No + Why)</li>
        <li><strong>Relevance:</strong> Did it feel like it was for YOU?</li>
        <li><strong>Trust:</strong> Did it sound like an expert or spam?</li>
      </ul>
      <div class="mt-4 pt-4 border-t border-gray-700">
         <span class="font-bold text-white">Verdict:</span> 
         <span class="{{COLOR}}">{{VERDICT}}</span>
      </div>
    </div>
    
    At the very end, on a new line, output ONLY a number from 0-100 representing your Resonance Score.`
};

// Navigation
function goToStep(step) {
    // Validation
    if (step === 2) {
        const role = document.getElementById('avatar-role').value.trim();
        const pain = document.getElementById('avatar-pain').value.trim();
        if (!role || !pain) {
            alert("Please define your Avatar first.");
            return;
        }
        state.avatar = { role, pain };
    }
    
    if (step === 3) {
        if (!state.generatedContent) {
            alert("Please generate some content first.");
            return;
        }
        document.getElementById('avatar-name-display').textContent = state.avatar.role;
        runResonanceCheck();
    }

    // UI Switching
    document.querySelectorAll('section').forEach(el => el.classList.add('hidden'));
    document.getElementById(`step${step}`).classList.remove('hidden');
    
    // Stepper UI
    for (let i = 1; i <= 3; i++) {
        const el = document.getElementById(`step${i}-indicator`);
        if (i === step) {
            el.className = "step-active border-b-2 pb-2 text-center transition-all";
        } else {
            el.className = "step-inactive border-b-2 pb-2 text-center transition-all opacity-50";
        }
    }
    
    state.step = step;
}

// Phase II: Generate Content
async function generateContent(format) {
    const rawInput = document.getElementById('content-input').value.trim();
    if (!rawInput) {
        alert("Please enter some raw material first.");
        return;
    }

    // Validate Key
    if (!ModernAlchemyKeys.requireAnyKey()) return;

    const statusEl = document.getElementById('generation-status');
    const outputEl = document.getElementById('generated-content');
    const placeholder = document.getElementById('content-placeholder');
    
    statusEl.classList.remove('hidden');
    placeholder.classList.add('hidden');
    outputEl.classList.add('hidden');

    const formatMap = {
        'linkedin': 'LinkedIn Authority Post (Story-based, professional, spacing)',
        'email': 'Cold Outreach Email (Subject line + Body)',
        'ad': 'Facebook/Instagram Ad Copy (Hook, Story, Offer)'
    };

    const prompt = PROMPTS.transmuter
        .replace('{{FORMAT}}', formatMap[format])
        .replace('{{ROLE}}', state.avatar.role)
        .replace('{{PAIN}}', state.avatar.pain)
        + `\n\nRAW INPUT:\n${rawInput}`;

    try {
        const response = await ModernAlchemyKeys.callAI(prompt);
        
        state.generatedContent = response;
        outputEl.value = response;
        
        outputEl.classList.remove('hidden');
        document.getElementById('btn-test-resonance').disabled = false;
        document.getElementById('btn-test-resonance').classList.remove('opacity-50', 'cursor-not-allowed');
        
    } catch (error) {
        alert("Transmutation failed: " + error.message);
    } finally {
        statusEl.classList.add('hidden');
    }
}

// Phase III: Resonance Check
async function runResonanceCheck() {
    const feedbackContainer = document.getElementById('feedback-container');
    const scoreEl = document.getElementById('resonance-score');
    
    feedbackContainer.innerHTML = `
        <div class="flex items-center justify-center h-40">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-tctc-gold"></div>
        </div>`;

    const prompt = PROMPTS.simulator
        .replace('{{ROLE}}', state.avatar.role)
        .replace('{{PAIN}}', state.avatar.pain)
        .replace('{{CONTENT}}', state.generatedContent);

    try {
        const rawResponse = await ModernAlchemyKeys.callAI(prompt);
        
        const match = rawResponse.match(/(\d{1,3})\s*$/);
        const score = match ? parseInt(match[1]) : 0;
        
        const htmlContent = rawResponse.replace(/\d{1,3}\s*$/, '');

        const color = score > 70 ? 'text-green-400' : score > 40 ? 'text-yellow-400' : 'text-red-400';
        const verdict = score > 70 ? 'Would Click' : score > 40 ? 'Might Scroll Past' : 'Ignored';

        feedbackContainer.innerHTML = htmlContent
            .replace('{{COLOR}}', color)
            .replace('{{VERDICT}}', verdict);

        animateValue(scoreEl, 0, score, 1500);

    } catch (error) {
        feedbackContainer.innerHTML = `<p class="text-red-500">Simulation Error: ${error.message}</p>`;
    }
}

function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}
