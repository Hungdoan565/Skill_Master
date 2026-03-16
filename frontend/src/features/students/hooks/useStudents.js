/**
 * useStudents Hook - Quản lý danh sách học viên
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

export function useStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  const [error, setError] = useState(null);

  const fetchStudents = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const headers = await getAuthHeaders();
      const params = new URLSearchParams();

      if (typeof filters === 'string') {
        if (filters) params.append('status', filters);
      } else {
        const {
          status,
          search,
          centerId,
          classId,
          courseId,
          enrollmentState,
          page = 1,
          limit = 20,
        } = filters;

        if (status && status !== 'all') params.append('status', status);
        if (search && search.trim().length >= 2) params.append('search', search.trim());
        if (centerId && centerId !== 'all') params.append('centerId', centerId);
        if (classId && classId !== 'all') params.append('classId', classId);
        if (courseId && courseId !== 'all') params.append('courseId', courseId);
        if (enrollmentState && enrollmentState !== 'all') params.append('enrollmentState', enrollmentState);
        params.append('page', String(page));
        params.append('limit', String(limit));
      }

      const response = await axios.get(`${API_URL}/api/admin/students?${params}`, { headers });
      if (response.data?.success) {
        setStudents(response.data.data || []);
        setPagination(response.data.pagination || {
          total: response.data.data?.length || 0,
          page: 1,
          limit: Array.isArray(response.data.data) ? response.data.data.length : 20,
          totalPages: 1,
        });
        return response.data;
      }
      throw new Error(response.data?.message || 'Không thể tải danh sách học viên');
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
      setPagination({ total: 0, page: 1, limit: 20, totalPages: 0 });
      setError(error.response?.data?.message || error.message || 'Không thể tải danh sách học viên');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch student detail với enrollments, invoices, attendance
  const fetchStudentDetail = useCallback(async (studentId) => {
    const headers = await getAuthHeaders();
    const response = await axios.get(
      `${API_URL}/api/admin/students/${studentId}`,
      { headers }
    );

    if (response.data?.success) {
      return response.data.data;
    }

    throw new Error(response.data?.message || 'Không thể tải thông tin học viên');
  }, []);

  // Update student info
  const updateStudent = useCallback(async (studentId, data) => {
    const headers = await getAuthHeaders();
    const response = await axios.put(
      `${API_URL}/api/admin/students/${studentId}`,
      data,
      { headers }
    );

    if (response.data?.success) {
      // Update local state
      setStudents(prev => prev.map(s =>
        s.id === studentId
          ? { ...s, ...response.data.data }
          : s
      ));
      return response.data.data;
    }

    throw new Error(response.data?.message || 'Có lỗi xảy ra khi cập nhật');
  }, []);

  // Promote student to staff
  const promoteStudent = useCallback(async (studentId, roleCode) => {
    const headers = await getAuthHeaders();
    const response = await axios.patch(
      `${API_URL}/api/admin/users/${studentId}/role`,
      { role_code: roleCode },
      { headers }
    );

    if (response.data?.success) {
      // Remove from students list
      setStudents(prev => prev.filter(s => s.id !== studentId));
      return true;
    }

    throw new Error(response.data?.message || 'Có lỗi xảy ra');
  }, []);

  // Transfer student to another center
  const transferStudent = useCallback(async (studentId, data) => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.put(
        `${API_URL}/api/admin/students/${studentId}/transfer`,
        data,
        { headers }
      );

      if (response.data?.success) {
        return response.data.data;
      }

      throw new Error(response.data?.message || 'Có lỗi xảy ra khi chuyển chi nhánh');
    } catch (error) {
      // Extract error message from backend response
      const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi chuyển chi nhánh';
      console.error('Transfer error details:', error.response?.data);
      throw new Error(errorMessage);
    }
  }, []);

  // Fetch transfer history
  const fetchTransferHistory = useCallback(async (studentId) => {
    const headers = await getAuthHeaders();
    const response = await axios.get(
      `${API_URL}/api/admin/students/${studentId}/transfer-history`,
      { headers }
    );

    if (response.data?.success) {
      return response.data.data;
    }

    throw new Error(response.data?.message || 'Không thể tải lịch sử chuyển');
  }, []);

  const bulkUpdateStudentsStatus = useCallback(async (studentIds, status) => {
    const headers = await getAuthHeaders();
    const response = await axios.patch(
      `${API_URL}/api/admin/students/bulk/status`,
      { studentIds, status },
      { headers }
    );

    if (response.data?.success) {
      return response.data;
    }

    throw new Error(response.data?.message || 'Không thể cập nhật hàng loạt');
  }, []);

  const checkBulkDeleteEligibility = useCallback(async (studentIds) => {
    const headers = await getAuthHeaders();
    const response = await axios.post(
      `${API_URL}/api/admin/students/bulk-delete-check`,
      { studentIds },
      { headers }
    );

    if (response.data?.success) {
      return response.data.data;
    }

    throw new Error(response.data?.message || 'Không thể kiểm tra điều kiện xóa');
  }, []);

  const bulkDeleteStudents = useCallback(async (studentIds) => {
    const headers = await getAuthHeaders();
    const response = await axios.delete(`${API_URL}/api/admin/students/bulk`, {
      headers,
      data: { studentIds },
    });

    if (response.data?.success) {
      return response.data;
    }

    throw new Error(response.data?.message || 'Không thể xóa hàng loạt');
  }, []);

  // Lock user account (SUPER_ADMIN only)
  const lockUser = useCallback(async (userId) => {
    const headers = await getAuthHeaders();
    const response = await axios.patch(`${API_URL}/api/admin/users/${userId}/lock`, {}, { headers });
    if (response.data?.success) {
      setStudents(prev => prev.map(s => s.id === userId ? { ...s, status: 'suspended' } : s));
      return { success: true };
    }
    throw new Error(response.data?.message || 'Không thể khóa tài khoản');
  }, []);

  // Unlock user account (SUPER_ADMIN only)
  const unlockUser = useCallback(async (userId) => {
    const headers = await getAuthHeaders();
    const response = await axios.patch(`${API_URL}/api/admin/users/${userId}/unlock`, {}, { headers });
    if (response.data?.success) {
      setStudents(prev => prev.map(s => s.id === userId ? { ...s, status: 'active' } : s));
      return { success: true };
    }
    throw new Error(response.data?.message || 'Không thể mở khóa tài khoản');
  }, []);

  // Reset user password (SUPER_ADMIN only)
  const resetUserPassword = useCallback(async (userId) => {
    const headers = await getAuthHeaders();
    const response = await axios.post(`${API_URL}/api/admin/users/${userId}/reset-password`, {}, { headers });
    if (response.data?.success) {
      return { success: true };
    }
    throw new Error(response.data?.message || 'Không thể gửi link đặt lại mật khẩu');
  }, []);

  return {
    students,
    loading,
    error,
    pagination,
    fetchStudents,
    fetchStudentDetail,
    updateStudent,
    promoteStudent,
    transferStudent,
    fetchTransferHistory,
    bulkUpdateStudentsStatus,
    checkBulkDeleteEligibility,
    bulkDeleteStudents,
    lockUser,
    unlockUser,
    resetUserPassword,
  };
}

export default useStudents;
