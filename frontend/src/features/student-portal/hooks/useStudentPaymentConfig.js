/**
 * useStudentPaymentConfig Hook
 * Fetch bank config for student payment (VietQR)
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useStudentPaymentConfig() {
  const { session } = useAuth();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchConfig = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/student/payment-config`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const result = await res.json();
      if (result.success) {
        setConfig(result.data);
      } else {
        setError(result.message || 'Khong the tai cau hinh thanh toan');
      }
    } catch (err) {
      setError('Khong the tai cau hinh thanh toan');
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return { config, loading, error, refresh: fetchConfig };
}

export default useStudentPaymentConfig;
