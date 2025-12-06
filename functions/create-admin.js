// Script to create admin user directly in Firebase
// Run with: node create-admin.js

const admin = require('firebase-admin');

// Initialize Firebase Admin with default credentials
admin.initializeApp({
  projectId: 'modern-aichemy-dashboard-dec25'
});

const auth = admin.auth();
const db = admin.firestore();

async function createAdminUser() {
  const email = 'Will@tctcusa.com';
  const password = 'inGODwetrust7!';
  
  try {
    // Check if user already exists
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      console.log('User already exists:', userRecord.uid);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Create new user
        userRecord = await auth.createUser({
          email: email,
          password: password,
          displayName: 'Will Admin'
        });
        console.log('Created new user:', userRecord.uid);
      } else {
        throw error;
      }
    }

    // Create/update user document with full access
    await db.collection('users').doc(userRecord.uid).set({
      email: email,
      displayName: 'Will Admin',
      hasLifetimeAccess: true,
      tier: 'admin',
      tierName: 'Administrator',
      tools: ['diagnostic', 'blog-builder', 'offer-architect'],
      isAdmin: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log('✅ Admin user created/updated successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Access: All tools (diagnostic, blog-builder, offer-architect)');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();
