/**
 * NotificationPreferencesTab - Cấu hình nhận thông báo
 */

import { useState, useEffect, useCallback } from 'react';
import {
    Bell,
    Mail,
    Smartphone,
    Clock,
    Save,
    Loader2,
    Info,
    CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { DEFAULT_NOTIFICATION_PREFERENCES, API_URL } from '../utils/constants';

// Switch component inline
const Switch = ({ checked, onChange, disabled }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors
            ${checked ? 'bg-indigo-600' : 'bg-gray-200'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
    >
        <span
            className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${checked ? 'translate-x-6' : 'translate-x-1'}
            `}
        />
    </button>
);

// Notification item component
const NotificationItem = ({ icon: Icon, title, description, checked, onChange, disabled }) => (
    <div className="flex items-center justify-between py-4 border-b last:border-b-0">
        <div className="flex items-start gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
                <Icon className="w-4 h-4 text-gray-600" />
            </div>
            <div>
                <p className="font-medium text-gray-900">{title}</p>
                <p className="text-sm text-gray-500">{description}</p>
            </div>
        </div>
        <Switch checked={checked} onChange={onChange} disabled={disabled} />
    </div>
);

export function NotificationPreferencesTab({ onMessage }) {
    const { session } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [preferences, setPreferences] = useState(DEFAULT_NOTIFICATION_PREFERENCES);

    // Fetch current preferences
    const fetchPreferences = useCallback(async () => {
        if (!session?.access_token) return;

        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/api/settings/notifications`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    setPreferences(prev => ({ ...prev, ...data.data }));
                }
            }
        } catch (error) {
            console.error('Error fetching notification preferences:', error);
        } finally {
            setLoading(false);
        }
    }, [session?.access_token]);

    useEffect(() => {
        fetchPreferences();
    }, [fetchPreferences]);

    // Update preference
    const updatePreference = (key, value) => {
        setPreferences(prev => ({ ...prev, [key]: value }));
    };

    // Save preferences
    const handleSave = async () => {
        if (!session?.access_token) return;

        setSaving(true);
        try {
            const response = await fetch(`${API_URL}/api/settings/notifications`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(preferences)
            });

            if (response.ok) {
                onMessage?.('Đã lưu cài đặt thông báo', 'success');
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            console.error('Error saving preferences:', error);
            onMessage?.('Không thể lưu cài đặt', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Cài đặt thông báo</h2>
                <p className="text-gray-500 mt-1">Tùy chỉnh cách bạn nhận thông báo từ hệ thống</p>
            </div>

            {/* Email Notifications */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Mail className="w-5 h-5 text-indigo-600" />
                        <CardTitle>Thông báo qua Email</CardTitle>
                    </div>
                    <CardDescription>
                        Chọn loại email bạn muốn nhận
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-0">
                    <NotificationItem
                        icon={CheckCircle}
                        title="Ghi danh mới"
                        description="Nhận email khi có học viên ghi danh mới"
                        checked={preferences.emailNewEnrollment}
                        onChange={(v) => updatePreference('emailNewEnrollment', v)}
                    />
                    <NotificationItem
                        icon={CheckCircle}
                        title="Thanh toán thành công"
                        description="Nhận email khi có thanh toán hoàn tất"
                        checked={preferences.emailPaymentReceived}
                        onChange={(v) => updatePreference('emailPaymentReceived', v)}
                    />
                    <NotificationItem
                        icon={Clock}
                        title="Nhắc thanh toán"
                        description="Nhận email nhắc nhở thanh toán"
                        checked={preferences.emailPaymentReminder}
                        onChange={(v) => updatePreference('emailPaymentReminder', v)}
                    />
                    <NotificationItem
                        icon={Bell}
                        title="Nhắc buổi học"
                        description="Nhận email nhắc lịch học sắp diễn ra"
                        checked={preferences.emailClassReminder}
                        onChange={(v) => updatePreference('emailClassReminder', v)}
                    />
                    <NotificationItem
                        icon={Info}
                        title="Đơn xin nghỉ"
                        description="Nhận email khi có đơn xin nghỉ cần duyệt"
                        checked={preferences.emailLeaveRequest}
                        onChange={(v) => updatePreference('emailLeaveRequest', v)}
                    />
                    <NotificationItem
                        icon={Info}
                        title="Cập nhật hệ thống"
                        description="Nhận email về các tính năng mới và bảo trì"
                        checked={preferences.emailSystemUpdates}
                        onChange={(v) => updatePreference('emailSystemUpdates', v)}
                    />
                </CardContent>
            </Card>

            {/* In-App Notifications */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Smartphone className="w-5 h-5 text-indigo-600" />
                        <CardTitle>Thông báo trong ứng dụng</CardTitle>
                    </div>
                    <CardDescription>
                        Hiển thị thông báo khi đang sử dụng hệ thống
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-0">
                    <NotificationItem
                        icon={CheckCircle}
                        title="Ghi danh mới"
                        description="Hiện thông báo khi có học viên ghi danh"
                        checked={preferences.appNewEnrollment}
                        onChange={(v) => updatePreference('appNewEnrollment', v)}
                    />
                    <NotificationItem
                        icon={CheckCircle}
                        title="Thanh toán thành công"
                        description="Hiện thông báo khi có thanh toán hoàn tất"
                        checked={preferences.appPaymentReceived}
                        onChange={(v) => updatePreference('appPaymentReceived', v)}
                    />
                    <NotificationItem
                        icon={CheckCircle}
                        title="Điểm danh"
                        description="Hiện thông báo khi điểm danh được cập nhật"
                        checked={preferences.appAttendanceMarked}
                        onChange={(v) => updatePreference('appAttendanceMarked', v)}
                    />
                    <NotificationItem
                        icon={CheckCircle}
                        title="Cập nhật điểm"
                        description="Hiện thông báo khi điểm số được cập nhật"
                        checked={preferences.appGradeUpdated}
                        onChange={(v) => updatePreference('appGradeUpdated', v)}
                    />
                </CardContent>
            </Card>

            {/* Email Digest Frequency */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-indigo-600" />
                        <CardTitle>Tần suất tổng hợp email</CardTitle>
                    </div>
                    <CardDescription>
                        Chọn tần suất nhận email tổng hợp
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-3">
                        {[
                            { value: 'instant', label: 'Ngay lập tức' },
                            { value: 'daily', label: 'Hàng ngày' },
                            { value: 'weekly', label: 'Hàng tuần' }
                        ].map(option => (
                            <button
                                key={option.value}
                                onClick={() => updatePreference('emailDigestFrequency', option.value)}
                                className={`
                                    px-4 py-2 rounded-lg border-2 transition-all
                                    ${preferences.emailDigestFrequency === option.value
                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                    }
                                `}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-3">
                        {preferences.emailDigestFrequency === 'instant' && 'Bạn sẽ nhận email ngay khi có sự kiện xảy ra'}
                        {preferences.emailDigestFrequency === 'daily' && 'Bạn sẽ nhận một email tổng hợp mỗi ngày vào 8:00 sáng'}
                        {preferences.emailDigestFrequency === 'weekly' && 'Bạn sẽ nhận một email tổng hợp mỗi tuần vào thứ Hai'}
                    </p>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-700"
                >
                    {saving ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Đang lưu...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            Lưu cài đặt
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}

export default NotificationPreferencesTab;
