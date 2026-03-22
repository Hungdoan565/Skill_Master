/**
 * SecurityTab Component - Tab quản lý bảo mật (Super Admin only)
 * Honest Mode: Non-enforced settings marked as "Sắp ra mắt"
 * Progressive disclosure: Advanced sections collapsible
 */

import { useState, useEffect } from 'react';
import {
    Shield,
    Key,
    Loader2,
    Save,
    AlertTriangle,
    Clock,
    Smartphone,
    CheckCircle2,
    Timer,
    Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CollapsibleSection } from '@/components/ui/collapsible';
import { useSettings } from '../hooks';
import { SETTING_KEYS, DEFAULT_SECURITY_CONFIG } from '../utils/constants';

// Status badge component
function StatusBadge({ enforced }) {
    if (enforced) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3 h-3" />
                Đang áp dụng
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full border border-amber-200 dark:border-amber-800">
            <Timer className="w-3 h-3" />
            Sắp ra mắt
        </span>
    );
}

// Toggle Option Component — uses shared Switch
function ToggleOption({ label, checked, onChange, disabled = false, hint }) {
    return (
        <label className={`flex items-center gap-3 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} group`}>
            <Switch checked={checked} onChange={onChange} disabled={disabled} />
            <div>
                <span className={`text-sm ${disabled ? 'text-gray-400 dark:text-slate-500' : 'text-gray-700 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-white'}`}>
                    {label}
                </span>
                {hint && <p className="text-xs text-gray-400 dark:text-slate-400 mt-0.5">{hint}</p>}
            </div>
        </label>
    );
}


export function SecurityTab({ onMessage, onDirtyChange }) {
    const { fetchSettings, updateSetting, saving } = useSettings();
    const [loading, setLoading] = useState(true);
    const [securityConfig, setSecurityConfig] = useState(DEFAULT_SECURITY_CONFIG);
    const [initialConfig, setInitialConfig] = useState(DEFAULT_SECURITY_CONFIG);

    // Load config on mount
    useEffect(() => {
        loadConfig();
    }, []);

    // Track dirty state
    useEffect(() => {
        const isDirty = JSON.stringify(securityConfig) !== JSON.stringify(initialConfig);
        onDirtyChange?.(isDirty);
    }, [securityConfig, initialConfig]);

    const loadConfig = async () => {
        setLoading(true);
        const settings = await fetchSettings();
        if (settings?.[SETTING_KEYS.SECURITY_CONFIG]) {
            const loaded = { ...DEFAULT_SECURITY_CONFIG, ...settings[SETTING_KEYS.SECURITY_CONFIG] };
            setSecurityConfig(loaded);
            setInitialConfig(loaded);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        const result = await updateSetting(SETTING_KEYS.SECURITY_CONFIG, securityConfig);
        if (result.success) {
            setInitialConfig(securityConfig);
            onDirtyChange?.(false);
        }
        onMessage?.(
            result.success ? 'Đã cập nhật cấu hình bảo mật' : 'Không thể lưu cấu hình',
            result.success ? 'success' : 'error'
        );
    };

    const toggleField = (field) => {
        setSecurityConfig(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

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
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                    <Shield className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Bảo mật</h2>
                    <p className="text-sm text-gray-500 dark:text-slate-300">Cấu hình chính sách bảo mật và kiểm soát truy cập</p>
                </div>
            </div>

            {/* Honest Mode Banner */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                    <p className="font-medium text-amber-800 dark:text-amber-200">Một số tính năng bảo mật đang được phát triển</p>
                    <p className="text-sm text-amber-600 dark:text-amber-200 mt-1">
                        Các cài đặt đánh dấu <StatusBadge enforced={false} /> sẽ được áp dụng trong phiên bản tiếp theo.
                        Cấu hình sẽ được lưu và tự động kích hoạt khi tính năng sẵn sàng.
                    </p>
                </div>
            </div>

            {/* Session & Login Security — ENFORCED (display only, Supabase manages actual session) */}
            <CollapsibleSection
                title="Phiên đăng nhập"
                icon={Clock}
                badge={<StatusBadge enforced={true} />}
                defaultOpen={true}
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="sessionTimeout">Thời gian hết hạn (giờ)</Label>
                        <Input
                            id="sessionTimeout"
                            type="number"
                            min="1"
                            max="720"
                            value={securityConfig.sessionTimeoutHours}
                            onChange={(e) => updateNumericField('sessionTimeoutHours', e.target.value)}
                        />
                        <p className="text-xs text-gray-500 dark:text-slate-300">
                            Tự động logout sau khoảng thời gian không hoạt động
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="maxAttempts">Đăng nhập sai tối đa</Label>
                        <Input
                            id="maxAttempts"
                            type="number"
                            min="3"
                            max="10"
                            value={securityConfig.maxLoginAttempts}
                            disabled
                            className="bg-gray-50 dark:bg-slate-800"
                        />
                        <p className="text-xs text-gray-400 dark:text-slate-300 flex items-center gap-1">
                            <Timer className="w-3 h-3" /> Sẽ áp dụng khi có rate limiting
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="lockoutDuration">Thời gian khóa (phút)</Label>
                        <Input
                            id="lockoutDuration"
                            type="number"
                            min="5"
                            max="1440"
                            value={securityConfig.lockoutDurationMinutes}
                            disabled
                            className="bg-gray-50 dark:bg-slate-800"
                        />
                        <p className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1">
                            <Timer className="w-3 h-3" /> Sẽ áp dụng khi có rate limiting
                        </p>
                    </div>
                </div>
            </CollapsibleSection>

            {/* Password Policy — COMING SOON */}
            <CollapsibleSection
                title="Chính sách mật khẩu"
                icon={Key}
                badge={<StatusBadge enforced={false} />}
                defaultOpen={false}
            >
                <div className="opacity-100">
                    <div className="flex items-start gap-2 mb-4 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                        <Info className="w-4 h-4 text-gray-400 dark:text-slate-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-gray-500 dark:text-slate-200">
                            Chính sách mật khẩu hiện được lưu cấu hình nhưng chưa enforce ở backend.
                            Khi tính năng sẵn sàng, các quy tắc dưới đây sẽ tự động được áp dụng.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
                            <p className="text-xs text-gray-500 dark:text-slate-200">0 = không hết hạn</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="passwordHistory">Không trùng mật khẩu</Label>
                            <Input
                                id="passwordHistory"
                                type="number"
                                min="0"
                                max="12"
                                value={securityConfig.passwordHistoryCount}
                                onChange={(e) => updateNumericField('passwordHistoryCount', e.target.value)}
                            />
                            <p className="text-xs text-gray-500 dark:text-slate-200">0 = cho phép trùng</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 pt-4 border-t dark:border-slate-700">
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
            </CollapsibleSection>

            {/* 2FA — COMING SOON */}
            <CollapsibleSection
                title="Xác thực hai yếu tố (2FA)"
                icon={Smartphone}
                badge={<StatusBadge enforced={false} />}
                defaultOpen={false}
            >
                <div className="opacity-100">
                    <div className="flex items-start gap-2 mb-4 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                        <Info className="w-4 h-4 text-gray-400 dark:text-slate-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-gray-500 dark:text-slate-200">
                            Tính năng 2FA đang được phát triển. Cấu hình sẽ được lưu và tự động áp dụng khi sẵn sàng.
                        </p>
                    </div>

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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t dark:border-slate-700">
                            <div className="space-y-2">
                                <Label htmlFor="2faMethod">Phương thức 2FA mặc định</Label>
                                <Select value={securityConfig.default2FAMethod} onValueChange={(val) => setSecurityConfig(prev => ({ ...prev, default2FAMethod: val }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn phương thức" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="email">Email OTP</SelectItem>
                                        <SelectItem value="totp">TOTP (Authenticator App)</SelectItem>
                                        <SelectItem value="sms">SMS OTP</SelectItem>
                                    </SelectContent>
                                </Select>
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
                </div>
            </CollapsibleSection>

            {/* Access Control — COMING SOON */}
            <CollapsibleSection
                title="Kiểm soát truy cập"
                icon={Shield}
                badge={<StatusBadge enforced={false} />}
                defaultOpen={false}
            >
                <div className="opacity-100">
                    <div className="flex items-start gap-2 mb-4 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                        <Info className="w-4 h-4 text-gray-400 dark:text-slate-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-gray-500 dark:text-slate-200">
                            Tính năng kiểm soát truy cập nâng cao đang được phát triển.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <ToggleOption
                            label="Ghi log tất cả hoạt động"
                            checked={securityConfig.enableActivityLog}
                            onChange={() => toggleField('enableActivityLog')}
                            hint="Audit log sẽ được bổ sung"
                        />
                        <ToggleOption
                            label="Gửi email khi đăng nhập từ thiết bị mới"
                            checked={securityConfig.notifyNewDevice}
                            onChange={() => toggleField('notifyNewDevice')}
                            hint="Cần Email config hoạt động"
                        />
                        <ToggleOption
                            label="Cho phép nhiều phiên đồng thời"
                            checked={securityConfig.allowMultipleSessions}
                            onChange={() => toggleField('allowMultipleSessions')}
                            hint="Quản lý bởi Supabase Auth"
                        />
                    </div>
                </div>
            </CollapsibleSection>

            {/* Audit Log — Coming Soon Card */}
            <Card className="p-6">
                <div className="border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl p-8 text-center">
                    <Clock className="w-10 h-10 text-gray-300 dark:text-slate-500 mx-auto mb-3" />
                    <p className="font-medium text-gray-500 dark:text-slate-200">Nhật ký hoạt động</p>
                    <p className="text-sm text-gray-400 dark:text-slate-400 mt-1">
                        Theo dõi tất cả thay đổi cấu hình và đăng nhập bất thường
                    </p>
                    <span className="inline-flex items-center gap-1 mt-3 px-3 py-1 text-xs font-medium bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-800">
                        <Timer className="w-3 h-3" />
                        Sẽ bổ sung trong phiên bản tiếp theo
                    </span>
                </div>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button
                    onClick={handleSave}
                    disabled={saving || JSON.stringify(securityConfig) === JSON.stringify(initialConfig)}
                    size="lg"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
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

export default SecurityTab;
