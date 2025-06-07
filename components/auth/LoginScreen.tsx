import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Image, Alert, TouchableOpacity, SafeAreaView } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { useAuth } from "../../contexts/AuthContext";
import { router } from "expo-router";
import { IconSymbol } from "../ui/IconSymbol";

// Validation schemas
const loginSchema = yup.object().shape({
    email: yup.string().email("Email không hợp lệ").required("Email là bắt buộc"),
    password: yup
        .string()
        .min(6, "Mật khẩu ít nhất 6 ký tự")
        .matches(/[A-Z]/, "Mật khẩu phải có ít nhất 1 ký tự viết hoa")
        .matches(/[a-z]/, "Mật khẩu phải có ít nhất 1 ký tự viết thường")
        .matches(/[0-9]/, "Mật khẩu phải có ít nhất 1 ký tự số")
        .required("Mật khẩu là bắt buộc"),
});

const registerSchema = yup.object().shape({
    email: yup.string().email("Email không hợp lệ").required("Email là bắt buộc"),
    password: yup
        .string()
        .min(6, "Mật khẩu ít nhất 6 ký tự")
        .matches(/[A-Z]/, "Mật khẩu phải có ít nhất 1 ký tự viết hoa")
        .matches(/[a-z]/, "Mật khẩu phải có ít nhất 1 ký tự viết thường")
        .matches(/[0-9]/, "Mật khẩu phải có ít nhất 1 ký tự số")
        .required("Mật khẩu là bắt buộc"),
    confirmPassword: yup
        .string()
        .oneOf([yup.ref("password")], "Mật khẩu không khớp")
        .required("Xác nhận mật khẩu là bắt buộc"),
    displayName: yup.string().required("Tên người dùng là bắt buộc"),
});

interface FormData {
    email: string;
    password: string;
    confirmPassword?: string;
    displayName?: string;
}

export const LoginScreen: React.FC = () => {
    const [isRegister, setIsRegister] = useState(false);
    const [loading, setLoading] = useState(false);
    const { signIn, signUp } = useAuth();

    const {
        control,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<FormData>({
        resolver: yupResolver(isRegister ? registerSchema : loginSchema),
    });

    const onSubmit = async (data: FormData) => {
        setLoading(true);
        try {
            if (isRegister) {
                await signUp(data.email, data.password, data.displayName!);
                Alert.alert("Đăng ký thành công", "Tài khoản đã được tạo thành công. Vui lòng kiểm tra email để xác thực tài khoản.", [
                    {
                        text: "OK",
                        onPress: () => router.replace("/(tabs)"),
                    },
                ]);
            } else {
                await signIn(data.email, data.password);
                router.replace("/(tabs)");
            }
            reset();
        } catch (error: any) {
            Alert.alert(isRegister ? "Lỗi đăng ký" : "Lỗi đăng nhập", error.message || "Có lỗi xảy ra, vui lòng thử lại");
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsRegister(!isRegister);
        reset();
    };

    const goBack = () => {
        router.replace("/(tabs)");
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView style={styles.keyboardContainer} behavior={Platform.OS === "ios" ? "padding" : "height"}>
                {/* Header with back button */}
                {/* <View style={styles.topHeader}>
                    <TouchableOpacity onPress={goBack} style={styles.backButton}>
                        <IconSymbol name="chevron.left" size={20} color="#007AFF" />
                        <Text style={styles.backButtonText}>Quay lại</Text>
                    </TouchableOpacity>
                </View> */}

                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    <View style={styles.header}>
                        <Image source={require("../../assets/images/icon.png")} style={styles.logo} resizeMode="contain" />
                        <Text style={styles.title}>{isRegister ? "Đăng ký JobNext" : "Đăng nhập JobNext"}</Text>
                        <Text style={styles.subtitle}>{isRegister ? "Chúng tôi cần một vài thông tin để bạn bắt đầu" : "Đăng nhập để tiếp tục sử dụng dịch vụ"}</Text>
                    </View>

                    <View style={styles.form}>
                        {isRegister && (
                            <Controller
                                control={control}
                                name="displayName"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <Input
                                        label="Tên người dùng"
                                        placeholder="Nhập tên của bạn"
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        error={errors.displayName?.message}
                                    />
                                )}
                            />
                        )}

                        <Controller
                            control={control}
                            name="email"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <Input
                                    label="Email"
                                    placeholder="hi@gmail.com"
                                    value={value}
                                    onChangeText={onChange}
                                    onBlur={onBlur}
                                    error={errors.email?.message}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            )}
                        />

                        <Controller
                            control={control}
                            name="password"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <Input
                                    label="Mật khẩu"
                                    placeholder="Nhập mật khẩu của bạn"
                                    value={value}
                                    onChangeText={onChange}
                                    onBlur={onBlur}
                                    error={errors.password?.message}
                                    secureTextEntry
                                />
                            )}
                        />

                        {isRegister && (
                            <Controller
                                control={control}
                                name="confirmPassword"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <Input
                                        label="Xác nhận mật khẩu"
                                        placeholder="Nhập lại mật khẩu"
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        error={errors.confirmPassword?.message}
                                        secureTextEntry
                                    />
                                )}
                            />
                        )}

                        <Button title={isRegister ? "Đăng ký" : "Đăng nhập"} onPress={handleSubmit(onSubmit)} loading={loading} style={styles.submitButton} />
                        {/* 
                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>Hoặc</Text>
                            <View style={styles.dividerLine} />
                        </View> */}

                        {/* <Button
                            title="Đăng nhập với Google"
                            onPress={() => Alert.alert("Thông báo", "Tính năng đăng nhập Google sẽ có trong bản cập nhật tiếp theo")}
                            variant="outline"
                            disabled={loading}
                        /> */}

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>{isRegister ? "Bạn đã có tài khoản?" : "Bạn chưa có tài khoản?"}</Text>
                            <TouchableOpacity onPress={toggleMode} disabled={loading}>
                                <Text style={styles.footerLink}>{isRegister ? "Đăng nhập" : "Đăng ký"}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Skip login option */}
                        <View style={styles.skipContainer}>
                            <TouchableOpacity onPress={goBack} style={styles.skipButton}>
                                <Text style={styles.skipButtonText}>Bỏ qua</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    keyboardContainer: {
        flex: 1,
    },
    topHeader: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E5EA",
    },
    backButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    backButtonText: {
        fontSize: 16,
        color: "#007AFF",
        marginLeft: 4,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: "center",
        paddingHorizontal: 24,
        paddingVertical: 20,
    },
    header: {
        alignItems: "center",
        marginBottom: 40,
    },
    logo: {
        width: 64,
        height: 64,
        marginBottom: 16,
        borderRadius: 12,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#1C1C1E",
        textAlign: "center",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: "#8E8E93",
        textAlign: "center",
        lineHeight: 22,
    },
    form: {
        flex: 1,
    },
    submitButton: {
        marginBottom: 24,
    },
    divider: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: "#E5E5EA",
    },
    dividerText: {
        marginHorizontal: 16,
        fontSize: 14,
        color: "#8E8E93",
    },
    footer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 24,
    },
    footerText: {
        fontSize: 14,
        color: "#8E8E93",
    },
    footerLink: {
        fontSize: 14,
        color: "#007AFF",
        fontWeight: "600",
        marginLeft: 4,
    },
    skipContainer: {
        alignItems: "center",
        marginTop: 32,
        paddingTop: 24,
        borderTopWidth: 1,
        borderTopColor: "#E5E5EA",
    },
    skipButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: "#8E8E93",
        borderRadius: 8,
    },
    skipButtonText: {
        fontSize: 14,
        color: "#8E8E93",
        textAlign: "center",
    },
});
