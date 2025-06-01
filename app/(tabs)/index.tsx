import React from "react";
import { StyleSheet, ScrollView, TouchableOpacity, View, Dimensions, StatusBar } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];
    const insets = useSafeAreaInsets();

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
            title: "Blog nghề nghiệp",
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

    return (
        <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} />

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
                {/* Hero Section */}
                <LinearGradient colors={colors.gradient} style={[styles.heroSection, { paddingTop: insets.top }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <View style={styles.heroContent}>
                        <ThemedText style={styles.welcomeText}> JobNext!</ThemedText>
                        <ThemedText style={styles.heroSubtitle}>Tìm kiếm cơ hội nghề nghiệp và phát triển sự nghiệp của bạn</ThemedText>

                        {/* Search Bar */}
                        <TouchableOpacity style={styles.heroSearchBar} onPress={() => router.push("/(tabs)/jobs")}>
                            <BlurView intensity={20} style={styles.searchBlur}>
                                <IconSymbol name="magnifyingglass" size={20} color="rgba(255,255,255,0.8)" />
                                <ThemedText style={styles.searchPlaceholder}>Tìm kiếm việc làm...</ThemedText>
                            </BlurView>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

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
                                <ThemedText style={[styles.statNumber, { color: colors.text }]}>1,234</ThemedText>
                                <ThemedText style={[styles.statLabel, { color: colors.icon }]}>Việc làm</ThemedText>
                            </View>
                        </View>

                        <View style={styles.statItem}>
                            <LinearGradient colors={["#6366f1", "#8b5cf6"]} style={styles.statIcon}>
                                <IconSymbol name="building.2.fill" size={20} color="white" />
                            </LinearGradient>
                            <View>
                                <ThemedText style={[styles.statNumber, { color: colors.text }]}>567</ThemedText>
                                <ThemedText style={[styles.statLabel, { color: colors.icon }]}>Công ty</ThemedText>
                            </View>
                        </View>

                        <View style={styles.statItem}>
                            <LinearGradient colors={["#f59e0b", "#fbbf24"]} style={styles.statIcon}>
                                <IconSymbol name="person.2.fill" size={20} color="white" />
                            </LinearGradient>
                            <View>
                                <ThemedText style={[styles.statNumber, { color: colors.text }]}>89K</ThemedText>
                                <ThemedText style={[styles.statLabel, { color: colors.icon }]}>Ứng viên</ThemedText>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Featured Jobs */}
                <View style={styles.featuredSection}>
                    <View style={styles.sectionHeader}>
                        <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Việc làm nổi bật</ThemedText>
                        <TouchableOpacity onPress={() => router.push("/(tabs)/jobs")}>
                            <ThemedText style={[styles.seeAll, { color: colors.tint }]}>Xem tất cả</ThemedText>
                        </TouchableOpacity>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {[
                            { title: "React Native Developer", company: "TechCorp Vietnam", salary: "20-30 triệu", color: ["#6366f1", "#8b5cf6"] as [string, string] },
                            { title: "UI/UX Designer", company: "DesignStudio", salary: "18-28 triệu", color: ["#10b981", "#34d399"] as [string, string] },
                            { title: "Frontend Developer", company: "StartupX", salary: "15-25 triệu", color: ["#f59e0b", "#fbbf24"] as [string, string] },
                        ].map((job, index) => (
                            <View key={index} style={[styles.jobCard, { backgroundColor: colors.cardBackground }]}>
                                <LinearGradient colors={job.color} style={styles.jobIconContainer}>
                                    <IconSymbol name="building.2.fill" size={20} color="white" />
                                </LinearGradient>

                                <ThemedText style={[styles.jobTitle, { color: colors.text }]} numberOfLines={2}>
                                    {job.title}
                                </ThemedText>
                                <ThemedText style={[styles.jobCompany, { color: colors.icon }]}>{job.company}</ThemedText>
                                <ThemedText style={[styles.jobSalary, { color: colors.success }]}>{job.salary}</ThemedText>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    heroSection: {
        paddingBottom: 40,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    heroContent: {
        alignItems: "center",
        gap: 16,
    },
    welcomeText: {
        paddingTop: 10,
        fontSize: 32,
        fontWeight: "bold",
        color: "white",
        textAlign: "center",
        textShadowColor: "rgba(0,0,0,0.1)",
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    heroSubtitle: {
        fontSize: 16,
        color: "rgba(255,255,255,0.9)",
        textAlign: "center",
        lineHeight: 24,
        maxWidth: 280,
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
    jobCard: {
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
    jobIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    jobTitle: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 8,
        lineHeight: 22,
    },
    jobCompany: {
        fontSize: 14,
        marginBottom: 8,
    },
    jobSalary: {
        fontSize: 14,
        fontWeight: "600",
    },
});
