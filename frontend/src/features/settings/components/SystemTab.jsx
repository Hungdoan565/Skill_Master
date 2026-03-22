/**
 * SystemTab Component - Tab cấu hình chung (simplified)
 * Removed: grade config (→ GradesConfigTab), payroll config, timezone, language
 * Kept: appName, dateFormat, currency
 */

import { useState, useEffect } from 'react';
import {
    Settings,
    Loader2,
    Save,
    Calendar,
    Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettings } from '../hooks';
import {
    SETTING_KEYS,
    DEFAULT_SYSTEM_CONFIG
} from '../utils/constants';

export function SystemTab({ onMessage, onDirtyChange }) {
    const { fetchSettings, updateSetting, saving } = useSettings();
    const [loading, setLoading] = useState(true);
    const [systemConfig, setSystemConfig] = useState(DEFAULT_SYSTEM_CONFIG);
    const [initialConfig, setInitialConfig] = useState(DEFAULT_SYSTEM_CONFIG);

    // Load config on mount
    useEffect(() => {
        loadConfig();
    }, []);

    // Track dirty state
    useEffect(() => {
        const isDirty = JSON.stringify(systemConfig) !== JSON.stringify(initialConfig);
        onDirtyChange?.(isDirty);
    }, [systemConfig, initialConfig]);

    const loadConfig = async () => {
        setLoading(true);
        const settings = await fetchSettings();
        if (settings?.[SETTING_KEYS.SYSTEM_CONFIG]) {
            const loaded = { ...DEFAULT_SYSTEM_CONFIG, ...settings[SETTING_KEYS.SYSTEM_CONFIG] };
            setSystemConfig(loaded);
            setInitialConfig(loaded);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        const result = await updateSetting(SETTING_KEYS.SYSTEM_CONFIG, systemConfig);
        if (result.success) {
            setInitialConfig(systemConfig);
            onDirtyChange?.(false);
        }
        onMessage?.(
            result.success ? 'Đã lưu cấu hình hệ thống' : 'Có lỗi khi lưu cấu hình',
            result.success ? 'success' : 'error'
        );
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
                    <Settings className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Cài đặt chung</h2>
                    <p className="text-sm text-gray-500 dark:text-slate-300">Cấu hình tên ứng dụng, định dạng ngày tháng và đơn vị tiền tệ</p>
                </div>
            </div>

            {/* System Config */}
            <Card className="p-6">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                    Thông tin ứng dụng
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            placeholder="Skill Master"
                        />
                        <p className="text-xs text-gray-500 dark:text-slate-300">
                            Hiển thị trên tiêu đề trang và các email hệ thống
                        </p>
                    </div>

                    {/* Currency */}
                    <div className="space-y-2">
                        <Label htmlFor="currency">Đơn vị tiền tệ</Label>
                        <Select value={systemConfig.currency} onValueChange={(val) => setSystemConfig(prev => ({ ...prev, currency: val }))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn đơn vị" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="VND">VND (₫)</SelectItem>
                                <SelectItem value="USD">USD ($)</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500 dark:text-slate-300">
                            Đơn vị tiền tệ hiển thị trong hóa đơn và báo cáo
                        </p>
                    </div>
                </div>
            </Card>

            {/* Date & Locale Config */}
            <Card className="p-6">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                    Định dạng hiển thị
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Date Format */}
                    <div className="space-y-2">
                        <Label htmlFor="dateFormat">Định dạng ngày</Label>
                        <Select value={systemConfig.dateFormat} onValueChange={(val) => setSystemConfig(prev => ({ ...prev, dateFormat: val }))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn định dạng" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (05/12/2025)</SelectItem>
                                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (12/05/2025)</SelectItem>
                                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (2025-12-05)</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500 dark:text-slate-300">
                            Áp dụng cho tất cả hiển thị ngày trong hệ thống
                        </p>
                    </div>
                </div>
            </Card>

            {/* Info Banner */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-200 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p>
                        Một số thay đổi có thể cần tải lại trang để có hiệu lực đầy đủ.
                    </p>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button
                    onClick={handleSave}
                    disabled={saving || JSON.stringify(systemConfig) === JSON.stringify(initialConfig)}
                    size="lg"
                    className="text-white bg-indigo-600 hover:bg-indigo-700"
                >
                    {saving ? (
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                        <Save className="w-5 h-5 mr-2" />
                    )}
                    Lưu cấu hình
                </Button>
            </div>
        </div>
    );
}

export default SystemTab;
