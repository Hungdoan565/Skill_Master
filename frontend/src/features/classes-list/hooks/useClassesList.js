/**
 * useClassesList Hook - Quản lý danh sách lớp học
 * Enhanced with advanced filtering support
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
 * Enhanced with advanced filtering capabilities
 */
export function useClassesList() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);

  // Fetch danh sách lớp học với optional server-side filters
  const fetchClasses = useCallback(async (serverFilters = {}) => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();

      // Build query params for server-side filtering
      const params = new URLSearchParams();
      if (serverFilters.status) params.append('status', serverFilters.status);
      if (serverFilters.courseId) params.append('course_id', serverFilters.courseId);
      if (serverFilters.teacherId) params.append('teacher_id', serverFilters.teacherId);
      if (serverFilters.centerId) params.append('centerId', serverFilters.centerId);
      // Date range filters (server-side for better performance)
      if (serverFilters.dateStart) params.append('date_start', serverFilters.dateStart);
      if (serverFilters.dateEnd) params.append('date_end', serverFilters.dateEnd);

      const queryString = params.toString();
      const url = queryString
        ? `${API_URL}/api/classes?${queryString}`
        : `${API_URL}/api/classes`;

      const response = await axios.get(url, { headers });

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

  // Filter classes - Enhanced with advanced filters
  const filterClasses = useCallback((filters = {}) => {
    const {
      search = '',
      status = '',
      courseId = '',
      teacherId = '',
      centerId = '',
      dateStart = '',
      dateEnd = '',
      capacity = 'all'
    } = filters;

    return classes.filter((cls) => {
      // Search filter (name, code, course title)
      const matchSearch = !search ||
        cls.name?.toLowerCase().includes(search.toLowerCase()) ||
        cls.code?.toLowerCase().includes(search.toLowerCase()) ||
        cls.courses?.title?.toLowerCase().includes(search.toLowerCase());

      // Status filter
      const matchStatus = !status || cls.status === status;

      // Course filter
      const matchCourse = !courseId || cls.courses?.id === courseId;

      // Teacher filter
      const matchTeacher = !teacherId || cls.users?.id === teacherId || cls.teacher?.id === teacherId;

      // Center filter
      const matchCenter = !centerId || cls.center_id === centerId;

      // Date range filter (based on start_date)
      let matchDateRange = true;
      if (dateStart) {
        matchDateRange = matchDateRange && cls.start_date >= dateStart;
      }
      if (dateEnd) {
        matchDateRange = matchDateRange && cls.start_date <= dateEnd;
      }

      // Capacity filter
      let matchCapacity = true;
      if (capacity && capacity !== 'all') {
        const enrolled = cls.enrolled_count || 0;
        const max = cls.max_students || 0;
        const fillRate = max > 0 ? (enrolled / max) * 100 : 0;

        switch (capacity) {
          case 'available':
            matchCapacity = enrolled < max;
            break;
          case 'full':
            matchCapacity = enrolled >= max;
            break;
          case 'nearly_full':
            matchCapacity = fillRate >= 80 && fillRate < 100;
            break;
          case 'low':
            matchCapacity = fillRate < 30;
            break;
          default:
            matchCapacity = true;
        }
      }

      return matchSearch && matchStatus && matchCourse && matchTeacher &&
        matchCenter && matchDateRange && matchCapacity;
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
