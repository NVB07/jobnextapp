import React, { useState, useEffect } from "react";
import { StyleSheet, ScrollView, TouchableOpacity, View, Dimensions, StatusBar, Image, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { apiService, BlogPost } from "@/services/api";

const { width } = Dimensions.get("window");

export default function BlogScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];
    const insets = useSafeAreaInsets();
    const [blogs, setBlogs] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchBlogs();
    }, []);

    const fetchBlogs = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log("🔄 Fetching blogs from API...");

            const response = await apiService.getBlogs({
                page: 1,
                limit: 50, // Get more blogs since we're not filtering
            });

            console.log("📊 Blogs API Response:", {
                blogsCount: response.blogs?.length || 0,
                totalBlogs: response.totalBlogs,
                currentPage: response.currentPage,
                totalPages: response.totalPages,
            });

            // Debug: Log first blog structure to see what's missing
            if (response.blogs && response.blogs.length > 0) {
                console.log("🔍 First blog structure:", JSON.stringify(response.blogs[0], null, 2));
            }

            setBlogs(response.blogs || []);
        } catch (err) {
            console.log("❌ Error fetching blogs:", err);
            setError("Không thể tải danh sách blog. Vui lòng thử lại.");
            setBlogs([]);
        } finally {
            setLoading(false);
        }
    };

    const handleBlogPress = (blog: BlogPost) => {
        router.push({
            pathname: "/blog-detail" as any,
            params: {
                blogId: blog._id,
                blogData: JSON.stringify(blog),
            },
        });
    };

    const getPostGradient = (index: number): [string, string] => {
        const gradients = [
            ["#6366f1", "#8b5cf6"],
            ["#10b981", "#34d399"],
            ["#f59e0b", "#fbbf24"],
            ["#ef4444", "#f87171"],
            ["#8b5cf6", "#a78bfa"],
        ];
        return gradients[index % gradients.length] as [string, string];
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("vi-VN");
        } catch {
            return "Vừa đăng";
        }
    };

    const BlogCard = ({ post, index }: { post: BlogPost; index: number }) => (
        <TouchableOpacity style={[styles.blogCard, { backgroundColor: colors.cardBackground }]} activeOpacity={0.8} onPress={() => handleBlogPress(post)}>
            {/* Header with JobNext branding */}
            <View style={styles.blogCardHeader}>
                <View style={styles.jobNextBranding}>
                    <View style={styles.logoContainer}>
                        <Image
                            source={require("@/assets/images/icon320.png")}
                            style={styles.jobNextLogoImage}
                            resizeMode="cover"
                            defaultSource={require("@/assets/images/favicon.png")}
                        />
                    </View>
                    <ThemedText style={[styles.jobNextText, { color: colors.text }]}>JobNext</ThemedText>
                </View>
            </View>

            {/* Title */}
            <ThemedText style={[styles.blogCardTitle, { color: colors.text }]} numberOfLines={2}>
                {(post.title || "Chưa có tiêu đề").length > 85 ? (post.title || "Chưa có tiêu đề").slice(0, 85) + "..." : post.title || "Chưa có tiêu đề"}
            </ThemedText>

            {/* Content Preview */}
            <ThemedText style={[styles.blogCardContent, { color: colors.icon }]} numberOfLines={3}>
                {(() => {
                    const content = post.content || "Chưa có nội dung";
                    const cleanContent = content.replaceAll("*", "").replaceAll("#", "").replaceAll("`", "").replaceAll("+", "");
                    return cleanContent.length > 230 ? cleanContent.slice(0, 230) + "..." : cleanContent;
                })()}
            </ThemedText>

            {/* Footer with Tags and Date */}
            <View style={styles.blogCardFooter}>
                <View style={styles.tagsContainer}>
                    {post.tags && post.tags.length > 0 && (
                        <>
                            {post.tags.slice(0, 2).map((tag, tagIndex) => (
                                <LinearGradient key={tagIndex} colors={["#3b82f6", "#8b5cf6"]} style={styles.gradientTag} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                    <ThemedText style={styles.tagText}>{tag}</ThemedText>
                                </LinearGradient>
                            ))}
                            {post.tags.length > 2 && (
                                <View style={[styles.remainingTagsCount, { backgroundColor: colors.border }]}>
                                    <ThemedText style={[styles.remainingTagsText, { color: colors.text }]}>+{post.tags.length - 2}</ThemedText>
                                </View>
                            )}
                        </>
                    )}
                </View>

                <ThemedText style={[styles.dateText, { color: colors.icon }]}>{formatDate(post.createdAt)}</ThemedText>
            </View>
        </TouchableOpacity>
    );

    return (
        <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} />

            {/* Header */}
            <LinearGradient colors={colors.gradient} style={[styles.header, { paddingTop: insets.top }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={styles.headerContent}>
                    <ThemedText style={styles.headerTitle}>Cẩm nang nghề nghiệp</ThemedText>
                    <ThemedText style={styles.sectionSubtitle}>Khám phá thông tin hữu ích liên quan tới nghề nghiệp</ThemedText>
                </View>
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 0, paddingTop: 20 }}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.tint} />
                        <ThemedText style={[styles.loadingText, { color: colors.text }]}>Đang tải bài viết...</ThemedText>
                    </View>
                ) : error ? (
                    <View style={styles.errorContainer}>
                        <IconSymbol name="exclamationmark.triangle" size={48} color={colors.icon} />
                        <ThemedText style={[styles.errorTitle, { color: colors.text }]}>{error}</ThemedText>
                        <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.tint }]} onPress={fetchBlogs}>
                            <ThemedText style={styles.retryText}>Thử lại</ThemedText>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        {/* Blog Posts */}
                        <View style={styles.postsSection}>
                            <View style={styles.postsGrid}>
                                {blogs.length === 0 ? (
                                    <View style={styles.emptyState}>
                                        <IconSymbol name="newspaper" size={48} color={colors.icon} />
                                        <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>Không có bài viết</ThemedText>
                                        <ThemedText style={[styles.emptySubtitle, { color: colors.icon }]}>Chưa có bài viết nào trong danh mục này</ThemedText>
                                    </View>
                                ) : (
                                    blogs.map((post, index) => <BlogCard key={post._id} post={post} index={index} />)
                                )}
                            </View>
                        </View>
                    </>
                )}
            </ScrollView>
        </ThemedView>
    );
}

// Add new styles for loading and error states
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
    content: {
        flex: 1,
    },
    postsSection: {
        paddingHorizontal: 24,
        paddingBottom: 100,
    },
    postsHeader: {
        gap: 8,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: "bold",
    },
    sectionSubtitle: {
        fontSize: 14,
        color: "rgba(255,255,255,0.85)",
        textAlign: "center",
        maxWidth: width * 0.5,
        lineHeight: 16,
    },
    postsGrid: {
        gap: 16,
    },
    blogCard: {
        padding: 20,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
        gap: 16,
    },
    blogCardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    jobNextBranding: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    logoContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        overflow: "hidden",
    },
    jobNextLogoImage: {
        width: "100%",
        height: "100%",
    },
    jobNextText: {
        fontSize: 12,
        fontWeight: "600",
    },
    optionButton: {
        padding: 4,
    },
    blogCardTitle: {
        fontSize: 18,
        fontWeight: "bold",
        lineHeight: 24,
    },
    blogCardContent: {
        fontSize: 14,
        lineHeight: 20,
    },
    blogCardFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    tagsContainer: {
        flexDirection: "row",
        gap: 8,
    },
    gradientTag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    tagText: {
        fontSize: 12,
        fontWeight: "600",
        color: "white",
    },
    dateText: {
        fontSize: 12,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    loadingText: {
        fontSize: 16,
        marginTop: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginTop: 16,
        textAlign: "center",
    },
    retryButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 16,
        marginTop: 24,
    },
    retryText: {
        fontSize: 16,
        fontWeight: "600",
        color: "white",
    },
    emptyState: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginTop: 16,
        textAlign: "center",
    },
    emptySubtitle: {
        fontSize: 14,
        marginTop: 8,
        textAlign: "center",
    },
    remainingTagsCount: {
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 8,
    },
    remainingTagsText: {
        fontSize: 12,
        fontWeight: "600",
    },
});
