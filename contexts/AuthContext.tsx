import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../config/firebase";
import { authService, AuthUser } from "../services/authService";

interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<AuthUser>;
    signUp: (email: string, password: string, displayName: string) => Promise<AuthUser>;
    signOut: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        // Wait for Firebase Auth to restore state
        const initializeAuth = async () => {
            try {
                console.log("🔄 Initializing auth state...");

                // Check current auth state
                const isAuthenticated = authService.isAuthenticated();
                console.log("Initial auth check:", isAuthenticated);

                // Check stored auth data
                const { accessToken, userId } = await authService.getStoredAuthData();
                if (accessToken && userId) {
                    console.log("✅ Found stored auth data for user:", userId);
                } else {
                    console.log("❌ No stored auth data found");
                }

                // Wait for auth state to be restored from Firebase
                const firebaseUser = await authService.waitForAuthRestore();

                if (mounted && firebaseUser) {
                    const authUser: AuthUser = {
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        displayName: firebaseUser.displayName,
                        photoURL: firebaseUser.photoURL,
                        emailVerified: firebaseUser.emailVerified,
                    };
                    setUser(authUser);
                    console.log("✅ Auth state restored for:", firebaseUser.email);
                } else if (mounted) {
                    setUser(null);
                    console.log("❌ No authenticated user found");
                }
            } catch (error) {
                console.log("❌ Error initializing auth:", error);
                if (mounted) {
                    setUser(null);
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                    console.log("✅ Auth initialization complete");
                }
            }
        };

        initializeAuth();

        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
            try {
                console.log("🔄 Auth state changed:", firebaseUser ? `User: ${firebaseUser.email} (${firebaseUser.uid})` : "No user");

                if (firebaseUser) {
                    // Convert Firebase user to AuthUser
                    const authUser: AuthUser = {
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        displayName: firebaseUser.displayName,
                        photoURL: firebaseUser.photoURL,
                        emailVerified: firebaseUser.emailVerified,
                    };
                    setUser(authUser);
                    console.log("✅ User set in context:", authUser.email);

                    // Store auth data - don't let this fail the auth process
                    try {
                        await authService.storeAuthData(firebaseUser);
                        console.log("✅ Auth data stored successfully");
                    } catch (storeError) {
                        console.warn("⚠️ Warning: Failed to store auth data:", storeError);
                        // Don't throw this error - auth state change should still succeed
                    }
                } else {
                    console.log("❌ No Firebase user - setting user to null");
                    setUser(null);
                    try {
                        await authService.removeAuthData();
                        console.log("✅ Auth data removed successfully");
                    } catch (removeError) {
                        console.warn("⚠️ Warning: Failed to remove auth data:", removeError);
                        // Don't throw this error
                    }
                }
            } catch (error) {
                console.log("❌ Error in onAuthStateChanged:", error);
                // Don't throw this error - it would break the auth state management
            }
        });

        return unsubscribe;
    }, []);

    const signIn = async (email: string, password: string): Promise<AuthUser> => {
        try {
            const authUser = await authService.signInWithEmail(email, password);
            setUser(authUser);
            return authUser;
        } catch (error) {
            // console.log("Sign in error:", error);
            throw error;
        }
    };

    const signUp = async (email: string, password: string, displayName: string): Promise<AuthUser> => {
        try {
            const authUser = await authService.signUpWithEmail(email, password, displayName);

            // Create user in database
            const firebaseUser = authService.getCurrentUser();
            if (firebaseUser) {
                await authService.createUserInDatabase(firebaseUser);
            }

            setUser(authUser);
            return authUser;
        } catch (error) {
            console.log("Sign up error:", error);
            throw error;
        }
    };

    const signOut = async (): Promise<void> => {
        try {
            await authService.signOut();
            setUser(null);
        } catch (error) {
            console.log("Sign out error:", error);
            throw error;
        }
    };

    const refreshUser = async (): Promise<void> => {
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
            const authUser: AuthUser = {
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName,
                photoURL: currentUser.photoURL,
                emailVerified: currentUser.emailVerified,
            };
            setUser(authUser);
        }
    };

    const value: AuthContextType = {
        user,
        loading,
        signIn,
        signUp,
        signOut,
        refreshUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
