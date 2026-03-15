/**
 * usePayroll Hook - Quản lý bảng lương
 */

import { useState, useCallback } from 'react';
import axios from 'axios';
import { supabase } from '@/lib/supabaseClient';
import { API_URL } from '../utils';

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

export function usePayroll() {
    const [payrolls, setPayrolls] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch payrolls list
    const fetchPayrolls = useCallback(async (filters = {}) => {
        try {
            setLoading(true);
            const headers = await getAuthHeaders();

            const params = new URLSearchParams();
            if (filters.month) params.append('month', filters.month);
            if (filters.year) params.append('year', filters.year);
            if (filters.status) params.append('status', filters.status);
            if (filters.teacher_id) params.append('teacher_id', filters.teacher_id);

            const response = await axios.get(
                `${API_URL}/api/admin/payroll?${params}`,
                { headers }
            );

            if (response.data?.success) {
                setPayrolls(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching payrolls:', error);
            setPayrolls([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch payroll stats
    const fetchStats = useCallback(async (month, year) => {
        try {
            const headers = await getAuthHeaders();
            const params = new URLSearchParams();
            if (month) params.append('month', month);
            if (year) params.append('year', year);

            const response = await axios.get(
                `${API_URL}/api/admin/payroll/stats?${params}`,
                { headers }
            );

            if (response.data?.success) {
                setStats(response.data.data);
                return response.data.data;
            }
        } catch (error) {
            console.error('Error fetching payroll stats:', error);
        }
        return null;
    }, []);

    // Fetch teachers with monthly stats
    const fetchTeachers = useCallback(async (month, year) => {
        try {
            const headers = await getAuthHeaders();
            const params = new URLSearchParams();
            if (month) params.append('month', month);
            if (year) params.append('year', year);

            const response = await axios.get(
                `${API_URL}/api/admin/payroll/teachers?${params}`,
                { headers }
            );

            if (response.data?.success) {
                setTeachers(response.data.data);
                return response.data.data;
            }
        } catch (error) {
            console.error('Error fetching teachers:', error);
            setTeachers([]);
        }
        return [];
    }, []);

    // Generate payroll for a teacher
    const generatePayroll = useCallback(async (data) => {
        const headers = await getAuthHeaders();
        const response = await axios.post(
            `${API_URL}/api/admin/payroll/generate`,
            data,
            { headers }
        );

        if (response.data?.success) {
            return response.data.data;
        }

        throw new Error(response.data?.message || 'Có lỗi xảy ra');
    }, []);

    // Get payroll detail
    const fetchPayrollDetail = useCallback(async (payrollId) => {
        const headers = await getAuthHeaders();
        const response = await axios.get(
            `${API_URL}/api/admin/payroll/${payrollId}`,
            { headers }
        );

        if (response.data?.success) {
            return response.data.data;
        }

        throw new Error(response.data?.message || 'Không thể tải chi tiết bảng lương');
    }, []);

    // Update payroll (bonus, deduction, notes)
    const updatePayroll = useCallback(async (payrollId, data) => {
        const headers = await getAuthHeaders();
        const response = await axios.put(
            `${API_URL}/api/admin/payroll/${payrollId}`,
            data,
            { headers }
        );

        if (response.data?.success) {
            setPayrolls(prev => prev.map(p =>
                p.id === payrollId ? response.data.data : p
            ));
            return response.data.data;
        }

        throw new Error(response.data?.message || 'Có lỗi xảy ra');
    }, []);

    // Update payroll status
    const updatePayrollStatus = useCallback(async (payrollId, status) => {
        const headers = await getAuthHeaders();
        const response = await axios.patch(
            `${API_URL}/api/admin/payroll/${payrollId}/status`,
            { status },
            { headers }
        );

        if (response.data?.success) {
            setPayrolls(prev => prev.map(p =>
                p.id === payrollId ? response.data.data : p
            ));
            return response.data.data;
        }

        throw new Error(response.data?.message || 'Có lỗi xảy ra');
    }, []);

    // Delete payroll (draft only)
    const deletePayroll = useCallback(async (payrollId) => {
        const headers = await getAuthHeaders();
        const response = await axios.delete(
            `${API_URL}/api/admin/payroll/${payrollId}`,
            { headers }
        );

        if (response.data?.success) {
            setPayrolls(prev => prev.filter(p => p.id !== payrollId));
            return true;
        }

        throw new Error(response.data?.message || 'Có lỗi xảy ra');
    }, []);

    // Bulk generate payroll for multiple teachers
    const bulkGeneratePayroll = useCallback(async (data) => {
        const headers = await getAuthHeaders();
        const response = await axios.post(
            `${API_URL}/api/admin/payroll/bulk-generate`,
            data,
            { headers }
        );

        if (response.data?.success) {
            return response.data;
        }

        throw new Error(response.data?.message || 'Có lỗi xảy ra');
    }, []);

    // Export payroll to Excel (.xlsx)
    const exportPayroll = useCallback(async (month, year) => {
        const headers = await getAuthHeaders();

        const response = await axios.get(
            `${API_URL}/api/admin/payroll/export?month=${month}&year=${year}`,
            {
                headers,
                responseType: 'blob'
            }
        );

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `BangLuong_T${month}_${year}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        return true;
    }, []);

    // Fetch audit trail for a payroll
    const fetchAuditTrail = useCallback(async (payrollId) => {
        const headers = await getAuthHeaders();
        const response = await axios.get(
            `${API_URL}/api/admin/payroll/${payrollId}/audit`,
            { headers }
        );

        if (response.data?.success) {
            return response.data.data;
        }

        return [];
    }, []);

    // Submit payment proof and mark as paid
    const submitPaymentProof = useCallback(async (payrollId, data) => {
        const headers = await getAuthHeaders();
        const response = await axios.post(
            `${API_URL}/api/admin/payroll/${payrollId}/payment-proof`,
            data,
            { headers }
        );

        if (response.data?.success) {
            setPayrolls(prev => prev.map(p =>
                p.id === payrollId ? response.data.data : p
            ));
            return response.data.data;
        }

        throw new Error(response.data?.message || 'Có lỗi xảy ra');
    }, []);

    // Submit dispute (for teachers)
    const submitDispute = useCallback(async (payrollId, data) => {
        const headers = await getAuthHeaders();
        const response = await axios.post(
            `${API_URL}/api/teacher/payroll/${payrollId}/dispute`,
            data,
            { headers }
        );

        if (response.data?.success) {
            return response.data.data;
        }

        throw new Error(response.data?.message || 'Có lỗi xảy ra');
    }, []);

    // Get disputes for a payroll (for teachers)
    const fetchPayrollDisputes = useCallback(async (payrollId) => {
        const headers = await getAuthHeaders();
        const response = await axios.get(
            `${API_URL}/api/teacher/payroll/${payrollId}/disputes`,
            { headers }
        );

        if (response.data?.success) {
            return response.data.data;
        }

        return [];
    }, []);

    return {
        payrolls,
        teachers,
        stats,
        loading,
        fetchPayrolls,
        fetchStats,
        fetchTeachers,
        generatePayroll,
        bulkGeneratePayroll,
        fetchPayrollDetail,
        updatePayroll,
        updatePayrollStatus,
        deletePayroll,
        exportPayroll,
        fetchAuditTrail,
        submitPaymentProof,
        submitDispute,
        fetchPayrollDisputes,
    };
}

export default usePayroll;
