import React from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from "react-native";

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: "primary" | "secondary" | "outline";
    size?: "small" | "medium" | "large";
    disabled?: boolean;
    loading?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({ title, onPress, variant = "primary", size = "medium", disabled = false, loading = false, style, textStyle }) => {
    const buttonStyles = [styles.button, styles[`${variant}Button`], styles[`${size}Button`], disabled && styles.disabledButton, style];

    const textStyles = [styles.text, styles[`${variant}Text`], styles[`${size}Text`], disabled && styles.disabledText, textStyle];

    return (
        <TouchableOpacity style={buttonStyles} onPress={onPress} disabled={disabled || loading} activeOpacity={0.8}>
            {loading ? <ActivityIndicator color={variant === "primary" ? "#FFFFFF" : "#007AFF"} /> : <Text style={textStyles}>{title}</Text>}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
    },

    // Variants
    primaryButton: {
        backgroundColor: "#007AFF",
    },
    secondaryButton: {
        backgroundColor: "#F2F2F7",
    },
    outlineButton: {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: "#007AFF",
    },

    // Sizes
    smallButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        minHeight: 32,
    },
    mediumButton: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        minHeight: 44,
    },
    largeButton: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        minHeight: 52,
    },

    // Disabled state
    disabledButton: {
        opacity: 0.5,
    },

    // Text styles
    text: {
        fontWeight: "600",
    },

    // Text variants
    primaryText: {
        color: "#FFFFFF",
    },
    secondaryText: {
        color: "#007AFF",
    },
    outlineText: {
        color: "#007AFF",
    },

    // Text sizes
    smallText: {
        fontSize: 14,
    },
    mediumText: {
        fontSize: 16,
    },
    largeText: {
        fontSize: 18,
    },

    // Disabled text
    disabledText: {
        opacity: 0.7,
    },
});
