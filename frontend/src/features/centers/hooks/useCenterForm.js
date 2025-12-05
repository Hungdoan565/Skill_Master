/**
 * useCenterForm Hook - Quản lý form state cho Center
 */

import { useState, useCallback, useEffect } from 'react';
import { DEFAULT_CENTER_FORM, DEFAULT_WORKING_HOURS } from '../utils';

export function useCenterForm(initialData = null) {
    const [formData, setFormData] = useState(DEFAULT_CENTER_FORM);
    const [errors, setErrors] = useState({});
    const [isDirty, setIsDirty] = useState(false);

    // Reset form về trạng thái ban đầu hoặc data mới
    const resetForm = useCallback((data = null) => {
        if (data) {
            setFormData({
                name: data.name || '',
                code: data.code || '',
                address: data.address || '',
                hotline: data.hotline || '',
                email: data.email || '',
                logo_url: data.logo_url || '',
                description: data.description || '',
                working_hours: data.working_hours || DEFAULT_WORKING_HOURS,
                status: data.status || 'active'
            });
        } else {
            setFormData(DEFAULT_CENTER_FORM);
        }
        setErrors({});
        setIsDirty(false);
    }, []);

    // Khởi tạo với data ban đầu
    useEffect(() => {
        if (initialData) {
            resetForm(initialData);
        }
    }, [initialData, resetForm]);

    // Cập nhật một field
    const updateField = useCallback((field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        setIsDirty(true);

        // Xóa error của field khi user sửa
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    }, [errors]);

    // Cập nhật working hours cho một ngày
    const updateWorkingHours = useCallback((day, field, value) => {
        setFormData(prev => ({
            ...prev,
            working_hours: {
                ...prev.working_hours,
                [day]: {
                    ...prev.working_hours[day],
                    [field]: value
                }
            }
        }));
        setIsDirty(true);
    }, []);

    // Toggle ngày nghỉ
    const toggleDayOff = useCallback((day) => {
        setFormData(prev => ({
            ...prev,
            working_hours: {
                ...prev.working_hours,
                [day]: {
                    ...prev.working_hours[day],
                    closed: !prev.working_hours[day].closed
                }
            }
        }));
        setIsDirty(true);
    }, []);

    // Validate form
    const validate = useCallback(() => {
        const newErrors = {};

        // Required fields
        if (!formData.name?.trim()) {
            newErrors.name = 'Tên trung tâm là bắt buộc';
        } else if (formData.name.length > 255) {
            newErrors.name = 'Tên trung tâm không được quá 255 ký tự';
        }

        if (formData.code && !/^[A-Z0-9_-]+$/i.test(formData.code)) {
            newErrors.code = 'Mã trung tâm chỉ được chứa chữ cái, số, gạch ngang và gạch dưới';
        }

        if (!formData.address?.trim()) {
            newErrors.address = 'Địa chỉ là bắt buộc';
        }

        if (formData.hotline && !/^[0-9\s\-+()]+$/.test(formData.hotline)) {
            newErrors.hotline = 'Số điện thoại không hợp lệ';
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email không hợp lệ';
        }

        if (formData.logo_url && !isValidUrl(formData.logo_url)) {
            newErrors.logo_url = 'URL logo không hợp lệ';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

    // Helper để kiểm tra URL
    const isValidUrl = (string) => {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    };

    // Lấy data để submit
    const getSubmitData = useCallback(() => {
        return {
            name: formData.name?.trim(),
            code: formData.code?.trim() || null,
            address: formData.address?.trim(),
            hotline: formData.hotline?.trim() || null,
            email: formData.email?.trim() || null,
            logo_url: formData.logo_url?.trim() || null,
            description: formData.description?.trim() || null,
            working_hours: formData.working_hours,
            status: formData.status
        };
    }, [formData]);

    return {
        formData,
        errors,
        isDirty,
        updateField,
        updateWorkingHours,
        toggleDayOff,
        validate,
        resetForm,
        getSubmitData,
        setErrors
    };
}

export default useCenterForm;
