/**
 * EditCourseModal Component - Modal chỉnh sửa khóa học
 * 
 * Sử dụng lại logic từ CreateCourseModal nhưng với mode edit
 */

import { useEffect, useState } from 'react';
import { 
  BookOpen, X, DollarSign, Clock, 
  Image as ImageIcon, AlertCircle, Loader2, Save 
} from 'lucide-react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  API_URL,
  CATEGORIES, 
  LEVELS, 
  COURSE_STATUS,
  formatPriceInput,
  parsePriceValue,
  validateCourseForm
} from '../utils';

export function EditCourseModal({ isOpen, onClose, onSuccess, course, accessToken }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    category: 'ielts',
    level: 'Beginner',
    total_sessions: 24,
    duration_weeks: 12,
    price: '',
    cover_image: '',
    description: '',
    status: 'active'
  });

  // Load course data khi mở modal
  useEffect(() => {
    if (isOpen && course) {
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
      } else {
        setImagePreview(null);
      }
      setError('');
    }
  }, [isOpen, course]);

  // Reset when closing
  useEffect(() => {
    if (!isOpen) {
      setError('');
      setLoading(false);
    }
  }, [isOpen]);

  // ESC key handler
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose, loading]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'code') {
      setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }));
    } else if (name === 'price') {
      setFormData(prev => ({ ...prev, [name]: formatPriceInput(value) }));
    } else if (name === 'total_sessions' || name === 'duration_weeks') {
      const num = parseInt(value) || '';
      setFormData(prev => ({ ...prev, [name]: num }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Set field value directly
  const setFieldValue = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle image upload
  const handleImageChange = (e) => {
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
  };

  // Clear image
  const clearImage = () => {
    setImagePreview(null);
    setFormData(prev => ({ ...prev, cover_image: '' }));
  };

  // Submit form - Cập nhật khóa học
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate
    const validationError = validateCourseForm(formData);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        price: parsePriceValue(formData.price)
      };

      const response = await axios.put(
        `${API_URL}/api/courses/${course.id}`, 
        payload, 
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (response.data?.success) {
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      console.error('Error updating course:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật khóa học');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !course) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-course-modal-title"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!loading ? onClose : undefined}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-3xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-linear-to-r from-blue-500 to-indigo-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 id="edit-course-modal-title" className="text-lg font-semibold text-white">Chỉnh sửa khóa học</h2>
                <p className="text-sm text-white/80">
                  <span className="font-mono bg-white/20 px-1.5 py-0.5 rounded text-xs mr-2">
                    {course.code}
                  </span>
                  {course.title}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
              aria-label="Đóng modal"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CỘT TRÁI - Thông tin định danh */}
            <div className="space-y-4">
              <h3 className="font-medium text-zinc-900 flex items-center gap-2 pb-2 border-b">
                <BookOpen className="w-4 h-4 text-blue-500" />
                Thông tin định danh
              </h3>

              {/* Mã khóa học */}
              <div className="space-y-1.5">
                <Label htmlFor="code" className="text-sm font-medium">
                  Mã khóa học <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="VD: IELTS-FOUNDATION"
                  className="font-mono uppercase"
                />
                <p className="text-xs text-zinc-500">Mã duy nhất, tự động chuyển UPPERCASE</p>
              </div>

              {/* Tên khóa học */}
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-sm font-medium">
                  Tên khóa học <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="VD: IELTS Foundation - Cơ bản"
                />
              </div>

              {/* Danh mục */}
              <div className="space-y-1.5">
                <Label htmlFor="category" className="text-sm font-medium">
                  Danh mục <span className="text-red-500">*</span>
                </Label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {/* Trình độ */}
              <div className="space-y-1.5">
                <Label htmlFor="level" className="text-sm font-medium">
                  Trình độ
                </Label>
                <select
                  id="level"
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {LEVELS.map(lv => (
                    <option key={lv.value} value={lv.value}>{lv.label}</option>
                  ))}
                </select>
              </div>

              {/* Học phí */}
              <div className="space-y-1.5">
                <Label htmlFor="price" className="text-sm font-medium">
                  Học phí <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <Input
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="5.000.000"
                    className="pl-9 pr-12 font-mono text-right"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">đ</span>
                </div>
              </div>
            </div>

            {/* CỘT PHẢI - Chi tiết */}
            <div className="space-y-4">
              <h3 className="font-medium text-zinc-900 flex items-center gap-2 pb-2 border-b">
                <Clock className="w-4 h-4 text-indigo-500" />
                Thông số đào tạo
              </h3>

              {/* Số buổi học */}
              <div className="space-y-1.5">
                <Label htmlFor="total_sessions" className="text-sm font-medium">
                  Số buổi học
                </Label>
                <div className="relative">
                  <Input
                    id="total_sessions"
                    name="total_sessions"
                    type="number"
                    min="1"
                    value={formData.total_sessions}
                    onChange={handleChange}
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">buổi</span>
                </div>
              </div>

              {/* Thời lượng */}
              <div className="space-y-1.5">
                <Label htmlFor="duration_weeks" className="text-sm font-medium">
                  Thời lượng khóa học
                </Label>
                <div className="relative">
                  <Input
                    id="duration_weeks"
                    name="duration_weeks"
                    type="number"
                    min="1"
                    value={formData.duration_weeks}
                    onChange={handleChange}
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">tuần</span>
                </div>
              </div>

              {/* Ảnh bìa */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Ảnh bìa</Label>
                <div className="border-2 border-dashed border-zinc-200 rounded-lg p-4 text-center hover:border-blue-300 transition-colors">
                  {imagePreview ? (
                    <div className="relative">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={clearImage}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <div className="flex flex-col items-center gap-2 py-4">
                        <div className="p-3 bg-zinc-100 rounded-full">
                          <ImageIcon className="w-6 h-6 text-zinc-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-700">Chọn ảnh hoặc kéo thả</p>
                          <p className="text-xs text-zinc-500">PNG, JPG tối đa 5MB</p>
                        </div>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              {/* Mô tả */}
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-sm font-medium">
                  Mô tả ngắn
                </Label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Mô tả về khóa học, đối tượng học viên phù hợp, mục tiêu đầu ra..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Trạng thái */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Trạng thái</Label>
                <div className="flex gap-2">
                  {COURSE_STATUS.map((status) => (
                    <button
                      key={status.value}
                      type="button"
                      onClick={() => setFieldValue('status', status.value)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                        formData.status === status.value
                          ? status.color + ' ring-2 ring-offset-1 ring-blue-400'
                          : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300'
                      }`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-linear-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white min-w-[140px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Lưu thay đổi
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditCourseModal;
