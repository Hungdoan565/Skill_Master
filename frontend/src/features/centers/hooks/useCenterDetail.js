/**
 * useCenterDetail Hook - Lấy chi tiết và thống kê đầy đủ của center
 */

import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '@/lib/supabaseClient';
import { API_URL } from '../utils';

async function getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    return {
        headers: {
            Authorization: `Bearer ${session?.access_token}`
        }
    };
}

export function useCenterDetail(centerId) {
    const [center, setCenter] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch center detail
    const fetchCenterDetail = useCallback(async () => {
        if (!centerId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const config = await getAuthHeaders();

            // Parallel fetch center info và stats
            const [centerRes, statsRes] = await Promise.all([
                axios.get(`${API_URL}/api/admin/centers/${centerId}`, config),
                axios.get(`${API_URL}/api/admin/centers/${centerId}/stats`, config).catch(() => ({ data: { success: false } }))
            ]);

            if (centerRes.data?.success) {
                setCenter(centerRes.data.data);
            } else {
                throw new Error('Center not found');
            }

            if (statsRes.data?.success) {
                setStats(statsRes.data.data);
            }
        } catch (err) {
            console.error('Error fetching center detail:', err);
            setError(err.response?.data?.message || err.message || 'Không thể tải thông tin trung tâm');
        } finally {
            setLoading(false);
        }
    }, [centerId]);

    // Auto fetch on mount and when centerId changes
    useEffect(() => {
        fetchCenterDetail();
    }, [fetchCenterDetail]);

    // Refresh data
    const refetch = useCallback(async () => {
        await fetchCenterDetail();
    }, [fetchCenterDetail]);

    return {
        center,
        stats,
        loading,
        error,
        refetch
    };
}

export default useCenterDetail;
