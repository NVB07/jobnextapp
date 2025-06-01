// Environment variables validation and export
const ENV = {
    // Firebase Config
    FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGING_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    FIREBASE_MEASUREMENT_ID: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,

    // API Config
    API_URL: process.env.EXPO_PUBLIC_API_URL || "https://jobnext-server.onrender.com",
};

// Validate required environment variables
const requiredEnvVars = ["FIREBASE_API_KEY", "FIREBASE_AUTH_DOMAIN", "FIREBASE_PROJECT_ID", "FIREBASE_STORAGE_BUCKET", "FIREBASE_MESSAGING_SENDER_ID", "FIREBASE_APP_ID"];

const missingVars = requiredEnvVars.filter((key) => !ENV[key as keyof typeof ENV]);

if (missingVars.length > 0) {
    console.warn("⚠️  Missing environment variables:", missingVars);
    console.warn("⚠️  Please check your .env file");
}

// Log loaded config in development
if (__DEV__) {
    console.log("🔧 Environment Config Loaded:");
    console.log("- Firebase Project ID:", ENV.FIREBASE_PROJECT_ID);
    console.log("- API URL:", ENV.API_URL);
    console.log("- Auth Domain:", ENV.FIREBASE_AUTH_DOMAIN);
}

export default ENV;
