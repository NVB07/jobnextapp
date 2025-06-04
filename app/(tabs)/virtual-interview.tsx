import React, { useState, useEffect } from "react";
import { StyleSheet, ScrollView, TouchableOpacity, View, Alert, Dimensions, StatusBar, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/contexts/AuthContext";
import { apiService, UserData } from "@/services/api";

const { width } = Dimensions.get("window");

export default function VirtualInterviewScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const params = useLocalSearchParams();

    // Parse job data from params if coming from job detail
    const fromJobDetail = params.fromJobDetail === "true";
    const jobData = fromJobDetail
        ? {
              id: params.jobId as string,
              title: params.jobTitle as string,
              description: params.jobDescription as string,
              requirements: params.jobRequirements as string,
              company: params.company as string,
          }
        : null;

    // User data state
    const [userData, setUserData] = useState<UserData | null>(null);
    const [userDataLoading, setUserDataLoading] = useState(false);

    // Form state for custom interview
    const [customJobTitle, setCustomJobTitle] = useState("");
    const [customJobRequirements, setCustomJobRequirements] = useState("");

    // User info selection
    const [useUserReview, setUseUserReview] = useState(true);
    const [customUserInfo, setCustomUserInfo] = useState("");

    // Loading state
    const [isStarting, setIsStarting] = useState(false);

    // Tab state
    const [activeTab, setActiveTab] = useState<"available" | "custom">(fromJobDetail ? "available" : "custom");

    // Expand/collapse state for job content
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [isRequirementsExpanded, setIsRequirementsExpanded] = useState(false);

    // Fetch user data
    useEffect(() => {
        const fetchUserData = async () => {
            if (!user?.uid) {
                setUserData(null);
                return;
            }

            setUserDataLoading(true);
            try {
                const data = await apiService.getUserData(user.uid);
                setUserData(data);
                console.log("✅ User data loaded:", {
                    hasReview: !!data?.userData?.review,
                    reviewLength: data?.userData?.review?.length || 0,
                });

                // Auto-select user review if available
                if (data?.userData?.review && data.userData.review.trim()) {
                    setUseUserReview(true);
                } else {
                    setUseUserReview(false);
                }
            } catch (error) {
                console.error("❌ Error fetching user data:", error);
                setUserData(null);
                setUseUserReview(false);
            } finally {
                setUserDataLoading(false);
            }
        };

        fetchUserData();
    }, [user?.uid]);

    const handleStartInterview = async () => {
        // Validate based on active tab
        if (activeTab === "custom") {
            if (!customJobTitle.trim()) {
                Alert.alert("Lỗi", "Vui lòng nhập tên công việc");
                return;
            }
            if (!customJobRequirements.trim()) {
                Alert.alert("Lỗi", "Vui lòng nhập yêu cầu công việc");
                return;
            }
        } else if (activeTab === "available") {
            // Check if job data is available for "available" tab
            if (!fromJobDetail || !jobData) {
                Alert.alert("Chưa chọn công việc", "Vui lòng chọn một công việc từ danh sách trước", [
                    { text: "Hủy", style: "cancel" },
                    { text: "Xem việc làm", onPress: () => router.push("/(tabs)/jobs") },
                ]);
                return;
            }
        }

        if (!useUserReview && !customUserInfo.trim()) {
            Alert.alert("Lỗi", "Vui lòng nhập thông tin của bạn hoặc chọn sử dụng thông tin có sẵn");
            return;
        }

        if (useUserReview && !userData?.userData?.review?.trim()) {
            Alert.alert("Lỗi", "Không có thông tin cá nhân trong hệ thống. Vui lòng nhập thông tin riêng");
            return;
        }

        setIsStarting(true);

        // Prepare interview data based on active tab
        const interviewData = {
            jobTitle: activeTab === "available" ? jobData?.title : customJobTitle,
            jobDescription: activeTab === "available" ? jobData?.description : "",
            jobRequirements: activeTab === "available" ? jobData?.requirements : customJobRequirements,
            company: activeTab === "available" ? jobData?.company : "",
            userInfo: useUserReview ? userData?.userData?.review : customUserInfo,
            userId: user?.uid,
            createdAt: new Date().toISOString(),
            interviewType: activeTab,
        };

        console.log("🎯 Starting interview with data:", interviewData);

        // TODO: Implement interview start logic here
        setTimeout(() => {
            setIsStarting(false);
            Alert.alert("Sắp có", "Tính năng phỏng vấn ảo đang được phát triển và sẽ có sớm!");
        }, 2000);
    };

    const formatJobContent = (content: string) => {
        if (!content) return "";
        return content
            .replace(/\r\n/g, "\n") // Normalize line endings
            .replace(/\r/g, "\n") // Normalize line endings
            .replace(/\n\s*\n\s*\n/g, "\n\n") // Replace multiple newlines with double newlines
            .replace(/^\s+|\s+$/g, "") // Trim leading/trailing whitespace
            .replace(/[ \t]+/g, " ") // Replace multiple spaces/tabs with single space
            .trim();
    };

    // Expandable Text Component
    const ExpandableText = ({ content, isExpanded, onToggle, maxLines = 3 }: { content: string; isExpanded: boolean; onToggle: () => void; maxLines?: number }) => {
        const formattedContent = formatJobContent(content);
        const shouldShowToggle = formattedContent.length > 150; // Show toggle if content is long

        return (
            <View style={[styles.jobContentContainer, { backgroundColor: colors.cardBackground }]}>
                <ThemedText style={[styles.jobContentText, { color: colors.text }]} numberOfLines={isExpanded ? undefined : shouldShowToggle ? maxLines : undefined}>
                    {formattedContent}
                </ThemedText>

                {shouldShowToggle && (
                    <TouchableOpacity style={styles.expandButton} onPress={onToggle} activeOpacity={0.7}>
                        <ThemedText style={[styles.expandButtonText, { color: colors.tint }]}>{isExpanded ? "Thu gọn" : "Xem thêm"}</ThemedText>
                        <IconSymbol name={isExpanded ? "chevron.up" : "chevron.down"} size={14} color={colors.tint} />
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    const renderHeader = () => (
        <LinearGradient colors={colors.gradient} style={[styles.header, { paddingTop: insets.top }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={styles.headerContent}>
                <View style={styles.headerText}>
                    <ThemedText style={styles.headerTitle}>Phỏng vấn ảo</ThemedText>
                    {/* <ThemedText style={styles.headerSubtitle}>Luyện tập và chuẩn bị cho cuộc phỏng vấn với AI thông minh</ThemedText> */}
                </View>
            </View>

            {/* Tab Selector */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[
                        styles.tab,
                        activeTab === "available" && styles.activeTab,
                        { backgroundColor: activeTab === "available" ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.05)" },
                    ]}
                    onPress={() => setActiveTab("available")}
                    activeOpacity={0.8}
                >
                    <IconSymbol name="briefcase.fill" size={16} color={activeTab === "available" ? "white" : "rgba(255,255,255,0.6)"} />
                    <ThemedText style={[styles.tabText, { color: activeTab === "available" ? "white" : "rgba(255,255,255,0.6)" }]}>Job có sẵn</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.tab,
                        activeTab === "custom" && styles.activeTab,
                        { backgroundColor: activeTab === "custom" ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.05)" },
                    ]}
                    onPress={() => setActiveTab("custom")}
                    activeOpacity={0.8}
                >
                    <IconSymbol name="square.and.pencil" size={16} color={activeTab === "custom" ? "white" : "rgba(255,255,255,0.6)"} />
                    <ThemedText style={[styles.tabText, { color: activeTab === "custom" ? "white" : "rgba(255,255,255,0.6)" }]}>Tùy chỉnh</ThemedText>
                </TouchableOpacity>
            </View>
        </LinearGradient>
    );

    const renderJobInfo = () => {
        if (activeTab !== "available") return null;

        // If coming from job detail, show job info
        if (fromJobDetail && jobData) {
            return (
                <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
                    <View style={styles.sectionHeader}>
                        <IconSymbol name="briefcase.fill" size={16} color={colors.tint} />
                        <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Thông tin công việc đã chọn</ThemedText>
                    </View>

                    {/* <View style={[styles.jobInfoCard, { backgroundColor: colors.background }]}> */}
                    <View style={styles.jobInfoItem}>
                        <ThemedText style={[styles.jobInfoLabel, { color: colors.icon }]}>Vị trí</ThemedText>
                        <ThemedText style={[styles.jobInfoValue, { color: colors.text }]}>{jobData.title}</ThemedText>
                    </View>

                    <View style={styles.jobInfoItem}>
                        <ThemedText style={[styles.jobInfoLabel, { color: colors.icon }]}>Công ty</ThemedText>
                        <ThemedText style={[styles.jobInfoValue, { color: colors.text }]}>{jobData.company}</ThemedText>
                    </View>

                    {/* Full Job Description */}
                    {jobData.description && (
                        <View style={styles.jobInfoItem}>
                            <ThemedText style={[styles.jobInfoLabel, { color: colors.icon }]}>Mô tả công việc</ThemedText>
                            <ExpandableText
                                content={jobData.description}
                                isExpanded={isDescriptionExpanded}
                                onToggle={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                            />
                        </View>
                    )}

                    {/* Full Job Requirements */}
                    <View style={styles.jobInfoItem}>
                        <ThemedText style={[styles.jobInfoLabel, { color: colors.icon }]}>Yêu cầu công việc</ThemedText>
                        <ExpandableText
                            content={jobData.requirements || "Không có thông tin yêu cầu cụ thể"}
                            isExpanded={isRequirementsExpanded}
                            onToggle={() => setIsRequirementsExpanded(!isRequirementsExpanded)}
                        />
                    </View>

                    {/* Change Job Button */}
                    <TouchableOpacity
                        style={[styles.changeJobButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                        onPress={() => router.push("/(tabs)/jobs")}
                        activeOpacity={0.8}
                    >
                        <IconSymbol name="arrow.triangle.2.circlepath" size={16} color={colors.tint} />
                        <ThemedText style={[styles.changeJobButtonText, { color: colors.tint }]}>Chọn công việc khác</ThemedText>
                    </TouchableOpacity>
                    {/* </View> */}
                </View>
            );
        }

        // If no job selected, show option to go to jobs page
        return (
            <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
                <View style={styles.sectionHeader}>
                    <IconSymbol name="briefcase.fill" size={16} color={colors.tint} />
                    <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Chọn công việc</ThemedText>
                </View>

                <View style={[styles.noJobContainer, { backgroundColor: colors.background }]}>
                    <IconSymbol name="folder.fill" size={48} color={colors.icon} />
                    <ThemedText style={[styles.noJobTitle, { color: colors.text }]}>Chưa chọn công việc</ThemedText>
                    <ThemedText style={[styles.noJobSubtitle, { color: colors.icon }]}>Hãy chọn một công việc từ danh sách để bắt đầu phỏng vấn ảo</ThemedText>

                    <TouchableOpacity style={[styles.goToJobsButton, { backgroundColor: colors.tint }]} onPress={() => router.push("/(tabs)/jobs")} activeOpacity={0.8}>
                        <IconSymbol name="arrow.right" size={16} color="white" />
                        <ThemedText style={styles.goToJobsButtonText}>Chọn việc làm</ThemedText>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderCustomJobForm = () => {
        if (activeTab !== "custom") return null;

        return (
            <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
                <View style={styles.sectionHeader}>
                    <IconSymbol name="square.and.pencil" size={16} color={colors.tint} />
                    <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Thông tin công việc</ThemedText>
                </View>

                <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                        <ThemedText style={[styles.inputLabel, { color: colors.text }]}>Tên công việc *</ThemedText>
                        <TextInput
                            style={[
                                styles.textInput,
                                {
                                    backgroundColor: colors.background,
                                    borderColor: colors.border,
                                    color: colors.text,
                                },
                            ]}
                            placeholder="Ví dụ: Frontend Developer, Marketing Manager..."
                            placeholderTextColor={colors.icon}
                            value={customJobTitle}
                            onChangeText={setCustomJobTitle}
                            multiline={false}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <ThemedText style={[styles.inputLabel, { color: colors.text }]}>Yêu cầu công việc *</ThemedText>
                        <TextInput
                            style={[
                                styles.textAreaInput,
                                {
                                    backgroundColor: colors.background,
                                    borderColor: colors.border,
                                    color: colors.text,
                                },
                            ]}
                            placeholder="Mô tả chi tiết về yêu cầu công việc, kỹ năng cần thiết, kinh nghiệm..."
                            placeholderTextColor={colors.icon}
                            value={customJobRequirements}
                            onChangeText={setCustomJobRequirements}
                            multiline={true}
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>
                </View>
            </View>
        );
    };

    const renderUserInfoSection = () => {
        const hasUserReview = userData?.userData?.review && userData.userData.review.trim();

        return (
            <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
                <View style={styles.sectionHeader}>
                    <IconSymbol name="person.circle.fill" size={16} color={colors.success} />
                    <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Thông tin của bạn</ThemedText>
                </View>

                {hasUserReview && (
                    <View style={styles.userInfoSelector}>
                        <ThemedText style={[styles.selectorTitle, { color: colors.text }]}>Chọn thông tin để sử dụng:</ThemedText>

                        <View style={styles.toggleContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.toggleOption,
                                    useUserReview && styles.toggleOptionActive,
                                    { backgroundColor: useUserReview ? colors.tint : "transparent" },
                                ]}
                                onPress={() => setUseUserReview(true)}
                                activeOpacity={0.8}
                            >
                                <IconSymbol name="person.crop.circle.fill" size={16} color={useUserReview ? "white" : colors.icon} />
                                <ThemedText style={[styles.toggleOptionText, { color: useUserReview ? "white" : colors.text }]}>Thông tin có sẵn</ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.toggleOption,
                                    !useUserReview && styles.toggleOptionActive,
                                    { backgroundColor: !useUserReview ? colors.tint : "transparent" },
                                ]}
                                onPress={() => setUseUserReview(false)}
                                activeOpacity={0.8}
                            >
                                <IconSymbol name="square.and.pencil" size={16} color={!useUserReview ? "white" : colors.icon} />
                                <ThemedText style={[styles.toggleOptionText, { color: !useUserReview ? "white" : colors.text }]}>Nhập thông tin </ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {(!hasUserReview || !useUserReview) && (
                    <KeyboardAvoidingView style={styles.customInfoContainer} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={0}>
                        <ThemedText style={[styles.inputLabel, { color: colors.text }]}>Thông tin của bạn {!hasUserReview && "*"}</ThemedText>
                        <TextInput
                            style={[
                                styles.textAreaInput,
                                {
                                    backgroundColor: colors.background,
                                    borderColor: colors.border,
                                    color: colors.text,
                                },
                            ]}
                            placeholder="Nhập thông tin về kinh nghiệm, kỹ năng, thành tích, dự án đã làm..."
                            placeholderTextColor={colors.icon}
                            value={customUserInfo}
                            onChangeText={setCustomUserInfo}
                            multiline={true}
                            numberOfLines={5}
                            textAlignVertical="top"
                        />
                    </KeyboardAvoidingView>
                )}

                {hasUserReview && useUserReview && (
                    <View style={[styles.userReviewPreview, { backgroundColor: colors.background }]}>
                        <View style={styles.previewHeader}>
                            <IconSymbol name="checkmark.circle.fill" size={16} color={colors.success} />
                            <ThemedText style={[styles.previewLabel, { color: colors.success }]}>Thông tin sẽ được sử dụng:</ThemedText>
                        </View>
                        <ThemedText style={[styles.previewContent, { color: colors.text }]}>{userData?.userData?.review}</ThemedText>
                    </View>
                )}
            </View>
        );
    };

    if (!user) {
        return (
            <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
                <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} />
                {renderHeader()}

                <View style={styles.loginPrompt}>
                    <IconSymbol name="person.circle" size={80} color={colors.icon} />
                    <ThemedText style={[styles.promptTitle, { color: colors.text }]}>Vui lòng đăng nhập</ThemedText>
                    <ThemedText style={[styles.promptSubtitle, { color: colors.icon }]}>Bạn cần đăng nhập để sử dụng tính năng phỏng vấn ảo</ThemedText>
                    <TouchableOpacity style={[styles.loginButton, { backgroundColor: colors.tint }]} onPress={() => router.push("/login")}>
                        <ThemedText style={styles.loginButtonText}>Đăng nhập ngay</ThemedText>
                    </TouchableOpacity>
                </View>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
            <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} />

            {renderHeader()}

            <View style={styles.content}>
                <ScrollView
                    style={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.scrollContainer, { paddingBottom: insets.bottom + 100 }]}
                >
                    {renderJobInfo()}
                    {renderCustomJobForm()}
                    {renderUserInfoSection()}
                </ScrollView>

                {/* Start Interview Button */}
                <View style={[styles.actionContainer, { backgroundColor: colors.background, paddingBottom: insets.bottom + 20 }]}>
                    <LinearGradient colors={["#6366f1", "#8b5cf6"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.startButton}>
                        <TouchableOpacity style={styles.startButtonContent} onPress={handleStartInterview} disabled={isStarting} activeOpacity={0.8}>
                            {isStarting ? (
                                <>
                                    <IconSymbol name="arrow.clockwise" size={20} color="white" />
                                    <ThemedText style={styles.startButtonText}>Đang chuẩn bị...</ThemedText>
                                </>
                            ) : (
                                <>
                                    <IconSymbol name="video.fill" size={20} color="white" />
                                    <ThemedText style={styles.startButtonText}>Bắt đầu phỏng vấn</ThemedText>
                                </>
                            )}
                        </TouchableOpacity>
                    </LinearGradient>
                </View>
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingBottom: 10,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    headerContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    headerText: {
        flex: 1,
        paddingLeft: 16,
    },
    headerTitle: {
        paddingTop: 10,
        fontSize: 24,
        fontWeight: "bold",
        color: "white",
        marginBottom: 6,
        textAlign: "center",
    },
    headerSubtitle: {
        fontSize: 14,
        color: "rgba(255,255,255,0.85)",
        textAlign: "center",
        maxWidth: width * 0.7,
    },
    headerIcon: {
        marginLeft: 16,
    },
    headerIconBg: {
        width: 60,
        height: 60,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        flex: 1,
        padding: 20,
    },
    welcomeSection: {
        padding: 20,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    welcomeHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
    },
    welcomeTitle: {
        fontSize: 18,
        fontWeight: "bold",
    },
    welcomeDescription: {
        fontSize: 14,
        lineHeight: 22,
        fontWeight: "400",
    },
    featuresSection: {
        gap: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 8,
    },
    featureCard: {
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 6,
    },
    featureGradient: {
        padding: 20,
        borderRadius: 16,
        minHeight: 120,
    },
    featureHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    featureIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
    },
    comingSoonBadge: {
        backgroundColor: "rgba(255,255,255,0.2)",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    comingSoonText: {
        color: "white",
        fontSize: 10,
        fontWeight: "600",
    },
    featureContent: {
        flex: 1,
        marginBottom: 12,
    },
    featureTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "white",
        marginBottom: 4,
    },
    featureDescription: {
        fontSize: 14,
        color: "rgba(255,255,255,0.9)",
        lineHeight: 20,
    },
    featureArrow: {
        alignItems: "flex-end",
    },
    statsSection: {
        padding: 20,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    statsGrid: {
        flexDirection: "row",
        justifyContent: "space-around",
        gap: 16,
    },
    statItem: {
        alignItems: "center",
        flex: 1,
    },
    statIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    statNumber: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: "500",
    },
    howItWorksSection: {
        padding: 20,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    stepsList: {
        gap: 16,
    },
    stepItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 16,
    },
    stepNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    stepNumberText: {
        color: "white",
        fontSize: 14,
        fontWeight: "bold",
    },
    stepContent: {
        flex: 1,
    },
    stepTitle: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 4,
    },
    stepDescription: {
        fontSize: 14,
        lineHeight: 20,
    },
    bottomAction: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: "rgba(131, 131, 131, 0.2)",
    },
    actionButton: {
        borderRadius: 16,
        shadowColor: "#6366f1",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
    },
    actionButtonContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        paddingVertical: 16,
        paddingHorizontal: 24,
    },
    actionButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
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
    },
    promptSubtitle: {
        fontSize: 15,
        textAlign: "center",
        lineHeight: 22,
        maxWidth: width * 0.8,
    },
    loginButton: {
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 12,
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
    section: {
        padding: 20,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
    },
    jobInfoCard: {
        padding: 20,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    jobInfoItem: {
        marginBottom: 8,
    },
    jobInfoLabel: {
        fontSize: 14,
        fontWeight: "bold",
        marginBottom: 4,
    },
    jobInfoValue: {
        fontSize: 16,
        fontWeight: "bold",
    },
    jobInfoDescription: {
        fontSize: 14,
        lineHeight: 20,
    },
    formContainer: {
        gap: 16,
    },
    inputGroup: {
        gap: 8,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: "bold",
    },
    textInput: {
        padding: 16,
        borderWidth: 1,
        borderColor: "rgba(131, 131, 131, 0.2)",
        borderRadius: 12,
    },
    textAreaInput: {
        padding: 16,
        borderWidth: 1,
        borderColor: "rgba(131, 131, 131, 0.2)",
        borderRadius: 12,
    },
    customInfoContainer: {
        gap: 8,
    },
    userInfoSelector: {
        gap: 16,
    },
    selectorTitle: {
        fontSize: 14,
        fontWeight: "bold",
    },
    toggleContainer: {
        flexDirection: "row",
        gap: 4,
        padding: 4,
        backgroundColor: "rgba(0,0,0,0.05)",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(131, 131, 131, 0.1)",
    },
    toggleOption: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        flex: 1,
        borderWidth: 1,
        borderColor: "transparent",
    },
    toggleOptionActive: {
        borderColor: "rgba(255,255,255,0.2)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 2,
    },
    toggleOptionText: {
        fontSize: 12,
        fontWeight: "600",
        textAlign: "center",
    },
    userReviewPreview: {
        padding: 16,
        borderWidth: 1,
        borderColor: "rgba(131, 131, 131, 0.2)",
        borderRadius: 12,
    },
    previewHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 8,
    },
    previewLabel: {
        fontSize: 14,
        fontWeight: "bold",
    },
    previewContent: {
        fontSize: 12,
        lineHeight: 18,
    },
    actionContainer: {
        paddingHorizontal: 20,
    },
    startButton: {
        borderRadius: 16,
        shadowColor: "#6366f1",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
    },
    startButtonContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        paddingVertical: 10,
        paddingHorizontal: 24,
    },
    startButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
    },
    scrollContainer: {
        gap: 20,
    },
    tabContainer: {
        flexDirection: "row",
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginHorizontal: 20,
        // backgroundColor: "rgba(255,255,255,0.1)",
        borderRadius: 12,
    },
    tab: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 9999,
        flex: 1,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    activeTab: {
        borderColor: "rgba(255,255,255,1)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 2,
    },
    tabText: {
        fontSize: 13,
        fontWeight: "600",
    },
    noJobContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 32,
        gap: 20,
    },
    noJobTitle: {
        fontSize: 22,
        fontWeight: "bold",
        textAlign: "center",
    },
    noJobSubtitle: {
        fontSize: 15,
        textAlign: "center",
        lineHeight: 22,
        maxWidth: width * 0.8,
    },
    goToJobsButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 4,
    },
    goToJobsButtonText: {
        color: "white",
        fontSize: 15,
        fontWeight: "700",
        letterSpacing: 0.3,
    },
    jobContentContainer: {
        padding: 16,
        borderWidth: 1,
        borderColor: "rgba(131, 131, 131, 0.2)",
        borderRadius: 12,
    },
    jobContentText: {
        fontSize: 14,
        lineHeight: 20,
    },
    changeJobButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 4,
    },
    changeJobButtonText: {
        color: "white",
        fontSize: 15,
        fontWeight: "700",
        letterSpacing: 0.3,
    },
    expandButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginTop: 8,
        borderRadius: 8,
        backgroundColor: "rgba(0,0,0,0.05)",
        borderWidth: 1,
        borderColor: "rgba(131, 131, 131, 0.1)",
    },
    expandButtonText: {
        fontSize: 12,
        fontWeight: "600",
    },
});
