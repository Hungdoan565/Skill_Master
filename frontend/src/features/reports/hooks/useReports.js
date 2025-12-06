/**
 * useReports Hook
 * 
 * Hook quản lý data cho tất cả loại báo cáo
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { API_URL, formatDateParam } from '../utils/constants';

export function useReports() {
    const { session } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // API headers
    const getHeaders = useCallback(() => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
    }), [session]);

    // Generic fetch function
    const fetchReport = useCallback(async (endpoint, params = {}) => {
        if (!session?.access_token) {
            setError('Chưa đăng nhập');
            return null;
        }

        setLoading(true);
        setError(null);

        try {
            const queryParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    queryParams.append(key, value);
                }
            });

            const url = `${API_URL}/api/reports/${endpoint}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            const response = await fetch(url, { headers: getHeaders() });
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Lỗi khi tải báo cáo');
            }

            return data.data;
        } catch (err) {
            console.error(`Error fetching ${endpoint} report:`, err);
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, [session, getHeaders]);

    // Revenue Report
    const fetchRevenueReport = useCallback(async ({ startDate, endDate, centerId, courseId, groupBy }) => {
        return fetchReport('revenue', {
            startDate: formatDateParam(startDate),
            endDate: formatDateParam(endDate),
            centerId,
            courseId,
            groupBy
        });
    }, [fetchReport]);

    // Enrollment Report
    const fetchEnrollmentReport = useCallback(async ({ startDate, endDate, centerId, courseId }) => {
        return fetchReport('enrollment', {
            startDate: formatDateParam(startDate),
            endDate: formatDateParam(endDate),
            centerId,
            courseId
        });
    }, [fetchReport]);

    // Attendance Report
    const fetchAttendanceReport = useCallback(async ({ startDate, endDate, classId, courseId }) => {
        return fetchReport('attendance', {
            startDate: formatDateParam(startDate),
            endDate: formatDateParam(endDate),
            classId,
            courseId
        });
    }, [fetchReport]);

    // Grades Report
    const fetchGradesReport = useCallback(async ({ classId, courseId, centerId }) => {
        return fetchReport('grades', {
            classId,
            courseId,
            centerId
        });
    }, [fetchReport]);

    // Staff Report
    const fetchStaffReport = useCallback(async ({ startDate, endDate, centerId }) => {
        return fetchReport('staff', {
            startDate: formatDateParam(startDate),
            endDate: formatDateParam(endDate),
            centerId
        });
    }, [fetchReport]);

    // Courses Report
    const fetchCoursesReport = useCallback(async ({ centerId }) => {
        return fetchReport('courses', { centerId });
    }, [fetchReport]);

    // Saved Reports
    const fetchSavedReports = useCallback(async () => {
        return fetchReport('saved');
    }, [fetchReport]);

    const saveReport = useCallback(async (reportData) => {
        if (!session?.access_token) return null;

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/reports/saved`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(reportData)
            });
            const data = await response.json();

            if (!data.success) throw new Error(data.message);
            return data.data;
        } catch (err) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, [session, getHeaders]);

    const deleteSavedReport = useCallback(async (id) => {
        if (!session?.access_token) return false;

        try {
            const response = await fetch(`${API_URL}/api/reports/saved/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            const data = await response.json();
            return data.success;
        } catch (err) {
            setError(err.message);
            return false;
        }
    }, [session, getHeaders]);

    return {
        loading,
        error,
        fetchRevenueReport,
        fetchEnrollmentReport,
        fetchAttendanceReport,
        fetchGradesReport,
        fetchStaffReport,
        fetchCoursesReport,
        fetchSavedReports,
        saveReport,
        deleteSavedReport
    };
}

export default useReports;
