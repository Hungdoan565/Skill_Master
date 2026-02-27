import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { supabase } from '@/lib/supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useCertificateStats() {
  const [stats, setStats] = useState({
    totalIssued: 0,
    activeCount: 0,
    expiringSoon: 0,
    revokedCount: 0,
    pendingApprovalCount: 0,
    recentCertificates: [],
    topTypes: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getAuthHeaders = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Chưa đăng nhập');
    return { Authorization: `Bearer ${session.access_token}` };
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const headers = await getAuthHeaders();
      const { data } = await axios.get(`${API_URL}/api/admin/certificates/stats`, { headers });
      if (data.success) {
        const payload = data.data || {};
        setStats({
          totalIssued: payload.total_issued ?? payload.totalIssued ?? 0,
          activeCount: payload.active_count ?? payload.activeCount ?? 0,
          expiringSoon: payload.expiring_soon ?? payload.expiringSoon ?? 0,
          revokedCount: payload.revoked_count ?? payload.revokedCount ?? 0,
          pendingApprovalCount: payload.pending_approval_count ?? payload.pendingApprovalCount ?? 0,
          recentCertificates: payload.recent_certificates ?? payload.recentCertificates ?? [],
          topTypes: payload.top_types ?? payload.topTypes ?? []
        });
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refresh: fetchStats };
}

export default useCertificateStats;
