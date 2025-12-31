/**
 * StudentTransferModal Component
 * Modal cho phép Super Admin chuyển học viên giữa các chi nhánh
 */

import { useState, useEffect } from 'react';
import { Send, AlertCircle, Building2, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { SimpleModal } from './SimpleModal';
import { SimpleSelect } from './SimpleSelect';
import { useCenters } from '@/features/centers/hooks/useCenters';
import { Badge } from '@/components/ui/badge';

export function StudentTransferModal({
    isOpen,
    onClose,
    student,
    onSubmit,
    submitting = false,
}) {
    const { centers, fetchCenters } = useCenters();
    const [formData, setFormData] = useState({
        target_center_id: '',
        transfer_enrollments: true,
        notes: '',
    });

    // Load centers when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchCenters();
        }
    }, [isOpen, fetchCenters]);

    // Reset form when student changes
    useEffect(() => {
        if (student) {
            setFormData({
                target_center_id: '',
                transfer_enrollments: true,
                notes: '',
            });
        }
    }, [student]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.target_center_id) return;
        onSubmit(student.id, formData);
    };

    if (!student) return null;

    // Filter out current center from target options
    const targetCenterOptions = centers
        .filter(c => c.id !== student.center_id)
        .map(c => ({
            value: c.id,
            label: `🏢 ${c.name} (${c.code || 'N/A'})`
        }));

    const currentCenter = student.centers?.name || 'Chưa xác định';

    return (
        <SimpleModal
            isOpen={isOpen}
            onClose={onClose}
            title="Chuyển học viên sang chi nhánh khác"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Current Info */}
                <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-indigo-600 font-bold border border-indigo-200 shadow-sm">
                        {student.full_name?.charAt(0)}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-900">{student.full_name}</p>
                        <p className="text-xs text-indigo-600 flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {currentCenter}
                        </p>
                    </div>
                </div>

                {/* Target Center */}
                <div className="space-y-2">
                    <Label className="text-sm font-semibold">Chọn chi nhánh đích</Label>
                    <SimpleSelect
                        value={formData.target_center_id}
                        onChange={(value) => handleChange('target_center_id', value)}
                        options={targetCenterOptions}
                        placeholder="Chọn chi nhánh mới..."
                    />
                    {targetCenterOptions.length === 0 && (
                        <p className="text-[10px] text-amber-600 italic">
                            Chưa có chi nhánh khác để chuyển tới.
                        </p>
                    )}
                </div>

                {/* Enrollment Option */}
                <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between">
                        <Label className="font-medium cursor-pointer" htmlFor="transfer_enroll">Chuyển các lớp học hiện tại</Label>
                        <input
                            id="transfer_enroll"
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                            checked={formData.transfer_enrollments}
                            onChange={(e) => handleChange('transfer_enrollments', e.target.checked)}
                        />
                    </div>
                    <p className="text-xs text-slate-500">
                        {formData.transfer_enrollments
                            ? "✅ Các đăng ký lớp học đang active sẽ được chuyển (giữ nguyên lớp cũ)."
                            : "⚠️ Các lớp học hiện tại sẽ bị hủy (Status: Cancelled)."}
                    </p>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                    <Label className="text-sm font-semibold">Ghi chú lý do</Label>
                    <textarea
                        className="w-full min-h-[80px] rounded-lg border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Ví dụ: Học viên chuyển chỗ ở, yêu cầu chuyển chi nhánh gần nhà..."
                        value={formData.notes}
                        onChange={(e) => handleChange('notes', e.target.value)}
                    />
                </div>

                {/* Warning */}
                <div className="flex gap-2 p-3 bg-amber-50 rounded-lg text-amber-700">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p className="text-xs">
                        Hành động này sẽ thay đổi chi nhánh quản lý của học viên. Quyền truy cập dữ liệu của nhân viên chi nhánh cũ sẽ bị giới hạn.
                    </p>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
                        Hủy
                    </Button>
                    <Button
                        type="submit"
                        disabled={submitting || !formData.target_center_id}
                        className="rounded-xl bg-indigo-600 hover:bg-indigo-700"
                    >
                        {submitting ? (
                            <>
                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Đang chuyển...
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-4 w-4" />
                                Xác nhận chuyển
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </SimpleModal>
    );
}

export default StudentTransferModal;
