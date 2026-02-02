/**
 * BankInfoTab - Teacher bank account information
 * Only visible to TEACHER role
 */

import { useState, useEffect, useCallback } from 'react';
import { Building2, CreditCard, User, Loader2, Save, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabaseClient';
import { API_URL, BANK_OPTIONS } from '../utils/constants';

const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
        throw new Error('Chưa đăng nhập');
    }
    return { Authorization: `Bearer ${session.access_token}` };
};

export function BankInfoTab({ onMessage }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [bankInfo, setBankInfo] = useState({
        bank_name: '',
        bank_account_number: '',
        bank_account_holder: ''
    });
    const [hasChanges, setHasChanges] = useState(false);

    // Fetch current bank info
    const fetchBankInfo = useCallback(async () => {
        try {
            setLoading(true);
            const headers = await getAuthHeaders();
            const response = await axios.get(
                `${API_URL}/api/teacher/bank-info`,
                { headers }
            );
            if (response.data?.success) {
                setBankInfo({
                    bank_name: response.data.data.bank_name || '',
                    bank_account_number: response.data.data.bank_account_number || '',
                    bank_account_holder: response.data.data.bank_account_holder || ''
                });
            }
        } catch (error) {
            console.error('Error fetching bank info:', error);
            onMessage?.('Không thể tải thông tin ngân hàng', 'error');
        } finally {
            setLoading(false);
        }
    }, [onMessage]);

    useEffect(() => {
        fetchBankInfo();
    }, [fetchBankInfo]);

    // Handle input changes
    const handleChange = (field, value) => {
        setBankInfo(prev => ({ ...prev, [field]: value }));
        setHasChanges(true);
    };

    // Save bank info
    const handleSave = async () => {
        // Validate
        if (!bankInfo.bank_name || !bankInfo.bank_account_number || !bankInfo.bank_account_holder) {
            onMessage?.('Vui lòng điền đầy đủ thông tin ngân hàng', 'error');
            return;
        }

        try {
            setSaving(true);
            const headers = await getAuthHeaders();
            const response = await axios.put(
                `${API_URL}/api/teacher/bank-info`,
                bankInfo,
                { headers }
            );
            if (response.data?.success) {
                onMessage?.('Cập nhật thông tin ngân hàng thành công', 'success');
                setHasChanges(false);
            }
        } catch (error) {
            console.error('Error saving bank info:', error);
            onMessage?.(error.response?.data?.message || 'Lỗi khi lưu thông tin', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </CardContent>
            </Card>
        );
    }

    const isComplete = bankInfo.bank_name && bankInfo.bank_account_number && bankInfo.bank_account_holder;

    return (
        <div className="space-y-6">
            {/* Info Card */}
            <Card className={isComplete ? 'border-green-200 bg-green-50/50' : 'border-orange-200 bg-orange-50/50'}>
                <CardContent className="flex items-center gap-3 py-4">
                    {isComplete ? (
                        <>
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="text-green-700">
                                Thông tin ngân hàng đã được cập nhật. Lương sẽ được chuyển vào tài khoản này.
                            </span>
                        </>
                    ) : (
                        <>
                            <Building2 className="h-5 w-5 text-orange-600" />
                            <span className="text-orange-700">
                                Vui lòng cập nhật thông tin ngân hàng để nhận lương qua chuyển khoản.
                            </span>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Bank Info Form */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Thông tin tài khoản ngân hàng
                    </CardTitle>
                    <CardDescription>
                        Thông tin này sẽ được sử dụng để chuyển lương hàng tháng
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Bank Name */}
                    <div className="space-y-2">
                        <Label htmlFor="bank_name" className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-slate-500" />
                            Ngân hàng <span className="text-red-500">*</span>
                        </Label>
                        <select
                            id="bank_name"
                            value={bankInfo.bank_name}
                            onChange={(e) => handleChange('bank_name', e.target.value)}
                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                            <option value="">-- Chọn ngân hàng --</option>
                            {BANK_OPTIONS.map(bank => (
                                <option key={bank.value} value={bank.label}>
                                    {bank.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Account Number */}
                    <div className="space-y-2">
                        <Label htmlFor="bank_account_number" className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-slate-500" />
                            Số tài khoản <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="bank_account_number"
                            type="text"
                            placeholder="VD: 0123456789"
                            value={bankInfo.bank_account_number}
                            onChange={(e) => handleChange('bank_account_number', e.target.value.replace(/\D/g, ''))}
                            maxLength={20}
                        />
                        <p className="text-xs text-slate-500">Chỉ nhập số, không có dấu cách</p>
                    </div>

                    {/* Account Holder Name */}
                    <div className="space-y-2">
                        <Label htmlFor="bank_account_holder" className="flex items-center gap-2">
                            <User className="h-4 w-4 text-slate-500" />
                            Tên chủ tài khoản <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="bank_account_holder"
                            type="text"
                            placeholder="VD: NGUYEN VAN A"
                            value={bankInfo.bank_account_holder}
                            onChange={(e) => handleChange('bank_account_holder', e.target.value.toUpperCase())}
                            className="uppercase"
                        />
                        <p className="text-xs text-slate-500">Tên phải khớp chính xác với tên trên tài khoản ngân hàng (không dấu, viết hoa)</p>
                    </div>

                    {/* Preview Card */}
                    {isComplete && (
                        <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl text-white">
                            <div className="text-xs opacity-75 mb-1">Thông tin nhận lương</div>
                            <div className="font-mono text-lg tracking-wider mb-2">
                                {bankInfo.bank_account_number.replace(/(\d{4})/g, '$1 ').trim()}
                            </div>
                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="text-xs opacity-75">Chủ tài khoản</div>
                                    <div className="font-medium">{bankInfo.bank_account_holder}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs opacity-75">Ngân hàng</div>
                                    <div className="font-medium">{bankInfo.bank_name}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Save Button */}
                    <div className="flex justify-end pt-4 border-t">
                        <Button
                            onClick={handleSave}
                            disabled={saving || !hasChanges}
                            className="min-w-[140px]"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Đang lưu...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Lưu thay đổi
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Note */}
            <Card className="bg-blue-50/50 border-blue-200">
                <CardContent className="py-4">
                    <h4 className="font-medium text-blue-800 mb-2">Lưu ý quan trọng</h4>
                    <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                        <li>Thông tin ngân hàng chỉ được sử dụng để chuyển lương</li>
                        <li>Đảm bảo tên chủ tài khoản khớp với tên trên thẻ ATM/sổ ngân hàng</li>
                        <li>Nếu có thay đổi tài khoản, vui lòng cập nhật trước kỳ lương tiếp theo</li>
                        <li>Liên hệ quản lý nếu gặp vấn đề về thanh toán</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}

export default BankInfoTab;
