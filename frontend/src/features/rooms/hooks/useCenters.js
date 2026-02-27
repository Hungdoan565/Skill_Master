/**
 * useCenters Hook - Fetch danh sách trung tâm (scoped theo role)
 */

import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../utils';
import { useAuth } from '@/contexts/auth-context';

export function useCenters(autoFetch = false) {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(false);
  const { session } = useAuth();

  const fetchCenters = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/admin/centers`, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      setCenters(res.data.data || []);
    } catch (err) {
      console.error('Error fetching centers:', err);
      setCenters([]);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  // Auto-fetch on mount if autoFetch is true
  useEffect(() => {
    if (autoFetch && session?.access_token) {
      fetchCenters();
    }
  }, [autoFetch, fetchCenters, session?.access_token]);

  return {
    centers,
    loading,
    fetchCenters,
  };
}

export default useCenters;
