/**
 * useCenterStats Hook - Thống kê chi tiết của center
 */

import { useState, useCallback } from 'react';
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

export function useCenterStats(centerId) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchStats = useCallback(async () => {
        if (!centerId) return;

        try {
            setLoading(true);
            setError(null);

            const config = await getAuthHeaders();
            const response = await axios.get(`${API_URL}/api/admin/centers/${centerId}/stats`, config);

            if (response.data?.success) {
                setStats(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching center stats:', err);
            setError(err.response?.data?.message || 'Không thể tải thống kê');
        } finally {
            setLoading(false);
        }
    }, [centerId]);

    return {
        stats,
        loading,
        error,
        fetchStats
    };
}

export default useCenterStats;
