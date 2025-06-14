import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
    const colorScheme = useColorScheme();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
                headerShown: false,
                tabBarButton: HapticTab,
                tabBarBackground: TabBarBackground,
                tabBarStyle: Platform.select({
                    ios: {
                        // Use a transparent background on iOS to show the blur effect
                        position: "absolute",
                    },
                    default: {},
                }),
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Trang chủ",
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
                }}
            />
            <Tabs.Screen
                name="jobs"
                options={{
                    title: "Việc làm",
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="briefcase.fill" color={color} />,
                }}
            />
            <Tabs.Screen
                name="cv-analysis"
                options={{
                    title: "Phân tích CV",
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="doc.text.fill" color={color} />,
                }}
            />
            <Tabs.Screen
                name="virtual-interview"
                options={{
                    title: "Phỏng vấn ảo",
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="video.fill" color={color} />,
                }}
            />
            <Tabs.Screen
                name="blog"
                options={{
                    title: "Blog",
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="newspaper.fill" color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Hồ sơ",
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.circle.fill" color={color} />,
                }}
            />
        </Tabs>
    );
}
