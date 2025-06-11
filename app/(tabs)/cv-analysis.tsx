import React, { useState, useEffect, useMemo } from "react";
import {
    StyleSheet,
    ScrollView,
    View,
    StatusBar,
    Alert,
    TouchableOpacity,
    Modal,
    ActivityIndicator,
    Linking,
    Dimensions,
    Text,
    Image,
    RefreshControl,
} from "react-native";
import { WebView } from "react-native-webview";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Markdown from "react-native-markdown-display";
import { useFocusEffect } from "@react-navigation/native";

import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/contexts/AuthContext";
import { apiService, UserData } from "@/services/api";

const { width } = Dimensions.get("window");

export default function CVAnalysisScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    const [showCVModal, setShowCVModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const tachNoiDungMarkdown = (md: any) => {
        console.log("📝 Parsing recommend data...");

        if (!md) {
            return { error: "Dữ liệu không hợp lệ hoặc rỗng" };
        }

        try {
            // Check if data is already in object format (new format)
            if (typeof md === "object") {
                console.log("✅ Found object format data");
                return {
                    danhGiaUuDiem: md.DanhGia?.UuDiem || "",
                    danhGiaNhuocDiem: md.DanhGia?.NhuocDiem || "",
                    canChinhSuaChiTiet: md.CanChinhSuaChiTiet || "",
                    canThem: md.CanThem || "",
                    luuY: md.LuuY || "",
                };
            }

            // Try to parse as JSON if it's a string
            if (typeof md === "string") {
                try {
                    const jsonData = JSON.parse(md);
                    console.log("✅ Parsed JSON data");
                    return {
                        danhGiaUuDiem: jsonData.DanhGia?.UuDiem || "",
                        danhGiaNhuocDiem: jsonData.DanhGia?.NhuocDiem || "",
                        canChinhSuaChiTiet: jsonData.CanChinhSuaChiTiet || "",
                        canThem: jsonData.CanThem || "",
                        luuY: jsonData.LuuY || "",
                    };
                } catch (jsonError) {
                    console.log("⚠️ Not valid JSON, trying markdown parsing...");
                }

                // Legacy format parsing (markdown)
                console.log("⚠️ Trying legacy markdown parsing");
                // Parse theo format từ Gemini AI prompt
                const sections = {
                    danhGiaUuDiem: "",
                    danhGiaNhuocDiem: "",
                    canChinhSuaChiTiet: "",
                    canThem: "",
                    luuY: "",
                };

                // Tìm section Ưu điểm
                const uuDiemMatch = md.match(/Ưu điểm:?([\s\S]*?)(?=Nhược điểm:|$)/i);
                if (uuDiemMatch) {
                    sections.danhGiaUuDiem = uuDiemMatch[1].trim();
                }

                // Tìm section Nhược điểm
                const nhuocDiemMatch = md.match(/Nhược điểm:?([\s\S]*?)(?=Cần chỉnh sửa chi tiết:|$)/i);
                if (nhuocDiemMatch) {
                    sections.danhGiaNhuocDiem = nhuocDiemMatch[1].trim();
                }

                // Tìm section Cần chỉnh sửa chi tiết
                const chinhSuaMatch = md.match(/Cần chỉnh sửa chi tiết:?([\s\S]*?)(?=Cần thêm:|$)/i);
                if (chinhSuaMatch) {
                    sections.canChinhSuaChiTiet = chinhSuaMatch[1].trim();
                }

                // Tìm section Cần thêm
                const canThemMatch = md.match(/Cần thêm:?([\s\S]*?)(?=Lưu ý:|$)/i);
                if (canThemMatch) {
                    sections.canThem = canThemMatch[1].trim();
                }

                // Tìm section Lưu ý
                const luuYMatch = md.match(/Lưu ý:?([\s\S]*?)$/i);
                if (luuYMatch) {
                    sections.luuY = luuYMatch[1].trim();
                }

                return sections;
            }

            // If we reach here, we don't know how to handle the data
            console.log("❌ Unknown data format:", typeof md);
            return {
                error: "Định dạng dữ liệu không được hỗ trợ",
                danhGiaUuDiem: "",
                danhGiaNhuocDiem: "",
                canChinhSuaChiTiet: "",
                canThem: "",
                luuY: "",
            };
        } catch (error) {
            console.log("❌ Error parsing content:", error);
            return {
                error: "Lỗi khi phân tích dữ liệu",
                danhGiaUuDiem: "",
                danhGiaNhuocDiem: "",
                canChinhSuaChiTiet: "",
                canThem: "",
                luuY: "",
            };
        }
    };

    // Function to refresh data without affecting the UI loading state
    const refreshData = async () => {
        if (!user?.uid) return;

        setRefreshing(true);
        setError(null);

        try {
            console.log(`🔄 Refreshing data for uid: ${user.uid}`);
            const data = await apiService.getUserData(user.uid);

            if (data) {
                console.log("✅ Data refreshed successfully");
                setUserData(data);
            } else {
                console.log("⚠️ No data found during refresh");
            }
        } catch (error) {
            console.log("❌ Error refreshing data:", error);
            // Don't show error UI on refresh failure
        } finally {
            setRefreshing(false);
        }
    };

    const fetchUserData = async () => {
        if (!user?.uid) return;

        // Only set loading to true on initial load, not during refresh
        if (!userData) {
            setLoading(true);
        }

        setRefreshing(true);
        setError(null);

        try {
            console.log(`🔄 Fetching user data for uid: ${user.uid}`);
            const data = await apiService.getUserData(user.uid);
            console.log("🔍 Data:", data);

            if (data) {
                console.log("✅ User data loaded successfully");
                console.log("📊 User data structure:", {
                    hasUserData: !!data.userData,
                    hasRecommend: !!data.userData?.recommend,
                    hasProfile: !!data.userData?.profile,
                    hasPdfUrl: !!data.userData?.PDF_CV_URL,
                    recommendLength: data.userData?.recommend ? (typeof data.userData.recommend === "string" ? data.userData.recommend.length : "object") : 0,
                    recommendPreview: data.userData?.recommend
                        ? typeof data.userData.recommend === "object"
                            ? (data.userData.recommend as any).DanhGia?.UuDiem?.substring(0, 100) || "No UuDiem data"
                            : data.userData.recommend.substring(0, 100)
                        : "No recommend data",
                });
                setUserData(data);
            } else {
                console.log("⚠️ No user data found");
                setUserData(null);
            }
        } catch (error) {
            console.log("❌ Error fetching user data:", error);
            setError("Không thể tải dữ liệu người dùng. Vui lòng thử lại.");
        } finally {
            setLoading(false);
            setRefreshing(false);
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

    // Helper function to format markdown text
    const formatMarkdownText = (text: string) => {
        if (!text) return "";

        // Replace markdown bullets with proper bullets
        let formattedText = text.replace(/^- /gm, "• ");
        formattedText = formattedText.replace(/^\* /gm, "• ");

        // Replace bold text
        formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, "$1");
        formattedText = formattedText.replace(/\*(.*?)\*/g, "$1");

        return formattedText;
    };

    // Custom image renderer to fix FitImage key prop error
    const customImageRenderer = (node: any, children: any, parent: any, styles: any) => {
        const { src, alt } = node.attributes;
        return (
            <Image
                key={node.key}
                source={{ uri: src }}
                style={{
                    width: "100%",
                    height: 180,
                    resizeMode: "cover" as const,
                    borderRadius: 8,
                    marginVertical: 8,
                }}
                alt={alt}
            />
        );
    };

    // Markdown styling
    const getMarkdownStyles = () => ({
        body: {
            fontSize: 14,
            lineHeight: 22,
            color: Colors[colorScheme ?? "light"].text,
        },
        paragraph: {
            fontSize: 14,
            lineHeight: 22,
            color: Colors[colorScheme ?? "light"].text,
            marginBottom: 10,
        },
        heading1: {
            fontSize: 20,
            fontWeight: "bold" as const,
            color: Colors[colorScheme ?? "light"].text,
            marginBottom: 12,
            marginTop: 16,
        },
        heading2: {
            fontSize: 18,
            fontWeight: "bold" as const,
            color: Colors[colorScheme ?? "light"].text,
            marginBottom: 10,
            marginTop: 14,
        },
        heading3: {
            fontSize: 16,
            fontWeight: "600" as const,
            color: Colors[colorScheme ?? "light"].text,
            marginBottom: 8,
            marginTop: 12,
        },
        strong: {
            fontWeight: "bold" as const,
            color: Colors[colorScheme ?? "light"].text,
        },
        em: {
            fontStyle: "italic" as const,
            color: Colors[colorScheme ?? "light"].text,
        },
        list_item: {
            fontSize: 14,
            lineHeight: 22,
            color: Colors[colorScheme ?? "light"].text,
            marginBottom: 4,
        },
        bullet_list: {
            marginBottom: 10,
        },
        ordered_list: {
            marginBottom: 10,
        },
        blockquote: {
            borderLeftWidth: 4,
            borderLeftColor: Colors[colorScheme ?? "light"].tint,
            paddingLeft: 12,
            backgroundColor: colorScheme === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
            paddingVertical: 6,
            marginVertical: 8,
            borderRadius: 4,
        },
        code_inline: {
            fontFamily: "monospace",
            backgroundColor: colorScheme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
            paddingHorizontal: 4,
            borderRadius: 3,
            color: colorScheme === "dark" ? Colors[colorScheme].text : Colors["light"].text,
        },
        code_block: {
            backgroundColor: colorScheme === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
            padding: 10,
            borderRadius: 4,
            fontFamily: "monospace",
            color: Colors[colorScheme ?? "light"].text,
        },
        fence: {
            backgroundColor: colorScheme === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
            padding: 10,
            borderRadius: 4,
            fontFamily: "monospace",
            color: Colors[colorScheme ?? "light"].text,
        },
        image: {
            borderRadius: 8,
            marginVertical: 8,
        },
        link: {
            color: Colors[colorScheme ?? "light"].tint,
            textDecorationLine: "underline" as "underline",
        },
        table: {
            borderWidth: 1,
            borderColor: colorScheme === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.1)",
            borderRadius: 4,
            marginVertical: 10,
        },
        thead: {
            backgroundColor: colorScheme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
        },
        th: {
            padding: 8,
            fontSize: 14,
            fontWeight: "bold",
            color: Colors[colorScheme ?? "light"].text,
        },
        td: {
            padding: 8,
            fontSize: 14,
            color: Colors[colorScheme ?? "light"].text,
        },
    });

    useEffect(() => {
        if (user?.uid) {
            fetchUserData();
        }
    }, [user]);

    // Auto refresh when screen comes into focus (e.g., when returning from profile screen after CV upload or profile update)
    useFocusEffect(
        React.useCallback(() => {
            if (user?.uid) {
                console.log("CV Analysis screen focused - refreshing data");
                refreshData();
            }
        }, [user?.uid])
    );

    const renderHeader = () => (
        <LinearGradient colors={colors.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.header, { paddingTop: insets.top }]}>
            <Text style={[styles.headerTitle]}> Phân tích CV</Text>
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
        console.log("🔍 Rendering overview card...");
        console.log("📊 userData:", {
            hasUserData: !!userData,
            hasUserDataField: !!userData?.userData,
            hasRecommend: !!userData?.userData?.recommend,
            recommendType: userData?.userData?.recommend ? typeof userData.userData.recommend : "none",
            recommendData: userData?.userData?.recommend ? "Present" : "Missing",
        });

        if (userData?.userData?.recommend) {
            console.log("🔍 Recommend structure:", typeof userData.userData.recommend === "object" ? Object.keys(userData.userData.recommend) : "string data");
        }

        if (!userData?.userData?.recommend) {
            console.log("❌ No recommend data found, returning null");
            return null;
        }

        console.log("🔄 Parsing recommend content...");
        const content = tachNoiDungMarkdown(userData.userData.recommend);

        // Type guard to check if content has the expected structure
        if ("error" in content) {
            console.log("❌ Error parsing content:", content.error);
            // Show raw data for debugging
            return (
                <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <LinearGradient colors={["#DC2626", "#EF4444"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>⚠️ Lỗi phân tích dữ liệu</Text>
                        <Ionicons name="warning" size={20} color="white" style={styles.cardIcon} />
                    </LinearGradient>

                    <View style={[styles.cardContent, { backgroundColor: colors.background }]}>
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: "#DC2626" }]}>🚫 Thông báo lỗi</Text>
                            <Text style={[styles.generalText, { color: colors.text }]}>{content.error}</Text>
                        </View>
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: "#059669" }]}>📄 Dữ liệu gốc (500 ký tự đầu)</Text>
                            <View
                                style={[
                                    styles.recommendationContainer,
                                    {
                                        borderColor: colorScheme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.06)",
                                        backgroundColor: colorScheme === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.01)",
                                    },
                                ]}
                            >
                                <Text style={[styles.generalText, { color: colors.text }]}>
                                    {typeof userData.userData.recommend === "string"
                                        ? userData.userData.recommend.substring(0, 500) + "..."
                                        : JSON.stringify(userData.userData.recommend).substring(0, 500) + "..."}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            );
        }

        console.log("✅ Successfully parsed content, rendering card");

        return (
            <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <LinearGradient colors={["#8B5CF6", "#7C3AED"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Tổng quan CV của bạn</Text>
                </LinearGradient>

                <View style={[styles.cardContent, { backgroundColor: colors.background }]}>
                    <View style={styles.section}>
                        {/* Section: Ưu điểm */}
                        {content.danhGiaUuDiem && (
                            <View style={styles.subsection}>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>Ưu điểm:</Text>

                                <Markdown
                                    style={getMarkdownStyles()}
                                    rules={{
                                        image: customImageRenderer,
                                    }}
                                >
                                    {content.danhGiaUuDiem}
                                </Markdown>
                            </View>
                        )}

                        {/* Section: Nhược điểm */}
                        {content.danhGiaNhuocDiem && (
                            <View style={[styles.subsection, { marginTop: 16 }]}>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>Nhược điểm:</Text>

                                <Markdown
                                    style={getMarkdownStyles()}
                                    rules={{
                                        image: customImageRenderer,
                                    }}
                                >
                                    {content.danhGiaNhuocDiem}
                                </Markdown>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    const renderCVInfoCard = () => {
        const profile = userData?.userData?.profile;
        const pdfUrl = userData?.userData?.PDF_CV_URL;

        const formatToVNTime = (isoString: string) => {
            try {
                const date = new Date(isoString);
                const day = String(date.getDate()).padStart(2, "0");
                const month = String(date.getMonth() + 1).padStart(2, "0");
                const year = date.getFullYear();
                const hours = String(date.getHours()).padStart(2, "0");
                const minutes = String(date.getMinutes()).padStart(2, "0");
                return `${day}/${month}/${year} ${hours}:${minutes}`;
            } catch (error) {
                return "Không xác định";
            }
        };

        return (
            <View style={[styles.actionsContainer]}>
                {/* Actions Card */}
                <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <LinearGradient colors={["#3B82F6", "#2563EB"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Hành động</Text>
                    </LinearGradient>

                    <View style={[styles.cardContent, { backgroundColor: colors.background }]}>
                        <View style={styles.section}>
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: pdfUrl ? "#6366F1" : "#9CA3AF" }]}
                                onPress={() => setShowCVModal(true)}
                                disabled={!pdfUrl}
                            >
                                <Ionicons name="document-text" size={18} color="white" />
                                <Text style={[styles.actionButtonText, { color: "white" }]}>Xem CV</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: profile ? "#6366F1" : "#9CA3AF", marginTop: 10 }]}
                                onPress={() => setShowProfileModal(true)}
                                disabled={!profile}
                            >
                                <Ionicons name="information-circle" size={18} color="white" />
                                <Text style={[styles.actionButtonText, { color: "white" }]}>Xem thông tin</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: "#8B5CF6", marginTop: 10 }]}
                                onPress={() => {
                                    router.push("/(tabs)/profile");
                                }}
                            >
                                <Ionicons name="create" size={18} color="white" />
                                <Text style={[styles.actionButtonText, { color: "white" }]}>Cập nhật CV</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Info Card */}
                <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border, marginTop: 16 }]}>
                    <LinearGradient colors={["#F59E0B", "#D97706"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Thông tin CV</Text>
                    </LinearGradient>

                    <View style={[styles.cardContent, { backgroundColor: colors.background }]}>
                        <View style={styles.section}>
                            <View
                                style={[
                                    styles.infoItem,
                                    {
                                        backgroundColor: colorScheme === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.02)",
                                    },
                                ]}
                            >
                                <Ionicons name="calendar" size={16} color="#F59E0B" />
                                <Text style={[styles.infoText, { color: colors.text }]}>Cập nhật: {formatToVNTime(userData?.updatedAt || "")}</Text>
                            </View>

                            {profile?.Job_position && (
                                <View
                                    style={[
                                        styles.infoItem,
                                        {
                                            backgroundColor: colorScheme === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.02)",
                                        },
                                    ]}
                                >
                                    <Ionicons name="briefcase" size={16} color="#F59E0B" />
                                    <Text style={[styles.infoText, { color: colors.text }]}>Vị trí: {profile.Job_position}</Text>
                                </View>
                            )}

                            {profile?.Years_of_experience && (
                                <View
                                    style={[
                                        styles.infoItem,
                                        {
                                            backgroundColor: colorScheme === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.02)",
                                        },
                                    ]}
                                >
                                    <Ionicons name="school" size={16} color="#F59E0B" />
                                    <Text style={[styles.infoText, { color: colors.text }]}>Kinh nghiệm: {profile.Years_of_experience}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    const renderSuggestionsCard = () => {
        if (!userData?.userData?.recommend) {
            return null;
        }

        const content = tachNoiDungMarkdown(userData.userData.recommend);

        // If there's an error or no suggestions data
        if ("error" in content || (!content.canChinhSuaChiTiet && !content.canThem && !content.luuY)) {
            return null;
        }

        return (
            <View style={[styles.card, { backgroundColor: Colors[colorScheme ?? "light"].background, borderColor: Colors[colorScheme ?? "light"].border }]}>
                <LinearGradient colors={["#10B981", "#059669"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Đề xuất chỉnh sửa CV</Text>
                </LinearGradient>

                <View
                    style={[
                        styles.suggestionContainer,
                        {
                            backgroundColor: colorScheme === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.01)",
                            borderColor: colorScheme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.06)",
                        },
                    ]}
                >
                    <View style={styles.section}>
                        {/* Phần cần chỉnh sửa chi tiết */}
                        {content.canChinhSuaChiTiet && (
                            <View style={styles.subsection}>
                                <Text style={[styles.sectionTitle, { color: "#059669" }]}>Cần chỉnh sửa chi tiết:</Text>

                                <Markdown
                                    style={getMarkdownStyles()}
                                    rules={{
                                        image: customImageRenderer,
                                    }}
                                >
                                    {content.canChinhSuaChiTiet}
                                </Markdown>
                            </View>
                        )}

                        {/* Phần cần thêm */}
                        {content.canThem && (
                            <View
                                style={[
                                    styles.subsection,
                                    styles.sectionWithBorder,
                                    { borderTopColor: colorScheme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)" },
                                ]}
                            >
                                <Text style={[styles.sectionTitle, { color: "#2563EB" }]}>Cần thêm:</Text>

                                <Markdown
                                    style={getMarkdownStyles()}
                                    rules={{
                                        image: customImageRenderer,
                                    }}
                                >
                                    {content.canThem}
                                </Markdown>
                            </View>
                        )}

                        {/* Phần lưu ý */}
                        {content.luuY && (
                            <View
                                style={[
                                    styles.subsection,
                                    styles.sectionWithBorder,
                                    { borderTopColor: colorScheme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)" },
                                ]}
                            >
                                <Text style={[styles.sectionTitle, { color: "#F59E0B" }]}>Lưu ý:</Text>

                                <Markdown
                                    style={getMarkdownStyles()}
                                    rules={{
                                        image: customImageRenderer,
                                    }}
                                >
                                    {content.luuY}
                                </Markdown>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    // Memoize the overview card to prevent unnecessary re-renders
    const memoizedOverviewCard = useMemo(() => {
        console.log("🔄 Memoizing overview card");
        return renderOverviewCard();
    }, [
        userData?.userData?.recommend
            ? typeof userData.userData.recommend === "object"
                ? JSON.stringify({
                      uuDiem: (userData.userData.recommend as any).DanhGia?.UuDiem,
                      nhuocDiem: (userData.userData.recommend as any).DanhGia?.NhuocDiem,
                  })
                : userData.userData.recommend
            : null,
    ]);

    // Memoize the CV info card to prevent unnecessary re-renders
    const memoizedCVInfoCard = useMemo(() => {
        console.log("🔄 Memoizing CV info card");
        return renderCVInfoCard();
    }, [userData?.userData?.profile?.Job_position, userData?.userData?.profile?.Years_of_experience, userData?.userData?.PDF_CV_URL, userData?.updatedAt]);

    // Memoize the suggestions card to prevent unnecessary re-renders
    const memoizedSuggestionsCard = useMemo(() => {
        console.log("🔄 Memoizing suggestions card");
        return renderSuggestionsCard();
    }, [
        userData?.userData?.recommend
            ? typeof userData.userData.recommend === "object"
                ? JSON.stringify({
                      canChinhSuaChiTiet: (userData.userData.recommend as any).CanChinhSuaChiTiet,
                      canThem: (userData.userData.recommend as any).CanThem,
                      luuY: (userData.userData.recommend as any).LuuY,
                  })
                : userData.userData.recommend
            : null,
    ]);

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
        console.log("❌ No CV data found - showing empty state");
        return (
            <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? "light"].background }]}>
                <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} />

                {renderHeader()}

                <View style={styles.noDataContainer}>
                    <Ionicons name="person-circle-outline" size={80} color="#9CA3AF" />
                    <Text style={[styles.noDataTitle, { color: Colors[colorScheme ?? "light"].text }]}>Chưa có thông tin cá nhân</Text>
                    <Text style={[styles.noDataSubtitle, { color: Colors[colorScheme ?? "light"].text }]}>
                        Để sử dụng tính năng phân tích CV, bạn cần cập nhật thông tin cá nhân trong phần hồ sơ. Hệ thống sẽ phân tích và đưa ra gợi ý cải thiện CV dựa
                        trên thông tin của bạn.
                    </Text>

                    <View style={styles.instructionContainer}>
                        <View style={styles.instructionStep}>
                            <View style={[styles.stepNumber, { backgroundColor: Colors[colorScheme ?? "light"].tint }]}>
                                <Text style={styles.stepNumberText}>1</Text>
                            </View>
                            <Text style={[styles.instructionText, { color: Colors[colorScheme ?? "light"].text }]}>
                                Truy cập trang <Text style={{ fontWeight: "bold", color: Colors[colorScheme ?? "light"].tint }}>Hồ sơ</Text>
                            </Text>
                        </View>

                        <View style={styles.instructionStep}>
                            <View style={[styles.stepNumber, { backgroundColor: Colors[colorScheme ?? "light"].tint }]}>
                                <Text style={styles.stepNumberText}>2</Text>
                            </View>
                            <Text style={[styles.instructionText, { color: Colors[colorScheme ?? "light"].text }]}>Cập nhật đầy đủ thông tin cá nhân và kỹ năng</Text>
                        </View>

                        <View style={styles.instructionStep}>
                            <View style={[styles.stepNumber, { backgroundColor: Colors[colorScheme ?? "light"].tint }]}>
                                <Text style={styles.stepNumberText}>3</Text>
                            </View>
                            <Text style={[styles.instructionText, { color: Colors[colorScheme ?? "light"].text }]}>
                                Hệ thống sẽ tự động phân tích và tạo báo cáo chi tiết
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.uploadButton, { backgroundColor: Colors[colorScheme ?? "light"].tint }]}
                        onPress={() => router.push("/(tabs)/profile")}
                    >
                        <Ionicons name="person" size={20} color="white" />
                        <Text style={styles.uploadButtonText}>Cập nhật hồ sơ</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    console.log("🎯 Rendering main content with data");
    return (
        <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? "light"].background }]}>
            <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} />

            {renderHeader()}

            <ScrollView
                style={styles.content}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 60 }]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={refreshData} progressViewOffset={20} tintColor={Colors[colorScheme ?? "light"].tint} />
                }
            >
                <View style={styles.mainGrid}>
                    <View style={styles.mainColumn}>
                        {memoizedOverviewCard}
                        {memoizedSuggestionsCard}
                    </View>

                    {memoizedCVInfoCard}
                </View>
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
                                    💡Dữ liệu trên CV có thể khác nếu như bạn đã cập nhật hồ sơ mới trên hệ thống
                                </Text>

                                {userData?.userData?.PDF_CV_URL ? (
                                    <WebView source={{ uri: userData?.userData?.PDF_CV_URL }} />
                                ) : (
                                    <Text style={[styles.noCV]}>Không có CV</Text>
                                )}
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
        maxWidth: width * 0.7,
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
        borderWidth: 1,
        marginBottom: 16,
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
    noCV: {
        fontSize: 16,
        marginTop: 50,
        fontWeight: "bold",
        textAlign: "center",
        lineHeight: 20,
        color: "#ff9933",
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
        marginTop: 0,
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
        marginTop: -60,
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
    subsection: {
        gap: 10,
    },
    bulletPoint: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 8,
        marginTop: 8,
    },
    noteIcon: {
        width: 16,
        height: 16,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 8,
    },
    contentContainer: {
        padding: 14,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.06)",
        backgroundColor: "rgba(0,0,0,0.02)",
    },
    contentText: {
        fontSize: 14,
        lineHeight: 20,
    },
    suggestionContainer: {
        padding: 14,
        borderRadius: 10,
        borderWidth: 1,
    },
    actionsContainer: {
        gap: 16,
    },
    pageTitle: {
        fontSize: 20,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 20,
    },
    mainGrid: {
        flexDirection: width > 768 ? "row" : "column",
        gap: 16,
    },
    mainColumn: {
        flex: width > 768 ? 2 : 1,
    },
    markdownContainer: {
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.06)",
        backgroundColor: "rgba(0,0,0,0.02)",
    },
    markdownText: {
        fontSize: 14,
        lineHeight: 22,
    },
    instructionContainer: {
        width: "100%",
        marginVertical: 20,
        gap: 16,
        paddingHorizontal: 16,
    },
    instructionStep: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    stepNumberText: {
        color: "white",
        fontSize: 14,
        fontWeight: "bold",
    },
    instructionText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
});
