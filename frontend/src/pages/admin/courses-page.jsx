import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { 
  Plus, Search, Pencil, Trash2, X, Upload, Image as ImageIcon,
  BookOpen, Clock, Users, DollarSign, Loader2, CheckCircle2, AlertCircle,
  Settings2, GripVertical, Percent, Code2, Languages, Award, MessageCircle, Wrench
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '../../contexts/auth-context';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Config màu cho từng danh mục
const CATEGORY_CONFIG = {
  english: { 
    label: 'Tiếng Anh', 
    color: 'bg-blue-100 text-blue-700 border-blue-200' 
  },
  it: { 
    label: 'Tin học', 
    color: 'bg-purple-100 text-purple-700 border-purple-200' 
  },
  programming: { 
    label: 'Lập trình', 
    color: 'bg-violet-100 text-violet-700 border-violet-200' 
  },
  ielts: { 
    label: 'IELTS', 
    color: 'bg-amber-100 text-amber-700 border-amber-200' 
  },
  toeic: { 
    label: 'TOEIC', 
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200' 
  },
  communication: { 
    label: 'Giao tiếp', 
    color: 'bg-cyan-100 text-cyan-700 border-cyan-200' 
  },
  office: { 
    label: 'Tin học VP', 
    color: 'bg-orange-100 text-orange-700 border-orange-200' 
  },
  default: { 
    label: 'Khác', 
    color: 'bg-slate-100 text-slate-700 border-slate-200' 
  },
};

// Danh sách danh mục cho dropdown
const CATEGORIES = [
  { value: 'ielts', label: 'IELTS' },
  { value: 'toeic', label: 'TOEIC' },
  { value: 'english', label: 'Tiếng Anh tổng quát' },
  { value: 'communication', label: 'Tiếng Anh giao tiếp' },
  { value: 'programming', label: 'Lập trình' },
  { value: 'it', label: 'Tin học' },
  { value: 'office', label: 'Tin học văn phòng' },
];

// Danh sách trình độ
const LEVELS = [
  { value: 'Beginner', label: 'Cơ bản (Beginner)' },
  { value: 'Intermediate', label: 'Trung cấp (Intermediate)' },
  { value: 'Advanced', label: 'Nâng cao (Advanced)' },
];

// Component Badge danh mục
const CategoryBadge = ({ category }) => {
  const config = CATEGORY_CONFIG[category?.toLowerCase()] || CATEGORY_CONFIG.default;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
};

// ============================================================
// MODAL TẠO KHÓA HỌC
// ============================================================
const CreateCourseModal = ({ isOpen, onClose, onSuccess }) => {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  
  // Form state
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
    status: 'active' // Thêm trạng thái
  });

  // Reset form khi đóng modal
  useEffect(() => {
    if (!isOpen) {
      setFormData({
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
      setImagePreview(null);
      setError('');
    }
  }, [isOpen]);

  // Format giá tiền khi nhập
  const formatPriceInput = (value) => {
    // Chỉ giữ số
    const numbers = value.replace(/\D/g, '');
    // Format với dấu chấm
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Parse giá tiền từ string về number
  const parsePriceValue = (formatted) => {
    return parseInt(formatted.replace(/\./g, '')) || 0;
  };

  // Handle input change
  const handleChange = (e) => {
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
  };

  // Handle image upload (simple base64 preview for now)
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Ảnh không được vượt quá 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        // Trong thực tế, upload lên Cloudinary và lưu URL
        setFormData(prev => ({ ...prev, cover_image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate
    if (!formData.code.trim()) {
      setError('Vui lòng nhập mã khóa học');
      return;
    }
    if (!formData.title.trim()) {
      setError('Vui lòng nhập tên khóa học');
      return;
    }
    if (!formData.price) {
      setError('Vui lòng nhập học phí');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        price: parsePriceValue(formData.price)
      };

      const response = await axios.post(`${API_URL}/api/courses`, payload, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (response.data.success) {
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      console.error('Error creating course:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo khóa học');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-3xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Tạo khóa học mới</h2>
                <p className="text-sm text-white/80">Điền thông tin để tạo khóa học</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CỘT TRÁI - Thông tin định danh */}
            <div className="space-y-4">
              <h3 className="font-medium text-zinc-900 flex items-center gap-2 pb-2 border-b">
                <BookOpen className="w-4 h-4 text-red-500" />
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
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
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
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
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
                <Clock className="w-4 h-4 text-orange-500" />
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
                <div className="border-2 border-dashed border-zinc-200 rounded-lg p-4 text-center hover:border-red-300 transition-colors">
                  {imagePreview ? (
                    <div className="relative">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setFormData(prev => ({ ...prev, cover_image: '' }));
                        }}
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
                  rows={4}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
              </div>

              {/* Trạng thái */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Trạng thái</Label>
                <div className="flex gap-2">
                  {[
                    { value: 'draft', label: 'Nháp', color: 'bg-zinc-100 text-zinc-600 border-zinc-300' },
                    { value: 'active', label: 'Đang tuyển sinh', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
                    { value: 'inactive', label: 'Tạm ngưng', color: 'bg-orange-100 text-orange-700 border-orange-300' }
                  ].map((status) => (
                    <button
                      key={status.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, status: status.value }))}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                        formData.status === status.value
                          ? status.color + ' ring-2 ring-offset-1 ring-red-400'
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
              className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white min-w-[120px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Tạo khóa học
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================
// GRADE TEMPLATES - Mẫu cấu hình điểm theo loại khóa học
// ============================================================
const GRADE_TEMPLATES = {
  // Lập trình / Tin học
  programming: {
    id: 'programming',
    name: 'Lập trình / Tin học',
    Icon: Code2,
    iconColor: 'text-violet-600',
    bgColor: 'bg-violet-100',
    description: 'Thang 10, đạt từ 5.0',
    categories: ['programming', 'it', 'office'],
    config: { calculationType: 'weighted', passScore: 5.0, maxTotalScore: 10.0 },
    structures: [
      { name: 'Chuyên cần', weight: 0.10, max_score: 10 },
      { name: 'Giữa kỳ', weight: 0.40, max_score: 10 },
      { name: 'Cuối kỳ', weight: 0.50, max_score: 10 },
    ]
  },
  // IELTS
  ielts: {
    id: 'ielts',
    name: 'IELTS',
    Icon: Award,
    iconColor: 'text-amber-600',
    bgColor: 'bg-amber-100',
    description: 'Band 9.0, đạt từ 6.0',
    categories: ['ielts'],
    config: { calculationType: 'weighted', passScore: 6.0, maxTotalScore: 9.0 },
    structures: [
      { name: 'Listening', weight: 0.25, max_score: 9 },
      { name: 'Reading', weight: 0.25, max_score: 9 },
      { name: 'Writing', weight: 0.25, max_score: 9 },
      { name: 'Speaking', weight: 0.25, max_score: 9 },
    ]
  },
  // TOEIC
  toeic: {
    id: 'toeic',
    name: 'TOEIC',
    Icon: Languages,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: 'Tổng 990, đạt từ 450',
    categories: ['toeic'],
    config: { calculationType: 'sum', passScore: 450, maxTotalScore: 990 },
    structures: [
      { name: 'Listening', weight: 0, max_score: 495 },
      { name: 'Reading', weight: 0, max_score: 495 },
    ]
  },
  // Tiếng Anh giao tiếp / Tổng quát
  english: {
    id: 'english',
    name: 'Tiếng Anh',
    Icon: MessageCircle,
    iconColor: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    description: 'Thang 10, đạt từ 5.0',
    categories: ['english', 'communication'],
    config: { calculationType: 'weighted', passScore: 5.0, maxTotalScore: 10.0 },
    structures: [
      { name: 'Listening', weight: 0.25, max_score: 10 },
      { name: 'Speaking', weight: 0.25, max_score: 10 },
      { name: 'Reading', weight: 0.25, max_score: 10 },
      { name: 'Writing', weight: 0.25, max_score: 10 },
    ]
  },
  // Tùy chỉnh
  custom: {
    id: 'custom',
    name: 'Tùy chỉnh',
    Icon: Wrench,
    iconColor: 'text-zinc-600',
    bgColor: 'bg-zinc-100',
    description: 'Tự cấu hình',
    categories: [],
    config: { calculationType: 'weighted', passScore: 5.0, maxTotalScore: 10.0 },
    structures: []
  }
};

// Hàm tìm template phù hợp dựa trên category của khóa học
const getTemplateByCategory = (category) => {
  if (!category) return 'programming';
  const cat = category.toLowerCase();
  for (const [key, template] of Object.entries(GRADE_TEMPLATES)) {
    if (template.categories.includes(cat)) return key;
  }
  return 'programming'; // Mặc định
};

// ============================================================
// MODAL CẤU HÌNH CỘT ĐIỂM - ONE-CLICK PRESET DESIGN
// ============================================================
const GradeStructureModal = ({ isOpen, onClose, course, accessToken }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [structures, setStructures] = useState([]);
  const [error, setError] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('programming');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Cấu hình tính điểm
  const [config, setConfig] = useState({
    calculationType: 'weighted',
    passScore: 5.0,
    maxTotalScore: 10.0
  });

  // Khi mở modal -> Tự động chọn template dựa trên category
  useEffect(() => {
    if (isOpen && course?.id) {
      const suggestedTemplate = getTemplateByCategory(course.category);
      setSelectedTemplate(suggestedTemplate);
      fetchStructures(suggestedTemplate);
    }
  }, [isOpen, course?.id]);

  const fetchStructures = async (defaultTemplate) => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`${API_URL}/api/courses/${course.id}/grade-structures`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      if (response.data?.success && response.data.data.length > 0) {
        // Đã có cấu hình -> Load từ DB
        setStructures(response.data.data.map(s => ({
          ...s,
          weight: parseFloat(s.weight) || 0
        })));
        if (response.data.config) {
          setConfig({
            calculationType: response.data.config.calculationType || 'weighted',
            passScore: response.data.config.passScore || 5.0,
            maxTotalScore: response.data.config.maxTotalScore || 10.0
          });
        }
        setSelectedTemplate('custom'); // Đã có data -> hiện custom
      } else {
        // Chưa có -> Áp dụng template gợi ý
        applyTemplate(defaultTemplate);
      }
    } catch (err) {
      console.error('Error fetching grade structures:', err);
      // Nếu lỗi -> Áp dụng template mặc định
      applyTemplate(defaultTemplate);
    } finally {
      setLoading(false);
    }
  };

  // Tính tổng trọng số
  const totalWeight = structures.reduce((sum, s) => sum + (parseFloat(s.weight) || 0), 0);
  const totalWeightPercent = Math.round(totalWeight * 100);
  const isWeightValid = config.calculationType === 'sum' || totalWeightPercent === 100;

  // Áp dụng template
  const applyTemplate = (templateKey) => {
    const template = GRADE_TEMPLATES[templateKey];
    if (!template) return;
    
    setSelectedTemplate(templateKey);
    if (templateKey !== 'custom') {
      setConfig({ ...template.config });
      setStructures(template.structures.map(t => ({ ...t })));
      setShowAdvanced(false);
    } else {
      setShowAdvanced(true);
    }
  };

  // Thêm cột điểm mới
  const addColumn = () => {
    setStructures([
      ...structures,
      { name: '', weight: 0, max_score: 10, isNew: true }
    ]);
    setSelectedTemplate('custom');
  };

  // Xóa cột điểm
  const removeColumn = (index) => {
    setStructures(structures.filter((_, i) => i !== index));
    setSelectedTemplate('custom');
  };

  // Cập nhật cột điểm
  const updateColumn = (index, field, value) => {
    const updated = [...structures];
    if (field === 'weight') {
      updated[index][field] = parseFloat(value) / 100 || 0;
    } else if (field === 'max_score') {
      updated[index][field] = parseFloat(value) || 10;
    } else {
      updated[index][field] = value;
    }
    setStructures(updated);
    setSelectedTemplate('custom');
  };

  // Lưu cấu trúc
  const handleSave = async () => {
    if (structures.length === 0) {
      setError('Vui lòng thêm ít nhất 1 cột điểm');
      return;
    }

    const emptyNames = structures.some(s => !s.name.trim());
    if (emptyNames) {
      setError('Tên cột điểm không được để trống');
      return;
    }

    if (config.calculationType === 'weighted' && Math.abs(totalWeight - 1) > 0.01) {
      setError(`Tổng trọng số phải bằng 100%. Hiện tại: ${totalWeightPercent}%`);
      return;
    }

    try {
      setSaving(true);
      setError('');

      const response = await axios.put(
        `${API_URL}/api/courses/${course.id}/grade-structures`,
        { structures, config },
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );

      if (response.data?.success) {
        onClose();
      }
    } catch (err) {
      console.error('Error saving grade structures:', err);
      setError(err.response?.data?.message || 'Không thể lưu cấu trúc điểm');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header - Tông trắng/đen theo brand */}
        <div className="px-6 py-4 border-b border-zinc-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-zinc-900">Cấu hình đánh giá</h2>
              <p className="text-sm text-zinc-500 mt-0.5">
                {course?.code} • {course?.title}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-zinc-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-160px)] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            </div>
          ) : (
            <>
              {/* Error */}
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* ========== PHẦN 1: CHỌN LOẠI HÌNH ĐÁNH GIÁ (PRESETS) ========== */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-zinc-800 mb-3">
                  Chọn loại hình đánh giá
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {Object.values(GRADE_TEMPLATES).map((template) => {
                    const IconComponent = template.Icon;
                    return (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => applyTemplate(template.id)}
                        className={`p-3 rounded-xl border-2 transition-all text-left ${
                          selectedTemplate === template.id
                            ? 'border-red-500 bg-red-50 ring-2 ring-red-200'
                            : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg ${template.bgColor} flex items-center justify-center mb-2`}>
                          <IconComponent className={`w-4 h-4 ${template.iconColor}`} />
                        </div>
                        <div className={`text-xs font-semibold ${
                          selectedTemplate === template.id ? 'text-red-700' : 'text-zinc-700'
                        }`}>
                          {template.name}
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-0.5 leading-tight">
                          {template.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ========== PHẦN 2: THÔNG SỐ CƠ BẢN ========== */}
              <div className="mb-6 p-4 bg-zinc-50 rounded-xl border border-zinc-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-zinc-700">Thông số đánh giá</h3>
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-xs text-zinc-500 hover:text-red-600 transition-colors"
                  >
                    {showAdvanced ? 'Ẩn nâng cao' : 'Hiện nâng cao'}
                  </button>
                </div>
                
                <div className={`grid gap-4 ${showAdvanced ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  {/* Thang điểm */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-zinc-600">Thang điểm tối đa</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={config.maxTotalScore}
                      onChange={(e) => {
                        setConfig(prev => ({ ...prev, maxTotalScore: parseFloat(e.target.value) || 10 }));
                        setSelectedTemplate('custom');
                      }}
                      className="text-sm text-center h-9"
                    />
                  </div>

                  {/* Điểm đạt */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-zinc-600">Điểm đạt (Pass)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={config.passScore}
                      onChange={(e) => {
                        setConfig(prev => ({ ...prev, passScore: parseFloat(e.target.value) || 5 }));
                        setSelectedTemplate('custom');
                      }}
                      className="text-sm text-center h-9"
                    />
                  </div>

                  {/* Cách tính (chỉ hiện khi Advanced) */}
                  {showAdvanced && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-zinc-600">Cách tính điểm</Label>
                      <div className="flex rounded-lg border border-zinc-300 overflow-hidden h-9">
                        <button
                          type="button"
                          onClick={() => {
                            setConfig(prev => ({ ...prev, calculationType: 'weighted' }));
                            setSelectedTemplate('custom');
                          }}
                          className={`flex-1 text-xs font-medium transition-colors ${
                            config.calculationType === 'weighted'
                              ? 'bg-red-500 text-white'
                              : 'bg-white text-zinc-600 hover:bg-zinc-50'
                          }`}
                        >
                          Trọng số %
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setConfig(prev => ({ ...prev, calculationType: 'sum' }));
                            setSelectedTemplate('custom');
                          }}
                          className={`flex-1 text-xs font-medium transition-colors border-l ${
                            config.calculationType === 'sum'
                              ? 'bg-red-500 text-white'
                              : 'bg-white text-zinc-600 hover:bg-zinc-50'
                          }`}
                        >
                          Cộng tổng
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ========== PHẦN 3: DANH SÁCH CỘT ĐIỂM ========== */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-zinc-700 mb-3">Danh sách cột điểm</h3>

                {/* Table Header */}
                <div className={`grid gap-3 mb-2 px-3 ${config.calculationType === 'sum' ? 'grid-cols-10' : 'grid-cols-12'}`}>
                  <div className={config.calculationType === 'sum' ? 'col-span-5' : 'col-span-5'}>
                    <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Tên cột</span>
                  </div>
                  {config.calculationType === 'weighted' && (
                    <div className="col-span-3 text-center">
                      <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Trọng số</span>
                    </div>
                  )}
                  <div className={`${config.calculationType === 'sum' ? 'col-span-4' : 'col-span-3'} text-center`}>
                    <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Điểm max</span>
                  </div>
                  <div className="col-span-1"></div>
                </div>

                {/* Grade Columns */}
                <div className="space-y-2">
                  {structures.map((structure, index) => (
                    <div 
                      key={index} 
                      className={`grid gap-3 items-center p-2.5 bg-white rounded-lg border border-zinc-200 hover:border-red-300 transition-all ${config.calculationType === 'sum' ? 'grid-cols-10' : 'grid-cols-12'}`}
                    >
                      <div className={config.calculationType === 'sum' ? 'col-span-5' : 'col-span-5'}>
                        <Input
                          value={structure.name}
                          onChange={(e) => updateColumn(index, 'name', e.target.value)}
                          placeholder="VD: Giữa kỳ..."
                          className="text-sm h-9"
                        />
                      </div>
                      {config.calculationType === 'weighted' && (
                        <div className="col-span-3">
                          <div className="relative">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={Math.round((structure.weight || 0) * 100)}
                              onChange={(e) => updateColumn(index, 'weight', e.target.value)}
                              className="text-sm text-center pr-7 h-9"
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400">%</span>
                          </div>
                        </div>
                      )}
                      <div className={config.calculationType === 'sum' ? 'col-span-4' : 'col-span-3'}>
                        <Input
                          type="number"
                          min="0"
                          value={structure.max_score}
                          onChange={(e) => updateColumn(index, 'max_score', e.target.value)}
                          className="text-sm text-center h-9"
                        />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button
                          type="button"
                          onClick={() => removeColumn(index)}
                          className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {structures.length === 0 && (
                    <div className="text-center py-6 text-zinc-400 bg-zinc-50 rounded-lg border-2 border-dashed border-zinc-200">
                      <p className="text-sm">Chọn loại hình đánh giá ở trên để tự động điền</p>
                    </div>
                  )}
                </div>

                {/* Add Button */}
                <button
                  type="button"
                  onClick={addColumn}
                  className="w-full mt-3 py-2 border-2 border-dashed border-zinc-300 rounded-lg text-sm font-medium text-zinc-500 hover:border-red-400 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Thêm cột điểm
                </button>
              </div>

              {/* ========== TỔNG TRỌNG SỐ ========== */}
              {structures.length > 0 && config.calculationType === 'weighted' && (
                <div className={`p-3 rounded-lg flex items-center justify-between ${
                  isWeightValid 
                    ? 'bg-emerald-50 border border-emerald-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                      isWeightValid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {totalWeightPercent}%
                    </div>
                    <span className={`text-sm font-medium ${isWeightValid ? 'text-emerald-700' : 'text-red-700'}`}>
                      {isWeightValid ? 'Tổng trọng số hợp lệ' : `Thiếu ${100 - totalWeightPercent}% nữa`}
                    </span>
                  </div>
                  {isWeightValid ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
              )}

              {/* Summary cho mode Sum */}
              {structures.length > 0 && config.calculationType === 'sum' && (
                <div className="p-3 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm bg-orange-100 text-orange-700">
                      Σ
                    </div>
                    <div>
                      <span className="text-sm font-medium text-orange-700">
                        Tổng điểm: {structures.reduce((sum, s) => sum + (parseFloat(s.max_score) || 0), 0)}
                      </span>
                      <p className="text-xs text-orange-600">
                        {structures.map(s => s.name || '?').join(' + ')}
                      </p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-orange-500" />
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-zinc-50">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || loading || !isWeightValid || structures.length === 0}
            className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white min-w-[120px] disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Lưu cấu hình
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export function CoursesPage() {
  const { session } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [gradeStructureModal, setGradeStructureModal] = useState({ open: false, course: null });

  // Lưu access_token vào ref để tránh re-render khi token refresh
  const accessToken = session?.access_token;

  // Fetch courses - chỉ phụ thuộc vào accessToken string, không phải cả session object
  const fetchCourses = useCallback(async () => {
    if (!accessToken) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/courses`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      if (response.data?.success) {
        setCourses(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  // Chỉ fetch 1 lần khi component mount hoặc khi token thực sự thay đổi
  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Delete course
  const handleDelete = async (courseId, courseName) => {
    if (!window.confirm(`Bạn có chắc muốn xóa khóa học "${courseName}"?`)) {
      return;
    }

    setDeletingId(courseId);
    try {
      const response = await axios.delete(`${API_URL}/api/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      if (response.data.success) {
        fetchCourses();
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      alert(error.response?.data?.message || 'Không thể xóa khóa học');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredCourses = courses.filter(
    (course) =>
      course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Khóa học</h1>
          <p className="text-muted-foreground">
            Danh sách tất cả khóa học của trung tâm
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Tạo khóa học
        </Button>
      </div>

      {/* Toolbar */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Tìm theo tên hoặc mã khóa học..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Tổng: <strong>{filteredCourses.length}</strong> khóa học
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-red-500 mr-2" />
              <p className="text-muted-foreground">Đang tải dữ liệu...</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2">
              <BookOpen className="w-10 h-10 text-zinc-300" />
              <p className="text-muted-foreground">
                {searchTerm
                  ? 'Không tìm thấy khóa học phù hợp'
                  : 'Chưa có khóa học nào. Bấm "Tạo khóa học" để thêm mới.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm font-medium text-muted-foreground">
                    <th className="pb-3 pr-4">Mã</th>
                    <th className="pb-3 pr-4">Tên khóa học</th>
                    <th className="pb-3 pr-4">Danh mục</th>
                    <th className="pb-3 pr-4">Trình độ</th>
                    <th className="pb-3 pr-4 text-right">Học phí</th>
                    <th className="pb-3 pr-4 text-center">Số buổi</th>
                    <th className="pb-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.map((course) => (
                    <tr
                      key={course.id}
                      className="border-b last:border-0 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-4 pr-4">
                        <code className="rounded bg-slate-100 px-2 py-1 text-sm font-mono">
                          {course.code}
                        </code>
                      </td>
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-3">
                          {course.cover_image ? (
                            <img 
                              src={course.cover_image} 
                              alt={course.title}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center">
                              <BookOpen className="w-5 h-5 text-red-500" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{course.title}</p>
                            {course.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1 max-w-xs">
                                {course.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 pr-4">
                        <CategoryBadge category={course.category} />
                      </td>
                      <td className="py-4 pr-4">
                        <span className="text-sm text-zinc-600">{course.level || '-'}</span>
                      </td>
                      <td className="py-4 pr-4 text-right font-mono font-medium text-emerald-600 tabular-nums">
                        {formatPrice(course.price)}
                      </td>
                      <td className="py-4 pr-4 text-center">
                        <span className="inline-flex items-center gap-1 text-sm">
                          <Clock className="w-3.5 h-3.5 text-zinc-400" />
                          {course.total_sessions || '-'} buổi
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                            onClick={() => setGradeStructureModal({ open: true, course })}
                            title="Cấu hình cột điểm"
                          >
                            <Settings2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-red-50"
                            onClick={() => handleDelete(course.id, course.title)}
                            disabled={deletingId === course.id}
                          >
                            {deletingId === course.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Course Modal */}
      <CreateCourseModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchCourses}
      />

      {/* Grade Structure Modal */}
      <GradeStructureModal
        isOpen={gradeStructureModal.open}
        onClose={() => setGradeStructureModal({ open: false, course: null })}
        course={gradeStructureModal.course}
        accessToken={accessToken}
      />
    </div>
  );
}
