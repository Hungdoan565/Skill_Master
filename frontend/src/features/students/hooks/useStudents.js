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

  // Fetch students
  const fetchStudents = useCallback(async (statusFilter = '') => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);

      const response = await axios.get(`${API_URL}/api/admin/students?${params}`, { headers });
      if (response.data?.success) {
        setStudents(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
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

  // Filter students locally
  const filterStudents = useCallback((searchTerm) => {
    if (!searchTerm) return students;
    const term = searchTerm.toLowerCase();
    return students.filter(
      (s) =>
        s.full_name?.toLowerCase().includes(term) ||
        s.email?.toLowerCase().includes(term) ||
        s.phone?.includes(searchTerm)
    );
  }, [students]);

  return {
    students,
    loading,
    fetchStudents,
    fetchStudentDetail,
    updateStudent,
    promoteStudent,
    filterStudents,
  };
}

export default useStudents;
