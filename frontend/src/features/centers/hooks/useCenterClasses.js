/**
 * useCenterClasses Hook - Lấy danh sách lớp học của center
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
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

export function useCenterClasses(centerId) {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch classes by center
    const fetchClasses = useCallback(async () => {
        if (!centerId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const config = await getAuthHeaders();
            const response = await axios.get(
                `${API_URL}/api/classes?centerId=${centerId}`,
                config
            );

            if (response.data?.success) {
                setClasses(response.data.data || []);
            }
        } catch (err) {
            console.error('Error fetching center classes:', err);
            setError(err.response?.data?.message || 'Không thể tải danh sách lớp học');
            setClasses([]);
        } finally {
            setLoading(false);
        }
    }, [centerId]);

    // Auto fetch on mount
    useEffect(() => {
        fetchClasses();
    }, [fetchClasses]);

    // Get stats
    const stats = useMemo(() => ({
        total: classes.length,
        active: classes.filter(c => c.status === 'active' || c.status === 'ongoing').length,
        upcoming: classes.filter(c => c.status === 'upcoming').length,
        ongoing: classes.filter(c => c.status === 'ongoing').length,
        completed: classes.filter(c => c.status === 'completed').length,
        cancelled: classes.filter(c => c.status === 'cancelled').length
    }), [classes]);

    return {
        classes,
        stats,
        loading,
        error,
        refetch: fetchClasses
    };
}

export default useCenterClasses;
