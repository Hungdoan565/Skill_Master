/**
 * useClassStudents Hook
 * Manages class students with pagination, search and filtering
 */

import { useState, useCallback, useEffect } from 'react';
import { API_URL, DEFAULT_PAGINATION, SEARCH_DEBOUNCE_DELAY } from '../utils';

export function useClassStudents(classId, getHeaders, initialLoading = true) {
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_PAGINATION);
  const [searchInputValue, setSearchInputValue] = useState('');
  
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  
  const [summary, setSummary] = useState({
    totalInClass: 0,
    paid: 0,
    unpaid: 0
  });

  // Fetch students with pagination & filters
  const fetchStudents = useCallback(async (filterParams = filters) => {
    if (!classId) return;
    
    setLoadingStudents(true);
    try {
      const params = new URLSearchParams({
        page: filterParams.page.toString(),
        limit: filterParams.limit.toString(),
        payment_status: filterParams.paymentStatus,
        search: filterParams.search
      });
      
      const res = await fetch(
        `${API_URL}/api/classes/${classId}/students?${params}`, 
        { headers: getHeaders() }
      );
      const json = await res.json();
      
      if (json.success) {
        setStudents(json.data || []);
        setPagination(json.pagination || {
          total: 0, page: 1, limit: 10, totalPages: 0, 
          hasNextPage: false, hasPrevPage: false
        });
        setSummary(json.summary || { totalInClass: 0, paid: 0, unpaid: 0 });
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoadingStudents(false);
    }
  }, [classId, getHeaders, filters]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInputValue !== filters.search) {
        setFilters(prev => ({ ...prev, search: searchInputValue, page: 1 }));
      }
    }, SEARCH_DEBOUNCE_DELAY);
    return () => clearTimeout(timer);
  }, [searchInputValue, filters.search]);

  // Pagination handlers
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setFilters(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleLimitChange = (newLimit) => {
    setFilters(prev => ({ ...prev, limit: parseInt(newLimit), page: 1 }));
  };

  const handlePaymentFilterChange = (status) => {
    setFilters(prev => ({ ...prev, paymentStatus: status, page: 1 }));
  };

  const clearFilters = () => {
    setSearchInputValue('');
    setFilters(DEFAULT_PAGINATION);
  };

  // Refresh data
  const refresh = useCallback(() => {
    return fetchStudents(filters);
  }, [fetchStudents, filters]);

  return {
    // Data
    students,
    pagination,
    summary,
    loadingStudents,
    
    // Filters
    filters,
    searchInputValue,
    setSearchInputValue,
    
    // Handlers
    handlePageChange,
    handleLimitChange,
    handlePaymentFilterChange,
    clearFilters,
    
    // Actions
    fetchStudents,
    refresh
  };
}
