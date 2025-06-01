import { useEffect } from "react";
import { router } from "expo-router";
import { useAuth } from "../contexts/AuthContext";

export const useAuthGuard = (redirectTo: string = "/login") => {
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && !user) {
            router.replace(redirectTo as any);
        }
    }, [user, loading, redirectTo]);

    return { user, loading, isAuthenticated: !!user };
};

export const useLoginRedirect = (redirectTo: string = "/(tabs)") => {
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && user) {
            router.replace(redirectTo as any);
        }
    }, [user, loading, redirectTo]);

    return { user, loading, isAuthenticated: !!user };
};
