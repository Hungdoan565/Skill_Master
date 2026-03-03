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
  validateCourseForm,
  parseApiError
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
      const errorMessage = parseApiError(err, 'tạo khóa học');
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [accessToken, formData]);

  // Submit form - Cập nhật khóa học
  const updateCourse = useCallback(async (id) => {
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

      console.log('Update Course Payload:', payload);

      const response = await axios.put(`${API_URL}/api/courses/${id}`, payload, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.data?.success || false;
    } catch (err) {
      console.error('Error updating course:', err);
      const errorMessage = parseApiError(err, 'cập nhật khóa học');
      setError(errorMessage);
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
      status: course.status || 'active',
      // Parse JSON fields
      syllabus: typeof course.syllabus === 'string' ? JSON.parse(course.syllabus) : (course.syllabus || []),
      outcomes: typeof course.outcomes === 'string' ? JSON.parse(course.outcomes) : (course.outcomes || []),
      features: typeof course.features === 'string' ? JSON.parse(course.features) : (course.features || []),
      faq: typeof course.faq === 'string' ? JSON.parse(course.faq) : (course.faq || [])
    });

    setImagePreview(course.cover_image || null);
  }, []);

  // ============================================================
  // JSON ARRAY MANIPULATION HANDLERS
  // ============================================================

  // Syllabus handlers
  const addSyllabusModule = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      syllabus: [...prev.syllabus, { title: '', topics: [] }]
    }));
  }, []);

  const updateSyllabusModule = useCallback((index, field, value) => {
    setFormData(prev => {
      const newSyllabus = [...prev.syllabus];
      newSyllabus[index] = { ...newSyllabus[index], [field]: value };
      return { ...prev, syllabus: newSyllabus };
    });
  }, []);

  const removeSyllabusModule = useCallback((index) => {
    setFormData(prev => ({
      ...prev,
      syllabus: prev.syllabus.filter((_, i) => i !== index)
    }));
  }, []);

  const addSyllabusTopic = useCallback((moduleIndex, topic = '') => {
    setFormData(prev => {
      const newSyllabus = [...prev.syllabus];
      const newModule = { ...newSyllabus[moduleIndex] };
      newModule.topics = [...newModule.topics, topic];
      newSyllabus[moduleIndex] = newModule;
      return { ...prev, syllabus: newSyllabus };
    });
  }, []);

  const updateSyllabusTopic = useCallback((moduleIndex, topicIndex, value) => {
    setFormData(prev => {
      const newSyllabus = [...prev.syllabus];
      const newModule = { ...newSyllabus[moduleIndex] };
      const newTopics = [...newModule.topics];
      newTopics[topicIndex] = value;
      newModule.topics = newTopics;
      newSyllabus[moduleIndex] = newModule;
      return { ...prev, syllabus: newSyllabus };
    });
  }, []);

  const removeSyllabusTopic = useCallback((moduleIndex, topicIndex) => {
    setFormData(prev => {
      const newSyllabus = [...prev.syllabus];
      const newModule = { ...newSyllabus[moduleIndex] };
      newModule.topics = newModule.topics.filter((_, i) => i !== topicIndex);
      newSyllabus[moduleIndex] = newModule;
      return { ...prev, syllabus: newSyllabus };
    });
  }, []);

  // Outcomes handlers
  const addOutcome = useCallback((value = '') => {
    setFormData(prev => ({
      ...prev,
      outcomes: [...prev.outcomes, value]
    }));
  }, []);

  const updateOutcome = useCallback((index, value) => {
    setFormData(prev => {
      const newOutcomes = [...prev.outcomes];
      newOutcomes[index] = value;
      return { ...prev, outcomes: newOutcomes };
    });
  }, []);

  const removeOutcome = useCallback((index) => {
    setFormData(prev => ({
      ...prev,
      outcomes: prev.outcomes.filter((_, i) => i !== index)
    }));
  }, []);

  // Features handlers
  const addFeature = useCallback((value = '') => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, value]
    }));
  }, []);

  const updateFeature = useCallback((index, value) => {
    setFormData(prev => {
      const newFeatures = [...prev.features];
      newFeatures[index] = value;
      return { ...prev, features: newFeatures };
    });
  }, []);

  const removeFeature = useCallback((index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  }, []);

  // FAQ handlers
  const addFaq = useCallback(({ question = '', answer = '' } = {}) => {
    setFormData(prev => ({
      ...prev,
      faq: [...prev.faq, { question, answer }]
    }));
  }, []);

  const updateFaq = useCallback((index, field, value) => {
    setFormData(prev => {
      const newFaq = [...prev.faq];
      newFaq[index] = { ...newFaq[index], [field]: value };
      return { ...prev, faq: newFaq };
    });
  }, []);

  const removeFaq = useCallback((index) => {
    setFormData(prev => ({
      ...prev,
      faq: prev.faq.filter((_, i) => i !== index)
    }));
  }, []);

  // AI Content Generator - Tự động tạo nội dung
  const generateAIContent = useCallback(async () => {
    if (!formData.title || formData.title.trim().length < 2) {
      setError('Vui lòng nhập tên khóa học trước khi dùng AI Magic Fill');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${API_URL}/api/courses/ai-generate`,
        {
          title: formData.title.trim(),
          category: formData.category || undefined,
          level: formData.level || undefined
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );

      if (response.data.success) {
        const ai = response.data.data;
        setFormData(prev => ({
          ...prev,
          description: ai.description || prev.description,
          total_sessions: ai.total_sessions || prev.total_sessions,
          duration_weeks: ai.duration_weeks || prev.duration_weeks,
          category: ai.category || prev.category,
          level: ai.level || prev.level,
          syllabus: ai.syllabus?.length > 0 ? ai.syllabus : prev.syllabus,
          outcomes: ai.outcomes?.length > 0 ? ai.outcomes : prev.outcomes,
          features: ai.features?.length > 0 ? ai.features : prev.features,
          faq: ai.faq?.length > 0 ? ai.faq : prev.faq
        }));
      } else {
        setError(response.data.error || 'Không thể tạo nội dung AI');
      }
    } catch (err) {
      console.error('AI generate error:', err);
      const message = err.response?.data?.error || 'Lỗi kết nối AI service';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [accessToken, formData.category, formData.level, formData.title]);

  return {
    // State
    formData,
    loading,
    error,
    imagePreview,

    // Actions
    handleChange,
    setFieldValue,
    setFormData,
    handleImageChange,
    clearImage,
    createCourse,
    updateCourse,
    loadCourseData,
    generateAIContent,
    resetForm,
    setError,

    // JSON Array Handlers
    addSyllabusModule,
    updateSyllabusModule,
    removeSyllabusModule,
    addSyllabusTopic,
    updateSyllabusTopic,
    removeSyllabusTopic,
    addOutcome,
    updateOutcome,
    removeOutcome,
    addFeature,
    updateFeature,
    removeFeature,
    addFaq,
    updateFaq,
    removeFaq
  };
}

export default useCourseForm;
