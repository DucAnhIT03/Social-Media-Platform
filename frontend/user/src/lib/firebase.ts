
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For this to work, you need to replace these values with your own Firebase project config
// You can get these from the Firebase Console -> Project Settings -> General -> Your apps
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase only if config is present (prevents build errors)
const isConfigured = firebaseConfig.apiKey && firebaseConfig.projectId;

let app;
let auth: any;

if (isConfigured) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
} else {
    // During build time or if env vars are missing, provide a dummy/mock setup or just don't crash
    console.warn("Firebase config missing. Auth will not work.");
}

export { auth };
