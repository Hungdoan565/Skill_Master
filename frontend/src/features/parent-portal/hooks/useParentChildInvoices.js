/**
 * useParentChildInvoices Hook
 * Fetches invoices for a specific child, including summary from backend
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { normalizeParentInvoices } from '../utils/normalizers';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useParentChildInvoices(studentId) {
  const { session } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInvoices = useCallback(async () => {
    if (!session?.access_token || !studentId) {
      setInvoices([]);
      setSummary(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/parent/child/${studentId}/invoices`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const result = await res.json().catch(() => ({}));

      if (res.ok && result.success) {
        setInvoices(normalizeParentInvoices(result.data?.invoices));
        setSummary(result.data?.summary || null);
      } else {
        setInvoices([]);
        setSummary(null);
        setError(result.message || 'Không thể tải hóa đơn');
      }
    } catch (err) {
      setInvoices([]);
      setSummary(null);
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

  return { invoices, summary, loading, error, refresh: fetchInvoices };
}
