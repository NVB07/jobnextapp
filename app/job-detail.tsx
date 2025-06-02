import React, { useState, useEffect } from "react";
import { StyleSheet, ScrollView, TouchableOpacity, View, Alert, Dimensions, StatusBar, Image, Share, Linking, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Job, JobWithDetail, apiService } from "@/services/api";

const { width } = Dimensions.get("window");

export default function JobDetailScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams();

    // Parse job data from params - now supports detailed job data
    const initialJob: Job = params.jobData ? JSON.parse(params.jobData as string) : null;
    const canLoadDetails = params.canLoadDetails === "true";

    // State for detailed job information
    const [job, setJob] = useState<JobWithDetail>(initialJob);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [detailsError, setDetailsError] = useState<string | null>(null);

    const [imageError, setImageError] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);

    // Animated values for loading effects
    const [spinAnimation] = useState(new Animated.Value(0));
    const [fadeAnimation] = useState(new Animated.Value(0));
    const [shimmerAnimation] = useState(new Animated.Value(0));

    // Start animations
    const startLoadingAnimations = () => {
        // Spinning animation for loading indicator
        Animated.loop(
            Animated.timing(spinAnimation, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            })
        ).start();

        // Shimmer animation for placeholder content
        Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnimation, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmerAnimation, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Start with hidden content
        fadeAnimation.setValue(0);
    };

    // Stop animations and fade in content
    const stopLoadingAnimations = () => {
        spinAnimation.stopAnimation();
        shimmerAnimation.stopAnimation();

        // Fade in the new content
        Animated.timing(fadeAnimation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    };

    // Load detailed job information
    useEffect(() => {
        const loadJobDetails = async () => {
            // Skip API call if:
            // - Can't load details
            // - No URL available
            // - Already have detailed data
            // - Job source is "admin" (already has complete info)
            if (!canLoadDetails || !initialJob?.url || job.detailedDescription || initialJob?.jobSource === "admin") {
                console.log("ℹ️ Skipping API call:", {
                    canLoadDetails,
                    hasUrl: !!initialJob?.url,
                    hasDetailedDescription: !!job.detailedDescription,
                    jobSource: initialJob?.jobSource,
                });
                return;
            }

            try {
                setLoadingDetails(true);
                setDetailsError(null);
                startLoadingAnimations();
                console.log(`🔄 Loading detailed job info for: ${initialJob.url}`);

                const jobDetailResponse = await apiService.getJobDetail(initialJob.url);
                console.log("📊 Job Detail Response:", jobDetailResponse);

                // Check if API call was successful
                if (jobDetailResponse.success && jobDetailResponse.data) {
                    const { jobDescription, jobRequirements } = jobDetailResponse.data;
                    // Update job with detailed information
                    setJob((prevJob) => ({
                        ...prevJob,
                        detailedDescription: jobDescription,
                        detailedRequirements: jobRequirements,
                    }));
                    console.log("✅ Job details loaded successfully");
                    stopLoadingAnimations();
                } else {
                    setDetailsError(jobDetailResponse.error || jobDetailResponse.message || "Không thể tải thông tin chi tiết");
                    stopLoadingAnimations();
                }
            } catch (err) {
                console.error("❌ Error loading job details:", err);
                setDetailsError("Không thể tải thông tin chi tiết. Vui lòng thử lại.");
                stopLoadingAnimations();
            } finally {
                setLoadingDetails(false);
            }
        };

        loadJobDetails();
    }, [canLoadDetails, initialJob?.url, initialJob?.jobSource]);

    if (!job) {
        return (
            <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
                <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} />
                <View style={styles.errorContainer}>
                    <IconSymbol name="exclamationmark.triangle" size={48} color={colors.icon} />
                    <ThemedText style={[styles.errorText, { color: colors.text }]}>Không thể tải thông tin công việc</ThemedText>
                    <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.tint }]} onPress={() => router.back()}>
                        <ThemedText style={styles.backButtonText}>Quay lại</ThemedText>
                    </TouchableOpacity>
                </View>
            </ThemedView>
        );
    }

    const handleApply = async () => {
        if (job.url) {
            try {
                const supported = await Linking.canOpenURL(job.url);
                if (supported) {
                    await Linking.openURL(job.url);
                } else {
                    Alert.alert("Lỗi", "Không thể mở đường dẫn này");
                }
            } catch (error) {
                Alert.alert("Lỗi", "Có lỗi xảy ra khi mở đường dẫn");
            }
        } else {
            Alert.alert("Thông báo", "Không có đường dẫn ứng tuyển cho công việc này");
        }
    };

    const handleVirtualInterview = () => {
        // Tạm thời chưa cần sự kiện
        Alert.alert("Thông báo", "Tính năng phỏng vấn ảo đang được phát triển");
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `${job.title} tại ${job.company}\n${job.description || "Xem chi tiết tại ứng dụng JobNext"}`,
                title: job.title,
            });
        } catch (error) {
            console.error("Error sharing:", error);
        }
    };

    const handleBookmark = () => {
        setIsBookmarked(!isBookmarked);
        Alert.alert(
            isBookmarked ? "Đã bỏ lưu" : "Đã lưu",
            isBookmarked ? "Công việc đã được xóa khỏi danh sách yêu thích" : "Công việc đã được thêm vào danh sách yêu thích"
        );
    };

    const CompanyLogo = () => {
        const hasLogo = job.companyLogo && job.companyLogo.trim() !== "" && !imageError;

        if (hasLogo) {
            return (
                <View style={styles.companyLogoContainer}>
                    <Image source={{ uri: job.companyLogo }} style={styles.companyLogo} onError={() => setImageError(true)} resizeMode="contain" />
                </View>
            );
        }

        return (
            <LinearGradient colors={["#6366f1", "#8b5cf6"]} style={styles.companyLogoFallback}>
                <IconSymbol name="building.2.fill" size={20} color="white" />
            </LinearGradient>
        );
    };

    const formatSalary = (salary: string | undefined) => {
        if (!salary || salary.trim() === "") return "Thỏa thuận";
        return salary;
    };

    const formatExpiryDate = (expiryString: string | undefined) => {
        if (!expiryString) return "Không xác định";

        try {
            const expiryDate = new Date(expiryString);
            if (isNaN(expiryDate.getTime())) return "Không xác định";

            const now = new Date();
            const diffTime = expiryDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < 0) return "Đã hết hạn";
            if (diffDays === 0) return "Hết hạn hôm nay";
            if (diffDays === 1) return "Còn 1 ngày";
            if (diffDays < 7) return `Còn ${diffDays} ngày`;
            if (diffDays < 30) return `Còn ${Math.ceil(diffDays / 7)} tuần`;
            return `Còn ${Math.ceil(diffDays / 30)} tháng`;
        } catch {
            return "Không xác định";
        }
    };

    // Parse skills
    const getSkills = () => {
        if (!job.skills) return [];
        if (typeof job.skills === "string") {
            return job.skills
                .split(",")
                .map((skill) => skill.trim())
                .filter((skill) => skill.length > 0);
        }
        return Array.isArray(job.skills) ? job.skills : [];
    };

    const skills = getSkills();

    // Helper function to format and clean text content
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

    // Get job description - prioritize detailed description from API
    const getJobDescription = () => {
        if (job.detailedDescription) {
            return formatJobContent(job.detailedDescription);
        }
        if (job.description) {
            return formatJobContent(job.description);
        }
        if (job.jobRequirement) {
            return formatJobContent(job.jobRequirement.replace(/<[^>]+>/g, " "));
        }
        return "Chưa có mô tả công việc";
    };

    // Get job requirements - use detailed requirements from API or fallback to existing data
    const getJobRequirements = () => {
        console.log("🔍 Job Requirements Debug:", {
            hasDetailedRequirements: !!job.detailedRequirements,
            hasJobRequirement: !!job.jobRequirement,
            detailedRequirements: job.detailedRequirements?.slice(0, 100),
            jobRequirement: job.jobRequirement?.slice(0, 100),
            jobSource: job.jobSource,
        });

        if (job.detailedRequirements) {
            return formatJobContent(job.detailedRequirements);
        }
        if (job.jobRequirement) {
            return formatJobContent(job.jobRequirement.replace(/<[^>]+>/g, " "));
        }
        return null;
    };

    return (
        <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content" />

            {/* Compact Header with Gradient */}
            <LinearGradient colors={colors.gradient} style={[styles.header, { paddingTop: insets.top }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={styles.headerContent}>
                    <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
                        <BlurView intensity={20} style={styles.headerButtonBg}>
                            <IconSymbol name="arrow.left" size={18} color="white" />
                        </BlurView>
                    </TouchableOpacity>

                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
                            <BlurView intensity={20} style={styles.headerButtonBg}>
                                <IconSymbol name="square.and.arrow.up" size={16} color="white" />
                            </BlurView>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.headerButton} onPress={handleBookmark}>
                            <BlurView intensity={20} style={styles.headerButtonBg}>
                                <IconSymbol name={isBookmarked ? "bookmark.fill" : "bookmark"} size={16} color={isBookmarked ? "#fbbf24" : "white"} />
                            </BlurView>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Compact Job Header Info */}
                <View style={styles.jobHeaderInfo}>
                    <CompanyLogo />
                    <View style={styles.jobHeaderText}>
                        <View style={styles.titleRow}>
                            <ThemedText style={styles.jobHeaderTitle} numberOfLines={0}>
                                {job.title || "Chưa có tiêu đề"}
                            </ThemedText>
                        </View>
                        <ThemedText style={styles.jobHeaderCompany} numberOfLines={1} ellipsizeMode="tail">
                            {job.company || "Chưa có tên công ty"}
                        </ThemedText>
                        <View style={styles.jobHeaderMeta}>
                            <View style={styles.jobHeaderMetaItem}>
                                <IconSymbol name="location.fill" size={10} color="rgba(255,255,255,0.8)" />
                                <ThemedText style={styles.jobHeaderMetaText} numberOfLines={1}>
                                    {job.location || job.locationVI || "Remote"}
                                </ThemedText>
                            </View>
                            <View style={styles.jobHeaderMetaItem}>
                                <IconSymbol name="clock.fill" size={10} color="rgba(255,255,255,0.8)" />
                                <ThemedText style={styles.jobHeaderMetaText}>{formatExpiryDate(job.expiredOn || job.deadline)}</ThemedText>
                            </View>
                            {job.jobSource && (
                                <View style={styles.jobHeaderMetaItem}>
                                    <IconSymbol name="globe" size={10} color="rgba(255,255,255,0.8)" />
                                    <ThemedText style={styles.jobHeaderMetaText}>{job.jobSource}</ThemedText>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom }]}>
                {/* Compact Salary & Level Card */}
                <View style={[styles.salaryCard, { backgroundColor: colors.cardBackground }]}>
                    <View style={styles.salarySection}>
                        <View style={styles.salaryInfo}>
                            <ThemedText style={[styles.salaryLabel, { color: colors.icon }]}>Mức lương</ThemedText>
                            <ThemedText style={[styles.salary, { color: colors.success }]}>{formatSalary(job.salary)}</ThemedText>
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <View style={styles.quickStats}>
                        <View style={styles.statItem}>
                            <IconSymbol name="person.2.fill" size={14} color={colors.tint} />
                            <ThemedText style={[styles.statLabel, { color: colors.icon }]}>Cấp độ</ThemedText>
                            <ThemedText style={[styles.statValue, { color: colors.text }]}>{job.jobLevelVI || job.level || job.jobLevel || "Entry"}</ThemedText>
                        </View>
                        <View style={styles.statItem}>
                            <IconSymbol name="briefcase.fill" size={14} color={colors.tint} />
                            <ThemedText style={[styles.statLabel, { color: colors.icon }]}>Loại hình</ThemedText>
                            <ThemedText style={[styles.statValue, { color: colors.text }]}>Full-time</ThemedText>
                        </View>
                    </View>
                </View>

                {/* Compact Skills Section */}
                {skills.length > 0 && (
                    <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
                        <View style={styles.sectionHeader}>
                            <IconSymbol name="lightbulb.fill" size={16} color={colors.tint} />
                            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Kỹ năng yêu cầu</ThemedText>
                        </View>
                        <View style={styles.skillsContainer}>
                            {skills.map((skill, index) => (
                                <LinearGradient
                                    key={index}
                                    colors={index % 2 === 0 ? ["#6366f1", "#8b5cf6"] : ["#10b981", "#34d399"]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.skillTag}
                                >
                                    <ThemedText style={styles.skillText}>{skill}</ThemedText>
                                </LinearGradient>
                            ))}
                        </View>
                    </View>
                )}

                {/* Compact Job Description */}
                {(job.description || job.jobRequirement || job.detailedDescription || loadingDetails) && (
                    <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
                        <View style={styles.sectionHeader}>
                            <IconSymbol name="doc.text.fill" size={16} color={colors.tint} />
                            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Mô tả công việc</ThemedText>

                            {/* Show admin badge for admin jobs */}

                            {/* Show loading indicator for external jobs */}
                            {loadingDetails && job.jobSource !== "admin" && (
                                <View style={styles.loadingIndicator}>
                                    <Animated.View
                                        style={{
                                            transform: [
                                                {
                                                    rotate: spinAnimation.interpolate({
                                                        inputRange: [0, 1],
                                                        outputRange: ["0deg", "360deg"],
                                                    }),
                                                },
                                            ],
                                        }}
                                    >
                                        <IconSymbol name="arrow.clockwise" size={14} color={colors.tint} />
                                    </Animated.View>
                                    <ThemedText style={[styles.loadingText, { color: colors.tint }]}>Đang tải chi tiết...</ThemedText>
                                </View>
                            )}
                        </View>

                        {detailsError && !job.detailedDescription && (
                            <View style={[styles.errorBanner, { backgroundColor: colors.warning + "15" }]}>
                                <IconSymbol name="exclamationmark.triangle" size={14} color={colors.warning} />
                                <ThemedText style={[styles.errorText, { color: colors.warning }]}>{detailsError}</ThemedText>
                            </View>
                        )}

                        <Animated.View
                            style={[
                                styles.descriptionContainer,
                                {
                                    backgroundColor: colors.background,
                                    opacity: job.detailedDescription ? fadeAnimation : 1,
                                },
                            ]}
                        >
                            {getJobDescription()
                                .split("\n")
                                .map((paragraph, index) =>
                                    paragraph.trim() ? (
                                        <ThemedText key={index} style={[styles.description, { color: colors.text }]}>
                                            {paragraph.trim()}
                                        </ThemedText>
                                    ) : (
                                        <View key={index} style={{ height: 8 }} />
                                    )
                                )}
                        </Animated.View>
                    </View>
                )}

                {/* Job Requirements Section */}
                {(getJobRequirements() || job.jobRequirement || loadingDetails) && (
                    <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
                        <View style={styles.sectionHeader}>
                            <IconSymbol name="checklist" size={16} color={colors.success} />
                            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Yêu cầu công việc</ThemedText>

                            {/* Show loading indicator for external jobs */}
                            {loadingDetails && !job.detailedRequirements && job.jobSource !== "admin" && (
                                <View style={styles.loadingIndicator}>
                                    <Animated.View
                                        style={{
                                            transform: [
                                                {
                                                    rotate: spinAnimation.interpolate({
                                                        inputRange: [0, 1],
                                                        outputRange: ["0deg", "360deg"],
                                                    }),
                                                },
                                            ],
                                        }}
                                    >
                                        <IconSymbol name="arrow.clockwise" size={14} color={colors.tint} />
                                    </Animated.View>
                                    <ThemedText style={[styles.loadingText, { color: colors.tint }]}>Đang tải...</ThemedText>
                                </View>
                            )}
                        </View>

                        {detailsError && !job.detailedRequirements && (
                            <View style={[styles.errorBanner, { backgroundColor: colors.warning + "15" }]}>
                                <IconSymbol name="exclamationmark.triangle" size={14} color={colors.warning} />
                                <ThemedText style={[styles.errorText, { color: colors.warning }]}>{detailsError}</ThemedText>
                            </View>
                        )}

                        {loadingDetails && !job.detailedRequirements && job.jobSource !== "admin" ? (
                            <Animated.View
                                style={[
                                    styles.descriptionContainer,
                                    {
                                        backgroundColor: colors.background,
                                        opacity: shimmerAnimation.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.6, 1],
                                        }),
                                    },
                                ]}
                            >
                                <ThemedText style={[styles.description, { color: colors.icon }]}>Đang tải thông tin yêu cầu công việc chi tiết...</ThemedText>
                            </Animated.View>
                        ) : getJobRequirements() ? (
                            <Animated.View
                                style={[
                                    styles.descriptionContainer,
                                    {
                                        backgroundColor: colors.background,
                                        opacity: job.detailedRequirements ? fadeAnimation : 1,
                                    },
                                ]}
                            >
                                {getJobRequirements()
                                    ?.split("\n")
                                    .map((paragraph, index) =>
                                        paragraph.trim() ? (
                                            <ThemedText key={index} style={[styles.description, { color: colors.text }]}>
                                                {paragraph.trim()}
                                            </ThemedText>
                                        ) : (
                                            <View key={index} style={{ height: 8 }} />
                                        )
                                    )}
                            </Animated.View>
                        ) : (
                            <View style={[styles.descriptionContainer, { backgroundColor: colors.background }]}>
                                <ThemedText style={[styles.description, { color: colors.icon }]}>Chưa có thông tin yêu cầu công việc chi tiết</ThemedText>
                            </View>
                        )}
                    </View>
                )}

                {/* Contact Information Section - Only for Admin Jobs */}
                {job.jobSource === "admin" && (job.contactEmail || job.contact || job.contactPhone) && (
                    <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
                        <View style={styles.sectionHeader}>
                            <IconSymbol name="person.circle.fill" size={16} color={colors.warning} />
                            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Thông tin liên hệ</ThemedText>
                        </View>
                        <ThemedText style={[styles.description, { color: colors.text }]} numberOfLines={2} ellipsizeMode="tail">
                            {job.contactEmail || job.contact || "Chưa có thông tin"}
                        </ThemedText>
                    </View>
                )}

                {/* Compact Contact Information */}
                <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
                    <View style={styles.sectionHeader}>
                        <IconSymbol name="person.circle.fill" size={16} color={colors.tint} />
                        <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                            {job.jobSource === "admin" ? "Thông tin công việc" : "Thông tin chi tiết"}
                        </ThemedText>
                    </View>

                    <View style={styles.contactInfo}>
                        <View style={[styles.contactItem, { backgroundColor: colors.background }]}>
                            <View style={[styles.contactIcon, { backgroundColor: colors.tint + "15" }]}>
                                <IconSymbol name="building.2.fill" size={16} color={colors.tint} />
                            </View>
                            <View style={styles.contactDetails}>
                                <ThemedText style={[styles.contactLabel, { color: colors.icon }]}>Công ty</ThemedText>
                                <ThemedText style={[styles.contactValue, { color: colors.text }]} numberOfLines={2} ellipsizeMode="tail">
                                    {job.company || "Chưa có thông tin"}
                                </ThemedText>
                            </View>
                        </View>

                        <View style={[styles.contactItem, { backgroundColor: colors.background }]}>
                            <View style={[styles.contactIcon, { backgroundColor: colors.success + "15" }]}>
                                <IconSymbol name="location.fill" size={16} color={colors.success} />
                            </View>
                            <View style={styles.contactDetails}>
                                <ThemedText style={[styles.contactLabel, { color: colors.icon }]}>Địa điểm</ThemedText>
                                <ThemedText style={[styles.contactValue, { color: colors.text }]} numberOfLines={2} ellipsizeMode="tail">
                                    {job.location || job.locationVI || "Remote"}
                                </ThemedText>
                            </View>
                        </View>

                        {/* Only show contact info for non-admin jobs */}
                        {job.jobSource !== "admin" && (job.contactEmail || job.contact) && (
                            <View style={[styles.contactItem, { backgroundColor: colors.background }]}>
                                <View style={[styles.contactIcon, { backgroundColor: colors.warning + "15" }]}>
                                    <IconSymbol name="envelope.fill" size={16} color={colors.warning} />
                                </View>
                                <View style={styles.contactDetails}>
                                    <ThemedText style={[styles.contactLabel, { color: colors.icon }]}>Liên hệ</ThemedText>
                                    <ThemedText style={[styles.contactValue, { color: colors.text }]} numberOfLines={2} ellipsizeMode="tail">
                                        {job.contactEmail || job.contact || "Chưa có thông tin"}
                                    </ThemedText>
                                </View>
                            </View>
                        )}

                        {job.jobSource !== "admin" && job.contactPhone && (
                            <View style={[styles.contactItem, { backgroundColor: colors.background }]}>
                                <View style={[styles.contactIcon, { backgroundColor: "#10b981" + "15" }]}>
                                    <IconSymbol name="phone.fill" size={16} color="#10b981" />
                                </View>
                                <View style={styles.contactDetails}>
                                    <ThemedText style={[styles.contactLabel, { color: colors.icon }]}>Điện thoại</ThemedText>
                                    <ThemedText style={[styles.contactValue, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
                                        {job.contactPhone}
                                    </ThemedText>
                                </View>
                            </View>
                        )}

                        {(job.groupJobFunctionV3NameVI || job.category) && (
                            <View style={[styles.contactItem, { backgroundColor: colors.background }]}>
                                <View style={[styles.contactIcon, { backgroundColor: "#8b5cf6" + "15" }]}>
                                    <IconSymbol name="tag.fill" size={16} color="#8b5cf6" />
                                </View>
                                <View style={styles.contactDetails}>
                                    <ThemedText style={[styles.contactLabel, { color: colors.icon }]}>Lĩnh vực</ThemedText>
                                    <ThemedText style={[styles.contactValue, { color: colors.text }]} numberOfLines={2} ellipsizeMode="tail">
                                        {job.groupJobFunctionV3NameVI || job.category || "Chưa phân loại"}
                                    </ThemedText>
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Dual Action Buttons */}
            <View style={[styles.actionContainer, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
                <TouchableOpacity style={styles.virtualInterviewButton} onPress={handleVirtualInterview} activeOpacity={0.8}>
                    <IconSymbol name="video.fill" size={16} color={colors.text} />
                    <ThemedText style={styles.virtualInterviewText}>Phỏng vấn ảo</ThemedText>
                </TouchableOpacity>

                <LinearGradient colors={["#6366f1", "#8b5cf6"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.applyButton}>
                    <TouchableOpacity style={styles.applyButtonContent} onPress={handleApply} activeOpacity={0.8}>
                        <IconSymbol name="arrow.up.right" size={16} color="white" />
                        <ThemedText style={styles.applyButtonText}>Ứng tuyển</ThemedText>
                    </TouchableOpacity>
                </LinearGradient>
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingBottom: 16,
        paddingHorizontal: 16,
    },
    headerContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 8,
        marginBottom: 16,
    },
    headerButton: {
        borderRadius: 10,
        overflow: "hidden",
    },
    headerButtonBg: {
        padding: 8,
        borderRadius: 10,
    },
    headerActions: {
        flexDirection: "row",
        gap: 8,
    },
    jobHeaderInfo: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
    },
    jobHeaderTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "white",
        lineHeight: 22,
        marginBottom: 3,
    },
    jobHeaderCompany: {
        fontSize: 14,
        fontWeight: "600",
        color: "rgba(255,255,255,0.9)",
        marginBottom: 6,
    },
    jobHeaderText: {
        flex: 1,
    },
    jobHeaderMeta: {
        flexDirection: "row",
        gap: 12,
    },
    jobHeaderMetaItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
    },
    jobHeaderMetaText: {
        fontSize: 11,
        color: "rgba(255,255,255,0.8)",
        fontWeight: "500",
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        gap: 16,
    },
    salaryCard: {
        padding: 18,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    salarySection: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    salaryInfo: {
        gap: 4,
    },
    salaryLabel: {
        fontSize: 12,
        fontWeight: "500",
    },
    salary: {
        fontSize: 20,
        fontWeight: "bold",
    },
    levelBadge: {
        paddingVertical: 2,
        paddingHorizontal: 4,
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
    },
    levelText: {
        fontSize: 12,
        fontWeight: "700",
    },
    divider: {
        height: 1,
        marginBottom: 16,
    },
    quickStats: {
        flexDirection: "row",
        justifyContent: "space-around",
    },
    statItem: {
        alignItems: "center",
        gap: 6,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: "500",
    },
    statValue: {
        fontSize: 12,
        fontWeight: "600",
    },
    section: {
        padding: 18,
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
        marginBottom: 14,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "bold",
    },
    skillsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    skillTag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    skillText: {
        fontSize: 12,
        fontWeight: "600",
        color: "white",
    },
    descriptionContainer: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.05)",
    },
    description: {
        fontSize: 14,
        lineHeight: 22,
        fontWeight: "400",
        textAlign: "left",
        paddingVertical: 4,
        marginBottom: 4,
    },
    contactInfo: {
        gap: 12,
    },
    contactItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.05)",
    },
    contactIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    contactDetails: {
        flex: 1,
        gap: 3,
    },
    contactLabel: {
        fontSize: 11,
        fontWeight: "500",
    },
    contactValue: {
        fontSize: 13,
        fontWeight: "600",
    },
    companyLogoContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "white",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1.5,
        borderColor: "rgba(255,255,255,0.3)",
    },
    companyLogo: {
        width: 36,
        height: 36,
        borderRadius: 8,
    },
    companyLogoFallback: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    actionContainer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: "rgba(0,0,0,0.05)",
        flexDirection: "row",
        gap: 12,
    },
    virtualInterviewButton: {
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        flex: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    virtualInterviewText: {
        fontSize: 14,
        fontWeight: "600",
    },
    applyButton: {
        borderRadius: 12,
        shadowColor: "#6366f1",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
        flex: 1,
    },
    applyButtonContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    applyButtonText: {
        color: "white",
        fontSize: 14,
        fontWeight: "bold",
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        gap: 20,
    },
    errorText: {
        fontSize: 16,
        textAlign: "center",
    },
    backButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    backButtonText: {
        color: "white",
        fontSize: 14,
        fontWeight: "600",
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    detailBadge: {
        padding: 4,
        borderRadius: 8,
        backgroundColor: "#10b981",
    },
    loadingIndicator: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    loadingText: {
        fontSize: 12,
        fontWeight: "500",
    },
    errorBanner: {
        padding: 12,
        borderRadius: 8,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
    },
    adminBadge: {
        padding: 4,
        borderRadius: 8,
        backgroundColor: "#10b981",
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    adminBadgeText: {
        fontSize: 12,
        fontWeight: "600",
    },
});
