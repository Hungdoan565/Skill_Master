/**
 * useDocuments Hook - Quản lý tài liệu
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

export function useDocuments() {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [courses, setCourses] = useState([]);
    const [classes, setClasses] = useState([]);

    // Fetch documents
    const fetchDocuments = useCallback(async (filters = {}) => {
        try {
            setLoading(true);
            const headers = await getAuthHeaders();
            const params = new URLSearchParams();

            if (filters.type) params.append('type', filters.type);
            if (filters.courseId) params.append('course_id', filters.courseId);
            if (filters.classId) params.append('class_id', filters.classId);
            if (filters.centerId) params.append('center_id', filters.centerId);

            const response = await axios.get(
                `${API_URL}/api/admin/documents?${params}`,
                { headers }
            );

            if (response.data?.success) {
                setDocuments(response.data.data || []);
                return response.data.data;
            }
            return [];
        } catch (error) {
            console.error('Error fetching documents:', error);
            // Return mock data for development
            const mockData = [
                {
                    id: '1',
                    title: 'Bài giảng Tuần 1 - Giới thiệu khóa học',
                    description: 'Tổng quan về nội dung và mục tiêu khóa học',
                    type: 'lesson',
                    file_url: '#',
                    file_name: 'bai-giang-tuan-1.pdf',
                    file_size: 2500000,
                    course_id: '1',
                    courses: { title: 'Lập trình Web cơ bản' },
                    uploaded_by: { full_name: 'Nguyễn Văn A' },
                    created_at: new Date().toISOString(),
                    download_count: 45,
                },
                {
                    id: '2',
                    title: 'Bài tập thực hành HTML/CSS',
                    description: 'Bài tập tạo trang web đơn giản',
                    type: 'exercise',
                    file_url: '#',
                    file_name: 'bai-tap-html-css.docx',
                    file_size: 150000,
                    course_id: '1',
                    courses: { title: 'Lập trình Web cơ bản' },
                    uploaded_by: { full_name: 'Nguyễn Văn A' },
                    created_at: new Date().toISOString(),
                    download_count: 32,
                },
                {
                    id: '3',
                    title: 'Video hướng dẫn JavaScript',
                    description: 'Các khái niệm cơ bản về JavaScript',
                    type: 'video',
                    file_url: '#',
                    file_name: 'javascript-basics.mp4',
                    file_size: 125000000,
                    course_id: '2',
                    courses: { title: 'JavaScript nâng cao' },
                    uploaded_by: { full_name: 'Trần Thị B' },
                    created_at: new Date().toISOString(),
                    download_count: 78,
                },
            ];
            setDocuments(mockData);
            return mockData;
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch courses for filter
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

    // Fetch classes for filter
    const fetchClasses = useCallback(async (centerId = null) => {
        try {
            const headers = await getAuthHeaders();
            const params = new URLSearchParams();
            if (centerId) params.append('centerId', centerId);

            const response = await axios.get(
                `${API_URL}/api/classes?${params}`,
                { headers }
            );

            if (response.data?.success) {
                setClasses(response.data.data || []);
                return response.data.data;
            }
            return [];
        } catch (error) {
            console.error('Error fetching classes:', error);
            return [];
        }
    }, []);

    // Upload document
    const uploadDocument = useCallback(async (data, file) => {
        if (!file) {
            throw new Error('File là bắt buộc');
        }

        try {
            // 1. Upload file to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `documents/${fileName}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('document')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.error('Storage upload error:', uploadError);
                throw new Error('Không thể tải file lên storage: ' + uploadError.message);
            }

            // 2. Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('document')
                .getPublicUrl(filePath);

            // 3. Create document record with file metadata
            const headers = await getAuthHeaders();
            const response = await axios.post(
                `${API_URL}/api/admin/documents`,
                {
                    ...data,
                    file_url: publicUrl,
                    file_name: file.name,
                    file_size: file.size,
                    file_type: file.type,
                },
                { headers }
            );

            if (response.data?.success) {
                return response.data.data;
            }
            throw new Error(response.data?.message || 'Có lỗi xảy ra khi tạo document record');
        } catch (error) {
            console.error('Error uploading document:', error);
            throw error;
        }
    }, []);

    // Update document
    const updateDocument = useCallback(async (documentId, data) => {
        const headers = await getAuthHeaders();
        const response = await axios.put(
            `${API_URL}/api/admin/documents/${documentId}`,
            data,
            { headers }
        );

        if (response.data?.success) {
            setDocuments(prev => prev.map(d =>
                d.id === documentId ? { ...d, ...response.data.data } : d
            ));
            return response.data.data;
        }
        throw new Error(response.data?.message || 'Có lỗi xảy ra');
    }, []);

    // Delete document
    const deleteDocument = useCallback(async (documentId) => {
        const headers = await getAuthHeaders();
        const response = await axios.delete(
            `${API_URL}/api/admin/documents/${documentId}`,
            { headers }
        );

        if (response.data?.success) {
            setDocuments(prev => prev.filter(d => d.id !== documentId));
            return true;
        }
        throw new Error(response.data?.message || 'Có lỗi xảy ra khi xóa');
    }, []);

    // Filter documents locally
    const filterDocuments = useCallback((searchTerm) => {
        if (!searchTerm) return documents;
        const term = searchTerm.toLowerCase();
        return documents.filter(
            (d) =>
                d.title?.toLowerCase().includes(term) ||
                d.description?.toLowerCase().includes(term) ||
                d.courses?.title?.toLowerCase().includes(term)
        );
    }, [documents]);

    return {
        documents,
        courses,
        classes,
        loading,
        fetchDocuments,
        fetchCourses,
        fetchClasses,
        uploadDocument,
        updateDocument,
        deleteDocument,
        filterDocuments,
    };
}

export default useDocuments;
