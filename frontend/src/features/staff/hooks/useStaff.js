/**
 * useStaff Hook - Quản lý danh sách nhân viên
 */

import { useState, useCallback } from 'react';
import axios from 'axios';
import { supabase } from '@/lib/supabaseClient';
import { API_URL } from '../utils';

/**
 * Get auth headers from Supabase session
 */
const getAuthHeaders = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Chưa đăng nhập');
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
  };
};

export function useStaff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [centers, setCenters] = useState([]);

  // Fetch staff list (with server-side search support)
  const fetchStaff = useCallback(async (roleFilter = '', search = '') => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      const params = new URLSearchParams();
      if (roleFilter) params.append('role', roleFilter);
      if (search && search.trim().length >= 2) params.append('search', search);

      const queryStr = params.toString();
      const response = await axios.get(
        `${API_URL}/api/admin/staff${queryStr ? `?${queryStr}` : ''}`,
        { headers }
      );

      if (response.data?.success) {
        setStaff(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch centers list (for dropdown)
  const fetchCenters = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(`${API_URL}/api/admin/centers`, { headers });

      if (response.data?.success) {
        setCenters(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching centers:', error);
    }
  }, []);

  // Create new staff member
  const createStaff = useCallback(async (formData) => {
    const headers = await getAuthHeaders();
    const response = await axios.post(`${API_URL}/api/admin/users`, formData, { headers });

    if (response.data?.success) {
      return {
        success: true,
        data: response.data.data,
        defaultPassword: response.data.data?.default_password || 'SkillMaster@123',
      };
    }

    throw new Error(response.data?.message || 'Có lỗi xảy ra');
  }, []);

  // Get staff detail
  const getStaffDetail = useCallback(async (staffId) => {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${API_URL}/api/admin/staff/${staffId}`, { headers });

    if (response.data?.success) {
      return response.data.data;
    }

    throw new Error(response.data?.message || 'Không tìm thấy nhân viên');
  }, []);

  // Update staff member
  const updateStaff = useCallback(async (staffId, formData) => {
    const headers = await getAuthHeaders();
    const response = await axios.put(`${API_URL}/api/admin/staff/${staffId}`, formData, { headers });

    if (response.data?.success) {
      // Update local state
      setStaff(prev => prev.map(s =>
        s.id === staffId ? { ...s, ...response.data.data } : s
      ));
      return { success: true, data: response.data.data };
    }

    throw new Error(response.data?.message || 'Có lỗi xảy ra');
  }, []);

  // Delete staff member
  const deleteStaff = useCallback(async (staffId, permanent = false) => {
    const headers = await getAuthHeaders();
    const url = permanent
      ? `${API_URL}/api/admin/staff/${staffId}?permanent=true`
      : `${API_URL}/api/admin/staff/${staffId}`;

    const response = await axios.delete(url, { headers });

    if (response.data?.success) {
      if (permanent) {
        // Remove from local state
        setStaff(prev => prev.filter(s => s.id !== staffId));
      } else {
        // Update status in local state
        setStaff(prev => prev.map(s =>
          s.id === staffId ? { ...s, status: 'inactive' } : s
        ));
      }
      return { success: true, message: response.data.message };
    }

    throw new Error(response.data?.message || 'Có lỗi xảy ra');
  }, []);

  // Restore staff member
  const restoreStaff = useCallback(async (staffId) => {
    const headers = await getAuthHeaders();
    const response = await axios.patch(`${API_URL}/api/admin/staff/${staffId}/restore`, {}, { headers });

    if (response.data?.success) {
      // Update local state
      setStaff(prev => prev.map(s =>
        s.id === staffId ? { ...s, status: 'active' } : s
      ));
      return { success: true, message: response.data.message };
    }

    throw new Error(response.data?.message || 'Có lỗi xảy ra');
  }, []);

  // Filter staff locally by search term
  const filterStaff = useCallback((searchTerm) => {
    if (!searchTerm) return staff;
    const term = searchTerm.toLowerCase();
    return staff.filter(
      (member) =>
        member.full_name?.toLowerCase().includes(term) ||
        member.email?.toLowerCase().includes(term)
    );
  }, [staff]);

  return {
    staff,
    loading,
    centers,
    fetchStaff,
    fetchCenters,
    createStaff,
    getStaffDetail,
    updateStaff,
    deleteStaff,
    restoreStaff,
    filterStaff,
  };
}

export default useStaff;
