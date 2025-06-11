import React, { useState, useEffect } from "react";
import { StyleSheet, ScrollView, TouchableOpacity, View, Alert, Dimensions, StatusBar, RefreshControl } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useNavigation } from "expo-router";
import { useLayoutEffect } from "react";
import { useFocusEffect } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuthGuard } from "../hooks/useAuthGuard";
import { apiService, Job, listsCache } from "../services/api";

const { width } = Dimensions.get("window");

interface SavedJobsResponse {
    data: Job[];
    pagination: {
        currentPage: number;
        perPage: number;
        totalPages: number;
        totalJobs: number;
    };
}

export default function SavedJobsScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();

    const [savedJobs, setSavedJobs] = useState<SavedJobsResponse>({
        data: [],
        pagination: { currentPage: 1, perPage: 10, totalPages: 1, totalJobs: 0 },
    });
    const [expiredJobsCount, setExpiredJobsCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    // Authentication guard
    const { user, loading: authLoading, isAuthenticated } = useAuthGuard();

    // Hide the default header
    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });

        // Add focus listener for navigation events
        const unsubscribe = navigation.addListener("focus", () => {
            if (user?.uid && savedJobs.data.length > 0) {
                console.log("Navigation focus event triggered");
                fetchSavedJobs(1, true);
            }
        });

        return unsubscribe;
    }, [navigation, user?.uid]);

    // Show loading if still checking auth
    if (authLoading || !isAuthenticated) {
        return <ThemedView style={styles.container} />;
    }

    // Fetch saved jobs
    const fetchSavedJobs = async (page = 1, forceRefresh = false) => {
        if (!user?.uid) return;

        try {
            const response = await apiService.getSavedJobs(user.uid, page, 10, forceRefresh);
            setSavedJobs(response);
            setCurrentPage(page);

            // Calculate expired jobs count only for the first page
            if (page === 1) {
                const totalSavedJobIds = response.pagination.totalJobs;
                // Get total count of actual jobs across all pages
                const allJobsResponse = await apiService.getSavedJobs(user.uid, 1, 1000, forceRefresh);
                const actualJobsCount = allJobsResponse.data.length;
                const expiredCount = Math.max(0, totalSavedJobIds - actualJobsCount);
                setExpiredJobsCount(expiredCount);
            }
        } catch (error) {
            console.log("Error fetching saved jobs:", error);
            Alert.alert("Lỗi", "Không thể tải danh sách công việc đã lưu");
        } finally {
            setLoading(false);
        }
    };

    // Handle unsave job
    const handleUnsaveJob = async (jobId: string) => {
        if (!user?.uid) return;

        Alert.alert("Bỏ lưu công việc", "Bạn có chắc muốn bỏ lưu công việc này?", [
            { text: "Hủy", style: "cancel" },
            {
                text: "Bỏ lưu",
                style: "destructive",
                onPress: async () => {
                    try {
                        const result = await apiService.unsaveJob(user.uid, jobId);
                        if (result.success) {
                            // Remove job from the list
                            setSavedJobs((prev) => ({
                                ...prev,
                                data: prev.data.filter((job) => job._id !== jobId),
                                pagination: {
                                    ...prev.pagination,
                                    totalJobs: prev.pagination.totalJobs - 1,
                                },
                            }));
                            // Refresh list if needed
                            if (savedJobs.data.length <= 1 && currentPage > 1) {
                                fetchSavedJobs(currentPage - 1, true);
                            }
                        }
                    } catch (error) {
                        console.log("Error unsaving job:", error);
                        Alert.alert("Lỗi", "Không thể bỏ lưu công việc này");
                    }
                },
            },
        ]);
    };

    // Handle pull to refresh
    const onRefresh = async () => {
        setRefreshing(true);
        // Clear cache for this user and force refresh
        if (user?.uid) {
            listsCache.clearUserCache(user.uid);
        }
        // Reset expired jobs count
        setExpiredJobsCount(0);
        await fetchSavedJobs(1, true);
        setRefreshing(false);
    };

    // Load more jobs
    const loadMore = async () => {
        if (currentPage < savedJobs.pagination.totalPages) {
            await fetchSavedJobs(currentPage + 1);
        }
    };

    // Fetch saved jobs on initial load
    useEffect(() => {
        fetchSavedJobs(1);
    }, [user?.uid]);

    // Refresh data when screen comes into focus (returning from job detail)
    useFocusEffect(
        React.useCallback(() => {
            // Skip initial render by checking if we're coming back from another screen
            const isReturning = savedJobs.data.length > 0;

            if (isReturning && user?.uid) {
                console.log("Screen focused, refreshing saved jobs list");
                // Clear cache for this user and force refresh
                listsCache.clearUserCache(user.uid);
                fetchSavedJobs(1, true);
            }

            return () => {}; // cleanup function
        }, [user?.uid, savedJobs.data.length])
    );

    const renderHeader = () => (
        <LinearGradient colors={colors.gradient} style={[styles.header, { paddingTop: insets.top + 10 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={styles.headerContent}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
                    <IconSymbol name="chevron.left" size={20} color="white" />
                </TouchableOpacity>

                <View style={styles.headerTextContainer}>
                    <ThemedText style={styles.headerTitle}>Công việc đã lưu</ThemedText>
                    <ThemedText style={styles.headerSubtitle}>
                        {savedJobs.data.length} công việc
                        {expiredJobsCount > 0 && ` • ${expiredJobsCount} đã hết hạn`}
                    </ThemedText>
                </View>

                {/* <TouchableOpacity style={styles.searchButton} activeOpacity={0.7}>
                    <IconSymbol name="magnifyingglass" size={20} color="white" />
                </TouchableOpacity> */}
            </View>
        </LinearGradient>
    );

    const renderJobCard = (job: Job) => (
        <View key={job._id} style={[styles.jobCard, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.jobHeader}>
                <View style={styles.companyInfo}>
                    <View style={[styles.companyLogo, { backgroundColor: colors.border }]}>
                        <IconSymbol name="building.2.fill" size={20} color={colors.tint} />
                    </View>
                    <View style={styles.jobTitleContainer}>
                        <ThemedText style={[styles.jobTitle, { color: colors.text }]} numberOfLines={2}>
                            {job.title}
                        </ThemedText>
                        <ThemedText style={[styles.companyName, { color: colors.icon }]}>{job.company}</ThemedText>
                    </View>
                </View>

                <TouchableOpacity style={styles.bookmarkButton} activeOpacity={0.7} onPress={() => handleUnsaveJob(job._id)}>
                    <IconSymbol name="bookmark.fill" size={16} color={colors.tint} />
                </TouchableOpacity>
            </View>

            <View style={styles.jobDetails}>
                <View style={styles.jobDetailItem}>
                    <IconSymbol name="location.fill" size={14} color={colors.icon} />
                    <ThemedText style={[styles.jobDetailText, { color: colors.icon }]}>{job.location || "Không xác định"}</ThemedText>
                </View>

                <View style={styles.jobDetailItem}>
                    <IconSymbol name="dollarsign.circle.fill" size={14} color={colors.icon} />
                    <ThemedText style={[styles.jobDetailText, { color: colors.icon }]}>{job.salary || "Thỏa thuận"}</ThemedText>
                </View>
            </View>

            {job.skills && (
                <View style={styles.skillsContainer}>
                    {(typeof job.skills === "string" ? job.skills.split(",") : job.skills).slice(0, 3).map((skill, index) => (
                        <View key={index} style={[styles.skillTag, { backgroundColor: colors.border }]}>
                            <ThemedText style={[styles.skillText, { color: colors.text }]}>{skill.trim()}</ThemedText>
                        </View>
                    ))}
                </View>
            )}

            <View style={styles.jobFooter}>
                <ThemedText style={[styles.postedDate, { color: colors.icon }]}>{job.createdAt ? new Date(job.createdAt).toLocaleDateString("vi-VN") : "Mới"}</ThemedText>

                <TouchableOpacity
                    onPress={() => {
                        router.push({
                            pathname: "/job-detail",
                            params: {
                                jobId: job._id,
                                jobData: JSON.stringify(job),
                                canLoadDetails: (!!job.url).toString(),
                                fromSavedJobs: "true",
                            },
                        });
                    }}
                    activeOpacity={0.8}
                >
                    <LinearGradient colors={["#6366f1", "#8b5cf6"]} style={styles.applyButton}>
                        <ThemedText style={styles.applyButtonText}>Xem chi tiết</ThemedText>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <IconSymbol name="bookmark" size={80} color={colors.icon} />
            <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
                {expiredJobsCount > 0 ? "Không có công việc nào còn hiệu lực" : "Chưa có công việc nào được lưu"}
            </ThemedText>
            <ThemedText style={[styles.emptySubtitle, { color: colors.icon }]}>
                {expiredJobsCount > 0 ? `Bạn đã có ${expiredJobsCount} công việc đã hết hạn bị xóa khỏi hệ thống.` : "Hãy lưu những công việc yêu thích để xem lại sau"}
            </ThemedText>

            <TouchableOpacity style={[styles.browseButton, { backgroundColor: colors.tint }]} onPress={() => router.push("/(tabs)/jobs")} activeOpacity={0.8}>
                <IconSymbol name="magnifyingglass" size={16} color="white" />
                <ThemedText style={styles.browseButtonText}>Tìm việc làm</ThemedText>
            </TouchableOpacity>
        </View>
    );

    return (
        <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} />
            {renderHeader()}

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[colors.tint]}
                        tintColor={colors.tint}
                        title="Đang tải lại..."
                        titleColor={colors.text}
                    />
                }
            >
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ThemedText style={[styles.loadingText, { color: colors.text }]}>Đang tải...</ThemedText>
                    </View>
                ) : savedJobs.data.length > 0 ? (
                    <>
                        <View style={styles.jobsList}>{savedJobs.data.map(renderJobCard)}</View>

                        {currentPage < savedJobs.pagination.totalPages && (
                            <TouchableOpacity style={[styles.loadMoreButton, { backgroundColor: colors.cardBackground }]} onPress={loadMore} activeOpacity={0.8}>
                                <ThemedText style={[styles.loadMoreText, { color: colors.tint }]}>Xem thêm</ThemedText>
                            </TouchableOpacity>
                        )}
                    </>
                ) : (
                    renderEmptyState()
                )}
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
    headerSubtitle: {
        fontSize: 14,
        color: "rgba(255,255,255,0.8)",
        marginTop: 2,
    },
    searchButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
    },
    content: {
        flex: 1,
    },
    jobsList: {
        padding: 16,
        gap: 16,
    },
    jobCard: {
        padding: 16,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    jobHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    companyInfo: {
        flexDirection: "row",
        alignItems: "flex-start",
        flex: 1,
        gap: 12,
    },
    companyLogo: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    jobTitleContainer: {
        flex: 1,
    },
    jobTitle: {
        fontSize: 16,
        fontWeight: "600",
        lineHeight: 22,
    },
    companyName: {
        fontSize: 14,
        marginTop: 4,
    },
    bookmarkButton: {
        padding: 8,
    },
    jobDetails: {
        flexDirection: "row",
        gap: 16,
        marginBottom: 12,
    },
    jobDetailItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    jobDetailText: {
        fontSize: 12,
    },
    skillsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 12,
    },
    skillTag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    skillText: {
        fontSize: 12,
    },
    jobFooter: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    postedDate: {
        fontSize: 12,
    },
    applyButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    applyButtonText: {
        fontSize: 12,
        fontWeight: "600",
        color: "white",
    },
    emptyState: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
        minHeight: 400,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "600",
        marginTop: 16,
        textAlign: "center",
    },
    emptySubtitle: {
        fontSize: 14,
        marginTop: 8,
        textAlign: "center",
        lineHeight: 20,
    },
    browseButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 24,
    },
    browseButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: "white",
    },
    loadingContainer: {
        padding: 40,
        alignItems: "center",
    },
    loadingText: {
        fontSize: 16,
    },
    loadMoreButton: {
        margin: 16,
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
    },
    loadMoreText: {
        fontSize: 14,
        fontWeight: "600",
    },
});
