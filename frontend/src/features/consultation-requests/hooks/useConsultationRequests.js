import { useCallback, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useConsultationRequests() {
  const { session, profile } = useAuth();
  const [requests, setRequests] = useState([]);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 });
  const [activities, setActivities] = useState([]);
  const [chatHistory, setChatHistory] = useState({ messages: [], session: null });

  const getAuthHeaders = useCallback(() => ({
    Authorization: `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json'
  }), [session?.access_token]);

  const fetchRequests = useCallback(async (filters = {}) => {
    if (!session?.access_token) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.set(key, value);
        }
      });

      const response = await fetch(`${API_URL}/api/admin/consultation-requests?${params.toString()}`, {
        headers: getAuthHeaders()
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || result.error || 'Không thể tải yêu cầu tư vấn');
      }

      setRequests(result.data || []);
      if (result.pagination) {
        setPagination(result.pagination);
      }
      return { success: true, data: result.data || [] };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, session?.access_token]);

  const fetchRequestDetail = useCallback(async (requestId) => {
    if (!session?.access_token || !requestId) return null;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/consultation-requests/${requestId}`, {
        headers: getAuthHeaders()
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || result.error || 'Không thể tải chi tiết yêu cầu tư vấn');
      }

      setCurrentRequest(result.data);
      setRequests(prev => prev.map(item => item.id === result.data.id ? result.data : item));
      return { success: true, data: result.data };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, session?.access_token]);

  const updateRequest = useCallback(async (requestId, payload) => {
    if (!session?.access_token || !requestId) return null;

    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/consultation-requests/${requestId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || result.error || 'Không thể cập nhật yêu cầu tư vấn');
      }

      setCurrentRequest(result.data);
      setRequests(prev => prev.map(item => item.id === result.data.id ? result.data : item));
      return { success: true, data: result.data };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setSaving(false);
    }
  }, [getAuthHeaders, session?.access_token]);

  const claimRequest = useCallback(async (requestId) => {
    if (!profile?.id) return null;
    return updateRequest(requestId, { assigned_to: profile.id });
  }, [profile?.id, updateRequest]);

  const releaseRequest = useCallback(async (requestId) => {
    return updateRequest(requestId, { assigned_to: null });
  }, [updateRequest]);

  const ensureFollowUpThread = useCallback(async (requestId) => {
    if (!session?.access_token || !requestId) return null;

    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/consultation-requests/${requestId}/follow-up-thread`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || result.error || 'Không thể tạo luồng follow-up');
      }

      const requestData = result.data?.request || null;
      if (requestData) {
        setCurrentRequest(requestData);
        setRequests(prev => prev.map(item => item.id === requestData.id ? requestData : item));
      }

      return { success: true, data: result.data || null };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setSaving(false);
    }
  }, [getAuthHeaders, session?.access_token]);

  const fetchActivities = useCallback(async (requestId) => {
    if (!session?.access_token || !requestId) return { success: false, data: [] };
    try {
      const response = await fetch(`${API_URL}/api/admin/consultation-requests/${requestId}/activities`, {
        headers: getAuthHeaders()
      });
      const result = await response.json();
      if (!result.success) return { success: false, data: [] };
      setActivities(result.data || []);
      return { success: true, data: result.data || [] };
    } catch {
      return { success: false, data: [] };
    }
  }, [getAuthHeaders, session?.access_token]);

  const fetchChatHistory = useCallback(async (requestId) => {
    if (!session?.access_token || !requestId) return { success: false, data: [] };
    try {
      const response = await fetch(`${API_URL}/api/admin/consultation-requests/${requestId}/chat-history`, {
        headers: getAuthHeaders()
      });
      const result = await response.json();
      if (!result.success) {
        setChatHistory({ messages: [], session: null });
        return { success: false, data: [] };
      }
      setChatHistory({ messages: result.data || [], session: result.session || null });
      return { success: true, data: result.data || [] };
    } catch {
      setChatHistory({ messages: [], session: null });
      return { success: false, data: [] };
    }
  }, [getAuthHeaders, session?.access_token]);

  return {
    requests,
    currentRequest,
    loading,
    saving,
    pagination,
    activities,
    chatHistory,
    setCurrentRequest,
    fetchRequests,
    fetchRequestDetail,
    fetchActivities,
    fetchChatHistory,
    updateRequest,
    claimRequest,
    releaseRequest,
    ensureFollowUpThread
  };
}
