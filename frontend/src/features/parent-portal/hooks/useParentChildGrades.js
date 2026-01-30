/**
 * useParentChildGrades Hook
 * Fetches grades for a specific child
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useParentChildGrades(studentId) {
  const { session } = useAuth();
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGrades = useCallback(async () => {
    if (!session?.access_token || !studentId) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/parent/child/${studentId}/grades`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const result = await res.json();
      
      if (result.success) {
        setGrades(result.data || []);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Không thể tải bảng điểm');
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, studentId]);

  useEffect(() => {
    if (studentId) {
      fetchGrades();
    }
  }, [fetchGrades, studentId]);

  return { grades, loading, error, refresh: fetchGrades };
}
