// State
let chatHistory = [];
let currentPersona = "";
let currentOffer = "";
let isAnalyzing = false;

// System Prompts
const SIMULATOR_SYSTEM_PROMPT = `You are a roleplay partner for sales training.
You are playing the role of a PROSPECT.
Your Persona: {{PERSONA}}
The User is selling: {{OFFER}}

Instructions:
1. Keep your responses realistic, conversational, and relatively short (1-3 sentences).
2. Do not be easily convinced. Raise objections natural to your persona.
3. If the user effectively handles an objection or builds value, acknowledge it and move forward.
4. NEVER break character. You are the prospect, not the AI.
5. Only end the conversation if the user successfully closes you or completely fails/offends you.`;

const ANALYSIS_SYSTEM_PROMPT = `You are an expert Sales Coach specializing in "The Alchemy of Influence" methodology.
Analyze the following sales transcript between a User and a Prospect.

Evaluate the User based on these 3 pillars:
1. IGNIS (Fire): Did they disrupt patterns? Did they bring energy/authority? Did they uncover the 'bleeding neck' problem?
2. AQUA (Water): Did they show empathy? Did they fluidly handle objections without friction? Did they build rapport?
3. TERRA (Earth): Did they ground the offer in logic? Was the close clear and solid?

Provide a report in this HTML format:
<div class="space-y-4">
  <div class="p-4 border border-red-500/30 bg-red-900/10 rounded">
    <h3 class="font-bold text-red-400">🔥 IGNIS (Authority & Pain)</h3>
    <p class="text-sm">[Analysis here]</p>
  </div>
  <div class="p-4 border border-blue-500/30 bg-blue-900/10 rounded">
    <h3 class="font-bold text-blue-400">💧 AQUA (Empathy & Flow)</h3>
    <p class="text-sm">[Analysis here]</p>
  </div>
  <div class="p-4 border border-green-500/30 bg-green-900/10 rounded">
    <h3 class="font-bold text-green-400">🌍 TERRA (Logic & Close)</h3>
    <p class="text-sm">[Analysis here]</p>
  </div>
  <div class="mt-6 p-6 border border-yellow-500/50 rounded bg-yellow-500/5">
    <h3 class="font-serif text-2xl text-yellow-500 mb-2">The Alchemist's Verdict</h3>
    <p>[Overall feedback and 1 specific actionable tip for next time]</p>
  </div>
</div>`;

// DOM Elements
const setupPanel = document.getElementById('setupPanel');
const chatInterface = document.getElementById('chatInterface');
const chatHistoryDiv = document.getElementById('chatHistory');
const userMessageInput = document.getElementById('userMessage');
const endCallBtn = document.getElementById('endCallBtn');
const analysisPanel = document.getElementById('analysisPanel');
const analysisContent = document.getElementById('analysisContent');

// 1. Start Simulation
async function startSimulation() {
    const personaSelect = document.getElementById('persona');
    const offerInput = document.getElementById('offer');
    
    currentPersona = personaSelect.options[personaSelect.selectedIndex].text;
    currentOffer = offerInput.value || "High Ticket Services";

    // Validate API Key
    if (!ModernAlchemyKeys.requireAnyKey()) return;

    // UI Switch
    setupPanel.classList.add('hidden');
    chatInterface.classList.remove('hidden');
    chatInterface.classList.add('flex');
    endCallBtn.classList.remove('hidden');

    // Initial Prompt construction
    const systemMessage = SIMULATOR_SYSTEM_PROMPT
        .replace('{{PERSONA}}', currentPersona)
        .replace('{{OFFER}}', currentOffer);

    chatHistory = [
        { role: "system", content: systemMessage }
    ];

    // Start with a greeting from AI
    const openingLine = getOpeningLine(personaSelect.value);
    addMessageToUI("ai", openingLine);
    chatHistory.push({ role: "assistant", content: openingLine });
}

function getOpeningLine(type) {
    const lines = {
        skeptic: "Yeah, I've got about two minutes before my next meeting. What's this about?",
        busy: "This is [Name]. Make it quick, I'm swamped today.",
        friendly: "Hey there! Thanks for calling. I was just looking at your website actually.",
        budget: "Hello. Just so you know upfront, we aren't looking to spend any money right now."
    };
    return lines[type] || "Hello, who is this?";
}

// 2. Send Message Loop
async function sendMessage() {
    const text = userMessageInput.value.trim();
    if (!text || isAnalyzing) return;

    // UI Update
    addMessageToUI("user", text);
    userMessageInput.value = "";
    
    // Add to history
    chatHistory.push({ role: "user", content: text });

    // Show typing indicator
    const typingId = showTypingIndicator();

    try {
        let conversationStr = chatHistory
            .filter(m => m.role !== 'system')
            .map(m => `${m.role === 'user' ? 'User' : 'Prospect'}: ${m.content}`)
            .join('\n');

        const fullPrompt = conversationStr + "\nProspect:";
        
        const response = await ModernAlchemyKeys.callAI(fullPrompt, {
            systemPrompt: chatHistory[0].content
        });

        removeTypingIndicator(typingId);
        addMessageToUI("ai", response);
        chatHistory.push({ role: "assistant", content: response });

        // Auto-scroll
        chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;

    } catch (error) {
        removeTypingIndicator(typingId);
        addMessageToUI("system", "Error: " + error.message);
    }
}

// 3. Analysis Phase
endCallBtn.addEventListener('click', async () => {
    if (chatHistory.length < 3) {
        alert("Have a longer conversation before ending!");
        return;
    }

    if(!confirm("End simulation and receive your Alchemy Report?")) return;

    isAnalyzing = true;
    analysisPanel.classList.remove('hidden');
    
    try {
        let transcript = chatHistory
            .filter(m => m.role !== 'system')
            .map(m => `${m.role.toUpperCase()}: ${m.content}`)
            .join('\n');

        const analysisResponse = await ModernAlchemyKeys.callAI(transcript, {
            systemPrompt: ANALYSIS_SYSTEM_PROMPT
        });

        analysisContent.innerHTML = analysisResponse;

        if (typeof firebase !== "undefined" && firebase.apps.length) {
            const user = firebase.auth().currentUser;
            if (user) {
                const db = firebase.firestore();
                await db.collection('users')
                    .doc(user.uid)
                    .collection('sales_simulations')
                    .add({
                        persona: currentPersona,
                        offer: currentOffer,
                        transcript,
                        analysis: analysisResponse,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                console.log("Simulation saved to history.");
            }
        }

    } catch (error) {
        analysisContent.innerHTML = `<p class="text-red-500">Analysis Failed: ${error.message}</p>`;
    }
});

// UI Helpers
function addMessageToUI(role, text) {
    const div = document.createElement('div');
    div.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;
    
    const bubble = document.createElement('div');
    bubble.className = `p-4 max-w-[80%] text-sm md:text-base shadow-lg ${role === 'user' ? 'bubble-user' : role === 'ai' ? 'bubble-ai' : 'bg-red-900/50 rounded text-red-200'}`;
    
    bubble.textContent = text;
    div.appendChild(bubble);
    chatHistoryDiv.appendChild(div);
    chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
}

function showTypingIndicator() {
    const id = 'typing-' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = 'flex justify-start';
    div.innerHTML = `
        <div class="bubble-ai p-4 flex gap-1">
            <div class="w-2 h-2 bg-tctc-gold rounded-full typing-dot"></div>
            <div class="w-2 h-2 bg-tctc-gold rounded-full typing-dot" style="animation-delay: 0.2s"></div>
            <div class="w-2 h-2 bg-tctc-gold rounded-full typing-dot" style="animation-delay: 0.4s"></div>
        </div>
    `;
    chatHistoryDiv.appendChild(div);
    chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
    return id;
}

function removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}
