import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const parseJsonSafe = async (response) => {
    try {
        return await response.json();
    } catch {
        return null;
    }
};

export function useTeacherProfile() {
    const { session, setProfile: setAuthProfile, refreshProfile } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const withAvatarVersion = (url, versionToken = Date.now()) => {
        if (!url || typeof url !== 'string') return null;

        const [rawBase, hash = ''] = url.split('#');
        const [path, query = ''] = rawBase.split('?');
        const params = new URLSearchParams(query);
        params.set('v', String(versionToken));

        const queryString = params.toString();
        return `${path}${queryString ? `?${queryString}` : ''}${hash ? `#${hash}` : ''}`;
    };

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

    const uploadAvatar = useCallback(async (base64Image) => {
        if (!session?.access_token) {
            return { success: false, message: 'Chưa đăng nhập' };
        }

        if (!base64Image || typeof base64Image !== 'string') {
            return { success: false, message: 'Dữ liệu ảnh không hợp lệ' };
        }

        try {
            setSaving(true);
            setError(null);

            const response = await fetch(`${API}/api/users/me/avatar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ avatar_base64: base64Image })
            });

            const data = await parseJsonSafe(response);
            if (!response.ok || !data?.success) {
                throw new Error(data?.message || 'Không thể cập nhật ảnh đại diện');
            }

            const avatarUrl = data?.data?.avatar_url || null;
            const avatarVersionToken = Date.now();
            const cacheSafeAvatarUrl = withAvatarVersion(avatarUrl, avatarVersionToken);

            setProfile(prev => prev ? { ...prev, avatar_url: cacheSafeAvatarUrl } : prev);
            setAuthProfile(prev => prev ? { ...prev, avatar_url: cacheSafeAvatarUrl } : prev);

            // Đồng bộ profile canonical trong AuthContext để mọi widget/avatar toàn cục rerender ngay.
            const refreshedAuthProfile = await refreshProfile();
            if (refreshedAuthProfile) {
                const refreshedCacheSafeAvatarUrl = withAvatarVersion(
                    refreshedAuthProfile.avatar_url || avatarUrl,
                    avatarVersionToken
                );

                setAuthProfile(prev => ({
                    ...(prev || refreshedAuthProfile),
                    ...refreshedAuthProfile,
                    avatar_url: refreshedCacheSafeAvatarUrl
                }));
            }

            return {
                success: true,
                avatarUrl: cacheSafeAvatarUrl,
                message: data?.message || 'Cập nhật ảnh đại diện thành công'
            };
        } catch (err) {
            const message = err.message || 'Không thể cập nhật ảnh đại diện';
            setError(message);
            return { success: false, message };
        } finally {
            setSaving(false);
        }
    }, [session, setAuthProfile, refreshProfile]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    return { profile, loading, saving, error, refetch: fetchProfile, updateProfile, uploadAvatar };
}
