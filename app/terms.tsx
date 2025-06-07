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

export default function TermsScreen() {
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
                        <ThemedText style={styles.headerTitle}>Điều khoản sử dụng</ThemedText>
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
                        <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>1. ĐĂNG KÝ</ThemedText>
                        <ThemedText style={[styles.sectionContent, { color: colors.text }]}>
                            Để sử dụng dịch vụ, bạn phải tạo một tài khoản theo yêu cầu của hệ thống. Bạn cam kết rằng việc sử dụng tài khoản phải tuân thủ các quy định
                            của chúng tôi. Đồng thời, tất cả các thông tin bạn cung cấp phải đúng, chính xác và đầy đủ tại thời điểm đăng ký.
                        </ThemedText>
                    </View>

                    <View style={styles.sectionBlock}>
                        <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>2. QUYỀN TRUY CẬP VÀ THU THẬP THÔNG TIN</ThemedText>
                        <ThemedText style={[styles.sectionContent, { color: colors.text }]}>
                            Khi sử dụng hệ thống, bạn thừa nhận rằng chúng tôi có quyền thu thập các thông tin sau:
                        </ThemedText>
                        <View style={styles.listContainer}>
                            <ThemedText style={[styles.listItem, { color: colors.text }]}>
                                • <ThemedText style={styles.bold}>Thông tin cá nhân</ThemedText>: Họ tên, số điện thoại, email, ảnh đại diện...
                            </ThemedText>
                            <ThemedText style={[styles.listItem, { color: colors.text }]}>
                                • <ThemedText style={styles.bold}>Thông tin nghề nghiệp</ThemedText>: Kinh nghiệm làm việc, sở thích, kỹ năng, định hướng nghề nghiệp,
                                CV...
                            </ThemedText>
                            <ThemedText style={[styles.listItem, { color: colors.text }]}>
                                • <ThemedText style={styles.bold}>Dữ liệu tương tác</ThemedText>: Hành vi sử dụng hệ thống nhằm cải thiện trải nghiệm người dùng.
                            </ThemedText>
                        </View>
                    </View>

                    <View style={styles.sectionBlock}>
                        <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>3. TUYÊN BỐ MIỄN TRỪ TRÁCH NHIỆM</ThemedText>
                        <ThemedText style={[styles.sectionContent, { color: colors.text }]}>
                            Chúng tôi không cam kết rằng dịch vụ sẽ không bị lỗi hoặc gián đoạn. Chúng tôi không đảm bảo rằng dịch vụ không chứa các yếu tố độc hại như
                            virus, mã độc...
                        </ThemedText>
                    </View>

                    <View style={styles.sectionBlock}>
                        <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>4. GIỚI HẠN TRÁCH NHIỆM PHÁP LÝ</ThemedText>
                        <ThemedText style={[styles.sectionContent, { color: colors.text }]}>
                            Chúng tôi không chịu trách nhiệm về bất kỳ tổn thất, thiệt hại nào phát sinh từ:
                        </ThemedText>
                        <View style={styles.listContainer}>
                            <ThemedText style={[styles.listItem, { color: colors.text }]}>• Việc bạn sử dụng hoặc không thể sử dụng dịch vụ.</ThemedText>
                            <ThemedText style={[styles.listItem, { color: colors.text }]}>• Mọi lỗi kỹ thuật, gián đoạn hoặc sự cố hệ thống.</ThemedText>
                            <ThemedText style={[styles.listItem, { color: colors.text }]}>• Việc xử lý dữ liệu cá nhân của bạn bởi bên thứ ba.</ThemedText>
                            <ThemedText style={[styles.listItem, { color: colors.text }]}>• Mọi thiệt hại liên quan đến thiết bị cá nhân của bạn.</ThemedText>
                        </View>
                    </View>

                    <View style={styles.sectionBlock}>
                        <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>5. THAY ĐỔI ĐIỀU KHOẢN</ThemedText>
                        <ThemedText style={[styles.sectionContent, { color: colors.text }]}>
                            Chúng tôi có quyền thay đổi, cập nhật điều khoản sử dụng bất cứ lúc nào. Những thay đổi sẽ có hiệu lực ngay sau khi được công bố. Bạn có trách
                            nhiệm theo dõi và cập nhật điều khoản mới nhất.
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
    bold: {
        fontWeight: "bold",
    },
});
