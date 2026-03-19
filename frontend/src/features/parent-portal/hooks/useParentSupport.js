/**
 * useParentSupport Hook
 * Support ticket management for parent role.
 * Reuses the same backend endpoints as student support.
 */
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useParentSupport() {
  const [tickets, setTickets] = useState([]);
  const [ticketDetail, setTicketDetail] = useState(null);
  const [ticketMessages, setTicketMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [error, setError] = useState(null);
  const { session } = useAuth();

  const fetchMyTickets = useCallback(async () => {
    if (!session?.access_token) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/my-support-tickets`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Lỗi khi tải danh sách yêu cầu hỗ trợ');
      }

      setTickets(data.data || []);
    } catch (err) {
      console.error('Error fetching parent tickets:', err);
      setError(err.message || 'Đã xảy ra lỗi khi kết nối với máy chủ');
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  const createTicket = async (ticketData) => {
    try {
      const response = await fetch(`${API_URL}/api/support-tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(ticketData),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Không thể tạo yêu cầu hỗ trợ');
      }

      await fetchMyTickets();
      return { success: true, data: data.data };
    } catch (err) {
      console.error('Error creating parent ticket:', err);
      return { success: false, error: err.message || 'Đã xảy ra lỗi khi gửi yêu cầu' };
    }
  };

  const fetchTicketDetail = useCallback(async (ticketId) => {
    if (!session?.access_token || !ticketId) return null;

    setDetailLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/my-support-tickets/${ticketId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Không thể tải chi tiết yêu cầu hỗ trợ');
      }

      const detail = data.data || null;
      setTicketDetail(detail);
      setTicketMessages(detail?.messages || []);
      return detail;
    } catch (err) {
      console.error('Error fetching parent ticket detail:', err);
      setError(err.message || 'Đã xảy ra lỗi khi tải chi tiết yêu cầu');
      return null;
    } finally {
      setDetailLoading(false);
    }
  }, [session?.access_token]);

  const sendReply = useCallback(async (ticketId, message) => {
    if (!session?.access_token || !ticketId) {
      return { success: false, error: 'Thiếu thông tin xác thực' };
    }
    if (!message || !message.trim()) {
      return { success: false, error: 'Vui lòng nhập nội dung phản hồi' };
    }

    setSendingReply(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/support-tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ message: message.trim(), is_internal: false }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Không thể gửi phản hồi');
      }

      await fetchTicketDetail(ticketId);
      await fetchMyTickets();
      return { success: true, data: data.data };
    } catch (err) {
      console.error('Error sending parent ticket reply:', err);
      return { success: false, error: err.message || 'Đã xảy ra lỗi khi gửi phản hồi' };
    } finally {
      setSendingReply(false);
    }
  }, [fetchMyTickets, fetchTicketDetail, session?.access_token]);

  useEffect(() => {
    fetchMyTickets();
  }, [fetchMyTickets]);

  return {
    tickets,
    ticketDetail,
    ticketMessages,
    loading,
    detailLoading,
    sendingReply,
    error,
    createTicket,
    fetchTicketDetail,
    sendReply,
    setTicketDetail,
    refetch: fetchMyTickets,
  };
}
