import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import {
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    View,
    Alert,
    Dimensions,
    StatusBar,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Animated,
    Keyboard,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/config/firebase";
import { interviewService, InterviewMessage } from "@/services/api";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

const { width, height } = Dimensions.get("window");

interface InterviewData {
    jobTitle: string;
    jobDescription?: string;
    jobRequirements: string;
    company?: string;
    userInfo: string;
    userId: string;
    interviewType: "available" | "custom";
    jobId: string;
    jobSource: string;
    uid: string;
    skills?: string;
    category?: string;
}

export default function InterviewChatScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const params = useLocalSearchParams();
    const navigation = useNavigation();

    // Check if we're loading an existing interview by ID
    const existingInterviewId = params.interviewId as string;
    const isExistingInterview = !!existingInterviewId;

    // Hide the default header
    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    // Parse interview data from params
    const interviewData: Partial<InterviewData> = {
        jobTitle: params.jobTitle as string,
        jobDescription: params.jobDescription as string,
        jobRequirements: params.jobRequirements as string,
        company: params.company as string,
        userInfo: params.userInfo as string,
        userId: params.userId as string,
        interviewType: params.interviewType as "available" | "custom",
        jobId: params.jobId as string,
        jobSource: params.jobSource as string,
        uid: params.uid as string,
        skills: params.skills as string,
        category: params.category as string,
    };

    // State
    const [messages, setMessages] = useState<InterviewMessage[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [interviewId, setInterviewId] = useState<string | null>(existingInterviewId || null);
    const [interviewEnded, setInterviewEnded] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [interviewDetails, setInterviewDetails] = useState<any>(null);
    const scrollViewRef = useRef<ScrollView>(null);

    // Animation values
    const typingAnimation1 = useRef(new Animated.Value(0)).current;
    const typingAnimation2 = useRef(new Animated.Value(0)).current;
    const typingAnimation3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isExistingInterview) {
            loadInterviewById();
        } else {
            startInterview();
        }
    }, []);

    useEffect(() => {
        // Auto scroll to bottom when messages update
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
    }, [messages]);

    useEffect(() => {
        // Keyboard listeners
        const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", (event) => {
            setKeyboardHeight(event.endCoordinates.height);
            // Auto scroll to bottom when keyboard shows
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        });

        const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => {
            setKeyboardHeight(0);
        });

        return () => {
            keyboardDidShowListener?.remove();
            keyboardDidHideListener?.remove();
        };
    }, []);

    useEffect(() => {
        // Auto scroll when keyboard height changes
        if (keyboardHeight > 0) {
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 50);
        }
    }, [keyboardHeight]);

    useEffect(() => {
        // Animate typing indicator
        if (isLoading) {
            const createTypingAnimation = (animValue: Animated.Value, delay: number) => {
                return Animated.loop(
                    Animated.sequence([
                        Animated.delay(delay),
                        Animated.timing(animValue, {
                            toValue: 1,
                            duration: 600,
                            useNativeDriver: true,
                        }),
                        Animated.timing(animValue, {
                            toValue: 0,
                            duration: 600,
                            useNativeDriver: true,
                        }),
                    ])
                );
            };

            const animations = [createTypingAnimation(typingAnimation1, 0), createTypingAnimation(typingAnimation2, 200), createTypingAnimation(typingAnimation3, 400)];

            Animated.parallel(animations).start();
        } else {
            // Reset animations
            typingAnimation1.setValue(0);
            typingAnimation2.setValue(0);
            typingAnimation3.setValue(0);
        }
    }, [isLoading]);

    const loadInterviewById = async () => {
        if (!user) {
            Alert.alert("Lỗi", "Vui lòng đăng nhập để tiếp tục");
            return;
        }

        setIsLoading(true);
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                Alert.alert("Lỗi", "Phiên đăng nhập đã hết hạn");
                return;
            }

            const token = await currentUser.getIdToken();

            // Fetch interview by ID
            console.log(`🔍 Fetching interview with ID: ${existingInterviewId}`);
            const response = await interviewService.getInterviewById(existingInterviewId, token);

            console.log(`📡 Interview API response:`, JSON.stringify(response).substring(0, 200) + "...");

            // Check if we got a valid response with the expected structure
            if (!response || !response.result) {
                console.error("❌ Invalid response format:", response);
                throw new Error("Định dạng phản hồi từ API không hợp lệ");
            }

            const interview = response.result;

            if (!interview || !interview.chatHistory || !Array.isArray(interview.chatHistory)) {
                console.error("❌ Invalid interview data:", interview);
                throw new Error("Dữ liệu phỏng vấn không hợp lệ");
            }

            // Update interview details for use in UI
            setInterviewDetails(interview);

            // Update interview data based on loaded interview
            if (interview.jobTitle) {
                interviewData.jobTitle = interview.jobTitle;
            }

            if (interview.jobRequirement) {
                interviewData.jobRequirements = interview.jobRequirement;
            }

            if (interview.candidateDescription) {
                interviewData.userInfo = interview.candidateDescription;
            }

            if (interview.jobId) {
                interviewData.jobId = interview.jobId;
            }

            if (interview.jobSource) {
                interviewData.jobSource = interview.jobSource;
            }

            if (interview.company) {
                interviewData.company = interview.company;
            }

            // Always ensure we have the uid
            interviewData.uid = user.uid;

            // Update the title in the header immediately
            console.log(
                `📋 Updated interview data from API: jobTitle=${interviewData.jobTitle}, jobId=${interviewData.jobId}, company=${interviewData.company}, uid=${interviewData.uid}`
            );

            // Parse chat history to messages
            const existingMessages = interviewService.parseChatHistoryToMessages(interview.chatHistory || []);

            if (existingMessages.length === 0) {
                console.warn("⚠️ No messages found in chat history");
            } else {
                console.log(`✅ Parsed ${existingMessages.length} messages from chat history`);
            }

            setMessages(existingMessages);

            // Check if interview is ended (last message has state: false)
            const lastMessage = existingMessages[existingMessages.length - 1];
            setInterviewEnded(lastMessage ? !lastMessage.state : false);

            console.log(`✅ Successfully loaded interview by ID with ${existingMessages.length} messages`);
        } catch (error) {
            console.error("❌ Error loading interview by ID:", error);
            Alert.alert("Lỗi", "Không thể tải cuộc phỏng vấn. " + (error instanceof Error ? error.message : "Lỗi không xác định"), [
                { text: "Quay lại", onPress: () => router.back() },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const startInterview = async () => {
        if (!user) {
            Alert.alert("Lỗi", "Vui lòng đăng nhập để tiếp tục");
            return;
        }

        // Skip starting a new interview if we're loading an existing one by ID
        if (isExistingInterview) return;

        // Validate required fields when starting a new interview
        if (!interviewData.jobRequirements) {
            Alert.alert("Lỗi", "Thiếu thông tin yêu cầu công việc");
            router.back();
            return;
        }

        setIsLoading(true);
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                Alert.alert("Lỗi", "Phiên đăng nhập đã hết hạn");
                return;
            }

            const token = await currentUser.getIdToken();

            // Check if an interview already exists for this job requirement
            const existingCheck = await interviewService.checkExistingInterview(interviewData.jobRequirements, token);

            if (existingCheck.exists && existingCheck.interview && existingCheck.interviewId) {
                // Show dialog to user asking if they want to continue existing interview
                Alert.alert(
                    "Phỏng vấn đã tồn tại",
                    "Bạn đã có một cuộc phỏng vấn cho vị trí này. Bạn muốn tiếp tục cuộc phỏng vấn cũ hay bắt đầu lại từ đầu?",
                    [
                        {
                            text: "Bắt đầu lại",
                            style: "destructive",
                            onPress: () => createNewInterview(token, true, existingCheck.interviewId),
                        },
                        {
                            text: "Tiếp tục",
                            style: "default",
                            onPress: () => loadExistingInterview(existingCheck.interview, existingCheck.interviewId!),
                        },
                    ],
                    { cancelable: false }
                );
                return;
            }

            // No existing interview, create new one
            await createNewInterview(token, false);
        } catch (error) {
            console.error("Error starting interview:", error);
            Alert.alert("Lỗi", "Có lỗi xảy ra khi tạo phỏng vấn");
        } finally {
            setIsLoading(false);
        }
    };

    const createNewInterview = async (token: string, forceNew: boolean = false, existingInterviewId?: string) => {
        try {
            // If forcing new and we have existing interview ID, delete it first
            if (forceNew && existingInterviewId) {
                console.log(`🗑️ Deleting existing interview: ${existingInterviewId}`);
                try {
                    await interviewService.deleteInterview(existingInterviewId, token);
                    console.log(`✅ Successfully deleted existing interview`);
                } catch (deleteError) {
                    console.warn(`⚠️ Failed to delete existing interview:`, deleteError);
                    // Continue anyway - we'll try to create new
                }
            }

            const interviewData_ = {
                jobTitle: interviewData.jobTitle || "Không có tiêu đề",
                jobRequirement: interviewData.jobRequirements || interviewDetails?.jobRequirement || "",
                candidateDescription: interviewData.userInfo || interviewDetails?.candidateDescription || "",
                skills: interviewData.skills || interviewDetails?.skills || "",
                category: interviewData.category || interviewDetails?.category || "",
                jobId: interviewData.jobId || interviewDetails?.jobId || "",
                jobSource: interviewData.jobSource || interviewDetails?.jobSource || "",
                uid: interviewData.uid || user?.uid || "", // Ensure uid is always included
            };

            // Log what we're sending to the API for debugging
            console.log("📤 Creating new interview with data:", JSON.stringify(interviewData_));

            // Always use createOrContinueInterview - it will create new if old one was deleted
            const result = await interviewService.createOrContinueInterview(interviewData_, token);

            setInterviewId(result.interviewId);

            // Parse the first AI response
            const messageObj = interviewService.parseInterviewResponse(result.result);
            messageObj.id = 1;

            setMessages([messageObj]);
            setInterviewEnded(!messageObj.state);
        } catch (error) {
            console.error("❌ Error creating new interview:", error);
            Alert.alert("Lỗi", "Có lỗi xảy ra khi tạo phỏng vấn mới");
        }
    };

    const loadExistingInterview = (interview: any, interviewId: string) => {
        try {
            setInterviewId(interviewId);

            // Parse chat history to messages
            const existingMessages = interviewService.parseChatHistoryToMessages(interview.chatHistory || []);

            setMessages(existingMessages);

            // Check if interview is ended (last message has state: false)
            const lastMessage = existingMessages[existingMessages.length - 1];
            setInterviewEnded(lastMessage ? !lastMessage.state : false);

            console.log(`✅ Loaded existing interview with ${existingMessages.length} messages`);
        } catch (error) {
            console.error("Error loading existing interview:", error);
            Alert.alert("Lỗi", "Có lỗi khi tải phỏng vấn cũ. Sẽ tạo phỏng vấn mới.");
            // Fallback to create new interview
            auth.currentUser?.getIdToken().then(createNewInterview);
        }
    };

    const sendMessage = async () => {
        if (!inputValue.trim() || !interviewId || !user) return;

        const currentMessage = inputValue.trim();
        setInputValue("");

        // Add user message
        const userMessage: InterviewMessage = {
            id: messages.length + 1,
            role: "user",
            message: currentMessage,
            state: true,
        };
        setMessages((prev) => [...prev, userMessage]);

        setIsLoading(true);
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                Alert.alert("Lỗi", "Phiên đăng nhập đã hết hạn");
                return;
            }

            const token = await currentUser.getIdToken();

            const requestData = {
                jobTitle: interviewData.jobTitle || interviewDetails?.jobTitle || "Không có tiêu đề",
                jobRequirement: interviewData.jobRequirements || interviewDetails?.jobRequirement || "",
                candidateDescription: interviewData.userInfo || interviewDetails?.candidateDescription || "",
                answer: currentMessage,
                uid: interviewData.uid || user.uid || "",
            };

            console.log("📤 Sending message with data:", JSON.stringify(requestData));

            const result = await interviewService.createOrContinueInterview(requestData, token);

            // Parse AI response
            const messageObj = interviewService.parseInterviewResponse(result.result);
            messageObj.id = messages.length + 2;

            setMessages((prev) => [...prev, messageObj]);
            setInterviewEnded(!messageObj.state);

            // Show final results if interview ended
            if (!messageObj.state && messageObj.pass !== null) {
                setTimeout(() => {
                    Alert.alert("Phỏng vấn kết thúc", `Điểm đánh giá: ${messageObj.pass}%\n\nCảm ơn bạn đã tham gia phỏng vấn!`, [
                        { text: "Xem lại", style: "default" },
                        { text: "Quay lại", onPress: () => router.back() },
                    ]);
                }, 1000);
            }
        } catch (error) {
            console.error("❌ Error sending message:", error);
            Alert.alert("Lỗi", "Có lỗi xảy ra khi gửi tin nhắn");
        } finally {
            setIsLoading(false);
        }
    };

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <LinearGradient
                colors={["#4c63d2", "#6366f1", "#8b5cf6"]}
                style={[styles.header, { paddingTop: insets.top + 10 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
                        <IconSymbol name="chevron.left" size={20} color="white" />
                    </TouchableOpacity>

                    <View style={styles.headerTextContainer}>
                        <View style={styles.headerInfo}>
                            <ThemedText style={styles.headerTitle} numberOfLines={2} ellipsizeMode="tail">
                                {interviewData.jobTitle || interviewDetails?.jobTitle || "Phỏng vấn"}
                            </ThemedText>
                        </View>
                        <View style={styles.statusContainer}>
                            <View style={[styles.statusDot, { backgroundColor: interviewEnded ? "#ff4757" : "#2ed573" }]} />
                            <ThemedText style={styles.statusText}>{interviewEnded ? "Đã kết thúc" : "Đang diễn ra"}</ThemedText>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.infoButton}
                        activeOpacity={0.7}
                        onPress={() => {
                            Alert.alert("Tùy chọn", "Chọn hành động", [
                                {
                                    text: "Xem thông tin phỏng vấn",
                                    onPress: () => {
                                        Alert.alert(
                                            "Thông tin phỏng vấn",
                                            `Công việc: ${interviewData.jobTitle || interviewDetails?.jobTitle || "Không có tiêu đề"}\n\nYêu cầu công việc: ${
                                                interviewData.jobRequirements || interviewDetails?.jobRequirement || "Không có thông tin"
                                            }\n\nThông tin cá nhân: ${interviewData.userInfo || interviewDetails?.candidateDescription || "Không có thông tin"}`,
                                            [{ text: "Đóng", style: "cancel" }]
                                        );
                                    },
                                },
                                interviewData.jobId
                                    ? {
                                          text: "Xem công việc",
                                          onPress: () => {
                                              router.push({
                                                  pathname: "/job-detail",
                                                  params: { jobId: interviewData.jobId },
                                              });
                                          },
                                      }
                                    : { text: "Xem công việc", style: "default" },
                                {
                                    text: "Phỏng vấn lại",
                                    style: "destructive",
                                    onPress: async () => {
                                        if (!user) {
                                            Alert.alert("Lỗi", "Vui lòng đăng nhập để tiếp tục");
                                            return;
                                        }

                                        Alert.alert("Xác nhận", "Bạn có chắc muốn bắt đầu lại cuộc phỏng vấn này? Lịch sử phỏng vấn hiện tại sẽ bị xóa.", [
                                            { text: "Hủy", style: "cancel" },
                                            {
                                                text: "Xác nhận",
                                                style: "destructive",
                                                onPress: async () => {
                                                    try {
                                                        setIsLoading(true);
                                                        const currentUser = auth.currentUser;
                                                        if (!currentUser) {
                                                            Alert.alert("Lỗi", "Phiên đăng nhập đã hết hạn");
                                                            return;
                                                        }

                                                        // Make sure we have the latest interview details
                                                        if (interviewDetails && !interviewData.jobRequirements) {
                                                            interviewData.jobRequirements = interviewDetails.jobRequirement;
                                                            interviewData.userInfo = interviewDetails.candidateDescription;
                                                            interviewData.jobTitle = interviewDetails.jobTitle;
                                                            interviewData.company = interviewDetails.company;
                                                            interviewData.jobId = interviewDetails.jobId;
                                                            interviewData.jobSource = interviewDetails.jobSource;
                                                            interviewData.uid = user.uid;

                                                            console.log("🔄 Updated interview data from details:", {
                                                                jobTitle: interviewData.jobTitle,
                                                                hasJobRequirements: !!interviewData.jobRequirements,
                                                                hasUserInfo: !!interviewData.userInfo,
                                                                uid: interviewData.uid,
                                                            });
                                                        }

                                                        const token = await currentUser.getIdToken();

                                                        // Force create new interview
                                                        await createNewInterview(token, true, interviewId || undefined);

                                                        // Reset interview ended state
                                                        setInterviewEnded(false);
                                                    } catch (error) {
                                                        console.error("❌ Error restarting interview:", error);
                                                        Alert.alert("Lỗi", "Không thể khởi động lại cuộc phỏng vấn");
                                                    } finally {
                                                        setIsLoading(false);
                                                    }
                                                },
                                            },
                                        ]);
                                    },
                                },
                                { text: "Đóng", style: "cancel" },
                            ]);
                        }}
                    >
                        <IconSymbol name="info.circle" size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        </View>
    );

    const renderUserAvatar = () => (
        <View style={[styles.avatar, styles.userAvatar]}>
            <LinearGradient colors={[colors.tint, "#8b5cf6"]} style={styles.userAvatarGradient}>
                <IconSymbol name="person.fill" size={14} color="white" />
            </LinearGradient>
        </View>
    );

    const renderAIAvatar = () => (
        <View style={[styles.avatar, styles.aiAvatar]}>
            <LinearGradient colors={["#4c63d2", "#6366f1"]} style={styles.aiAvatarGradient}>
                <IconSymbol name="brain.head.profile" size={14} color="white" />
            </LinearGradient>
        </View>
    );

    const renderMessage = (message: InterviewMessage, index: number) => {
        const isUser = message.role === "user";
        const isEndMessage = !message.state && message.pass !== null;
        const isFirstMessage = index === 0;

        return (
            <View key={message.id || index} style={[styles.messageRow, isUser ? styles.userMessageRow : styles.aiMessageRow]}>
                {/* {!isUser && renderAIAvatar()} */}

                <View style={[styles.messageContainer, isUser ? styles.userMessageContainer : styles.aiMessageContainer]}>
                    <View style={[styles.messageBubble, isUser ? styles.userMessage : styles.aiMessage]}>
                        {isUser ? (
                            <LinearGradient colors={["#6366f1", "#8b5cf6"]} style={styles.userMessageGradient}>
                                <ThemedText style={styles.userMessageText}>{message.message}</ThemedText>
                            </LinearGradient>
                        ) : (
                            <View style={[styles.aiMessageContent, { backgroundColor: colors.cardBackground }]}>
                                <ThemedText style={[styles.aiMessageText, { color: colors.text }]}>{message.message}</ThemedText>

                                {isEndMessage && message.pass !== null && (
                                    <View style={styles.scoreContainer}>
                                        <LinearGradient colors={["#ffd700", "#ff6b35"]} style={styles.scoreGradient}>
                                            <IconSymbol name="star.fill" size={12} color="white" />
                                            <ThemedText style={styles.scoreText}>Điểm: {message.pass}%</ThemedText>
                                        </LinearGradient>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                </View>

                {/* {isUser && renderUserAvatar()} */}
            </View>
        );
    };

    const renderTypingIndicator = () => (
        <View style={[styles.messageRow, styles.aiMessageRow]}>
            {/* {renderAIAvatar()} */}

            <View style={[styles.messageContainer, styles.aiMessageContainer]}>
                <View style={[styles.messageBubble, styles.aiMessage]}>
                    <View style={[styles.aiMessageContent, { backgroundColor: colors.cardBackground }]}>
                        <View style={styles.typingIndicator}>
                            <ThemedText style={[styles.typingText, { color: colors.icon }]}>Đang soạn tin</ThemedText>
                            <View style={styles.typingDots}>
                                <Animated.View style={[styles.typingDot, { backgroundColor: colors.icon, opacity: typingAnimation1 }]} />
                                <Animated.View style={[styles.typingDot, { backgroundColor: colors.icon, opacity: typingAnimation2 }]} />
                                <Animated.View style={[styles.typingDot, { backgroundColor: colors.icon, opacity: typingAnimation3 }]} />
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );

    return (
        <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {renderHeader()}

            <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}>
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.messagesContainer}
                    contentContainerStyle={[
                        styles.messagesContent,
                        {
                            paddingBottom: Math.max(20, keyboardHeight > 0 ? 20 : 20),
                        },
                    ]}
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={() => {
                        // Auto scroll to bottom when content size changes
                        setTimeout(() => {
                            scrollViewRef.current?.scrollToEnd({ animated: true });
                        }, 100);
                    }}
                    onLayout={() => {
                        // Auto scroll to bottom when layout changes
                        setTimeout(() => {
                            scrollViewRef.current?.scrollToEnd({ animated: true });
                        }, 100);
                    }}
                >
                    {messages.map((message, index) => renderMessage(message, index))}
                    {isLoading && renderTypingIndicator()}
                </ScrollView>

                {/* Enhanced Input Area */}
                <View style={[styles.inputContainer, { backgroundColor: colors.background }]}>
                    <View style={[styles.inputWrapper, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                        <View style={styles.inputContent}>
                            <TextInput
                                style={[styles.textInput, { color: colors.text }]}
                                placeholder={interviewEnded ? "Phỏng vấn đã kết thúc" : "Nhập câu trả lời của bạn..."}
                                placeholderTextColor={colors.icon}
                                value={inputValue}
                                onChangeText={setInputValue}
                                multiline
                                maxLength={1000}
                                editable={!interviewEnded && !isLoading}
                            />

                            <TouchableOpacity
                                style={[
                                    styles.sendButton,
                                    {
                                        opacity: inputValue.trim() && !interviewEnded && !isLoading ? 1 : 0.5,
                                    },
                                ]}
                                onPress={sendMessage}
                                disabled={!inputValue.trim() || interviewEnded || isLoading}
                                activeOpacity={0.7}
                            >
                                <LinearGradient
                                    colors={inputValue.trim() && !interviewEnded && !isLoading ? ["#6366f1", "#8b5cf6"] : [colors.icon, colors.icon]}
                                    style={styles.sendButtonGradient}
                                >
                                    <IconSymbol name="paperplane.fill" size={14} color="white" />
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
            <View style={styles.inputFooter}>
                <View style={styles.poweredBy}>
                    <IconSymbol name="sparkles" size={10} color={colors.icon} />
                    <ThemedText style={[styles.helperText, { color: colors.icon }]}>Powered by Gemini AI</ThemedText>
                </View>
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 1000,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        overflow: "hidden",
    },
    header: {
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    headerContent: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        paddingBottom: 5,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    headerTextContainer: {
        flex: 1,
        alignItems: "center",
        paddingHorizontal: 16,
    },
    headerInfo: {
        alignItems: "center",
        marginBottom: 8,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: "white",
        textAlign: "left",
        lineHeight: 22,
        paddingHorizontal: 8,
    },
    statusContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "rgba(255,255,255,0.15)",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 2,
    },
    statusText: {
        fontSize: 12,
        fontWeight: "600",
        color: "white",
    },
    infoButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    content: {
        flex: 1,
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        paddingTop: 20,
        paddingHorizontal: 4,
    },
    messageRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 10,
        marginBottom: 16,
        paddingHorizontal: 12,
    },
    userMessageRow: {
        flexDirection: "row-reverse",
    },
    aiMessageRow: {
        flexDirection: "row",
    },
    messageContainer: {
        flex: 1,
        maxWidth: "78%",
    },
    userMessageContainer: {
        alignItems: "flex-end",
    },
    aiMessageContainer: {
        alignItems: "flex-start",
    },
    messageBubble: {
        maxWidth: "88%",
        borderRadius: 18,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    userMessage: {
        borderBottomRightRadius: 4,
    },
    aiMessage: {
        borderBottomLeftRadius: 4,
    },
    userMessageGradient: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 18,
        borderBottomRightRadius: 4,
    },
    userMessageText: {
        fontSize: 15,
        lineHeight: 20,
        color: "white",
        fontWeight: "500",
    },
    aiMessageContent: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 18,
        borderBottomLeftRadius: 4,
    },
    aiMessageText: {
        fontSize: 15,
        lineHeight: 20,
        fontWeight: "400",
    },
    senderName: {
        fontSize: 11,
        fontWeight: "600",
        marginBottom: 6,
        marginLeft: 4,
        opacity: 0.8,
    },
    messageTime: {
        fontSize: 10,
        marginTop: 6,
        marginHorizontal: 4,
        opacity: 0.7,
    },
    inputContainer: {
        paddingHorizontal: 16,
        paddingBottom: 2,
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "flex-end",
        borderWidth: 1.5,
        borderRadius: 24,
        paddingHorizontal: 18,
        paddingVertical: 12,
        gap: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    inputContent: {
        flexDirection: "row",
        alignItems: "center",

        gap: 12,
        flex: 1,
    },
    textInput: {
        flex: 1,
        fontSize: 15,
        maxHeight: 120,
        paddingVertical: 0,
        fontWeight: "400",
        lineHeight: 20,
    },
    sendButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#6366f1",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    sendButtonGradient: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    inputFooter: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 4,
        paddingTop: 0,
        paddingBottom: 13,
    },
    poweredBy: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        opacity: 0.6,
    },
    helperText: {
        fontSize: 11,
        fontWeight: "500",
    },
    characterCount: {
        fontSize: 11,
        fontWeight: "500",
        opacity: 0.6,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    userAvatar: {
        overflow: "hidden",
    },
    aiAvatar: {
        overflow: "hidden",
    },
    userAvatarGradient: {
        width: "100%",
        height: "100%",
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    aiAvatarGradient: {
        width: "100%",
        height: "100%",
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    typingIndicator: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    typingText: {
        fontSize: 13,
        fontWeight: "500",
        opacity: 0.8,
    },
    typingDots: {
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
    },
    typingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    scoreContainer: {
        marginTop: 12,
        alignSelf: "flex-start",
    },
    scoreGradient: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        shadowColor: "#ffd700",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    scoreText: {
        fontSize: 11,
        fontWeight: "700",
        color: "white",
    },
});
