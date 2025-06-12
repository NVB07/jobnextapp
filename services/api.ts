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

// Cache configuration for lists
const LIST_CACHE_CONFIG = {
    maxSize: 20, // Maximum number of cached list pages
    ttl: 5 * 60 * 1000, // 5 minutes TTL for lists
    cleanupInterval: 2 * 60 * 1000, // Cleanup every 2 minutes
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

// Lists Cache Service for Saved Jobs and Interviews
interface ListCacheItem {
    data: {
        data: any[];
        pagination: {
            currentPage: number;
            perPage: number;
            totalPages: number;
            totalJobs: number;
        };
    };
    timestamp: number;
    key: string;
}

class ListsCacheService {
    private cache: Map<string, ListCacheItem> = new Map();
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
        }, LIST_CACHE_CONFIG.cleanupInterval);
    }

    private cleanup() {
        const now = Date.now();
        const entriesToRemove: string[] = [];

        // Remove expired entries
        for (const [key, item] of this.cache.entries()) {
            if (now - item.timestamp > LIST_CACHE_CONFIG.ttl) {
                entriesToRemove.push(key);
            }
        }

        entriesToRemove.forEach((key) => this.cache.delete(key));

        // If cache is still too large, remove oldest entries
        if (this.cache.size > LIST_CACHE_CONFIG.maxSize) {
            const entries = Array.from(this.cache.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);

            const toRemove = entries.slice(0, entries.length - LIST_CACHE_CONFIG.maxSize);
            toRemove.forEach(([key]) => this.cache.delete(key));

            console.log(`🧹 Lists Cache cleanup: Removed ${toRemove.length} entries`);
        }

        console.log(`📊 Lists Cache stats: ${this.cache.size}/${LIST_CACHE_CONFIG.maxSize} entries`);
    }

    private getCacheKey(type: "savedJobs" | "interviews", uid: string, page: number, perPage: number): string {
        return `${type}_${uid}_page${page}_per${perPage}`;
    }

    get(type: "savedJobs" | "interviews", uid: string, page: number, perPage: number): ListCacheItem | null {
        const key = this.getCacheKey(type, uid, page, perPage);
        const item = this.cache.get(key);

        if (!item) {
            return null;
        }

        // Check if item is expired
        if (Date.now() - item.timestamp > LIST_CACHE_CONFIG.ttl) {
            this.cache.delete(key);
            return null;
        }

        return item;
    }

    set(type: "savedJobs" | "interviews", uid: string, page: number, perPage: number, data: any): void {
        const key = this.getCacheKey(type, uid, page, perPage);
        const item: ListCacheItem = {
            data,
            timestamp: Date.now(),
            key,
        };

        this.cache.set(key, item);
        console.log(`💾 Cached ${type} list for: ${uid} page ${page}`);

        // Trigger cleanup if cache is getting large
        if (this.cache.size > LIST_CACHE_CONFIG.maxSize) {
            this.cleanup();
        }
    }

    has(type: "savedJobs" | "interviews", uid: string, page: number, perPage: number): boolean {
        const item = this.get(type, uid, page, perPage);
        return item !== null;
    }

    clearUserCache(uid: string): void {
        const keysToRemove: string[] = [];

        for (const [key, item] of this.cache.entries()) {
            if (key.includes(uid)) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach((key) => this.cache.delete(key));
        console.log(`🗑️ Cleared cache for user: ${uid} (${keysToRemove.length} entries)`);
    }

    clearTypeCache(type: "savedJobs" | "interviews"): void {
        const keysToRemove: string[] = [];

        for (const [key, item] of this.cache.entries()) {
            if (key.startsWith(type)) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach((key) => this.cache.delete(key));
        console.log(`🗑️ Cleared ${type} cache (${keysToRemove.length} entries)`);
    }

    // Clear cache when user actions that might affect the lists
    invalidateUserListsCache(uid: string, type?: "savedJobs" | "interviews"): void {
        if (type) {
            // Clear specific type for user
            const keysToRemove: string[] = [];

            for (const [key, item] of this.cache.entries()) {
                if (key.startsWith(type) && key.includes(uid)) {
                    keysToRemove.push(key);
                }
            }

            keysToRemove.forEach((key) => this.cache.delete(key));
            console.log(`🗑️ Invalidated ${type} cache for user: ${uid} (${keysToRemove.length} entries)`);
        } else {
            // Clear all cache for user
            this.clearUserCache(uid);
        }
    }

    clear(): void {
        this.cache.clear();
        console.log("🗑️ Lists Cache cleared");
    }

    getStats(): { size: number; maxSize: number; entries: Array<{ key: string; timestamp: number; age: number }> } {
        const now = Date.now();
        const entries = Array.from(this.cache.entries()).map(([key, item]) => ({
            key: item.key,
            timestamp: item.timestamp,
            age: Math.round((now - item.timestamp) / 1000), // age in seconds
        }));

        return {
            size: this.cache.size,
            maxSize: LIST_CACHE_CONFIG.maxSize,
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
const listsCache = new ListsCacheService();

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
                console.log(`❌ API Error: ${response.status} ${response.statusText}`);
                console.log(`❌ Error Response:`, errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log(`✅ API Success: ${endpoint}`, data?.success ? "OK" : "Data received");
            // console.log(`📊 Full Response:`, data);
            return data;
        } catch (error) {
            console.log("🚨 API request failed:", error);
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
                console.log(`❌ Job Detail API Error: ${response.status} ${response.statusText}`);
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
            console.log("🚨 Job Detail API request failed:", error);
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
            console.log("Error fetching blog by ID:", error);
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
            console.log("Error analyzing CV:", error);
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
            console.log(`❌ Failed to fetch user data for uid: ${uid}`, error);
            return null;
        }
    }

    async updateUserProfile(uid: string, data: { profile: UserProfile }): Promise<{ success: boolean; message?: string }> {
        try {
            console.log(`📝 Updating user profile for uid: ${uid}`);
            const response = await this.request<{ success: boolean; message?: string }>(`users/${uid}`, {
                method: "PATCH",
                body: JSON.stringify(data),
            });

            return response;
        } catch (error) {
            console.log(`❌ Failed to update user profile for uid: ${uid}`, error);
            return { success: false, message: "Lỗi khi cập nhật thông tin" };
        }
    }

    // Health check
    async ping(): Promise<string> {
        try {
            const response = await this.request<{ message: string; timestamp: string }>(`ping`);
            return `${response.message} at ${response.timestamp}`;
        } catch (error) {
            console.log("Ping failed:", error);
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
            console.log("❌ Hybrid search failed:", error);
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
            console.log("❌ Fallback search failed:", error);
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

            // Invalidate saved jobs cache after saving
            if (response.success) {
                listsCache.invalidateUserListsCache(userId, "savedJobs");
            }

            return response;
        } catch (error) {
            console.log("Failed to save job:", error);
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

            // Invalidate saved jobs cache after unsaving
            if (response.success) {
                listsCache.invalidateUserListsCache(userId, "savedJobs");
            }

            return response;
        } catch (error) {
            console.log("Failed to unsave job:", error);
            throw error;
        }
    }

    async getSavedJobsCount(uid: string): Promise<{ count: number }> {
        try {
            const response = await this.request<ApiResponse<any[]>>(`users/saved-jobs/${uid}?page=1&perPage=1`);

            return {
                count: response.pagination?.totalJobs || 0,
            };
        } catch (error) {
            console.log("Error getting saved jobs count:", error);
            return { count: 0 };
        }
    }

    async getSavedJobs(
        uid: string,
        page: number = 1,
        perPage: number = 10,
        forceRefresh: boolean = false
    ): Promise<{
        data: Job[];
        pagination: {
            currentPage: number;
            perPage: number;
            totalPages: number;
            totalJobs: number;
        };
    }> {
        try {
            // Check cache first unless force refresh
            if (!forceRefresh) {
                const cachedItem = listsCache.get("savedJobs", uid, page, perPage);
                if (cachedItem) {
                    console.log(`⚡ Cache HIT for saved jobs: ${uid} page ${page}`);
                    return cachedItem.data;
                }
            }

            console.log(`❌ Cache MISS - Fetching saved jobs from API for user: ${uid} page ${page}`);

            const response = await this.request<ApiResponse<Job[]>>(`users/saved-jobs/${uid}?page=${page}&perPage=${perPage}`);

            const result = {
                data: response.data || [],
                pagination: {
                    currentPage: response.pagination?.currentPage || 1,
                    perPage: response.pagination?.perPage || perPage,
                    totalPages: response.pagination?.totalPages || 1,
                    totalJobs: response.pagination?.totalJobs || 0,
                },
            };

            // Cache successful responses
            if (response.success !== false) {
                listsCache.set("savedJobs", uid, page, perPage, result);
                console.log(`✅ Saved jobs API Success and cached: ${uid} page ${page}`);
            }

            return result;
        } catch (error) {
            console.log("Error getting saved jobs:", error);
            return {
                data: [],
                pagination: {
                    currentPage: 1,
                    perPage: perPage,
                    totalPages: 1,
                    totalJobs: 0,
                },
            };
        }
    }

    async getInterviewsCount(uid: string, token: string): Promise<{ count: number }> {
        try {
            const cleanBaseURL = this.baseURL.endsWith("/") ? this.baseURL.slice(0, -1) : this.baseURL;
            const url = `${cleanBaseURL}/interviews/getInterviewByUid?uid=${uid}&page=1&perPage=1`;

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                console.log(`❌ Interviews API Error: ${response.status} ${response.statusText}`);
                return { count: 0 };
            }

            const data = await response.json();

            return {
                count: data.pagination?.totalInterviews || 0,
            };
        } catch (error) {
            console.log("Error getting interviews count:", error);
            return { count: 0 };
        }
    }

    async getInterviews(
        uid: string,
        token: string,
        page: number = 1,
        perPage: number = 10,
        forceRefresh: boolean = false
    ): Promise<{
        data: any[];
        pagination: {
            currentPage: number;
            perPage: number;
            totalPages: number;
            totalJobs: number;
        };
    }> {
        try {
            // Check cache first unless force refresh
            if (!forceRefresh) {
                const cachedItem = listsCache.get("interviews", uid, page, perPage);
                if (cachedItem) {
                    console.log(`⚡ Cache HIT for interviews: ${uid} page ${page}`);
                    return cachedItem.data;
                }
            }

            console.log(`❌ Cache MISS - Fetching interviews from API for user: ${uid} page ${page}`);

            const cleanBaseURL = this.baseURL.endsWith("/") ? this.baseURL.slice(0, -1) : this.baseURL;
            const url = `${cleanBaseURL}/interviews/getInterviewByUid?uid=${uid}&page=${page}&perPage=${perPage}`;

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                console.log(`❌ Interviews API Error: ${response.status} ${response.statusText}`);
                return {
                    data: [],
                    pagination: {
                        currentPage: 1,
                        perPage: perPage,
                        totalPages: 1,
                        totalJobs: 0,
                    },
                };
            }

            const data = await response.json();

            const result = {
                data: data.data || [],
                pagination: {
                    currentPage: data.pagination?.currentPage || 1,
                    perPage: data.pagination?.perPage || perPage,
                    totalPages: data.pagination?.totalPages || 1,
                    totalJobs: data.pagination?.totalInterviews || 0,
                },
            };

            // Cache successful responses
            if (data.success !== false) {
                listsCache.set("interviews", uid, page, perPage, result);
                console.log(`✅ Interviews API Success and cached: ${uid} page ${page}`);
            }

            return result;
        } catch (error) {
            console.log("Error getting interviews:", error);
            return {
                data: [],
                pagination: {
                    currentPage: 1,
                    perPage: perPage,
                    totalPages: 1,
                    totalJobs: 0,
                },
            };
        }
    }

    // Cache management utilities
    clearUserListsCache(uid: string): void {
        listsCache.clearUserCache(uid);
    }

    invalidateListsCache(uid: string, type?: "savedJobs" | "interviews"): void {
        listsCache.invalidateUserListsCache(uid, type);
    }

    getListsCacheStats(): any {
        return listsCache.getStats();
    }

    // CV Upload with basic functionality
    async uploadCV(uid: string, fileUri: string, fileName: string, fileType: string): Promise<any> {
        try {
            console.log(`🚀 Uploading CV for user ${uid}`);

            const formData = new FormData();
            formData.append("cv", {
                uri: fileUri,
                type: fileType,
                name: fileName,
            } as any);
            formData.append("uid", uid);

            const response = await fetch(`${this.baseURL}/users/uploadcv`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.log("🚨 CV upload failed:", error);
            throw error;
        }
    }

    // Enhanced CV upload with progress tracking
    uploadCVWithProgress(
        uid: string,
        fileUri: string,
        fileName: string,
        fileType: string,
        callbacks: {
            onProgress?: (data: any) => void;
            onComplete?: (data: any) => void;
            onError?: (error: any) => void;
        } = {}
    ): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                console.log(`🚀 Uploading CV with progress for user ${uid}`);

                // Start with initial progress
                if (callbacks.onProgress) {
                    callbacks.onProgress({ status: "start", progress: 5, message: "Bắt đầu tải lên..." });
                }

                const formData = new FormData();
                formData.append("cv", {
                    uri: fileUri,
                    type: fileType,
                    name: fileName,
                } as any);
                formData.append("uid", uid);

                // Check user info
                if (callbacks.onProgress) {
                    callbacks.onProgress({ status: "checking", progress: 15, message: "Kiểm tra thông tin..." });
                }

                // Create an array of progress steps to simulate the upload progress
                const progressSteps = [
                    { status: "uploading", progress: 30, message: "Đang tải CV lên..." },
                    { status: "uploading", progress: 45, message: "Đang tải CV lên..." },
                    { status: "uploading", progress: 55, message: "Đang tải CV lên..." },
                ];

                // Simulate progress steps
                let stepIndex = 0;
                const progressInterval = setInterval(() => {
                    if (stepIndex < progressSteps.length && callbacks.onProgress) {
                        callbacks.onProgress(progressSteps[stepIndex]);
                        stepIndex++;
                    } else {
                        clearInterval(progressInterval);
                    }
                }, 800);

                // Make the actual upload request
                try {
                    const response = await fetch(`${this.baseURL}/users/uploadcv`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "multipart/form-data",
                        },
                        body: formData,
                    });

                    // Clear the interval regardless of the response
                    clearInterval(progressInterval);

                    if (!response.ok) {
                        let errorMessage;
                        try {
                            // Try to parse error as JSON first
                            const errorJson = await response.json();
                            errorMessage = errorJson.message || errorJson.error || JSON.stringify(errorJson);
                        } catch (e) {
                            // If JSON parsing fails, get as text
                            errorMessage = await response.text();
                        }
                        throw new Error(errorMessage || "Không thể tải lên CV");
                    }

                    // Clone the response to safely read it multiple times if needed
                    const responseClone = response.clone();

                    // Try to get the response as JSON first
                    let responseData;
                    try {
                        responseData = await responseClone.json();
                    } catch (e) {
                        // If JSON parsing fails, get the response as text
                        try {
                            const textResponse = await response.text();
                            responseData = { success: true, message: "Upload successful", rawResponse: textResponse };
                        } catch (textError) {
                            responseData = { success: true, message: "Upload successful" };
                        }
                    }

                    // Upload finished, now analyzing
                    if (callbacks.onProgress) {
                        callbacks.onProgress({ status: "uploaded", progress: 65, message: "Đang phân tích CV..." });

                        // Simulate analysis progress
                        setTimeout(() => {
                            if (callbacks.onProgress) {
                                callbacks.onProgress({ status: "analyzing", progress: 80, message: "Đang phân tích CV..." });
                            }

                            setTimeout(() => {
                                if (callbacks.onProgress) {
                                    callbacks.onProgress({ status: "analyzed", progress: 95, message: "Phân tích hoàn tất..." });
                                }

                                setTimeout(() => {
                                    if (callbacks.onProgress) {
                                        callbacks.onProgress({ status: "completed", progress: 100, message: "Hoàn thành!" });
                                    }

                                    if (callbacks.onComplete) {
                                        callbacks.onComplete({
                                            success: true,
                                            message: "CV đã được tải lên và phân tích thành công!",
                                        });
                                    }

                                    // Resolve with the already parsed data
                                    resolve(responseData);
                                }, 500);
                            }, 1000);
                        }, 1000);
                    } else {
                        // No progress callbacks, just resolve with the data
                        resolve(responseData);
                    }
                } catch (error) {
                    // Make sure to clear the interval if there's an error
                    clearInterval(progressInterval);

                    console.log("🚨 CV upload error:", error);
                    if (callbacks.onError) {
                        callbacks.onError({
                            success: false,
                            message: error instanceof Error ? error.message : "Không thể tải lên CV. Vui lòng thử lại sau.",
                            status: "error",
                        });
                    }
                    reject(error);
                }
            } catch (error) {
                console.log("🚨 Upload preparation error:", error);
                if (callbacks.onError) {
                    callbacks.onError({
                        success: false,
                        message: error instanceof Error ? error.message : "Không thể chuẩn bị tải lên CV. Vui lòng thử lại sau.",
                        status: "error",
                    });
                }
                reject(error);
            }
        });
    }
}
export const apiService = new ApiService();

// Export cache services for debugging purposes
export { jobDetailsCache, listsCache };

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
            console.log("Interview API error:", error);
            throw error;
        }
    }

    async deleteInterview(interviewId: string, token: string, uid?: string): Promise<{ success: boolean; message?: string }> {
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

            const result = await response.json();

            // Invalidate interviews cache after successful deletion
            if (result.success) {
                if (uid) {
                    // Clear cache for specific user only
                    listsCache.invalidateUserListsCache(uid, "interviews");
                } else {
                    // Fallback to clearing all interviews cache
                    listsCache.clearTypeCache("interviews");
                }
            }

            return result;
        } catch (error) {
            console.log("Delete interview API error:", error);
            throw error;
        }
    }

    async getInterviewById(interviewId: string, token: string) {
        try {
            console.log(`🔍 Getting interview by ID: ${interviewId}`);
            const response = await fetch(`${this.baseUrl}/interviews?interviewId=${interviewId}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            console.log(`📡 Interview API status: ${response.status} ${response.statusText}`);

            if (!response.ok) {
                const errorData = await response.json();
                console.log(`❌ API error:`, errorData);
                throw new Error(errorData.message || "Failed to get interview");
            }

            const result = await response.json();
            console.log(`✅ API success with result structure:`, Object.keys(result));

            return result;
        } catch (error) {
            console.log("❌ Get interview API error:", error);
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
            console.log("❌ Check existing interview API error:", error);
            return { exists: false };
        }
    }

    async restartInterview(interviewId: string, token: string): Promise<InterviewResponse> {
        try {
            console.log(`🔄 Restarting interview with ID: ${interviewId}`);

            const response = await fetch(`${this.baseUrl}/interviews/restart/${interviewId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to restart interview");
            }

            const result = await response.json();
            console.log(`✅ Interview restarted successfully`);

            return {
                message: result.message,
                result: result.result,
                interviewId: result.interviewId,
            };
        } catch (error) {
            console.log("❌ Restart interview API error:", error);
            throw error;
        }
    }

    parseInterviewResponse(result: string): InterviewMessage {
        if (!result || typeof result !== "string") {
            console.log("❌ Invalid input to parseInterviewResponse:", result);
            return {
                id: Date.now(),
                message: "Không thể phân tích phản hồi do dữ liệu không hợp lệ",
                role: "model",
                pass: null,
                state: true,
            };
        }

        try {
            const raw = result.replace(/```json|```/g, "").trim();
            console.log(`🔍 Attempting to parse JSON: ${raw.substring(0, 100)}...`);
            return JSON.parse(raw);
        } catch (jsonError) {
            console.log("❌ JSON parse error:", jsonError);

            try {
                // Fallback parsing for malformed JSON
                const messageMatch = result.match(/"message"\s*:\s*"([^"]+)"/);
                const passMatch = result.match(/"pass"\s*:\s*(\d+|null)/);
                const stateMatch = result.match(/"state"\s*:\s*(true|false)/);

                console.log(`📝 Regex matches - message: ${!!messageMatch}, pass: ${!!passMatch}, state: ${!!stateMatch}`);

                return {
                    id: Date.now(),
                    message: messageMatch ? messageMatch[1] : "Không thể phân tích phản hồi",
                    role: "model",
                    pass: passMatch ? (passMatch[1] === "null" ? null : parseInt(passMatch[1])) : null,
                    state: stateMatch ? stateMatch[1] === "true" : true,
                };
            } catch (regexError) {
                console.log("❌ Regex fallback error:", regexError);
                return {
                    id: Date.now(),
                    message: "Không thể phân tích phản hồi, vui lòng thử lại",
                    role: "model",
                    pass: null,
                    state: true,
                };
            }
        }
    }

    parseChatHistoryToMessages(chatHistory: any[]): InterviewMessage[] {
        const messages: InterviewMessage[] = [];

        if (!chatHistory || !Array.isArray(chatHistory) || chatHistory.length === 0) {
            console.warn("❌ Empty or invalid chat history");
            return messages;
        }

        console.log(`🔍 Parsing chat history with ${chatHistory.length} entries`);

        try {
            // Skip the first message (system prompt) and process pairs
            const conversationHistory = chatHistory.length > 1 ? chatHistory.slice(1) : chatHistory;

            for (let i = 0; i < conversationHistory.length; i += 2) {
                // AI message (even index in conversation)
                if (conversationHistory[i] && conversationHistory[i].parts && conversationHistory[i].parts[0]?.text) {
                    try {
                        const aiMessage = this.parseInterviewResponse(conversationHistory[i].parts[0].text);
                        aiMessage.id = messages.length + 1;
                        messages.push(aiMessage);
                    } catch (error) {
                        console.log(`❌ Error parsing AI message at index ${i}:`, error);
                    }
                }

                // User message (odd index in conversation)
                if (conversationHistory[i + 1] && conversationHistory[i + 1].parts && conversationHistory[i + 1].parts[0]?.text) {
                    try {
                        const userMessage: InterviewMessage = {
                            id: messages.length + 1,
                            role: "user",
                            message: conversationHistory[i + 1].parts[0].text,
                            state: true,
                        };
                        messages.push(userMessage);
                    } catch (error) {
                        console.log(`❌ Error parsing user message at index ${i + 1}:`, error);
                    }
                }
            }

            console.log(`✅ Successfully parsed ${messages.length} messages from chat history`);
        } catch (error) {
            console.log("❌ Error in parseChatHistoryToMessages:", error);
        }

        return messages;
    }
}

export const interviewService = new InterviewService();
