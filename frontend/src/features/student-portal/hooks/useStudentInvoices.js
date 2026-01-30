/**
 * useStudentInvoices Hook
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useStudentInvoices(status = 'all') {
  const { session } = useAuth();
  const [data, setData] = useState({ invoices: [], summary: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInvoices = useCallback(async () => {
    if (!session?.access_token) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/student/invoices?status=${status}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const result = await res.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Không thể tải hóa đơn');
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, status]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return { ...data, loading, error, refresh: fetchInvoices };
}

