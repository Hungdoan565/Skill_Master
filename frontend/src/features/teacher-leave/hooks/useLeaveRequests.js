import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const ALLOWED_LEAVE_TYPES = new Set(['sick', 'personal', 'annual', 'maternity', 'compensatory', 'other']);

const parseJsonSafe = async (response) => {
    try {
        return await response.json();
    } catch {
        return null;
    }
};

const normalizeLeavePayload = (data = {}) => {
    const leave_type = typeof data.leave_type === 'string' ? data.leave_type.trim().toLowerCase() : '';
    const start_date = typeof data.start_date === 'string' ? data.start_date.trim() : '';
    const end_date = typeof data.end_date === 'string' ? data.end_date.trim() : '';
    const reason = typeof data.reason === 'string' ? data.reason.trim() : '';

    return { leave_type, start_date, end_date, reason };
};

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
            const result = await parseJsonSafe(response);

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

            const payload = normalizeLeavePayload(data);
            if (!payload.leave_type || !payload.start_date || !payload.end_date || !payload.reason) {
                const message = 'Vui lòng nhập đầy đủ thông tin đơn xin nghỉ';
                setError(message);
                return { success: false, message };
            }

            if (!ALLOWED_LEAVE_TYPES.has(payload.leave_type)) {
                const message = 'Loại nghỉ không hợp lệ';
                setError(message);
                return { success: false, message };
            }

            const response = await fetch(`${API_URL}/api/teacher/leave-requests`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(payload)
            });

            const result = await parseJsonSafe(response);

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

    const updateLeaveRequest = useCallback(async (id, data) => {
        try {
            setError(null);

            const payload = normalizeLeavePayload(data);

            // Only send non-empty fields
            const updatePayload = {};
            if (payload.leave_type) updatePayload.leave_type = payload.leave_type;
            if (payload.start_date) updatePayload.start_date = payload.start_date;
            if (payload.end_date) updatePayload.end_date = payload.end_date;
            if (payload.reason) updatePayload.reason = payload.reason;

            if (Object.keys(updatePayload).length === 0) {
                const message = 'Không có dữ liệu cần cập nhật';
                setError(message);
                return { success: false, message };
            }

            if (updatePayload.leave_type && !ALLOWED_LEAVE_TYPES.has(updatePayload.leave_type)) {
                const message = 'Loại nghỉ không hợp lệ';
                setError(message);
                return { success: false, message };
            }

            const response = await fetch(`${API_URL}/api/teacher/leave-requests/${id}`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify(updatePayload)
            });

            const result = await parseJsonSafe(response);

            if (!response.ok || !result?.success) {
                throw new Error(result?.message || 'Không thể cập nhật đơn xin nghỉ');
            }

            await refetch();
            return { success: true, data: result.data };
        } catch (err) {
            console.error('Error updating leave request:', err);
            const message = err.message || 'Đã có lỗi xảy ra khi cập nhật đơn';
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

            const result = await parseJsonSafe(response);

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
        updateLeaveRequest,
        deleteLeaveRequest,
        refetch
    };
}
