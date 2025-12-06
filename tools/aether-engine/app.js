// State
const state = {
    avatar: { role: '', pain: '' },
    content: '',
    generatedContent: '',
    step: 1
};

// System Prompts
const PROMPTS = {
    // Auto-profile avatar
    profiler: `You are an expert marketer. 
    Target Niche: {{NICHE}}
    
    Task: Create a highly specific Avatar Profile for this niche.
    1. Identify a specific role (e.g. not just "Lawyer", but "Burned out Partner at a mid-sized firm").
    2. Identify their single deepest, most visceral "bleeding neck" pain point.
    
    Output format: JSON-like string:
    {"role": "...", "pain": "..."}
    Return ONLY the JSON.`,

    // Topic seeder
    topicGenerator: `You are a content strategist.
    Target Audience: {{ROLE}}
    Their Deepest Pain: {{PAIN}}
    
    Generate 3 specific, high-value content topics that would resonate deeply with this person right now.
    Focus on solving their specific pain.
    
    Output format: Just the 3 topics, numbered 1-3. Keep them short (under 6 words).`,

    // Brainstorm angles
    brainstormer: `You are a viral content strategist.
    Topic: {{TOPIC}}
    Target Audience: {{ROLE}}
    Their Pain: {{PAIN}}
    
    Task: Generate 3 distinct, high-converting angles/hooks for this topic.
    1. Contrarian/Polarizing Angle
    2. Story/Vulnerability Angle
    3. Actionable/"How-To" Angle
    
    Output format: Just the 3 angles, numbered 1-3. Keep them punchy.`,

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
    You just read this piece of content:
    ===
    {{CONTENT}}
    ===
    
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

// --- PHASE I: Auto-Profile ---
async function autoGenerateAvatar() {
    const niche = document.getElementById('niche-input').value.trim();
    if (!niche) { alert("Enter a niche first!"); return; }
    
    if (!ModernAlchemyKeys.requireAnyKey()) return;

    const btn = document.getElementById('btn-auto-avatar');
    const originalText = btn.innerText;
    btn.innerText = "🔮 Divining...";
    btn.disabled = true;

    try {
        const prompt = PROMPTS.profiler.replace('{{NICHE}}', niche);
        const response = await ModernAlchemyKeys.callAI(prompt);

        const parsed = extractAvatarProfile(response);
        if (!parsed) {
            throw new Error('Unable to parse AI response.');
        }

        document.getElementById('avatar-role').value = parsed.role || '';
        document.getElementById('avatar-pain').value = parsed.pain || '';

    } catch (e) {
        console.error('Auto-profile error:', e, e?.message);
        alert('Auto-profile failed to read the AI response. Please try again or edit manually.');
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// --- PHASE II: Topic Suggestions ---
async function suggestTopics() {
    const suggestionsDiv = document.getElementById('topic-suggestions');
    if (!suggestionsDiv) return;

    suggestionsDiv.innerHTML = '<div class="text-xs text-gray-500 animate-pulse">Consulting the Ether for topics...</div>';

    if (!ModernAlchemyKeys.requireAnyKey()) {
        suggestionsDiv.innerHTML = '<div class="text-xs text-red-400">API key required for suggestions.</div>';
        return;
    }

    try {
        const prompt = PROMPTS.topicGenerator
            .replace('{{ROLE}}', state.avatar.role)
            .replace('{{PAIN}}', state.avatar.pain);

        const response = await ModernAlchemyKeys.callAI(prompt);
        suggestionsDiv.innerHTML = '';

        const lines = response.split('\n').filter(l => l.trim().length > 2);
        if (lines.length === 0) {
            suggestionsDiv.innerHTML = '<div class="text-xs text-gray-500">No suggestions returned.</div>';
            return;
        }

        lines.forEach(line => {
            const cleanLine = line.replace(/^\d+\.\s*/, '').replace(/"/g, '').trim();
            if (!cleanLine) return;
            const chip = document.createElement('button');
            chip.className = "px-3 py-1 bg-tctc-gold/10 border border-tctc-gold/30 rounded-full text-xs text-tctc-gold hover:bg-tctc-gold hover:text-black transition mb-2 mr-2";
            chip.innerText = `+ ${cleanLine}`;
            chip.onclick = () => {
                document.getElementById('topic-input').value = cleanLine;
            };
            suggestionsDiv.appendChild(chip);
        });
    } catch (e) {
        console.error('Topic suggestion error:', e);
        suggestionsDiv.innerHTML = '<div class="text-xs text-red-500">Unable to fetch topics.</div>';
    }
}

// --- PHASE II: Brainstorm Angles ---
async function brainstormAngles() {
    const topic = document.getElementById('topic-input').value.trim();
    if (!topic) { alert("Enter a topic first!"); return; }
    if (!state.avatar.role) { alert("Define your avatar in Step I first!"); return; }

    if (!ModernAlchemyKeys.requireAnyKey()) return;

    const btn = document.getElementById('btn-brainstorm');
    const resultsDiv = document.getElementById('idea-results');
    
    btn.innerText = "⚡";
    btn.disabled = true;
    resultsDiv.innerHTML = '<div class="text-xs text-gray-500 animate-pulse">Summoning concepts...</div>';
    resultsDiv.classList.remove('hidden');

    try {
        const prompt = PROMPTS.brainstormer
            .replace('{{TOPIC}}', topic)
            .replace('{{ROLE}}', state.avatar.role)
            .replace('{{PAIN}}', state.avatar.pain);
            
        const response = await ModernAlchemyKeys.callAI(prompt);
        
        resultsDiv.innerHTML = '';
        const lines = response.split('\n').filter(l => l.trim().length > 5);
        
        lines.forEach(line => {
            const cleanLine = line.replace(/^\d+\.\s*/, '').replace(/"/g, '').trim();
            if (!cleanLine) return;
            const ideaBtn = document.createElement('button');
            ideaBtn.className = "w-full text-left p-3 text-xs text-gray-300 border border-gray-700 hover:border-tctc-gold hover:text-tctc-gold rounded transition bg-black/40 group";
            ideaBtn.innerHTML = `<span class="text-tctc-gold font-bold mr-2">→</span> ${cleanLine}`;
            ideaBtn.onclick = () => {
                document.getElementById('content-input').value = `TOPIC: ${topic}\nTARGET: ${state.avatar.role}\nPAIN: ${state.avatar.pain}\nANGLE: ${cleanLine}\n\n[Expand on this idea...]`;
            };
            resultsDiv.appendChild(ideaBtn);
        });
        
    } catch (e) {
        resultsDiv.innerHTML = `<div class="text-xs text-red-500">Error: ${e.message}</div>`;
    } finally {
        btn.innerText = "⚡ Spark";
        btn.disabled = false;
    }
}

function extractAvatarProfile(raw) {
    if (!raw) return null;

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        try {
            const data = JSON.parse(jsonMatch[0]);
            if (data.role || data.pain) return data;
        } catch (err) {
            console.warn('JSON parse failed:', err);
        }
    }

    const roleMatch = raw.match(/role[^:]*:\s*["']?(.+?)["']?(?:[\n\r]|$)/i);
    const painMatch = raw.match(/pain[^:]*:\s*["']?(.+?)["']?(?:[\n\r]|$)/i);

    if (roleMatch || painMatch) {
        return {
            role: roleMatch ? roleMatch[1].trim() : '',
            pain: painMatch ? painMatch[1].trim() : ''
        };
    }
    return null;
}

// Navigation
async function goToStep(step) {
    if (step === 2) {
        const role = document.getElementById('avatar-role').value.trim();
        const pain = document.getElementById('avatar-pain').value.trim();
        if (!role || !pain) {
            alert("Please define your Avatar first.");
            return;
        }
        state.avatar = { role, pain };
        await suggestTopics();
    }
    
    if (step === 3) {
        if (!state.generatedContent) {
            alert("Please generate some content first.");
            return;
        }
        document.getElementById('avatar-name-display').textContent = state.avatar.role;
        runResonanceCheck();
    }

    document.querySelectorAll('section').forEach(el => el.classList.add('hidden'));
    document.getElementById(`step${step}`).classList.remove('hidden');
    
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
