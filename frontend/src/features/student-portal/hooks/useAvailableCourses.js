import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useAvailableCourses(search = '') {
  const { session } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const url = new URL(`${API_URL}/api/student/available-courses`);
      if (search) {
        url.searchParams.append('search', search);
      }
      const res = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.message || 'Error');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { courses: data, loading, error, refresh: fetchData };
}
