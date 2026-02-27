import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '@/lib/supabaseClient';

// Use standard API_URL logic from project
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
        throw new Error('Chưa đăng nhập');
    }
    return { Authorization: `Bearer ${session.access_token}` };
};

export function useStudentCertificates() {
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchCertificates = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const headers = await getAuthHeaders();
            const response = await axios.get(`${API_URL}/api/student/certificates`, { headers });
            
            if (response.data?.success) {
                // Sort by issued_date DESC
                const sortedData = (response.data.data || []).sort((a, b) => {
                    const dateA = new Date(a.issued_at || a.issued_date || 0);
                    const dateB = new Date(b.issued_at || b.issued_date || 0);
                    return dateB - dateA;
                });
                
                setCertificates(sortedData);
                return sortedData;
            }
            
            setCertificates([]);
            return [];
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Có lỗi xảy ra khi tải chứng chỉ');
            setCertificates([]);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCertificates();
    }, [fetchCertificates]);

    return {
        certificates,
        loading,
        error,
        refresh: fetchCertificates
    };
}

export default useStudentCertificates;
