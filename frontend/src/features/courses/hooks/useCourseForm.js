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

    if (course.cover_image) {
      setImagePreview(course.cover_image);
    }
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
    if (!formData.title) {
      setError('Vui lòng nhập tên khóa học để AI có cơ sở tạo nội dung');
      return;
    }

    setLoading(true);
    try {
      const titleLower = formData.title.toLowerCase();
      let aiData = {
        syllabus: [],
        outcomes: [],
        features: [],
        faq: []
      };

      if (titleLower.includes('ielts')) {
        aiData = {
          syllabus: [
            { title: "Module 1: Diagnostic Test & Pronunciation", topics: ["IELTS Overview", "Phonetic Symbols", "Intonation & Stress", "Mock Test 1"] },
            { title: "Module 2: Listening & Reading Strategies", topics: ["Skimming & Scanning", "Multiple Choice Hacks", "Map Labeling", "True/False/Not Given"] },
            { title: "Module 3: Writing Task 1 & 2 Focus", topics: ["Data Description", "Essay Structure", "Advanced Vocabulary", "Coherence & Cohesion"] },
            { title: "Module 4: Final Sprint & Full Mock Test", topics: ["Speaking Part 1,2,3", "Time Management", "Error Correction", "Full Test Simulation"] }
          ],
          outcomes: ["Đạt band điểm IELTS mong muốn (tối thiểu +1.0 band)", "Làm chủ 4 kỹ năng Nghe-Nói-Đọc-Viết", "Sử dụng thành thạo từ vựng học thuật chuyên sâu", "Vượt qua áp lực phòng thi thực tế"],
          features: ["Học với GV 8.5+ IELTS", "Giáo trình chuẩn Cambridge 2024", "Sửa bài Writing 1:1 chi tiết", "Miễn phí 5 lần thi thử chuẩn IDP/BC"],
          faq: [
            { question: "Khóa học này phù hợp với ai?", answer: "Phù hợp với học viên có trình độ Beginner/Intermediate muốn tăng band thần tốc." },
            { question: "Có cam kết đầu ra không?", answer: "Có, học viên được hoàn học phí hoặc học lại miễn phí nếu không đạt band mục tiêu." }
          ]
        };
      } else if (titleLower.includes('excel') || titleLower.includes('programming') || titleLower.includes('code')) {
        aiData = {
          syllabus: [
            { title: "Phần 1: Nền tảng & Tư duy cốt lõi", topics: ["Giới thiệu & Cài đặt", "Cú pháp cơ bản", "Biến & Kiểu dữ liệu", "Cấu trúc điều khiển"] },
            { title: "Phần 2: Kỹ thuật xử lý chuyên sâu", topics: ["Functions & Modules", "Cấu trúc dữ liệu nâng cao", "Xử lý lỗi & Debugging", "Tối ưu hóa mã nguồn"] },
            { title: "Phần 3: Xây dựng dự án thực tế", topics: ["Thiết kế Database", "Xây dựng Logic nghiệp vụ", "Tích hợp API", "Testing & Deployment"] }
          ],
          outcomes: ["Làm chủ tư duy lập trình/phân tích dữ liệu chuyên nghiệp", "Tự tay xây dựng 2-3 dự án thực tế cho Portfolio", "Nắm vững kỹ năng giải quyết vấn đề (Problem Solving)", "Ready cho các vị trí Junior/Mid-level"],
          features: ["Học qua dự án thực tế (Project-based learning)", "Mentor hỗ trợ 24/7", "Truy cập kho tài liệu trọn đời", "Hỗ trợ kết nối việc làm với 50+ đối tác"],
          faq: [
            { question: "Người mới chưa biết gì có học được không?", answer: "Được, lộ trình được thiết kế chi tiết từ con số 0." },
            { question: "Sau khóa học tôi làm được gì?", answer: "Bạn có thể tự tin ứng tuyển các vị trí kỹ thuật hoặc tự xây dựng sản phẩm cá nhân." }
          ]
        };
      } else {
        aiData = {
          syllabus: [
            { title: "Module 1: Nhập môn & Khái quát", topics: ["Tổng quan lĩnh vực", "Lịch sử & Xu hướng", "Công cụ cần thiết"] },
            { title: "Module 2: Kỹ năng chuyên môn 1", topics: ["Nguyên lý cốt lõi", "Thực hành cơ bản", "Case study 1"] },
            { title: "Module 3: Kỹ năng nâng cao & Tổng kết", topics: ["Kỹ thuật chuyên sâu", "Ứng dụng thực tế", "Đồ án cuối khóa"] }
          ],
          outcomes: ["Nắm chắc kiến thức nền tảng vững chắc", "Thực hành thành thạo các kỹ năng chuyên môn", "Tự tin ứng dụng vào thực tế công việc", "Nhận chứng chỉ hoàn thành khóa học"],
          features: ["Giảng viên chuyên gia giàu kinh nghiệm", "Lớp học quy mô nhỏ, tương tác cao", "Môi trường học tập hiện đại", "Hệ thống hỗ trợ học tập trực tuyến"],
          faq: [
            { question: "Thời gian học như thế nào?", answer: "Lịch học linh động, có các ca tối và cuối tuần phù hợp người đi làm." },
            { question: "Có hỗ trợ trả góp học phí không?", answer: "Có, hệ thống hỗ trợ trả góp qua thẻ tín dụng với lãi suất 0%." }
          ]
        };
      }

      await new Promise(resolve => setTimeout(resolve, 800));

      setFormData(prev => ({
        ...prev,
        syllabus: aiData.syllabus,
        outcomes: aiData.outcomes,
        features: aiData.features,
        faq: aiData.faq
      }));

      setError('');
    } catch (err) {
      console.error('AI Generation Error:', err);
      setError('Không thể tạo nội dung AI lúc này. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [formData.title]);

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
