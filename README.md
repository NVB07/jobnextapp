# JobNext Mobile App

JobNext là ứng dụng mobile giúp kết nối ứng viên và nhà tuyển dụng, được xây dựng bằng React Native và Expo.

## Tính năng chính

-   🔐 **Authentication**: Đăng nhập/đăng ký với email hoặc Google
-   💼 **Tìm kiếm việc làm**: Duyệt và tìm kiếm công việc
-   📰 **Blog**: Đọc tin tức và bài viết về nghề nghiệp
-   📊 **Phân tích CV**: Tải lên và phân tích CV
-   👤 **Hồ sơ cá nhân**: Quản lý thông tin và thống kê

## Hướng dẫn cài đặt

1. **Clone dự án**

    ```bash
    git clone [repo-url]
    cd jobnextapp
    ```

2. **Cài đặt dependencies**

    ```bash
    npm install
    ```

3. **Cấu hình Environment Variables**

    Tạo file `.env` trong thư mục gốc với nội dung sau:

    ```env
    # Firebase Config for Mobile (Expo)
    EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
    EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
    EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
    EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

    # API URL
    EXPO_PUBLIC_API_URL=https://your-server-url.com
    ```

    > **Lưu ý**: Để bảo mật, file `.env` không được commit vào Git. Sao chép từ `.env.example` và cập nhật với thông tin của bạn.

4. **Cấu hình Firebase**

    - Tạo project Firebase tại [Firebase Console](https://console.firebase.google.com/)
    - Bật Authentication và các providers cần thiết
    - Lấy config và cập nhật vào file `.env`

5. **Chạy ứng dụng**

    ```bash
    # Phát triển
    npm start

    # Android
    npm run android

    # iOS
    npm run ios
    ```

## Environment Variables

App sử dụng các biến môi trường sau:

### Firebase Configuration

-   `EXPO_PUBLIC_FIREBASE_API_KEY` - Firebase API Key
-   `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` - Firebase Auth Domain
-   `EXPO_PUBLIC_FIREBASE_PROJECT_ID` - Firebase Project ID
-   `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` - Firebase Storage Bucket
-   `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - Firebase Messaging Sender ID
-   `EXPO_PUBLIC_FIREBASE_APP_ID` - Firebase App ID
-   `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID` - Firebase Analytics Measurement ID

### API Configuration

-   `EXPO_PUBLIC_API_URL` - Backend API URL

> **Expo Public Variables**: Expo yêu cầu prefix `EXPO_PUBLIC_` cho các biến môi trường có thể access từ client-side code.

## Chức năng đăng nhập

### Sử dụng LoginScreen (Full screen)

```tsx
import { LoginScreen } from "../components/auth/LoginScreen";

export default function Login() {
    return <LoginScreen />;
}
```

**Tính năng:**

-   Nút "Quay lại" ở header để quay về trang chính
-   Tùy chọn "Bỏ qua, khám phá ứng dụng" ở footer
-   Form đăng nhập/đăng ký với validation
-   Chuyển đổi giữa đăng nhập và đăng ký

### Sử dụng LoginModal (Modal popup)

```tsx
import React, { useState } from "react";
import { LoginModal } from "../components/auth/LoginModal";
import { useAuth } from "../contexts/AuthContext";

export default function SomeScreen() {
    const [showLoginModal, setShowLoginModal] = useState(false);
    const { user } = useAuth();

    const handleLoginSuccess = () => {
        console.log("Đăng nhập thành công!");
        // Thực hiện các hành động sau khi đăng nhập
    };

    return (
        <View>
            {!user ? <Button title="Đăng nhập" onPress={() => setShowLoginModal(true)} /> : <Text>Xin chào, {user.displayName}!</Text>}

            <LoginModal visible={showLoginModal} onClose={() => setShowLoginModal(false)} onSuccess={handleLoginSuccess} />
        </View>
    );
}
```

**Tính năng:**

-   Nút đóng (X) ở góc phải trên
-   Tùy chọn "Bỏ qua, sử dụng ứng dụng" ở footer
-   Có thể đóng modal mà không cần đăng nhập

### Bảo vệ routes với AuthGuard

```tsx
import { useAuthGuard } from "../hooks/useAuthGuard";

export default function ProtectedScreen() {
    const { user, loading, isAuthenticated } = useAuthGuard();

    if (loading || !isAuthenticated) {
        return <LoadingView />;
    }

    return (
        <View>
            <Text>Nội dung chỉ dành cho người đã đăng nhập</Text>
        </View>
    );
}
```

### AuthContext API

```tsx
import { useAuth } from "../contexts/AuthContext";

const {
    user, // Thông tin user hiện tại
    loading, // Trạng thái loading
    signIn, // Đăng nhập với email/password
    signUp, // Đăng ký tài khoản mới
    signOut, // Đăng xuất
    refreshUser, // Làm mới thông tin user
} = useAuth();
```

## Cấu trúc dự án

```
jobnextapp/
├── app/                    # App router và screens
│   ├── (tabs)/            # Tab navigation
│   └── login.tsx          # Màn hình đăng nhập
├── components/
│   ├── auth/              # Components xác thực
│   │   ├── LoginScreen.tsx
│   │   └── LoginModal.tsx
│   └── ui/                # UI components
├── contexts/
│   └── AuthContext.tsx    # Authentication context
├── services/
│   ├── authService.ts     # Service xử lý auth
│   └── api.ts             # API service
├── hooks/
│   └── useAuthGuard.tsx   # Hook bảo vệ routes
├── config/
│   ├── firebase.ts        # Cấu hình Firebase
│   └── env.ts             # Environment variables helper
└── .env                   # Environment variables (không commit)
```

## Dependencies chính

-   **Firebase**: Authentication và backend services
-   **React Hook Form**: Quản lý form và validation
-   **Yup**: Schema validation
-   **Expo Secure Store**: Lưu trữ token bảo mật
-   **Expo Router**: Navigation

## Lưu ý

-   **Environment Variables**: Đảm bảo cấu hình đúng trong file `.env`
-   **Security**: Token được lưu trữ an toàn bằng Expo Secure Store
-   **Auto-redirect**: App tự động chuyển hướng đến login nếu chưa xác thực
-   **Validation**: Hỗ trợ validation form theo tiêu chuẩn bảo mật
-   **Error Handling**: Có validation và error handling cho environment variables

## Troubleshooting

### Firebase Configuration Issues

-   Kiểm tra các biến môi trường trong file `.env`
-   Đảm bảo Firebase project đã được cấu hình đúng
-   Kiểm tra console log khi app khởi động

### Environment Variables Not Working

-   Restart Expo development server sau khi thay đổi `.env`
-   Đảm bảo sử dụng prefix `EXPO_PUBLIC_` cho các biến client-side
-   Kiểm tra file `config/env.ts` để debug

## License

MIT License
