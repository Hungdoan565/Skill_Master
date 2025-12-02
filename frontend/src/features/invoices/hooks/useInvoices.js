/**
 * useInvoices Hook
 * 
 * Custom hook quản lý toàn bộ logic liên quan đến danh sách hóa đơn:
 * - Fetch data từ API
 * - Quản lý state: loading, error, pagination
 * - Xử lý filters, search, sort
 * 
 * UI Component chỉ cần gọi hook này và render data.
 * Separation of Concerns: Logic ở đây, UI ở Component.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { API_URL, DEFAULT_PAGE_SIZE } from '../utils/constants';

export function useInvoices() {
  const { session } = useAuth();
  
  // ============================================
  // DATA STATE
  // ============================================
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // ============================================
  // FILTER STATE
  // ============================================
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    dateStart: '',
    dateEnd: ''
  });
  
  // Debounced search (để không gọi API mỗi keystroke)
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // ============================================
  // PAGINATION STATE
  // ============================================
  const [pagination, setPagination] = useState({
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 0
  });

  // ============================================
  // DEBOUNCE SEARCH
  // ============================================
  useEffect(() => {
    const timer = setTimeout(() => {
      if (filters.search !== debouncedSearch) {
        setDebouncedSearch(filters.search);
        // Reset về trang 1 khi search thay đổi
        setPagination(prev => ({ ...prev, page: 1 }));
      }
    }, 400);
    
    return () => clearTimeout(timer);
  }, [filters.search, debouncedSearch]);

  // ============================================
  // FETCH INVOICES
  // ============================================
  const fetchInvoices = useCallback(async () => {
    if (!session?.access_token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Build query params
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy: 'created_at',
        sortOrder: 'desc'
      });
      
      // Apply filters
      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }
      if (debouncedSearch.trim()) {
        params.append('search', debouncedSearch.trim());
      }
      if (filters.dateStart) {
        params.append('startDate', filters.dateStart);
      }
      if (filters.dateEnd) {
        params.append('endDate', filters.dateEnd);
      }

      const res = await fetch(`${API_URL}/api/invoices?${params}`, {
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
        setInvoices(result.data || []);
        setPagination(prev => ({
          ...prev,
          total: result.pagination?.total || 0,
          totalPages: result.pagination?.totalPages || 0
        }));
      } else {
        throw new Error(result.message || 'Failed to fetch invoices');
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(err.message);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, pagination.page, pagination.limit, filters.status, debouncedSearch, filters.dateStart, filters.dateEnd]);

  // ============================================
  // HANDLERS
  // ============================================
  
  /**
   * Thay đổi trang
   */
  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  }, [pagination.totalPages]);

  /**
   * Thay đổi filter
   */
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    // Reset về trang 1 khi filter thay đổi (trừ search - đã debounce)
    if (key !== 'search') {
      setPagination(prev => ({ ...prev, page: 1 }));
    }
  }, []);

  /**
   * Reset tất cả filters
   */
  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      status: 'all',
      dateStart: '',
      dateEnd: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  /**
   * Refresh data
   */
  const refresh = useCallback(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // ============================================
  // COMPUTED VALUES
  // ============================================
  const hasActiveFilters = useMemo(() => {
    return (
      filters.status !== 'all' ||
      filters.dateStart !== '' ||
      filters.dateEnd !== '' ||
      filters.search !== ''
    );
  }, [filters]);

  // ============================================
  // AUTO FETCH
  // ============================================
  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // ============================================
  // RETURN
  // ============================================
  return {
    // Data
    invoices,
    loading,
    error,
    
    // Pagination
    pagination,
    handlePageChange,
    
    // Filters
    filters,
    handleFilterChange,
    resetFilters,
    hasActiveFilters,
    
    // Actions
    refresh
  };
}

export default useInvoices;
