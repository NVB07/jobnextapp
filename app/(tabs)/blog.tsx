import React, { useState, useEffect } from "react";
import { StyleSheet, ScrollView, TouchableOpacity, View, Dimensions, StatusBar, Image, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
    const [selectedCategory, setSelectedCategory] = useState("Tất cả");
    const [blogs, setBlogs] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const categories = ["Tất cả", "Nghề nghiệp", "Kỹ năng", "Phỏng vấn", "Lương thưởng", "Xu hướng"];

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
                limit: 20,
            });

            console.log("📊 Blogs API Response:", {
                blogsCount: response.blogs?.length || 0,
                totalBlogs: response.totalBlogs,
                currentPage: response.currentPage,
                totalPages: response.totalPages,
            });

            setBlogs(response.blogs || []);
        } catch (err) {
            console.error("❌ Error fetching blogs:", err);
            setError("Không thể tải danh sách blog. Vui lòng thử lại.");
            // Fallback to empty array if API fails
            setBlogs([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredPosts = blogs.filter((post) => selectedCategory === "Tất cả" || post.category === selectedCategory);

    const featuredPosts = blogs.filter((post) => post.featured);

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

    const FeaturedCard = ({ post, index }: { post: BlogPost; index: number }) => (
        <TouchableOpacity style={[styles.featuredCard, { backgroundColor: colors.cardBackground }]} activeOpacity={0.8}>
            <LinearGradient colors={getPostGradient(index)} style={styles.featuredGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={styles.featuredContent}>
                    <View style={styles.featuredBadge}>
                        <ThemedText style={styles.featuredBadgeText}>Nổi bật</ThemedText>
                    </View>

                    <ThemedText style={styles.featuredTitle} numberOfLines={2}>
                        {post.title}
                    </ThemedText>

                    <ThemedText style={styles.featuredExcerpt} numberOfLines={2}>
                        {post.excerpt}
                    </ThemedText>

                    <View style={styles.featuredMeta}>
                        <View style={styles.featuredMetaItem}>
                            <IconSymbol name="person.circle.fill" size={16} color="rgba(255,255,255,0.8)" />
                            <ThemedText style={styles.featuredMetaText}>{post.author.name}</ThemedText>
                        </View>
                        <View style={styles.featuredMetaItem}>
                            <IconSymbol name="clock.fill" size={16} color="rgba(255,255,255,0.8)" />
                            <ThemedText style={styles.featuredMetaText}>{post.readTime}</ThemedText>
                        </View>
                    </View>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );

    const BlogCard = ({ post, index }: { post: BlogPost; index: number }) => (
        <TouchableOpacity style={[styles.blogCard, { backgroundColor: colors.cardBackground }]} activeOpacity={0.8}>
            <View style={styles.blogHeader}>
                <LinearGradient colors={getPostGradient(index)} style={styles.blogIcon}>
                    <IconSymbol name="newspaper.fill" size={20} color="white" />
                </LinearGradient>

                <View style={[styles.categoryBadge, { backgroundColor: colors.border }]}>
                    <ThemedText style={[styles.categoryText, { color: colors.text }]}>{post.category}</ThemedText>
                </View>
            </View>

            <ThemedText style={[styles.blogTitle, { color: colors.text }]} numberOfLines={2}>
                {post.title}
            </ThemedText>

            <ThemedText style={[styles.blogExcerpt, { color: colors.icon }]} numberOfLines={3}>
                {post.excerpt}
            </ThemedText>

            <View style={styles.blogFooter}>
                <View style={styles.authorInfo}>
                    <View style={[styles.authorAvatar, { backgroundColor: colors.border }]}>
                        <IconSymbol name="person.fill" size={12} color={colors.icon} />
                    </View>
                    <View>
                        <ThemedText style={[styles.authorName, { color: colors.text }]}>{post.author.name}</ThemedText>
                        <ThemedText style={[styles.postDate, { color: colors.icon }]}>{formatDate(post.publishedAt)}</ThemedText>
                    </View>
                </View>

                <View style={styles.readTime}>
                    <IconSymbol name="book.fill" size={12} color={colors.icon} />
                    <ThemedText style={[styles.readTimeText, { color: colors.icon }]}>{post.readTime}</ThemedText>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} />

            {/* Header */}
            <LinearGradient colors={colors.gradient} style={[styles.header, { paddingTop: insets.top }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={styles.headerContent}>
                    <ThemedText style={styles.headerTitle}>Blog nghề nghiệp</ThemedText>
                    <ThemedText style={styles.headerSubtitle}>Chia sẻ kinh nghiệm và kiến thức hữu ích</ThemedText>
                </View>
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 0 }}>
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
                        {/* Featured Posts */}
                        {featuredPosts.length > 0 && (
                            <View style={styles.featuredSection}>
                                <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Bài viết nổi bật</ThemedText>

                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredContainer}>
                                    {featuredPosts.map((post, index) => (
                                        <FeaturedCard key={post._id} post={post} index={index} />
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {/* Categories Filter */}
                        <View style={styles.categoriesSection}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
                                {categories.map((category) => (
                                    <TouchableOpacity
                                        key={category}
                                        style={[
                                            styles.categoryChip,
                                            selectedCategory === category && styles.categoryChipActive,
                                            {
                                                backgroundColor: selectedCategory === category ? colors.tint : colors.cardBackground,
                                                borderColor: colors.border,
                                            },
                                        ]}
                                        onPress={() => setSelectedCategory(category)}
                                        activeOpacity={0.8}
                                    >
                                        <ThemedText
                                            style={[
                                                styles.categoryChipText,
                                                {
                                                    color: selectedCategory === category ? "white" : colors.text,
                                                },
                                            ]}
                                        >
                                            {category}
                                        </ThemedText>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Blog Posts */}
                        <View style={styles.postsSection}>
                            <View style={styles.postsHeader}>
                                <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                                    {selectedCategory === "Tất cả" ? "Tất cả bài viết" : selectedCategory}
                                </ThemedText>
                                <ThemedText style={[styles.postsCount, { color: colors.icon }]}>{filteredPosts.length} bài viết</ThemedText>
                            </View>

                            <View style={styles.postsGrid}>
                                {filteredPosts.length === 0 ? (
                                    <View style={styles.emptyState}>
                                        <IconSymbol name="newspaper" size={48} color={colors.icon} />
                                        <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>Không có bài viết</ThemedText>
                                        <ThemedText style={[styles.emptySubtitle, { color: colors.icon }]}>Chưa có bài viết nào trong danh mục này</ThemedText>
                                    </View>
                                ) : (
                                    filteredPosts.map((post, index) => <BlogCard key={post._id} post={post} index={index} />)
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
        fontSize: 28,
        fontWeight: "bold",
        color: "white",
    },
    headerSubtitle: {
        fontSize: 16,
        color: "rgba(255,255,255,0.8)",
        textAlign: "center",
    },
    content: {
        flex: 1,
    },
    featuredSection: {
        paddingVertical: 24,
        gap: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "bold",
        paddingHorizontal: 24,
    },
    featuredContainer: {
        paddingHorizontal: 24,
        gap: 16,
    },
    featuredCard: {
        width: width * 0.85,
        borderRadius: 20,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },
    featuredGradient: {
        padding: 24,
        minHeight: 200,
        justifyContent: "space-between",
    },
    featuredContent: {
        gap: 12,
    },
    featuredBadge: {
        alignSelf: "flex-start",
        backgroundColor: "rgba(255,255,255,0.2)",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    featuredBadgeText: {
        fontSize: 12,
        fontWeight: "600",
        color: "white",
    },
    featuredTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "white",
        lineHeight: 28,
    },
    featuredExcerpt: {
        fontSize: 14,
        color: "rgba(255,255,255,0.9)",
        lineHeight: 20,
    },
    featuredMeta: {
        flexDirection: "row",
        gap: 16,
        marginTop: 8,
    },
    featuredMetaItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    featuredMetaText: {
        fontSize: 12,
        color: "rgba(255,255,255,0.8)",
    },
    categoriesSection: {
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    categoriesContainer: {
        gap: 12,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        borderWidth: 1,
    },
    categoryChipActive: {
        borderWidth: 0,
    },
    categoryChipText: {
        fontSize: 14,
        fontWeight: "600",
    },
    postsSection: {
        paddingHorizontal: 24,
        paddingBottom: 100,
    },
    postsHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    postsCount: {
        fontSize: 14,
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
    blogHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    blogIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    categoryBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: "600",
    },
    blogTitle: {
        fontSize: 18,
        fontWeight: "bold",
        lineHeight: 24,
    },
    blogExcerpt: {
        fontSize: 14,
        lineHeight: 20,
    },
    blogFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    authorInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    authorAvatar: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    authorName: {
        fontSize: 12,
        fontWeight: "600",
    },
    postDate: {
        fontSize: 10,
    },
    readTime: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    readTimeText: {
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
});
