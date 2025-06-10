import React, { useState } from "react";
import { TextInput, View, Text, StyleSheet, ViewStyle, TextInputProps, TextStyle } from "react-native";

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerStyle?: ViewStyle;
    inputStyle?: TextStyle;
    labelStyle?: TextStyle;
    errorStyle?: TextStyle;
}

export const Input: React.FC<InputProps> = ({ label, error, containerStyle, inputStyle, labelStyle, errorStyle, ...textInputProps }) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
            <TextInput
                style={[styles.input, isFocused && styles.inputFocused, error && styles.inputError, inputStyle]}
                onFocus={(e) => {
                    setIsFocused(true);
                    textInputProps.onFocus?.(e);
                }}
                onBlur={(e) => {
                    setIsFocused(false);
                    textInputProps.onBlur?.(e);
                }}
                placeholderTextColor="#8E8E93"
                autoCorrect={false}
                autoCapitalize="none"
                autoComplete="off"
                textContentType="none"
                {...textInputProps}
            />
            {error && <Text style={[styles.error, errorStyle]}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: "500",
        color: "#1C1C1E",
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: "#D1D1D6",
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        backgroundColor: "#FFFFFF",
        minHeight: 44,
    },
    inputFocused: {
        borderColor: "#007AFF",
        shadowColor: "#007AFF",
        shadowOffset: {
            width: 0,
            height: 0,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    inputError: {
        borderColor: "#FF3B30",
    },
    error: {
        fontSize: 12,
        color: "#FF3B30",
        marginTop: 4,
    },
});
