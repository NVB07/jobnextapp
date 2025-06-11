import React, { useState, useEffect } from "react";
import { StyleSheet, ScrollView, View, StatusBar, ActivityIndicator, TouchableOpacity, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router, Stack } from "expo-router";
import Markdown from "react-native-markdown-display";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { BlogPost } from "@/services/api";

export default function BlogDetailScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams<{ blogId: string; blogData: string }>();

    const [blog, setBlog] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.blogData) {
            try {
                const blogData = JSON.parse(params.blogData);
                setBlog(blogData);
                setLoading(false);
            } catch (error) {
                console.log("Error parsing blog data:", error);
                setLoading(false);
            }
        }
    }, [params.blogData]);

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("vi-VN", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
        } catch {
            return "Vừa đăng";
        }
    };

    // Custom image renderer to fix FitImage key prop error
    const customImageRenderer = (node: any, children: any, parent: any, styles: any) => {
        const { src, alt } = node.attributes;
        return (
            <Image
                key={node.key}
                source={{ uri: src }}
                style={{
                    width: "100%",
                    height: 200,
                    resizeMode: "cover" as const,
                    borderRadius: 8,
                    marginVertical: 8,
                }}
                alt={alt}
            />
        );
    };

    const getMarkdownStyles = () => ({
        body: {
            fontSize: 16,
            lineHeight: 24,
            color: colors.text,
        },
        paragraph: {
            fontSize: 16,
            lineHeight: 24,
            color: colors.text,
            marginBottom: 12,
        },
        heading1: {
            fontSize: 24,
            fontWeight: "bold" as const,
            color: colors.text,
            marginBottom: 16,
            marginTop: 20,
        },
        heading2: {
            fontSize: 20,
            fontWeight: "bold" as const,
            color: colors.text,
            marginBottom: 12,
            marginTop: 16,
        },
        heading3: {
            fontSize: 18,
            fontWeight: "600" as const,
            color: colors.text,
            marginBottom: 8,
            marginTop: 12,
        },
        strong: {
            fontWeight: "bold" as const,
            color: colors.text,
        },
        em: {
            fontStyle: "italic" as const,
            color: colors.text,
        },
        code_inline: {
            backgroundColor: colors.border,
            paddingHorizontal: 4,
            paddingVertical: 2,
            borderRadius: 4,
            fontSize: 14,
            color: colors.text,
        },
        code_block: {
            backgroundColor: colors.border,
            padding: 12,
            borderRadius: 8,
            fontSize: 14,
            color: colors.text,
            marginVertical: 8,
        },
        blockquote: {
            borderLeftWidth: 4,
            borderLeftColor: colors.tint,
            paddingLeft: 16,
            backgroundColor: colors.border + "30",
            paddingVertical: 8,
            marginVertical: 8,
        },
        list_item: {
            fontSize: 16,
            lineHeight: 24,
            color: colors.text,
            marginBottom: 4,
        },
        bullet_list: {
            marginBottom: 12,
        },
        ordered_list: {
            marginBottom: 12,
        },
        link: {
            color: colors.tint,
            textDecorationLine: "underline" as const,
        },
    });

    const HeaderWithBack = () => (
        <View style={[styles.headerContainer, { paddingTop: insets.top, backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.border }]}>
            <View style={styles.headerContent}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <IconSymbol name="chevron.left" size={24} color={colors.text} />
                </TouchableOpacity>
                <ThemedText style={[styles.headerTitle, { color: colors.text }]}>Chi tiết bài viết</ThemedText>
                <View style={styles.placeholder} />
            </View>
        </View>
    );

    if (loading) {
        return (
            <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
                <Stack.Screen options={{ headerShown: false }} />
                <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} />
                <HeaderWithBack />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.tint} />
                    <ThemedText style={[styles.loadingText, { color: colors.text }]}>Đang tải bài viết...</ThemedText>
                </View>
            </ThemedView>
        );
    }

    if (!blog) {
        return (
            <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
                <Stack.Screen options={{ headerShown: false }} />
                <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} />
                <HeaderWithBack />
                <View style={styles.errorContainer}>
                    <IconSymbol name="exclamationmark.triangle" size={48} color={colors.icon} />
                    <ThemedText style={[styles.errorText, { color: colors.text }]}>Không thể tải bài viết</ThemedText>
                </View>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} />
            <HeaderWithBack />

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 20, marginTop: 90 }}>
                {/* Blog Header */}
                <View style={styles.header}>
                    <ThemedText style={[styles.title, { color: colors.text }]}>{blog.title || "Chưa có tiêu đề"}</ThemedText>

                    <View style={styles.meta}>
                        <View style={styles.authorInfo}>
                            <View style={styles.authorAvatarContainer}>
                                <Image
                                    source={require("@/assets/images/icon320.png")}
                                    style={styles.authorAvatarImage}
                                    resizeMode="cover"
                                    defaultSource={require("@/assets/images/favicon.png")}
                                />
                            </View>
                            <View>
                                <ThemedText style={[styles.authorName, { color: colors.text }]}>JobNext</ThemedText>
                                <ThemedText style={[styles.publishDate, { color: colors.icon }]}>{formatDate(blog.createdAt)}</ThemedText>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Blog Content */}
                <View style={styles.contentContainer}>
                    <Markdown
                        style={getMarkdownStyles()}
                        rules={{
                            image: customImageRenderer,
                        }}
                    >
                        {blog.content || "Chưa có nội dung"}
                    </Markdown>
                </View>

                {/* Tags */}
                {blog.tags && blog.tags.length > 0 && (
                    <View style={styles.tagsContainer}>
                        {/* <ThemedText style={[styles.tagsTitle, { color: colors.text }]}>Từ khóa</ThemedText> */}
                        <View style={styles.tagsWrapper}>
                            {blog.tags.map((tag, index) => (
                                <View key={index} style={[styles.tag, { backgroundColor: colors.border }]}>
                                    <ThemedText style={[styles.tagText, { color: colors.text }]}>{tag}</ThemedText>
                                </View>
                            ))}
                        </View>
                    </View>
                )}
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
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    loadingText: {
        fontSize: 16,
        marginTop: 12,
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        marginTop: 12,
        textAlign: "center",
    },
    header: {
        padding: 20,
        gap: 16,
    },
    categoryBadge: {
        alignSelf: "flex-start",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: "600",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        lineHeight: 32,
    },
    excerpt: {
        fontSize: 16,
        lineHeight: 24,
    },
    meta: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginTop: 8,
    },
    authorInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        flex: 1,
    },
    authorAvatarContainer: {
        width: 46,
        height: 46,
        borderRadius: 12,
        overflow: "hidden",
    },
    authorAvatarImage: {
        width: "100%",
        height: "100%",
    },
    authorName: {
        fontSize: 14,
        marginBottom: 0,
        fontWeight: "600",
    },
    publishDate: {
        fontSize: 12,
        marginTop: 0,
    },
    readInfo: {
        alignItems: "flex-end",
        gap: 4,
    },
    readTime: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    readTimeText: {
        fontSize: 12,
    },
    stats: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    statsText: {
        fontSize: 12,
    },
    contentContainer: {
        padding: 20,
        paddingTop: 0,
        gap: 16,
    },
    contentParagraph: {
        fontSize: 16,
        lineHeight: 24,
        textAlign: "justify",
    },
    tagsContainer: {
        padding: 20,
        paddingTop: 0,
        gap: 12,
    },
    tagsTitle: {
        fontSize: 16,
        fontWeight: "600",
    },
    tagsWrapper: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    tag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    tagText: {
        fontSize: 12,
        fontWeight: "500",
    },
    headerContainer: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1,
    },
    headerContent: {
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginLeft: 10,
    },
    placeholder: {
        flex: 1,
    },
});
