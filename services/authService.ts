import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    signOut,
    sendEmailVerification,
    updateProfile,
    User,
    deleteUser,
} from "firebase/auth";
import * as SecureStore from "expo-secure-store";
import { auth, googleProvider } from "../config/firebase";
import ENV from "../config/env";

export interface AuthUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    emailVerified: boolean;
    accessToken?: string;
}

// Secure storage keys
const ACCESS_TOKEN_KEY = "accessToken";
const USER_ID_KEY = "userId";

class AuthService {
    // Store auth data securely
    async storeAuthData(user: User) {
        try {
            console.log(`Storing auth data for user: ${user.email} (${user.uid})`);
            const accessToken = await user.getIdToken();
            await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
            await SecureStore.setItemAsync(USER_ID_KEY, user.uid);
            console.log("Auth data stored successfully");
        } catch (error) {
            console.error("Error storing auth data:", error);
            // Don't throw this error - let the calling code handle it
        }
    }

    // Remove auth data
    async removeAuthData() {
        try {
            await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
            await SecureStore.deleteItemAsync(USER_ID_KEY);
        } catch (error) {
            console.error("Error removing auth data:", error);
        }
    }

    // Get stored auth data
    async getStoredAuthData() {
        try {
            const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
            const userId = await SecureStore.getItemAsync(USER_ID_KEY);
            return { accessToken, userId };
        } catch (error) {
            console.error("Error getting stored auth data:", error);
            return { accessToken: null, userId: null };
        }
    }

    // Convert Firebase User to AuthUser
    private userToAuthUser(user: User): AuthUser {
        return {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            emailVerified: user.emailVerified,
        };
    }

    // Email/Password Sign In
    async signInWithEmail(email: string, password: string): Promise<AuthUser> {
        try {
            console.log(`Starting sign in for email: ${email}`);
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log(`User signed in successfully: ${user.uid}`);

            // Don't store auth data here - let onAuthStateChanged handle it
            // await this.storeAuthData(user);

            console.log("Sign in completed successfully");
            return this.userToAuthUser(user);
        } catch (error: any) {
            console.error("Email sign in error:", error);
            throw new Error(this.getErrorMessage(error.code));
        }
    }

    // Email/Password Sign Up
    async signUpWithEmail(email: string, password: string, displayName: string): Promise<AuthUser> {
        try {
            console.log(`Starting sign up for email: ${email}`);
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log(`User created successfully: ${user.uid}`);

            // Update profile with display name
            await updateProfile(user, { displayName });
            console.log(`Profile updated with displayName: ${displayName}`);

            // Send email verification
            await sendEmailVerification(user);
            console.log("Email verification sent");

            // Don't store auth data here - let onAuthStateChanged handle it
            // await this.storeAuthData(user);

            console.log("Sign up completed successfully");
            return this.userToAuthUser(user);
        } catch (error: any) {
            console.error("Email sign up error:", error);
            throw new Error(this.getErrorMessage(error.code));
        }
    }

    // Google Sign In (Note: This requires additional setup for mobile)
    async signInWithGoogle(): Promise<AuthUser> {
        try {
            // For mobile, we'll need to use expo-auth-session
            // This is a placeholder - implementation depends on platform
            throw new Error("Google sign-in not implemented for mobile yet");
        } catch (error: any) {
            console.error("Google sign in error:", error);
            throw new Error(this.getErrorMessage(error.code));
        }
    }

    // Sign Out
    async signOut(): Promise<void> {
        try {
            await signOut(auth);
            await this.removeAuthData();
        } catch (error) {
            console.error("Sign out error:", error);
            throw error;
        }
    }

    // Get current user
    getCurrentUser(): User | null {
        return auth.currentUser;
    }

    // Check if user is currently authenticated
    isAuthenticated(): boolean {
        const user = this.getCurrentUser();
        console.log("Current auth state:", user ? `Authenticated: ${user.email}` : "Not authenticated");
        return !!user;
    }

    // Wait for auth state to be restored
    waitForAuthRestore(): Promise<User | null> {
        return new Promise((resolve) => {
            const unsubscribe = auth.onAuthStateChanged((user) => {
                unsubscribe();
                console.log("Auth state restored:", user ? `User: ${user.email}` : "No user");
                resolve(user);
            });
        });
    }

    // Get error message in Vietnamese
    private getErrorMessage(errorCode: string): string {
        switch (errorCode) {
            case "auth/invalid-email":
                return "Email không hợp lệ";
            case "auth/user-disabled":
                return "Tài khoản đã bị vô hiệu hóa";
            case "auth/user-not-found":
                return "Không tìm thấy tài khoản";
            case "auth/wrong-password":
                return "Mật khẩu không đúng";
            case "auth/email-already-in-use":
                return "Email đã được sử dụng";
            case "auth/weak-password":
                return "Mật khẩu quá yếu";
            case "auth/network-request-failed":
                return "Lỗi kết nối mạng";
            case "auth/too-many-requests":
                return "Quá nhiều yêu cầu, vui lòng thử lại sau";
            default:
                return "Có lỗi xảy ra, vui lòng thử lại";
        }
    }

    // Call backend API to create user data
    async createUserInDatabase(user: User): Promise<void> {
        try {
            const response = await fetch(`${ENV.API_URL}/users`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    _id: user.uid,
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to create user in database");
            }
        } catch (error) {
            console.error("Error creating user in database:", error);
            throw error;
        }
    }
}

export const authService = new AuthService();
