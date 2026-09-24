// =========================================================================
// LIFESIM.AI - FIREBASE AUTHENTICATION & GOOGLE LOGIN SERVICE (V2.4_PH)
// Project: appcon2026-appsembly-lifesimai
// =========================================================================

class FirebaseService {
  constructor() {
    this.app = null;
    this.auth = null;
    this.isInitialized = false;
    this.authListenerAttached = false;
    
    // Configured Firebase credentials for appcon2026-appsembly-lifesimai
    this.defaultConfig = {
      apiKey: "AIzaSyDQ-woih5cuLOAZowWaiot8fXKmGYAGP3I",
      authDomain: "appcon2026-appsembly-lifesimai.firebaseapp.com",
      projectId: "appcon2026-appsembly-lifesimai",
      storageBucket: "appcon2026-appsembly-lifesimai.firebasestorage.app",
      messagingSenderId: "34193676976",
      appId: "1:34193676976:web:2c845e46c5ac0ebf0cf975",
      measurementId: "G-4MMLEVCNJ1"
    };
  }

  // Load config from localStorage or default
  getConfig() {
    const saved = localStorage.getItem('lifesim_firebase_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.apiKey && parsed.authDomain && parsed.projectId) {
          return parsed;
        }
      } catch (e) {
        console.error('[FirebaseService] Failed to parse stored config:', e);
      }
    }
    return { ...this.defaultConfig };
  }

  // Save updated config to localStorage
  saveConfig(configObj) {
    if (!configObj || typeof configObj !== 'object') return false;
    localStorage.setItem('lifesim_firebase_config', JSON.stringify(configObj));
    this.isInitialized = false;
    return this.init();
  }

  // Check if Firebase SDK is loaded on window
  isSdkLoaded() {
    return typeof firebase !== 'undefined' && !!firebase.initializeApp && !!firebase.auth;
  }

  // Initialize Firebase App
  init() {
    if (!this.isSdkLoaded()) {
      console.warn('[FirebaseService] Firebase SDK not loaded in DOM.');
      return false;
    }

    const config = this.getConfig();
    if (!config.apiKey || !config.authDomain || !config.projectId) {
      console.log('[FirebaseService] Firebase config incomplete.');
      return false;
    }

    try {
      if (firebase.apps && firebase.apps.length > 0) {
        this.app = firebase.apps[0];
      } else {
        this.app = firebase.initializeApp(config);
      }

      this.auth = firebase.auth();
      this.isInitialized = true;
      console.log('[FirebaseService] Firebase successfully initialized for project:', config.projectId);

      this.attachAuthStateObserver();
      return true;
    } catch (err) {
      console.error('[FirebaseService] Initialization error:', err);
      this.isInitialized = false;
      return false;
    }
  }

  // Listen to Firebase auth state changes
  attachAuthStateObserver() {
    if (!this.auth || this.authListenerAttached) return;

    this.auth.onAuthStateChanged((user) => {
      if (user) {
        console.log('[FirebaseService] User session detected:', user.displayName, user.email);
        const heroUser = {
          isLoggedIn: true,
          authProvider: 'firebase_google',
          displayName: user.displayName || 'Verified Hero',
          email: user.email || 'hero@gmail.com',
          avatar: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.displayName || 'Hero')}`,
          role: 'VERIFIED_HERO',
          uid: user.uid,
          cloudSync: true,
          maxVaultSlots: Infinity,
          verifiedSealNumber: `PH-2026-HERO-${Math.floor(1000 + Math.random() * 9000)}`
        };

        if (window.app) {
          window.app.currentUser = heroUser;
          localStorage.setItem('lifesim_auth_user', JSON.stringify(heroUser));
          window.app.updateAuthUI();
        }
      } else {
        console.log('[FirebaseService] No active Firebase session.');
      }
    });

    this.authListenerAttached = true;
  }

  // Google Sign-In with Popup
  async signInWithGoogle() {
    if (!this.isInitialized) {
      const initialized = this.init();
      if (!initialized) {
        throw new Error('CONFIG_MISSING');
      }
    }

    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const result = await this.auth.signInWithPopup(provider);
      const user = result.user;

      const heroUser = {
        isLoggedIn: true,
        authProvider: 'firebase_google',
        displayName: user.displayName || 'Verified Hero',
        email: user.email || 'hero@gmail.com',
        avatar: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.displayName || 'Hero')}`,
        role: 'VERIFIED_HERO',
        uid: user.uid,
        cloudSync: true,
        maxVaultSlots: Infinity,
        verifiedSealNumber: `PH-2026-HERO-${Math.floor(1000 + Math.random() * 9000)}`
      };

      await this.saveUser(heroUser);

      return heroUser;
    } catch (error) {
      console.error('[FirebaseService] Google Sign-In Error:', error);
      throw error;
    }
  }

  // Store the shared user profile in Firestore without resetting its creation time.
  async saveUser(user) {
    if (!user || !user.uid) return false;
    if (!this.isInitialized && !this.init()) return false;
    if (typeof firebase.firestore !== 'function') {
      console.warn('[FirebaseService] Firestore SDK not loaded.');
      return false;
    }

    try {
      const userRef = firebase.firestore().collection('users').doc(user.uid);
      const snapshot = await userRef.get();
      const userData = {
        displayName: user.displayName,
        email: user.email,
        lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
        uid: user.uid
      };

      if (!snapshot.exists) {
        userData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      }

      await userRef.set(userData, { merge: true });
      return true;
    } catch (error) {
      console.error('[FirebaseService] Failed to save user:', error);
      return false;
    }
  }

  async loadUserVault(uid) {
    if (!uid || !this.isInitialized || typeof firebase.firestore !== 'function') return null;

    try {
      const snapshot = await firebase.firestore()
        .collection('users')
        .doc(uid)
        .collection('whatIfVault')
        .orderBy('createdAt', 'desc')
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('[FirebaseService] Failed to load user vault:', error);
      return null;
    }
  }

  async saveVaultItem(uid, item) {
    if (!uid || !item || !this.isInitialized || typeof firebase.firestore !== 'function') return false;

    try {
      await firebase.firestore()
        .collection('users')
        .doc(uid)
        .collection('whatIfVault')
        .doc(item.id)
        .set({
          title: item.title,
          scenarioKey: item.scenarioKey,
          createdAt: item.createdAt,
          syncedToCloud: true
        }, { merge: true });
      return true;
    } catch (error) {
      console.error('[FirebaseService] Failed to save vault item:', error);
      return false;
    }
  }

  async deleteVaultItem(uid, itemId) {
    if (!uid || !itemId || !this.isInitialized || typeof firebase.firestore !== 'function') return false;

    try {
      await firebase.firestore()
        .collection('users')
        .doc(uid)
        .collection('whatIfVault')
        .doc(itemId)
        .delete();
      return true;
    } catch (error) {
      console.error('[FirebaseService] Failed to delete vault item:', error);
      return false;
    }
  }

  async loadQuestLogs(uid) {
    if (!uid || !this.isInitialized || typeof firebase.firestore !== 'function') return null;

    try {
      const snapshot = await firebase.firestore()
        .collection('users')
        .doc(uid)
        .collection('questLogs')
        .where('completed', '==', true)
        .get();
      return snapshot.docs.map(doc => doc.id);
    } catch (error) {
      console.error('[FirebaseService] Failed to load quest logs:', error);
      return null;
    }
  }

  async saveQuestLog(uid, questId, completed) {
    if (!uid || !questId || !this.isInitialized || typeof firebase.firestore !== 'function') return false;

    try {
      await firebase.firestore()
        .collection('users')
        .doc(uid)
        .collection('questLogs')
        .doc(questId)
        .set({
          questId,
          completed,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      return true;
    } catch (error) {
      console.error('[FirebaseService] Failed to save quest log:', error);
      return false;
    }
  }

  // Sign out
  async signOut() {
    if (this.auth && this.isInitialized) {
      try {
        await this.auth.signOut();
      } catch (e) {
        console.warn('[FirebaseService] Sign-out warning:', e);
      }
    }
  }
}

// Global Singleton Instance
const firebaseService = new FirebaseService();
window.firebaseService = firebaseService;