/**
 * useStudentSchedule Hook
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useStudentSchedule(classId = null) {
  const { session } = useAuth();
  const [data, setData] = useState({ events: [], classes: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSchedule = useCallback(async () => {
    if (!session?.access_token) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (classId) params.append('classId', classId);
      
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
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, classId]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  return { ...data, loading, error, refresh: fetchSchedule };
}

