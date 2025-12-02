/**
 * useInvoiceStats Hook
 * 
 * Custom hook quản lý thống kê hóa đơn.
 * Tách riêng khỏi useInvoices vì:
 * 1. Statistics thường không cần refetch thường xuyên
 * 2. Có thể cache lâu hơn
 * 3. Endpoint khác nhau
 */

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { API_URL } from '../utils/constants';

export function useInvoiceStats() {
  const { session } = useAuth();
  
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatistics = useCallback(async () => {
    if (!session?.access_token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${API_URL}/api/invoices/statistics`, {
        headers: { 
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const result = await res.json();
      
      if (result.success) {
        setStatistics(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch statistics');
      }
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  const refresh = useCallback(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  // Initial fetch
  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return {
    statistics,
    loading,
    error,
    refresh
  };
}

export default useInvoiceStats;
