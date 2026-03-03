/**
 * EditPayrollModal Component  
 * Modal chỉnh sửa bảng lương (bonus, deduction, notes)
 */

import { useState, useEffect } from 'react';
import { X, Save, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency, formatHours, formatMonthYear, getPayrollStatusLabel } from '../utils';

export function EditPayrollModal({
    isOpen,
    onClose,
    payroll,
    onSubmit,
    submitting = false,
}) {
    const [formData, setFormData] = useState({
        bonus: 0,
        deduction: 0,
        notes: '',
    });

    // Populate form when payroll changes
    useEffect(() => {
        if (payroll) {
            setFormData({
                bonus: payroll.bonus || 0,
                deduction: payroll.deduction || 0,
                notes: payroll.notes || '',
            });
        }
    }, [payroll]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!payroll) return;

        onSubmit(payroll.id, {
            bonus: parseFloat(formData.bonus) || 0,
            deduction: parseFloat(formData.deduction) || 0,
            notes: formData.notes,
        });
    };

    if (!isOpen || !payroll) return null;

    const netSalary = (parseFloat(payroll.base_salary) || 0) +
        (parseFloat(formData.bonus) || 0) -
        (parseFloat(formData.deduction) || 0);

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-lg rounded-lg bg-white shadow-xl mx-4">
                {/* Header */}
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <h2 className="text-lg font-semibold">Chỉnh sửa bảng lương</h2>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Payroll Info */}
                    <div className="p-4 rounded-lg bg-slate-50 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="font-semibold">{payroll.teacher?.full_name}</span>
                            <span className="text-sm text-muted-foreground">
                                {formatMonthYear(payroll.period_month, payroll.period_year)}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{payroll.total_sessions} buổi</span>
                            <span>{formatHours(payroll.total_hours)}</span>
                            <span>Trạng thái: {getPayrollStatusLabel(payroll.status)}</span>
                        </div>
                    </div>

                    {/* Base Salary (readonly) */}
                    <div className="space-y-2">
                        <Label>Lương cơ bản</Label>
                        <div className="p-3 rounded-lg bg-slate-100">
                            <span className="text-lg font-semibold">
                                {formatCurrency(payroll.base_salary || 0)}
                            </span>
                        </div>
                    </div>

                    {/* Bonus */}
                    <div className="space-y-2">
                        <Label htmlFor="edit_bonus">Thưởng (VNĐ)</Label>
                        <Input
                            id="edit_bonus"
                            type="number"
                            min="0"
                            placeholder="0"
                            value={formData.bonus}
                            onChange={(e) => handleChange('bonus', e.target.value)}
                        />
                    </div>

                    {/* Deduction */}
                    <div className="space-y-2">
                        <Label htmlFor="edit_deduction">Khấu trừ (VNĐ)</Label>
                        <Input
                            id="edit_deduction"
                            type="number"
                            min="0"
                            placeholder="0"
                            value={formData.deduction}
                            onChange={(e) => handleChange('deduction', e.target.value)}
                        />
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="edit_notes">Ghi chú</Label>
                        <textarea
                            id="edit_notes"
                            rows={3}
                            placeholder="Ghi chú thêm về bảng lương..."
                            value={formData.notes}
                            onChange={(e) => handleChange('notes', e.target.value)}
                            className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                    </div>

                    {/* Net Salary Preview */}
                    <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-green-700">Thực nhận</span>
                            <span className="text-xl font-bold text-green-700">
                                {formatCurrency(netSalary)}
                            </span>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Hủy
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting ? (
                                <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
                </form>
            </div>
        </div>
    );
}

export default EditPayrollModal;
