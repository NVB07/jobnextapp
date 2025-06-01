import React, { useState, useEffect } from "react";
import { StyleSheet, ScrollView, View, StatusBar, Alert, TouchableOpacity, Modal, ActivityIndicator, Linking, Dimensions, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/contexts/AuthContext";
import { apiService, UserData } from "@/services/api";

const { width } = Dimensions.get("window");

export default function CVAnalysisScreen() {
    const colorScheme = useColorScheme();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    const [showCVModal, setShowCVModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const tachNoiDungMarkdown = (md: string) => {
        const parts = md.split(/\*\*LƯU Ý:\*\*/);
        if (parts.length < 2) return { error: "Không tìm thấy phần III. LƯU Ý" };

        const [beforeLuuY, luuY] = parts;
        const [danhGia, deXuat] = beforeLuuY.split(/\*\*ĐỀ XUẤT CHỈNH SỬA CHI TIẾT:\*\*/);

        if (!danhGia || !deXuat) return { error: "Không tìm thấy phần I hoặc II" };

        return {
            danhGiaChung: danhGia.trim(),
            deXuatChinhSua: deXuat.trim(),
            luuY: luuY.trim(),
        };
    };

    const fetchUserData = async () => {
        if (!user?.uid) return;

        setError(null);
        setLoading(true);

        try {
            console.log(`🔄 Fetching user data for uid: ${user.uid}`);
            const data = await apiService.getUserData(user.uid);

            if (data) {
                console.log("✅ User data loaded successfully");
                setUserData(data);
            } else {
                console.log("⚠️ No user data found");
                setUserData(null);
            }
        } catch (error) {
            console.error("❌ Error fetching user data:", error);
            setError("Không thể tải dữ liệu người dùng. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    // Helper function to get Vietnamese field names
    const getVietnameseFieldName = (key: string): string => {
        const fieldNames: { [key: string]: string } = {
            Name: "Họ tên",
            DOB: "Ngày sinh",
            Phone_Number: "Số điện thoại",
            Address: "Địa chỉ",
            Email: "Email",
            LinkedInPortfolio: "LinkedIn/Portfolio",
            Career_objective: "Mục tiêu nghề nghiệp",
            University: "Trường đại học",
            Major: "Chuyên ngành",
            GPA: "GPA",
            Graduated_year: "Năm tốt nghiệp",
            Job_position: "Vị trí công việc",
            Years_of_experience: "Số năm kinh nghiệm",
            Achievements_awards: "Thành tích & Giải thưởng",
            Extracurricular_activities: "Hoạt động ngoại khóa",
            Interests: "Sở thích",
            Rank: "Cấp bậc",
            Industry: "Ngành nghề",
            Work_Experience: "Kinh nghiệm làm việc",
            Projects: "Dự án",
            Skills: "Kỹ năng",
            References: "Người tham khảo",
        };

        return fieldNames[key] || key;
    };

    useEffect(() => {
        fetchUserData();
    }, [user]);

    const renderHeader = () => (
        <LinearGradient colors={["#4F46E5", "#7C3AED", "#9333EA"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.header, { paddingTop: insets.top + 20 }]}>
            <Text style={[styles.headerTitle, { color: Colors[colorScheme ?? "light"].background }]}>📊 Phân tích CV</Text>
            <Text style={styles.headerSubtitle}>Phân tích chi tiết CV của bạn với AI thông minh</Text>
        </LinearGradient>
    );

    if (!user) {
        return (
            <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? "light"].background }]}>
                <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} />

                {renderHeader()}

                <View style={styles.loginPrompt}>
                    <Ionicons name="person-circle-outline" size={80} color="#9CA3AF" />
                    <Text style={[styles.promptTitle, { color: Colors[colorScheme ?? "light"].text }]}>Vui lòng đăng nhập</Text>
                    <Text style={[styles.promptSubtitle, { color: Colors[colorScheme ?? "light"].text }]}>Bạn cần đăng nhập để xem thông tin phân tích CV của mình</Text>
                    <TouchableOpacity style={[styles.loginButton, { backgroundColor: Colors[colorScheme ?? "light"].tint }]} onPress={() => router.push("/login")}>
                        <Text style={styles.loginButtonText}>Đăng nhập ngay</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const renderOverviewCard = () => {
        if (!userData?.userData?.recommend) return null;

        const content = tachNoiDungMarkdown(userData.userData.recommend);

        // Type guard to check if content has the expected structure
        if ("error" in content) {
            return null;
        }

        return (
            <View style={[styles.card, { backgroundColor: Colors[colorScheme ?? "light"].background }]}>
                <LinearGradient colors={["#059669", "#10B981"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>📈 Tổng quan đánh giá</Text>
                    <Ionicons name="analytics" size={20} color="white" style={styles.cardIcon} />
                </LinearGradient>

                <View style={[styles.cardContent, { backgroundColor: Colors[colorScheme ?? "light"].background }]}>
                    {content.danhGiaChung && (
                        <View style={styles.section}>
                            <View style={styles.recommendationContainer}>
                                <Text style={[styles.generalText, { color: Colors[colorScheme ?? "light"].text }]}>{content.danhGiaChung}</Text>
                            </View>
                        </View>
                    )}

                    {content.deXuatChinhSua && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: "#059669" }]}>✅ Đề xuất</Text>
                            <View style={styles.listContainer}>
                                {content.deXuatChinhSua
                                    .split("- ")
                                    .filter((item: string) => item.trim())
                                    .map((strength: string, index: number) => (
                                        <View key={index} style={styles.listItem}>
                                            <Text style={[styles.listText, { color: Colors[colorScheme ?? "light"].text }]}>• {strength.trim()}</Text>
                                        </View>
                                    ))}
                            </View>
                        </View>
                    )}

                    {content.luuY && (
                        <View style={[styles.section, styles.sectionWithBorder]}>
                            <Text style={[styles.sectionTitle, { color: "#DC2626" }]}>🎯 Gợi ý cải thiện</Text>
                            <View style={styles.listContainer}>
                                {content.luuY
                                    .split("- ")
                                    .filter((item: string) => item.trim())
                                    .map((rec: string, index: number) => (
                                        <View key={index} style={styles.listItem}>
                                            <Text style={[styles.listText, { color: Colors[colorScheme ?? "light"].text }]}>• {rec.trim()}</Text>
                                        </View>
                                    ))}
                            </View>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    const renderCVInfoCard = () => {
        const profile = userData?.userData?.profile;
        const pdfUrl = userData?.userData?.PDF_CV_URL;

        return (
            <View style={[styles.card, { backgroundColor: Colors[colorScheme ?? "light"].background }]}>
                <LinearGradient colors={["#2563EB", "#3B82F6"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>📄 Thông tin CV</Text>
                    <Ionicons name="document-text" size={20} color="white" style={styles.cardIcon} />
                </LinearGradient>

                <View style={[styles.cardContent, { backgroundColor: Colors[colorScheme ?? "light"].background }]}>
                    <View style={styles.section}>
                        <View style={styles.infoItem}>
                            <Ionicons name="calendar" size={16} color="#6B7280" />
                            <Text style={[styles.infoText, { color: Colors[colorScheme ?? "light"].text }]}>
                                Cập nhật lần cuối: {new Date(userData?.updatedAt || "").toLocaleDateString("vi-VN")}
                            </Text>
                        </View>

                        {profile?.Job_position && (
                            <View style={styles.infoItem}>
                                <Ionicons name="briefcase" size={16} color="#6B7280" />
                                <Text style={[styles.infoText, { color: Colors[colorScheme ?? "light"].text }]}>Vị trí: {profile.Job_position}</Text>
                            </View>
                        )}

                        {profile?.Years_of_experience && (
                            <View style={styles.infoItem}>
                                <Ionicons name="time" size={16} color="#6B7280" />
                                <Text style={[styles.infoText, { color: Colors[colorScheme ?? "light"].text }]}>Kinh nghiệm: {profile.Years_of_experience}</Text>
                            </View>
                        )}
                    </View>

                    <View style={[styles.section, styles.sectionWithBorder]}>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: pdfUrl ? "#059669" : "#9CA3AF" }]}
                            onPress={() => setShowCVModal(true)}
                            disabled={!pdfUrl}
                        >
                            <Ionicons name="eye" size={18} color="white" />
                            <Text style={[styles.actionButtonText, { color: "white" }]}>{pdfUrl ? "Xem CV" : "Chưa có CV"}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: profile ? "#2563EB" : "#9CA3AF" }]}
                            onPress={() => setShowProfileModal(true)}
                            disabled={!profile}
                        >
                            <Ionicons name="person" size={18} color="white" />
                            <Text style={[styles.actionButtonText, { color: "white" }]}>{profile ? "Xem thông tin" : "Chưa có thông tin"}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? "light"].background }]}>
                <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} />

                {renderHeader()}

                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].tint} />
                    <Text style={[styles.loadingText, { color: Colors[colorScheme ?? "light"].text }]}>Đang tải thông tin CV...</Text>
                </View>
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? "light"].background }]}>
                <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} />

                {renderHeader()}

                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={80} color="#DC2626" />
                    <Text style={[styles.errorTitle, { color: Colors[colorScheme ?? "light"].text }]}>Lỗi tải dữ liệu</Text>
                    <Text style={[styles.errorMessage, { color: Colors[colorScheme ?? "light"].text }]}>{error}</Text>
                    <TouchableOpacity style={[styles.retryButton, { backgroundColor: Colors[colorScheme ?? "light"].tint }]} onPress={fetchUserData}>
                        <Ionicons name="refresh" size={20} color="white" />
                        <Text style={styles.retryButtonText}>Thử lại</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    if (!userData?.userData?.recommend && !userData?.userData?.profile) {
        return (
            <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? "light"].background }]}>
                <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} />

                {renderHeader()}

                <View style={styles.noDataContainer}>
                    <Ionicons name="document-outline" size={80} color="#9CA3AF" />
                    <Text style={[styles.noDataTitle, { color: Colors[colorScheme ?? "light"].text }]}>Chưa có CV được phân tích</Text>
                    <Text style={[styles.noDataSubtitle, { color: Colors[colorScheme ?? "light"].text }]}>
                        Vui lòng tải lên CV để hệ thống có thể phân tích và đưa ra gợi ý cải thiện
                    </Text>
                    <TouchableOpacity
                        style={[styles.uploadButton, { backgroundColor: Colors[colorScheme ?? "light"].tint }]}
                        onPress={() => {
                            Alert.alert("Tính năng đang phát triển", "Tính năng tải CV sẽ sớm có mặt!");
                        }}
                    >
                        <Ionicons name="cloud-upload" size={20} color="white" />
                        <Text style={styles.uploadButtonText}>Tạo CV mới</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? "light"].background }]}>
            <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} />

            {renderHeader()}

            <ScrollView style={styles.content} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 60 }]} showsVerticalScrollIndicator={false}>
                {renderOverviewCard()}
                {renderCVInfoCard()}
            </ScrollView>

            {/* CV Modal */}
            <Modal visible={showCVModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCVModal(false)}>
                <View style={[styles.modalContainer, { backgroundColor: Colors[colorScheme ?? "light"].background }]}>
                    <View style={[styles.modalContent, { backgroundColor: Colors[colorScheme ?? "light"].background }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: Colors[colorScheme ?? "light"].border }]}>
                            <Text style={[styles.modalTitle, { color: Colors[colorScheme ?? "light"].text }]}>Xem CV</Text>
                            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowCVModal(false)}>
                                <Ionicons name="close" size={24} color={Colors[colorScheme ?? "light"].text} />
                            </TouchableOpacity>
                        </View>

                        {userData?.userData?.PDF_CV_URL && (
                            <>
                                <Text style={[styles.modalNote, { color: Colors[colorScheme ?? "light"].text }]}>
                                    💡 CV sẽ được mở trong trình duyệt để có trải nghiệm xem tốt nhất
                                </Text>

                                <View style={styles.modalBody}>
                                    <TouchableOpacity
                                        style={[styles.openCVButton, { backgroundColor: "#059669" }]}
                                        onPress={() => {
                                            const pdfUrl = userData?.userData?.PDF_CV_URL;
                                            if (pdfUrl) {
                                                Linking.openURL(pdfUrl);
                                                setShowCVModal(false);
                                            }
                                        }}
                                    >
                                        <Ionicons name="open" size={20} color="white" />
                                        <Text style={styles.openCVButtonText}>Mở CV trong trình duyệt</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Profile Modal */}
            <Modal visible={showProfileModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowProfileModal(false)}>
                <View style={[styles.modalContainer, { backgroundColor: Colors[colorScheme ?? "light"].background }]}>
                    <View style={[styles.modalContent, { backgroundColor: Colors[colorScheme ?? "light"].background }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: Colors[colorScheme ?? "light"].border }]}>
                            <Text style={[styles.modalTitle, { color: Colors[colorScheme ?? "light"].text }]}>Thông tin cá nhân</Text>
                            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowProfileModal(false)}>
                                <Ionicons name="close" size={24} color={Colors[colorScheme ?? "light"].text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                            {userData?.userData?.profile ? (
                                <View style={[styles.profileContainer, { borderColor: Colors[colorScheme ?? "light"].border }]}>
                                    {Object.entries(userData.userData.profile)
                                        .filter(([_, value]) => value && value.toString().trim() !== "")
                                        .map(([key, value]) => (
                                            <View key={key} style={[styles.profileItem, { borderBottomColor: Colors[colorScheme ?? "light"].border }]}>
                                                <Text style={[styles.profileLabel, { color: "#6B7280" }]}>{getVietnameseFieldName(key)}</Text>
                                                <Text style={[styles.profileValue, { color: Colors[colorScheme ?? "light"].text }]}>{value?.toString()}</Text>
                                            </View>
                                        ))}
                                </View>
                            ) : (
                                <View style={styles.noProfileData}>
                                    <Ionicons name="person-circle-outline" size={64} color="#9CA3AF" />
                                    <Text style={[styles.noDataTitle, { color: Colors[colorScheme ?? "light"].text }]}>Chưa có thông tin cá nhân</Text>
                                    <Text style={[styles.noDataSubtitle, { color: Colors[colorScheme ?? "light"].text }]}>
                                        Dữ liệu thông tin cá nhân sẽ được hiển thị khi bạn tải lên CV
                                    </Text>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        alignItems: "center",
    },
    headerTitle: {
        paddingTop: 8,
        fontSize: 24,
        fontWeight: "bold",
        color: "white",
        marginBottom: 6,
    },
    headerSubtitle: {
        fontSize: 14,
        color: "rgba(255,255,255,0.85)",
        textAlign: "center",
        maxWidth: width * 0.8,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        gap: 16,
    },
    card: {
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
        overflow: "hidden",
    },
    cardHeader: {
        padding: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "white",
        flex: 1,
    },
    cardIcon: {
        marginLeft: 8,
    },
    cardContent: {
        padding: 16,
        gap: 14,
    },
    section: {
        gap: 10,
    },
    sectionWithBorder: {
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: "rgba(0,0,0,0.08)",
        marginTop: 14,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: "700",
        marginBottom: 6,
        letterSpacing: 0.2,
    },
    listContainer: {
        gap: 6,
    },
    listItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
        paddingVertical: 2,
        paddingHorizontal: 8,
        backgroundColor: "rgba(0,0,0,0.02)",
        borderRadius: 8,
        marginVertical: 1,
    },
    listText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
        paddingVertical: 4,
    },
    generalText: {
        fontSize: 14,
        lineHeight: 20,
        textAlign: "left",
    },
    actionButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 14,
        borderRadius: 10,
        gap: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: "600",
        letterSpacing: 0.3,
    },
    infoItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 6,
        paddingHorizontal: 8,
        backgroundColor: "rgba(0,0,0,0.02)",
        borderRadius: 8,
    },
    infoText: {
        fontSize: 13,
        flex: 1,
        lineHeight: 18,
    },
    recommendationContainer: {
        padding: 14,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.06)",
        backgroundColor: "rgba(0,0,0,0.01)",
    },
    loginPrompt: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 32,
        gap: 20,
    },
    promptTitle: {
        fontSize: 22,
        fontWeight: "bold",
        textAlign: "center",
        lineHeight: 28,
    },
    promptSubtitle: {
        fontSize: 15,
        textAlign: "center",
        lineHeight: 22,
        maxWidth: width * 0.85,
    },
    loginButton: {
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 10,
        marginTop: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 4,
    },
    loginButtonText: {
        color: "white",
        fontSize: 15,
        fontWeight: "700",
        letterSpacing: 0.3,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 18,
        padding: 32,
    },
    loadingText: {
        fontSize: 15,
        fontWeight: "600",
        textAlign: "center",
    },
    noDataContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 32,
        gap: 20,
    },
    noDataTitle: {
        fontSize: 20,
        fontWeight: "bold",
        textAlign: "center",
        lineHeight: 26,
    },
    noDataSubtitle: {
        fontSize: 14,
        textAlign: "center",
        lineHeight: 20,
        maxWidth: width * 0.8,
    },
    uploadButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10,
        gap: 8,
        marginTop: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 4,
    },
    uploadButtonText: {
        color: "white",
        fontSize: 14,
        fontWeight: "700",
        letterSpacing: 0.3,
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 32,
        gap: 18,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: "bold",
        textAlign: "center",
        lineHeight: 26,
    },
    errorMessage: {
        fontSize: 14,
        textAlign: "center",
        lineHeight: 20,
        maxWidth: width * 0.8,
    },
    retryButton: {
        flexDirection: "row",
        alignItems: "center",
        padding: 14,
        borderRadius: 10,
        gap: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 4,
    },
    retryButtonText: {
        color: "white",
        fontSize: 14,
        fontWeight: "700",
        letterSpacing: 0.3,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalContent: {
        flex: 1,
        marginTop: 60,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: "hidden",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.08)",
        backgroundColor: "rgba(0,0,0,0.02)",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
    },
    modalCloseButton: {
        padding: 4,
        borderRadius: 6,
    },
    modalNote: {
        fontSize: 13,
        paddingHorizontal: 20,
        paddingVertical: 12,
        fontStyle: "italic",
        backgroundColor: "rgba(255,193,7,0.1)",
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.06)",
    },
    modalBody: {
        flex: 1,
        padding: 20,
    },
    openCVButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        borderRadius: 12,
        gap: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 4,
    },
    openCVButtonText: {
        color: "white",
        fontSize: 15,
        fontWeight: "700",
        letterSpacing: 0.3,
    },
    profileContainer: {
        gap: 0,
    },
    profileItem: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        gap: 6,
        backgroundColor: "rgba(0,0,0,0.01)",
    },
    profileLabel: {
        fontSize: 12,
        fontWeight: "600",
        letterSpacing: 0.5,
        textTransform: "uppercase",
    },
    profileValue: {
        fontSize: 15,
        lineHeight: 20,
    },
    noProfileData: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 20,
        paddingVertical: 60,
    },
});
