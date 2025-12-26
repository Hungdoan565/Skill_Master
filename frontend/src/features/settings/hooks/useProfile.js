/**
 * useProfile Hook - Quản lý profile user
 */

import { useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/auth-context';
import { API_URL } from '../utils/constants';

export function useProfile() {
    const { session, profile: authProfile, refreshProfile, setProfile: setProfileContext } = useAuth();
    const [profile, setProfile] = useState(authProfile);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // Get auth headers
    const getHeaders = useCallback(() => ({
        headers: {
            Authorization: `Bearer ${session?.access_token}`
        }
    }), [session]);

    // Fetch profile
    const fetchProfile = useCallback(async () => {
        if (!session?.access_token) return;

        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(
                `${API_URL}/api/users/me/profile`,
                getHeaders()
            );

            if (response.data?.success) {
                setProfile(response.data.data);
                return response.data.data;
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
            setError(err.response?.data?.message || 'Không thể tải thông tin');
        } finally {
            setLoading(false);
        }
    }, [session, getHeaders]);

    // Update profile
    const updateProfile = useCallback(async (data) => {
        if (!session?.access_token) {
            return { success: false, message: 'Chưa đăng nhập' };
        }

        setSaving(true);
        try {
            const response = await axios.put(
                `${API_URL}/api/users/me/profile`,
                data,
                getHeaders()
            );

            if (response.data?.success) {
                setProfile(response.data.data);
                // Refresh auth context profile
                if (refreshProfile) {
                    await refreshProfile();
                }
                return { success: true, message: 'Cập nhật thành công' };
            }
            return { success: false, message: response.data?.message || 'Lỗi không xác định' };
        } catch (err) {
            console.error('Error updating profile:', err);
            return {
                success: false,
                message: err.response?.data?.message || 'Không thể cập nhật thông tin'
            };
        } finally {
            setSaving(false);
        }
    }, [session, getHeaders, refreshProfile]);

    // Change password
    const changePassword = useCallback(async (currentPassword, newPassword) => {
        if (!session?.access_token) {
            return { success: false, message: 'Chưa đăng nhập' };
        }

        if (!currentPassword || !newPassword) {
            return { success: false, message: 'Vui lòng nhập đầy đủ mật khẩu' };
        }

        if (newPassword.length < 6) {
            return { success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' };
        }

        setSaving(true);
        try {
            const response = await axios.put(
                `${API_URL}/api/users/me/password`,
                { currentPassword, newPassword },
                getHeaders()
            );

            if (response.data?.success) {
                return { success: true, message: 'Đổi mật khẩu thành công' };
            }
            return { success: false, message: response.data?.message || 'Lỗi không xác định' };
        } catch (err) {
            console.error('Error changing password:', err);
            return {
                success: false,
                message: err.response?.data?.message || 'Không thể đổi mật khẩu'
            };
        } finally {
            setSaving(false);
        }
    }, [session, getHeaders]);

    // Upload avatar
    const uploadAvatar = useCallback(async (base64Image) => {
        if (!session?.access_token) {
            return { success: false, message: 'Chưa đăng nhập' };
        }

        setSaving(true);
        try {
            const response = await axios.post(
                `${API_URL}/api/users/me/avatar`,
                { avatar_base64: base64Image },
                getHeaders()
            );

            if (response.data?.success) {
                const newAvatarUrl = response.data.data.avatar_url;

                // 1. Update local hook state
                setProfile(prev => ({ ...prev, avatar_url: newAvatarUrl }));

                // 2. Update auth context state directly for immediate UI sync
                if (setProfileContext) {
                    setProfileContext(prev => ({ ...prev, avatar_url: newAvatarUrl }));
                }

                // 3. Optional: Refresh auth context via re-fetch for absolute consistency
                if (refreshProfile) {
                    await refreshProfile();
                }

                return { success: true, avatarUrl: newAvatarUrl };
            }
            return { success: false, message: response.data?.message || 'Lỗi không xác định' };
        } catch (err) {
            console.error('Error uploading avatar:', err);
            return {
                success: false,
                message: err.response?.data?.message || 'Không thể upload ảnh'
            };
        } finally {
            setSaving(false);
        }
    }, [session, getHeaders, refreshProfile]);

    return {
        profile,
        loading,
        saving,
        error,
        fetchProfile,
        updateProfile,
        changePassword,
        uploadAvatar
    };
}

export default useProfile;
