/**
 * SystemTab Component - Tab cấu hình hệ thống chung
 */

import { useState, useEffect } from 'react';
import {
    Settings,
    GraduationCap,
    DollarSign,
    Loader2,
    Save,
    RotateCcw,
    Info,
    Globe,
    Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useSettings } from '../hooks';
import {
    SETTING_KEYS,
    DEFAULT_GRADE_CONFIG,
    DEFAULT_PAYROLL_CONFIG,
    DEFAULT_SYSTEM_CONFIG,
    CALCULATION_TYPE_OPTIONS,
    GRADE_TEMPLATE_OPTIONS
} from '../utils/constants';

export function SystemTab({ onMessage }) {
    const { fetchSettings, updateSetting, saving } = useSettings();
    const [loading, setLoading] = useState(true);
    const [gradeConfig, setGradeConfig] = useState(DEFAULT_GRADE_CONFIG);
    const [payrollConfig, setPayrollConfig] = useState(DEFAULT_PAYROLL_CONFIG);
    const [systemConfig, setSystemConfig] = useState(DEFAULT_SYSTEM_CONFIG);

    // Load configs on mount
    useEffect(() => {
        loadConfigs();
    }, []);

    const loadConfigs = async () => {
        setLoading(true);
        const settings = await fetchSettings();
        if (settings) {
            if (settings[SETTING_KEYS.GRADE_CONFIG]) {
                setGradeConfig({ ...DEFAULT_GRADE_CONFIG, ...settings[SETTING_KEYS.GRADE_CONFIG] });
            }
            if (settings[SETTING_KEYS.PAYROLL_CONFIG]) {
                setPayrollConfig({ ...DEFAULT_PAYROLL_CONFIG, ...settings[SETTING_KEYS.PAYROLL_CONFIG] });
            }
            if (settings[SETTING_KEYS.SYSTEM_CONFIG]) {
                setSystemConfig({ ...DEFAULT_SYSTEM_CONFIG, ...settings[SETTING_KEYS.SYSTEM_CONFIG] });
            }
        }
        setLoading(false);
    };

    // Handle save all
    const handleSaveAll = async () => {
        let success = true;
        let result;

        result = await updateSetting(SETTING_KEYS.GRADE_CONFIG, gradeConfig);
        if (!result.success) success = false;

        result = await updateSetting(SETTING_KEYS.PAYROLL_CONFIG, payrollConfig);
        if (!result.success) success = false;

        result = await updateSetting(SETTING_KEYS.SYSTEM_CONFIG, systemConfig);
        if (!result.success) success = false;

        onMessage?.(
            success ? 'Đã lưu tất cả cấu hình' : 'Có lỗi khi lưu một số cấu hình',
            success ? 'success' : 'error'
        );
    };

    // Format currency input
    const formatCurrency = (value) => {
        const num = parseInt(value.toString().replace(/[^0-9]/g, '')) || 0;
        return num;
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
            {/* Grade Config */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-indigo-600" />
                    Cấu hình đánh giá điểm
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Pass Score */}
                    <div className="space-y-2">
                        <Label htmlFor="passScore">Điểm đạt (Pass)</Label>
                        <Input
                            id="passScore"
                            type="number"
                            step="0.5"
                            min="0"
                            max="10"
                            value={gradeConfig.defaultPassScore}
                            onChange={(e) => setGradeConfig(prev => ({
                                ...prev,
                                defaultPassScore: parseFloat(e.target.value) || 5.0
                            }))}
                        />
                    </div>

                    {/* Max Score */}
                    <div className="space-y-2">
                        <Label htmlFor="maxScore">Thang điểm tối đa</Label>
                        <Input
                            id="maxScore"
                            type="number"
                            step="1"
                            min="1"
                            value={gradeConfig.maxTotalScore}
                            onChange={(e) => setGradeConfig(prev => ({
                                ...prev,
                                maxTotalScore: parseFloat(e.target.value) || 10.0
                            }))}
                        />
                    </div>

                    {/* Calculation Type */}
                    <div className="space-y-2">
                        <Label htmlFor="calcType">Cách tính điểm</Label>
                        <select
                            id="calcType"
                            value={gradeConfig.defaultCalculationType}
                            onChange={(e) => setGradeConfig(prev => ({
                                ...prev,
                                defaultCalculationType: e.target.value
                            }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                                     focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {CALCULATION_TYPE_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Default Template */}
                    <div className="space-y-2">
                        <Label htmlFor="gradeTemplate">Template mặc định</Label>
                        <select
                            id="gradeTemplate"
                            value={gradeConfig.defaultTemplate}
                            onChange={(e) => setGradeConfig(prev => ({
                                ...prev,
                                defaultTemplate: e.target.value
                            }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                                     focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {GRADE_TEMPLATE_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </Card>

            {/* Payroll Config */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-indigo-600" />
                    Cấu hình lương & nhân sự
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Default Hourly Rate */}
                    <div className="space-y-2">
                        <Label htmlFor="hourlyRate">Mức lương/giờ mặc định (VNĐ)</Label>
                        <Input
                            id="hourlyRate"
                            type="text"
                            value={payrollConfig.defaultHourlyRate.toLocaleString('vi-VN')}
                            onChange={(e) => setPayrollConfig(prev => ({
                                ...prev,
                                defaultHourlyRate: formatCurrency(e.target.value)
                            }))}
                        />
                        <p className="text-xs text-gray-500">
                            Áp dụng khi tạo nhân viên mới hoặc chưa cấu hình riêng
                        </p>
                    </div>

                    {/* Default Password */}
                    <div className="space-y-2">
                        <Label htmlFor="defaultPassword">Mật khẩu mặc định cho nhân viên mới</Label>
                        <Input
                            id="defaultPassword"
                            value={payrollConfig.defaultPassword}
                            onChange={(e) => setPayrollConfig(prev => ({
                                ...prev,
                                defaultPassword: e.target.value
                            }))}
                            placeholder="VD: SkillMaster@123"
                        />
                        <p className="text-xs text-gray-500">
                            Nhân viên nên đổi mật khẩu ngay sau lần đăng nhập đầu
                        </p>
                    </div>
                </div>
            </Card>

            {/* System Config */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-indigo-600" />
                    Cấu hình chung
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* App Name */}
                    <div className="space-y-2">
                        <Label htmlFor="appName">Tên ứng dụng</Label>
                        <Input
                            id="appName"
                            value={systemConfig.appName}
                            onChange={(e) => setSystemConfig(prev => ({
                                ...prev,
                                appName: e.target.value
                            }))}
                        />
                    </div>

                    {/* Timezone */}
                    <div className="space-y-2">
                        <Label htmlFor="timezone" className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-gray-400" />
                            Múi giờ
                        </Label>
                        <Input
                            id="timezone"
                            value={systemConfig.timezone}
                            disabled
                            className="bg-gray-50"
                        />
                    </div>

                    {/* Date Format */}
                    <div className="space-y-2">
                        <Label htmlFor="dateFormat" className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            Định dạng ngày
                        </Label>
                        <select
                            id="dateFormat"
                            value={systemConfig.dateFormat}
                            onChange={(e) => setSystemConfig(prev => ({
                                ...prev,
                                dateFormat: e.target.value
                            }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                                     focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="DD/MM/YYYY">DD/MM/YYYY (05/12/2025)</option>
                            <option value="MM/DD/YYYY">MM/DD/YYYY (12/05/2025)</option>
                            <option value="YYYY-MM-DD">YYYY-MM-DD (2025-12-05)</option>
                        </select>
                    </div>

                    {/* Currency */}
                    <div className="space-y-2">
                        <Label htmlFor="currency">Đơn vị tiền tệ</Label>
                        <select
                            id="currency"
                            value={systemConfig.currency}
                            onChange={(e) => setSystemConfig(prev => ({
                                ...prev,
                                currency: e.target.value
                            }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                                     focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="VND">VND (₫)</option>
                            <option value="USD">USD ($)</option>
                        </select>
                    </div>

                    {/* Language */}
                    <div className="space-y-2">
                        <Label htmlFor="language">Ngôn ngữ</Label>
                        <select
                            id="language"
                            value={systemConfig.language}
                            onChange={(e) => setSystemConfig(prev => ({
                                ...prev,
                                language: e.target.value
                            }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                                     focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="vi">Tiếng Việt</option>
                            <option value="en">English</option>
                        </select>
                    </div>
                </div>
            </Card>

            {/* Info Banner */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">Lưu ý</p>
                    <p className="text-amber-600">
                        Một số thay đổi có thể cần reload trang để có hiệu lực đầy đủ.
                        Các cấu hình global chỉ Super Admin mới có thể chỉnh sửa.
                    </p>
                </div>
            </div>

            {/* Save All Button */}
            <div className="flex justify-end">
                <Button
                    onClick={handleSaveAll}
                    disabled={saving}
                    size="lg"
                    className="text-white bg-indigo-600 hover:bg-indigo-700"
                >
                    {saving ? (
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                        <Save className="w-5 h-5 mr-2" />
                    )}
                    Lưu tất cả cấu hình
                </Button>
            </div>
        </div>
    );
}

export default SystemTab;
