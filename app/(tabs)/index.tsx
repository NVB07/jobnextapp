import React, { useState, useEffect } from "react";
import { StyleSheet, ScrollView, TouchableOpacity, View, Dimensions, StatusBar, ActivityIndicator, Image, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Linking from "expo-linking";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { apiService } from "@/services/api";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];
    const insets = useSafeAreaInsets();

    // States for API data
    const [totalJobs, setTotalJobs] = useState<number>(0);
    const [totalCompanies, setTotalCompanies] = useState<number>(0);
    const [topCompanies, setTopCompanies] = useState<
        Array<{
            name: string;
            jobCount: number;
            logo?: string;
        }>
    >([]);
    const [loading, setLoading] = useState(true);

    const quickActions = [
        {
            title: "Tìm việc làm",
            subtitle: "Khám phá các cơ hội nghề nghiệp",
            icon: "briefcase.fill" as const,
            gradient: ["#6366f1", "#8b5cf6"] as [string, string],
            route: "/(tabs)/jobs" as const,
        },
        {
            title: "Phân tích CV",
            subtitle: "Cải thiện hồ sơ của bạn",
            icon: "doc.text.fill" as const,
            gradient: ["#10b981", "#34d399"] as [string, string],
            route: "/(tabs)/cv-analysis" as const,
        },
        {
            title: "Phỏng vấn ảo",
            subtitle: "Luyện tập kỹ năng phỏng vấn",
            icon: "video.fill" as const,
            gradient: ["#f59e0b", "#fbbf24"] as [string, string],
            route: "/(tabs)/virtual-interview" as const,
        },
        {
            title: "Cẩm nang nghề nghiệp",
            subtitle: "Học hỏi kinh nghiệm",
            icon: "newspaper.fill" as const,
            gradient: ["#ef4444", "#f87171"] as [string, string],
            route: "/(tabs)/blog" as const,
        },
        {
            title: "Hồ sơ cá nhân",
            subtitle: "Quản lý thông tin",
            icon: "person.circle.fill" as const,
            gradient: ["#8b5cf6", "#a78bfa"] as [string, string],
            route: "/(tabs)/profile" as const,
        },
    ];

    // Testimonials data
    const testimonials = [
        {
            name: "Nguyễn Văn An",
            role: "Software Engineer",
            company: "FPT Software",
            content: "JobNext đã giúp tôi tìm được công việc mơ ước. Tính năng phân tích CV rất hữu ích!",
            rating: 5,
        },
        {
            name: "Trần Thị Bình",
            role: "Marketing Manager",
            company: "Vingroup",
            content: "Ứng dụng rất dễ sử dụng, thông tin việc làm cập nhật liên tục và chính xác.",
            rating: 5,
        },
        {
            name: "Lê Minh Châu",
            role: "Data Analyst",
            company: "Viettel",
            content: "Tính năng phỏng vấn ảo giúp tôi tự tin hơn trong các buổi phỏng vấn thực tế.",
            rating: 5,
        },
    ];

    // Company info data
    const companyInfo = [
        {
            title: "Về JobNext",
            subtitle: "Tìm hiểu về chúng tôi",
            icon: "info.circle.fill" as const,
            action: () => router.push("/about"),
        },
        {
            title: "Điều khoản sử dụng",
            subtitle: "Quy định & điều kiện",
            icon: "doc.plaintext.fill" as const,
            action: () => router.push("/terms"),
        },
        {
            title: "Chính sách bảo mật",
            subtitle: "Bảo vệ thông tin cá nhân",
            icon: "lock.shield.fill" as const,
            action: () => router.push("/privacy"),
        },
        {
            title: "Liên hệ hỗ trợ",
            subtitle: "Chúng tôi luôn sẵn sàng giúp đỡ",
            icon: "phone.fill" as const,
            action: () => showContactAlert(),
        },
    ];

    const showInfoAlert = (title: string, message: string) => {
        Alert.alert(title, message, [{ text: "Đã hiểu", style: "default" }]);
    };

    const showContactAlert = () => {
        Alert.alert("Liên hệ hỗ trợ", "Email: nvbinh.zzz@gmail.com\nHotline: 0395-432-155\nGiờ làm việc: 8:00 - 18:00 (T2-T6)", [
            { text: "Gọi ngay", onPress: () => Linking.openURL("tel:0395432155") },
            { text: "Gửi email", onPress: () => Linking.openURL("mailto:nvbinh.zzz@gmail.com") },
            { text: "Đóng", style: "cancel" },
        ]);
    };

    // Fetch home page data
    useEffect(() => {
        const fetchHomeData = async () => {
            try {
                setLoading(true);

                // Fetch total jobs count from jobs API (has pagination data)
                const jobsResponse = await apiService.getJobs({ page: 1, limit: 1 });
                setTotalJobs(jobsResponse.totalJobs || 0);

                // Fetch top companies data
                const companiesResponse = await apiService.getTopCompanies();
                console.log("companiesResponse", companiesResponse);
                setTopCompanies(companiesResponse.companies.slice(0, 10)); // Lấy 10 công ty top
                setTotalCompanies(companiesResponse.totalCompanies || 0);
            } catch (error) {
                console.error("Error fetching home data:", error);
                // Set fallback values
                setTotalJobs(0);
                setTotalCompanies(0);
                setTopCompanies([]);
            } finally {
                setLoading(false);
            }
        };

        fetchHomeData();
    }, []);

    const formatNumber = (num: number): string => {
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + "K";
        }
        return num.toString();
    };

    // Component để hiển thị logo công ty với fallback
    const CompanyLogo = ({ logoUrl, companyName }: { logoUrl?: string; companyName: string }) => {
        const [imageError, setImageError] = useState(false);

        if (!logoUrl || imageError) {
            return (
                <LinearGradient colors={["#6366f1", "#8b5cf6"]} style={[styles.companyLogoContainer, styles.fallbackLogo]}>
                    <IconSymbol name="building.2.fill" size={24} color="white" />
                </LinearGradient>
            );
        }

        return (
            <View style={styles.companyLogoContainer}>
                <Image source={{ uri: logoUrl }} style={styles.companyLogo} resizeMode="contain" onError={() => setImageError(true)} />
            </View>
        );
    };

    // Component hiển thị stars rating
    const StarRating = ({ rating }: { rating: number }) => {
        return (
            <View style={styles.starContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <IconSymbol key={star} name={star <= rating ? "star.fill" : "star"} size={14} color={star <= rating ? "#fbbf24" : "#d1d5db"} />
                ))}
            </View>
        );
    };

    return (
        <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} />

            <LinearGradient colors={colors.gradient} style={[styles.heroSection, { paddingTop: insets.top }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={styles.heroContent}>
                    <Image source={require("../../assets/images/icon.png")} style={styles.logo} resizeMode="contain" />
                    <View style={{ gap: 1 }}>
                        <ThemedText style={styles.welcomeText}> JobNext!</ThemedText>
                        <ThemedText style={styles.heroSubtitle}>Hỗ trợ ứng viên tìm kiếm việc làm và phát triển sự nghiệp</ThemedText>
                    </View>
                    {/* Search Bar */}
                </View>
                <TouchableOpacity style={styles.heroSearchBar} onPress={() => router.push("/(tabs)/jobs")}>
                    <BlurView intensity={20} style={styles.searchBlur}>
                        <IconSymbol name="magnifyingglass" size={20} color="#fff" />
                        <ThemedText style={styles.searchPlaceholder}>Tìm kiếm việc làm...</ThemedText>
                    </BlurView>
                </TouchableOpacity>
            </LinearGradient>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
                {/* Quick Actions */}
                <View style={styles.actionsSection}>
                    <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Truy cập nhanh</ThemedText>

                    <View style={styles.actionsGrid}>
                        {quickActions.map((action, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[styles.actionCard, { backgroundColor: colors.cardBackground }]}
                                onPress={() => router.push(action.route)}
                                activeOpacity={0.8}
                            >
                                <LinearGradient colors={action.gradient} style={styles.actionIconContainer} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                                    <IconSymbol name={action.icon} size={24} color="white" />
                                </LinearGradient>

                                <ThemedText style={[styles.actionTitle, { color: colors.text }]}>{action.title}</ThemedText>
                                <ThemedText style={[styles.actionSubtitle, { color: colors.icon }]}>{action.subtitle}</ThemedText>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Stats Section */}
                <View style={styles.statsSection}>
                    <View style={[styles.statsCard, { backgroundColor: colors.cardBackground }]}>
                        <View style={styles.statItem}>
                            <LinearGradient colors={["#10b981", "#34d399"]} style={styles.statIcon}>
                                <IconSymbol name="briefcase.fill" size={20} color="white" />
                            </LinearGradient>
                            <View>
                                {loading ? (
                                    <ActivityIndicator size="small" color={colors.tint} />
                                ) : (
                                    <ThemedText style={[styles.statNumber, { color: colors.text }]}>{formatNumber(totalJobs)}</ThemedText>
                                )}
                                <ThemedText style={[styles.statLabel, { color: colors.icon }]}>Việc làm</ThemedText>
                            </View>
                        </View>

                        <View style={styles.statItem}>
                            <LinearGradient colors={["#6366f1", "#8b5cf6"]} style={styles.statIcon}>
                                <IconSymbol name="building.2.fill" size={20} color="white" />
                            </LinearGradient>
                            <View>
                                {loading ? (
                                    <ActivityIndicator size="small" color={colors.tint} />
                                ) : (
                                    <ThemedText style={[styles.statNumber, { color: colors.text }]}>{formatNumber(totalCompanies)}</ThemedText>
                                )}
                                <ThemedText style={[styles.statLabel, { color: colors.icon }]}>Công ty</ThemedText>
                            </View>
                        </View>

                        <View style={styles.statItem}>
                            <LinearGradient colors={["#f59e0b", "#fbbf24"]} style={styles.statIcon}>
                                <IconSymbol name="person.3.fill" size={20} color="white" />
                            </LinearGradient>
                            <View>
                                <ThemedText style={[styles.statNumber, { color: colors.text }]}>50K+</ThemedText>
                                <ThemedText style={[styles.statLabel, { color: colors.icon }]}>Ứng viên</ThemedText>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Top Companies */}
                <View style={styles.featuredSection}>
                    <View style={styles.sectionHeader}>
                        <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Top công ty tuyển dụng</ThemedText>
                    </View>

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={colors.tint} />
                        </View>
                    ) : (
                        <ScrollView style={{ backgroundColor: colors.background }} horizontal showsHorizontalScrollIndicator={false}>
                            {topCompanies.map((company, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.companyCard, { backgroundColor: colors.cardBackground }]}
                                    onPress={() => router.push("/(tabs)/jobs")}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.companyIconContainer}>
                                        <CompanyLogo logoUrl={company.logo} companyName={company.name} />
                                    </View>

                                    <ThemedText style={[styles.companyTitle, { color: colors.text }]} numberOfLines={2}>
                                        {company.name}
                                    </ThemedText>
                                    <ThemedText style={[styles.companyJobCount, { color: colors.success }]}>{formatNumber(company.jobCount)} vị trí</ThemedText>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                </View>

                {/* Testimonials Section */}
                <View style={styles.testimonialsSection}>
                    <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Phản hồi từ người dùng</ThemedText>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {testimonials.map((testimonial, index) => (
                            <View key={index} style={[styles.testimonialCard, { backgroundColor: colors.cardBackground }]}>
                                <View style={styles.testimonialHeader}>
                                    <View style={styles.avatarContainer}>
                                        <LinearGradient colors={["#6366f1", "#8b5cf6"]} style={styles.avatar}>
                                            <ThemedText style={styles.avatarText}>
                                                {testimonial.name
                                                    .split(" ")
                                                    .map((n) => n[0])
                                                    .join("")}
                                            </ThemedText>
                                        </LinearGradient>
                                    </View>
                                    <View style={styles.userInfo}>
                                        <ThemedText style={[styles.userName, { color: colors.text }]}>{testimonial.name}</ThemedText>
                                        <ThemedText style={[styles.userRole, { color: colors.icon }]}>
                                            {testimonial.role} • {testimonial.company}
                                        </ThemedText>
                                        <StarRating rating={testimonial.rating} />
                                    </View>
                                </View>
                                <ThemedText style={[styles.testimonialContent, { color: colors.text }]}>"{testimonial.content}"</ThemedText>
                            </View>
                        ))}
                    </ScrollView>
                </View>

                {/* Company Info & Policy Section */}
                <View style={styles.infoSection}>
                    <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Thông tin & Hỗ trợ</ThemedText>

                    <View style={styles.infoGrid}>
                        {companyInfo.map((info, index) => (
                            <TouchableOpacity key={index} style={[styles.infoCard, { backgroundColor: colors.cardBackground }]} onPress={info.action} activeOpacity={0.8}>
                                <LinearGradient colors={index % 2 === 0 ? ["#10b981", "#34d399"] : ["#6366f1", "#8b5cf6"]} style={styles.infoIconContainer}>
                                    <IconSymbol name={info.icon} size={20} color="white" />
                                </LinearGradient>
                                <View style={styles.infoContent}>
                                    <ThemedText style={[styles.infoTitle, { color: colors.text }]}>{info.title}</ThemedText>
                                    <ThemedText style={[styles.infoSubtitle, { color: colors.icon }]}>{info.subtitle}</ThemedText>
                                </View>
                                <IconSymbol name="chevron.right" size={16} color={colors.icon} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <LinearGradient colors={colors.gradient} style={styles.footerGradient}>
                        <View style={styles.footerContent}>
                            <View style={styles.footerLogo}>
                                <Image source={require("../../assets/images/icon.png")} style={styles.footerLogoImage} resizeMode="contain" />
                                <ThemedText style={styles.footerLogoText}>JobNext</ThemedText>
                            </View>

                            <ThemedText style={styles.footerDescription}>Hỗ trợ ứng viên tìm kiếm việc làm và phát triển sự nghiệp</ThemedText>

                            <View style={styles.footerLinks}>
                                <TouchableOpacity onPress={() => Linking.openURL("https://jobnext-rosy.vercel.app/")}>
                                    <ThemedText style={styles.footerLink}>Website</ThemedText>
                                </TouchableOpacity>
                                <ThemedText style={styles.footerSeparator}>•</ThemedText>

                                <TouchableOpacity onPress={() => Linking.openURL("mailto:nvbinh.zzz@gmail.com")}>
                                    <ThemedText style={styles.footerLink}>Email</ThemedText>
                                </TouchableOpacity>
                            </View>

                            <ThemedText style={styles.footerCopyright}>© 2025 JobNext. All rights reserved.</ThemedText>
                        </View>
                    </LinearGradient>
                </View>
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    logo: {
        width: 76,
        height: 76,
        marginBottom: 5,
        borderRadius: 12,
    },
    scrollView: {
        flex: 1,
    },
    heroSection: {
        paddingBottom: 20,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    heroContent: {
        alignItems: "center",
        flexDirection: "row",
        gap: 16,
    },
    welcomeText: {
        paddingTop: 10,
        fontSize: 32,
        fontWeight: "bold",
        color: "white",
        textAlign: "left",
        textShadowColor: "rgba(0,0,0,0.1)",
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    heroSubtitle: {
        paddingRight: 10,
        fontSize: 16,
        color: "rgba(255,255,255,0.9)",
        textAlign: "left",
        maxWidth: 260,
        lineHeight: 20,
    },
    heroSearchBar: {
        width: "100%",
        marginTop: 8,
    },
    searchBlur: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderRadius: 16,
        gap: 12,
        overflow: "hidden",
    },
    searchPlaceholder: {
        flex: 1,
        color: "rgba(255,255,255,0.8)",
        fontSize: 16,
    },
    actionsSection: {
        padding: 24,
    },
    sectionTitle: {
        paddingTop: 10,
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 20,
    },
    actionsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 16,
        justifyContent: "center",
    },
    actionCard: {
        width: (width - 64) / 2,
        padding: 24,
        borderRadius: 20,
        alignItems: "center",
        gap: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 8,
    },
    actionIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: "600",
        textAlign: "center",
        lineHeight: 22,
    },
    actionSubtitle: {
        fontSize: 12,
        textAlign: "center",
        opacity: 0.7,
        lineHeight: 16,
    },
    statsSection: {
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    statsCard: {
        flexDirection: "row",
        justifyContent: "space-around",
        padding: 24,
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
        gap: 40,
    },
    statItem: {
        alignItems: "center",
        gap: 8,
        flex: 1,
    },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    statNumber: {
        fontSize: 18,
        fontWeight: "bold",
        textAlign: "center",
    },
    statLabel: {
        fontSize: 12,
        textAlign: "center",
    },
    featuredSection: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    seeAll: {
        fontSize: 14,
        fontWeight: "600",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    companyCard: {
        width: 200,
        padding: 20,
        borderRadius: 16,
        marginRight: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
    },
    companyIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
        padding: 8,
    },
    companyLogoContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "white",
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.3)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    fallbackLogo: {
        backgroundColor: "rgba(255,255,255,0.2)",
        borderColor: "rgba(255,255,255,0.3)",
    },
    companyLogo: {
        width: 40,
        height: 40,
        borderRadius: 8,
    },
    companyTitle: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 8,
        lineHeight: 22,
    },
    companyJobCount: {
        fontSize: 14,
        fontWeight: "600",
    },
    // Testimonials styles
    testimonialsSection: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    testimonialCard: {
        width: 280,
        padding: 20,
        borderRadius: 16,
        marginRight: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
    },
    testimonialHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
        gap: 12,
    },
    avatarContainer: {
        width: 48,
        height: 48,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    avatarText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
    },
    userInfo: {
        flex: 1,
        gap: 2,
    },
    userName: {
        fontSize: 16,
        fontWeight: "600",
    },
    userRole: {
        fontSize: 12,
        opacity: 0.7,
    },
    starContainer: {
        flexDirection: "row",
        gap: 2,
        marginTop: 4,
    },
    testimonialContent: {
        fontSize: 14,
        lineHeight: 20,
        fontStyle: "italic",
    },
    // Info section styles
    infoSection: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    infoGrid: {
        gap: 12,
    },
    infoCard: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderRadius: 16,
        gap: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    infoIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    infoContent: {
        flex: 1,
        gap: 2,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: "600",
    },
    infoSubtitle: {
        fontSize: 12,
        opacity: 0.7,
    },
    // Footer styles
    footer: {
        marginHorizontal: 24,
        marginBottom: 20,
        borderRadius: 20,
        overflow: "hidden",
    },
    footerGradient: {
        padding: 24,
    },
    footerContent: {
        alignItems: "center",
        gap: 12,
    },
    footerLogo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    footerLogoImage: {
        width: 32,
        height: 32,
        borderRadius: 8,
    },
    footerLogoText: {
        fontSize: 20,
        fontWeight: "bold",
        color: "white",
    },
    footerDescription: {
        fontSize: 14,
        color: "rgba(255,255,255,0.8)",
        textAlign: "center",
    },
    footerLinks: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 8,
    },
    footerLink: {
        fontSize: 14,
        color: "rgba(255,255,255,0.9)",
        fontWeight: "500",
    },
    footerSeparator: {
        fontSize: 14,
        color: "rgba(255,255,255,0.6)",
    },
    footerCopyright: {
        fontSize: 12,
        color: "rgba(255,255,255,0.6)",
        textAlign: "center",
        marginTop: 8,
    },
});
