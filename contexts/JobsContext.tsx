import React, { createContext, useContext, useState, useCallback } from "react";
import { Job } from "@/services/api";

interface JobsContextType {
    // Update a specific job in all job lists
    updateJob: (jobId: string, updates: Partial<Job>) => void;

    // Search jobs state
    searchJobs: Job[];
    setSearchJobs: React.Dispatch<React.SetStateAction<Job[]>>;

    // Recommended jobs state
    recommendedJobs: Job[];
    setRecommendedJobs: React.Dispatch<React.SetStateAction<Job[]>>;

    // Helper method to update bookmark status specifically
    updateJobBookmarkStatus: (jobId: string, isSaved: boolean) => void;
}

const JobsContext = createContext<JobsContextType | undefined>(undefined);

export const JobsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [searchJobs, setSearchJobs] = useState<Job[]>([]);
    const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);

    // Update a specific job by ID in both search and recommended lists
    const updateJob = useCallback((jobId: string, updates: Partial<Job>) => {
        console.log(`🔄 Updating job ${jobId} with:`, updates);

        // Update in search jobs
        setSearchJobs((prevJobs) => prevJobs.map((job) => (job._id === jobId ? { ...job, ...updates } : job)));

        // Update in recommended jobs
        setRecommendedJobs((prevJobs) => prevJobs.map((job) => (job._id === jobId ? { ...job, ...updates } : job)));
    }, []);

    // Convenience method for updating bookmark status
    const updateJobBookmarkStatus = useCallback(
        (jobId: string, isSaved: boolean) => {
            updateJob(jobId, { isSaved });
            console.log(`✅ Updated bookmark status for job ${jobId}: ${isSaved ? "Saved" : "Unsaved"}`);
        },
        [updateJob]
    );

    const value: JobsContextType = {
        updateJob,
        searchJobs,
        setSearchJobs,
        recommendedJobs,
        setRecommendedJobs,
        updateJobBookmarkStatus,
    };

    return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>;
};

export const useJobs = (): JobsContextType => {
    const context = useContext(JobsContext);
    if (!context) {
        throw new Error("useJobs must be used within a JobsProvider");
    }
    return context;
};
