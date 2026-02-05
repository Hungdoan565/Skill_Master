/**
 * useGlobalSessions Hook - Lấy danh sách sessions toàn trung tâm
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/auth-context';

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
  const { profile } = useAuth();
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

  // Kiểm tra quyền: SUPER_ADMIN có thể xem tất cả centers
  const isSuperAdmin = profile?.roles?.code === 'SUPER_ADMIN';
  const userCenterId = profile?.center_id;

  // Default filter = Tuần này (thay vì 1 năm để tránh query chậm)
  const weekRange = getWeekRange();
  const [filters, setFilters] = useState({
    startDate: initialFilters.startDate || weekRange.start,
    endDate: initialFilters.endDate || weekRange.end,
    status: initialFilters.status || '',
    teacherId: initialFilters.teacherId || '',
    centerId: initialFilters.centerId || '',
    roomId: initialFilters.roomId || '',
    ...initialFilters
  });
  
  // Track active preset for UI feedback (today, week, month, or null for custom)
  const [activePreset, setActivePreset] = useState('week');

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

      // Auto-inject centerId cho non-SUPER_ADMIN users
      // Backend cũng validate nhưng inject ở frontend giúp UX tốt hơn
      const effectiveCenterId = isSuperAdmin ? filters.centerId : userCenterId;
      if (effectiveCenterId) params.append('centerId', effectiveCenterId);

      if (filters.roomId) params.append('roomId', filters.roomId);

      // Pagination (server defaults to 200 if not provided). Keep small window for UI.
      params.append('limit', '200');
      params.append('offset', '0');

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
  }, [filters, isSuperAdmin, userCenterId]);

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    
    // Clear activePreset if user manually changes dates (not from preset)
    if (newFilters.startDate !== undefined || newFilters.endDate !== undefined) {
      // Check if the new dates match any preset
      const today = formatDate(new Date());
      const week = getWeekRange();
      const now = new Date();
      const monthStart = formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
      const monthEnd = formatDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
      
      const newStart = newFilters.startDate !== undefined ? newFilters.startDate : filters.startDate;
      const newEnd = newFilters.endDate !== undefined ? newFilters.endDate : filters.endDate;
      
      // Only clear if it doesn't match any preset
      if (!(newStart === today && newEnd === today) && 
          !(newStart === week.start && newEnd === week.end) &&
          !(newStart === monthStart && newEnd === monthEnd)) {
        setActivePreset(null);
      }
    }
  }, [filters.startDate, filters.endDate]);

  // Quick filter presets
  const applyPreset = useCallback((preset) => {
    const today = new Date();

    switch (preset) {
      case 'today': {
        const todayStr = formatDate(today);
        updateFilters({ startDate: todayStr, endDate: todayStr });
        setActivePreset('today');
        break;
      }
      case 'week': {
        const dayOfWeek = today.getDay();
        const monday = new Date(today);
        monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        updateFilters({ startDate: formatDate(monday), endDate: formatDate(sunday) });
        setActivePreset('week');
        break;
      }
      case 'month': {
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        updateFilters({ startDate: formatDate(firstDay), endDate: formatDate(lastDay) });
        setActivePreset('month');
        break;
      }
      default:
        break;
    }
  }, [updateFilters]);

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

  // Bulk update sessions
  const bulkUpdateSessions = useCallback(async (action, sessionIds) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/api/admin/sessions/bulk`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, sessionIds })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Không thể cập nhật');

      // Refresh data
      fetchSessions();
      return { 
        success: true, 
        updatedCount: json.updatedCount,
        lockedCount: json.lockedCount,
        skippedByStatus: json.skippedByStatus,
        message: json.message 
      };
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
    fetchSessions,
    refetch: fetchSessions,
    // Quick filters
    applyPreset,
    activePreset,
    setToday,
    setThisWeek,
    setThisMonth,
    // Actions
    markSessionStatus: markCompleted,
    markCompleted,
    cancelSession,
    bulkUpdateSessions,
    // Filter options placeholder
    filterOptions: {},
    // Permission info
    isSuperAdmin,
    userCenterId
  };
}

export default useGlobalSessions;
