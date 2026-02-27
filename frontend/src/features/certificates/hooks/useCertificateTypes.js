/**
 * useCertificateTypes Hook - Quản lý loại chứng chỉ
 */

import { useState, useCallback } from 'react';
import axios from 'axios';
import { supabase } from '@/lib/supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
        throw new Error('Chưa đăng nhập');
    }
    return { Authorization: `Bearer ${session.access_token}` };
};

export function useCertificateTypes() {
    const [certificateTypes, setCertificateTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [typeDetail, setTypeDetail] = useState(null);

    // Fetch all certificate types with optional stats
    const fetchCertificateTypes = useCallback(async (filters = {}) => {
        try {
            setLoading(true);
            const headers = await getAuthHeaders();
            const params = new URLSearchParams();

            if (filters.category) params.append('category', filters.category);
            if (filters.is_external !== undefined) params.append('is_external', filters.is_external);
            if (filters.is_internal !== undefined) params.append('is_internal', filters.is_internal);
            if (filters.include_stats) params.append('include_stats', 'true');

            const response = await axios.get(
                `${API_URL}/api/admin/certificate-types?${params}`,
                { headers }
            );

            if (response.data?.success) {
                setCertificateTypes(response.data.data || []);
                return response.data.data;
            }
            return [];
        } catch (error) {
            console.error('Error fetching certificate types:', error);
            setCertificateTypes([]);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch certificate type detail with certificates list
    const fetchTypeDetail = useCallback(async (typeId, page = 1, limit = 20) => {
        try {
            setLoading(true);
            const headers = await getAuthHeaders();
            const params = new URLSearchParams();
            params.append('page', page);
            params.append('limit', limit);

            const response = await axios.get(
                `${API_URL}/api/admin/certificate-types/${typeId}?${params}`,
                { headers }
            );

            if (response.data?.success) {
                setTypeDetail(response.data.data);
                return response.data.data;
            }
            return null;
        } catch (error) {
            console.error('Error fetching certificate type detail:', error);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // Create new certificate type
    const createCertificateType = useCallback(async (data) => {
        const headers = await getAuthHeaders();
        const response = await axios.post(
            `${API_URL}/api/admin/certificate-types`,
            data,
            { headers }
        );

        if (response.data?.success) {
            setCertificateTypes(prev => [...prev, response.data.data]);
            return response.data.data;
        }
        throw new Error(response.data?.message || 'Có lỗi xảy ra khi tạo loại chứng chỉ');
    }, []);

    // Update certificate type
    const updateCertificateType = useCallback(async (typeId, data) => {
        const headers = await getAuthHeaders();
        const response = await axios.put(
            `${API_URL}/api/admin/certificate-types/${typeId}`,
            data,
            { headers }
        );

        if (response.data?.success) {
            setCertificateTypes(prev => prev.map(t =>
                t.id === typeId ? response.data.data : t
            ));
            return response.data.data;
        }
        throw new Error(response.data?.message || 'Có lỗi xảy ra khi cập nhật');
    }, []);

    // Delete certificate type
    const deleteCertificateType = useCallback(async (typeId) => {
        const headers = await getAuthHeaders();
        const response = await axios.delete(
            `${API_URL}/api/admin/certificate-types/${typeId}`,
            { headers }
        );

        if (response.data?.success) {
            setCertificateTypes(prev => prev.filter(t => t.id !== typeId));
            return true;
        }
        throw new Error(response.data?.message || 'Có lỗi xảy ra khi xóa');
    }, []);

    // Helper: Get category label
    const getCategoryLabel = (category) => {
        const labels = {
            language: 'Ngoại ngữ',
            office: 'Tin học văn phòng',
            programming: 'Lập trình',
            soft_skill: 'Kỹ năng mềm',
            other: 'Khác'
        };
        return labels[category] || category;
    };

    // Helper: Get category color
    const getCategoryColor = (category) => {
        const colors = {
            language: 'bg-blue-100 text-blue-700',
            office: 'bg-green-100 text-green-700',
            programming: 'bg-purple-100 text-purple-700',
            soft_skill: 'bg-orange-100 text-orange-700',
            other: 'bg-gray-100 text-gray-700'
        };
        return colors[category] || colors.other;
    };

    // Helper: Format score display based on score_config
    const formatScore = (scores, scoreConfig) => {
        if (!scores || !scoreConfig) return null;

        const { type, sub_scores, labels } = scoreConfig;

        if (type === 'band') {
            // IELTS style
            const overall = scores.overall;
            const subScoreDisplay = sub_scores?.map(key =>
                `${labels?.[key] || key}: ${scores[key] || '-'}`
            ).join(' | ');
            return {
                main: `Overall ${overall}`,
                detail: subScoreDisplay
            };
        }

        if (type === 'numeric') {
            // TOEIC/MOS style
            const total = scores.total || scores.score;
            const subScoreDisplay = sub_scores?.map(key =>
                `${labels?.[key] || key}: ${scores[key] || '-'}`
            ).join(' | ');
            return {
                main: `${total}`,
                detail: subScoreDisplay
            };
        }

        if (type === 'grade') {
            return {
                main: scores.grade || '-',
                detail: null
            };
        }

        return null;
    };

    return {
        certificateTypes,
        typeDetail,
        loading,
        fetchCertificateTypes,
        fetchTypeDetail,
        createCertificateType,
        updateCertificateType,
        deleteCertificateType,
        getCategoryLabel,
        getCategoryColor,
        formatScore,
    };
}

export default useCertificateTypes;
