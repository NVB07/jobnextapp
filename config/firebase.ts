import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import ENV from "./env";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: ENV.FIREBASE_API_KEY,
    authDomain: ENV.FIREBASE_AUTH_DOMAIN,
    projectId: ENV.FIREBASE_PROJECT_ID,
    storageBucket: ENV.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: ENV.FIREBASE_MESSAGING_SENDER_ID,
    appId: ENV.FIREBASE_APP_ID,
    measurementId: ENV.FIREBASE_MEASUREMENT_ID,
};

// Validate Firebase config
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error("🔥 Firebase configuration is missing required fields. Please check your .env file.");
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth (React Native has built-in persistence)
const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.setCustomParameters({
    prompt: "select_account",
});

if (__DEV__) {
    console.log("🔥 Firebase initialized successfully");
    console.log("📱 Project ID:", firebaseConfig.projectId);
    console.log("🔐 Auth persistence: React Native default (AsyncStorage)");
}

export { auth, googleProvider };
