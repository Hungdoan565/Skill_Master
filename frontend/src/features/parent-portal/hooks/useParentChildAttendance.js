/**
 * useParentChildAttendance Hook
 * Fetches attendance records for a specific child
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useParentChildAttendance(studentId) {
  const { session } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAttendance = useCallback(async () => {
    if (!session?.access_token || !studentId) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/parent/child/${studentId}/attendance`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const result = await res.json();
      
      if (result.success) {
        setAttendance(result.data || []);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Không thể tải dữ liệu điểm danh');
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, studentId]);

  useEffect(() => {
    if (studentId) {
      fetchAttendance();
    }
  }, [fetchAttendance, studentId]);

  return { attendance, loading, error, refresh: fetchAttendance };
}
