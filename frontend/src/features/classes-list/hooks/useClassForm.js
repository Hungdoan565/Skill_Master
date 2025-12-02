/**
 * useClassForm Hook - Quản lý form tạo/sửa lớp học
 */

import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '@/lib/supabaseClient';
import { 
  API_URL, 
  DEFAULT_CLASS_FORM,
  parseSchedule,
  generateClassName,
  generateClassCode,
  buildScheduleArray
} from '../utils';

// Helper: Lấy auth headers
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Chưa đăng nhập');
  return { Authorization: `Bearer ${session.access_token}` };
};

/**
 * Hook quản lý form tạo/sửa lớp học
 */
export function useClassForm() {
  const [formData, setFormData] = useState({ ...DEFAULT_CLASS_FORM });
  const [selectedDays, setSelectedDays] = useState([]);
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('20:00');
  const [submitting, setSubmitting] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [formError, setFormError] = useState(null);

  // Build schedule array khi thay đổi ngày/giờ
  useEffect(() => {
    const newSchedule = buildScheduleArray(selectedDays, startTime, endTime);
    setFormData(prev => ({ ...prev, schedule: newSchedule }));
  }, [selectedDays, startTime, endTime]);

  // Reset form
  const resetForm = useCallback((defaultCenterId = '') => {
    setEditingClass(null);
    setSelectedDays([]);
    setStartTime('18:00');
    setEndTime('20:00');
    setFormError(null);
    setFormData({
      ...DEFAULT_CLASS_FORM,
      center_id: defaultCenterId
    });
  }, []);

  // Load class data để edit
  const loadClassData = useCallback((classItem) => {
    if (!classItem) return;

    setEditingClass(classItem);
    
    // Parse schedule an toàn
    const schedule = parseSchedule(classItem.schedule);
    const days = schedule.map(s => s.day);
    const time = schedule[0] || { start: '18:00', end: '20:00' };
    
    setSelectedDays(days);
    setStartTime(time.start || '18:00');
    setEndTime(time.end || '20:00');
    
    setFormData({
      code: classItem.code || '',
      name: classItem.name || '',
      course_id: classItem.course_id || classItem.courses?.id || '',
      teacher_id: classItem.teacher_id || classItem.teacher?.id || '',
      center_id: classItem.center_id || classItem.centers?.id || '',
      room_id: classItem.room_id || '',
      start_date: classItem.start_date || '',
      end_date: classItem.end_date || '',
      schedule: schedule,
      max_students: classItem.max_students || 20,
      status: classItem.status || 'upcoming'
    });
  }, []);

  // Toggle day selection
  const toggleDay = useCallback((day) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day) 
        : [...prev, day].sort((a, b) => a - b)
    );
  }, []);

  // Update field
  const updateField = useCallback((name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  // Update multiple fields
  const updateFields = useCallback((updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  // Auto-generate code và name khi chọn khóa học
  const handleCourseChange = useCallback((courseId, courses) => {
    const selectedCourse = courses.find(c => c.id === courseId);
    
    if (selectedCourse) {
      const newCode = generateClassCode(selectedCourse.code, formData.start_date);
      const newName = generateClassName(selectedCourse.code, formData.start_date);
      
      setFormData(prev => ({
        ...prev,
        course_id: courseId,
        code: newCode,
        name: newName
      }));
    } else {
      setFormData(prev => ({ ...prev, course_id: courseId }));
    }
  }, [formData.start_date]);

  // Auto-update code và name khi đổi ngày khai giảng
  const handleStartDateChange = useCallback((newStartDate, courses) => {
    const course = courses.find(c => c.id === formData.course_id);
    let newCode = formData.code;
    let newName = formData.name;
    
    if (course && newStartDate) {
      newCode = generateClassCode(course.code, newStartDate);
      newName = generateClassName(course.code, newStartDate);
    }
    
    setFormData(prev => ({
      ...prev,
      start_date: newStartDate,
      code: newCode,
      name: newName
    }));
  }, [formData.course_id, formData.code, formData.name]);

  // Regenerate name from code
  const regenerateName = useCallback((courses) => {
    const course = courses.find(c => c.id === formData.course_id);
    if (course) {
      const autoName = generateClassName(course.code, formData.start_date);
      setFormData(prev => ({ ...prev, name: autoName }));
    }
  }, [formData.course_id, formData.start_date]);

  // Submit form
  const submitForm = useCallback(async () => {
    setSubmitting(true);
    setFormError(null);

    try {
      const headers = await getAuthHeaders();
      
      const payload = {
        ...formData,
        room: null
      };

      if (editingClass) {
        await axios.put(`${API_URL}/api/admin/classes/${editingClass.id}`, payload, { headers });
      } else {
        await axios.post(`${API_URL}/api/admin/classes`, payload, { headers });
      }

      return true;
    } catch (error) {
      console.error('Error saving class:', error);
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi lưu lớp học';
      setFormError(errorMessage);
      throw error;
    } finally {
      setSubmitting(false);
    }
  }, [formData, editingClass]);

  // Clear error
  const clearFormError = useCallback(() => {
    setFormError(null);
  }, []);

  return {
    // Form state
    formData,
    selectedDays,
    startTime,
    endTime,
    submitting,
    editingClass,
    isEditing: !!editingClass,
    formError,

    // Actions
    resetForm,
    loadClassData,
    toggleDay,
    updateField,
    updateFields,
    handleCourseChange,
    handleStartDateChange,
    regenerateName,
    submitForm,
    setStartTime,
    setEndTime,
    clearFormError
  };
}

export default useClassForm;
