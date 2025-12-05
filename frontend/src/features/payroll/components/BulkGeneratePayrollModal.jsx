/**
 * BulkGeneratePayrollModal Component
 * Modal để tạo bảng lương hàng loạt cho nhiều giáo viên
 */

import { useState, useEffect } from 'react';
import { X, Users, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency, formatMonthYear } from '../utils';

export function BulkGeneratePayrollModal({
    isOpen,
    onClose,
    teachers = [],
    month,
    year,
    onSubmit,
    submitting,
}) {
    const [selectedTeachers, setSelectedTeachers] = useState([]);
    const [bonus, setBonus] = useState('0');
    const [deduction, setDeduction] = useState('0');
    const [notes, setNotes] = useState('');
    const [result, setResult] = useState(null);

    // Reset khi mở modal
    useEffect(() => {
        if (isOpen) {
            // Chọn sẵn tất cả GV chưa có payroll và có sessions
            const eligibleTeachers = teachers.filter(t => !t.payroll && t.total_sessions > 0);
            setSelectedTeachers(eligibleTeachers.map(t => t.id));
            setBonus('0');
            setDeduction('0');
            setNotes('');
            setResult(null);
        }
    }, [isOpen, teachers]);

    if (!isOpen) return null;

    // Lọc giáo viên có thể tạo payroll (chưa có và có sessions)
    const eligibleTeachers = teachers.filter(t => !t.payroll && t.total_sessions > 0);
    const hasAlreadyPayroll = teachers.filter(t => t.payroll);
    const noSessions = teachers.filter(t => !t.payroll && t.total_sessions === 0);

    const toggleSelect = (teacherId) => {
        setSelectedTeachers(prev =>
            prev.includes(teacherId)
                ? prev.filter(id => id !== teacherId)
                : [...prev, teacherId]
        );
    };

    const selectAll = () => {
        setSelectedTeachers(eligibleTeachers.map(t => t.id));
    };

    const deselectAll = () => {
        setSelectedTeachers([]);
    };

    const handleSubmit = async () => {
        if (selectedTeachers.length === 0) return;

        const data = {
            teacher_ids: selectedTeachers,
            month,
            year,
            bonus: parseFloat(bonus) || 0,
            deduction: parseFloat(deduction) || 0,
            notes,
        };

        try {
            const response = await onSubmit(data);
            setResult(response.data);
        } catch (error) {
            console.error('Bulk generate error:', error);
        }
    };

    // Tính tổng lương dự kiến
    const totalEstimated = eligibleTeachers
        .filter(t => selectedTeachers.includes(t.id))
        .reduce((sum, t) => sum + (t.base_salary || 0), 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-auto rounded-lg bg-white shadow-xl mx-4">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Users className="h-5 w-5 text-indigo-600" />
                            Tạo bảng lương hàng loạt
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            {formatMonthYear(month, year)}
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {result ? (
                        // Hiển thị kết quả
                        <div className="space-y-4">
                            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                                <h3 className="font-semibold text-green-800 flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5" />
                                    Hoàn thành!
                                </h3>
                                <p className="text-sm text-green-700 mt-1">
                                    Đã tạo thành công {result.success?.length || 0} bảng lương
                                </p>
                            </div>

                            {result.success?.length > 0 && (
                                <div>
                                    <h4 className="font-medium mb-2 text-green-700">✓ Thành công:</h4>
                                    <ul className="text-sm space-y-1 max-h-32 overflow-auto">
                                        {result.success.map((item, idx) => (
                                            <li key={idx} className="text-green-600">
                                                • {item.teacher_name}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {result.failed?.length > 0 && (
                                <div>
                                    <h4 className="font-medium mb-2 text-red-700">✗ Thất bại:</h4>
                                    <ul className="text-sm space-y-1 max-h-32 overflow-auto">
                                        {result.failed.map((item, idx) => (
                                            <li key={idx} className="text-red-600">
                                                • {item.teacher_name || item.teacher_id}: {item.reason}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="flex justify-end">
                                <Button onClick={onClose}>Đóng</Button>
                            </div>
                        </div>
                    ) : (
                        // Form chọn giáo viên
                        <>
                            {/* Thông báo */}
                            {hasAlreadyPayroll.length > 0 && (
                                <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-sm">
                                    <span className="text-yellow-700">
                                        ⚠️ {hasAlreadyPayroll.length} giáo viên đã có bảng lương tháng này
                                    </span>
                                </div>
                            )}

                            {noSessions.length > 0 && (
                                <div className="p-3 rounded-lg bg-slate-50 border text-sm">
                                    <span className="text-slate-600">
                                        ℹ️ {noSessions.length} giáo viên không có buổi dạy tháng này
                                    </span>
                                </div>
                            )}

                            {/* Danh sách giáo viên */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <Label>Chọn giáo viên ({selectedTeachers.length}/{eligibleTeachers.length})</Label>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" onClick={selectAll}>
                                            Chọn tất cả
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={deselectAll}>
                                            Bỏ chọn
                                        </Button>
                                    </div>
                                </div>

                                {eligibleTeachers.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400 border rounded-lg">
                                        <AlertCircle className="h-10 w-10 mx-auto mb-2" />
                                        <p>Không có giáo viên nào đủ điều kiện</p>
                                    </div>
                                ) : (
                                    <div className="border rounded-lg max-h-64 overflow-auto">
                                        {eligibleTeachers.map((teacher) => (
                                            <label
                                                key={teacher.id}
                                                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer border-b last:border-0"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedTeachers.includes(teacher.id)}
                                                    onChange={() => toggleSelect(teacher.id)}
                                                    className="rounded border-slate-300"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">{teacher.full_name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {teacher.total_sessions} buổi • {teacher.total_hours}h
                                                    </p>
                                                </div>
                                                <span className="text-sm font-medium text-green-600">
                                                    {formatCurrency(teacher.base_salary || 0)}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Bonus/Deduction áp dụng chung */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="bulk-bonus">Thưởng (áp dụng cho tất cả)</Label>
                                    <Input
                                        id="bulk-bonus"
                                        type="number"
                                        value={bonus}
                                        onChange={(e) => setBonus(e.target.value)}
                                        min="0"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="bulk-deduction">Khấu trừ (áp dụng cho tất cả)</Label>
                                    <Input
                                        id="bulk-deduction"
                                        type="number"
                                        value={deduction}
                                        onChange={(e) => setDeduction(e.target.value)}
                                        min="0"
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <Label htmlFor="bulk-notes">Ghi chú</Label>
                                <textarea
                                    id="bulk-notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                                    rows={2}
                                    placeholder="Ghi chú chung cho tất cả bảng lương..."
                                />
                            </div>

                            {/* Summary */}
                            {selectedTeachers.length > 0 && (
                                <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-200">
                                    <div className="flex justify-between items-center">
                                        <span className="text-indigo-700">Tổng lương dự kiến:</span>
                                        <span className="text-xl font-bold text-indigo-600">
                                            {formatCurrency(totalEstimated)}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex justify-end gap-3">
                                <Button variant="outline" onClick={onClose}>
                                    Hủy
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={selectedTeachers.length === 0 || submitting}
                                >
                                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Tạo {selectedTeachers.length} bảng lương
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default BulkGeneratePayrollModal;
