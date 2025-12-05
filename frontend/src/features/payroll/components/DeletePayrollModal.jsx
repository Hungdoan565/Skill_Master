/**
 * DeletePayrollModal Component
 * Modal xác nhận xóa bảng lương
 */

import { X, AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatMonthYear } from '../utils';

export function DeletePayrollModal({
    isOpen,
    onClose,
    payroll,
    onConfirm,
    submitting = false,
}) {
    if (!isOpen || !payroll) return null;

    const handleConfirm = () => {
        onConfirm(payroll.id);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-md rounded-lg bg-white shadow-xl mx-4">
                {/* Header */}
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <h2 className="text-lg font-semibold text-red-600 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Xóa bảng lương
                    </h2>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <p className="text-slate-600">
                        Bạn có chắc chắn muốn xóa bảng lương này?
                    </p>

                    <div className="p-4 rounded-lg bg-red-50 border border-red-200 space-y-2">
                        <p className="font-semibold text-red-800">
                            {payroll.teacher?.full_name}
                        </p>
                        <p className="text-sm text-red-700">
                            {formatMonthYear(payroll.period_month, payroll.period_year)}
                        </p>
                        <p className="text-sm text-red-700">
                            Thực nhận: {formatCurrency(payroll.net_salary)}
                        </p>
                    </div>

                    <p className="text-sm text-slate-500">
                        Hành động này không thể hoàn tác. Các sessions liên quan sẽ được giải phóng để có thể tạo bảng lương mới.
                    </p>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 border-t px-6 py-4">
                    <Button variant="outline" onClick={onClose}>
                        Hủy
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <>
                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Đang xóa...
                            </>
                        ) : (
                            <>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Xóa bảng lương
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default DeletePayrollModal;
