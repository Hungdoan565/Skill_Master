/**
 * useCenterStudents Hook - Lấy danh sách học viên của center
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

export function useCenterStudents(centerId) {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch students by center
    const fetchStudents = useCallback(async () => {
        if (!centerId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const config = await getAuthHeaders();
            const response = await axios.get(
                `${API_URL}/api/admin/students?centerId=${centerId}&limit=100`,
                config
            );

            if (response.data?.success) {
                setStudents(response.data.data || []);
            }
        } catch (err) {
            console.error('Error fetching center students:', err);
            setError(err.response?.data?.message || 'Không thể tải danh sách học viên');
            setStudents([]);
        } finally {
            setLoading(false);
        }
    }, [centerId]);

    // Auto fetch on mount
    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    // Compute stats
    const stats = useMemo(() => {
        const active = students.filter(s => s.status === 'active');
        const inactive = students.filter(s => s.status !== 'active');

        return {
            total: students.length,
            active: active.length,
            inactive: inactive.length
        };
    }, [students]);

    return {
        students,
        stats,
        loading,
        error,
        refetch: fetchStudents
    };
}

export default useCenterStudents;
