/**
 * useParentDashboard Hook
 * Fetches parent dashboard data (stats, overview)
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useParentDashboard() {
  const { session } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    if (!session?.access_token) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/parent/dashboard`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const result = await res.json();
      
      if (result.success) {
        const data = result.data || {};
        
        // Canonical frontend mapping: If stats are missing, aggregate from children
        if (data.children && !data.stats) {
          const totalUnpaid = (data.children || []).reduce((sum, c) => sum + (c.stats?.unpaidAmount || 0), 0);
          const unpaidInvoicesCount = (data.children || []).reduce((sum, c) => sum + (c.stats?.unpaidInvoices || 0), 0);
          
          data.stats = {
            totalUnpaid,
            unpaidInvoicesCount
          };
        }
        
        setData(data);
      } else {
        setError(result.message);
      }
    } catch (err) {
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
