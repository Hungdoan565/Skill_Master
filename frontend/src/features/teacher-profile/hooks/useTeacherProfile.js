import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useTeacherProfile() {
    const { session } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
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

    const updateProfile = useCallback(async (updates) => {
        if (!session?.access_token) return { success: false, message: 'Chưa đăng nhập' };

        try {
            setSaving(true);
            setError(null);

            const response = await fetch(`${API}/api/teacher/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Không thể cập nhật hồ sơ');
            }

            // Merge updated fields into current profile
            setProfile(prev => prev ? { ...prev, ...data.data } : data.data);
            return { success: true, message: data.message || 'Cập nhật thành công' };
        } catch (err) {
            setError(err.message);
            return { success: false, message: err.message };
        } finally {
            setSaving(false);
        }
    }, [session]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    return { profile, loading, saving, error, refetch: fetchProfile, updateProfile };
}
