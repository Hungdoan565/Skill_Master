/**
 * useCourseForm Hook - Quản lý form tạo/sửa khóa học
 */

import { useState, useCallback } from 'react';
import axios from 'axios';
import { 
  API_URL, 
  DEFAULT_COURSE_FORM,
  formatPriceInput,
  parsePriceValue,
  validateCourseForm
} from '../utils';

/**
 * Hook quản lý form khóa học
 * @param {string} accessToken - Token xác thực
 */
export function useCourseForm(accessToken) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({ ...DEFAULT_COURSE_FORM });

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({ ...DEFAULT_COURSE_FORM });
    setImagePreview(null);
    setError('');
  }, []);

  // Handle input change
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    
    if (name === 'code') {
      // Auto uppercase cho mã khóa học
      setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }));
    } else if (name === 'price') {
      // Format giá tiền
      setFormData(prev => ({ ...prev, [name]: formatPriceInput(value) }));
    } else if (name === 'total_sessions' || name === 'duration_weeks') {
      // Chỉ cho số
      const num = parseInt(value) || '';
      setFormData(prev => ({ ...prev, [name]: num }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  }, []);

  // Set field value directly
  const setFieldValue = useCallback((name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  // Handle image upload
  const handleImageChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Ảnh không được vượt quá 5MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setFormData(prev => ({ ...prev, cover_image: reader.result }));
    };
    reader.readAsDataURL(file);
  }, []);

  // Clear image
  const clearImage = useCallback(() => {
    setImagePreview(null);
    setFormData(prev => ({ ...prev, cover_image: '' }));
  }, []);

  // Submit form - Tạo khóa học mới
  const createCourse = useCallback(async () => {
    setError('');

    // Validate
    const validationError = validateCourseForm(formData);
    if (validationError) {
      setError(validationError);
      return false;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        price: parsePriceValue(formData.price)
      };

      const response = await axios.post(`${API_URL}/api/courses`, payload, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.data?.success || false;
    } catch (err) {
      console.error('Error creating course:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo khóa học');
      return false;
    } finally {
      setLoading(false);
    }
  }, [accessToken, formData]);

  // Load course data để edit
  const loadCourseData = useCallback((course) => {
    if (!course) return;
    
    setFormData({
      code: course.code || '',
      title: course.title || '',
      category: course.category || 'ielts',
      level: course.level || 'Beginner',
      total_sessions: course.total_sessions || 24,
      duration_weeks: course.duration_weeks || 12,
      price: formatPriceInput(String(course.price || '')),
      cover_image: course.cover_image || '',
      description: course.description || '',
      status: course.status || 'active'
    });
    
    if (course.cover_image) {
      setImagePreview(course.cover_image);
    }
  }, []);

  return {
    // State
    formData,
    loading,
    error,
    imagePreview,
    
    // Actions
    handleChange,
    setFieldValue,
    handleImageChange,
    clearImage,
    createCourse,
    loadCourseData,
    resetForm,
    setError
  };
}

export default useCourseForm;
