import React, { useState } from "react";
import { StyleSheet, ScrollView, TouchableOpacity, View, Alert, Dimensions, StatusBar } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as DocumentPicker from "expo-document-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

const { width } = Dimensions.get("window");

interface AnalysisResult {
    overallScore: number;
    categories: {
        name: string;
        score: number;
        icon: string;
        color: [string, string];
        feedback: string;
    }[];
    recommendations: string[];
    strengths: string[];
}

export default function CVAnalysisScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];
    const insets = useSafeAreaInsets();
    const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerResult | null>(null);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const mockAnalysisResult: AnalysisResult = {
        overallScore: 85,
        categories: [
            {
                name: "Thông tin cá nhân",
                score: 90,
                icon: "person.circle.fill",
                color: ["#10b981", "#34d399"] as [string, string],
                feedback: "Thông tin liên hệ đầy đủ và chuyên nghiệp",
            },
            {
                name: "Kinh nghiệm làm việc",
                score: 85,
                icon: "briefcase.fill",
                color: ["#6366f1", "#8b5cf6"] as [string, string],
                feedback: "Kinh nghiệm phong phú và liên quan đến vị trí",
            },
            {
                name: "Kỹ năng",
                score: 80,
                icon: "star.fill",
                color: ["#f59e0b", "#fbbf24"] as [string, string],
                feedback: "Kỹ năng đa dạng nhưng cần cụ thể hóa thêm",
            },
            {
                name: "Học vấn",
                score: 88,
                icon: "graduationcap.fill",
                color: ["#8b5cf6", "#a78bfa"] as [string, string],
                feedback: "Trình độ học vấn phù hợp với vị trí",
            },
        ],
        recommendations: [
            "Thêm các dự án cụ thể để minh chứng kỹ năng",
            "Bổ sung chứng chỉ chuyên ngành liên quan",
            "Cải thiện phần mô tả về thành tích đạt được",
            "Tối ưu hóa từ khóa để phù hợp với ATS",
        ],
        strengths: ["Kinh nghiệm làm việc phong phú", "Kỹ năng đa dạng và cập nhật", "Trình bày rõ ràng, chuyên nghiệp", "Thông tin liên hệ đầy đủ"],
    };

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setSelectedFile(result);
                setAnalysisResult(null);
            }
        } catch (error) {
            Alert.alert("Lỗi", "Không thể chọn file CV");
        }
    };

    const analyzeCV = async () => {
        if (!selectedFile || selectedFile.canceled) return;

        setIsAnalyzing(true);
        // Simulate analysis delay
        setTimeout(() => {
            setAnalysisResult(mockAnalysisResult);
            setIsAnalyzing(false);
        }, 2000);
    };

    const getScoreColor = (score: number): [string, string] => {
        if (score >= 80) return ["#10b981", "#34d399"];
        if (score >= 60) return ["#f59e0b", "#fbbf24"];
        return ["#ef4444", "#f87171"];
    };

    const CategoryCard = ({ category }: { category: AnalysisResult["categories"][0] }) => (
        <View style={[styles.categoryCard, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.categoryHeader}>
                <LinearGradient colors={category.color} style={styles.categoryIcon}>
                    <IconSymbol name={category.icon as any} size={20} color="white" />
                </LinearGradient>

                <View style={styles.categoryInfo}>
                    <ThemedText style={[styles.categoryName, { color: colors.text }]}>{category.name}</ThemedText>
                    <ThemedText style={[styles.categoryFeedback, { color: colors.icon }]}>{category.feedback}</ThemedText>
                </View>

                <View style={styles.scoreContainer}>
                    <ThemedText style={[styles.scoreText, { color: colors.text }]}>{category.score}</ThemedText>
                    <View style={[styles.scoreBar, { backgroundColor: colors.border }]}>
                        <LinearGradient colors={getScoreColor(category.score)} style={[styles.scoreProgress, { width: `${category.score}%` }]} />
                    </View>
                </View>
            </View>
        </View>
    );

    return (
        <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} />

            {/* Header */}
            <LinearGradient colors={colors.gradient} style={[styles.header, { paddingTop: insets.top }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={styles.headerContent}>
                    <ThemedText style={styles.headerTitle}>Phân tích CV</ThemedText>
                    <ThemedText style={styles.headerSubtitle}>Cải thiện CV để có cơ hội việc làm tốt hơn</ThemedText>
                </View>
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
                {/* Upload Section */}
                <View style={styles.uploadSection}>
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
                            <ThemedText style={[styles.uploadSubtitle, { color: colors.icon }]}>Hỗ trợ định dạng PDF, DOC, DOCX</ThemedText>
                        )}
                    </TouchableOpacity>

                    {selectedFile && !selectedFile.canceled && !analysisResult && (
                        <TouchableOpacity style={styles.analyzeButton} onPress={analyzeCV} disabled={isAnalyzing} activeOpacity={0.8}>
                            <LinearGradient colors={colors.gradient} style={styles.analyzeGradient}>
                                {isAnalyzing ? (
                                    <View style={styles.analyzingContainer}>
                                        <IconSymbol name="arrow.triangle.2.circlepath" size={20} color="white" />
                                        <ThemedText style={styles.analyzeText}>Đang phân tích...</ThemedText>
                                    </View>
                                ) : (
                                    <ThemedText style={styles.analyzeText}>Phân tích CV</ThemedText>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Analysis Results */}
                {analysisResult && (
                    <>
                        {/* Overall Score */}
                        <View style={styles.scoreSection}>
                            <View style={[styles.scoreCard, { backgroundColor: colors.cardBackground }]}>
                                <LinearGradient colors={getScoreColor(analysisResult.overallScore)} style={styles.overallScoreContainer}>
                                    <ThemedText style={styles.overallScoreText}>{analysisResult.overallScore}</ThemedText>
                                    <ThemedText style={styles.overallScoreLabel}>Điểm tổng</ThemedText>
                                </LinearGradient>

                                <View style={styles.scoreInfo}>
                                    <ThemedText style={[styles.scoreTitle, { color: colors.text }]}>Chất lượng CV</ThemedText>
                                    <ThemedText style={[styles.scoreDescription, { color: colors.icon }]}>
                                        CV của bạn có chất lượng tốt và đáp ứng yêu cầu của nhà tuyển dụng
                                    </ThemedText>
                                </View>
                            </View>
                        </View>

                        {/* Category Analysis */}
                        <View style={styles.categoriesSection}>
                            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Phân tích chi tiết</ThemedText>

                            {analysisResult.categories.map((category, index) => (
                                <CategoryCard key={index} category={category} />
                            ))}
                        </View>

                        {/* Strengths */}
                        <View style={styles.strengthsSection}>
                            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Điểm mạnh</ThemedText>

                            {analysisResult.strengths.map((strength, index) => (
                                <View key={index} style={[styles.strengthItem, { backgroundColor: colors.cardBackground }]}>
                                    <LinearGradient colors={["#10b981", "#34d399"] as [string, string]} style={styles.strengthIcon}>
                                        <IconSymbol name="checkmark" size={12} color="white" />
                                    </LinearGradient>
                                    <ThemedText style={[styles.strengthText, { color: colors.text }]}>{strength}</ThemedText>
                                </View>
                            ))}
                        </View>

                        {/* Recommendations */}
                        <View style={styles.recommendationsSection}>
                            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Đề xuất cải thiện</ThemedText>

                            {analysisResult.recommendations.map((recommendation, index) => (
                                <View key={index} style={[styles.recommendationItem, { backgroundColor: colors.cardBackground }]}>
                                    <LinearGradient colors={["#f59e0b", "#fbbf24"] as [string, string]} style={styles.recommendationIcon}>
                                        <IconSymbol name="lightbulb.fill" size={12} color="white" />
                                    </LinearGradient>
                                    <ThemedText style={[styles.recommendationText, { color: colors.text }]}>{recommendation}</ThemedText>
                                </View>
                            ))}
                        </View>
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
        textAlign: "center",
    },
    content: {
        flex: 1,
    },
    uploadSection: {
        padding: 24,
        gap: 16,
    },
    uploadArea: {
        padding: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderStyle: "dashed",
        alignItems: "center",
        gap: 16,
    },
    uploadIcon: {
        width: 80,
        height: 80,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    uploadTitle: {
        fontSize: 20,
        fontWeight: "bold",
        textAlign: "center",
    },
    uploadSubtitle: {
        fontSize: 14,
        textAlign: "center",
    },
    fileName: {
        fontSize: 16,
        fontWeight: "600",
        textAlign: "center",
    },
    analyzeButton: {
        borderRadius: 16,
        overflow: "hidden",
    },
    analyzeGradient: {
        padding: 18,
        alignItems: "center",
    },
    analyzingContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    analyzeText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "white",
    },
    scoreSection: {
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    scoreCard: {
        flexDirection: "row",
        padding: 24,
        borderRadius: 20,
        alignItems: "center",
        gap: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
    },
    overallScoreContainer: {
        width: 80,
        height: 80,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
    },
    overallScoreText: {
        fontSize: 24,
        fontWeight: "bold",
        color: "white",
    },
    overallScoreLabel: {
        fontSize: 10,
        color: "white",
        opacity: 0.9,
    },
    scoreInfo: {
        flex: 1,
        gap: 8,
    },
    scoreTitle: {
        fontSize: 18,
        fontWeight: "bold",
    },
    scoreDescription: {
        fontSize: 14,
        lineHeight: 20,
    },
    categoriesSection: {
        paddingHorizontal: 24,
        marginBottom: 24,
        gap: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 4,
    },
    categoryCard: {
        padding: 20,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    categoryHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
    },
    categoryIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    categoryInfo: {
        flex: 1,
        gap: 4,
    },
    categoryName: {
        fontSize: 16,
        fontWeight: "600",
    },
    categoryFeedback: {
        fontSize: 12,
        lineHeight: 16,
    },
    scoreContainer: {
        alignItems: "center",
        gap: 8,
        minWidth: 60,
    },
    scoreText: {
        fontSize: 18,
        fontWeight: "bold",
    },
    scoreBar: {
        width: 60,
        height: 4,
        borderRadius: 2,
        overflow: "hidden",
    },
    scoreProgress: {
        height: "100%",
        borderRadius: 2,
    },
    strengthsSection: {
        paddingHorizontal: 24,
        marginBottom: 24,
        gap: 12,
    },
    strengthItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderRadius: 12,
        gap: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    strengthIcon: {
        width: 24,
        height: 24,
        borderRadius: 6,
        alignItems: "center",
        justifyContent: "center",
    },
    strengthText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
    recommendationsSection: {
        paddingHorizontal: 24,
        paddingBottom: 100,
        gap: 12,
    },
    recommendationItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        padding: 16,
        borderRadius: 12,
        gap: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    recommendationIcon: {
        width: 24,
        height: 24,
        borderRadius: 6,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 2,
    },
    recommendationText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
});
