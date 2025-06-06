import React, { useState, useEffect } from "react";
import { StyleSheet, ScrollView, TouchableOpacity, View, Alert, Dimensions, StatusBar, RefreshControl, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { auth } from "../../config/firebase";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "../../contexts/AuthContext";
import { useAuthGuard } from "../../hooks/useAuthGuard";
import { apiService, listsCache } from "../../services/api";

const { width } = Dimensions.get("window");

interface UserStats {
    interviews: number;
    savedJobs: number;
}

interface Achievement {
    id: number;
    title: string;
    description: string;
    icon: string;
    color: [string, string];
    unlocked: boolean;
}

export default function ProfileScreen() {
    // Authentication guard - moved to top of component
    const { user, loading, isAuthenticated } = useAuthGuard();
    const { signOut } = useAuth();

    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];
    const insets = useSafeAreaInsets();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [darkModeEnabled, setDarkModeEnabled] = useState(colorScheme === "dark");
    const [userStats, setUserStats] = useState<UserStats>({
        interviews: 0,
        savedJobs: 0,
    });
    const [refreshing, setRefreshing] = useState(false);

    // Fetch user statistics
    const fetchUserStats = async () => {
        if (!user?.uid) return;

        try {
            // Get token for interviews API
            const currentUser = auth.currentUser;
            const token = currentUser ? await currentUser.getIdToken() : "";

            // Fetch both counts in parallel
            const [savedJobsResult, interviewsResult] = await Promise.all([apiService.getSavedJobsCount(user.uid), apiService.getInterviewsCount(user.uid, token)]);

            setUserStats({
                savedJobs: savedJobsResult.count,
                interviews: interviewsResult.count,
            });
        } catch (error) {
            console.error("Error fetching user stats:", error);
            // Keep default values on error
        }
    };

    // Handle pull to refresh
    const onRefresh = async () => {
        setRefreshing(true);
        // Clear cache to ensure fresh data
        if (user?.uid) {
            listsCache.clearUserCache(user.uid);
        }
        await fetchUserStats();
        setRefreshing(false);
    };

    useEffect(() => {
        if (isAuthenticated && user?.uid) {
            fetchUserStats();
        }
    }, [isAuthenticated, user?.uid]);

    const profileCompleteness = 75;

    const achievements: Achievement[] = [
        {
            id: 1,
            title: "CV Chuyên nghiệp",
            description: "Hoàn thành hồ sơ với điểm số trên 80",
            icon: "star.fill",
            color: ["#6366f1", "#8b5cf6"] as [string, string],
            unlocked: true,
        },
        {
            id: 2,
            title: "Ứng viên Tích cực",
            description: "Ứng tuyển hơn 20 vị trí",
            icon: "briefcase.fill",
            color: ["#10b981", "#34d399"] as [string, string],
            unlocked: true,
        },
        {
            id: 3,
            title: "Phỏng vấn Xuất sắc",
            description: "Có tỷ lệ chuyển đổi phỏng vấn cao",
            icon: "trophy.fill",
            color: ["#f59e0b", "#fbbf24"] as [string, string],
            unlocked: false,
        },
    ];

    const handleSettingsPress = (setting: string) => {
        Alert.alert("Cài đặt", `Bạn đã chọn: ${setting}`);
    };

    const handleLogout = async () => {
        Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất khỏi ứng dụng?", [
            { text: "Hủy", style: "cancel" },
            {
                text: "Đăng xuất",
                style: "destructive",
                onPress: async () => {
                    try {
                        await signOut();
                    } catch (error) {
                        Alert.alert("Lỗi", "Không thể đăng xuất. Vui lòng thử lại.");
                    }
                },
            },
        ]);
    };

    const StatCard = ({ title, value, icon, gradient, onPress }: { title: string; value: number; icon: string; gradient: [string, string]; onPress?: () => void }) => (
        <TouchableOpacity style={[styles.statCard, { backgroundColor: colors.cardBackground }]} onPress={onPress} activeOpacity={onPress ? 0.8 : 1}>
            <LinearGradient colors={gradient} style={styles.statIcon}>
                <IconSymbol name={icon as any} size={20} color="white" />
            </LinearGradient>

            <View style={styles.statInfo}>
                <ThemedText style={[styles.statValue, { color: colors.text }]}>{value}</ThemedText>
                <ThemedText style={[styles.statTitle, { color: colors.icon }]}>{title}</ThemedText>
            </View>

            {onPress && (
                <View style={styles.statArrow}>
                    <IconSymbol name="chevron.right" size={16} color={colors.icon} />
                </View>
            )}
        </TouchableOpacity>
    );

    const AchievementCard = ({ achievement }: { achievement: Achievement }) => (
        <View style={[styles.achievementCard, { backgroundColor: colors.cardBackground }]}>
            <LinearGradient colors={achievement.unlocked ? achievement.color : ["#9ca3af", "#d1d5db"]} style={styles.achievementIcon}>
                <IconSymbol name={achievement.icon as any} size={20} color="white" />
            </LinearGradient>

            <View style={styles.achievementInfo}>
                <ThemedText style={[styles.achievementTitle, { color: colors.text }]}>{achievement.title}</ThemedText>
                <ThemedText style={[styles.achievementDescription, { color: colors.icon }]}>{achievement.description}</ThemedText>
            </View>

            {achievement.unlocked && (
                <View style={[styles.unlockedBadge, { backgroundColor: colors.success }]}>
                    <IconSymbol name="checkmark" size={12} color="white" />
                </View>
            )}
        </View>
    );

    const SettingItem = ({
        title,
        subtitle,
        icon,
        onPress,
        showArrow = true,
    }: {
        title: string;
        subtitle?: string;
        icon: string;
        onPress: () => void;
        showArrow?: boolean;
    }) => (
        <TouchableOpacity style={[styles.settingItem, { backgroundColor: colors.cardBackground }]} onPress={onPress} activeOpacity={0.8}>
            <View style={[styles.settingIcon, { backgroundColor: colors.border }]}>
                <IconSymbol name={icon as any} size={20} color={colors.text} />
            </View>

            <View style={styles.settingInfo}>
                <ThemedText style={[styles.settingTitle, { color: colors.text }]}>{title}</ThemedText>
                {subtitle && <ThemedText style={[styles.settingSubtitle, { color: colors.icon }]}>{subtitle}</ThemedText>}
            </View>

            {showArrow && <IconSymbol name="chevron.right" size={16} color={colors.icon} />}
        </TouchableOpacity>
    );

    // Show loading if still checking auth
    if (loading) {
        return (
            <ThemedView style={{ backgroundColor: "#fff", flex: 1 }}>
                <ActivityIndicator size="large" />
            </ThemedView>
        );
    }

    // If not authenticated, the useAuthGuard hook will handle redirection
    // We still render something here to avoid hooks error
    if (!isAuthenticated) {
        return (
            <ThemedView style={{ backgroundColor: "#fff", flex: 1 }}>
                <ActivityIndicator size="large" />
            </ThemedView>
        );
    }

    return (
        <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} />
            <LinearGradient colors={colors.gradient} style={[styles.profileHeader, { paddingTop: insets.top }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={styles.profileInfo}>
                    <LinearGradient colors={["#ffffff", "#f8fafc"] as [string, string]} style={styles.avatar}>
                        <IconSymbol name="person.fill" size={32} color={colors.tint} />
                    </LinearGradient>

                    <View style={styles.userInfo}>
                        <ThemedText style={styles.userName}>{user?.displayName || user?.email || "Người dùng"}</ThemedText>
                        <ThemedText style={styles.userTitle}>React Native Developer</ThemedText>
                        <ThemedText style={styles.userLocation}>Hồ Chí Minh, Việt Nam</ThemedText>
                    </View>
                </View>

                <TouchableOpacity style={styles.editButton}>
                    <IconSymbol name="pencil" size={16} color="white" />
                    <ThemedText style={styles.editButtonText}>Chỉnh sửa</ThemedText>
                </TouchableOpacity>
            </LinearGradient>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[colors.tint]} // Android
                        tintColor={colors.tint} // iOS
                        title="Đang tải lại..."
                        titleColor={colors.text}
                    />
                }
            >
                {/* Profile Header */}

                {/* Profile Completeness */}
                <View style={styles.completenessSection}>
                    <View style={[styles.completenessCard, { backgroundColor: colors.cardBackground }]}>
                        <View style={styles.completenessHeader}>
                            <ThemedText style={[styles.completenessTitle, { color: colors.text }]}>Hoàn thiện hồ sơ</ThemedText>
                            <ThemedText style={[styles.completenessPercent, { color: colors.tint }]}>{profileCompleteness}%</ThemedText>
                        </View>

                        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                            <LinearGradient colors={colors.gradient} style={[styles.progressFill, { width: `${profileCompleteness}%` }]} />
                        </View>

                        <ThemedText style={[styles.completenessHint, { color: colors.icon }]}>Hoàn thiện thêm 25% để tăng cơ hội được tuyển dụng</ThemedText>
                    </View>
                </View>

                {/* Statistics */}
                <View style={styles.statsSection}>
                    <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Thống kê hoạt động</ThemedText>

                    <View style={styles.statsGrid}>
                        <StatCard
                            title="Phỏng vấn"
                            value={userStats.interviews}
                            icon="person.2.fill"
                            gradient={["#10b981", "#34d399"] as [string, string]}
                            onPress={() => router.push("/interviews")}
                        />
                        <StatCard
                            title="Công việc đã lưu"
                            value={userStats.savedJobs}
                            icon="bookmark.fill"
                            gradient={["#f59e0b", "#fbbf24"] as [string, string]}
                            onPress={() => router.push("/saved-jobs")}
                        />
                    </View>
                </View>

                {/* Achievements */}
                <View style={styles.achievementsSection}>
                    <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Thành tích</ThemedText>

                    {achievements.map((achievement) => (
                        <AchievementCard key={achievement.id} achievement={achievement} />
                    ))}
                </View>

                {/* Settings */}
                <View style={styles.settingsSection}>
                    <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Cài đặt</ThemedText>

                    <View style={styles.settingsGroup}>
                        <SettingItem title="Thông báo" subtitle="Quản lý thông báo ứng dụng" icon="bell.fill" onPress={() => handleSettingsPress("Thông báo")} />
                        <SettingItem
                            title="Quyền riêng tư"
                            subtitle="Cài đặt bảo mật và quyền riêng tư"
                            icon="lock.fill"
                            onPress={() => handleSettingsPress("Quyền riêng tư")}
                        />
                        <SettingItem
                            title="Tài khoản"
                            subtitle="Quản lý thông tin tài khoản"
                            icon="person.circle.fill"
                            onPress={() => handleSettingsPress("Tài khoản")}
                        />
                        <SettingItem
                            title="Hỗ trợ"
                            subtitle="Trung tâm hỗ trợ và phản hồi"
                            icon="questionmark.circle.fill"
                            onPress={() => handleSettingsPress("Hỗ trợ")}
                        />
                    </View>

                    <View style={styles.logoutSection}>
                        <SettingItem title="Đăng xuất" icon="rectangle.portrait.and.arrow.right" onPress={handleLogout} showArrow={false} />
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
    content: {
        flex: 1,
    },
    profileHeader: {
        paddingBottom: 24,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        gap: 20,
    },
    profileInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    userInfo: {
        flex: 1,
        gap: 4,
    },
    userName: {
        paddingTop: 10,
        fontSize: 24,
        fontWeight: "bold",
        color: "white",
    },
    userTitle: {
        fontSize: 16,
        color: "rgba(255,255,255,0.9)",
    },
    userLocation: {
        fontSize: 14,
        color: "rgba(255,255,255,0.8)",
    },
    editButton: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: "rgba(255,255,255,0.2)",
        borderRadius: 12,
        gap: 6,
    },
    editButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: "white",
    },
    completenessSection: {
        padding: 24,
    },
    completenessCard: {
        padding: 20,
        borderRadius: 16,
        gap: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
    },
    completenessHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    completenessTitle: {
        fontSize: 18,
        fontWeight: "bold",
    },
    completenessPercent: {
        fontSize: 18,
        fontWeight: "bold",
    },
    progressBar: {
        height: 8,
        borderRadius: 4,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        borderRadius: 4,
    },
    completenessHint: {
        fontSize: 12,
        lineHeight: 16,
    },
    statsSection: {
        paddingHorizontal: 24,
        marginBottom: 24,
        gap: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "bold",
    },
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    statCard: {
        width: (width - 60) / 2,
        padding: 16,
        borderRadius: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    statInfo: {
        flex: 1,
    },
    statValue: {
        fontSize: 18,
        fontWeight: "bold",
    },
    statTitle: {
        fontSize: 12,
        marginTop: 2,
    },
    statArrow: {
        marginLeft: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    achievementsSection: {
        paddingHorizontal: 24,
        marginBottom: 24,
        gap: 16,
    },
    achievementCard: {
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
    achievementIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    achievementInfo: {
        flex: 1,
        gap: 4,
    },
    achievementTitle: {
        fontSize: 16,
        fontWeight: "600",
    },
    achievementDescription: {
        fontSize: 12,
        lineHeight: 16,
    },
    unlockedBadge: {
        width: 24,
        height: 24,
        borderRadius: 6,
        alignItems: "center",
        justifyContent: "center",
    },
    settingsSection: {
        paddingHorizontal: 24,
        paddingBottom: 100,
        gap: 16,
    },
    settingsGroup: {
        gap: 8,
    },
    settingItem: {
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
    settingIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    settingInfo: {
        flex: 1,
        gap: 2,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: "600",
    },
    settingSubtitle: {
        fontSize: 12,
        lineHeight: 16,
    },
    logoutSection: {
        marginTop: 16,
    },
});
