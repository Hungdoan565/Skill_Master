/**
 * useTransactions Hook
 * 
 * Hook để fetch và quản lý transactions (Tab Giao dịch)
 */

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';

const API_URL = import.meta.env.VITE_API_URL;

export function useTransactions() {
    const { session } = useAuth();

    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({
        totalPending: 0,
        totalVerified: 0,
        totalRejected: 0,
        pendingAmount: 0
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
    });
    const [filters, setFilters] = useState({
        status: 'all',
        method: 'all',
        search: '',
        dateStart: '',
        dateEnd: ''
    });
    const [selectedIds, setSelectedIds] = useState([]);

    // Fetch transactions
    const fetchTransactions = useCallback(async () => {
        if (!session?.access_token) return;

        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit
            });

            // Only add non-empty filter values
            if (filters.status && filters.status !== 'all') params.set('status', filters.status);
            if (filters.method && filters.method !== 'all') params.set('method', filters.method);
            if (filters.search && filters.search.trim()) params.set('search', filters.search.trim());
            if (filters.dateStart) params.set('dateStart', filters.dateStart);
            if (filters.dateEnd) params.set('dateEnd', filters.dateEnd);

            const res = await fetch(`${API_URL}/api/transactions?${params}`, {
                headers: { Authorization: `Bearer ${session.access_token}` }
            });
            const result = await res.json();

            if (result.success) {
                setTransactions(result.data || []);
                setPagination(prev => ({ ...prev, ...result.pagination }));
                setSummary(result.summary || {});
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    }, [session?.access_token, pagination.page, pagination.limit, filters]);

    // Initial fetch
    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    // Filter handlers
    const handleFilterChange = useCallback((field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
        setPagination(prev => ({ ...prev, page: 1 }));
    }, []);

    const resetFilters = useCallback(() => {
        setFilters({ status: 'all', method: 'all', search: '', dateStart: '', dateEnd: '' });
        setPagination(prev => ({ ...prev, page: 1 }));
    }, []);

    // Pagination handler
    const handlePageChange = useCallback((newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    }, []);

    // Selection handlers
    const toggleSelect = useCallback((id) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(i => i !== id)
                : [...prev, id]
        );
    }, []);

    const selectAll = useCallback(() => {
        const pendingIds = transactions
            .filter(t => t.verification_status === 'pending')
            .map(t => t.id);
        setSelectedIds(prev =>
            prev.length === pendingIds.length ? [] : pendingIds
        );
    }, [transactions]);

    const clearSelection = useCallback(() => {
        setSelectedIds([]);
    }, []);

    // Bulk verify
    const bulkVerify = useCallback(async () => {
        if (!session?.access_token || selectedIds.length === 0) return;

        try {
            const res = await fetch(`${API_URL}/api/transactions/bulk-verify`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ paymentIds: selectedIds })
            });
            const result = await res.json();

            if (result.success) {
                clearSelection();
                fetchTransactions();
                return { success: true, count: result.count };
            }
            return { success: false, message: result.message };
        } catch (error) {
            console.error('Error bulk verifying:', error);
            return { success: false, message: 'Lỗi hệ thống' };
        }
    }, [session?.access_token, selectedIds, clearSelection, fetchTransactions]);

    return {
        transactions,
        loading,
        summary,
        pagination,
        filters,
        selectedIds,
        fetchTransactions,
        handleFilterChange,
        resetFilters,
        handlePageChange,
        toggleSelect,
        selectAll,
        clearSelection,
        bulkVerify
    };
}

export default useTransactions;
