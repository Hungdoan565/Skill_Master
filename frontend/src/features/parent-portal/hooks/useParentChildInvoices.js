/**
 * useParentChildInvoices Hook
 * Fetches invoices for a specific child
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useParentChildInvoices(studentId) {
  const { session } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInvoices = useCallback(async () => {
    if (!session?.access_token || !studentId) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/parent/child/${studentId}/invoices`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const result = await res.json();
      
      if (result.success) {
        // Canonical mapping: result.data.invoices (snake_case/camelCase mix)
        setInvoices(result.data?.invoices || []);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Không thể tải hóa đơn');
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, studentId]);

  useEffect(() => {
    if (studentId) {
      fetchInvoices();
    }
  }, [fetchInvoices, studentId]);

  return { invoices, loading, error, refresh: fetchInvoices };
}
