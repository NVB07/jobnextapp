import ENV from "../config/env";

// For development, use your computer's IP address
// Replace with your actual IP address when testing on device
const API_BASE_URL = ENV.API_URL;

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    pagination?: {
        currentPage: number;
        perPage: number;
        totalPages: number;
        totalJobs?: number;
        totalBlogs?: number;
        totalCompanies?: number;
    };
}

// Job interfaces
export interface Job {
    _id: string;
    jobId?: string;
    jobSource?: string;
    contact?: string;
    title: string;
    alias?: string;
    company: string;
    companyAlias?: string;
    companyLogo?: string; // URL of company logo
    locationVI?: string;
    location: string;
    salary: string;
    jobLevel?: string;
    jobLevelVI?: string;
    groupJobFunctionV3Name?: string;
    groupJobFunctionV3NameVI?: string;
    jobRequirement?: string;
    description: string;
    languageSelected?: string;
    url?: string;
    skills: string[] | string | undefined; // Handle both string and array types
    expiredOn?: string;
    createdAt?: string;
    updatedAt?: string;
    // Legacy fields for backward compatibility
    type?: string;
    requirements?: string[];
    benefits?: string[];
    posted?: string;
    level?: string;
    category?: string;
    deadline?: string;
    contactEmail?: string;
    contactPhone?: string;
    isActive?: boolean;
    views?: number;
    applications?: number;
}

// Blog interfaces
export interface BlogPost {
    _id: string;
    title: string;
    excerpt: string;
    content: string;
    author: {
        name: string;
        avatar?: string;
    };
    publishedAt: string;
    readTime: string;
    category: string;
    featured: boolean;
    tags: string[];
    imageUrl?: string;
    likes: number;
    views: number;
}

// CV Analysis interfaces
export interface CVAnalysisResult {
    _id?: string;
    overallScore: number;
    categories: {
        name: string;
        score: number;
        feedback: string;
    }[];
    recommendations: string[];
    strengths: string[];
    improvementAreas: string[];
    createdAt?: string;
}

// User Data interfaces
export interface UserProfile {
    Name?: string;
    DOB?: string;
    Phone_Number?: string;
    Address?: string;
    Email?: string;
    LinkedInPortfolio?: string;
    Career_objective?: string;
    University?: string;
    Major?: string;
    GPA?: string;
    Graduated_year?: string;
    Job_position?: string;
    Years_of_experience?: string;
    Achievements_awards?: string;
    Extracurricular_activities?: string;
    Interests?: string;
    Rank?: string;
    Industry?: string;
    Work_Experience?: string;
    Projects?: string;
    Skills?: string;
    References?: string;
}

export interface UserData {
    _id: string;
    uid: string;
    email: string;
    displayName?: string;
    userData?: {
        recommend?: string | null;
        PDF_CV_URL?: string | null;
        profile?: UserProfile | null;
    };
    createdAt: string;
    updatedAt: string;
}

// API Response interface for user data
interface UserDataApiResponse {
    success: boolean;
    user: {
        _id: string;
        uid: string;
        userData?: {
            recommend?: string;
            PDF_CV_URL?: string;
            profile?: UserProfile;
        };
        createdAt: string;
        updatedAt: string;
    };
    userRecord: {
        email: string;
        displayName?: string;
        emailVerified: boolean;
    };
}

// API Service Class
class ApiService {
    private baseURL: string;

    constructor() {
        this.baseURL = API_BASE_URL;
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${this.baseURL}${endpoint}`;

        const config: RequestInit = {
            headers: {
                "Content-Type": "application/json",
                ...options.headers,
            },
            ...options,
        };

        try {
            console.log(`🌐 API Request: ${url}`);
            const response = await fetch(url, config);

            if (!response.ok) {
                console.error(`❌ API Error: ${response.status} ${response.statusText}`);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log(`✅ API Success: ${endpoint}`, data?.success ? "OK" : "Data received");
            return data;
        } catch (error) {
            console.error("🚨 API request failed:", error);
            throw error;
        }
    }

    // Job API methods
    async getJobs(params?: { page?: number; limit?: number; category?: string; search?: string; type?: string; location?: string }): Promise<{
        jobs: Job[];
        totalJobs: number;
        totalPages: number;
        currentPage: number;
    }> {
        const queryParams = new URLSearchParams();

        if (params?.page) queryParams.append("page", params.page.toString());
        if (params?.limit) queryParams.append("perPage", params.limit.toString());
        if (params?.category) queryParams.append("category", params.category);
        if (params?.search) queryParams.append("search", params.search);
        if (params?.type) queryParams.append("type", params.type);
        if (params?.location) queryParams.append("location", params.location);

        const queryString = queryParams.toString();
        const endpoint = `/jobs${queryString ? `?${queryString}` : ""}`;

        const response = await this.request<ApiResponse<Job[]>>(endpoint);

        // Parse the response to match expected format
        return {
            jobs: response.data || [],
            totalJobs: response.pagination?.totalJobs || 0,
            totalPages: response.pagination?.totalPages || 1,
            currentPage: response.pagination?.currentPage || 1,
        };
    }

    async getJobById(jobId: string): Promise<Job> {
        return this.request<Job>(`/jobs/${jobId}`);
    }

    async searchJobs(searchQuery: string): Promise<Job[]> {
        const response = await this.request<ApiResponse<Job[]>>("/jobs/search", {
            method: "POST",
            body: JSON.stringify({ query: searchQuery }),
        });

        return response.data || [];
    }

    async getTopCompanies(): Promise<{
        companies: Array<{
            name: string;
            jobCount: number;
            logo?: string;
        }>;
        totalCompanies: number;
    }> {
        const response = await this.request<
            ApiResponse<
                Array<{
                    company: string;
                    totalJobs: number;
                    companyLogo?: string;
                }>
            >
        >("/jobs/stats/top-companies");

        // Transform the response to match expected format
        const companies = (response.data || []).map((item) => ({
            name: item.company,
            jobCount: item.totalJobs,
            logo: item.companyLogo,
        }));

        return {
            companies,
            totalCompanies: response.pagination?.totalCompanies || companies.length,
        };
    }

    async getRecommendedJobs(params?: { page?: number; limit?: number }): Promise<{
        jobs: Job[];
        totalJobs: number;
        totalPages: number;
        currentPage: number;
    }> {
        const queryParams = new URLSearchParams();

        if (params?.page) queryParams.append("page", params.page.toString());
        if (params?.limit) queryParams.append("perPage", params.limit.toString());

        const queryString = queryParams.toString();
        const endpoint = `/jobs/recommended${queryString ? `?${queryString}` : ""}`;

        const response = await this.request<ApiResponse<Job[]>>(endpoint);

        return {
            jobs: response.data || [],
            totalJobs: response.pagination?.totalJobs || 0,
            totalPages: response.pagination?.totalPages || 1,
            currentPage: response.pagination?.currentPage || 1,
        };
    }

    // Blog API methods
    async getBlogs(params?: { page?: number; limit?: number; category?: string; featured?: boolean }): Promise<{
        blogs: BlogPost[];
        totalBlogs: number;
        totalPages: number;
        currentPage: number;
    }> {
        try {
            const queryParams = new URLSearchParams();

            if (params?.page) queryParams.append("page", params.page.toString());
            if (params?.limit) queryParams.append("perPage", params.limit.toString());
            if (params?.category) queryParams.append("category", params.category);
            if (params?.featured !== undefined) queryParams.append("featured", params.featured.toString());

            const queryString = queryParams.toString();
            const endpoint = `/blogs${queryString ? `?${queryString}` : ""}`;

            const response = await this.request<ApiResponse<BlogPost[]>>(endpoint);

            // Parse the response to match expected format
            return {
                blogs: response.data || [],
                totalBlogs: response.pagination?.totalJobs || response.pagination?.totalBlogs || 0,
                totalPages: response.pagination?.totalPages || 1,
                currentPage: response.pagination?.currentPage || 1,
            };
        } catch (error) {
            console.warn("Blog API not available, returning empty data:", error);
            // Fallback to empty data if blog API is not implemented
            return {
                blogs: [],
                totalBlogs: 0,
                totalPages: 1,
                currentPage: 1,
            };
        }
    }

    async getBlogById(blogId: string): Promise<BlogPost> {
        try {
            const response = await this.request<BlogPost>(`/blogs/${blogId}`);
            return response;
        } catch (error) {
            console.error("Error fetching blog by ID:", error);
            throw error;
        }
    }

    // CV Analysis API methods
    async analyzeCVFile(file: FormData): Promise<CVAnalysisResult> {
        try {
            const response = await this.request<ApiResponse<CVAnalysisResult>>("/cv", {
                method: "POST",
                headers: {
                    // Don't set Content-Type for FormData, let browser set it
                },
                body: file,
            });

            return response.data || response;
        } catch (error) {
            console.error("Error analyzing CV:", error);
            throw error;
        }
    }

    async getCVAnalysisByUid(uid: string): Promise<CVAnalysisResult[]> {
        const response = await this.request<ApiResponse<CVAnalysisResult[]>>(`/cv-analysis/user/${uid}`);
        return response.data || [];
    }

    // User API methods
    async getUserData(uid: string): Promise<UserData | null> {
        try {
            console.log(`🔍 Fetching user data for uid: ${uid}`);
            const response = await this.request<UserDataApiResponse>(`/users/${uid}`);
            console.log("🔍 Response:", response);

            if (!response.success || !response.user) {
                console.log("⚠️ No user data in response");
                return null;
            }

            // Transform API response to match UserData interface
            const userData: UserData = {
                _id: response.user._id,
                uid: response.user.uid,
                email: response.userRecord.email,
                displayName: response.userRecord.displayName,
                userData: response.user.userData
                    ? {
                          recommend: response.user.userData.recommend || null,
                          PDF_CV_URL: response.user.userData.PDF_CV_URL || null,
                          profile: response.user.userData.profile || null,
                      }
                    : undefined,
                createdAt: response.user.createdAt,
                updatedAt: response.user.updatedAt,
            };

            console.log("✅ User data transformed:", {
                uid: userData.uid,
                hasRecommend: !!userData.userData?.recommend,
                hasProfile: !!userData.userData?.profile,
                hasPDF: !!userData.userData?.PDF_CV_URL,
            });

            return userData;
        } catch (error) {
            console.error(`❌ Failed to fetch user data for uid: ${uid}`, error);
            return null;
        }
    }

    // Health check
    async ping(): Promise<string> {
        try {
            const response = await this.request<string>("/ping");
            return response;
        } catch (error) {
            console.error("Ping failed:", error);
            throw error;
        }
    }
}
export const apiService = new ApiService();
