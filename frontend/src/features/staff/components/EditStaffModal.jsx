/**
 * EditStaffModal Component
 * Modal chỉnh sửa thông tin nhân viên
 */

import { useState, useEffect } from 'react';
import { Save, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SimpleModal } from './SimpleModal';
import { SimpleSelect } from './SimpleSelect';
import { ROLE_OPTIONS } from '../utils';

// Status options
const STATUS_OPTIONS = [
    { value: 'active', label: '🟢 Hoạt động' },
    { value: 'inactive', label: '🔴 Ngừng hoạt động' },
];

export function EditStaffModal({
    isOpen,
    onClose,
    staff,
    centers = [],
    onSubmit,
    submitting = false,
}) {
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        role_code: 'TEACHER',
        status: 'active',
        hourly_rate: 150000,
        center_id: '',
    });

    // Populate form when staff data changes
    useEffect(() => {
        if (staff) {
            setFormData({
                full_name: staff.full_name || '',
                phone: staff.phone || '',
                role_code: staff.roles?.code || 'TEACHER',
                status: staff.status || 'active',
                hourly_rate: staff.hourly_rate || 150000,
                center_id: staff.center_id || '',
            });
        }
    }, [staff]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(staff.id, formData);
    };

    // Format currency input
    const formatCurrency = (value) => {
        const num = parseInt(value.toString().replace(/\D/g, ''), 10);
        return isNaN(num) ? 0 : num;
    };

    if (!staff) return null;

    return (
        <SimpleModal
            isOpen={isOpen}
            onClose={onClose}
            title="Chỉnh sửa nhân viên"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email (readonly) */}
                <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                        value={staff.email}
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

                {/* Row: Role + Status */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Vai trò */}
                    <div className="space-y-2">
                        <Label>Vai trò</Label>
                        <SimpleSelect
                            value={formData.role_code}
                            onChange={(value) => handleChange('role_code', value)}
                            options={ROLE_OPTIONS}
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
                </div>

                {/* Lương theo giờ (chỉ hiện nếu là Teacher) */}
                {formData.role_code === 'TEACHER' && (
                    <div className="space-y-2">
                        <Label htmlFor="edit_hourly_rate">
                            Lương theo giờ (VNĐ)
                        </Label>
                        <Input
                            id="edit_hourly_rate"
                            type="text"
                            placeholder="150000"
                            value={formData.hourly_rate.toLocaleString()}
                            onChange={(e) => handleChange('hourly_rate', formatCurrency(e.target.value))}
                        />
                        <p className="text-xs text-muted-foreground">
                            Mức lương mặc định khi tính bảng lương
                        </p>
                    </div>
                )}

                {/* Trung tâm */}
                <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Trung tâm làm việc
                    </Label>
                    <SimpleSelect
                        value={formData.center_id}
                        onChange={(value) => handleChange('center_id', value)}
                        placeholder="Chọn trung tâm..."
                        options={[
                            { value: '', label: '-- Không gán --' },
                            ...centers.map(c => ({ value: c.id, label: c.name }))
                        ]}
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

export default EditStaffModal;
