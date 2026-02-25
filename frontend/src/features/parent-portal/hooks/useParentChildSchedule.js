/**
 * useParentChildSchedule Hook
 * Fetches schedule for a specific child
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useParentChildSchedule(studentId) {
  const { session } = useAuth();
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSchedule = useCallback(async () => {
    if (!session?.access_token || !studentId) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/parent/child/${studentId}/schedule`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const result = await res.json();
      
      if (result.success) {
        // Canonical mapping: result.data.events (camelCase)
        setSchedule(result.data?.events || []);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Không thể tải lịch học');
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, studentId]);

  useEffect(() => {
    if (studentId) {
      fetchSchedule();
    }
  }, [fetchSchedule, studentId]);

  return { schedule, loading, error, refresh: fetchSchedule };
}
