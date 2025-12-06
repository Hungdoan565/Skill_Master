/**
 * useSettings Hook - Quản lý system settings
 */

import { useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/auth-context';
import { API_URL, SETTING_KEYS } from '../utils/constants';

export function useSettings() {
    const { session } = useAuth();
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // Get auth headers
    const getHeaders = useCallback(() => ({
        headers: {
            Authorization: `Bearer ${session?.access_token}`
        }
    }), [session]);

    // Fetch all settings
    const fetchSettings = useCallback(async (centerId = null) => {
        if (!session?.access_token) return;

        setLoading(true);
        setError(null);

        try {
            const params = centerId ? `?centerId=${centerId}` : '';
            const response = await axios.get(
                `${API_URL}/api/admin/settings${params}`,
                getHeaders()
            );

            if (response.data?.success) {
                // Convert array to object keyed by setting key
                const settingsMap = {};
                response.data.data.settings?.forEach(s => {
                    settingsMap[s.key] = s.value;
                });
                setSettings(settingsMap);
                return settingsMap;
            }
        } catch (err) {
            console.error('Error fetching settings:', err);
            setError(err.response?.data?.message || 'Không thể tải cấu hình');
        } finally {
            setLoading(false);
        }
    }, [session, getHeaders]);

    // Fetch single setting
    const fetchSetting = useCallback(async (key, centerId = null) => {
        if (!session?.access_token) return null;

        try {
            const params = centerId ? `?centerId=${centerId}` : '';
            const response = await axios.get(
                `${API_URL}/api/admin/settings/${key}${params}`,
                getHeaders()
            );

            if (response.data?.success) {
                return response.data.data.value;
            }
        } catch (err) {
            console.error(`Error fetching setting ${key}:`, err);
            return null;
        }
    }, [session, getHeaders]);

    // Update setting
    const updateSetting = useCallback(async (key, value, scope = 'global', centerId = null) => {
        if (!session?.access_token) {
            return { success: false, message: 'Chưa đăng nhập' };
        }

        setSaving(true);
        try {
            const response = await axios.put(
                `${API_URL}/api/admin/settings/${key}`,
                { value, scope, centerId },
                getHeaders()
            );

            if (response.data?.success) {
                // Update local state
                setSettings(prev => ({
                    ...prev,
                    [key]: value
                }));
                return { success: true, message: 'Cập nhật thành công' };
            }
            return { success: false, message: response.data?.message || 'Lỗi không xác định' };
        } catch (err) {
            console.error(`Error updating setting ${key}:`, err);
            return {
                success: false,
                message: err.response?.data?.message || 'Không thể cập nhật cấu hình'
            };
        } finally {
            setSaving(false);
        }
    }, [session, getHeaders]);

    // Reset setting to global
    const resetSetting = useCallback(async (key, centerId = null) => {
        if (!session?.access_token) {
            return { success: false, message: 'Chưa đăng nhập' };
        }

        setSaving(true);
        try {
            const params = centerId ? `?centerId=${centerId}` : '';
            const response = await axios.delete(
                `${API_URL}/api/admin/settings/${key}${params}`,
                getHeaders()
            );

            if (response.data?.success) {
                // Refetch to get global value
                await fetchSettings(centerId);
                return { success: true, message: 'Đã reset về mặc định' };
            }
            return { success: false, message: response.data?.message || 'Lỗi không xác định' };
        } catch (err) {
            console.error(`Error resetting setting ${key}:`, err);
            return {
                success: false,
                message: err.response?.data?.message || 'Không thể reset cấu hình'
            };
        } finally {
            setSaving(false);
        }
    }, [session, getHeaders, fetchSettings]);

    // Helper getters
    const getBankConfig = useCallback(() => settings[SETTING_KEYS.BANK_CONFIG] || {}, [settings]);
    const getGradeConfig = useCallback(() => settings[SETTING_KEYS.GRADE_CONFIG] || {}, [settings]);
    const getPayrollConfig = useCallback(() => settings[SETTING_KEYS.PAYROLL_CONFIG] || {}, [settings]);
    const getSystemConfig = useCallback(() => settings[SETTING_KEYS.SYSTEM_CONFIG] || {}, [settings]);
    const getSecurityConfig = useCallback(() => settings[SETTING_KEYS.SECURITY_CONFIG] || {}, [settings]);

    return {
        settings,
        loading,
        saving,
        error,
        fetchSettings,
        fetchSetting,
        updateSetting,
        resetSetting,
        getBankConfig,
        getGradeConfig,
        getPayrollConfig,
        getSystemConfig,
        getSecurityConfig
    };
}

export default useSettings;
