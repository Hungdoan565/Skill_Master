/**
 * useStudentPerformance Hook
 * Fetches and manages student performance data for a class
 */

import { useState, useCallback } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useStudentPerformance(classId, getHeaders) {
    const [performanceData, setPerformanceData] = useState([]);
    const [performanceSummary, setPerformanceSummary] = useState(null);
    const [loadingPerformance, setLoadingPerformance] = useState(false);
    const [performanceError, setPerformanceError] = useState(null);

    /**
     * Fetch performance data from API
     */
    const fetchPerformance = useCallback(async () => {
        if (!classId) return;

        setLoadingPerformance(true);
        setPerformanceError(null);

        try {
            const response = await axios.get(
                `${API_URL}/api/classes/${classId}/performance`,
                { headers: getHeaders() }
            );

            if (response.data?.success) {
                setPerformanceData(response.data.data || []);
                setPerformanceSummary(response.data.summary || null);
            } else {
                throw new Error(response.data?.message || 'Failed to fetch performance data');
            }
        } catch (error) {
            console.error('Error fetching performance:', error);
            setPerformanceError(error.message || 'Không thể tải dữ liệu performance');
            setPerformanceData([]);
            setPerformanceSummary(null);
        } finally {
            setLoadingPerformance(false);
        }
    }, [classId, getHeaders]);

    /**
     * Get students at risk (low attendance or failing grades)
     */
    const getAtRiskStudents = useCallback(() => {
        return performanceData.filter(s =>
            s.attendanceRate < 60 ||
            (s.averageGrade !== null && s.averageGrade < 5)
        );
    }, [performanceData]);

    /**
     * Get top performers
     */
    const getTopPerformers = useCallback((limit = 5) => {
        return [...performanceData]
            .filter(s => s.averageGrade !== null)
            .sort((a, b) => (b.averageGrade || 0) - (a.averageGrade || 0))
            .slice(0, limit);
    }, [performanceData]);

    /**
     * Get performance distribution
     */
    const getDistribution = useCallback(() => {
        const total = performanceData.length;
        if (total === 0) return [];

        const excellent = performanceData.filter(s => s.averageGrade >= 8).length;
        const good = performanceData.filter(s => s.averageGrade >= 6.5 && s.averageGrade < 8).length;
        const average = performanceData.filter(s => s.averageGrade >= 5 && s.averageGrade < 6.5).length;
        const poor = performanceData.filter(s => s.averageGrade !== null && s.averageGrade < 5).length;
        const noGrade = performanceData.filter(s => s.averageGrade === null).length;

        return [
            { label: 'Xuất sắc (≥8)', count: excellent, percent: Math.round((excellent / total) * 100), color: 'green' },
            { label: 'Khá (6.5-8)', count: good, percent: Math.round((good / total) * 100), color: 'blue' },
            { label: 'TB (5-6.5)', count: average, percent: Math.round((average / total) * 100), color: 'amber' },
            { label: 'Yếu (<5)', count: poor, percent: Math.round((poor / total) * 100), color: 'red' },
            { label: 'Chưa có điểm', count: noGrade, percent: Math.round((noGrade / total) * 100), color: 'slate' }
        ].filter(d => d.count > 0);
    }, [performanceData]);

    return {
        // Data
        performanceData,
        performanceSummary,
        loadingPerformance,
        performanceError,

        // Actions
        fetchPerformance,

        // Computed
        getAtRiskStudents,
        getTopPerformers,
        getDistribution
    };
}

export default useStudentPerformance;
