/**
 * useCertificates Hook - Quản lý chứng chỉ
 */

import { useState, useCallback } from 'react';
import axios from 'axios';
import { supabase } from '@/lib/supabaseClient';
import { API_URL } from '../utils';

const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
        throw new Error('Chưa đăng nhập');
    }
    return { Authorization: `Bearer ${session.access_token}` };
};

export function useCertificates() {
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);

    // Fetch certificates
    const fetchCertificates = useCallback(async (filters = {}) => {
        try {
            setLoading(true);
            const headers = await getAuthHeaders();
            const params = new URLSearchParams();

            if (filters.status) params.append('status', filters.status);
            if (filters.courseId) params.append('course_id', filters.courseId);
            if (filters.studentId) params.append('student_id', filters.studentId);
            if (filters.centerId) params.append('center_id', filters.centerId);

            const response = await axios.get(
                `${API_URL}/api/admin/certificates?${params}`,
                { headers }
            );

            if (response.data?.success) {
                setCertificates(response.data.data || []);
                return response.data.data;
            }
            return [];
        } catch (error) {
            console.error('Error fetching certificates:', error);
            // Return mock data for development
            const mockData = [
                {
                    id: '1',
                    certificate_number: 'CERT-2024-ABC123',
                    student_id: '1',
                    students: { full_name: 'Nguyễn Văn A', email: 'nguyenvana@email.com' },
                    course_id: '1',
                    courses: { title: 'Lập trình Web cơ bản', code: 'WEB101' },
                    class_id: '1',
                    classes: { name: 'WEB101-01' },
                    grade: 'good',
                    final_score: 8.5,
                    issued_date: new Date().toISOString(),
                    status: 'issued',
                    created_at: new Date().toISOString(),
                },
                {
                    id: '2',
                    certificate_number: 'CERT-2024-DEF456',
                    student_id: '2',
                    students: { full_name: 'Trần Thị B', email: 'tranthib@email.com' },
                    course_id: '2',
                    courses: { title: 'JavaScript nâng cao', code: 'JS201' },
                    class_id: '2',
                    classes: { name: 'JS201-01' },
                    grade: 'excellent',
                    final_score: 9.2,
                    issued_date: new Date().toISOString(),
                    status: 'issued',
                    created_at: new Date().toISOString(),
                },
                {
                    id: '3',
                    certificate_number: 'CERT-2024-GHI789',
                    student_id: '3',
                    students: { full_name: 'Lê Văn C', email: 'levanc@email.com' },
                    course_id: '1',
                    courses: { title: 'Lập trình Web cơ bản', code: 'WEB101' },
                    class_id: '1',
                    classes: { name: 'WEB101-01' },
                    grade: 'fair',
                    final_score: 7.5,
                    issued_date: null,
                    status: 'draft',
                    created_at: new Date().toISOString(),
                },
            ];
            setCertificates(mockData);
            return mockData;
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch students for selection
    const fetchStudents = useCallback(async (centerId = null) => {
        try {
            const headers = await getAuthHeaders();
            const params = new URLSearchParams();
            if (centerId) params.append('center_id', centerId);

            const response = await axios.get(
                `${API_URL}/api/admin/students?${params}`,
                { headers }
            );

            if (response.data?.success) {
                setStudents(response.data.data || []);
                return response.data.data;
            }
            return [];
        } catch (error) {
            console.error('Error fetching students:', error);
            return [];
        }
    }, []);

    // Fetch courses for selection
    const fetchCourses = useCallback(async (centerId = null) => {
        try {
            const headers = await getAuthHeaders();
            const params = new URLSearchParams();
            if (centerId) params.append('center_id', centerId);

            const response = await axios.get(
                `${API_URL}/api/courses?${params}`,
                { headers }
            );

            if (response.data?.success) {
                setCourses(response.data.data || []);
                return response.data.data;
            }
            return [];
        } catch (error) {
            console.error('Error fetching courses:', error);
            return [];
        }
    }, []);

    // Create certificate
    const createCertificate = useCallback(async (data) => {
        const headers = await getAuthHeaders();
        const response = await axios.post(
            `${API_URL}/api/admin/certificates`,
            data,
            { headers }
        );

        if (response.data?.success) {
            return response.data.data;
        }
        throw new Error(response.data?.message || 'Có lỗi xảy ra khi tạo chứng chỉ');
    }, []);

    // Issue certificate (change status to issued)
    const issueCertificate = useCallback(async (certificateId) => {
        const headers = await getAuthHeaders();
        const response = await axios.patch(
            `${API_URL}/api/admin/certificates/${certificateId}/issue`,
            {},
            { headers }
        );

        if (response.data?.success) {
            setCertificates(prev => prev.map(c =>
                c.id === certificateId
                    ? { ...c, status: 'issued', issued_date: new Date().toISOString() }
                    : c
            ));
            return response.data.data;
        }
        throw new Error(response.data?.message || 'Có lỗi xảy ra');
    }, []);

    // Revoke certificate
    const revokeCertificate = useCallback(async (certificateId, reason = '') => {
        const headers = await getAuthHeaders();
        const response = await axios.patch(
            `${API_URL}/api/admin/certificates/${certificateId}/revoke`,
            { reason },
            { headers }
        );

        if (response.data?.success) {
            setCertificates(prev => prev.map(c =>
                c.id === certificateId ? { ...c, status: 'revoked' } : c
            ));
            return response.data.data;
        }
        throw new Error(response.data?.message || 'Có lỗi xảy ra');
    }, []);

    // Delete certificate
    const deleteCertificate = useCallback(async (certificateId) => {
        const headers = await getAuthHeaders();
        const response = await axios.delete(
            `${API_URL}/api/admin/certificates/${certificateId}`,
            { headers }
        );

        if (response.data?.success) {
            setCertificates(prev => prev.filter(c => c.id !== certificateId));
            return true;
        }
        throw new Error(response.data?.message || 'Có lỗi xảy ra khi xóa');
    }, []);

    // Fetch eligible students (completed enrollment, no certificate yet)
    const fetchEligibleStudents = useCallback(async (centerId = null) => {
        try {
            const headers = await getAuthHeaders();
            const params = new URLSearchParams();
            if (centerId) params.append('center_id', centerId);

            const response = await axios.get(
                `${API_URL}/api/admin/certificates/eligible-students?${params}`,
                { headers }
            );

            if (response.data?.success) {
                return response.data.data || [];
            }
            return [];
        } catch (error) {
            console.error('Error fetching eligible students:', error);
            return [];
        }
    }, []);

    // Bulk issue certificates for a class
    const bulkIssueCertificates = useCallback(async (classId, studentIds, options = {}) => {
        const headers = await getAuthHeaders();
        const response = await axios.post(
            `${API_URL}/api/admin/certificates/bulk`,
            {
                class_id: classId,
                student_ids: studentIds,
                ...options,
            },
            { headers }
        );

        if (response.data?.success) {
            return response.data.data;
        }
        throw new Error(response.data?.message || 'Có lỗi xảy ra khi cấp chứng chỉ hàng loạt');
    }, []);

    // Filter certificates locally
    const filterCertificates = useCallback((searchTerm) => {
        if (!searchTerm) return certificates;
        const term = searchTerm.toLowerCase();
        return certificates.filter(
            (c) =>
                c.certificate_number?.toLowerCase().includes(term) ||
                c.student?.full_name?.toLowerCase().includes(term) ||
                c.course?.title?.toLowerCase().includes(term)
        );
    }, [certificates]);

    return {
        certificates,
        students,
        courses,
        loading,
        fetchCertificates,
        fetchStudents,
        fetchCourses,
        fetchEligibleStudents,
        createCertificate,
        issueCertificate,
        revokeCertificate,
        deleteCertificate,
        bulkIssueCertificates,
        filterCertificates,
    };
}

export default useCertificates;
