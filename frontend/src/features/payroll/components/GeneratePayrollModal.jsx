/**
 * GeneratePayrollModal Component
 * Modal tạo bảng lương mới cho giáo viên
 */

import { useState, useEffect } from 'react';
import { X, DollarSign, FileText, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency, formatHours, formatMonthYear } from '../utils';

export function GeneratePayrollModal({
    isOpen,
    onClose,
    teacher,
    onSubmit,
    submitting = false,
}) {
    const [formData, setFormData] = useState({
        bonus: 0,
        deduction: 0,
        notes: '',
    });

    // Reset form khi mở modal
    useEffect(() => {
        if (isOpen) {
            setFormData({
                bonus: 0,
                deduction: 0,
                notes: '',
            });
        }
    }, [isOpen]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!teacher) return;

        onSubmit({
            teacher_id: teacher.id,
            month: teacher.month,
            year: teacher.year,
            bonus: parseFloat(formData.bonus) || 0,
            deduction: parseFloat(formData.deduction) || 0,
            notes: formData.notes,
        });
    };

    if (!isOpen || !teacher) return null;

    const netSalary = (teacher.base_salary || 0) +
        (parseFloat(formData.bonus) || 0) -
        (parseFloat(formData.deduction) || 0);

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm dark:bg-black/80"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative z-10 mx-4 w-full max-w-lg rounded-lg border border-border bg-card text-foreground shadow-xl dark:bg-zinc-950 dark:border-zinc-800 dark:shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-card dark:bg-zinc-950">
                    <h2 className="text-lg font-semibold">Tạo bảng lương</h2>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Teacher Info */}
                    <div className="p-4 rounded-lg bg-muted/50 dark:bg-muted/20 border border-border space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                                {teacher.full_name?.charAt(0)?.toUpperCase() || 'T'}
                            </div>
                            <div>
                                <p className="font-semibold">{teacher.full_name}</p>
                                <p className="text-sm text-muted-foreground">{teacher.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                {formatMonthYear(teacher.month, teacher.year)}
                            </span>
                            <span className="flex items-center gap-1">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                {teacher.total_sessions} buổi / {formatHours(teacher.total_hours)}
                            </span>
                        </div>
                    </div>

                    {/* Base Salary (readonly) */}
                    <div className="space-y-2">
                        <Label>Lương cơ bản</Label>
                        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 dark:bg-emerald-500/15 p-3">
                            <span className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                                {formatCurrency(teacher.base_salary || 0)}
                            </span>
                            <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                                {formatHours(teacher.total_hours)} × {formatCurrency(teacher.hourly_rate || 150000)}/giờ
                            </p>
                        </div>
                    </div>

                    {/* Bonus */}
                    <div className="space-y-2">
                        <Label htmlFor="bonus">Thưởng (VNĐ)</Label>
                        <Input
                            id="bonus"
                            type="number"
                            min="0"
                            placeholder="0"
                            value={formData.bonus}
                            onChange={(e) => handleChange('bonus', e.target.value)}
                        />
                    </div>

                    {/* Deduction */}
                    <div className="space-y-2">
                        <Label htmlFor="deduction">Khấu trừ (VNĐ)</Label>
                        <Input
                            id="deduction"
                            type="number"
                            min="0"
                            placeholder="0"
                            value={formData.deduction}
                            onChange={(e) => handleChange('deduction', e.target.value)}
                        />
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Ghi chú</Label>
                        <textarea
                            id="notes"
                            rows={3}
                            placeholder="Ghi chú thêm về bảng lương..."
                            value={formData.notes}
                            onChange={(e) => handleChange('notes', e.target.value)}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                    </div>

                    {/* Net Salary Preview */}
                    <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 dark:bg-indigo-500/15 p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Thực nhận</span>
                            <span className="text-xl font-bold text-indigo-700 dark:text-indigo-300">
                                {formatCurrency(netSalary)}
                            </span>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-2 border-t border-border pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Hủy
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting ? (
                                <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Đang tạo...
                                </>
                            ) : (
                                <>
                                    <DollarSign className="mr-2 h-4 w-4" />
                                    Tạo bảng lương
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default GeneratePayrollModal;
