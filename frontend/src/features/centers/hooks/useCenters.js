/**
 * useCenters Hook - CRUD operations cho Centers
 */

import { useState, useCallback } from 'react';
import axios from 'axios';
import { supabase } from '@/lib/supabaseClient';
import { API_URL } from '../utils';

// Helper để lấy auth headers
async function getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    return {
        headers: {
            Authorization: `Bearer ${session?.access_token}`
        }
    };
}

export function useCenters() {
    const [centers, setCenters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch all centers (with optional stats)
    const fetchCenters = useCallback(async (params = {}) => {
        try {
            setLoading(true);
            setError(null);

            const config = await getAuthHeaders();
            const queryParams = new URLSearchParams();

            if (params.status) queryParams.append('status', params.status);
            if (params.search) queryParams.append('search', params.search);
            if (params.withStats) queryParams.append('withStats', 'true');

            const url = `${API_URL}/api/admin/centers${queryParams.toString() ? `?${queryParams}` : ''}`;
            const response = await axios.get(url, config);

            if (response.data?.success) {
                const normalizedCenters = (response.data.data || []).map((center) => {
                    const stats = center.stats || {};

                    return {
                        ...center,
                        rooms_count: center.rooms_count ?? stats.roomCount ?? 0,
                        teachers_count: center.teachers_count ?? stats.staffCount ?? 0,
                        students_count: center.students_count ?? stats.studentCount ?? 0,
                    };
                });

                setCenters(normalizedCenters);
            }
        } catch (err) {
            console.error('Error fetching centers:', err);
            setError(err.response?.data?.message || 'Không thể tải danh sách trung tâm');
            setCenters([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Get single center detail
    const getCenter = useCallback(async (centerId) => {
        try {
            const config = await getAuthHeaders();
            const response = await axios.get(`${API_URL}/api/admin/centers/${centerId}`, config);

            if (response.data?.success) {
                return response.data.data;
            }
            throw new Error(response.data?.message || 'Không tìm thấy trung tâm');
        } catch (err) {
            console.error('Error fetching center:', err);
            throw err;
        }
    }, []);

    // Get center statistics
    const getCenterStats = useCallback(async (centerId) => {
        try {
            const config = await getAuthHeaders();
            const response = await axios.get(`${API_URL}/api/admin/centers/${centerId}/stats`, config);

            if (response.data?.success) {
                return response.data.data;
            }
            throw new Error(response.data?.message || 'Không tìm thấy thống kê');
        } catch (err) {
            console.error('Error fetching center stats:', err);
            throw err;
        }
    }, []);

    // Create new center
    const createCenter = useCallback(async (formData) => {
        try {
            const config = await getAuthHeaders();
            const response = await axios.post(`${API_URL}/api/admin/centers`, formData, config);

            if (response.data?.success) {
                // Add to local state
                setCenters(prev => [response.data.data, ...prev]);
                return {
                    success: true,
                    data: response.data.data,
                    message: response.data.message
                };
            }
            throw new Error(response.data?.message || 'Có lỗi xảy ra');
        } catch (err) {
            console.error('Error creating center:', err);
            throw new Error(err.response?.data?.message || 'Không thể tạo trung tâm');
        }
    }, []);

    // Update center
    const updateCenter = useCallback(async (centerId, formData) => {
        try {
            const config = await getAuthHeaders();
            const response = await axios.put(`${API_URL}/api/admin/centers/${centerId}`, formData, config);

            if (response.data?.success) {
                // Update local state
                setCenters(prev => prev.map(c =>
                    c.id === centerId ? { ...c, ...response.data.data } : c
                ));
                return {
                    success: true,
                    data: response.data.data,
                    message: response.data.message
                };
            }
            throw new Error(response.data?.message || 'Có lỗi xảy ra');
        } catch (err) {
            console.error('Error updating center:', err);
            throw new Error(err.response?.data?.message || 'Không thể cập nhật trung tâm');
        }
    }, []);

    // Delete center (soft delete)
    const deleteCenter = useCallback(async (centerId, permanent = false) => {
        try {
            const config = await getAuthHeaders();
            const url = permanent
                ? `${API_URL}/api/admin/centers/${centerId}?permanent=true`
                : `${API_URL}/api/admin/centers/${centerId}`;

            const response = await axios.delete(url, config);

            if (response.data?.success) {
                if (permanent) {
                    // Remove from local state
                    setCenters(prev => prev.filter(c => c.id !== centerId));
                } else {
                    // Update status to inactive
                    setCenters(prev => prev.map(c =>
                        c.id === centerId ? { ...c, status: 'inactive' } : c
                    ));
                }
                return {
                    success: true,
                    message: response.data.message
                };
            }
            throw new Error(response.data?.message || 'Có lỗi xảy ra');
        } catch (err) {
            console.error('Error deleting center:', err);
            throw new Error(err.response?.data?.message || 'Không thể xóa trung tâm');
        }
    }, []);

    // Restore center
    const restoreCenter = useCallback(async (centerId) => {
        try {
            const config = await getAuthHeaders();
            const response = await axios.patch(`${API_URL}/api/admin/centers/${centerId}/restore`, {}, config);

            if (response.data?.success) {
                // Update local state
                setCenters(prev => prev.map(c =>
                    c.id === centerId ? { ...c, status: 'active' } : c
                ));
                return {
                    success: true,
                    data: response.data.data,
                    message: response.data.message
                };
            }
            throw new Error(response.data?.message || 'Có lỗi xảy ra');
        } catch (err) {
            console.error('Error restoring center:', err);
            throw new Error(err.response?.data?.message || 'Không thể khôi phục trung tâm');
        }
    }, []);

    // Assign manager to center
    const assignManager = useCallback(async (centerId, managerId) => {
        try {
            const config = await getAuthHeaders();
            const response = await axios.patch(
                `${API_URL}/api/admin/centers/${centerId}/manager`,
                { manager_id: managerId },
                config
            );

            if (response.data?.success) {
                // Refresh centers to get updated manager info
                await fetchCenters({ withStats: true });
                return {
                    success: true,
                    data: response.data.data,
                    message: response.data.message
                };
            }
            throw new Error(response.data?.message || 'Có lỗi xảy ra');
        } catch (err) {
            console.error('Error assigning manager:', err);
            throw new Error(err.response?.data?.message || 'Không thể gán quản lý');
        }
    }, [fetchCenters]);

    // Filter centers locally
    const filterCenters = useCallback((searchTerm, statusFilter) => {
        return centers.filter(center => {
            const matchSearch = !searchTerm ||
                center.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                center.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                center.address?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchStatus = !statusFilter || center.status === statusFilter;

            return matchSearch && matchStatus;
        });
    }, [centers]);

    return {
        centers,
        loading,
        error,
        fetchCenters,
        getCenter,
        getCenterStats,
        createCenter,
        updateCenter,
        deleteCenter,
        restoreCenter,
        assignManager,
        filterCenters
    };
}

export default useCenters;
