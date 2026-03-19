/**
 * useParentChildren Hook
 * Fetches list of children for the parent
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { normalizeParentChildren } from '../utils/normalizers';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useParentChildren() {
  const { session } = useAuth();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchChildren = useCallback(async () => {
    if (!session?.access_token) {
      setChildren([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/parent/children`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const result = await res.json().catch(() => ({}));

      if (res.ok && result.success) {
        setChildren(normalizeParentChildren(result.data?.children));
      } else {
        setChildren([]);
        setError(result.message || 'Không thể tải danh sách học viên được liên kết');
      }
    } catch (err) {
      setChildren([]);
      setError('Không thể tải danh sách học viên');
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  return { children, loading, error, refresh: fetchChildren };
}
