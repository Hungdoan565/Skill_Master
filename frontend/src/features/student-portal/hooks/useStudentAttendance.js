/**
 * useStudentAttendance Hook
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useStudentAttendance(filters = {}) {
  const { session } = useAuth();
  const [data, setData] = useState({ records: [], classSummaries: [], statistics: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAttendance = useCallback(async () => {
    if (!session?.access_token) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.classId) params.append('classId', filters.classId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      const res = await fetch(`${API_URL}/api/student/attendance?${params}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const result = await res.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Không thể tải điểm danh');
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, filters.classId, filters.startDate, filters.endDate]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  return { ...data, loading, error, refresh: fetchAttendance };
}

