import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useLeaveRequests() {
    const { session } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const getHeaders = useCallback(() => {
        if (!session?.access_token) {
            throw new Error('Bạn chưa đăng nhập');
        }

        return {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
        };
    }, [session]);

    const refetch = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_URL}/api/teacher/leave-requests`, {
                headers: getHeaders()
            });
            const result = await response.json();

            if (!response.ok || !result?.success) {
                throw new Error(result?.message || 'Không thể tải danh sách đơn xin nghỉ');
            }

            setRequests(result.data || []);
        } catch (err) {
            console.error('Error fetching leave requests:', err);
            setError(err.message || 'Đã có lỗi xảy ra khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    }, [getHeaders]);

    const createLeaveRequest = useCallback(async (data) => {
        try {
            setError(null);

            const response = await fetch(`${API_URL}/api/teacher/leave-requests`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok || !result?.success) {
                throw new Error(result?.message || 'Không thể tạo đơn xin nghỉ');
            }

            await refetch();
            return { success: true, data: result.data };
        } catch (err) {
            console.error('Error creating leave request:', err);
            const message = err.message || 'Đã có lỗi xảy ra khi tạo đơn';
            setError(message);
            return { success: false, message };
        }
    }, [getHeaders, refetch]);

    const deleteLeaveRequest = useCallback(async (id) => {
        try {
            setError(null);

            const response = await fetch(`${API_URL}/api/teacher/leave-requests/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });

            const result = await response.json();

            if (!response.ok || !result?.success) {
                throw new Error(result?.message || 'Không thể xoá đơn xin nghỉ');
            }

            await refetch();
            return { success: true, data: result.data };
        } catch (err) {
            console.error('Error deleting leave request:', err);
            const message = err.message || 'Đã có lỗi xảy ra khi xoá đơn';
            setError(message);
            return { success: false, message };
        }
    }, [getHeaders, refetch]);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return {
        requests,
        loading,
        error,
        createLeaveRequest,
        deleteLeaveRequest,
        refetch
    };
}
