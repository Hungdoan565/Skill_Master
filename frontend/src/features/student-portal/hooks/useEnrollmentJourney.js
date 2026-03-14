import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useEnrollmentJourney() {
  const { session } = useAuth();
  const [data, setData] = useState({ items: [], groups: { processing: [], history: [] }, summary: { total: 0, processing_count: 0, history_count: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/student/enrollment-journey`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = await res.json();
      if (!result.success) {
        throw new Error(result.message || 'Không thể tải hành trình đăng ký');
      }
      setData(result.data || { items: [], groups: { processing: [], history: [] }, summary: { total: 0, processing_count: 0, history_count: 0 } });
    } catch (err) {
      setError(err.message || 'Không thể tải hành trình đăng ký');
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const cancelRequest = async (requestId) => {
    if (!session?.access_token) throw new Error('Not authenticated');

    const res = await fetch(`${API_URL}/api/student/enrollment-requests/${requestId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const result = await res.json();
    if (!result.success) {
      throw new Error(result.message || 'Không thể hủy yêu cầu');
    }

    await fetchData();
    return result.data;
  };

  return {
    journey: data,
    loading,
    error,
    refresh: fetchData,
    cancelRequest,
  };
}
