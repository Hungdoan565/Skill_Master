/**
 * useStudentSchedule Hook
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useStudentSchedule({ classId, classScope = 'active', startDate, endDate, viewType = 'week' } = {}) {
  const { session } = useAuth();
  const [data, setData] = useState({ sessions: [], classes: [], statistics: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSchedule = useCallback(async () => {
    if (!session?.access_token) return;
    
    // Only fetch if we have dates (or maybe default to something, but component should control)
    if (!startDate || !endDate) return;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (classId && classId !== 'all') params.append('classId', classId);
      params.append('enrollmentScope', classScope);
      
      // Format dates as YYYY-MM-DD safely using local time
      const formatDate = (date) => {
        const d = new Date(date);
        const offset = d.getTimezoneOffset();
        const localDate = new Date(d.getTime() - (offset * 60 * 1000));
        return localDate.toISOString().split('T')[0];
      };

      params.append('startDate', formatDate(startDate));
      params.append('endDate', formatDate(endDate));
      params.append('view', viewType);
      
      const res = await fetch(`${API_URL}/api/student/schedule?${params}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const result = await res.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Không thể tải lịch học');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, classId, classScope, startDate, endDate, viewType]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  return { ...data, loading, error, refresh: fetchSchedule };
}
