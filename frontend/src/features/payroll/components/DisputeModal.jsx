/**
 * DisputeModal Component  
 * Modal cho giáo viên gửi khiếu nại về bảng lương
 */

import { useState, useRef, useEffect } from 'react';
import { X, AlertTriangle, Send, Loader2, ChevronDown, Clock, DollarSign, FileText, Calculator, Minus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { formatCurrency, formatMonthYear } from '../utils';

// Custom IconSelect Component
function IconSelect({ value, onChange, options, placeholder, icon: Icon }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);
    
    const selectedOption = options.find(opt => opt.value === value);
    
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 w-full h-10 px-3 rounded-md border border-input bg-white hover:bg-slate-50 transition-colors text-sm justify-between"
            >
                <div className="flex items-center gap-2">
                    {selectedOption?.icon ? (
                        <selectedOption.icon className={`h-4 w-4 ${selectedOption.iconColor}`} />
                    ) : Icon ? (
                        <Icon className="h-4 w-4 text-slate-500" />
                    ) : null}
                    <span>{selectedOption?.label || placeholder}</span>
                </div>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-md border shadow-lg z-50 py-1">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 transition-colors ${
                                value === option.value ? 'bg-slate-50 font-medium' : ''
                            }`}
                        >
                            {option.icon && <option.icon className={`h-4 w-4 ${option.iconColor || 'text-slate-500'}`} />}
                            <span>{option.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

const DISPUTE_TYPES = [
    { value: 'incorrect_hours', label: 'Sai số giờ dạy', icon: Clock, iconColor: 'text-blue-500' },
    { value: 'incorrect_rate', label: 'Sai mức lương/giờ', icon: DollarSign, iconColor: 'text-green-500' },
    { value: 'missing_sessions', label: 'Thiếu buổi dạy', icon: FileText, iconColor: 'text-orange-500' },
    { value: 'incorrect_bonus', label: 'Sai tiền thưởng', icon: Calculator, iconColor: 'text-purple-500' },
    { value: 'incorrect_deduction', label: 'Sai tiền khấu trừ', icon: Minus, iconColor: 'text-red-500' },
    { value: 'other', label: 'Lý do khác', icon: AlertCircle, iconColor: 'text-slate-500' },
];

export function DisputeModal({
    isOpen,
    onClose,
    payroll,
    onSubmit,
    submitting = false,
}) {
    const [formData, setFormData] = useState({
        dispute_type: 'incorrect_hours',
        reason: '',
    });
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!payroll) return;

        console.log('🔍 Validating dispute form:', formData);

        // Validate
        if (!formData.reason.trim()) {
            console.log('❌ Validation failed: empty reason');
            setError('Vui lòng nhập lý do khiếu nại');
            return;
        }

        if (formData.reason.trim().length < 20) {
            console.log('❌ Validation failed: reason too short', formData.reason.trim().length);
            setError('Lý do khiếu nại phải có ít nhất 20 ký tự');
            return;
        }

        console.log('✅ Validation passed, submitting...');
        setError(null);

        try {
            await onSubmit(payroll.id, {
                dispute_type: formData.dispute_type,
                reason: formData.reason.trim(),
            });
            // Reset form on success
            setFormData({ dispute_type: 'incorrect_hours', reason: '' });
        } catch (err) {
            // Handle axios error response
            const errorMessage = err.response?.data?.message 
                || err.message 
                || 'Lỗi khi gửi khiếu nại. Vui lòng thử lại.';
            setError(errorMessage);
        }
    };

    const handleClose = () => {
        setFormData({ dispute_type: 'incorrect_hours', reason: '' });
        setError(null);
        onClose();
    };

    if (!isOpen || !payroll) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-lg rounded-lg bg-white shadow-xl mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between border-b px-6 py-4 sticky top-0 bg-white">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                        Khiếu nại bảng lương
                    </h2>
                    <Button variant="ghost" size="icon" onClick={handleClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Payroll Info */}
                    <div className="p-4 rounded-lg bg-orange-50 border border-orange-200 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-orange-800 font-medium">
                                {formatMonthYear(payroll.period_month, payroll.period_year)}
                            </span>
                            <span className="text-orange-700 text-sm">
                                {payroll.total_sessions} buổi
                            </span>
                        </div>
                        <div className="text-2xl font-bold text-orange-700">
                            {formatCurrency(payroll.net_salary)}
                        </div>
                    </div>

                    {/* Notice */}
                    <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                        <p className="text-sm text-yellow-800">
                            <strong>Lưu ý:</strong> Sau khi gửi khiếu nại, quản lý sẽ xem xét và phản hồi. 
                            Bạn sẽ nhận được thông báo khi có kết quả.
                        </p>
                    </div>

                    {/* Dispute Type */}
                    <div className="space-y-2">
                        <Label htmlFor="dispute_type">
                            Loại khiếu nại <span className="text-red-500">*</span>
                        </Label>
                        <IconSelect
                            value={formData.dispute_type}
                            onChange={(value) => setFormData(prev => ({ ...prev, dispute_type: value }))}
                            options={DISPUTE_TYPES}
                            placeholder="Chọn loại khiếu nại"
                            icon={AlertTriangle}
                        />
                    </div>

                    {/* Reason */}
                    <div className="space-y-2">
                        <Label htmlFor="reason">
                            Lý do chi tiết <span className="text-red-500">*</span>
                        </Label>
                        <textarea
                            id="reason"
                            placeholder="Mô tả chi tiết vấn đề bạn gặp phải với bảng lương này..."
                            value={formData.reason}
                            onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                            rows={4}
                            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                        />
                        <p className="text-xs text-muted-foreground">
                            Tối thiểu 20 ký tự. Hiện tại: {formData.reason.length} ký tự
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <p className="text-sm text-red-600 p-3 rounded-lg bg-red-50">
                            {error}
                        </p>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={submitting}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            disabled={submitting}
                            className="min-w-[140px] bg-orange-600 hover:bg-orange-700 text-white"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Đang gửi...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-4 w-4" />
                                    Gửi khiếu nại
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default DisputeModal;
