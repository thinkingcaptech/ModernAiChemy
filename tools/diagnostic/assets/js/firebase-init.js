(function initFirebase() {
    if (!window.firebase) {
        console.warn('Firebase SDK not loaded. Ensure firebase-app-compat.js is included.');
        return;
    }

    const defaultConfig = {
        apiKey: 'AIzaSyDpiRf-zSzrelcn8_M2dqdzyeMZUnvvPHk',
        authDomain: 'modern-aichemy-dashboard-dec25.firebaseapp.com',
        projectId: 'modern-aichemy-dashboard-dec25',
        storageBucket: 'modern-aichemy-dashboard-dec25.firebasestorage.app',
        messagingSenderId: '541181618242',
        appId: '1:541181618242:web:9f6a557fa57e58c872a5db',
    };

    const config = window.firebaseConfig || defaultConfig;

    if (!firebase.apps.length) {
        firebase.initializeApp(config);
    }

    firebase.firestore().settings({ ignoreUndefinedProperties: true });
    window.db = firebase.firestore();

    if (typeof firebase.analytics === 'function') {
        try {
            window.analytics = firebase.analytics();
        } catch (analyticsError) {
            console.warn('Analytics initialization failed:', analyticsError);
        }
    } else {
        console.info('Analytics SDK not detected. Include firebase-analytics-compat.js to enable it.');
    }
})();
