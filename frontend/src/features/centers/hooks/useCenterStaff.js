/**
 * useCenterStaff Hook - Lấy danh sách nhân sự của center
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

export function useCenterStaff(centerId) {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch staff by center
    const fetchStaff = useCallback(async () => {
        if (!centerId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const config = await getAuthHeaders();
            const response = await axios.get(
                `${API_URL}/api/admin/staff?centerId=${centerId}`,
                config
            );

            if (response.data?.success) {
                setStaff(response.data.data || []);
            }
        } catch (err) {
            console.error('Error fetching center staff:', err);
            setError(err.response?.data?.message || 'Không thể tải danh sách nhân sự');
            setStaff([]);
        } finally {
            setLoading(false);
        }
    }, [centerId]);

    // Auto fetch on mount
    useEffect(() => {
        fetchStaff();
    }, [fetchStaff]);

    // Get stats by role
    const stats = useMemo(() => {
        const teachers = staff.filter(s => s.role_code === 'TEACHER' || s.roles?.code === 'TEACHER');
        const managers = staff.filter(s => s.role_code === 'CENTER_MANAGER' || s.roles?.code === 'CENTER_MANAGER');
        const admins = staff.filter(s => s.role_code === 'SUPER_ADMIN' || s.roles?.code === 'SUPER_ADMIN');

        return {
            total: staff.length,
            teachers: teachers.length,
            managers: managers.length,
            admins: admins.length,
            active: staff.filter(s => s.status === 'active').length,
            inactive: staff.filter(s => s.status !== 'active').length
        };
    }, [staff]);

    return {
        staff,
        stats,
        loading,
        error,
        refetch: fetchStaff
    };
}

export default useCenterStaff;
