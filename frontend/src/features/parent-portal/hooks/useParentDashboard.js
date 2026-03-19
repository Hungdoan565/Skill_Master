/**
 * useParentDashboard Hook
 * Fetches parent dashboard data (stats, overview)
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { normalizeParentChildren } from '../utils/normalizers';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useParentDashboard() {
  const { session } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    if (!session?.access_token) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/parent/dashboard`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const result = await res.json().catch(() => ({}));

      if (res.ok && result.success) {
        const data = result.data || {};
        const normalizedChildren = normalizeParentChildren(data.children);

        // Canonical frontend mapping: If stats are missing, aggregate from children
        if (normalizedChildren.length > 0 && !data.stats) {
          const totalUnpaid = normalizedChildren.reduce((sum, c) => sum + (c.unpaid_amount || 0), 0);
          const unpaidInvoicesCount = normalizedChildren.reduce((sum, c) => sum + (c.unpaid_invoices_count || 0), 0);

          data.stats = {
            totalUnpaid,
            unpaidInvoicesCount
          };
        }

        data.children = normalizedChildren;

        setData(data);
      } else {
        setData(null);
        setError(result.message || 'Không thể tải dữ liệu dashboard');
      }
    } catch (err) {
      setData(null);
      setError('Không thể tải dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { data, loading, error, refresh: fetchDashboard };
}
