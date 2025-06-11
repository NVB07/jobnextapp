import React, { useState } from "react";
import { Modal, View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Image, Alert, TouchableOpacity, Pressable } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { useAuth } from "../../contexts/AuthContext";
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

interface LoginModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ visible, onClose, onSuccess }) => {
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
                        onPress: () => {
                            onClose();
                            onSuccess?.();
                        },
                    },
                ]);
            } else {
                await signIn(data.email, data.password);
                onClose();
                onSuccess?.();
            }
            reset();
        } catch (error: any) {
            Alert.alert(isRegister ? "Lỗi đăng ký" : "Lỗi đăng nhập", error.message || "Sai email hoặc mật khẩu");
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsRegister(!isRegister);
        reset();
    };

    const handleClose = () => {
        setIsRegister(false);
        reset();
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
            <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                        <IconSymbol name="xmark" size={20} color="#8E8E93" />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    <View style={styles.logoSection}>
                        <View style={styles.logoContainer}>
                            <IconSymbol name="briefcase.fill" size={40} color="#007AFF" />
                        </View>
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

                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>Hoặc</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <Button
                            title="Đăng nhập với Google"
                            onPress={() => Alert.alert("Thông báo", "Tính năng đăng nhập Google sẽ có trong bản cập nhật tiếp theo")}
                            variant="outline"
                            disabled={loading}
                        />

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>{isRegister ? "Bạn đã có tài khoản?" : "Bạn chưa có tài khoản?"}</Text>
                            <TouchableOpacity onPress={toggleMode} disabled={loading}>
                                <Text style={styles.footerLink}>{isRegister ? "Đăng nhập" : "Đăng ký"}</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.skipContainer}>
                            <TouchableOpacity onPress={handleClose} style={styles.skipButton} disabled={loading}>
                                <Text style={styles.skipButtonText}>Bỏ qua, sử dụng ứng dụng</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    header: {
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
        paddingTop: 60,
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#F2F2F7",
        alignItems: "center",
        justifyContent: "center",
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    logoSection: {
        alignItems: "center",
        marginBottom: 40,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: "#F0F8FF",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
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
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 24,
    },
    skipButton: {
        padding: 12,
        borderWidth: 1,
        borderColor: "#007AFF",
        borderRadius: 8,
    },
    skipButtonText: {
        fontSize: 14,
        color: "#007AFF",
        fontWeight: "600",
    },
});
