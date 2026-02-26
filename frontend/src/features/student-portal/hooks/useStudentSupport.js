import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useStudentSupport() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { session } = useAuth();

  const fetchMyTickets = useCallback(async () => {
    if (!session?.access_token) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API}/api/my-support-tickets`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Lỗi khi tải danh sách yêu cầu hỗ trợ');
      }
      
      setTickets(data.data || []);
    } catch (err) {
      console.error('Error fetching my tickets:', err);
      setError(err.message || 'Đã xảy ra lỗi khi kết nối với máy chủ');
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  const createTicket = async (ticketData) => {
    try {
      const response = await fetch(`${API}/api/support-tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(ticketData)
      });
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Không thể tạo yêu cầu hỗ trợ');
      }
      
      // Refresh list after creation
      await fetchMyTickets();
      
      return { success: true, data: data.data };
    } catch (err) {
      console.error('Error creating ticket:', err);
      return { success: false, error: err.message || 'Đã xảy ra lỗi khi gửi yêu cầu' };
    }
  };

  useEffect(() => {
    fetchMyTickets();
  }, [fetchMyTickets]);

  return {
    tickets,
    loading,
    error,
    createTicket,
    refetch: fetchMyTickets
  };
}
