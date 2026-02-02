/**
 * HolidayFormModal - Modal tạo/sửa ngày lễ
 */

import { useState, useEffect } from 'react';
import { X, Calendar, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HolidayFormModal({ isOpen, onClose, holiday, onSubmit, submitting }) {
    const [formData, setFormData] = useState({
        name: '',
        date: '',
        description: '',
        is_recurring: false
    });
    const [errors, setErrors] = useState({});

    const isEdit = !!holiday;

    useEffect(() => {
        if (holiday) {
            setFormData({
                name: holiday.name || '',
                date: holiday.date || '',
                description: holiday.description || '',
                is_recurring: holiday.is_recurring || false
            });
        } else {
            setFormData({
                name: '',
                date: '',
                description: '',
                is_recurring: false
            });
        }
        setErrors({});
    }, [holiday, isOpen]);

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) {
            newErrors.name = 'Tên ngày lễ là bắt buộc';
        }
        if (!formData.date) {
            newErrors.date = 'Ngày là bắt buộc';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            onSubmit(formData);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50" 
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-blue-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            {isEdit ? 'Chỉnh sửa ngày lễ' : 'Thêm ngày lễ mới'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tên ngày lễ <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder="VD: Tết Nguyên đán"
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                errors.name ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                        {errors.name && (
                            <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                        )}
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ngày <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => handleChange('date', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                errors.date ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                        {errors.date && (
                            <p className="mt-1 text-sm text-red-500">{errors.date}</p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mô tả
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="Mô tả thêm về ngày lễ..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        />
                    </div>

                    {/* Is Recurring */}
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="is_recurring"
                            checked={formData.is_recurring}
                            onChange={(e) => handleChange('is_recurring', e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="is_recurring" className="text-sm text-gray-700">
                            Lặp lại hàng năm (VD: 1/1, 30/4, 2/9...)
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            disabled={submitting}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {submitting ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Đang xử lý...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Save className="h-4 w-4" />
                                    {isEdit ? 'Cập nhật' : 'Tạo mới'}
                                </span>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default HolidayFormModal;
