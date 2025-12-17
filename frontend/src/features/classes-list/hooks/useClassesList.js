/**
 * useClassesList Hook - Quản lý danh sách lớp học
 * UPGRADED:
 * - Advanced filtering support
 * - CACHE with stale-while-revalidate pattern for instant loading
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import { supabase } from '@/lib/supabaseClient';
import { API_URL } from '../utils';
import { cache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';

// Helper: Lấy auth headers
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Chưa đăng nhập');
  return { Authorization: `Bearer ${session.access_token}` };
};

/**
 * Hook quản lý danh sách lớp học
 * Enhanced with caching and advanced filtering capabilities
 */
export function useClassesList() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const isMounted = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // Build cache key from filters
  const buildCacheKey = useCallback((serverFilters = {}) => {
    const filterString = JSON.stringify(serverFilters);
    return CACHE_KEYS.classes(filterString);
  }, []);

  // Fetch danh sách lớp học với optional server-side filters
  const fetchClasses = useCallback(async (serverFilters = {}, options = {}) => {
    const { skipCache = false, showRefreshing = false } = options;

    // Pagination + projection controls (client defaults)
    const page = Number(serverFilters.page || 1);
    const pageSize = Math.min(Number(serverFilters.pageSize || 20), 100);
    const effectiveFilters = { ...serverFilters, page, pageSize, minimal: true };

    const cacheKey = buildCacheKey(effectiveFilters);

    try {
      // ====== STALE-WHILE-REVALIDATE PATTERN ======
      if (!skipCache) {
        const { data: cachedData, isStale, isMiss } = cache.getWithStale(cacheKey);

        if (!isMiss && cachedData) {
          // Show cached data immediately
          setClasses(cachedData);
          setLoading(false);

          // If not stale, we're done
          if (!isStale) {
            return;
          }
          // If stale, continue to fetch fresh data in background
          setRefreshing(true);
        } else {
          setLoading(true);
        }
      } else {
        if (showRefreshing) setRefreshing(true);
        else setLoading(true);
      }

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

      // Pagination + minimal projection
      params.append('limit', pageSize);
      params.append('offset', (page - 1) * pageSize);
      params.append('minimal', 'true');

      const queryString = params.toString();
      const url = queryString
        ? `${API_URL}/api/classes?${queryString}`
        : `${API_URL}/api/classes`;

      const response = await axios.get(url, { headers });

      if (!isMounted.current) return;

      if (response.data?.success) {
        const newData = response.data.data;
        setClasses(newData);

        // ====== SAVE TO CACHE ======
        cache.set(cacheKey, newData, CACHE_TTL.SHORT);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [buildCacheKey]);

  // Force refresh (skip cache)
  const refreshClasses = useCallback((serverFilters = {}) => {
    return fetchClasses(serverFilters, { skipCache: true, showRefreshing: true });
  }, [fetchClasses]);

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
    refreshing,
    selectedIds,
    fetchClasses,
    refreshClasses,
    deleteClass,
    deleteMultipleClasses,
    filterClasses,
    toggleSelectItem,
    toggleSelectAll,
    clearSelection
  };
}

export default useClassesList;
