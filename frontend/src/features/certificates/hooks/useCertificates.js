import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { supabase } from '@/lib/supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, totalItems: 0 });
  const [filters, setFilters] = useState({});
  const [sorting, setSorting] = useState({ sortBy: 'issued_at', sortOrder: 'desc' });
  const fetchRef = useRef(0);

  const getAuthHeaders = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Chưa đăng nhập');
    return { Authorization: `Bearer ${session.access_token}` };
  }, []);

  const fetchCertificates = useCallback(async () => {
    const fetchId = ++fetchRef.current;
    try {
      setLoading(true);
      setError(null);
      const headers = await getAuthHeaders();
      const normalizedFilters = {
        ...filters,
        certificate_type_id: filters?.certificate_type_id ?? filters?.certificateTypeId,
      };

      if (normalizedFilters.certificateTypeId !== undefined) {
        delete normalizedFilters.certificateTypeId;
      }

      const limit = pagination.pageSize;
      const params = {
        page: pagination.page,
        limit,
        ...sorting,
        ...normalizedFilters,
      };
      const { data } = await axios.get(`${API_URL}/api/admin/certificates`, { headers, params });
      if (fetchId !== fetchRef.current) return;
      if (data.success) {
        setCertificates(data.data || []);
        setPagination(prev => ({
          ...prev,
          totalItems: data.pagination?.total || data.total || data.data?.length || 0,
        }));
      }
    } catch (err) {
      if (fetchId !== fetchRef.current) return;
      setError(err.response?.data?.error || err.message);
    } finally {
      if (fetchId === fetchRef.current) setLoading(false);
    }
  }, [getAuthHeaders, pagination.page, pagination.pageSize, sorting, filters]);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const setPage = useCallback((page) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const setPageSize = useCallback((pageSize) => {
    setPagination(prev => ({ ...prev, page: 1, pageSize }));
  }, []);

  const updateFilters = useCallback((newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const updateSorting = useCallback((sortBy, sortOrder) => {
    setSorting({ sortBy, sortOrder });
  }, []);

  const revokeCertificate = useCallback(async (id, reason) => {
    try {
      const headers = await getAuthHeaders();
      await axios.put(`${API_URL}/api/admin/certificates/${id}/revoke`, { reason }, { headers });
      await fetchCertificates();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || err.message };
    }
  }, [getAuthHeaders, fetchCertificates]);

  const approveCertificate = useCallback(async (approvalId) => {
    try {
      const headers = await getAuthHeaders();
      await axios.put(`${API_URL}/api/admin/certificates/${approvalId}/approve`, {}, { headers });
      await fetchCertificates();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || err.message };
    }
  }, [getAuthHeaders, fetchCertificates]);

  const rejectCertificate = useCallback(async (approvalId, reason) => {
    try {
      const headers = await getAuthHeaders();
      await axios.put(`${API_URL}/api/admin/certificates/${approvalId}/reject`, { rejection_reason: reason }, { headers });
      await fetchCertificates();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || err.message };
    }
  }, [getAuthHeaders, fetchCertificates]);

  return {
    certificates,
    loading,
    error,
    pagination,
    setPage,
    setPageSize,
    setFilters: updateFilters,
    setSorting: updateSorting,
    refresh: fetchCertificates,
    revokeCertificate,
    approveCertificate,
    rejectCertificate,
  };
}

export default useCertificates;
