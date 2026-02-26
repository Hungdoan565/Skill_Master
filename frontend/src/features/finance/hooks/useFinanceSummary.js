import { useCallback, useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function getTokenFromLocalStorage() {
  const directToken = localStorage.getItem('token');
  if (directToken) {
    return directToken.replace('Bearer ', '');
  }

  const keys = Object.keys(localStorage);
  const supabaseKey = keys.find((key) => key.includes('auth-token'));
  if (!supabaseKey) return null;

  try {
    const raw = localStorage.getItem(supabaseKey);
    const parsed = JSON.parse(raw || '{}');

    if (parsed?.access_token) return parsed.access_token;
    if (parsed?.currentSession?.access_token) return parsed.currentSession.access_token;
  } catch {
    return null;
  }

  return null;
}

export function useFinanceSummary({ centerId = '', period = 'month', year, month } = {}) {
  const [data, setData] = useState({
    overview: {
      total_revenue: 0,
      total_paid: 0,
      total_pending: 0,
      total_overdue: 0,
      student_count: 0,
      invoice_count: 0,
    },
    monthly_revenue: [],
    payment_methods: [],
    top_courses: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async () => {
    const token = getTokenFromLocalStorage();
    if (!token) {
      setLoading(false);
      setError('Không tìm thấy token đăng nhập');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        period,
        year: String(year),
      });

      if (month) {
        params.append('month', String(month));
      }
      if (centerId) {
        params.append('center_id', centerId);
      }

      const response = await fetch(`${API_URL}/api/finance/summary?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      setData(result?.data || result);
    } catch (err) {
      console.error('Error fetching finance summary:', err);
      setError('Không thể tải dữ liệu tài chính');
    } finally {
      setLoading(false);
    }
  }, [centerId, period, year, month]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    data,
    loading,
    error,
    refetch: fetchSummary,
  };
}

export default useFinanceSummary;
