/**
 * EditStudentModal Component
 * Modal chỉnh sửa thông tin học viên
 */

import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SimpleModal } from './SimpleModal';
import { SimpleSelect } from './SimpleSelect';

// Status options
const STATUS_OPTIONS = [
    { value: 'active', label: '🟢 Hoạt động' },
    { value: 'inactive', label: '🔴 Ngừng hoạt động' },
];

export function EditStudentModal({
    isOpen,
    onClose,
    student,
    onSubmit,
    submitting = false,
}) {
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        status: 'active',
    });

    // Populate form when student data changes
    useEffect(() => {
        if (student) {
            setFormData({
                full_name: student.full_name || '',
                phone: student.phone || '',
                status: student.status || 'active',
            });
        }
    }, [student]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(student.id, formData);
    };

    if (!student) return null;

    return (
        <SimpleModal
            isOpen={isOpen}
            onClose={onClose}
            title="Chỉnh sửa học viên"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email (readonly) */}
                <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                        value={student.email}
                        readOnly
                        disabled
                        className="bg-slate-50"
                    />
                    <p className="text-xs text-muted-foreground">
                        Email không thể thay đổi
                    </p>
                </div>

                {/* Họ tên */}
                <div className="space-y-2">
                    <Label htmlFor="edit_full_name">
                        Họ và tên <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="edit_full_name"
                        placeholder="Nguyễn Văn A"
                        value={formData.full_name}
                        onChange={(e) => handleChange('full_name', e.target.value)}
                        required
                    />
                </div>

                {/* Số điện thoại */}
                <div className="space-y-2">
                    <Label htmlFor="edit_phone">Số điện thoại</Label>
                    <Input
                        id="edit_phone"
                        type="tel"
                        placeholder="0901234567"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                    />
                </div>

                {/* Trạng thái */}
                <div className="space-y-2">
                    <Label>Trạng thái</Label>
                    <SimpleSelect
                        value={formData.status}
                        onChange={(value) => handleChange('status', value)}
                        options={STATUS_OPTIONS}
                    />
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
        </SimpleModal>
    );
}

export default EditStudentModal;
