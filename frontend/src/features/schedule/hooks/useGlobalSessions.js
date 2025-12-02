/**
 * useGlobalSessions Hook - Lấy danh sách sessions toàn trung tâm
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Helper: Format date to YYYY-MM-DD
const formatDate = (date) => {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

// Helper: Get today
const getToday = () => formatDate(new Date());

// Helper: Get week range (Mon-Sun)
const getWeekRange = () => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ...
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: formatDate(monday),
    end: formatDate(sunday)
  };
};

// Helper: Auth headers
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Chưa đăng nhập');
  return { Authorization: `Bearer ${session.access_token}` };
};

export function useGlobalSessions(initialFilters = {}) {
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    scheduled: 0,
    completed: 0,
    cancelled: 0,
    overdue: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Default filter = Tuần này (thay vì 1 năm để tránh query chậm)
  const weekRange = getWeekRange();
  const [filters, setFilters] = useState({
    startDate: initialFilters.startDate || weekRange.start,
    endDate: initialFilters.endDate || weekRange.end,
    status: initialFilters.status || '',
    teacherId: initialFilters.teacherId || '',
    centerId: initialFilters.centerId || '',
    ...initialFilters
  });

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      
      // Build query params
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.status) params.append('status', filters.status);
      if (filters.teacherId) params.append('teacherId', filters.teacherId);
      if (filters.centerId) params.append('centerId', filters.centerId);

      const res = await fetch(`${API_URL}/api/admin/sessions?${params}`, { headers });
      const json = await res.json();

      if (!res.ok) throw new Error(json.message || 'Lỗi khi tải dữ liệu');

      setSessions(json.data || []);
      setStats(json.stats || {});
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Quick filter presets
  const setToday = useCallback(() => {
    const today = getToday();
    updateFilters({ startDate: today, endDate: today });
  }, [updateFilters]);

  const setThisWeek = useCallback(() => {
    const today = new Date();
    const firstDay = new Date(today.setDate(today.getDate() - today.getDay() + 1));
    const lastDay = new Date(today.setDate(today.getDate() - today.getDay() + 7));
    updateFilters({ 
      startDate: formatDate(firstDay), 
      endDate: formatDate(lastDay) 
    });
  }, [updateFilters]);

  const setThisMonth = useCallback(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    updateFilters({ 
      startDate: formatDate(firstDay), 
      endDate: formatDate(lastDay) 
    });
  }, [updateFilters]);

  // Mark session as completed (quick action)
  const markCompleted = useCallback(async (sessionId) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/api/admin/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });

      if (!res.ok) throw new Error('Không thể cập nhật');

      // Refresh data
      fetchSessions();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [fetchSessions]);

  // Cancel session
  const cancelSession = useCallback(async (sessionId, reason) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/api/admin/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled', notes: reason })
      });

      if (!res.ok) throw new Error('Không thể hủy buổi học');

      fetchSessions();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [fetchSessions]);

  return {
    sessions,
    stats,
    loading,
    error,
    filters,
    updateFilters,
    refetch: fetchSessions,
    // Quick filters
    setToday,
    setThisWeek,
    setThisMonth,
    // Actions
    markCompleted,
    cancelSession
  };
}

export default useGlobalSessions;
