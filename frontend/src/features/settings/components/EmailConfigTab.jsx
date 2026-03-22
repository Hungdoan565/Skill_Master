/**
 * EmailConfigTab - Cấu hình Email SMTP (Super Admin only)
 */

import { useState, useEffect, useCallback } from 'react';
import {
    Mail,
    Server,
    Lock,
    Send,
    Save,
    Loader2,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Eye,
    EyeOff,
    RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/auth-context';
import { DEFAULT_EMAIL_CONFIG, API_URL } from '../utils/constants';

// Form field component
const FormField = ({ label, required, children, hint }) => (
    <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {children}
        {hint && <p className="text-xs text-gray-500 dark:text-slate-400">{hint}</p>}
    </div>
);

// Status badge
const StatusBadge = ({ status, lastTested }) => {
    const config = {
        success: { icon: CheckCircle, color: 'text-green-600 bg-green-50 border-green-200', label: 'Hoạt động' },
        failed: { icon: XCircle, color: 'text-red-600 bg-red-50 border-red-200', label: 'Lỗi' },
        untested: { icon: AlertTriangle, color: 'text-amber-600 bg-amber-50 border-amber-200', label: 'Chưa kiểm tra' }
    };

    const { icon: Icon, color, label } = config[status] || config.untested;

    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${color}`}>
            <Icon className="w-4 h-4" />
            <span className="text-sm font-medium">{label}</span>
            {lastTested && (
                <span className="text-xs opacity-75">
                    • {new Date(lastTested).toLocaleString('vi-VN')}
                </span>
            )}
        </div>
    );
};

// SMTP presets
const SMTP_PRESETS = [
    { name: 'Gmail', host: 'smtp.gmail.com', port: 587, secure: true },
    { name: 'Outlook', host: 'smtp-mail.outlook.com', port: 587, secure: true },
    { name: 'Zoho', host: 'smtp.zoho.com', port: 587, secure: true },
    { name: 'SendGrid', host: 'smtp.sendgrid.net', port: 587, secure: true },
    { name: 'Mailgun', host: 'smtp.mailgun.org', port: 587, secure: true },
    { name: 'Custom', host: '', port: 587, secure: true }
];

export function EmailConfigTab({ onMessage }) {
    const { session } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [config, setConfig] = useState(DEFAULT_EMAIL_CONFIG);
    const [testStatus, setTestStatus] = useState({ status: 'untested', lastTested: null });
    const [selectedPreset, setSelectedPreset] = useState('Custom');

    // Fetch current config
    const fetchConfig = useCallback(async () => {
        if (!session?.access_token) return;

        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/api/admin/settings/email_config`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data?.value) {
                    setConfig(prev => ({ ...prev, ...data.data.value }));
                    setTestStatus({
                        status: data.data.value.lastTestResult || 'untested',
                        lastTested: data.data.value.lastTestedAt
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching email config:', error);
        } finally {
            setLoading(false);
        }
    }, [session?.access_token]);

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    // Update config field
    const updateConfig = (key, value) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    // Apply SMTP preset
    const applyPreset = (presetName) => {
        const preset = SMTP_PRESETS.find(p => p.name === presetName);
        if (preset) {
            setSelectedPreset(presetName);
            setConfig(prev => ({
                ...prev,
                smtpHost: preset.host,
                smtpPort: preset.port,
                smtpSecure: preset.secure
            }));
        }
    };

    // Test email connection
    const handleTestEmail = async () => {
        if (!testEmail) {
            onMessage?.('Vui lòng nhập email để test', 'error');
            return;
        }

        setTesting(true);
        try {
            const response = await fetch(`${API_URL}/api/admin/settings/email/test`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    smtpConfig: config,
                    testEmail
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setTestStatus({ status: 'success', lastTested: new Date().toISOString() });
                onMessage?.('Gửi email test thành công!', 'success');
            } else {
                setTestStatus({ status: 'failed', lastTested: new Date().toISOString() });
                onMessage?.(data.message || 'Gửi email test thất bại', 'error');
            }
        } catch (error) {
            console.error('Error testing email:', error);
            setTestStatus({ status: 'failed', lastTested: new Date().toISOString() });
            onMessage?.('Lỗi kết nối đến server', 'error');
        } finally {
            setTesting(false);
        }
    };

    // Save config
    const handleSave = async () => {
        if (!session?.access_token) return;

        // Validate required fields
        if (!config.smtpHost || !config.smtpUser || !config.fromEmail) {
            onMessage?.('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
            return;
        }

        setSaving(true);
        try {
            const response = await fetch(`${API_URL}/api/admin/settings/email_config`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ value: config, scope: 'global' })
            });

            if (response.ok) {
                onMessage?.('Đã lưu cấu hình email', 'success');
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            console.error('Error saving email config:', error);
            onMessage?.('Không thể lưu cấu hình', 'error');
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
            {/* Section Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                        <Mail className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Cấu hình Email SMTP</h2>
                        <p className="text-sm text-gray-500 dark:text-slate-400">Thiết lập máy chủ email để gửi thông báo</p>
                    </div>
                </div>
                <StatusBadge status={testStatus.status} lastTested={testStatus.lastTested} />
            </div>

            {/* Enable/Disable */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">Kích hoạt gửi email</p>
                            <p className="text-sm text-gray-500 dark:text-slate-400">Tắt để ngừng tất cả email từ hệ thống</p>
                        </div>
                        <Switch
                            checked={config.isActive}
                            onChange={(v) => updateConfig('isActive', v)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* SMTP Server Settings */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Server className="w-5 h-5 text-indigo-600" />
                        <CardTitle>Máy chủ SMTP</CardTitle>
                    </div>
                    <CardDescription>
                        Cấu hình kết nối đến máy chủ email
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Presets */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Chọn nhanh
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {SMTP_PRESETS.map(preset => (
                                <button
                                    key={preset.name}
                                    onClick={() => applyPreset(preset.name)}
                                    className={`
                                        px-3 py-1.5 rounded-lg border text-sm transition-all
                                        ${selectedPreset === preset.name
                                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                            : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 text-gray-600 dark:text-slate-300'
                                        }
                                    `}
                                >
                                    {preset.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="SMTP Host" required>
                            <Input
                                value={config.smtpHost}
                                onChange={(e) => updateConfig('smtpHost', e.target.value)}
                                placeholder="smtp.gmail.com"
                            />
                        </FormField>
                        <FormField label="Port" required>
                            <Input
                                type="number"
                                value={config.smtpPort}
                                onChange={(e) => updateConfig('smtpPort', parseInt(e.target.value))}
                                placeholder="587"
                            />
                        </FormField>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Tên đăng nhập" required>
                            <Input
                                value={config.smtpUser}
                                onChange={(e) => updateConfig('smtpUser', e.target.value)}
                                placeholder="your-email@gmail.com"
                            />
                        </FormField>
                        <FormField label="Mật khẩu ứng dụng" required hint="Với Gmail, hãy sử dụng App Password">
                            <div className="relative">
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    value={config.smtpPassword}
                                    onChange={(e) => updateConfig('smtpPassword', e.target.value)}
                                    placeholder="••••••••"
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </FormField>
                    </div>

                    <div className="flex items-center gap-3">
                        <Switch
                            checked={config.smtpSecure}
                            onChange={(v) => updateConfig('smtpSecure', v)}
                        />
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">Sử dụng TLS/SSL</p>
                            <p className="text-sm text-gray-500 dark:text-slate-400">Bật nếu server yêu cầu kết nối bảo mật</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Sender Settings */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Mail className="w-5 h-5 text-indigo-600" />
                        <CardTitle>Thông tin người gửi</CardTitle>
                    </div>
                    <CardDescription>
                        Thông tin hiển thị khi gửi email
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Tên người gửi" required>
                            <Input
                                value={config.fromName}
                                onChange={(e) => updateConfig('fromName', e.target.value)}
                                placeholder="Skill Master"
                            />
                        </FormField>
                        <FormField label="Email người gửi" required>
                            <Input
                                type="email"
                                value={config.fromEmail}
                                onChange={(e) => updateConfig('fromEmail', e.target.value)}
                                placeholder="noreply@skillmaster.vn"
                            />
                        </FormField>
                    </div>
                    <FormField label="Email nhận phản hồi (Reply-To)" hint="Để trống nếu giống email người gửi">
                        <Input
                            type="email"
                            value={config.replyTo}
                            onChange={(e) => updateConfig('replyTo', e.target.value)}
                            placeholder="support@skillmaster.vn"
                        />
                    </FormField>
                </CardContent>
            </Card>

            {/* Test Email */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Send className="w-5 h-5 text-indigo-600" />
                        <CardTitle>Kiểm tra kết nối</CardTitle>
                    </div>
                    <CardDescription>
                        Gửi email test để xác nhận cấu hình hoạt động
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-3">
                        <Input
                            type="email"
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                            placeholder="Nhập email để nhận test"
                            className="flex-1"
                        />
                        <Button
                            onClick={handleTestEmail}
                            disabled={testing || !testEmail}
                            variant="outline"
                        >
                            {testing ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Đang gửi...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Gửi test
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end gap-3">
                <Button
                    variant="outline"
                    onClick={fetchConfig}
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset
                </Button>
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
                            Lưu cấu hình
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}

export default EmailConfigTab;
