/**
 * Modern Alchemy - Authentication Guard
 * Protects pages - requires login but ALL TOOLS ARE FREE
 * 
 * Usage: Add this script to any protected page
 * <script src="/js/auth-guard.js" data-required-tool="diagnostic"></script>
 * 
 * NOTE: All tools are now FREE. Just need to be logged in.
 */

(function() {
    // Firebase configuration
    const firebaseConfig = {
        apiKey: "AIzaSyDpiRf-zSzrelcn8_M2dqdzyeMZUnvvPHk",
        authDomain: "modern-aichemy-dashboard-dec25.firebaseapp.com",
        projectId: "modern-aichemy-dashboard-dec25",
        storageBucket: "modern-aichemy-dashboard-dec25.firebasestorage.app",
        messagingSenderId: "541181618242",
        appId: "1:541181618242:web:9f6a557fa57e58c872a5db"
    };

    // Get the required tool from script tag (kept for compatibility but ignored)
    const scriptTag = document.currentScript;
    const requiredTool = scriptTag ? scriptTag.getAttribute('data-required-tool') : null;

    // Show loading state
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.3s ease';

    // Load Firebase SDKs
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Ensure user has full access in Firestore
    async function ensureFullAccess(db, user) {
        const userRef = db.collection('users').doc(user.uid);
        const doc = await userRef.get();
        
        const allTools = ['diagnostic', 'blog-builder', 'offer-architect', 'sales-simulator', 'aether-engine'];
        
        if (!doc.exists) {
            // Create new user with full access
            await userRef.set({
                email: user.email,
                displayName: user.displayName || '',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                tier: 'free',
                tools: allTools,
                freeAccess: true
            });
            return { tools: allTools, tier: 'free', freeAccess: true };
        } else {
            const data = doc.data();
            const userTools = data.tools || [];
            const missingTools = allTools.filter(tool => !userTools.includes(tool));
            // Ensure existing users have all tools
            if (missingTools.length > 0 || !data.freeAccess) {
                await userRef.update({
                    tools: allTools,
                    freeAccess: true,
                    tier: 'free'
                });
                return { ...data, tools: allTools, tier: 'free', freeAccess: true };
            }
            return data;
        }
    }

    async function initAuth() {
        try {
            // Load Firebase if not already loaded
            if (typeof firebase === 'undefined') {
                await loadScript('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
                await loadScript('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js');
                await loadScript('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js');
            }

            // Initialize Firebase if not already initialized
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }

            const auth = firebase.auth();
            const db = firebase.firestore();

            // Check auth state
            auth.onAuthStateChanged(async (user) => {
                if (!user) {
                    // Not logged in - redirect to login page
                    console.log('No user logged in, redirecting to login...');
                    window.location.href = '/login.html';
                    return;
                }

                try {
                    // Ensure user has full access (FREE model)
                    const userData = await ensureFullAccess(db, user);
                    const userTools = userData.tools || allTools;

                    console.log('User authenticated with FREE access to all tools');

                    // User has access - show the page
                    document.body.style.opacity = '1';
                    
                    // Store user info for the page to use
                    window.alchemyUser = {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName || userData.displayName,
                        tools: userTools,
                        tier: 'free',
                        freeAccess: true
                    };

                    // Dispatch event for pages that want to know auth is ready
                    window.dispatchEvent(new CustomEvent('alchemyAuthReady', { detail: window.alchemyUser }));

                } catch (error) {
                    console.error('Error checking user access:', error);
                    // Still allow access on error - just log them in
                    document.body.style.opacity = '1';
                    window.alchemyUser = {
                        uid: user.uid,
                        email: user.email,
                        tools: allTools,
                        tier: 'free',
                        freeAccess: true
                    };
                    window.dispatchEvent(new CustomEvent('alchemyAuthReady', { detail: window.alchemyUser }));
                }
            });

        } catch (error) {
            console.error('Error loading Firebase:', error);
            document.body.style.opacity = '1';
            document.body.innerHTML = '<div style="padding:50px;text-align:center;color:#D4AF37;font-family:sans-serif;"><h1>Error Loading</h1><p>Please refresh the page or try again later.</p></div>';
        }
    }

    // Start auth check
    initAuth();
})();
