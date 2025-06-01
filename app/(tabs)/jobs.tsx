import React, { useState, useEffect } from "react";
import { StyleSheet, ScrollView, TouchableOpacity, View, TextInput, Alert, Dimensions, StatusBar, ActivityIndicator, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/contexts/AuthContext";
import { apiService, Job } from "@/services/api";

const { width } = Dimensions.get("window");

export default function JobsScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");

    // Determine if user is authenticated and can see recommended tab
    const isAuthenticated = !!user;
    const [activeTab, setActiveTab] = useState<"search" | "recommended">(isAuthenticated ? "search" : "search");
    const [searchJobs, setSearchJobs] = useState<Job[]>([]);
    const [searchLoading, setSearchLoading] = useState(true);
    const [searchLoadingMore, setSearchLoadingMore] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [searchCurrentPage, setSearchCurrentPage] = useState(1);
    const [searchTotalJobs, setSearchTotalJobs] = useState(0);
    const [searchTotalPages, setSearchTotalPages] = useState(1);
    const [searchHasMorePages, setSearchHasMorePages] = useState(false);

    const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
    const [recommendedLoading, setRecommendedLoading] = useState(false);
    const [recommendedLoadingMore, setRecommendedLoadingMore] = useState(false);
    const [recommendedError, setRecommendedError] = useState<string | null>(null);
    const [recommendedCurrentPage, setRecommendedCurrentPage] = useState(1);
    const [recommendedTotalJobs, setRecommendedTotalJobs] = useState(0);
    const [recommendedTotalPages, setRecommendedTotalPages] = useState(1);
    const [recommendedHasMorePages, setRecommendedHasMorePages] = useState(false);

    // Fetch jobs from API
    useEffect(() => {
        fetchSearchJobs(1, true);
    }, []);

    // Reset active tab to search when user logs out
    useEffect(() => {
        if (!isAuthenticated && activeTab === "recommended") {
            setActiveTab("search");
        }
    }, [isAuthenticated, activeTab]);

    // Reset pagination when search query changes
    useEffect(() => {
        if (searchQuery) {
            setSearchCurrentPage(1);
            setSearchHasMorePages(false);
        }
    }, [searchQuery]);

    useEffect(() => {
        if (activeTab === "recommended" && recommendedJobs.length === 0) {
            fetchRecommendedJobs(1, true);
        }
    }, [activeTab]);

    const fetchSearchJobs = async (page: number = 1, reset: boolean = false) => {
        try {
            if (reset) {
                setSearchLoading(true);
                setSearchCurrentPage(1);
            } else {
                setSearchLoadingMore(true);
            }
            setSearchError(null);
            console.log(`🔄 Fetching search jobs from API (page ${page})...`);

            const response = await apiService.getJobs({
                page: page,
                limit: 10,
            });

            console.log("📊 Search Jobs API Response:", {
                jobsCount: response.jobs?.length || 0,
                totalJobs: response.totalJobs,
                currentPage: response.currentPage,
                totalPages: response.totalPages,
                page: page,
            });

            if (reset) {
                setSearchJobs(response.jobs || []);
                setSearchCurrentPage(1);
            } else {
                const newJobs = response.jobs || [];
                setSearchJobs((prevJobs) => {
                    const existingIds = new Set(prevJobs.map((job) => job._id));
                    const uniqueNewJobs = newJobs.filter((job) => !existingIds.has(job._id));
                    return [...prevJobs, ...uniqueNewJobs];
                });
                setSearchCurrentPage(page);
            }

            setSearchTotalPages(response.totalPages || 1);
            setSearchHasMorePages(page < (response.totalPages || 1));
            setSearchTotalJobs(response.totalJobs || 0);
        } catch (err) {
            console.error("❌ Error fetching search jobs:", err);
            setSearchError("Không thể tải danh sách việc làm. Vui lòng thử lại.");
            if (reset) {
                setSearchJobs([]);
            }
        } finally {
            setSearchLoading(false);
            setSearchLoadingMore(false);
        }
    };

    const fetchRecommendedJobs = async (page: number = 1, reset: boolean = false) => {
        try {
            if (reset) {
                setRecommendedLoading(true);
                setRecommendedCurrentPage(1);
            } else {
                setRecommendedLoadingMore(true);
            }
            setRecommendedError(null);
            console.log(`🔄 Fetching recommended jobs from API (page ${page})...`);

            // For now, use regular jobs API - in real app this would be a recommendation endpoint
            const response = await apiService.getJobs({
                page: page,
                limit: 10,
                // Add any recommendation parameters here
            });

            console.log("📊 Recommended Jobs API Response:", {
                jobsCount: response.jobs?.length || 0,
                totalJobs: response.totalJobs,
                currentPage: response.currentPage,
                totalPages: response.totalPages,
                page: page,
            });

            if (reset) {
                setRecommendedJobs(response.jobs || []);
                setRecommendedCurrentPage(1);
            } else {
                const newJobs = response.jobs || [];
                setRecommendedJobs((prevJobs) => {
                    const existingIds = new Set(prevJobs.map((job) => job._id));
                    const uniqueNewJobs = newJobs.filter((job) => !existingIds.has(job._id));
                    return [...prevJobs, ...uniqueNewJobs];
                });
                setRecommendedCurrentPage(page);
            }

            setRecommendedTotalPages(response.totalPages || 1);
            setRecommendedHasMorePages(page < (response.totalPages || 1));
            setRecommendedTotalJobs(response.totalJobs || 0);
        } catch (err) {
            console.error("❌ Error fetching recommended jobs:", err);
            setRecommendedError("Không thể tải danh sách việc làm phù hợp. Vui lòng thử lại.");
            if (reset) {
                setRecommendedJobs([]);
            }
        } finally {
            setRecommendedLoading(false);
            setRecommendedLoadingMore(false);
        }
    };

    const loadMoreSearchJobs = () => {
        if (!searchLoadingMore && searchHasMorePages) {
            const nextPage = searchCurrentPage + 1;
            fetchSearchJobs(nextPage, false);
        }
    };

    const loadMoreRecommendedJobs = () => {
        if (!recommendedLoadingMore && recommendedHasMorePages) {
            const nextPage = recommendedCurrentPage + 1;
            fetchRecommendedJobs(nextPage, false);
        }
    };

    const performSearch = async () => {
        if (!searchQuery.trim()) {
            fetchSearchJobs(1, true);
            return;
        }

        try {
            setSearchLoading(true);
            setSearchCurrentPage(1);
            setSearchHasMorePages(false);
            console.log("🔍 Searching jobs with query:", searchQuery);

            const results = await apiService.searchJobs(searchQuery);

            console.log("📊 Search Results:", {
                resultsCount: results?.length || 0,
                query: searchQuery,
            });

            setSearchJobs(results || []);
        } catch (err) {
            console.error("❌ Error searching jobs:", err);
            setSearchError("Không thể tìm kiếm việc làm. Vui lòng thử lại.");
        } finally {
            setSearchLoading(false);
        }
    };

    const handleViewDetail = (job: Job) => {
        router.push({
            pathname: "/job-detail",
            params: {
                jobId: job._id,
                jobData: JSON.stringify(job),
            },
        });
    };

    const getJobGradient = (index: number): [string, string] => {
        const gradients = [
            ["#6366f1", "#8b5cf6"],
            ["#10b981", "#34d399"],
            ["#f59e0b", "#fbbf24"],
            ["#ef4444", "#f87171"],
            ["#8b5cf6", "#a78bfa"],
        ];
        return gradients[index % gradients.length] as [string, string];
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

    const CompanyLogo = ({ job, index }: { job: Job; index: number }) => {
        const [imageError, setImageError] = useState(false);
        const hasLogo = job.companyLogo && job.companyLogo.trim() !== "" && !imageError;

        if (hasLogo) {
            return (
                <View style={styles.companyLogoContainer}>
                    <Image source={{ uri: job.companyLogo }} style={styles.companyLogo} onError={() => setImageError(true)} resizeMode="contain" />
                </View>
            );
        }

        // Fallback to gradient icon
        return (
            <LinearGradient colors={getJobGradient(index)} style={styles.companyIcon}>
                <IconSymbol name="building.2.fill" size={20} color="white" />
            </LinearGradient>
        );
    };

    const JobCard = ({ job, index }: { job: Job; index: number }) => (
        <View style={[styles.jobCard, { backgroundColor: colors.cardBackground }]}>
            {/* Header with company info only */}
            <View style={styles.jobCardHeader}>
                <View style={styles.companySection}>
                    <CompanyLogo job={job} index={index} />

                    <View style={styles.companyInfo}>
                        <ThemedText style={[styles.companyName, { color: colors.text }]} numberOfLines={1}>
                            {job.company || "Chưa có tên công ty"}
                        </ThemedText>
                        <View style={styles.locationRow}>
                            <IconSymbol name="location.fill" size={12} color={colors.icon} />
                            <ThemedText style={[styles.locationText, { color: colors.icon }]} numberOfLines={1}>
                                {job.location || job.locationVI || "Remote"}
                            </ThemedText>
                        </View>
                    </View>
                </View>
            </View>

            {/* Job title */}
            <ThemedText style={[styles.jobTitle, { color: colors.text }]} numberOfLines={2}>
                {job.title || "Chưa có tiêu đề"}
            </ThemedText>

            {/* Skills tags */}
            <View style={styles.skillsContainer}>
                {(() => {
                    // Handle skills from server (usually comma-separated string)
                    let skillsArray: string[] = [];
                    if (job.skills) {
                        if (typeof job.skills === "string") {
                            // Server returns skills as comma-separated string
                            skillsArray = job.skills
                                .split(",")
                                .map((skill: string) => skill.trim())
                                .filter((skill: string) => skill.length > 0);
                        } else if (Array.isArray(job.skills)) {
                            skillsArray = job.skills;
                        }
                    }

                    // If no skills, don't render the skills section
                    if (skillsArray.length === 0) return null;

                    return (
                        <>
                            {skillsArray.slice(0, 4).map((skill: string, skillIndex: number) => (
                                <View key={skillIndex} style={[styles.skillTag, { backgroundColor: colors.border }]}>
                                    <ThemedText style={[styles.skillText, { color: colors.text }]}>{skill}</ThemedText>
                                </View>
                            ))}
                            {skillsArray.length > 4 && (
                                <View style={[styles.skillTag, styles.moreSkillsTag, { backgroundColor: colors.tint + "20" }]}>
                                    <ThemedText style={[styles.skillText, { color: colors.tint }]}>+{skillsArray.length - 4}</ThemedText>
                                </View>
                            )}
                        </>
                    );
                })()}
            </View>

            {/* Salary and job info */}
            <View style={styles.jobMeta}>
                <View style={styles.salaryContainer}>
                    <ThemedText style={[styles.salary, { color: colors.success }]}>{formatSalary(job.salary)}</ThemedText>
                    <View style={styles.jobMetaRow}>
                        <View style={[styles.levelBadge, { backgroundColor: colors.warning + "20" }]}>
                            <IconSymbol name="star.fill" size={12} color={colors.warning} />
                            <ThemedText style={[styles.levelText, { color: colors.warning }]}>{job.jobLevelVI || job.level || job.jobLevel || "Entry"}</ThemedText>
                        </View>
                        <ThemedText style={[styles.timeText, { color: colors.icon }]}>{formatExpiryDate(job.expiredOn || job.deadline)}</ThemedText>
                    </View>
                </View>
            </View>

            {/* Bottom action buttons */}
            <View style={styles.jobCardActions}>
                <TouchableOpacity style={[styles.bookmarkButton, { backgroundColor: colors.border }]} activeOpacity={0.7}>
                    <IconSymbol name="bookmark" size={16} color={colors.icon} />
                    <ThemedText style={[styles.bookmarkText, { color: colors.icon }]}>Lưu</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.detailButton, { backgroundColor: colors.tint }]} onPress={() => handleViewDetail(job)} activeOpacity={0.8}>
                    <ThemedText style={styles.detailText}>Xem chi tiết</ThemedText>
                    <IconSymbol name="arrow.right" size={14} color="white" />
                </TouchableOpacity>
            </View>
        </View>
    );

    const getCurrentJobs = () => (activeTab === "search" ? searchJobs : recommendedJobs);
    const getCurrentLoading = () => (activeTab === "search" ? searchLoading : recommendedLoading);
    const getCurrentLoadingMore = () => (activeTab === "search" ? searchLoadingMore : recommendedLoadingMore);
    const getCurrentError = () => (activeTab === "search" ? searchError : recommendedError);
    const getCurrentTotalJobs = () => (activeTab === "search" ? searchTotalJobs : recommendedTotalJobs);
    const getCurrentPage = () => (activeTab === "search" ? searchCurrentPage : recommendedCurrentPage);
    const getCurrentTotalPages = () => (activeTab === "search" ? searchTotalPages : recommendedTotalPages);
    const getCurrentHasMorePages = () => (activeTab === "search" ? searchHasMorePages : recommendedHasMorePages);
    const getCurrentLoadMore = () => (activeTab === "search" ? loadMoreSearchJobs : loadMoreRecommendedJobs);
    const getCurrentRetry = () => (activeTab === "search" ? () => fetchSearchJobs(1, true) : () => fetchRecommendedJobs(1, true));

    return (
        <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} />

            {/* Header */}
            <LinearGradient colors={colors.gradient} style={[styles.header, { paddingTop: insets.top }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={styles.headerContent}>
                    <ThemedText style={styles.headerTitle}>Việc làm</ThemedText>
                    <ThemedText style={styles.headerSubtitle}>
                        {getCurrentLoading()
                            ? "Đang tải..."
                            : activeTab === "search" && searchQuery
                            ? `${getCurrentJobs().length} kết quả tìm kiếm`
                            : activeTab === "recommended"
                            ? `${getCurrentJobs().length} / ${getCurrentTotalJobs()} gợi ý phù hợp • Trang ${getCurrentPage()}/${getCurrentTotalPages()}`
                            : !isAuthenticated
                            ? `${getCurrentJobs().length} / ${getCurrentTotalJobs()} việc làm • Đăng nhập để xem gợi ý phù hợp`
                            : `${getCurrentJobs().length} / ${getCurrentTotalJobs()} việc làm • Trang ${getCurrentPage()}/${getCurrentTotalPages()}`}
                    </ThemedText>
                </View>
                {/* Tab Selector */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[
                            styles.tabButton,
                            activeTab === "search" && styles.activeTab,
                            {
                                backgroundColor: activeTab === "search" ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.05)",
                                flex: isAuthenticated ? 1 : 0,
                                minWidth: isAuthenticated ? undefined : 120,
                            },
                        ]}
                        onPress={() => setActiveTab("search")}
                        activeOpacity={0.8}
                    >
                        <IconSymbol name="magnifyingglass" size={16} color={activeTab === "search" ? "white" : "rgba(255,255,255,0.6)"} />
                        <ThemedText style={[styles.tabText, { color: activeTab === "search" ? "white" : "rgba(255,255,255,0.6)" }]}>Tìm kiếm</ThemedText>
                    </TouchableOpacity>

                    {isAuthenticated && (
                        <TouchableOpacity
                            style={[
                                styles.tabButton,
                                activeTab === "recommended" && styles.activeTab,
                                { backgroundColor: activeTab === "recommended" ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.05)" },
                            ]}
                            onPress={() => setActiveTab("recommended")}
                            activeOpacity={0.8}
                        >
                            <IconSymbol name="heart.fill" size={16} color={activeTab === "recommended" ? "white" : "rgba(255,255,255,0.6)"} />
                            <ThemedText style={[styles.tabText, { color: activeTab === "recommended" ? "white" : "rgba(255,255,255,0.6)" }]}>Phù hợp</ThemedText>
                        </TouchableOpacity>
                    )}
                </View>
            </LinearGradient>
            {activeTab === "search" && (
                <View style={styles.searchSection}>
                    <View style={[styles.searchContainer, { backgroundColor: colors.cardBackground }]}>
                        <IconSymbol name="magnifyingglass" size={20} color={colors.icon} />
                        <TextInput
                            style={[styles.searchInput, { color: colors.text }]}
                            placeholder="Tìm kiếm việc làm, công ty..."
                            placeholderTextColor={colors.icon}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onSubmitEditing={performSearch}
                            returnKeyType="search"
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity
                                onPress={() => {
                                    setSearchQuery("");
                                    fetchSearchJobs(1, true);
                                }}
                            >
                                <IconSymbol name="xmark.circle.fill" size={20} color={colors.icon} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            )}

            {/* Jobs List */}
            <ScrollView
                style={styles.jobsList}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.jobsContainer, { paddingBottom: insets.bottom + 60 }]}
            >
                {getCurrentLoading() ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.tint} />
                        <ThemedText style={[styles.loadingText, { color: colors.text }]}>
                            {activeTab === "search" ? "Đang tải việc làm..." : "Đang tải việc làm phù hợp..."}
                        </ThemedText>
                    </View>
                ) : getCurrentError() ? (
                    <View style={styles.errorContainer}>
                        <IconSymbol name="exclamationmark.triangle" size={48} color={colors.icon} />
                        <ThemedText style={[styles.errorTitle, { color: colors.text }]}>{getCurrentError()}</ThemedText>
                        <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.tint }]} onPress={getCurrentRetry()}>
                            <ThemedText style={styles.retryText}>Thử lại</ThemedText>
                        </TouchableOpacity>
                    </View>
                ) : getCurrentJobs().length === 0 ? (
                    <View style={styles.emptyState}>
                        <IconSymbol name={activeTab === "search" ? "magnifyingglass" : "heart"} size={48} color={colors.icon} />
                        <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
                            {activeTab === "search" ? "Không tìm thấy việc làm" : "Chưa có việc làm phù hợp"}
                        </ThemedText>
                        <ThemedText style={[styles.emptySubtitle, { color: colors.icon }]}>
                            {activeTab === "search"
                                ? "Thử tìm kiếm với từ khóa khác hoặc thay đổi bộ lọc"
                                : "Hệ thống sẽ gợi ý việc làm phù hợp với bạn sau khi có đủ dữ liệu"}
                        </ThemedText>
                    </View>
                ) : (
                    <>
                        {getCurrentJobs().map((job, index) => (
                            <JobCard key={`${job._id}-${index}`} job={job} index={index} />
                        ))}

                        {/* Load More Button */}
                        {getCurrentHasMorePages() && activeTab === "search" && !searchQuery && (
                            <View style={styles.loadMoreContainer}>
                                <TouchableOpacity
                                    style={[styles.loadMoreButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                                    onPress={getCurrentLoadMore()}
                                    disabled={getCurrentLoadingMore()}
                                    activeOpacity={0.8}
                                >
                                    {getCurrentLoadingMore() ? (
                                        <>
                                            <ActivityIndicator size="small" color={colors.tint} />
                                            <ThemedText style={[styles.loadMoreText, { color: colors.tint }]}>Đang tải...</ThemedText>
                                        </>
                                    ) : (
                                        <>
                                            <ThemedText style={[styles.loadMoreText, { color: colors.text }]}>Xem thêm việc làm</ThemedText>
                                            <IconSymbol name="arrow.down.circle" size={16} color={colors.icon} />
                                        </>
                                    )}
                                </TouchableOpacity>

                                <ThemedText style={[styles.paginationInfo, { color: colors.icon }]}>
                                    Trang {getCurrentPage()} / {getCurrentTotalPages()} • Hiển thị {getCurrentJobs().length} việc làm
                                </ThemedText>
                            </View>
                        )}

                        {/* Loading More Indicator */}
                        {getCurrentHasMorePages() && activeTab === "recommended" && (
                            <View style={styles.loadMoreContainer}>
                                <TouchableOpacity
                                    style={[styles.loadMoreButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                                    onPress={getCurrentLoadMore()}
                                    disabled={getCurrentLoadingMore()}
                                    activeOpacity={0.8}
                                >
                                    {getCurrentLoadingMore() ? (
                                        <>
                                            <ActivityIndicator size="small" color={colors.tint} />
                                            <ThemedText style={[styles.loadMoreText, { color: colors.tint }]}>Đang tải...</ThemedText>
                                        </>
                                    ) : (
                                        <>
                                            <ThemedText style={[styles.loadMoreText, { color: colors.text }]}>Xem thêm gợi ý</ThemedText>
                                            <IconSymbol name="arrow.down.circle" size={16} color={colors.icon} />
                                        </>
                                    )}
                                </TouchableOpacity>

                                <ThemedText style={[styles.paginationInfo, { color: colors.icon }]}>
                                    Trang {getCurrentPage()} / {getCurrentTotalPages()} • Hiển thị {getCurrentJobs().length} việc làm
                                </ThemedText>
                            </View>
                        )}
                    </>
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
        paddingBottom: 24,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerContent: {
        alignItems: "center",
        gap: 8,
    },
    headerTitle: {
        paddingTop: 10,
        fontSize: 28,
        fontWeight: "bold",
        color: "white",
    },
    headerSubtitle: {
        fontSize: 16,
        color: "rgba(255,255,255,0.8)",
    },
    searchSection: {
        paddingHorizontal: 20,
        paddingVertical: 24,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 16,
        gap: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 6,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        fontWeight: "500",
    },
    jobsList: {
        flex: 1,
    },
    jobsContainer: {
        paddingHorizontal: 20,
        gap: 20,
    },
    jobCard: {
        padding: 20,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 6,
        gap: 16,
    },
    jobCardHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    companySection: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        flex: 1,
    },
    companyIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    companyInfo: {
        flex: 1,
        gap: 3,
    },
    companyName: {
        fontSize: 15,
        fontWeight: "700",
        lineHeight: 20,
    },
    locationRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    locationText: {
        fontSize: 13,
        fontWeight: "500",
        lineHeight: 18,
    },
    jobTitle: {
        fontSize: 18,
        fontWeight: "bold",
        lineHeight: 24,
    },
    skillsContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
        marginTop: 4,
    },
    skillTag: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    skillText: {
        fontSize: 11,
        fontWeight: "600",
        lineHeight: 14,
    },
    moreSkillsTag: {
        borderWidth: 1,
        borderStyle: "dashed",
    },
    jobMeta: {
        flex: 1,
    },
    salaryContainer: {
        gap: 6,
    },
    salary: {
        fontSize: 16,
        fontWeight: "bold",
        lineHeight: 20,
    },
    jobMetaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    levelBadge: {
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 6,
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
    },
    levelText: {
        fontSize: 10,
        fontWeight: "600",
        lineHeight: 12,
    },
    timeText: {
        fontSize: 11,
        fontWeight: "500",
        lineHeight: 14,
    },
    jobCardActions: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        marginTop: 16,
    },
    bookmarkButton: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        flex: 1,
        justifyContent: "center",
    },
    bookmarkText: {
        fontSize: 12,
        fontWeight: "600",
    },
    detailButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        shadowColor: "#6366f1",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 4,
        flex: 2,
        justifyContent: "center",
    },
    detailText: {
        color: "white",
        fontSize: 13,
        fontWeight: "700",
        lineHeight: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    loadingText: {
        fontSize: 16,
        fontWeight: "bold",
        marginTop: 20,
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 20,
    },
    retryButton: {
        padding: 16,
        borderRadius: 12,
    },
    retryText: {
        color: "white",
        fontSize: 14,
        fontWeight: "600",
    },
    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
        gap: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "bold",
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: "center",
        lineHeight: 20,
        maxWidth: 280,
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
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1.5,
        borderColor: "rgba(0,0,0,0.08)",
    },
    companyLogo: {
        width: 36,
        height: 36,
        borderRadius: 8,
    },
    loadMoreContainer: {
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        gap: 12,
    },
    loadMoreButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderWidth: 1.5,
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    loadMoreText: {
        fontSize: 14,
        fontWeight: "600",
    },
    paginationInfo: {
        fontSize: 12,
        fontWeight: "500",
        textAlign: "center",
    },
    tabContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingHorizontal: 20,
        paddingVertical: 16,
        marginTop: 8,
    },
    tabButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        flex: 1,
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        minWidth: 100,
    },
    activeTab: {
        borderColor: "rgba(255,255,255,0.3)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
    },
    tabText: {
        fontSize: 14,
        fontWeight: "700",
    },
});
