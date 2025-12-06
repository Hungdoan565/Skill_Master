/**
 * useCenterRooms Hook - Lấy danh sách phòng học của center
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

export function useCenterRooms(centerId) {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch rooms by center
    const fetchRooms = useCallback(async () => {
        if (!centerId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const config = await getAuthHeaders();
            const response = await axios.get(
                `${API_URL}/api/rooms?center_id=${centerId}`,
                config
            );

            if (response.data?.success) {
                setRooms(response.data.data || []);
            }
        } catch (err) {
            console.error('Error fetching center rooms:', err);
            setError(err.response?.data?.message || 'Không thể tải danh sách phòng học');
            setRooms([]);
        } finally {
            setLoading(false);
        }
    }, [centerId]);

    // Auto fetch on mount
    useEffect(() => {
        fetchRooms();
    }, [fetchRooms]);

    // Get stats
    const stats = useMemo(() => ({
        total: rooms.length,
        active: rooms.filter(r => r.status === 'active').length,
        maintenance: rooms.filter(r => r.status === 'maintenance').length,
        totalCapacity: rooms.reduce((sum, r) => sum + (r.capacity || 0), 0),
        byType: {
            standard: rooms.filter(r => r.room_type === 'standard').length,
            lab: rooms.filter(r => r.room_type === 'lab').length,
            vip: rooms.filter(r => r.room_type === 'vip').length
        }
    }), [rooms]);

    return {
        rooms,
        stats,
        loading,
        error,
        refetch: fetchRooms
    };
}

export default useCenterRooms;
