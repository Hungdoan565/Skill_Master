/**
 * PaymentTab Component - Tab cấu hình thanh toán & ngân hàng
 */

import { useState, useEffect } from 'react';
import {
    CreditCard,
    Building2,
    QrCode,
    Loader2,
    Save,
    RotateCcw,
    Info,
    Check,
    Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettings } from '../hooks';
import {
    SETTING_KEYS,
    DEFAULT_BANK_CONFIG,
    BANK_OPTIONS,
    QR_TEMPLATE_OPTIONS
} from '../utils/constants';

export function PaymentTab({ onMessage }) {
    const { fetchSetting, updateSetting, saving } = useSettings();
    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState(DEFAULT_BANK_CONFIG);
    const [previewAmount, setPreviewAmount] = useState(1000000);
    const [copied, setCopied] = useState(false);

    // Load config on mount
    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setLoading(true);
        const value = await fetchSetting(SETTING_KEYS.BANK_CONFIG);
        if (value) {
            setConfig({ ...DEFAULT_BANK_CONFIG, ...value });
        }
        setLoading(false);
    };

    // Handle change
    const handleChange = (field, value) => {
        setConfig(prev => ({ ...prev, [field]: value }));
    };

    // Handle save
    const handleSave = async () => {
        const result = await updateSetting(SETTING_KEYS.BANK_CONFIG, config);
        onMessage?.(result.message, result.success ? 'success' : 'error');
    };

    // Handle reset
    const handleReset = async () => {
        setConfig(DEFAULT_BANK_CONFIG);
        onMessage?.('Đã reset về mặc định (chưa lưu)', 'info');
    };

    // Generate VietQR URL for preview
    const getQRUrl = () => {
        const { bankId, accountNo, template, accountName } = config;
        if (!bankId || !accountNo) return null;

        const content = encodeURIComponent('Test QR Preview');
        const name = encodeURIComponent(accountName || '');
        return `https://img.vietqr.io/image/${bankId}-${accountNo}-${template || 'compact2'}.png?amount=${previewAmount}&addInfo=${content}&accountName=${name}`;
    };

    // Copy account info
    const handleCopy = () => {
        const text = `${config.bankId} - ${config.accountNo} - ${config.accountName}`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    const qrUrl = getQRUrl();

    return (
        <div className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                    <CreditCard className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Thanh toán</h2>
                    <p className="text-sm text-gray-500 dark:text-slate-300">Cấu hình tài khoản ngân hàng và mã QR thu học phí</p>
                </div>
            </div>

            {/* Info Banner */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-300">
                    <p className="font-medium mb-1">Cấu hình ngân hàng nhận thanh toán</p>
                    <p className="text-blue-600 dark:text-blue-200">
                        Thông tin này được sử dụng để tạo mã QR VietQR khi thu học phí.
                        Học viên quét mã để chuyển khoản trực tiếp vào tài khoản này.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-indigo-600" />
                        Thông tin tài khoản
                    </h3>

                    <div className="space-y-4">
                        {/* Bank Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="bankId">Ngân hàng</Label>
                            <Select value={config.bankId} onValueChange={(val) => handleChange('bankId', val)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn ngân hàng" />
                                </SelectTrigger>
                                <SelectContent>
                                    {BANK_OPTIONS.map(bank => (
                                        <SelectItem key={bank.value} value={bank.value}>
                                            {bank.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Account Number */}
                        <div className="space-y-2">
                            <Label htmlFor="accountNo">Số tài khoản</Label>
                            <Input
                                id="accountNo"
                                value={config.accountNo}
                                onChange={(e) => handleChange('accountNo', e.target.value)}
                                placeholder="VD: 0971268268"
                            />
                        </div>

                        {/* Account Name */}
                        <div className="space-y-2">
                            <Label htmlFor="accountName">Tên chủ tài khoản</Label>
                            <Input
                                id="accountName"
                                value={config.accountName}
                                onChange={(e) => handleChange('accountName', e.target.value.toUpperCase())}
                                placeholder="VD: NGUYEN VAN A"
                                className="uppercase"
                            />
                            <p className="text-xs text-gray-500 dark:text-slate-300">Viết hoa, không dấu</p>
                        </div>

                        {/* QR Template */}
                        <div className="space-y-2">
                            <Label htmlFor="template">Mẫu QR</Label>
                            <Select value={config.template} onValueChange={(val) => handleChange('template', val)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn mẫu QR" />
                                </SelectTrigger>
                                <SelectContent>
                                    {QR_TEMPLATE_OPTIONS.map(t => (
                                        <SelectItem key={t.value} value={t.value}>
                                            {t.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mt-6 pt-4 border-t dark:border-slate-700">
                        <Button
                            variant="outline"
                            onClick={handleReset}
                            className="flex-1"
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Reset
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="text-white flex-1 bg-indigo-600 hover:bg-indigo-700"
                        >
                            {saving ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4 mr-2" />
                            )}
                            Lưu cấu hình
                        </Button>
                    </div>
                </Card>

                {/* Preview */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <QrCode className="w-5 h-5 text-indigo-600" />
                        Xem trước QR
                    </h3>

                    <div className="space-y-4">
                        {/* Preview Amount */}
                        <div className="space-y-2">
                            <Label htmlFor="previewAmount">Số tiền mẫu</Label>
                            <Input
                                id="previewAmount"
                                type="number"
                                value={previewAmount}
                                onChange={(e) => setPreviewAmount(parseInt(e.target.value) || 0)}
                                placeholder="1000000"
                            />
                        </div>

                        {/* QR Preview */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/80 rounded-lg p-6 text-center">
                            {qrUrl ? (
                                <div className="space-y-4">
                                    <img
                                        src={qrUrl}
                                        alt="VietQR Preview"
                                        className="w-48 h-48 mx-auto rounded-lg shadow-md"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                    <div className="text-sm text-gray-600 dark:text-slate-300">
                                        <p className="font-medium">{config.accountName}</p>
                                        <p>{BANK_OPTIONS.find(b => b.value === config.bankId)?.label} - {config.accountNo}</p>
                                        <p className="text-lg font-bold text-indigo-600 mt-2">
                                            {previewAmount.toLocaleString('vi-VN')} đ
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-gray-400 dark:text-slate-300 py-8">
                                    <QrCode className="w-16 h-16 mx-auto mb-3 opacity-50" />
                                    <p>Nhập thông tin tài khoản để xem QR</p>
                                </div>
                            )}
                        </div>

                        {/* Copy Info */}
                        <button
                            onClick={handleCopy}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 
                                     bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg text-sm transition-colors"
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4 text-emerald-600" />
                                    <span className="text-emerald-600">Đã copy!</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4 text-gray-500 dark:text-slate-300" />
                                    <span className="text-gray-700 dark:text-slate-300">Copy thông tin TK</span>
                                </>
                            )}
                        </button>
                    </div>
                </Card>
            </div>

            {/* Quick Amounts Config */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-indigo-600" />
                    Gợi ý số tiền nhanh
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-300 mb-4">
                    Các nút số tiền nhanh hiển thị khi thu học phí (đang hardcode: 1tr, 2tr, 5tr)
                </p>
                <div className="flex gap-2">
                    {[1000000, 2000000, 5000000].map(amt => (
                        <span key={amt} className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-lg text-sm font-medium">
                            {(amt / 1000000).toFixed(0)} triệu
                        </span>
                    ))}
                </div>
            </Card>
        </div>
    );
}

export default PaymentTab;
