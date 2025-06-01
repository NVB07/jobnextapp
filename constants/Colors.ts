/**
 * Modern color scheme with gradients and beautiful UI colors
 */

const tintColorLight = "#6366f1"; // Modern indigo
const tintColorDark = "#818cf8";
const primaryGradient: [string, string] = ["#6366f1", "#8b5cf6"]; // Indigo to purple gradient

export const Colors = {
    light: {
        text: "#1f2937",
        background: "#f8fafc",
        tint: tintColorLight,
        icon: "#6b7280",
        tabIconDefault: "#9ca3af",
        tabIconSelected: tintColorLight,
        border: "#e5e7eb",
        cardBackground: "#ffffff",
        success: "#10b981",
        warning: "#f59e0b",
        error: "#ef4444",
        gradient: primaryGradient,
        shadow: "#000000",
    },
    dark: {
        text: "#f9fafb",
        background: "#0f172a",
        tint: tintColorDark,
        icon: "#9ca3af",
        tabIconDefault: "#6b7280",
        tabIconSelected: tintColorDark,
        border: "#374151",
        cardBackground: "#1e293b",
        success: "#34d399",
        warning: "#fbbf24",
        error: "#f87171",
        gradient: ["#818cf8", "#a78bfa"] as [string, string],
        shadow: "#000000",
    },
};
