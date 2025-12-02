/**
 * useClassesList Hook - Quản lý danh sách lớp học
 */

import { useState, useCallback } from 'react';
import axios from 'axios';
import { supabase } from '@/lib/supabaseClient';
import { API_URL } from '../utils';

// Helper: Lấy auth headers
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Chưa đăng nhập');
  return { Authorization: `Bearer ${session.access_token}` };
};

/**
 * Hook quản lý danh sách lớp học
 */
export function useClassesList() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);

  // Fetch danh sách lớp học
  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      const response = await axios.get(`${API_URL}/api/classes`, { headers });
      
      if (response.data?.success) {
        setClasses(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete single class
  const deleteClass = useCallback(async (classId) => {
    try {
      const headers = await getAuthHeaders();
      await axios.delete(`${API_URL}/api/admin/classes/${classId}`, { headers });
      
      // Update local state
      setClasses(prev => prev.filter(c => c.id !== classId));
      setSelectedIds(prev => prev.filter(id => id !== classId));
      
      return true;
    } catch (error) {
      console.error('Error deleting class:', error);
      throw error;
    }
  }, []);

  // Delete multiple classes
  const deleteMultipleClasses = useCallback(async (ids) => {
    try {
      const headers = await getAuthHeaders();
      await Promise.all(
        ids.map(id => axios.delete(`${API_URL}/api/admin/classes/${id}`, { headers }))
      );
      
      // Update local state
      setClasses(prev => prev.filter(c => !ids.includes(c.id)));
      setSelectedIds([]);
      
      return true;
    } catch (error) {
      console.error('Error bulk deleting classes:', error);
      throw error;
    }
  }, []);

  // Filter classes
  const filterClasses = useCallback((searchTerm, statusFilter) => {
    return classes.filter((cls) => {
      const matchSearch = 
        cls.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.courses?.title?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = !statusFilter || cls.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [classes]);

  // Selection handlers
  const toggleSelectItem = useCallback((id) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(x => x !== id) 
        : [...prev, id]
    );
  }, []);

  const toggleSelectAll = useCallback((filteredClasses) => {
    if (selectedIds.length === filteredClasses.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredClasses.map(c => c.id));
    }
  }, [selectedIds]);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  return {
    classes,
    loading,
    selectedIds,
    fetchClasses,
    deleteClass,
    deleteMultipleClasses,
    filterClasses,
    toggleSelectItem,
    toggleSelectAll,
    clearSelection
  };
}

export default useClassesList;
