/**
 * CenterFormModal Component - Modal form thêm/sửa trung tâm
 */

import React, { useEffect, useState } from 'react';
import { TimeSelect } from '@/components/ui/time-select';
import { X, Building2, MapPin, Phone, Mail, Globe, Clock, FileText, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCenterForm } from '../hooks';
import { LogoUpload } from './LogoUpload';
import { DAY_LABELS, STATUS_OPTIONS } from '../utils';

export function CenterFormModal({
    isOpen,
    onClose,
    onSubmit,
    initialData = null,
    loading = false
}) {
    const {
        formData,
        errors,
        isDirty,
        updateField,
        updateWorkingHours,
        toggleDayOff,
        validate,
        resetForm,
        getSubmitData
    } = useCenterForm(initialData);

    const isEdit = !!initialData?.id;

    // Reset form khi modal mở/đóng hoặc data thay đổi
    useEffect(() => {
        if (isOpen) {
            resetForm(initialData);
        }
    }, [isOpen, initialData, resetForm]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        const data = getSubmitData();
        await onSubmit(data);
    };

    const handleClose = () => {
        if (isDirty) {
            if (window.confirm('Bạn có thay đổi chưa lưu. Bạn có chắc muốn đóng?')) {
                onClose();
            }
        } else {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 transition-opacity"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-card rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">
                                    {isEdit ? 'Chỉnh sửa trung tâm' : 'Thêm trung tâm mới'}
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    {isEdit ? 'Cập nhật thông tin trung tâm' : 'Điền thông tin để tạo trung tâm mới'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                        >
                            <X className="h-5 w-5 text-muted-foreground" />
                        </button>
                    </div>

                    {/* Body */}
                    <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
                        <div className="p-6 space-y-6">
                            {/* Thông tin cơ bản */}
                            <div>
                                <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Thông tin cơ bản
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Tên trung tâm */}
                                    <div className="md:col-span-2">
                                        <Label htmlFor="name">
                                            Tên trung tâm <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => updateField('name', e.target.value)}
                                            placeholder="VD: Trung tâm Anh ngữ ABC"
                                            className={errors.name ? 'border-red-500' : ''}
                                        />
                                        {errors.name && (
                                            <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                                        )}
                                    </div>

                                    {/* Mã trung tâm */}
                                    <div>
                                        <Label htmlFor="code">Mã trung tâm</Label>
                                        <Input
                                            id="code"
                                            value={formData.code}
                                            onChange={(e) => updateField('code', e.target.value.toUpperCase())}
                                            placeholder="VD: HN-01"
                                            className={errors.code ? 'border-red-500' : ''}
                                        />
                                        {errors.code && (
                                            <p className="text-sm text-red-500 mt-1">{errors.code}</p>
                                        )}
                                    </div>

                                    {/* Trạng thái */}
                                    <div>
                                        <Label htmlFor="status">Trạng thái</Label>
                                        <select
                                            id="status"
                                            value={formData.status}
                                            onChange={(e) => updateField('status', e.target.value)}
                                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        >
                                            {STATUS_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Địa chỉ & Liên hệ */}
                            <div>
                                <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    Địa chỉ & Liên hệ
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Địa chỉ */}
                                    <div className="md:col-span-2">
                                        <Label htmlFor="address">
                                            Địa chỉ <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="address"
                                            value={formData.address}
                                            onChange={(e) => updateField('address', e.target.value)}
                                            placeholder="VD: 123 Nguyễn Văn Cừ, Quận 5, TP.HCM"
                                            className={errors.address ? 'border-red-500' : ''}
                                        />
                                        {errors.address && (
                                            <p className="text-sm text-red-500 mt-1">{errors.address}</p>
                                        )}
                                    </div>

                                    {/* Hotline */}
                                    <div>
                                        <Label htmlFor="hotline" className="flex items-center gap-1">
                                            <Phone className="h-3 w-3" /> Hotline
                                        </Label>
                                        <Input
                                            id="hotline"
                                            value={formData.hotline}
                                            onChange={(e) => updateField('hotline', e.target.value)}
                                            placeholder="VD: 0901234567"
                                            className={errors.hotline ? 'border-red-500' : ''}
                                        />
                                        {errors.hotline && (
                                            <p className="text-sm text-red-500 mt-1">{errors.hotline}</p>
                                        )}
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <Label htmlFor="email" className="flex items-center gap-1">
                                            <Mail className="h-3 w-3" /> Email
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => updateField('email', e.target.value)}
                                            placeholder="VD: contact@abc.edu.vn"
                                            className={errors.email ? 'border-red-500' : ''}
                                        />
                                        {errors.email && (
                                            <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Logo Upload */}
                            <div>
                                <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
                                    <Image className="h-4 w-4" />
                                    Logo trung tâm
                                </h3>
                                <LogoUpload
                                    value={formData.logo_url}
                                    onChange={(url) => updateField('logo_url', url)}
                                    centerId={initialData?.id}
                                    disabled={loading}
                                />
                            </div>

                            {/* Mô tả */}
                            <div>
                                <Label htmlFor="description">Mô tả</Label>
                                <textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => updateField('description', e.target.value)}
                                    placeholder="Mô tả ngắn về trung tâm..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                                />
                            </div>

                            {/* Giờ làm việc */}
                            <div>
                                <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    Giờ làm việc
                                </h3>
                                <div className="space-y-3">
                                    {Object.entries(DAY_LABELS).map(([key, label]) => {
                                        const hours = formData.working_hours?.[key] || { open: '08:00', close: '21:00', closed: false };
                                        return (
                                            <div
                                                key={key}
                                                className={`flex items-center gap-4 p-3 rounded-lg ${hours.closed ? 'bg-muted/50' : 'bg-background border border-border'}`}
                                            >
                                                <div className="w-24">
                                                    <span className="font-medium text-foreground">{label}</span>
                                                </div>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={hours.closed}
                                                        onChange={() => toggleDayOff(key)}
                                                        className="w-4 h-4 rounded border-border text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                    <span className="text-sm text-muted-foreground">Nghỉ</span>
                                                </label>
                                                {!hours.closed && (
                                                    <>
                                                        <div className="flex items-center gap-2">
                                                            <TimeSelect
                                                                value={hours.open}
                                                                onChange={(val) => updateWorkingHours(key, 'open', val)}
                                                            />
                                                            <span className="text-muted-foreground">-</span>
                                                            <TimeSelect
                                                                value={hours.close}
                                                                onChange={(val) => updateWorkingHours(key, 'close', val)}
                                                            />
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-border bg-muted/50 flex items-center justify-end gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={loading}
                            >
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                {loading ? (
                                    <>
                                        <span className="animate-spin mr-2">⏳</span>
                                        Đang xử lý...
                                    </>
                                ) : isEdit ? (
                                    'Cập nhật'
                                ) : (
                                    'Tạo trung tâm'
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default CenterFormModal;
