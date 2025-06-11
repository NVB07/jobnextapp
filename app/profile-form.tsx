import React, { useState, useEffect } from "react";
import {
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    View,
    Alert,
    Dimensions,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    TextInput,
    Text,
    Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useNavigation } from "expo-router";
import { useLayoutEffect } from "react";
import { Picker } from "@react-native-picker/picker";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuthGuard } from "../hooks/useAuthGuard";
import { apiService, UserData } from "../services/api";

const { width } = Dimensions.get("window");

interface FormData {
    Name: string;
    DOB: string;
    Phone_Number: string;
    Address: string;
    Email: string;
    LinkedInPortfolio: string;
    Career_objective: string;
    University: string;
    Major: string;
    GPA: string;
    Graduated_year: string;
    Achievements_awards: string;
    Extracurricular_activities: string;
    Interests: string;
    Job_position: string;
    Rank: string;
    Industry: string;
    Work_Experience: string;
    Years_of_experience: string;
    Projects: string;
    Skills: string;
    References: string;
}

interface ValidationErrors {
    [key: string]: string;
}

export default function ProfileFormScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();

    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [showPicker, setShowPicker] = useState<{ field: keyof FormData; options: any; title: string } | null>(null);
    const [initialFormData, setInitialFormData] = useState<FormData | null>(null);

    const [formData, setFormData] = useState<FormData>({
        Name: "",
        DOB: "",
        Phone_Number: "",
        Address: "",
        Email: "",
        LinkedInPortfolio: "",
        Career_objective: "",
        University: "",
        Major: "",
        GPA: "",
        Graduated_year: "",
        Achievements_awards: "",
        Extracurricular_activities: "",
        Interests: "",
        Job_position: "",
        Rank: "",
        Industry: "",
        Work_Experience: "",
        Years_of_experience: "",
        Projects: "",
        Skills: "",
        References: "",
    });

    // Authentication guard
    const { user, loading: authLoading, isAuthenticated } = useAuthGuard();

    // Options data - matching web client
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 50 }, (_, i) => (currentYear + 10 - i).toString());

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

    const experienceYearsMap = ["Chưa có kinh nghiệm", "1 năm", "2 năm", "3 năm", "4 năm", "5 năm", "Trên 5 năm"];

    // Validation functions matching web client
    const validateField = (key: keyof FormData, value: string): string | null => {
        switch (key) {
            case "Name":
                return !value.trim() ? "Họ tên không được để trống" : null;

            case "DOB":
                if (!value.trim()) return "Năm sinh không được để trống";
                const formats = [
                    /^\d{4}$/, // yyyy
                    /^(0?[1-9]|1[0-2])\/\d{4}$/, // mm/yyyy
                    /^(0?[1-9]|[12][0-9]|3[01])\/(0?[1-9]|1[0-2])\/\d{4}$/, // dd/mm/yyyy
                    /^(0?[1-9]|1[0-2])-\d{4}$/, // mm-yyyy
                    /^(0?[1-9]|[12][0-9]|3[01])-(0?[1-9]|1[0-2])-\d{4}$/, // dd-mm-yyyy
                ];
                return formats.some((regex) => regex.test(value)) ? null : "Năm sinh không đúng định dạng";

            case "Address":
                return !value.trim() ? "Địa chỉ không được để trống" : null;

            case "Phone_Number":
                if (!value) return null; // Optional field
                const cleanPhone = value.replace(/\s+/g, "");
                return /^[0-9]{10,11}$/.test(cleanPhone) ? null : "Số điện thoại không hợp lệ";

            case "Email":
                if (!value.trim()) return "Vui lòng nhập email";
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(value) ? null : "Email không hợp lệ";

            case "LinkedInPortfolio":
                if (!value) return null; // Optional field
                try {
                    new URL(value);
                    return null;
                } catch {
                    return "URL portfolio không hợp lệ";
                }

            case "Rank":
                return !value ? "Vui lòng chọn cấp bậc" : null;

            case "Industry":
                return !value ? "Vui lòng chọn ngành nghề" : null;

            case "Years_of_experience":
                return !value ? "Vui lòng chọn số năm kinh nghiệm" : null;

            case "Skills":
                return !value.trim() ? "Vui lòng nhập kỹ năng" : null;

            default:
                return null;
        }
    };

    const validateForm = (): boolean => {
        const newErrors: ValidationErrors = {};

        Object.keys(formData).forEach((key) => {
            const error = validateField(key as keyof FormData, formData[key as keyof FormData]);
            if (error) {
                newErrors[key] = error;
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Hide the default header
    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    // Show loading if still checking auth
    if (authLoading || !isAuthenticated) {
        return <ThemedView style={styles.container} />;
    }

    // Fetch user data
    const fetchUserData = async () => {
        if (!user?.uid) return;

        try {
            const data = await apiService.getUserData(user.uid);
            setUserData(data);

            // Initialize form with existing data
            if (data?.userData?.profile) {
                const initialData = {
                    Name: data.userData.profile.Name || "",
                    DOB: data.userData.profile.DOB || "",
                    Phone_Number: data.userData.profile.Phone_Number || "",
                    Address: data.userData.profile.Address || "",
                    Email: data.userData.profile.Email || "",
                    LinkedInPortfolio: data.userData.profile.LinkedInPortfolio || "",
                    Career_objective: data.userData.profile.Career_objective || "",
                    University: data.userData.profile.University || "",
                    Major: data.userData.profile.Major || "",
                    GPA: data.userData.profile.GPA || "",
                    Graduated_year: data.userData.profile.Graduated_year || "",
                    Achievements_awards: data.userData.profile.Achievements_awards || "",
                    Extracurricular_activities: data.userData.profile.Extracurricular_activities || "",
                    Interests: data.userData.profile.Interests || "",
                    Job_position: data.userData.profile.Job_position || "",
                    Rank: data.userData.profile.Rank || "",
                    Industry: data.userData.profile.Industry || "",
                    Work_Experience: data.userData.profile.Work_Experience || "",
                    Years_of_experience: data.userData.profile.Years_of_experience || "",
                    Projects: data.userData.profile.Projects || "",
                    Skills: data.userData.profile.Skills || "",
                    References: data.userData.profile.References || "",
                };
                setFormData(initialData);
                setInitialFormData(initialData);
            }
        } catch (error) {
            console.log("Error fetching user data:", error);
            Alert.alert("Lỗi", "Không thể tải thông tin người dùng");
        } finally {
            setLoading(false);
        }
    };

    // Save form data
    const saveForm = async () => {
        if (!user?.uid) return;

        // Validate form
        if (!validateForm()) {
            Alert.alert("Lỗi", "Vui lòng kiểm tra lại thông tin đã nhập");
            return;
        }

        setSaving(true);
        try {
            const response = await apiService.updateUserProfile(user.uid, { profile: formData });

            if (response.success) {
                // Clear user-specific cache after successful profile update
                apiService.clearUserListsCache(user.uid);

                // Also invalidate any cached user data and job recommendations
                console.log("🔄 Profile updated successfully - clearing cache and reloading data");

                Alert.alert("Thành công", "Cập nhật thông tin thành công!", [
                    {
                        text: "OK",
                        onPress: () => {
                            // Navigate back to trigger data reload in profile screen
                            router.back();
                        },
                    },
                ]);
            } else {
                Alert.alert("Lỗi", response.message || "Cập nhật thông tin thất bại");
            }
        } catch (error) {
            console.log("Error saving form:", error);
            Alert.alert("Lỗi", "Có lỗi xảy ra khi lưu thông tin");
        } finally {
            setSaving(false);
        }
    };

    const updateFormField = (key: keyof FormData, value: string) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
        // Clear error when user starts typing
        if (errors[key]) {
            setErrors((prev) => ({ ...prev, [key]: "" }));
        }
    };

    // Check if form has been modified
    const hasFormChanged = () => {
        if (!initialFormData) return false;
        return JSON.stringify(formData) !== JSON.stringify(initialFormData);
    };

    // Reset form to initial state
    const resetForm = () => {
        if (initialFormData) {
            setFormData(initialFormData);
            setErrors({});
            Alert.alert("Thành công", "Đã khôi phục thông tin ban đầu");
        }
    };

    useEffect(() => {
        fetchUserData();
    }, [user?.uid]);

    const renderHeader = () => (
        <LinearGradient colors={colors.gradient} style={[styles.header, { paddingTop: insets.top + 10 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={styles.headerContent}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
                    <IconSymbol name="chevron.left" size={20} color="white" />
                </TouchableOpacity>

                <View style={styles.headerTextContainer}>
                    <ThemedText style={styles.headerTitle}>Chỉnh sửa hồ sơ</ThemedText>
                    <ThemedText style={styles.headerSubtitle}>Cập nhật thông tin cá nhân</ThemedText>
                </View>

                <TouchableOpacity
                    style={[
                        styles.saveButton,
                        {
                            opacity: saving || !hasFormChanged() ? 0.6 : 1,
                            backgroundColor: hasFormChanged() ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)",
                        },
                    ]}
                    onPress={saveForm}
                    disabled={saving || !hasFormChanged()}
                    activeOpacity={0.7}
                >
                    {saving ? <ActivityIndicator size="small" color="white" /> : <IconSymbol name="checkmark" size={20} color="white" />}
                </TouchableOpacity>
            </View>
        </LinearGradient>
    );

    const renderTextInput = (
        label: string,
        key: keyof FormData,
        placeholder: string,
        required: boolean = false,
        multiline: boolean = false,
        keyboardType: "default" | "email-address" | "numeric" | "phone-pad" = "default"
    ) => (
        <View style={styles.formField}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>
                {label} {required && <Text style={styles.required}>*</Text>}
            </Text>
            <TextInput
                style={[
                    styles.textInput,
                    {
                        backgroundColor: colors.cardBackground,
                        borderColor: errors[key] ? "#EF4444" : colors.border,
                        color: colors.text,
                    },
                    multiline && styles.textArea,
                ]}
                value={formData[key]}
                onChangeText={(text) => updateFormField(key, text)}
                placeholder={placeholder}
                placeholderTextColor={colors.icon}
                multiline={multiline}
                numberOfLines={multiline ? 4 : 1}
                keyboardType={keyboardType}
            />
            {errors[key] && <Text style={styles.errorText}>{errors[key]}</Text>}
        </View>
    );

    const renderSelect = (label: string, key: keyof FormData, options: string[] | Record<string, string>, required: boolean = false) => {
        const getDisplayValue = () => {
            const value = formData[key];
            if (!value) return `Chọn ${label.toLowerCase()}`;

            if (Array.isArray(options)) {
                return value;
            } else {
                return options[value] || value;
            }
        };

        return (
            <View style={styles.formField}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>
                    {label} {required && <Text style={styles.required}>*</Text>}
                </Text>
                <TouchableOpacity
                    style={[
                        styles.selectButton,
                        {
                            backgroundColor: colors.cardBackground,
                            borderColor: errors[key] ? "#EF4444" : colors.border,
                        },
                    ]}
                    onPress={() => setShowPicker({ field: key, options, title: label })}
                >
                    <Text
                        style={[
                            styles.selectText,
                            {
                                color: formData[key] ? colors.text : colors.icon,
                            },
                        ]}
                    >
                        {getDisplayValue()}
                    </Text>
                    <IconSymbol name="chevron.down" size={16} color={colors.icon} />
                </TouchableOpacity>
                {errors[key] && <Text style={styles.errorText}>{errors[key]}</Text>}
            </View>
        );
    };

    if (loading) {
        return (
            <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
                <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} />
                {renderHeader()}

                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.tint} />
                    <ThemedText style={[styles.loadingText, { color: colors.text }]}>Đang tải...</ThemedText>
                </View>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} />
            {renderHeader()}

            <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === "ios" ? "padding" : "height"}>
                <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
                    {/* Warning Notice */}
                    <View style={[styles.warningCard, { backgroundColor: colors.cardBackground, borderColor: "#F59E0B" }]}>
                        <IconSymbol name="exclamationmark.triangle" size={20} color="#F59E0B" />
                        <ThemedText style={[styles.warningText, { color: colors.text }]}>
                            Thông tin bạn cung cấp sẽ được sử dụng để cá nhân hóa trải nghiệm của bạn. Chúng tôi sẽ dựa trên dữ liệu này để đề xuất công việc phù hợp và
                            và gợi ý chỉnh sửa CV.
                        </ThemedText>
                    </View>

                    {/* Personal Information */}
                    <View style={styles.section}>
                        <ThemedText style={[styles.sectionTitle, { color: colors.tint }]}>Hồ sơ cá nhân</ThemedText>

                        {renderTextInput("Họ tên", "Name", "Nguyen Van A", true)}
                        {renderTextInput("Năm sinh", "DOB", "dd/mm/yyyy, mm/yyyy hoặc yyyy", true)}
                        {renderSelect("Địa chỉ", "Address", vietnameseProvinces, true)}
                        {renderTextInput("Số điện thoại", "Phone_Number", "0987654321", false, false, "phone-pad")}
                        {renderTextInput("Email", "Email", "example@email.com", true, false, "email-address")}
                        {renderTextInput("LinkedIn/Portfolio", "LinkedInPortfolio", "https://linkedin.com/in/yourprofile")}
                        {renderTextInput("Mục tiêu nghề nghiệp", "Career_objective", "Mô tả ngắn gọn về mục tiêu nghề nghiệp", false, true)}
                    </View>

                    {/* Education */}
                    <View style={styles.section}>
                        <ThemedText style={[styles.sectionTitle, { color: colors.tint }]}>Học vấn</ThemedText>

                        {renderTextInput("Tên trường đại học", "University", "Đại học ABC")}
                        {renderTextInput("Chuyên ngành", "Major", "Công nghệ thông tin")}
                        {renderTextInput("Điểm GPA", "GPA", "3.5/4.0")}
                        {renderSelect("Năm tốt nghiệp", "Graduated_year", years)}
                        {renderTextInput("Thành tích & Giải thưởng", "Achievements_awards", "Các thành tích nổi bật", false, true)}
                        {renderTextInput("Hoạt động ngoại khóa", "Extracurricular_activities", "Các hoạt động ngoại khóa", false, true)}
                        {renderTextInput("Sở thích", "Interests", "Sở thích cá nhân", false, true)}
                    </View>

                    {/* Career Information */}
                    <View style={styles.section}>
                        <ThemedText style={[styles.sectionTitle, { color: colors.tint }]}>Thông tin nghề nghiệp</ThemedText>

                        {renderTextInput("Vị trí ứng tuyển", "Job_position", "Software Developer")}
                        {renderSelect("Cấp bậc", "Rank", experienceLevelsMap, true)}
                        {renderSelect("Ngành nghề", "Industry", jobCategoriesMap, true)}
                        {renderSelect("Số năm kinh nghiệm", "Years_of_experience", experienceYearsMap, true)}
                        {renderTextInput("Kinh nghiệm làm việc", "Work_Experience", "Mô tả kinh nghiệm làm việc chi tiết", false, true)}
                        {renderTextInput("Các dự án đã làm", "Projects", "Mô tả các dự án đã thực hiện", false, true)}
                        {renderTextInput("Kỹ năng", "Skills", "JavaScript, React, Node.js...", true, true)}
                        {renderTextInput("Người tham khảo", "References", "Thông tin người tham khảo", false, true)}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Picker Modal */}
            <Modal visible={!!showPicker} transparent={true} animationType="fade" onRequestClose={() => setShowPicker(null)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowPicker(null)}>
                    <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
                        <View style={[styles.pickerModal, { backgroundColor: colors.cardBackground }]}>
                            <View style={[styles.pickerHeader, { borderBottomColor: colors.border }]}>
                                <TouchableOpacity onPress={() => setShowPicker(null)}>
                                    <Text style={[styles.pickerCancel, { color: colors.icon }]}>Hủy</Text>
                                </TouchableOpacity>
                                <Text style={[styles.pickerTitle, { color: colors.text }]}>{showPicker?.title}</Text>
                                <TouchableOpacity onPress={() => setShowPicker(null)}>
                                    <Text style={[styles.pickerDone, { color: colors.tint }]}>Xong</Text>
                                </TouchableOpacity>
                            </View>
                            <Picker
                                selectedValue={showPicker ? formData[showPicker.field] : ""}
                                style={[styles.picker, { color: colors.text }]}
                                onValueChange={(value) => {
                                    if (showPicker) {
                                        updateFormField(showPicker.field, value as string);
                                    }
                                }}
                            >
                                <Picker.Item label={`Chọn ${showPicker?.title.toLowerCase()}`} value="" />
                                {showPicker &&
                                    (Array.isArray(showPicker.options)
                                        ? showPicker.options.map((option) => <Picker.Item key={option} label={option} value={option} />)
                                        : Object.entries(showPicker.options).map(([value, label]) => <Picker.Item key={value} label={label as string} value={value} />))}
                            </Picker>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {/* Floating Reset Button */}
            {hasFormChanged() && (
                <TouchableOpacity
                    style={[styles.floatingResetButton, { backgroundColor: colors.error }]}
                    onPress={() => {
                        Alert.alert("Khôi phục thông tin", "Bạn có chắc muốn khôi phục về thông tin ban đầu? Mọi thay đổi sẽ bị mất.", [
                            { text: "Hủy", style: "cancel" },
                            { text: "Khôi phục", onPress: resetForm, style: "destructive" },
                        ]);
                    }}
                    activeOpacity={0.8}
                >
                    <IconSymbol name="arrow.counterclockwise" size={20} color="white" />
                </TouchableOpacity>
            )}
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
    headerSubtitle: {
        fontSize: 14,
        color: "rgba(255,255,255,0.8)",
        marginTop: 2,
    },
    saveButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        flex: 1,
        padding: 16,
    },
    warningCard: {
        flexDirection: "row",
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 24,
        gap: 12,
    },
    warningText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 16,
    },
    formField: {
        marginBottom: 16,
    },
    fieldLabel: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 8,
    },
    required: {
        color: "#EF4444",
    },
    textInput: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        minHeight: 48,
    },
    textArea: {
        minHeight: 100,
        paddingTop: 12,
        textAlignVertical: "top",
    },
    pickerContainer: {
        borderWidth: 1,
        borderRadius: 12,
        minHeight: 48,
        justifyContent: "center",
    },
    picker: {
        fontSize: 16,
        marginHorizontal: 20,
        marginVertical: 10,
        height: 300,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 16,
    },
    loadingText: {
        fontSize: 16,
        fontWeight: "500",
    },
    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    pickerModal: {
        width: width * 0.85,
        maxHeight: "80%",
        borderRadius: 20,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    pickerHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 20,
        borderBottomWidth: 1,
    },
    pickerCancel: {
        fontSize: 16,
        fontWeight: "bold",
    },
    pickerTitle: {
        fontSize: 18,
        fontWeight: "bold",
    },
    pickerDone: {
        fontSize: 16,
        fontWeight: "bold",
    },
    selectButton: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    selectText: {
        fontSize: 16,
    },
    errorText: {
        color: "#EF4444",
        fontSize: 12,
        marginTop: 4,
    },
    floatingResetButton: {
        position: "absolute",
        bottom: 30,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
});
