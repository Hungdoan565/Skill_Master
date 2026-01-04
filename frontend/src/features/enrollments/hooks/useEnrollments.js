/**
 * useEnrollments Hook - Quản lý ghi danh
 */

import { useState, useCallback } from 'react';
import axios from 'axios';
import { supabase } from '@/lib/supabaseClient';
import { API_URL } from '../utils';

/**
 * Get auth headers from Supabase session
 */
const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
        throw new Error('Chưa đăng nhập');
    }
    return { Authorization: `Bearer ${session.access_token}` };
};

export function useEnrollments() {
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0
    });

    // Fetch all enrollments (with server-side search support)
    const fetchEnrollments = useCallback(async (filters = {}) => {
        try {
            setLoading(true);
            const headers = await getAuthHeaders();
            const params = new URLSearchParams();

            if (filters.status) params.append('status', filters.status);
            if (filters.classId) params.append('class_id', filters.classId);
            if (filters.studentId) params.append('student_id', filters.studentId);
            if (filters.centerId) params.append('center_id', filters.centerId);
            if (filters.search && filters.search.trim().length >= 2) {
                params.append('search', filters.search.trim());
            }
            if (filters.page) params.append('page', filters.page);
            if (filters.limit) params.append('limit', filters.limit);

            const response = await axios.get(
                `${API_URL}/api/admin/enrollments?${params}`,
                { headers }
            );

            if (response.data?.success) {
                setEnrollments(response.data.data || []);
                if (response.data.pagination) {
                    setPagination(response.data.pagination);
                }
                return response.data.data;
            }
            return [];
        } catch (error) {
            console.error('Error fetching enrollments:', error);
            setEnrollments([]);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch students for selection (with server-side search support)
    const fetchStudents = useCallback(async (centerId = null, search = '') => {
        try {
            const headers = await getAuthHeaders();
            let url, params;

            // Use search endpoint when query provided
            if (search && search.trim().length >= 2) {
                url = `${API_URL}/api/students/search`;
                params = new URLSearchParams({ q: search, limit: 20 });
            } else {
                // Default: load recent students
                url = `${API_URL}/api/admin/students`;
                params = new URLSearchParams({ limit: 20 });
                if (centerId) params.append('center_id', centerId);
            }

            const response = await axios.get(`${url}?${params}`, { headers });

            if (response.data?.success) {
                setStudents(response.data.data || []);
                return response.data.data;
            }
            return [];
        } catch (error) {
            console.error('Error fetching students:', error);
            return [];
        }
    }, []);

    // Fetch classes for selection
    const fetchClasses = useCallback(async (centerId = null) => {
        try {
            const headers = await getAuthHeaders();
            const params = new URLSearchParams();
            if (centerId) params.append('centerId', centerId);
            params.append('status', 'active'); // Only active classes

            const response = await axios.get(
                `${API_URL}/api/classes?${params}`,
                { headers }
            );

            if (response.data?.success) {
                setClasses(response.data.data || []);
                return response.data.data;
            }
            return [];
        } catch (error) {
            console.error('Error fetching classes:', error);
            return [];
        }
    }, []);

    // Create enrollment
    const createEnrollment = useCallback(async (data) => {
        const headers = await getAuthHeaders();
        const response = await axios.post(
            `${API_URL}/api/admin/enrollments`,
            data,
            { headers }
        );

        if (response.data?.success) {
            return response.data.data;
        }
        throw new Error(response.data?.message || 'Có lỗi xảy ra khi ghi danh');
    }, []);

    // Create bulk enrollment (multiple students to one class)
    const createBulkEnrollment = useCallback(async (classId, studentIds, options = {}) => {
        const headers = await getAuthHeaders();
        const response = await axios.post(
            `${API_URL}/api/admin/enrollments/bulk`,
            {
                class_id: classId,
                student_ids: studentIds,
                ...options,
            },
            { headers }
        );

        if (response.data?.success) {
            return response.data.data;
        }
        throw new Error(response.data?.message || 'Có lỗi xảy ra khi ghi danh hàng loạt');
    }, []);

    // Update enrollment status
    const updateEnrollmentStatus = useCallback(async (enrollmentId, status, note = '') => {
        const headers = await getAuthHeaders();
        const response = await axios.patch(
            `${API_URL}/api/admin/enrollments/${enrollmentId}/status`,
            { status, note },
            { headers }
        );

        if (response.data?.success) {
            setEnrollments(prev => prev.map(e =>
                e.id === enrollmentId ? { ...e, status } : e
            ));
            return response.data.data;
        }
        throw new Error(response.data?.message || 'Có lỗi xảy ra');
    }, []);

    // Delete enrollment
    const deleteEnrollment = useCallback(async (enrollmentId) => {
        const headers = await getAuthHeaders();
        const response = await axios.delete(
            `${API_URL}/api/admin/enrollments/${enrollmentId}`,
            { headers }
        );

        if (response.data?.success) {
            setEnrollments(prev => prev.filter(e => e.id !== enrollmentId));
            return true;
        }
        throw new Error(response.data?.message || 'Có lỗi xảy ra khi xóa');
    }, []);

    // Delete multiple enrollments
    const deleteMultipleEnrollments = useCallback(async (ids) => {
        const headers = await getAuthHeaders();
        const response = await axios.post(
            `${API_URL}/api/admin/enrollments/bulk-delete`,
            { ids },
            { headers }
        );

        if (response.data?.success) {
            setEnrollments(prev => prev.filter(e => !ids.includes(e.id)));
            return response.data.message;
        }
        throw new Error(response.data?.message || 'Có lỗi xảy ra khi xóa nhiều ghi danh');
    }, []);

    // ============================================
    // TRIAL ENROLLMENT METHODS
    // ============================================

    // Fetch trial enrollments
    const fetchTrialEnrollments = useCallback(async (filters = {}) => {
        try {
            setLoading(true);
            const headers = await getAuthHeaders();
            const params = new URLSearchParams();

            if (filters.centerId) params.append('centerId', filters.centerId);
            if (filters.classId) params.append('classId', filters.classId);
            if (filters.status) params.append('status', filters.status);
            if (filters.page) params.append('page', filters.page);
            if (filters.limit) params.append('limit', filters.limit);

            const response = await axios.get(
                `${API_URL}/api/admin/enrollments/trials?${params}`,
                { headers }
            );

            if (response.data?.success) {
                return {
                    data: response.data.data || [],
                    pagination: response.data.pagination
                };
            }
            return { data: [], pagination: null };
        } catch (error) {
            console.error('Error fetching trial enrollments:', error);
            return { data: [], pagination: null };
        } finally {
            setLoading(false);
        }
    }, []);

    // Create trial enrollment
    const createTrialEnrollment = useCallback(async (data) => {
        const headers = await getAuthHeaders();
        const response = await axios.post(
            `${API_URL}/api/admin/enrollments/trial`,
            data,
            { headers }
        );

        if (response.data?.success) {
            return response.data;
        }
        throw new Error(response.data?.message || 'Có lỗi xảy ra khi đăng ký học thử');
    }, []);

    // Convert trial to regular enrollment
    const convertTrialEnrollment = useCallback(async (enrollmentId, data) => {
        const headers = await getAuthHeaders();
        const response = await axios.put(
            `${API_URL}/api/admin/enrollments/${enrollmentId}/convert-trial`,
            data,
            { headers }
        );

        if (response.data?.success) {
            return response.data;
        }
        throw new Error(response.data?.message || 'Có lỗi xảy ra khi chuyển đổi học thử');
    }, []);

    // Get trial statistics
    const getTrialStatistics = useCallback(async (filters = {}) => {
        try {
            const headers = await getAuthHeaders();
            const params = new URLSearchParams();
            if (filters.centerId) params.append('centerId', filters.centerId);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);

            const response = await axios.get(
                `${API_URL}/api/admin/trial-statistics?${params}`,
                { headers }
            );

            if (response.data?.success) {
                return response.data.data;
            }
            return null;
        } catch (error) {
            console.error('Error fetching trial statistics:', error);
            return null;
        }
    }, []);

    // ============================================
    // WAITING LIST METHODS
    // ============================================

    // Fetch waiting list
    const fetchWaitingList = useCallback(async (filters = {}) => {
        try {
            setLoading(true);
            const headers = await getAuthHeaders();
            const params = new URLSearchParams();

            if (filters.centerId) params.append('centerId', filters.centerId);
            if (filters.classId) params.append('classId', filters.classId);
            if (filters.status) params.append('status', filters.status);
            if (filters.page) params.append('page', filters.page);
            if (filters.limit) params.append('limit', filters.limit);

            const response = await axios.get(
                `${API_URL}/api/admin/waiting-list?${params}`,
                { headers }
            );

            if (response.data?.success) {
                return {
                    data: response.data.data || [],
                    pagination: response.data.pagination
                };
            }
            return { data: [], pagination: null };
        } catch (error) {
            console.error('Error fetching waiting list:', error);
            return { data: [], pagination: null };
        } finally {
            setLoading(false);
        }
    }, []);

    // Add to waiting list
    const addToWaitingList = useCallback(async (data) => {
        const headers = await getAuthHeaders();
        const response = await axios.post(
            `${API_URL}/api/admin/waiting-list`,
            data,
            { headers }
        );

        if (response.data?.success) {
            return response.data;
        }
        throw new Error(response.data?.message || 'Có lỗi xảy ra khi thêm vào danh sách chờ');
    }, []);

    // Notify next in waiting list queue
    const notifyWaitingList = useCallback(async (classId, slots = 1) => {
        const headers = await getAuthHeaders();
        const response = await axios.put(
            `${API_URL}/api/admin/waiting-list/${classId}/notify`,
            { slots },
            { headers }
        );

        if (response.data?.success) {
            return response.data;
        }
        throw new Error(response.data?.message || 'Có lỗi xảy ra khi thông báo');
    }, []);

    // Complete waiting list entry (enrolled or cancelled)
    const completeWaitingListEntry = useCallback(async (entryId, status, reason = null) => {
        const headers = await getAuthHeaders();
        const response = await axios.put(
            `${API_URL}/api/admin/waiting-list/${entryId}/complete`,
            { status, reason },
            { headers }
        );

        if (response.data?.success) {
            return response.data;
        }
        throw new Error(response.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái');
    }, []);

    // Get waiting list statistics
    const getWaitingListStatistics = useCallback(async (filters = {}) => {
        try {
            const headers = await getAuthHeaders();
            const params = new URLSearchParams();
            if (filters.centerId) params.append('centerId', filters.centerId);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);

            const response = await axios.get(
                `${API_URL}/api/admin/waiting-list/statistics?${params}`,
                { headers }
            );

            if (response.data?.success) {
                return response.data.data;
            }
            return null;
        } catch (error) {
            console.error('Error fetching waiting list statistics:', error);
            return null;
        }
    }, []);

    // Filter enrollments locally
    const filterEnrollments = useCallback((searchTerm) => {
        if (!searchTerm) return enrollments;
        const term = searchTerm.toLowerCase();
        return enrollments.filter(
            (e) =>
                e.student?.full_name?.toLowerCase().includes(term) ||
                e.student?.email?.toLowerCase().includes(term) ||
                e.class?.name?.toLowerCase().includes(term)
        );
    }, [enrollments]);

    return {
        enrollments,
        students,
        classes,
        loading,
        pagination,
        // Core methods
        fetchEnrollments,
        fetchStudents,
        fetchClasses,
        createEnrollment,
        createBulkEnrollment,
        updateEnrollmentStatus,
        deleteEnrollment,
        filterEnrollments,
        // Trial methods
        fetchTrialEnrollments,
        createTrialEnrollment,
        convertTrialEnrollment,
        getTrialStatistics,
        // Waiting list methods
        fetchWaitingList,
        addToWaitingList,
        notifyWaitingList,
        completeWaitingListEntry,
        getWaitingListStatistics,
    };
}

export default useEnrollments;
