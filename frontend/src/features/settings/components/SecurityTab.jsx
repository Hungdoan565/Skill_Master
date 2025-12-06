/**
 * SecurityTab Component - Tab quản lý bảo mật (Super Admin only)
 */

import { useState, useEffect } from 'react';
import {
    Shield,
    Lock,
    Key,
    Eye,
    EyeOff,
    Loader2,
    Save,
    AlertTriangle,
    UserX,
    Clock,
    History,
    Smartphone,
    Mail,
    RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSettings } from '../hooks';
import { SETTING_KEYS, DEFAULT_SECURITY_CONFIG } from '../utils/constants';

export function SecurityTab({ onMessage }) {
    const { fetchSettings, updateSetting, saving } = useSettings();
    const [loading, setLoading] = useState(true);
    const [securityConfig, setSecurityConfig] = useState(DEFAULT_SECURITY_CONFIG);

    // Load config on mount
    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setLoading(true);
        const settings = await fetchSettings();
        if (settings && settings[SETTING_KEYS.SECURITY_CONFIG]) {
            setSecurityConfig({ ...DEFAULT_SECURITY_CONFIG, ...settings[SETTING_KEYS.SECURITY_CONFIG] });
        }
        setLoading(false);
    };

    // Handle save
    const handleSave = async () => {
        const result = await updateSetting(SETTING_KEYS.SECURITY_CONFIG, securityConfig);
        onMessage?.(
            result.success ? 'Đã cập nhật cấu hình bảo mật' : 'Không thể lưu cấu hình',
            result.success ? 'success' : 'error'
        );
    };

    // Toggle boolean field
    const toggleField = (field) => {
        setSecurityConfig(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    // Update numeric field
    const updateNumericField = (field, value) => {
        setSecurityConfig(prev => ({
            ...prev,
            [field]: parseInt(value) || 0
        }));
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
            {/* Warning Banner */}
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800">
                    <p className="font-medium mb-1">Cảnh báo: Khu vực quản trị cấp cao</p>
                    <p className="text-red-600">
                        Các cấu hình bảo mật chỉ dành cho Super Admin. Thay đổi không đúng cách
                        có thể ảnh hưởng đến tất cả người dùng trong hệ thống.
                    </p>
                </div>
            </div>

            {/* Session & Login Security */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-600" />
                    Cấu hình phiên đăng nhập
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Session Timeout */}
                    <div className="space-y-2">
                        <Label htmlFor="sessionTimeout">Thời gian hết hạn phiên (giờ)</Label>
                        <Input
                            id="sessionTimeout"
                            type="number"
                            min="1"
                            max="720"
                            value={securityConfig.sessionTimeoutHours}
                            onChange={(e) => updateNumericField('sessionTimeoutHours', e.target.value)}
                        />
                        <p className="text-xs text-gray-500">
                            Tự động logout sau khoảng thời gian không hoạt động
                        </p>
                    </div>

                    {/* Max Login Attempts */}
                    <div className="space-y-2">
                        <Label htmlFor="maxAttempts">Số lần đăng nhập sai tối đa</Label>
                        <Input
                            id="maxAttempts"
                            type="number"
                            min="3"
                            max="10"
                            value={securityConfig.maxLoginAttempts}
                            onChange={(e) => updateNumericField('maxLoginAttempts', e.target.value)}
                        />
                        <p className="text-xs text-gray-500">
                            Khóa tạm thời sau số lần này
                        </p>
                    </div>

                    {/* Lockout Duration */}
                    <div className="space-y-2">
                        <Label htmlFor="lockoutDuration">Thời gian khóa tài khoản (phút)</Label>
                        <Input
                            id="lockoutDuration"
                            type="number"
                            min="5"
                            max="1440"
                            value={securityConfig.lockoutDurationMinutes}
                            onChange={(e) => updateNumericField('lockoutDurationMinutes', e.target.value)}
                        />
                        <p className="text-xs text-gray-500">
                            Thời gian chờ sau khi vượt số lần thử
                        </p>
                    </div>
                </div>
            </Card>

            {/* Password Policy */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Key className="w-5 h-5 text-indigo-600" />
                    Chính sách mật khẩu
                </h3>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Min Length */}
                        <div className="space-y-2">
                            <Label htmlFor="minLength">Độ dài tối thiểu</Label>
                            <Input
                                id="minLength"
                                type="number"
                                min="6"
                                max="32"
                                value={securityConfig.passwordMinLength}
                                onChange={(e) => updateNumericField('passwordMinLength', e.target.value)}
                            />
                        </div>

                        {/* Password Expiry */}
                        <div className="space-y-2">
                            <Label htmlFor="passwordExpiry">Hết hạn sau (ngày)</Label>
                            <Input
                                id="passwordExpiry"
                                type="number"
                                min="0"
                                max="365"
                                value={securityConfig.passwordExpiryDays}
                                onChange={(e) => updateNumericField('passwordExpiryDays', e.target.value)}
                            />
                            <p className="text-xs text-gray-500">0 = không hết hạn</p>
                        </div>

                        {/* Prevent Reuse */}
                        <div className="space-y-2">
                            <Label htmlFor="passwordHistory">Số mật khẩu không được trùng</Label>
                            <Input
                                id="passwordHistory"
                                type="number"
                                min="0"
                                max="12"
                                value={securityConfig.passwordHistoryCount}
                                onChange={(e) => updateNumericField('passwordHistoryCount', e.target.value)}
                            />
                            <p className="text-xs text-gray-500">0 = cho phép trùng</p>
                        </div>
                    </div>

                    {/* Password Requirements */}
                    <div className="flex flex-wrap gap-4 pt-4 border-t">
                        <ToggleOption
                            label="Yêu cầu chữ hoa"
                            checked={securityConfig.requireUppercase}
                            onChange={() => toggleField('requireUppercase')}
                        />
                        <ToggleOption
                            label="Yêu cầu chữ thường"
                            checked={securityConfig.requireLowercase}
                            onChange={() => toggleField('requireLowercase')}
                        />
                        <ToggleOption
                            label="Yêu cầu số"
                            checked={securityConfig.requireNumber}
                            onChange={() => toggleField('requireNumber')}
                        />
                        <ToggleOption
                            label="Yêu cầu ký tự đặc biệt"
                            checked={securityConfig.requireSpecialChar}
                            onChange={() => toggleField('requireSpecialChar')}
                        />
                    </div>
                </div>
            </Card>

            {/* 2FA Settings */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-indigo-600" />
                    Xác thực hai yếu tố (2FA)
                </h3>

                <div className="space-y-4">
                    <div className="flex flex-wrap gap-4">
                        <ToggleOption
                            label="Bật 2FA cho tất cả admin"
                            checked={securityConfig.require2FAForAdmin}
                            onChange={() => toggleField('require2FAForAdmin')}
                        />
                        <ToggleOption
                            label="Cho phép nhân viên bật 2FA"
                            checked={securityConfig.allow2FAForStaff}
                            onChange={() => toggleField('allow2FAForStaff')}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                        <div className="space-y-2">
                            <Label htmlFor="2faMethod">Phương thức 2FA mặc định</Label>
                            <select
                                id="2faMethod"
                                value={securityConfig.default2FAMethod}
                                onChange={(e) => setSecurityConfig(prev => ({
                                    ...prev,
                                    default2FAMethod: e.target.value
                                }))}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                                         focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="email">Email OTP</option>
                                <option value="totp">TOTP (Authenticator App)</option>
                                <option value="sms">SMS OTP</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="otpExpiry">OTP hết hạn sau (giây)</Label>
                            <Input
                                id="otpExpiry"
                                type="number"
                                min="60"
                                max="600"
                                value={securityConfig.otpExpirySeconds}
                                onChange={(e) => updateNumericField('otpExpirySeconds', e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </Card>

            {/* IP & Access Control */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-indigo-600" />
                    Kiểm soát truy cập
                </h3>

                <div className="space-y-4">
                    <div className="flex flex-wrap gap-4">
                        <ToggleOption
                            label="Ghi log tất cả hoạt động"
                            checked={securityConfig.enableActivityLog}
                            onChange={() => toggleField('enableActivityLog')}
                        />
                        <ToggleOption
                            label="Gửi email khi đăng nhập từ thiết bị mới"
                            checked={securityConfig.notifyNewDevice}
                            onChange={() => toggleField('notifyNewDevice')}
                        />
                        <ToggleOption
                            label="Cho phép nhiều phiên đồng thời"
                            checked={securityConfig.allowMultipleSessions}
                            onChange={() => toggleField('allowMultipleSessions')}
                        />
                    </div>
                </div>
            </Card>

            {/* Recent Activity (Placeholder) */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <History className="w-5 h-5 text-indigo-600" />
                    Hoạt động gần đây
                </h3>

                <div className="text-center py-8 text-gray-500">
                    <History className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Tính năng audit log sẽ được bổ sung sau</p>
                    <p className="text-sm">Theo dõi tất cả thay đổi cấu hình và đăng nhập bất thường</p>
                </div>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    size="lg"
                    className="bg-indigo-600 hover:bg-indigo-700"
                >
                    {saving ? (
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                        <Save className="w-5 h-5 mr-2" />
                    )}
                    Lưu cấu hình bảo mật
                </Button>
            </div>
        </div>
    );
}

// Toggle Option Component
function ToggleOption({ label, checked, onChange }) {
    return (
        <label className="flex items-center gap-3 cursor-pointer group">
            <div
                onClick={onChange}
                className={`
                    relative w-11 h-6 rounded-full transition-colors duration-200
                    ${checked ? 'bg-indigo-600' : 'bg-gray-200'}
                `}
            >
                <div
                    className={`
                        absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow
                        transition-transform duration-200
                        ${checked ? 'translate-x-5' : 'translate-x-0'}
                    `}
                />
            </div>
            <span className="text-sm text-gray-700 group-hover:text-gray-900">
                {label}
            </span>
        </label>
    );
}

export default SecurityTab;
