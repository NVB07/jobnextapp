import React, { useLayoutEffect } from "react";
import { StyleSheet, ScrollView, View, StatusBar, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useNavigation } from "expo-router";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function PrivacyScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();

    // Hide the default header
    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    const renderHeader = () => (
        <LinearGradient colors={colors.gradient} style={[styles.header, { paddingTop: insets.top + 10 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={styles.headerContent}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
                    <IconSymbol name="chevron.left" size={20} color="white" />
                </TouchableOpacity>

                <View style={styles.headerTextContainer}>
                    <View style={{ justifyContent: "flex-start" }}>
                        <ThemedText style={styles.headerTitle}>Chính sách bảo mật</ThemedText>
                        <ThemedText style={{ fontSize: 12 }}>Ngày cập nhật: 01/02/2025</ThemedText>
                    </View>
                </View>

                <View style={styles.placeholderButton} />
            </View>
        </LinearGradient>
    );

    return (
        <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} />
            {renderHeader()}

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
                <View style={styles.section}>
                    <View style={styles.sectionBlock}>
                        <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>1. Thu thập thông tin cá nhân</ThemedText>
                        <ThemedText style={[styles.sectionContent, { color: colors.text }]}>
                            Khi sử dụng dịch vụ của chúng tôi, bạn có thể được yêu cầu cung cấp các thông tin cá nhân như:
                        </ThemedText>
                        <View style={styles.listContainer}>
                            <ThemedText style={[styles.listItem, { color: colors.text }]}>• Họ và tên</ThemedText>
                            <ThemedText style={[styles.listItem, { color: colors.text }]}>• Địa chỉ email</ThemedText>
                            <ThemedText style={[styles.listItem, { color: colors.text }]}>• Số điện thoại</ThemedText>
                            <ThemedText style={[styles.listItem, { color: colors.text }]}>• Thông tin đăng nhập (tên người dùng, mật khẩu)</ThemedText>
                        </View>
                        <ThemedText style={[styles.sectionContent, { color: colors.text, marginTop: 12 }]}>
                            Chúng tôi chỉ thu thập thông tin cá nhân khi bạn tự nguyện cung cấp.
                        </ThemedText>
                    </View>

                    <View style={styles.sectionBlock}>
                        <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>2. Sử dụng thông tin cá nhân</ThemedText>
                        <ThemedText style={[styles.sectionContent, { color: colors.text }]}>
                            Thông tin cá nhân được thu thập sẽ được sử dụng cho các mục đích sau:
                        </ThemedText>
                        <View style={styles.listContainer}>
                            <ThemedText style={[styles.listItem, { color: colors.text }]}>• Cung cấp và quản lý dịch vụ</ThemedText>
                            <ThemedText style={[styles.listItem, { color: colors.text }]}>• Xử lý các yêu cầu, thắc mắc từ bạn</ThemedText>
                            <ThemedText style={[styles.listItem, { color: colors.text }]}>• Cải thiện chất lượng dịch vụ</ThemedText>
                            <ThemedText style={[styles.listItem, { color: colors.text }]}>• Gửi thông báo về các cập nhật hoặc thay đổi liên quan đến dịch vụ</ThemedText>
                        </View>
                    </View>

                    <View style={styles.sectionBlock}>
                        <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>3. Bảo mật thông tin</ThemedText>
                        <ThemedText style={[styles.sectionContent, { color: colors.text }]}>
                            Chúng tôi cam kết bảo mật thông tin cá nhân của bạn bằng các biện pháp an ninh phù hợp.
                        </ThemedText>
                        <ThemedText style={[styles.sectionContent, { color: colors.text }]}>
                            Tuy nhiên, không có phương thức truyền tải nào qua Internet hoặc phương thức lưu trữ điện tử nào là an toàn tuyệt đối, do đó chúng tôi không
                            thể đảm bảo an toàn tuyệt đối cho thông tin của bạn.
                        </ThemedText>
                    </View>

                    <View style={styles.sectionBlock}>
                        <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>4. Chia sẻ thông tin với bên thứ ba</ThemedText>
                        <ThemedText style={[styles.sectionContent, { color: colors.text }]}>
                            Chúng tôi không bán, trao đổi hoặc cho thuê thông tin cá nhân của bạn cho bên thứ ba.
                        </ThemedText>
                        <ThemedText style={[styles.sectionContent, { color: colors.text }]}>Thông tin của bạn chỉ được chia sẻ trong các trường hợp sau:</ThemedText>
                        <View style={styles.listContainer}>
                            <ThemedText style={[styles.listItem, { color: colors.text }]}>• Khi có sự đồng ý của bạn</ThemedText>
                            <ThemedText style={[styles.listItem, { color: colors.text }]}>• Khi cần thiết để cung cấp dịch vụ hoặc thực hiện yêu cầu của bạn</ThemedText>
                            <ThemedText style={[styles.listItem, { color: colors.text }]}>• Khi pháp luật yêu cầu</ThemedText>
                        </View>
                    </View>

                    <View style={styles.sectionBlock}>
                        <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>5. Quyền của bạn</ThemedText>
                        <ThemedText style={[styles.sectionContent, { color: colors.text }]}>
                            Bạn có quyền truy cập, chỉnh sửa hoặc yêu cầu xóa thông tin cá nhân của mình.
                        </ThemedText>
                        <ThemedText style={[styles.sectionContent, { color: colors.text }]}>
                            Để thực hiện các quyền này, vui lòng liên hệ với chúng tôi qua thông tin liên hệ được cung cấp trên trang web.
                        </ThemedText>
                    </View>

                    <View style={styles.sectionBlock}>
                        <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>6. Thay đổi chính sách bảo mật</ThemedText>
                        <ThemedText style={[styles.sectionContent, { color: colors.text }]}>
                            Chúng tôi có thể cập nhật chính sách bảo mật này theo thời gian. Mọi thay đổi sẽ được thông báo trên trang web của chúng tôi.
                        </ThemedText>
                        <ThemedText style={[styles.sectionContent, { color: colors.text }]}>
                            Việc tiếp tục sử dụng dịch vụ sau khi có thay đổi đồng nghĩa với việc bạn chấp nhận các thay đổi đó.
                        </ThemedText>
                        <ThemedText style={[styles.sectionContent, { color: colors.text }]}>
                            Nếu bạn có bất kỳ câu hỏi hoặc thắc mắc nào về chính sách bảo mật này, xin vui lòng liên hệ với chúng tôi qua thông tin liên hệ trên trang
                            web.
                        </ThemedText>
                    </View>
                </View>
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingBottom: 20,
        paddingHorizontal: 24,
    },
    headerContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
    },
    headerTextContainer: {
        flex: 1,
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "white",
        textAlign: "center",
    },
    placeholderButton: {
        width: 40,
        height: 40,
    },
    content: {
        flex: 1,
    },
    section: {
        padding: 24,
    },
    updateDate: {
        fontSize: 12,
        marginBottom: 24,
        textAlign: "center",
    },
    sectionBlock: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 12,
    },
    sectionContent: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 8,
    },
    listContainer: {
        marginTop: 8,
        gap: 8,
    },
    listItem: {
        fontSize: 14,
        lineHeight: 20,
        paddingLeft: 8,
    },
});
