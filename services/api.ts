import { Alert } from "react-native";
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

// Cache interface for job details
interface JobDetailCacheItem {
    data: {
        jobDescription: string;
        jobRequirements: string;
    };
    timestamp: number;
    url: string;
}

// Cache configuration
const CACHE_CONFIG = {
    maxSize: 50, // Maximum number of cached job details
    ttl: 60 * 60 * 1000, // 1 hour TTL (time to live)
    cleanupInterval: 10 * 60 * 1000, // Cleanup every 10 minutes
};

// Job Details Cache Service
class JobDetailsCacheService {
    private cache: Map<string, JobDetailCacheItem> = new Map();
    private cleanupTimer: ReturnType<typeof setInterval> | null = null;

    constructor() {
        this.startCleanupTimer();
    }

    private startCleanupTimer() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }

        this.cleanupTimer = setInterval(() => {
            this.cleanup();
        }, CACHE_CONFIG.cleanupInterval);
    }

    private cleanup() {
        const now = Date.now();
        const entriesToRemove: string[] = [];

        // Remove expired entries
        for (const [key, item] of this.cache.entries()) {
            if (now - item.timestamp > CACHE_CONFIG.ttl) {
                entriesToRemove.push(key);
            }
        }

        entriesToRemove.forEach((key) => this.cache.delete(key));

        // If cache is still too large, remove oldest entries
        if (this.cache.size > CACHE_CONFIG.maxSize) {
            const entries = Array.from(this.cache.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);

            const toRemove = entries.slice(0, entries.length - CACHE_CONFIG.maxSize);
            toRemove.forEach(([key]) => this.cache.delete(key));

            console.log(`🧹 Job Details Cache cleanup: Removed ${toRemove.length} entries`);
        }

        console.log(`📊 Job Details Cache stats: ${this.cache.size}/${CACHE_CONFIG.maxSize} entries`);
    }

    private getCacheKey(url: string): string {
        // Create a normalized cache key from URL
        return `job_detail_${url}`;
    }

    get(url: string): JobDetailCacheItem | null {
        const key = this.getCacheKey(url);
        const item = this.cache.get(key);

        if (!item) {
            return null;
        }

        // Check if item is expired
        if (Date.now() - item.timestamp > CACHE_CONFIG.ttl) {
            this.cache.delete(key);
            return null;
        }

        return item;
    }

    set(url: string, data: { jobDescription: string; jobRequirements: string }): void {
        const key = this.getCacheKey(url);
        const item: JobDetailCacheItem = {
            data,
            timestamp: Date.now(),
            url,
        };

        this.cache.set(key, item);
        console.log(`💾 Cached job details for: ${url.substring(0, 50)}...`);

        // Trigger cleanup if cache is getting large
        if (this.cache.size > CACHE_CONFIG.maxSize) {
            this.cleanup();
        }
    }

    has(url: string): boolean {
        const item = this.get(url);
        return item !== null;
    }

    clear(): void {
        this.cache.clear();
        console.log("🗑️ Job Details Cache cleared");
    }

    getStats(): { size: number; maxSize: number; entries: Array<{ url: string; timestamp: number; age: number }> } {
        const now = Date.now();
        const entries = Array.from(this.cache.entries()).map(([key, item]) => ({
            url: item.url,
            timestamp: item.timestamp,
            age: Math.round((now - item.timestamp) / 1000), // age in seconds
        }));

        return {
            size: this.cache.size,
            maxSize: CACHE_CONFIG.maxSize,
            entries,
        };
    }

    destroy(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
        this.cache.clear();
    }
}

// Create singleton instance
const jobDetailsCache = new JobDetailsCacheService();

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
            // Check cache first
            const cachedItem = jobDetailsCache.get(jobUrl);
            if (cachedItem) {
                console.log(`⚡ Cache HIT for job detail: ${jobUrl.substring(0, 50)}...`);
                return {
                    success: true,
                    data: cachedItem.data,
                };
            }

            console.log(`❌ Cache MISS - Fetching job detail from external API for URL: ${jobUrl.substring(0, 50)}...`);

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

            // Cache successful responses
            if (data.success && data.data) {
                jobDetailsCache.set(jobUrl, data.data);
                console.log(`✅ Job Detail API Success and cached: ${jobUrl.substring(0, 50)}...`);
            } else {
                console.log(`⚠️ Job Detail API returned unsuccessful response: ${data.message || "Unknown error"}`);
            }

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

// Export cache service for debugging purposes
export { jobDetailsCache };

// Interview API functions
export interface InterviewRequest {
    jobTitle: string;
    jobRequirement: string;
    candidateDescription: string;
    skills?: string;
    category?: string;
    answer?: string;
}

export interface InterviewResponse {
    message: string;
    result: string;
    interviewId: string;
}

export interface InterviewMessage {
    id: number;
    role: "user" | "model";
    message: string;
    pass?: number | null;
    state: boolean;
}

class InterviewService {
    private baseUrl: string;

    constructor() {
        this.baseUrl = `${ENV.API_URL}`;
    }

    async createOrContinueInterview(data: InterviewRequest, token: string): Promise<InterviewResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/interviews`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to create/continue interview");
            }

            return await response.json();
        } catch (error) {
            console.error("Interview API error:", error);
            throw error;
        }
    }

    async deleteInterview(interviewId: string, token: string): Promise<{ success: boolean; message?: string }> {
        try {
            const response = await fetch(`${this.baseUrl}/interviews/deleteInterview/${interviewId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to delete interview");
            }

            return await response.json();
        } catch (error) {
            console.error("Delete interview API error:", error);
            throw error;
        }
    }

    async getInterviewById(interviewId: string, token: string) {
        try {
            const response = await fetch(`${this.baseUrl}/interviews?interviewId=${interviewId}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to get interview");
            }

            return await response.json();
        } catch (error) {
            console.error("Get interview API error:", error);
            throw error;
        }
    }

    async checkExistingInterview(
        jobRequirement: string,
        token: string
    ): Promise<{
        exists: boolean;
        interview?: any;
        interviewId?: string;
    }> {
        try {
            console.log(`🔍 Checking existing interview for job requirement: ${jobRequirement.substring(0, 100)}...`);

            const response = await fetch(`${this.baseUrl}/interviews/getInterviewByJobRequirement?jobRequirement=${encodeURIComponent(jobRequirement)}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            console.log(`📡 Response status: ${response.status}`);

            if (!response.ok) {
                console.log(`❌ Response not ok: ${response.status} ${response.statusText}`);
                return { exists: false };
            }

            const result = await response.json();
            console.log(`📊 Backend response:`, result);

            if (result.state && result.result) {
                console.log(`✅ Found existing interview with ID: ${result.interviewId}`);
                return {
                    exists: true,
                    interview: result.result,
                    interviewId: result.interviewId,
                };
            } else {
                console.log(`❌ No existing interview found`);
                return { exists: false };
            }
        } catch (error) {
            console.error("❌ Check existing interview API error:", error);
            return { exists: false };
        }
    }

    parseInterviewResponse(result: string): InterviewMessage {
        try {
            const raw = result.replace(/```json|```/g, "").trim();
            return JSON.parse(raw);
        } catch (error) {
            // Fallback parsing for malformed JSON
            const messageMatch = result.match(/"message"\s*:\s*"([^"]+)"/);
            const passMatch = result.match(/"pass"\s*:\s*(\d+|null)/);
            const stateMatch = result.match(/"state"\s*:\s*(true|false)/);

            return {
                id: Date.now(),
                message: messageMatch ? messageMatch[1] : "Không thể phân tích phản hồi",
                role: "model",
                pass: passMatch ? (passMatch[1] === "null" ? null : parseInt(passMatch[1])) : null,
                state: stateMatch ? stateMatch[1] === "true" : true,
            };
        }
    }

    parseChatHistoryToMessages(chatHistory: any[]): InterviewMessage[] {
        const messages: InterviewMessage[] = [];

        // Skip the first message (system prompt) and process pairs
        const conversationHistory = chatHistory.slice(1);

        for (let i = 0; i < conversationHistory.length; i += 2) {
            // AI message (even index in conversation)
            if (conversationHistory[i]) {
                const aiMessage = this.parseInterviewResponse(conversationHistory[i].parts[0].text);
                aiMessage.id = messages.length + 1;
                messages.push(aiMessage);
            }

            // User message (odd index in conversation)
            if (conversationHistory[i + 1]) {
                const userMessage: InterviewMessage = {
                    id: messages.length + 1,
                    role: "user",
                    message: conversationHistory[i + 1].parts[0].text,
                    state: true,
                };
                messages.push(userMessage);
            }
        }

        return messages;
    }
}

export const interviewService = new InterviewService();

// Create a debug service to get cache stats
class DebugService {
    // Implementation of DebugService methods
}
