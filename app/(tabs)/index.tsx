import React, { useState, useEffect } from "react";
import { StyleSheet, ScrollView, TouchableOpacity, View, Dimensions, StatusBar, ActivityIndicator, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
            title: "Cẩm nang nghề nghiệp",
            subtitle: "Học hỏi kinh nghiệm",
            icon: "newspaper.fill" as const,
            gradient: ["#f59e0b", "#fbbf24"] as [string, string],
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
                {/* Hero Section */}

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
                    </View>
                </View>

                {/* Top Companies */}
                <View style={styles.featuredSection}>
                    <View style={styles.sectionHeader}>
                        <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Top công ty tuyển dụng</ThemedText>
                        {/* <TouchableOpacity onPress={() => router.push("/(tabs)/jobs")}>
                            <ThemedText style={[styles.seeAll, { color: colors.tint }]}>Xem tất cả</ThemedText>
                        </TouchableOpacity> */}
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
});
