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
    // Bookmark status
    isSaved?: boolean;
    // Semantic matching score (0-100%)
    semanticScore?: number;
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
    createdAt: string;
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

// Job Detail interfaces
export interface JobDetailResponse {
    success: boolean;
    data?: {
        jobDescription: string;
        jobRequirements: string;
    };
    error?: string;
    message?: string;
}

// Enhanced Job interface with detailed information
export interface JobWithDetail extends Job {
    detailedDescription?: string;
    detailedRequirements?: string;
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
        review?: string | null; // For job recommendations
        recommend?: string | null; // For CV analysis recommendations
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
            review?: string; // For job recommendations
            recommend?: string; // For CV analysis recommendations
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
        // Ensure proper URL construction with correct slash handling
        const cleanBaseURL = this.baseURL.endsWith("/") ? this.baseURL.slice(0, -1) : this.baseURL;
        const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
        const url = `${cleanBaseURL}${cleanEndpoint}`;

        const config: RequestInit = {
            headers: {
                "Content-Type": "application/json",
                ...options.headers,
            },
            ...options,
        };

        try {
            console.log(`🌐 API Request: ${url}`);
            console.log(`📤 Request body:`, options.body ? JSON.parse(options.body as string) : "No body");
            console.log(`🔧 Full URL comparison:`, {
                baseURL: this.baseURL,
                endpoint: endpoint,
                finalURL: url,
            });
            const response = await fetch(url, config);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ API Error: ${response.status} ${response.statusText}`);
                console.error(`❌ Error Response:`, errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log(`✅ API Success: ${endpoint}`, data?.success ? "OK" : "Data received");
            // console.log(`📊 Full Response:`, data);
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

    async searchJobsWithFilters(params: {
        page?: number;
        perPage?: number;
        uid?: string;
        skill?: string;
        location?: string;
        category?: string;
        jobLevel?: string;
    }): Promise<{
        jobs: Job[];
        totalJobs: number;
        totalPages: number;
        currentPage: number;
    }> {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append("page", params.page.toString());
        if (params.perPage) queryParams.append("perPage", params.perPage.toString());

        const queryString = queryParams.toString();
        const endpoint = `/jobs/search-no-match${queryString ? `?${queryString}` : ""}`;

        const body: any = {};
        if (params.uid) body.uid = params.uid;
        if (params.skill) body.skill = params.skill;
        if (params.location) body.location = params.location;
        if (params.category) body.category = params.category;
        if (params.jobLevel) body.jobLevel = params.jobLevel;

        const response = await this.request<ApiResponse<Job[]>>(endpoint, {
            method: "POST",
            body: JSON.stringify(body),
        });

        return {
            jobs: response.data || [],
            totalJobs: response.pagination?.totalJobs || 0,
            totalPages: response.pagination?.totalPages || 1,
            currentPage: response.pagination?.currentPage || 1,
        };
    }

    async getJobDetail(jobUrl: string): Promise<JobDetailResponse> {
        try {
            console.log(`🔄 Fetching job detail from external API for URL: ${jobUrl}`);

            const response = await fetch("https://jobnext-rosy.vercel.app/api/jobdetail", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ url: jobUrl }),
            });

            if (!response.ok) {
                console.error(`❌ Job Detail API Error: ${response.status} ${response.statusText}`);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log(`✅ Job Detail API Success:`, data?.success ? "OK" : "Data received");
            return data;
        } catch (error) {
            console.error("🚨 Job Detail API request failed:", error);
            throw error;
        }
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
                          review: response.user.userData.review || null,
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
                hasReview: !!userData.userData?.review,
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
            const response = await this.request<{ message: string; timestamp: string }>(`ping`);
            return `${response.message} at ${response.timestamp}`;
        } catch (error) {
            console.error("Ping failed:", error);
            throw new Error("Could not reach server");
        }
    }

    // Hybrid search for personalized job recommendations
    async hybridSearchJobs(params: {
        page?: number;
        perPage?: number;
        uid?: string;
        skill?: string;
        jobLevel?: string;
        location?: string;
        groupJobFunctionV3Name?: string;
        review?: string;
        method?: string;
    }): Promise<{
        jobs: Job[];
        totalJobs: number;
        totalPages: number;
        currentPage: number;
        searchInfo?: {
            cached: boolean;
            method: string;
            endpoint: string;
        };
    }> {
        try {
            const { page = 1, perPage = 20, uid, skill, jobLevel, location, groupJobFunctionV3Name, review, method = "transformer" } = params;

            // Build body exactly like Recommend.jsx
            const body: any = {};

            // Only include fields that are provided (conditional like Recommend.jsx)
            if (skill) body.skill = skill;
            if (jobLevel) body.jobLevel = jobLevel;
            if (location) body.location = location;
            if (groupJobFunctionV3Name) body.groupJobFunctionV3Name = groupJobFunctionV3Name;
            if (review) body.review = review;
            if (uid) body.uid = uid;
            body.method = method; // Always include method

            // console.log(`🚀 Calling hybrid-search with body:`, body);

            const response = await this.request<ApiResponse<Job[]>>(`jobs/hybrid-search?page=${page}&perPage=${perPage}`, {
                method: "POST",
                body: JSON.stringify(body),
            });

            if (!response.success) {
                throw new Error("Hybrid endpoint failed");
            }

            return {
                jobs: response.data || [],
                totalJobs: response.pagination?.totalJobs || 0,
                totalPages: response.pagination?.totalPages || 1,
                currentPage: response.pagination?.currentPage || 1,
                searchInfo: {
                    cached: false,
                    method: "hybrid",
                    endpoint: "jobs/hybrid-search",
                },
            };
        } catch (error) {
            console.error("❌ Hybrid search failed:", error);
            throw error;
        }
    }

    // Fallback search for when hybrid search fails
    async fallbackSearchJobs(params: {
        page?: number;
        perPage?: number;
        uid?: string;
        skill?: string;
        jobLevel?: string;
        location?: string;
        groupJobFunctionV3Name?: string;
        review?: string;
    }): Promise<{
        jobs: Job[];
        totalJobs: number;
        totalPages: number;
        currentPage: number;
        searchInfo?: {
            cached: boolean;
            method: string;
            endpoint: string;
        };
    }> {
        try {
            const { page = 1, perPage = 20, uid, skill, jobLevel, location, groupJobFunctionV3Name, review } = params;

            // Build body exactly like Recommend.jsx fallback
            const body: any = {};

            // Only include fields that are provided (conditional like Recommend.jsx)
            if (skill) body.skill = skill;
            if (jobLevel) body.jobLevel = jobLevel;
            if (location) body.location = location;
            if (groupJobFunctionV3Name) body.groupJobFunctionV3Name = groupJobFunctionV3Name;
            if (review) body.review = review;
            if (uid) body.uid = uid;

            console.log(`🔄 Calling fallback search with body:`, body);

            const response = await this.request<ApiResponse<Job[]>>(`jobs/search?page=${page}&perPage=${perPage}`, {
                method: "POST",
                body: JSON.stringify(body),
            });

            if (!response.success) {
                throw new Error("Lỗi khi tải dữ liệu");
            }
            // console.log("🔄 Fallback search response:", response.data);
            return {
                jobs: response.data || [],
                totalJobs: response.pagination?.totalJobs || 0,
                totalPages: response.pagination?.totalPages || 1,
                currentPage: response.pagination?.currentPage || 1,
                searchInfo: {
                    cached: false,
                    method: "fallback",
                    endpoint: "jobs/search",
                },
            };
        } catch (error) {
            console.error("❌ Fallback search failed:", error);
            throw error;
        }
    }

    // Job bookmark methods
    async saveJob(userId: string, jobId: string): Promise<{ success: boolean; message?: string }> {
        try {
            console.log(`💾 Saving job ${jobId} for user ${userId}`);
            const response = await this.request<{ success: boolean; message?: string }>("users/save-job", {
                method: "POST",
                body: JSON.stringify({ userId, jobId }),
            });
            return response;
        } catch (error) {
            console.error("Failed to save job:", error);
            throw error;
        }
    }

    async unsaveJob(userId: string, jobId: string): Promise<{ success: boolean; message?: string }> {
        try {
            console.log(`🗑️ Unsaving job ${jobId} for user ${userId}`);
            const response = await this.request<{ success: boolean; message?: string }>("users/unsave-job", {
                method: "POST",
                body: JSON.stringify({ userId, jobId }),
            });
            return response;
        } catch (error) {
            console.error("Failed to unsave job:", error);
            throw error;
        }
    }
}
export const apiService = new ApiService();
