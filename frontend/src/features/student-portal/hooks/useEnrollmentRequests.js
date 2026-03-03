import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useEnrollmentRequests() {
  const { session } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/student/enrollment-requests`, {
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
  }, [session?.access_token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const submitRequest = async (classId, message = '') => {
    if (!session?.access_token) throw new Error('Not authenticated');
    const res = await fetch(`${API_URL}/api/student/enrollment-requests`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ class_id: classId, message })
    });
    const result = await res.json();
    if (!result.success) {
      throw new Error(result.message || 'Error submitting request');
    }
    await fetchData();
    return result.data;
  };

  const cancelRequest = async (requestId) => {
    if (!session?.access_token) throw new Error('Not authenticated');
    const res = await fetch(`${API_URL}/api/student/enrollment-requests/${requestId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${session.access_token}` }
    });
    const result = await res.json();
    if (!result.success) {
      throw new Error(result.message || 'Error cancelling request');
    }
    await fetchData();
    return result.data;
  };

  return { 
    requests: data, 
    loading, 
    error, 
    refresh: fetchData,
    submitRequest,
    cancelRequest
  };
}
