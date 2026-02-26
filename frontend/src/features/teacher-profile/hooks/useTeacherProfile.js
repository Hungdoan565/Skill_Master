import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useTeacherProfile() {
    const { session } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchProfile = useCallback(async () => {
        if (!session?.access_token) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            const response = await fetch(`${API}/api/teacher/profile`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Không thể tải thông tin hồ sơ');
            }

            // Dựa vào cấu trúc response chuẩn của project: { success: true, data: {...} }
            setProfile(data.data || data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [session]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    return { profile, loading, error, refetch: fetchProfile };
}
