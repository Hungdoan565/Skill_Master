/**
 * useHolidays Hook - Quản lý ngày lễ
 */

import { useState, useCallback } from 'react';
import axios from 'axios';
import { supabase } from '@/lib/supabaseClient';

/**
 * Get auth headers from Supabase session
 */
const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
        throw new Error('Chưa đăng nhập');
    }
    return { Authorization: `Bearer ${session.access_token}` };
};

export function useHolidays() {
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch holidays list
    const fetchHolidays = useCallback(async (filters = {}) => {
        try {
            setLoading(true);
            setError(null);
            const headers = await getAuthHeaders();

            const params = new URLSearchParams();
            if (filters.year) params.append('year', filters.year);
            if (filters.month) params.append('month', filters.month);
            if (filters.from) params.append('from', filters.from);
            if (filters.to) params.append('to', filters.to);

            const response = await axios.get(
                `/api/admin/holidays?${params}`,
                { headers }
            );

            if (response.data?.success) {
                setHolidays(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching holidays:', err);
            setError(err.message);
            setHolidays([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch single holiday
    const fetchHoliday = useCallback(async (id) => {
        try {
            const headers = await getAuthHeaders();
            const response = await axios.get(`/api/admin/holidays/${id}`, { headers });
            
            if (response.data?.success) {
                return response.data.data;
            }
            return null;
        } catch (err) {
            console.error('Error fetching holiday:', err);
            throw err;
        }
    }, []);

    // Create holiday
    const createHoliday = useCallback(async (data) => {
        try {
            const headers = await getAuthHeaders();
            const response = await axios.post('/api/admin/holidays', data, { headers });
            
            if (response.data?.success) {
                return { success: true, data: response.data.data };
            }
            return { success: false, error: 'Có lỗi xảy ra' };
        } catch (err) {
            console.error('Error creating holiday:', err);
            return { 
                success: false, 
                error: err.response?.data?.message || err.message 
            };
        }
    }, []);

    // Update holiday
    const updateHoliday = useCallback(async (id, data) => {
        try {
            const headers = await getAuthHeaders();
            const response = await axios.put(`/api/admin/holidays/${id}`, data, { headers });
            
            if (response.data?.success) {
                return { success: true, data: response.data.data };
            }
            return { success: false, error: 'Có lỗi xảy ra' };
        } catch (err) {
            console.error('Error updating holiday:', err);
            return { 
                success: false, 
                error: err.response?.data?.message || err.message 
            };
        }
    }, []);

    // Delete holiday
    const deleteHoliday = useCallback(async (id) => {
        try {
            const headers = await getAuthHeaders();
            const response = await axios.delete(`/api/admin/holidays/${id}`, { headers });
            
            if (response.data?.success) {
                return { success: true };
            }
            return { success: false, error: 'Có lỗi xảy ra' };
        } catch (err) {
            console.error('Error deleting holiday:', err);
            return { 
                success: false, 
                error: err.response?.data?.message || err.message 
            };
        }
    }, []);

    return {
        holidays,
        loading,
        error,
        fetchHolidays,
        fetchHoliday,
        createHoliday,
        updateHoliday,
        deleteHoliday,
    };
}

export default useHolidays;
