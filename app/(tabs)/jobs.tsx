import React, { useState, useEffect } from "react";
import { StyleSheet, ScrollView, TouchableOpacity, View, TextInput, Alert, Dimensions, StatusBar, ActivityIndicator, Image, RefreshControl } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/contexts/AuthContext";
import { useJobs } from "@/contexts/JobsContext";
import { apiService, Job, JobWithDetail, UserData } from "@/services/api";

// Filter constants
const vietnameseProvinces = [
    "An Giang",
    "Bà Rịa - Vũng Tàu",
    "Bắc Giang",
    "Bắc Kạn",
    "Bạc Liêu",
    "Bắc Ninh",
    "Bến Tre",
    "Bình Định",
    "Bình Dương",
    "Bình Phước",
    "Bình Thuận",
    "Cà Mau",
    "Cần Thơ",
    "Cao Bằng",
    "Đà Nẵng",
    "Đắk Lắk",
    "Đắk Nông",
    "Điện Biên",
    "Đồng Nai",
    "Đồng Tháp",
    "Gia Lai",
    "Hà Giang",
    "Hà Nam",
    "Hà Nội",
    "Hồ Chí Minh",
    "Hà Tĩnh",
    "Hải Dương",
    "Hải Phòng",
    "Hậu Giang",
    "Hòa Bình",
    "Hưng Yên",
    "Khánh Hòa",
    "Kiên Giang",
    "Kon Tum",
    "Lai Châu",
    "Lâm Đồng",
    "Lạng Sơn",
    "Lào Cai",
    "Long An",
    "Nam Định",
    "Nghệ An",
    "Ninh Bình",
    "Ninh Thuận",
    "Phú Thọ",
    "Phú Yên",
    "Quảng Bình",
    "Quảng Nam",
    "Quảng Ngãi",
    "Quảng Ninh",
    "Quảng Trị",
    "Sóc Trăng",
    "Sơn La",
    "Tây Ninh",
    "Thái Bình",
    "Thái Nguyên",
    "Thanh Hóa",
    "Thừa Thiên Huế",
    "Tiền Giang",
    "Trà Vinh",
    "Tuyên Quang",
    "Vĩnh Long",
    "Vĩnh Phúc",
    "Yên Bái",
    "International",
    "Other",
];

const jobCategoriesMap = {
    "Academic/Education": "Học thuật/Giáo dục",
    "Accounting/Auditing": "Kế toán/Kiểm toán",
    "Administration/Office Support": "Hành chính/Hỗ trợ văn phòng",
    "Agriculture/Livestock/Fishery": "Nông nghiệp/Chăn nuôi/Thủy sản",
    "Architecture/Construction": "Kiến trúc/Xây dựng",
    "Art, Media & Printing/Publishing": "Nghệ thuật, Truyền thông & In ấn/Xuất bản",
    "Banking & Financial Services": "Ngân hàng & Dịch vụ tài chính",
    "CEO & General Management": "CEO & Quản lý chung",
    "Customer Service": "Dịch vụ khách hàng",
    Design: "Thiết kế",
    "Engineering & Sciences": "Kỹ thuật & Khoa học",
    "Food and Beverage": "Thực phẩm và Đồ uống",
    "Government/NGO": "Chính phủ/Tổ chức phi chính phủ",
    "Healthcare/Medical Services": "Chăm sóc sức khỏe/Dịch vụ y tế",
    "Hospitality/Tourism": "Khách sạn/Du lịch",
    "Human Resources/Recruitment": "Nhân sự/Tuyển dụng",
    "Information Technology/Telecommunications": "Công nghệ thông tin/Viễn thông",
    Insurance: "Bảo hiểm",
    Legal: "Pháp lý",
    "Logistics/Import Export/Warehouse": "Hậu cần/Xuất nhập khẩu/Kho bãi",
    Manufacturing: "Sản xuất",
    "Marketing, Advertising/Communications": "Marketing, Quảng cáo/Truyền thông",
    Pharmacy: "Dược phẩm",
    "Real Estate": "Bất động sản",
    "Retail/Consumer Products": "Bán lẻ/Sản phẩm tiêu dùng",
    Sales: "Bán hàng",
    Technician: "Kỹ thuật viên",
    "Textiles, Garments/Footwear": "Dệt may, May mặc/Giày dép",
    Transportation: "Vận tải",
    Others: "Khác",
};

const experienceLevelsMap = {
    "Intern/Student": "Thực tập sinh/Sinh viên",
    "Fresher/Entry level": "Mới tốt nghiệp/Mới vào nghề",
    "Experienced (non-manager)": "Có kinh nghiệm (không phải quản lý)",
    Manager: "Quản lý",
    "Director and above": "Giám đốc trở lên",
};

const { width } = Dimensions.get("window");

export default function JobsScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    // Use JobsContext instead of local state
    const { searchJobs, setSearchJobs, recommendedJobs, setRecommendedJobs } = useJobs();

    const [searchQuery, setSearchQuery] = useState("");

    // Filter states
    const [location, setLocation] = useState("");
    const [jobCategory, setJobCategory] = useState("");
    const [experienceLevel, setExperienceLevel] = useState("");

    // User data state
    const [userData, setUserData] = useState<UserData | null>(null);
    const [userDataLoading, setUserDataLoading] = useState(false);

    // Recommended tab filter states (similar to Recommend.jsx)
    const [recommendedFilters, setRecommendedFilters] = useState({
        address: true,
        rank: true,
        skills: true,
    });

    // Search info for recommended jobs (cache status, etc.)
    const [recommendedSearchInfo, setRecommendedSearchInfo] = useState<{
        cached: boolean;
        method: string;
        endpoint: string;
    } | null>(null);

    // Determine if user is authenticated and can see recommended tab
    const isAuthenticated = !!user;
    const [activeTab, setActiveTab] = useState<"search" | "recommended">(isAuthenticated ? "search" : "search");
    const [searchLoading, setSearchLoading] = useState(true);
    const [searchLoadingMore, setSearchLoadingMore] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [searchCurrentPage, setSearchCurrentPage] = useState(1);
    const [searchTotalJobs, setSearchTotalJobs] = useState(0);
    const [searchTotalPages, setSearchTotalPages] = useState(1);
    const [searchHasMorePages, setSearchHasMorePages] = useState(false);

    const [recommendedLoading, setRecommendedLoading] = useState(false);
    const [recommendedLoadingMore, setRecommendedLoadingMore] = useState(false);
    const [recommendedError, setRecommendedError] = useState<string | null>(null);
    const [recommendedCurrentPage, setRecommendedCurrentPage] = useState(1);
    const [recommendedTotalJobs, setRecommendedTotalJobs] = useState(0);
    const [recommendedTotalPages, setRecommendedTotalPages] = useState(1);
    const [recommendedHasMorePages, setRecommendedHasMorePages] = useState(false);

    // Pull-to-refresh states
    const [refreshing, setRefreshing] = useState(false);

    // Fetch user data when user logs in
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
                    hasProfile: !!data?.userData?.profile,
                    hasAddress: !!data?.userData?.profile?.Address,
                    hasRank: !!data?.userData?.profile?.Rank,
                    hasSkills: !!data?.userData?.profile?.Skills,
                    hasIndustry: !!data?.userData?.profile?.Industry,
                });
            } catch (error) {
                console.error("❌ Error fetching user data:", error);
                setUserData(null);
            } finally {
                setUserDataLoading(false);
            }
        };

        fetchUserData();
    }, [user?.uid]);

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

    // Auto search when filters change (only if there are active search criteria)
    useEffect(() => {
        if (activeTab === "search") {
            if (searchQuery.trim() || location || jobCategory || experienceLevel) {
                performSearch();
            } else {
                // When all criteria are cleared, fetch all jobs
                fetchSearchJobs(1, true);
            }
        }
    }, [location, jobCategory, experienceLevel]);

    // Fetch recommended jobs when switching to recommended tab or filters change
    useEffect(() => {
        if (activeTab === "recommended" && isAuthenticated && userData) {
            fetchRecommendedJobs(1, true);
        }
    }, [activeTab, userData, recommendedFilters]);

    const fetchSearchJobs = async (page: number = 1, reset: boolean = false) => {
        try {
            if (reset) {
                setSearchLoading(true);
                setSearchCurrentPage(1);
            } else {
                setSearchLoadingMore(true);
            }
            setSearchError(null);

            // Use searchJobsWithFilters API for all search tab requests
            const response = await apiService.searchJobsWithFilters({
                page: page,
                perPage: 10,
                uid: user?.uid,
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

            // Build request body exactly like Recommend.jsx
            const body: any = {};

            // Add filters based on enabled filters (similar to Recommend.jsx logic)
            if (recommendedFilters.skills && userData?.userData?.profile?.Skills) {
                body.skill = userData.userData.profile.Skills;
            }
            if (recommendedFilters.rank && userData?.userData?.profile?.Rank) {
                body.jobLevel = userData.userData.profile.Rank;
            }
            if (recommendedFilters.address && userData?.userData?.profile?.Address) {
                body.location = userData.userData.profile.Address;
            }

            // Always include these fields like Recommend.jsx
            if (userData?.userData?.profile?.Industry) {
                body.groupJobFunctionV3Name = userData.userData.profile.Industry;
            }
            if (userData?.userData?.review) {
                body.review = userData.userData.review;
            }
            if (user?.uid) {
                body.uid = user.uid;
            }
            body.method = "transformer"; // Add method for better matching

            console.log("🔍 Fetching recommended jobs with body:", body);

            try {
                // 🚀 PRIMARY: Try hybrid-search endpoint first (like Recommend.jsx)
                const response = await apiService.hybridSearchJobs({
                    page: page,
                    perPage: 10,
                    uid: body.uid,
                    skill: body.skill,
                    jobLevel: body.jobLevel,
                    location: body.location,
                    groupJobFunctionV3Name: body.groupJobFunctionV3Name,
                    review: body.review,
                    method: body.method,
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
                setRecommendedSearchInfo(response.searchInfo || null);
            } catch (primaryError) {
                console.warn("❌ Hybrid endpoint failed, trying fallback...", primaryError);

                // Check if primary error is about missing CV data
                const primaryErrorMessage = primaryError instanceof Error ? primaryError.message : String(primaryError);
                if (primaryErrorMessage.includes("Thiếu dữ liệu tổng quan")) {
                    // Show alert for missing CV data
                    Alert.alert(
                        "Thiếu thông tin cá nhân",
                        "Bạn cần cập nhật thông tin cá nhân trong hồ sơ để nhận được gợi ý việc làm phù hợp.",
                        [
                            {
                                text: "Cập nhật ngay",
                                onPress: () => router.push("/(tabs)/profile"),
                                style: "default",
                            },
                            {
                                text: "Để sau",
                                style: "cancel",
                            },
                        ],
                        { cancelable: true }
                    );

                    // Set empty state for recommended jobs
                    if (reset) {
                        setRecommendedJobs([]);
                        setRecommendedCurrentPage(1);
                    }
                    setRecommendedTotalPages(1);
                    setRecommendedHasMorePages(false);
                    setRecommendedTotalJobs(0);
                    setRecommendedSearchInfo(null);
                    return;
                }

                try {
                    // 🗝️ FALLBACK: Use regular search endpoint (like Recommend.jsx)
                    const fallbackResponse = await apiService.fallbackSearchJobs({
                        page: page,
                        perPage: 10,
                        uid: body.uid,
                        skill: body.skill,
                        jobLevel: body.jobLevel,
                        location: body.location,
                        groupJobFunctionV3Name: body.groupJobFunctionV3Name,
                        review: body.review,
                    });

                    if (reset) {
                        setRecommendedJobs(fallbackResponse.jobs || []);
                        setRecommendedCurrentPage(1);
                    } else {
                        const newJobs = fallbackResponse.jobs || [];
                        setRecommendedJobs((prevJobs) => {
                            const existingIds = new Set(prevJobs.map((job) => job._id));
                            const uniqueNewJobs = newJobs.filter((job) => !existingIds.has(job._id));
                            return [...prevJobs, ...uniqueNewJobs];
                        });
                        setRecommendedCurrentPage(page);
                    }

                    setRecommendedTotalPages(fallbackResponse.totalPages || 1);
                    setRecommendedHasMorePages(page < (fallbackResponse.totalPages || 1));
                    setRecommendedTotalJobs(fallbackResponse.totalJobs || 0);
                    setRecommendedSearchInfo({
                        cached: false,
                        method: "fallback",
                        endpoint: "jobs/search",
                    });
                } catch (fallbackError) {
                    console.error("❌ Both endpoints failed:", {
                        primary: primaryError,
                        fallback: fallbackError,
                    });

                    // Check if fallback error is also about missing CV data
                    const fallbackErrorMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
                    if (fallbackErrorMessage.includes("Thiếu dữ liệu tổng quan")) {
                        // Show alert for missing CV data
                        Alert.alert(
                            "Thiếu thông tin cá nhân",
                            "Bạn cần cập nhật thông tin cá nhân trong hồ sơ để nhận được gợi ý việc làm phù hợp.",
                            [
                                {
                                    text: "Cập nhật ngay",
                                    onPress: () => router.push("/(tabs)/profile"),
                                    style: "default",
                                },
                                {
                                    text: "Để sau",
                                    style: "cancel",
                                },
                            ],
                            { cancelable: true }
                        );

                        // Set empty state for recommended jobs
                        if (reset) {
                            setRecommendedJobs([]);
                            setRecommendedCurrentPage(1);
                        }
                        setRecommendedTotalPages(1);
                        setRecommendedHasMorePages(false);
                        setRecommendedTotalJobs(0);
                        setRecommendedSearchInfo(null);
                        return;
                    }

                    // Both endpoints failed - set graceful error state instead of throwing
                    console.warn("⚠️ Both hybrid and fallback endpoints failed, setting empty state");

                    if (reset) {
                        setRecommendedJobs([]);
                        setRecommendedCurrentPage(1);
                    }
                    setRecommendedTotalPages(1);
                    setRecommendedHasMorePages(false);
                    setRecommendedTotalJobs(0);
                    setRecommendedSearchInfo(null);
                    setRecommendedError("Không thể tải danh sách việc làm phù hợp. Vui lòng thử lại.");
                    return;
                }
            }
        } catch (err) {
            // Global catch - should not normally reach here due to improved error handling above
            console.error("❌ Unexpected error in fetchRecommendedJobs:", err);
            setRecommendedError("Có lỗi không mong đợi xảy ra. Vui lòng thử lại.");
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

            // If there are active search criteria, use performSearch logic
            if (searchQuery.trim() || location || jobCategory || experienceLevel) {
                // Load more with current search criteria
                const loadMoreWithFilters = async () => {
                    try {
                        setSearchLoadingMore(true);

                        const searchParams: any = {
                            page: nextPage,
                            perPage: 20,
                            uid: user?.uid,
                        };

                        if (searchQuery.trim()) searchParams.skill = searchQuery.trim();
                        if (location) searchParams.location = location;
                        if (jobCategory) searchParams.category = jobCategory;
                        if (experienceLevel) searchParams.jobLevel = experienceLevel;

                        const response = await apiService.searchJobsWithFilters(searchParams);

                        const newJobs = response.jobs || [];
                        setSearchJobs((prevJobs) => {
                            const existingIds = new Set(prevJobs.map((job) => job._id));
                            const uniqueNewJobs = newJobs.filter((job) => !existingIds.has(job._id));
                            return [...prevJobs, ...uniqueNewJobs];
                        });

                        setSearchCurrentPage(nextPage);
                        setSearchHasMorePages(nextPage < (response.totalPages || 1));
                    } catch (err) {
                        console.error("❌ Error loading more search jobs:", err);
                    } finally {
                        setSearchLoadingMore(false);
                    }
                };
                loadMoreWithFilters();
            } else {
                // Use regular fetchSearchJobs for non-filtered results
                fetchSearchJobs(nextPage, false);
            }
        }
    };

    const loadMoreRecommendedJobs = () => {
        if (!recommendedLoadingMore && recommendedHasMorePages) {
            const nextPage = recommendedCurrentPage + 1;
            fetchRecommendedJobs(nextPage, false);
        }
    };

    const performSearch = async () => {
        try {
            setSearchLoading(true);
            setSearchCurrentPage(1);
            setSearchHasMorePages(false);

            // Create search parameters for searchJobsWithFilters API
            const searchParams: any = {
                page: 1,
                perPage: 20,
                uid: user?.uid, // Add user uid for personalized search
            };

            if (searchQuery.trim()) searchParams.skill = searchQuery.trim();
            if (location) searchParams.location = location;
            if (jobCategory) searchParams.category = jobCategory;
            if (experienceLevel) searchParams.jobLevel = experienceLevel;

            // Use searchJobsWithFilters API with filters
            const response = await apiService.searchJobsWithFilters(searchParams);

            setSearchJobs(response.jobs || []);
            setSearchTotalJobs(response.totalJobs || 0);
            setSearchTotalPages(response.totalPages || 1);
            setSearchHasMorePages(response.currentPage < response.totalPages);
        } catch (err) {
            console.error("❌ Error searching jobs:", err);
            setSearchError("Không thể tìm kiếm việc làm. Vui lòng thử lại.");
        } finally {
            setSearchLoading(false);
        }
    };

    const handleViewDetail = async (job: Job) => {
        try {
            // Check if job has URL for detailed loading
            const canLoadDetails = !!job.url;

            // Navigate immediately with available data
            router.push({
                pathname: "/job-detail",
                params: {
                    jobId: job._id,
                    jobData: JSON.stringify(job),
                    canLoadDetails: canLoadDetails.toString(),
                },
            });
        } catch (err) {
            console.error("❌ Error navigating to job detail:", err);
            Alert.alert("Lỗi", "Không thể mở trang chi tiết việc làm. Vui lòng thử lại.");
        }
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

    // Semantic Score Progress Bar Component
    const SemanticScoreBar = ({ score, size = "small" }: { score: number; size?: "small" | "medium" }) => {
        const getScoreColor = (score: number) => {
            if (score >= 80) return "#10b981"; // Green
            if (score >= 60) return "#f59e0b"; // Yellow
            if (score >= 40) return "#f97316"; // Orange
            return "#ef4444"; // Red
        };

        const getScoreLabel = (score: number) => {
            if (score >= 80) return "Rất phù hợp";
            if (score >= 60) return "Phù hợp";
            if (score >= 40) return "Tương đối";
            return "Ít phù hợp";
        };

        const scoreColor = getScoreColor(score);
        const barHeight = size === "medium" ? 6 : 4;
        const textSize = size === "medium" ? 12 : 10;

        return (
            <View style={styles.semanticScoreContainer}>
                <View style={styles.scoreHeader}>
                    <View style={styles.scoreInfo}>
                        <IconSymbol name="sparkles" size={textSize} color={scoreColor} />
                        <ThemedText style={[styles.scoreLabel, { color: colors.text, fontSize: textSize }]}>{getScoreLabel(score)}</ThemedText>
                    </View>
                    <ThemedText style={[styles.scoreValue, { color: scoreColor, fontSize: textSize }]}>{Math.round(score)}%</ThemedText>
                </View>
                <View style={[styles.progressBarBackground, { height: barHeight, backgroundColor: colors.border }]}>
                    <View
                        style={[
                            styles.progressBarFill,
                            {
                                width: `${score}%`,
                                backgroundColor: scoreColor,
                                height: barHeight,
                            },
                        ]}
                    />
                </View>
            </View>
        );
    };

    const JobCard = ({ job, index }: { job: Job; index: number }) => (
        <View style={[styles.jobCard, { backgroundColor: colors.cardBackground }]}>
            {/* Header with company info */}
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

                {/* Semantic Score Badge - Show for recommended tab only */}
                {/* {activeTab === "recommended" && job.semanticScore !== undefined && (
                    <View style={[styles.scoreBadge, { backgroundColor: colors.success + "15" }]}>
                        <IconSymbol name="target" size={12} color={colors.success} />
                        <ThemedText style={[styles.scoreBadgeText, { color: colors.success }]}>{Math.round(job.semanticScore)}%</ThemedText>
                    </View>
                )} */}
            </View>

            {/* Job title */}
            <ThemedText style={[styles.jobTitle, { color: colors.text }]} numberOfLines={2}>
                {job.title || "Chưa có tiêu đề"}
            </ThemedText>

            {/* Semantic Score Progress Bar - Show only for recommended tab */}
            {activeTab === "recommended" && job.semanticScore !== undefined && <SemanticScoreBar score={job.semanticScore} size="small" />}

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
                {/* <TouchableOpacity style={[styles.bookmarkButton, { backgroundColor: colors.border }]} activeOpacity={0.7}>
                    <IconSymbol name="bookmark" size={16} color={colors.icon} />
                    <ThemedText style={[styles.bookmarkText, { color: colors.icon }]}>Lưu</ThemedText>
                </TouchableOpacity> */}

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

    // Toggle recommended filters
    const toggleRecommendedFilter = (filterType: "address" | "rank" | "skills") => {
        setRecommendedFilters((prev) => ({
            ...prev,
            [filterType]: !prev[filterType],
        }));
        // Reset to page 1 when filters change
        setRecommendedCurrentPage(1);
    };

    // Count active filters
    const activeFiltersCount = [location, jobCategory, experienceLevel].filter(Boolean).length;
    const activeRecommendedFiltersCount = Object.values(recommendedFilters).filter(Boolean).length;

    // Pull-to-refresh handler
    const handleRefresh = async () => {
        setRefreshing(true);

        // Light haptic feedback when refresh starts
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        try {
            // Always refresh user data if authenticated
            if (user?.uid) {
                try {
                    const data = await apiService.getUserData(user.uid);
                    setUserData(data);
                    console.log("🔄 User data refreshed");
                } catch (error) {
                    console.error("❌ Error refreshing user data:", error);
                }
            }

            // Refresh jobs based on active tab
            if (activeTab === "search") {
                // Reset search state and reload
                setSearchCurrentPage(1);
                setSearchHasMorePages(false);

                if (searchQuery.trim() || location || jobCategory || experienceLevel) {
                    // If there are search criteria, perform search
                    await performSearch();
                } else {
                    // Otherwise fetch all jobs
                    await fetchSearchJobs(1, true);
                }
                console.log("🔄 Search jobs refreshed");
            } else if (activeTab === "recommended" && userData) {
                // Reset recommended state and reload
                setRecommendedCurrentPage(1);
                setRecommendedHasMorePages(false);
                await fetchRecommendedJobs(1, true);
                console.log("🔄 Recommended jobs refreshed");
            }

            // Success haptic feedback
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (error) {
            console.error("❌ Error during refresh:", error);
            // Error haptic feedback
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert("Lỗi", "Không thể làm mới dữ liệu. Vui lòng thử lại.");
        } finally {
            setRefreshing(false);
        }
    };

    // Filter handlers
    const showLocationFilter = () => {
        Alert.alert(
            "Chọn địa điểm",
            "",
            [
                ...vietnameseProvinces.map((province) => ({
                    text: province,
                    onPress: () => setLocation(province === "Tất cả" ? "" : province),
                })),
                { text: "Hủy", style: "cancel" },
            ],
            { cancelable: true }
        );
    };

    const showJobCategoryFilter = () => {
        Alert.alert(
            "Chọn ngành nghề",
            "",
            [
                ...Object.entries(jobCategoriesMap).map(([key, value]) => ({
                    text: value,
                    onPress: () => setJobCategory(key),
                })),
                { text: "Hủy", style: "cancel" },
            ],
            { cancelable: true }
        );
    };

    const showExperienceLevelFilter = () => {
        Alert.alert(
            "Chọn kinh nghiệm",
            "",
            [
                ...Object.entries(experienceLevelsMap).map(([key, value]) => ({
                    text: value,
                    onPress: () => setExperienceLevel(key),
                })),
                { text: "Hủy", style: "cancel" },
            ],
            { cancelable: true }
        );
    };

    const showFiltersMenu = () => {
        Alert.alert(
            "Bộ lọc tìm kiếm",
            "Chọn loại bộ lọc bạn muốn thiết lập",
            [
                {
                    text: `📍 Địa điểm${location ? `: ${location}` : ""}`,
                    onPress: showLocationFilter,
                },
                {
                    text: `💼 Ngành nghề${jobCategory ? `: ${jobCategoriesMap[jobCategory as keyof typeof jobCategoriesMap]}` : ""}`,
                    onPress: showJobCategoryFilter,
                },
                {
                    text: `⭐ Kinh nghiệm${experienceLevel ? `: ${experienceLevelsMap[experienceLevel as keyof typeof experienceLevelsMap]}` : ""}`,
                    onPress: showExperienceLevelFilter,
                },
                ...(activeFiltersCount > 0
                    ? [
                          {
                              text: "🗑️ Xóa tất cả bộ lọc",
                              onPress: () => {
                                  setLocation("");
                                  setJobCategory("");
                                  setExperienceLevel("");
                                  // Fetch all jobs when filters are cleared
                                  setTimeout(() => {
                                      fetchSearchJobs(1, true);
                                  }, 100);
                              },
                          },
                      ]
                    : []),
                { text: "Hủy", style: "destructive" },
            ],
            { cancelable: true }
        );
    };

    // Cache Status Indicator Component (similar to Recommend.jsx)

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
                            : refreshing
                            ? activeTab === "search"
                                ? "🔄 Đang làm mới danh sách việc làm..."
                                : "🔄 Đang cập nhật gợi ý phù hợp..."
                            : activeTab === "search" && (searchQuery || activeFiltersCount > 0)
                            ? `${getCurrentJobs().length} kết quả tìm kiếm${activeFiltersCount > 0 ? ` với ${activeFiltersCount} bộ lọc` : ""}`
                            : activeTab === "recommended"
                            ? userDataLoading
                                ? "Đang tải thông tin cá nhân..."
                                : !userData?.userData?.profile
                                ? "Cập nhật hồ sơ để nhận gợi ý phù hợp"
                                : `${getCurrentJobs().length} / ${getCurrentTotalJobs()} gợi ý phù hợp • Trang ${getCurrentPage()}/${getCurrentTotalPages()}`
                            : !isAuthenticated
                            ? `${getCurrentJobs().length} / ${getCurrentTotalJobs()} việc làm • Đăng nhập để xem gợi ý phù hợp`
                            : `${getCurrentJobs().length} / ${getCurrentTotalJobs()} việc làm • Trang ${getCurrentPage()}/${getCurrentTotalPages()}`}
                    </ThemedText>
                    {/* Cache Status Indicator */}
                    {/* <CacheStatusIndicator /> */}
                </View>

                {/* Simple Tab System */}
                <View style={styles.tabContainer}>
                    {/* Search Tab */}
                    <TouchableOpacity
                        style={[
                            styles.tab,
                            activeTab === "search" && styles.activeTab,
                            { backgroundColor: activeTab === "search" ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.05)" },
                        ]}
                        onPress={() => setActiveTab("search")}
                        activeOpacity={0.8}
                    >
                        <IconSymbol name="magnifyingglass" size={16} color={activeTab === "search" ? "white" : "rgba(255,255,255,0.6)"} />
                        <ThemedText style={[styles.tabText, { color: activeTab === "search" ? "white" : "rgba(255,255,255,0.6)" }]}>Tất cả </ThemedText>
                    </TouchableOpacity>

                    {/* Recommend Tab */}
                    {isAuthenticated && (
                        <TouchableOpacity
                            style={[
                                styles.tab,
                                activeTab === "recommended" && styles.activeTab,
                                { backgroundColor: activeTab === "recommended" ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.05)" },
                            ]}
                            onPress={() => setActiveTab("recommended")}
                            activeOpacity={0.8}
                        >
                            <IconSymbol name="heart.fill" size={16} color={activeTab === "recommended" ? "white" : "rgba(255,255,255,0.6)"} />
                            <ThemedText style={[styles.tabText, { color: activeTab === "recommended" ? "white" : "rgba(255,255,255,0.6)" }]}>
                                Phù hợp{activeRecommendedFiltersCount > 0 && activeTab === "recommended" ? ` (${activeRecommendedFiltersCount})` : ""}
                            </ThemedText>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Search Input - Only show when search tab is active */}
                {activeTab === "search" && (
                    <View style={styles.searchInputSection}>
                        <View style={styles.searchInputWrapper}>
                            <IconSymbol name="magnifyingglass" size={16} color={"#ccc"} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Tìm kiếm việc làm, công ty..."
                                placeholderTextColor="rgba(255,255,255,0.7)"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                onSubmitEditing={performSearch}
                                returnKeyType="search"
                                autoFocus={false}
                                editable={true}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity
                                    onPress={() => {
                                        setSearchQuery("");
                                        // If no other filters are active, fetch all jobs
                                        if (!location && !jobCategory && !experienceLevel) {
                                            setTimeout(() => {
                                                fetchSearchJobs(1, true);
                                            }, 100);
                                        }
                                    }}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <IconSymbol name="xmark.circle.fill" size={16} color={"#ddd"} />
                                </TouchableOpacity>
                            )}

                            {/* Filter Button */}
                            <TouchableOpacity style={styles.filterButton} onPress={showFiltersMenu} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <IconSymbol name="slider.horizontal.3" size={16} color={"#fff"} />
                                {activeFiltersCount > 0 && (
                                    <View style={styles.filterBadge}>
                                        <ThemedText style={styles.filterBadgeText}>{activeFiltersCount}</ThemedText>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </LinearGradient>

            {/* Jobs List */}
            <ScrollView
                style={styles.jobsList}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.jobsContainer, { paddingBottom: insets.bottom + 60, paddingTop: 10 }]}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.tint}
                        colors={[colors.tint]}
                        progressBackgroundColor={colors.cardBackground}
                        title={refreshing ? (activeTab === "search" ? "Đang làm mới..." : "Đang cập nhật gợi ý...") : ""}
                        titleColor={colors.text}
                    />
                }
            >
                {/* Recommended Filters Panel */}
                {activeTab === "recommended" && userData?.userData?.profile && (
                    <View style={[styles.filtersPanel, { backgroundColor: colors.cardBackground }]}>
                        <View style={styles.filtersPanelHeader}>
                            <IconSymbol name="slider.horizontal.3" size={14} color={colors.tint} />
                            <ThemedText style={[styles.filtersPanelTitle, { color: colors.text }]}>Bộ lọc cá nhân hóa</ThemedText>
                        </View>

                        <View style={styles.filtersContainer}>
                            {userData.userData.profile.Address && (
                                <TouchableOpacity
                                    style={[
                                        styles.filterCheckbox,
                                        {
                                            backgroundColor: recommendedFilters.address ? colors.tint + "15" : colors.background,
                                            borderColor: recommendedFilters.address ? colors.tint : colors.border,
                                        },
                                    ]}
                                    onPress={() => toggleRecommendedFilter("address")}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.checkbox, { backgroundColor: recommendedFilters.address ? colors.tint : "transparent" }]}>
                                        {recommendedFilters.address && <IconSymbol name="checkmark" size={12} color="white" />}
                                    </View>
                                    <ThemedText style={[styles.filterCheckboxText, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
                                        📍 {userData.userData.profile.Address}
                                    </ThemedText>
                                </TouchableOpacity>
                            )}

                            {userData.userData.profile.Rank && (
                                <TouchableOpacity
                                    style={[
                                        styles.filterCheckbox,
                                        {
                                            backgroundColor: recommendedFilters.rank ? colors.tint + "15" : colors.background,
                                            borderColor: recommendedFilters.rank ? colors.tint : colors.border,
                                        },
                                    ]}
                                    onPress={() => toggleRecommendedFilter("rank")}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.checkbox, { backgroundColor: recommendedFilters.rank ? colors.tint : "transparent" }]}>
                                        {recommendedFilters.rank && <IconSymbol name="checkmark" size={12} color="white" />}
                                    </View>
                                    <ThemedText style={[styles.filterCheckboxText, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
                                        ⭐ {userData.userData.profile.Rank}
                                    </ThemedText>
                                </TouchableOpacity>
                            )}

                            {userData.userData.profile.Skills && (
                                <TouchableOpacity
                                    style={[
                                        styles.filterCheckbox,
                                        {
                                            backgroundColor: recommendedFilters.skills ? colors.tint + "15" : colors.background,
                                            borderColor: recommendedFilters.skills ? colors.tint : colors.border,
                                        },
                                    ]}
                                    onPress={() => toggleRecommendedFilter("skills")}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.checkbox, { backgroundColor: recommendedFilters.skills ? colors.tint : "transparent" }]}>
                                        {recommendedFilters.skills && <IconSymbol name="checkmark" size={12} color="white" />}
                                    </View>
                                    <ThemedText style={[styles.filterCheckboxText, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
                                        🔧{" "}
                                        {userData.userData.profile.Skills.length > 30
                                            ? `${userData.userData.profile.Skills.slice(0, 30)}...`
                                            : userData.userData.profile.Skills}
                                    </ThemedText>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}

                {getCurrentLoading() ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.tint} />
                        <ThemedText style={[styles.loadingText, { color: colors.text }]}>
                            {activeTab === "search" ? "Đang tải việc làm..." : userDataLoading ? "Đang tải thông tin cá nhân..." : "Đang tìm kiếm việc làm phù hợp..."}
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
                            {activeTab === "search"
                                ? "Không tìm thấy việc làm"
                                : activeTab === "recommended" && !userData?.userData?.profile
                                ? "Chưa có hồ sơ cá nhân"
                                : activeTab === "recommended" && activeRecommendedFiltersCount === 0
                                ? "Chọn bộ lọc để nhận gợi ý"
                                : "Không tìm thấy việc làm phù hợp"}
                        </ThemedText>
                        <ThemedText style={[styles.emptySubtitle, { color: colors.icon }]}>
                            {activeTab === "search"
                                ? "Thử tìm kiếm với từ khóa khác hoặc thay đổi bộ lọc"
                                : activeTab === "recommended" && !userData?.userData?.profile
                                ? "Cập nhật thông tin hồ sơ để nhận được gợi ý việc làm phù hợp"
                                : activeTab === "recommended" && activeRecommendedFiltersCount === 0
                                ? "Chọn ít nhất một bộ lọc để hệ thống gợi ý việc làm phù hợp với bạn"
                                : activeRecommendedFiltersCount > 0
                                ? "Thử bỏ chọn một số bộ lọc để mở rộng kết quả tìm kiếm"
                                : "Hệ thống sẽ gợi ý việc làm phù hợp với bạn sau khi có đủ dữ liệu"}
                        </ThemedText>

                        {/* Show action button for empty recommended state */}
                        {activeTab === "recommended" && !userData?.userData?.profile && (
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: colors.tint }]}
                                onPress={() => router.push("/(tabs)/profile")}
                                activeOpacity={0.8}
                            >
                                <IconSymbol name="person.crop.circle" size={16} color="white" />
                                <ThemedText style={styles.actionButtonText}>Cập nhật hồ sơ</ThemedText>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    <>
                        {getCurrentJobs().map((job, index) => (
                            <JobCard key={`${job._id}-${index}`} job={job} index={index} />
                        ))}

                        {/* Load More Button for Search Tab */}
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

                        {/* Load More Button for Recommended Tab */}
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
                                    {recommendedSearchInfo && (
                                        <ThemedText style={[styles.paginationInfo, { color: colors.icon }]}>
                                            {" • "}
                                            {recommendedSearchInfo.method === "hybrid" ? "Tối ưu hóa AI" : "Tìm kiếm thông thường"}
                                        </ThemedText>
                                    )}
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
    tabContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingHorizontal: 20,
        paddingVertical: 16,
        marginTop: 0,
    },
    tab: {
        paddingVertical: 5,
        paddingHorizontal: 10,
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
        borderColor: "rgba(255,255,255,1)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
    },
    searchInputSection: {
        paddingHorizontal: 20,
    },
    searchInputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.1)",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 3,
        gap: 8,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        fontWeight: "500",
        color: "white",
        paddingVertical: 0,
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
        paddingVertical: 6,
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
    tabText: {
        fontSize: 14,
        fontWeight: "700",
    },
    filterButton: {
        padding: 8,
        borderRadius: 12,
    },
    filterBadge: {
        alignItems: "center",
        justifyContent: "center",
        position: "absolute",
        top: -4,
        right: 0,
        padding: 2,
        borderRadius: 12,
    },
    filterBadgeText: {
        fontSize: 12,
        fontWeight: "700",
        color: "white",
    },
    cacheStatus: {
        padding: 8,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
        borderRadius: 8,
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    cacheStatusText: {
        fontSize: 12,
        fontWeight: "500",
    },
    filtersPanel: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    filtersPanelHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
    },
    filtersPanelTitle: {
        fontSize: 14,
        fontWeight: "700",
    },
    filtersContainer: {
        gap: 8,
    },
    filterCheckbox: {
        padding: 12,
        borderWidth: 1,
        borderRadius: 8,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    checkbox: {
        width: 16,
        height: 16,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.1)",
        alignItems: "center",
        justifyContent: "center",
    },
    filterCheckboxText: {
        flex: 1,
        fontSize: 12,
        fontWeight: "500",
    },
    actionButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        marginTop: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    actionButtonText: {
        color: "white",
        fontSize: 14,
        fontWeight: "700",
    },
    semanticScoreContainer: {
        marginTop: 8,
        marginBottom: 4,
        padding: 8,
        backgroundColor: "rgba(255,255,255,0.05)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        borderRadius: 8,
    },
    scoreHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 4,
    },
    scoreInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    scoreLabel: {
        fontSize: 10,
        fontWeight: "500",
    },
    scoreValue: {
        fontSize: 11,
        fontWeight: "700",
    },
    progressBarBackground: {
        height: 4,
        borderRadius: 2,
        backgroundColor: "rgba(0,0,0,0.1)",
        overflow: "hidden",
    },
    progressBarFill: {
        height: "100%",
        borderRadius: 2,
    },
    scoreBadge: {
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 6,
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
    },
    scoreBadgeText: {
        fontSize: 10,
        fontWeight: "600",
    },
});
