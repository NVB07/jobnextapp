import React, { useState, useEffect } from "react";
import { StyleSheet, ScrollView, TouchableOpacity, View, Alert, Dimensions, StatusBar, RefreshControl } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useNavigation } from "expo-router";
import { useLayoutEffect } from "react";
import { auth } from "../config/firebase";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuthGuard } from "../hooks/useAuthGuard";
import { apiService, listsCache, interviewService } from "../services/api";

const { width } = Dimensions.get("window");

interface InterviewsResponse {
    data: any[];
    pagination: {
        currentPage: number;
        perPage: number;
        totalPages: number;
        totalJobs: number;
    };
}

interface InterviewScore {
    message: string;
    pass: number | null;
    state: boolean;
}

export default function InterviewsScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();

    const [interviews, setInterviews] = useState<InterviewsResponse>({
        data: [],
        pagination: { currentPage: 1, perPage: 10, totalPages: 1, totalJobs: 0 },
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);

    // Authentication guard
    const { user, loading: authLoading, isAuthenticated } = useAuthGuard();

    // Hide the default header
    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    // Show loading if still checking auth
    if (authLoading || !isAuthenticated) {
        return <ThemedView style={styles.container} />;
    }

    // Parse interview score from chat history
    const parseInterviewScore = (interview: any): InterviewScore => {
        try {
            if (!interview.chatHistory || interview.chatHistory.length === 0) {
                return { message: "", pass: null, state: true };
            }

            const lastMessage = interview.chatHistory[interview.chatHistory.length - 1];
            const rawText = lastMessage.parts[0].text.replace(/```json|```/g, "").trim();
            return JSON.parse(rawText);
        } catch (error) {
            // Fallback parsing for malformed JSON
            const raw = interview.chatHistory?.[interview.chatHistory.length - 1]?.parts[0]?.text || "";
            const messageMatch = raw.match(/"message"\s*:\s*"([^"]+)"/);
            const passMatch = raw.match(/"pass"\s*:\s*(\d+|null)/);
            const stateMatch = raw.match(/"state"\s*:\s*(true|false)/);

            return {
                message: messageMatch ? messageMatch[1] : "",
                pass: passMatch ? (passMatch[1] === "null" ? null : parseInt(passMatch[1])) : null,
                state: stateMatch ? stateMatch[1] === "true" : true,
            };
        }
    };

    // Fetch interviews
    const fetchInterviews = async (page = 1, forceRefresh = false) => {
        if (!user?.uid) return;

        try {
            const currentUser = auth.currentUser;
            const token = currentUser ? await currentUser.getIdToken() : "";

            const response = await apiService.getInterviews(user.uid, token, page, 10, forceRefresh);
            setInterviews(response);
            setCurrentPage(page);
        } catch (error) {
            console.error("Error fetching interviews:", error);
            Alert.alert("Lỗi", "Không thể tải danh sách phỏng vấn");
        } finally {
            setLoading(false);
        }
    };

    // Handle pull to refresh
    const onRefresh = async () => {
        setRefreshing(true);
        // Clear cache for this user and force refresh
        if (user?.uid) {
            listsCache.clearUserCache(user.uid);
        }
        await fetchInterviews(1, true);
        setRefreshing(false);
    };

    // Load more interviews
    const loadMore = async () => {
        if (currentPage < interviews.pagination.totalPages) {
            await fetchInterviews(currentPage + 1);
        }
    };

    // Delete interview
    const deleteInterview = async (interviewId: string) => {
        try {
            const currentUser = auth.currentUser;
            const token = currentUser ? await currentUser.getIdToken() : "";
            if (!token) {
                Alert.alert("Lỗi", "Không thể xác thực người dùng");
                return;
            }

            Alert.alert("Xóa phỏng vấn", "Bạn có chắc muốn xóa cuộc phỏng vấn này?", [
                { text: "Hủy", style: "cancel" },
                {
                    text: "Xóa",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setDeleting(true);
                            // Call delete API
                            const result = await interviewService.deleteInterview(interviewId, token);

                            if (result.success) {
                                // Remove interview from the list
                                setInterviews((prev) => ({
                                    ...prev,
                                    data: prev.data.filter((item) => item._id !== interviewId),
                                    pagination: {
                                        ...prev.pagination,
                                        totalJobs: prev.pagination.totalJobs - 1,
                                    },
                                }));

                                // Refresh list if needed
                                if (interviews.data.length <= 1 && currentPage > 1) {
                                    await fetchInterviews(currentPage - 1, true);
                                }

                                Alert.alert("Thành công", "Đã xóa phỏng vấn");
                            } else {
                                Alert.alert("Lỗi", "Không thể xóa phỏng vấn");
                            }
                        } catch (error) {
                            console.error("Error deleting interview:", error);
                            Alert.alert("Lỗi", "Không thể xóa phỏng vấn");
                        } finally {
                            setDeleting(false);
                        }
                    },
                },
            ]);
        } catch (error) {
            console.error("Error preparing to delete interview:", error);
            Alert.alert("Lỗi", "Không thể xóa phỏng vấn");
        }
    };

    useEffect(() => {
        fetchInterviews(1);
    }, [user?.uid]);

    const renderHeader = () => (
        <LinearGradient colors={colors.gradient} style={[styles.header, { paddingTop: insets.top + 10 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={styles.headerContent}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
                    <IconSymbol name="chevron.left" size={20} color="white" />
                </TouchableOpacity>

                <View style={styles.headerTextContainer}>
                    <ThemedText style={styles.headerTitle}>Phỏng vấn đã làm</ThemedText>
                    <ThemedText style={styles.headerSubtitle}>{interviews.pagination.totalJobs} cuộc phỏng vấn</ThemedText>
                </View>

                <TouchableOpacity style={styles.addButton} onPress={() => router.push("/(tabs)/virtual-interview")} activeOpacity={0.7}>
                    <IconSymbol name="plus" size={20} color="white" />
                </TouchableOpacity>
            </View>
        </LinearGradient>
    );

    const renderInterviewCard = (interview: any) => {
        const score = parseInterviewScore(interview);
        const createdDate = new Date(interview.createdAt).toLocaleDateString("vi-VN");

        return (
            <View key={interview._id} style={[styles.interviewCard, { backgroundColor: colors.cardBackground }]}>
                <View style={styles.interviewHeader}>
                    <View style={styles.interviewInfo}>
                        <ThemedText style={[styles.interviewTitle, { color: colors.text }]} numberOfLines={2}>
                            {interview.jobTitle}
                        </ThemedText>

                        <View style={styles.interviewMeta}>
                            <View style={styles.metaItem}>
                                <IconSymbol name="folder.fill" size={12} color={colors.icon} />
                                <ThemedText style={[styles.metaText, { color: colors.icon }]}>
                                    {interview.jobSource === "admin" || interview.jobSource === "vietnamworks" ? "Có sẵn trên hệ thống" : "Tự tạo"}
                                </ThemedText>
                            </View>

                            <View style={styles.metaItem}>
                                <IconSymbol name="calendar" size={12} color={colors.icon} />
                                <ThemedText style={[styles.metaText, { color: colors.icon }]}>{createdDate}</ThemedText>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.deleteButton} onPress={() => deleteInterview(interview._id)} activeOpacity={0.7}>
                        <IconSymbol name="trash" size={16} color="#ff4757" />
                    </TouchableOpacity>
                </View>

                {/* Skills */}
                {interview.skills && (
                    <View style={styles.skillsContainer}>
                        <ThemedText style={[styles.skillsLabel, { color: colors.text }]}>Kỹ năng:</ThemedText>
                        <View style={styles.skillsList}>
                            {interview.skills
                                .split(",")
                                .slice(0, 3)
                                .map((skill: string, index: number) => {
                                    const gradientColors = [
                                        ["#6366f1", "#8b5cf6"],
                                        ["#10b981", "#34d399"],
                                        ["#f59e0b", "#fbbf24"],
                                    ];

                                    return (
                                        <View key={index} style={[styles.skillTag, { backgroundColor: colors.border }]}>
                                            <ThemedText style={styles.skillText}>{skill.trim()}</ThemedText>
                                        </View>
                                    );
                                })}
                        </View>
                    </View>
                )}

                {/* Status */}
                <View style={styles.statusContainer}>
                    {/* <ThemedText style={[styles.statusLabel, { color: colors.text }]}>Trạng thái:</ThemedText> */}
                    <View style={styles.statusValue}>
                        {!score.state && score.pass === null && (
                            <View style={[styles.statusBadge, { backgroundColor: "#ff4757" }]}>
                                <ThemedText style={styles.statusText}>Phỏng vấn bị hủy</ThemedText>
                            </View>
                        )}

                        {!score.state && score.pass !== null && (
                            <View style={[styles.statusBadge, { backgroundColor: "#2ed573" }]}>
                                <ThemedText style={styles.statusText}>Hoàn thành</ThemedText>
                            </View>
                        )}

                        {score.state && score.pass === null && (
                            <View style={[styles.statusBadge, { backgroundColor: "#ffa502" }]}>
                                <ThemedText style={styles.statusText}>Chưa hoàn thành</ThemedText>
                            </View>
                        )}
                    </View>
                </View>

                {/* Score Progress */}
                {score.pass !== null && (
                    <View style={styles.scoreContainer}>
                        <View style={styles.scoreHeader}>
                            <ThemedText style={[styles.scoreLabel, { color: colors.text }]}>Tỉ lệ đạt:</ThemedText>
                            <ThemedText style={[styles.scoreValue, { color: colors.tint }]}>{score.pass}%</ThemedText>
                        </View>

                        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                            <LinearGradient colors={["#6366f1", "#8b5cf6"]} style={[styles.progressFill, { width: `${score.pass}%` }]} />
                        </View>
                    </View>
                )}

                <View style={styles.interviewFooter}>
                    <TouchableOpacity
                        onPress={() => {
                            router.push({
                                pathname: "/interview-chat",
                                params: {
                                    interviewId: interview._id,
                                    fromInterviewsList: "true",
                                    jobTitle: interview.jobTitle || "Phỏng vấn",
                                },
                            });
                        }}
                        activeOpacity={0.8}
                    >
                        <LinearGradient colors={["#6366f1", "#8b5cf6"]} style={styles.viewButton}>
                            <IconSymbol name="eye.fill" size={12} color="white" />
                            <ThemedText style={styles.viewButtonText}>Xem phỏng vấn</ThemedText>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <IconSymbol name="person.2" size={80} color={colors.icon} />
            <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>Chưa có phỏng vấn nào</ThemedText>
            <ThemedText style={[styles.emptySubtitle, { color: colors.icon }]}>Hãy bắt đầu cuộc phỏng vấn ảo đầu tiên của bạn</ThemedText>

            <TouchableOpacity style={[styles.startButton, { backgroundColor: colors.tint }]} onPress={() => router.push("/(tabs)/virtual-interview")} activeOpacity={0.8}>
                <IconSymbol name="video.fill" size={16} color="white" />
                <ThemedText style={styles.startButtonText}>Bắt đầu phỏng vấn</ThemedText>
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
                ) : interviews.data.length > 0 ? (
                    <>
                        <View style={styles.interviewsList}>{interviews.data.map(renderInterviewCard)}</View>

                        {currentPage < interviews.pagination.totalPages && (
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
    addButton: {
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
    interviewsList: {
        padding: 16,
        gap: 16,
    },
    interviewCard: {
        padding: 16,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    interviewHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    interviewInfo: {
        flex: 1,
    },
    interviewTitle: {
        fontSize: 16,
        fontWeight: "600",
        lineHeight: 22,
        marginBottom: 8,
    },
    interviewMeta: {
        gap: 8,
    },
    metaItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    metaText: {
        fontSize: 12,
    },
    deleteButton: {
        padding: 8,
    },
    skillsContainer: {
        marginBottom: 12,
    },
    skillsLabel: {
        fontSize: 14,
        fontWeight: "500",
        marginBottom: 8,
    },
    skillsList: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    skillTag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    skillText: {
        fontSize: 12,
        color: "white",
        fontWeight: "500",
    },
    statusContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    statusLabel: {
        fontSize: 14,
        fontWeight: "500",
        marginRight: 8,
    },
    statusValue: {},
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 12,
        color: "white",
        fontWeight: "500",
    },
    scoreContainer: {
        marginBottom: 12,
    },
    scoreHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    scoreLabel: {
        fontSize: 14,
        fontWeight: "500",
    },
    scoreValue: {
        fontSize: 16,
        fontWeight: "bold",
    },
    progressBar: {
        height: 6,
        borderRadius: 3,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        borderRadius: 3,
    },
    interviewFooter: {
        alignItems: "flex-end",
    },
    viewButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    viewButtonText: {
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
    startButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 24,
    },
    startButtonText: {
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
