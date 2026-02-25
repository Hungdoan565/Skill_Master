/**
 * useParentChildren Hook
 * Fetches list of children for the parent
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useParentChildren() {
  const { session } = useAuth();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchChildren = useCallback(async () => {
    if (!session?.access_token) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/parent/children`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const result = await res.json();
      
      if (result.success) {
        // Canonical mapping: result.data.children
        setChildren(result.data?.children || []);
      } else {
        setError(result.message);
      }
    } catch (err) {
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
