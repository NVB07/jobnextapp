import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    View,
    Alert,
    Dimensions,
    StatusBar,
    RefreshControl,
    ActivityIndicator,
    Modal,
    ToastAndroid,
    Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { auth } from "../../config/firebase";
import * as DocumentPicker from "expo-document-picker";
import ENV from "../../config/env";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "../../contexts/AuthContext";
import { useAuthGuard } from "../../hooks/useAuthGuard";
import { apiService, listsCache, UserData } from "../../services/api";

const { width } = Dimensions.get("window");

interface UserStats {
    interviews: number;
    savedJobs: number;
    expiredJobs: number;
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
        expiredJobs: 0,
    });
    const [refreshing, setRefreshing] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [cvUploadModalVisible, setCvUploadModalVisible] = useState(false);
    const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerResult | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatusText, setUploadStatusText] = useState("");
    const [showUploadProgress, setShowUploadProgress] = useState(false);
    const [uploadComplete, setUploadComplete] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(true);
    const toastId = useRef<string | null>(null);
    const [userCVData, setUserCVData] = useState<UserData | null>(null);

    // Fetch user statistics
    const fetchUserStats = async () => {
        if (!user?.uid) return;

        try {
            // Get token for interviews API
            const currentUser = auth.currentUser;
            const token = currentUser ? await currentUser.getIdToken() : "";

            // Fetch both data in parallel
            const [savedJobsResult, interviewsResult] = await Promise.all([
                apiService.getSavedJobs(user.uid, 1, 1000), // Get large page to get all jobs for calculation
                apiService.getInterviewsCount(user.uid, token),
            ]);

            const totalSavedJobIds = savedJobsResult.pagination.totalJobs; // Total job IDs saved (including expired)
            const actualJobsCount = savedJobsResult.data.length; // Actual jobs that still exist in DB
            const expiredJobsCount = Math.max(0, totalSavedJobIds - actualJobsCount);

            setUserStats({
                savedJobs: actualJobsCount,
                interviews: interviewsResult.count,
                expiredJobs: expiredJobsCount,
            });
        } catch (error) {
            console.error("Error fetching user stats:", error);
            // Keep default values on error
        }
    };

    // Fetch user CV data
    const fetchUserCVData = async () => {
        if (!user?.uid) return;

        try {
            const data = await apiService.getUserData(user.uid);
            setUserCVData(data);
        } catch (error) {
            console.error("Error fetching user CV data:", error);
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
        await Promise.all([fetchUserStats(), fetchUserCVData()]);
        setRefreshing(false);
    };

    useEffect(() => {
        if (isAuthenticated && user?.uid) {
            fetchUserStats();
            fetchUserCVData();
        }
    }, [isAuthenticated, user?.uid]);

    // Auto refresh when screen comes into focus (e.g., when returning from saved-jobs, interviews, or profile-form)
    useFocusEffect(
        useCallback(() => {
            if (isAuthenticated && user?.uid) {
                console.log("Profile screen focused - refreshing all data");

                // Clear cache to ensure fresh data after potential profile updates
                listsCache.clearUserCache(user.uid);

                // Reload all profile-related data
                fetchUserStats();
                fetchUserCVData();
            }
        }, [isAuthenticated, user?.uid])
    );

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

    const handleEditPress = () => {
        setEditModalVisible(true);
    };

    const handleEditOption = (option: string) => {
        setEditModalVisible(false);
        if (option === "form") {
            // Navigate to profile form screen
            router.push("/profile-form");
        } else if (option === "cv") {
            // Show CV upload modal
            setCvUploadModalVisible(true);
        }
    };

    const showToast = (message: string) => {
        if (Platform.OS === "android") {
            ToastAndroid.show(message, ToastAndroid.SHORT);
        } else {
            // On iOS we would use a custom toast component
            // For now we'll use console.log
            console.log(message);
        }
    };

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ["application/pdf"],
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setSelectedFile(result);
            }
        } catch (error) {
            Alert.alert("Lỗi", "Không thể chọn file CV");
            console.error(error);
        }
    };

    const handleCloseUploadProgress = () => {
        setShowUploadProgress(false);
        setUploadComplete(false);
        setUploadProgress(0);
        setUploadStatusText("");
    };

    const handleUploadCV = async () => {
        if (!selectedFile || selectedFile.canceled || !user?.uid) {
            Alert.alert("Thông báo", "Vui lòng chọn file PDF trước khi tải lên");
            return;
        }

        try {
            // Close modal first to allow user to continue using the app
            setCvUploadModalVisible(false);

            // Reset upload status before starting
            setUploadComplete(false);
            setUploadSuccess(true);

            // Show upload progress UI
            setShowUploadProgress(true);
            setIsUploading(true);

            const fileUri = selectedFile.assets[0].uri;
            const fileName = selectedFile.assets[0].name;
            const fileType = "application/pdf";

            // Use the API service for upload with progress tracking
            await apiService.uploadCVWithProgress(user.uid, fileUri, fileName, fileType, {
                // Handle progress updates
                onProgress: (data) => {
                    setUploadProgress(data.progress);
                    setUploadStatusText(data.message || "");
                },

                // Handle completion
                onComplete: (data) => {
                    setUploadProgress(100);
                    setUploadStatusText(data.message || "Hoàn thành!");
                    setUploadComplete(true);
                    setUploadSuccess(true);

                    // Reset states after completion
                    setSelectedFile(null);
                    setIsUploading(false);

                    // Clear cache after CV upload to ensure fresh data
                    if (user?.uid) {
                        listsCache.clearUserCache(user.uid);
                        console.log("🔄 CV uploaded successfully - clearing cache and reloading data");
                    }

                    // Reload all user-related data
                    fetchUserStats();
                    fetchUserCVData();
                },

                // Handle errors
                onError: (error) => {
                    console.error("Upload error:", error);
                    setUploadStatusText(error.message || "Tải lên thất bại");
                    setUploadComplete(true);
                    setUploadSuccess(false);
                    setIsUploading(false);
                },
            });
        } catch (error) {
            console.error("Error in handleUploadCV:", error);
            setUploadStatusText("Lỗi xử lý");
            setUploadComplete(true);
            setUploadSuccess(false);
            setIsUploading(false);
        }
    };

    const StatCard = ({
        title,
        value,
        icon,
        gradient,
        onPress,
        subtitle,
    }: {
        title: string;
        value: number;
        icon: string;
        gradient: [string, string];
        onPress?: () => void;
        subtitle?: string;
    }) => (
        <TouchableOpacity style={[styles.statCard, { backgroundColor: colors.cardBackground }]} onPress={onPress} activeOpacity={onPress ? 0.8 : 1}>
            <LinearGradient colors={gradient} style={styles.statIcon}>
                <IconSymbol name={icon as any} size={20} color="white" />
            </LinearGradient>

            <View style={styles.statInfo}>
                <ThemedText style={[styles.statValue, { color: colors.text }]}>{value}</ThemedText>
                <ThemedText style={[styles.statTitle, { color: colors.icon }]}>{title}</ThemedText>
                {subtitle && <ThemedText style={[styles.statSubtitle, { color: colors.icon }]}>{subtitle}</ThemedText>}
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
                        <ThemedText style={styles.userName}>{userCVData?.userData?.profile?.Name || user?.displayName || user?.email || "Người dùng"}</ThemedText>
                        {userCVData?.userData?.profile?.Job_position && <ThemedText style={styles.userTitle}>{userCVData.userData.profile.Job_position}</ThemedText>}
                        {userCVData?.userData?.profile?.Address && <ThemedText style={styles.userLocation}>{userCVData.userData.profile.Address}</ThemedText>}
                    </View>
                </View>

                <TouchableOpacity style={styles.editButton} onPress={handleEditPress}>
                    <IconSymbol name="pencil" size={16} color="white" />
                    <ThemedText style={styles.editButtonText}>Chỉnh sửa - Cập nhật</ThemedText>
                </TouchableOpacity>
            </LinearGradient>

            {/* Edit Options Modal */}
            <Modal animationType="fade" transparent={true} visible={editModalVisible} onRequestClose={() => setEditModalVisible(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setEditModalVisible(false)}>
                    <View style={[styles.modalContainer, { backgroundColor: colors.cardBackground }]}>
                        <View style={styles.modalContent}>
                            <ThemedText style={[styles.modalTitle, { color: colors.text }]}>Chỉnh sửa hồ sơ</ThemedText>

                            <TouchableOpacity style={[styles.modalOption, { backgroundColor: colors.border }]} onPress={() => handleEditOption("form")}>
                                <IconSymbol name="person.text.rectangle" size={22} color={colors.tint} />
                                <ThemedText style={[styles.modalOptionText, { color: colors.text }]}>Nhập thông tin</ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.modalOption, { backgroundColor: colors.border }]} onPress={() => handleEditOption("cv")}>
                                <IconSymbol name="doc.on.doc" size={22} color={colors.tint} />
                                <ThemedText style={[styles.modalOptionText, { color: colors.text }]}>Tải lên CV</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* CV Upload Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={cvUploadModalVisible}
                onRequestClose={() => {
                    setCvUploadModalVisible(false);
                    setSelectedFile(null);
                }}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        activeOpacity={1}
                        style={{ width: "100%", height: "100%", position: "absolute" }}
                        onPress={() => {
                            setCvUploadModalVisible(false);
                            setSelectedFile(null);
                        }}
                    />
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={(e) => {
                            // Stop event propagation
                            e.stopPropagation();
                        }}
                    >
                        <View style={[styles.uploadModalContent, { backgroundColor: colors.background }]}>
                            <View style={styles.uploadModalHeader}>
                                <ThemedText style={[styles.uploadModalTitle, { color: colors.text }]}>Tải lên CV</ThemedText>
                                <TouchableOpacity
                                    onPress={() => {
                                        setCvUploadModalVisible(false);
                                        setSelectedFile(null);
                                    }}
                                >
                                    <IconSymbol name="xmark.circle.fill" size={24} color={colors.icon} />
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={[styles.uploadArea, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                                onPress={pickDocument}
                                activeOpacity={0.8}
                            >
                                <LinearGradient colors={colors.gradient} style={styles.uploadIcon}>
                                    <IconSymbol name="doc.text.fill" size={32} color="white" />
                                </LinearGradient>

                                <ThemedText style={[styles.uploadTitle, { color: colors.text }]}>
                                    {selectedFile && !selectedFile.canceled ? "CV đã chọn" : "Tải lên CV của bạn"}
                                </ThemedText>

                                {selectedFile && !selectedFile.canceled ? (
                                    <ThemedText style={[styles.fileName, { color: colors.success }]}>{selectedFile.assets[0].name}</ThemedText>
                                ) : (
                                    <ThemedText style={[styles.uploadSubtitle, { color: colors.icon }]}>Chỉ hỗ trợ định dạng PDF</ThemedText>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.uploadButton,
                                    {
                                        backgroundColor: selectedFile && !selectedFile.canceled ? colors.tint : colors.border,
                                        opacity: selectedFile && !selectedFile.canceled ? 1 : 0.6,
                                    },
                                ]}
                                onPress={handleUploadCV}
                            >
                                <ThemedText style={styles.uploadButtonText}>Tải lên</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </View>
            </Modal>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 0 }}
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
                {/* CV Upload Progress - Only shown during/after upload */}
                {showUploadProgress && (
                    <View style={styles.uploadProgressSection}>
                        <View style={[styles.uploadProgressCard, { backgroundColor: colors.cardBackground }]}>
                            <View style={styles.uploadProgressHeader}>
                                <ThemedText style={[styles.uploadProgressTitle, { color: colors.text }]}>
                                    {uploadComplete ? (uploadSuccess ? "Tải lên thành công" : "Tải lên thất bại") : "Đang tải lên CV"}
                                </ThemedText>

                                <View style={styles.uploadProgressRight}>
                                    <ThemedText style={[styles.uploadProgressPercent, { color: uploadSuccess ? colors.tint : colors.error }]}>
                                        {uploadProgress}%
                                    </ThemedText>

                                    {uploadComplete && (
                                        <TouchableOpacity onPress={handleCloseUploadProgress} style={styles.closeButton}>
                                            <IconSymbol name="xmark.circle.fill" size={22} color={colors.icon} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>

                            <View style={styles.uploadProgressStatusContainer}>
                                <ThemedText style={[styles.uploadProgressStatus, { color: colors.text }]}>{uploadStatusText}</ThemedText>
                                {isUploading && <ActivityIndicator size="small" color={colors.tint} style={styles.uploadProgressIndicator} />}
                                {uploadComplete && uploadSuccess && <IconSymbol name="checkmark.circle.fill" size={20} color={colors.success} />}
                                {uploadComplete && !uploadSuccess && <IconSymbol name="xmark.circle.fill" size={20} color={colors.error} />}
                            </View>

                            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                                <LinearGradient
                                    colors={uploadSuccess ? colors.gradient : ["#f43f5e", "#ef4444"]}
                                    style={[styles.progressFill, { width: `${uploadProgress}%` }]}
                                />
                            </View>

                            <ThemedText style={[styles.uploadProgressInfo, { color: colors.icon }]}>
                                {uploadComplete
                                    ? uploadSuccess
                                        ? "CV đã được tải lên và phân tích thành công!"
                                        : "Có lỗi xảy ra. Vui lòng thử lại sau."
                                    : "Quá trình tải lên và phân tích có thể mất vài phút..."}
                            </ThemedText>
                        </View>
                    </View>
                )}

                {/* Skills Section */}
                {userCVData?.userData?.profile?.Skills && (
                    <View style={styles.skillsSection}>
                        <View style={[styles.skillsCard, { backgroundColor: colors.cardBackground }]}>
                            <ThemedText style={[styles.skillsTitle, { color: colors.text }]}>Kỹ năng</ThemedText>
                            <ThemedText style={[styles.skillsContent, { color: colors.icon }]}>{userCVData.userData.profile.Skills}</ThemedText>
                        </View>
                    </View>
                )}

                {/* Statistics */}
                <View style={styles.statsSection}>
                    <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Hoạt động</ThemedText>

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
                            subtitle={userStats.expiredJobs > 0 ? `${userStats.expiredJobs} đã hết hạn` : undefined}
                        />
                    </View>
                </View>

                {/* Information */}
                <View style={styles.settingsSection}>
                    <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Thông tin</ThemedText>

                    <View style={styles.settingsGroup}>
                        <SettingItem
                            title="Điều khoản sử dụng"
                            subtitle="Các điều khoản và điều kiện sử dụng"
                            icon="doc.text.fill"
                            onPress={() => router.push("/terms")}
                        />
                        <SettingItem
                            title="Chính sách bảo mật"
                            subtitle="Chính sách bảo vệ thông tin cá nhân"
                            icon="lock.doc.fill"
                            onPress={() => router.push("/privacy")}
                        />
                        <SettingItem
                            title="Thông tin ứng dụng"
                            subtitle="Phiên bản và thông tin chi tiết"
                            icon="info.circle.fill"
                            onPress={() => router.push("/about")}
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
    skillsSection: {
        padding: 24,
    },
    skillsCard: {
        padding: 20,
        borderRadius: 16,
        gap: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
    },
    skillsTitle: {
        fontSize: 18,
        fontWeight: "bold",
    },
    skillsContent: {
        fontSize: 14,
        lineHeight: 20,
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
    statsSection: {
        paddingHorizontal: 24,
        marginBottom: 24,
        gap: 16,
    },
    sectionTitle: {
        marginTop: 16,
        fontSize: 20,
        fontWeight: "bold",
    },
    statsGrid: {
        flexWrap: "wrap",
        gap: 12,
    },
    statCard: {
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
    statSubtitle: {
        fontSize: 12,
        marginTop: 2,
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
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContainer: {
        width: width * 0.85,
        borderRadius: 20,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    modalContent: {
        padding: 24,
        gap: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 8,
        textAlign: "center",
    },
    modalOption: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderRadius: 12,
        gap: 12,
    },
    modalOptionText: {
        fontSize: 16,
        fontWeight: "500",
    },
    // CV Upload Modal Styles
    uploadModalContent: {
        width: width * 0.85,
        borderRadius: 20,
        padding: 24,
        backgroundColor: "#fff",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    uploadModalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
    },
    uploadModalTitle: {
        fontSize: 20,
        fontWeight: "bold",
    },
    uploadModalBody: {
        gap: 24,
    },
    uploadArea: {
        padding: 24,
        borderRadius: 16,
        borderWidth: 1,
        borderStyle: "dashed",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
    },
    uploadIcon: {
        width: 64,
        height: 64,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    uploadTitle: {
        fontSize: 18,
        fontWeight: "bold",
    },
    uploadSubtitle: {
        fontSize: 14,
        textAlign: "center",
    },
    fileName: {
        fontSize: 14,
        fontWeight: "500",
    },
    uploadButton: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 8,
    },
    uploadButtonText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "white",
    },
    uploadProgressSection: {
        padding: 24,
    },
    uploadProgressCard: {
        padding: 20,
        borderRadius: 16,
        gap: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
    },
    uploadProgressHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    uploadProgressTitle: {
        fontSize: 18,
        fontWeight: "bold",
        flex: 1,
    },
    uploadProgressRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    uploadProgressPercent: {
        fontSize: 18,
        fontWeight: "bold",
    },
    uploadProgressStatusContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 4,
    },
    uploadProgressStatus: {
        fontSize: 16,
        fontWeight: "500",
        flex: 1,
    },
    uploadProgressIndicator: {
        marginLeft: 8,
    },
    uploadProgressInfo: {
        fontSize: 12,
        lineHeight: 16,
        marginTop: 4,
    },
    closeButton: {
        padding: 4,
    },
});
