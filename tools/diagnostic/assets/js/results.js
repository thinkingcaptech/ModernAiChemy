const pillars = ['management', 'marketing', 'sales', 'finances'];

const formatNarrative = (score) => {
    if (score >= 85) return 'Elite operations. Keep investing in scalability.';
    if (score >= 70) return 'Strong fundamentals with select optimizations remaining.';
    if (score >= 55) return 'Momentum exists, but key bottlenecks now limit growth.';
    return 'Critical focus required. Address the weakest pillar immediately.';
};

const renderBreakdown = (scores) => {
    const grid = document.getElementById('breakdownGrid');
    if (!grid) return;
    grid.innerHTML = '';
    pillars.forEach((pillar) => {
        const score = scores?.[pillar] ?? 0;
        const titleMap = {
            management: 'Management & Operations',
            marketing: 'Marketing & Lead Generation',
            sales: 'Sales & Conversion',
            finances: 'Finances & Scalability',
        };
        const card = document.createElement('article');
        card.className = 'breakdown-card';
        card.innerHTML = `
            <h3>${titleMap[pillar]}</h3>
            <p>${score}/100</p>
            <div class="progress-pill"><span style="width:${score}%"></span></div>
        `;
        grid.appendChild(card);
    });
};

const renderRecommendations = (text) => {
    const container = document.getElementById('aiRecommendations');
    if (!container) return;
    container.classList.remove('loading');
    if (!text) {
        container.innerHTML = '<p>Recommendations are still processing. Check back shortly.</p>';
        return;
    }
    
    // Convert markdown to HTML for better formatting
    let html = text
        // Headers
        .replace(/^### (.*$)/gm, '<h4>$1</h4>')
        .replace(/^## (.*$)/gm, '<h3>$1</h3>')
        .replace(/^# (.*$)/gm, '<h2>$1</h2>')
        // Bold
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Bullet points
        .replace(/^- (.*$)/gm, '<li>$1</li>')
        .replace(/^• (.*$)/gm, '<li>$1</li>')
        // Numbered lists
        .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
        // Paragraphs (double newlines)
        .replace(/\n\n/g, '</p><p>')
        // Single newlines after headers shouldn't create breaks
        .replace(/<\/h([234])><\/p><p>/g, '</h$1>')
        // Wrap consecutive list items
        .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
        // Clean up
        .replace(/<\/ul>\s*<ul>/g, '')
        .replace(/\n/g, '<br>');
    
    // Wrap in paragraph if not starting with a tag
    if (!html.startsWith('<')) {
        html = '<p>' + html + '</p>';
    }
    
    container.innerHTML = `<div class="diagnostic-report">${html}</div>`;
    
    // Trigger the alchemical celebration effect
    triggerCelebration(container);
};

// Alchemical celebration effect for AI responses
const triggerCelebration = (container) => {
    // Add celebrate class to trigger the golden glow animation
    container.classList.add('ai-report--celebrate');
    
    // Play subtle sound effect if audio is available (optional)
    try {
        const celebrationSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleVmh8v/vpXA4VJbx/++aZjFCg9/0/7dtNTdxzvH/yoNJO2y44v/eoFc2WKjR/+mxZzNMl8P/9byDPECFs/3/ydqQSDxqlur/89Kjb01Ke6Tv/vG9nHZGSGqMwfvz28mTY0BSdJu29+fRn3FPT2eKr+/h0qaDXUxgfaLo4te0mXNVVGJ+nNvWv5+FbVVWZHqXzMaqk4VuW1ljdZG+t5qKhXNfYWlxiKyvlYyHd2JgaHCCl6GXjot+ZmNneHuLl5ONjoh6aWZpe3yIkIuMi4R2amhsfHyGioqKi4N0bGtuf3yFhoeJiYJybm5xfn2DhIWHh4Jyb3FzfX2BgoOFhoFxcHJ0fHx/gIGDg39wcXR2fHt+f4CAgH5wcXV3e3t9fn5/fXxvcHV4ent8fH1+fHp5b3F1eHl6e3t8fHt5eHBxdXh5eXp6e3t6eHdwcnZ4eHl5enp5d3Z0cHN2d3h4eXl5d3Z0cnF0dnd3eHh4d3Z0c3JzdXZ2d3d3dnZ0c3J0dXV2dnZ2dnV0c3N0dXV1dXV1dXV0c3Nzc3R0dHR0dHRzc3NzdHR0dHR0dHRzc3Nzc3Nzc3NzdHRzc3Nzc3Nzc3Nzc3NzdHNzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3NzdHRzc3Nzc3N0dHR0dHR0dHR0dHR0dHRzc3R0dHR0dHR1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXZ2dnZ2dnZ2dnZ2dnZ2dnZ2d3d3d3d3d3d3d3d3d3d4eHh4eHh4eHh4eHh4eHl5eXl5eXl5enp6enp6e3t7e3t7e3t8fHx8fH19fX19fn5+fn5/f39/f4CAgICAgYGBgYGCgoKCg4ODg4OEhISEhIWFhYaGhoaHh4eHiIiIiYmJiYqKiouLi4yMjI2NjY6Ojo+Pj5CQkJGRkpKSk5OUlJWVlpaXl5iYmZmam5ucnJ2dnp+foKChoqKjpKSlpqeop6mqq6ytrq+wsLGys7S1tre4ubq7vL2+v8DBwsPExcbHyMnKy8zNzs/Q0dLT1NXW19jZ2tvc3d7f4OHi4+Tl5ufo6err7O3u7/Dx8vP09fb3+Pn6+/z9/v8=');
        celebrationSound.volume = 0.15;
        celebrationSound.play().catch(() => {}); // Ignore autoplay restrictions
    } catch (e) {
        // Audio not critical, continue silently
    }
    
    // Remove celebrate class after animation completes (5 seconds)
    setTimeout(() => {
        container.classList.remove('ai-report--celebrate');
    }, 5000);
};

const updateCtaCopy = (scores) => {
    const ctaPanel = document.getElementById('ctaPanel');
    if (!ctaPanel || !scores) return;
    const salesScore = scores.sales || 0;
    const paragraph = ctaPanel.querySelector('p:nth-of-type(2)');
    if (salesScore < 65) {
        paragraph.textContent = 'Sales & Conversion scored the lowest. The Sales Funnel Micro-CRM is tuned to remove friction exactly where you need it most.';
    }
};

const loadReportFromLocalStorage = (reportId) => {
    try {
        const reportData = localStorage.getItem(`diagnostic_${reportId}`);
        if (!reportData) return null;
        return JSON.parse(reportData);
    } catch (error) {
        console.error('Error parsing localStorage report:', error);
        return null;
    }
};

const loadReportFromFirestore = async (reportId) => {
    if (!window.db) return null;
    
    try {
        const doc = await window.db.collection('diagnostics').doc(reportId).get();
        if (!doc.exists) return null;
        return doc.data();
    } catch (error) {
        console.error('Error fetching from Firestore:', error);
        return null;
    }
};

const loadReport = async () => {
    const params = new URLSearchParams(window.location.search);
    const reportId = params.get('reportId') || sessionStorage.getItem('latest_report_id');
    const scoreEl = document.getElementById('scoreValue');
    const narrativeEl = document.getElementById('scoreNarrative');
    const reportIdLabel = document.getElementById('reportIdLabel');

    if (!reportId) {
        narrativeEl.textContent = 'Missing report ID. Please relaunch the diagnostic.';
        return;
    }

    reportIdLabel.textContent = reportId;
    narrativeEl.textContent = 'Loading your report...';

    try {
        // Try localStorage first (for BYOK mode)
        let data = loadReportFromLocalStorage(reportId);
        
        // Fallback to Firestore if available (for backwards compatibility)
        if (!data && window.db) {
            data = await loadReportFromFirestore(reportId);
        }

        if (!data) {
            narrativeEl.textContent = 'Report not found. Double-check the link or run the diagnostic again.';
            return;
        }

        const scores = data?.scores || {};
        const totalScore = scores.total ?? 0;
        scoreEl.textContent = `${totalScore}`;
        narrativeEl.textContent = formatNarrative(totalScore);
        renderBreakdown(scores);
        renderRecommendations(data?.recommendations);
        updateCtaCopy(scores);
    } catch (error) {
        console.error('Error loading report', error);
        narrativeEl.textContent = 'We hit a snag retrieving your report. Please refresh or rerun the diagnostic.';
    }
};

document.addEventListener('DOMContentLoaded', loadReport);