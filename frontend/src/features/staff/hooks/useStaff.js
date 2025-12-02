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

// Mock data khi API chưa sẵn sàng
const MOCK_STAFF = [
  {
    id: '1',
    full_name: 'Nguyễn Văn A',
    email: 'teacher.a@skillmaster.edu.vn',
    phone: '0901234567',
    avatar_url: null,
    status: 'active',
    created_at: new Date().toISOString(),
    roles: { code: 'TEACHER', name: 'Giáo viên' }
  },
  {
    id: '2',
    full_name: 'Trần Thị B',
    email: 'manager.hcm@skillmaster.edu.vn',
    phone: '0912345678',
    avatar_url: null,
    status: 'active',
    created_at: new Date().toISOString(),
    roles: { code: 'CENTER_MANAGER', name: 'Quản lý Trung tâm' }
  },
];

export function useStaff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch staff list
  const fetchStaff = useCallback(async (roleFilter = '') => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      const params = roleFilter ? `?role=${roleFilter}` : '';
      const response = await axios.get(`${API_URL}/api/admin/staff${params}`, { headers });
      
      if (response.data?.success) {
        setStaff(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      // Use mock data if API fails
      setStaff(MOCK_STAFF);
    } finally {
      setLoading(false);
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
    fetchStaff,
    createStaff,
    filterStaff,
  };
}

export default useStaff;
