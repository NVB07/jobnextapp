import React, { useLayoutEffect } from "react";
import { StyleSheet, ScrollView, View, StatusBar, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useNavigation } from "expo-router";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function AboutScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();

    // Hide the default header
    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    const renderHeader = () => (
        <LinearGradient colors={colors.gradient} style={[styles.header, { paddingTop: insets.top + 10 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={styles.headerContent}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
                    <IconSymbol name="chevron.left" size={20} color="white" />
                </TouchableOpacity>

                <View style={styles.headerTextContainer}>
                    <ThemedText style={styles.headerTitle}>Thông tin ứng dụng</ThemedText>
                </View>

                <View style={styles.placeholderButton} />
            </View>
        </LinearGradient>
    );

    const InfoCard = ({ icon, title, content }: { icon: string; title: string; content: string }) => (
        <View style={[styles.infoCard, { backgroundColor: colors.cardBackground }]}>
            <View style={[styles.infoIcon, { backgroundColor: colors.tint }]}>
                <IconSymbol name={icon as any} size={24} color="white" />
            </View>
            <View style={styles.infoContent}>
                <ThemedText style={[styles.infoTitle, { color: colors.text }]}>{title}</ThemedText>
                <ThemedText style={[styles.infoText, { color: colors.icon }]}>{content}</ThemedText>
            </View>
        </View>
    );

    return (
        <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} />
            {renderHeader()}

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
                <View style={styles.section}>
                    {/* App Logo/Name */}

                    {/* App Info */}
                    <InfoCard icon="info.circle.fill" title="Phiên bản" content="1.0.0" />

                    <InfoCard icon="gear" title="Công nghệ Mobile" content="React Native + Expo" />

                    <InfoCard icon="server.rack" title="Backend" content="Node.js + Express" />

                    <InfoCard icon="externaldrive.connected.to.line.below" title="Cơ sở dữ liệu" content="MongoDB" />

                    <InfoCard icon="lock.shield" title="Xác thực" content="Firebase Authentication" />

                    <InfoCard icon="cloud.fill" title="Cloud Storage" content="Cloudinary" />

                    <InfoCard icon="calendar" title="Năm phát triển" content="2025" />

                    <InfoCard icon="person.2.fill" title="Người phát triển" content="Nguyễn Văn Bình" />

                    {/* Features */}

                    {/* Copyright */}
                    <View style={[styles.copyrightCard, { backgroundColor: colors.cardBackground }]}>
                        <ThemedText style={[styles.copyrightText, { color: colors.icon }]}>© 2025 JobNext. All rights reserved.</ThemedText>
                        <ThemedText style={[{ color: colors.icon, fontSize: 12 }]}>nvbinh.zzz@gmail.com</ThemedText>
                        <ThemedText style={[{ color: colors.icon, fontSize: 12 }]}>0395 432 155</ThemedText>
                        <ThemedText style={[{ color: colors.icon, fontSize: 12 }]}>Thanh Trì - Hà Nội</ThemedText>
                        <ThemedText style={[styles.copyrightSubtext, { color: colors.icon }]}>Made with ❤️ in Vietnam</ThemedText>
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
    placeholderButton: {
        width: 40,
        height: 40,
    },
    content: {
        flex: 1,
    },
    section: {
        padding: 24,
        gap: 16,
    },
    appCard: {
        padding: 32,
        borderRadius: 20,
        alignItems: "center",
        marginBottom: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
    },
    appIcon: {
        width: 80,
        height: 80,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    appName: {
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 8,
    },
    appSlogan: {
        fontSize: 16,
        textAlign: "center",
    },
    infoCard: {
        flexDirection: "row",
        padding: 20,
        borderRadius: 16,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    infoIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 16,
    },
    infoContent: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 4,
    },
    infoText: {
        fontSize: 14,
        lineHeight: 20,
    },
    featuresCard: {
        padding: 20,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    featuresTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 16,
    },
    featuresList: {
        gap: 12,
    },
    featureItem: {
        fontSize: 14,
        lineHeight: 20,
    },
    copyrightCard: {
        padding: 20,
        borderRadius: 16,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    copyrightText: {
        fontSize: 14,
        fontWeight: "500",
        marginBottom: 4,
    },
    copyrightSubtext: {
        fontSize: 12,
    },
});
