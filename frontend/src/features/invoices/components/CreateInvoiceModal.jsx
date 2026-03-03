/**
 * CreateInvoiceModal Component
 * 
 * Modal tạo hóa đơn thủ công cho các loại phí khác nhau.
 * 
 * @param {boolean} isOpen - Trạng thái modal
 * @param {function} onClose - Handler đóng modal
 * @param {function} onSuccess - Callback khi tạo thành công
 */

import { useState, useEffect, useCallback } from 'react';
import {
  X,
  Receipt,
  User,
  Search,
  Loader2,
  BookOpen,
  Shirt,
  FileCheck,
  HelpCircle,
  GraduationCap,
  Calendar,
  DollarSign,
  Percent,
  FileText,
  AlertCircle,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth-context';
import { API_URL } from '../utils/constants';
import { formatCurrency, parseCurrency } from '../utils/formatters';

// Invoice types configuration
const INVOICE_TYPES = [
  { value: 'tuition', label: 'Học phí', icon: GraduationCap, color: 'indigo' },
  { value: 'book', label: 'Giáo trình/Sách', icon: BookOpen, color: 'emerald' },
  { value: 'uniform', label: 'Đồng phục', icon: Shirt, color: 'blue' },
  { value: 'exam', label: 'Phí thi', icon: FileCheck, color: 'amber' },
  { value: 'other', label: 'Phí khác', icon: HelpCircle, color: 'slate' }
];

export function CreateInvoiceModal({ isOpen, onClose, onSuccess, initialData }) {
  const { session } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    student_id: '',
    enrollment_id: '', // Thêm enrollment_id
    invoice_type: 'other',
    amount: '',
    discount_amount: '',
    description: '',
    due_date: ''
  });

  // Student search
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searching, setSearching] = useState(false);

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Reset form when modal opens hoặc initialData thay đổi
  useEffect(() => {
    if (isOpen) {
      // Merge initialData với default values
      setFormData({
        student_id: initialData?.student_id || '',
        enrollment_id: initialData?.enrollment_id || '',
        invoice_type: initialData?.invoice_type || 'other',
        amount: initialData?.amount ? initialData.amount.toString() : '',
        discount_amount: '',
        description: initialData?.auto_description || '',
        due_date: getDefaultDueDate()
      });

      // Nếu có student_id từ initialData, tự động load student info
      if (initialData?.student_id) {
        // Set student info ngay lập tức nếu có student_name
        if (initialData.student_name) {
          setSelectedStudent({
            id: initialData.student_id,
            full_name: initialData.student_name,
            email: '', // Sẽ load sau nếu cần
            locked: initialData.locked || false
          });
          setSearchQuery(initialData.student_name);
        } else {
          // Load từ API nếu chưa có name
          loadStudentById(initialData.student_id);
        }
      } else {
        setSearchQuery('');
        setStudents([]);
        setSelectedStudent(null);
      }

      setError('');
    }
  }, [isOpen, initialData]);

  // Default due date = 7 days from now
  const getDefaultDueDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  };

  // Search students
  const searchStudents = useCallback(async (query) => {
    if (!query || query.length < 2 || !session?.access_token) {
      setStudents([]);
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(
        `${API_URL}/api/students/search?q=${encodeURIComponent(query)}&limit=10`,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );
      const result = await res.json();
      if (result.success) {
        setStudents(result.data || []);
      }
    } catch (err) {
      console.error('Error searching students:', err);
    } finally {
      setSearching(false);
    }
  }, [session?.access_token]);

  // Load student by ID (for pre-filling from enrollment)
  const loadStudentById = useCallback(async (studentId) => {
    if (!studentId || !session?.access_token) return;

    try {
      const res = await fetch(
        `${API_URL}/api/students/${studentId}`,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );
      const result = await res.json();
      if (result.success && result.data) {
        setSelectedStudent(result.data);
        setFormData(prev => ({ ...prev, student_id: result.data.id }));
      }
    } catch (err) {
      console.error('Error loading student:', err);
    }
  }, [session?.access_token]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchStudents(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchStudents]);

  // Select student
  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setFormData(prev => ({ ...prev, student_id: student.id }));
    setSearchQuery('');
    setStudents([]);
  };

  // Clear student
  const handleClearStudent = () => {
    setSelectedStudent(null);
    setFormData(prev => ({ ...prev, student_id: '' }));
  };

  // Update form field
  const updateField = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setError('');
  };

  // Calculate final amount
  const amount = parseCurrency(formData.amount) || 0;
  const discount = parseCurrency(formData.discount_amount) || 0;
  const finalAmount = Math.max(0, amount - discount);

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedStudent) {
      setError('Vui lòng chọn học viên');
      return;
    }
    if (!amount || amount <= 0) {
      setError('Số tiền phải lớn hơn 0');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          student_id: formData.student_id,
          enrollment_id: formData.enrollment_id || null, // Gửi enrollment_id nếu có
          invoice_type: formData.invoice_type,
          amount: amount,
          discount_amount: discount,
          description: formData.description,
          due_date: formData.due_date
        })
      });

      const result = await res.json();

      if (result.success) {
        onSuccess?.(result.message || 'Tạo hóa đơn thành công', result.data);
        onClose();
      } else {
        setError(result.message || 'Không thể tạo hóa đơn');
      }
    } catch (err) {
      console.error('Error creating invoice:', err);
      setError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const selectedType = INVOICE_TYPES.find(t => t.value === formData.invoice_type);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => !submitting && onClose()}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="bg-linear-to-r from-indigo-500 to-purple-600 px-4 py-3 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <Receipt className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold">Tạo hóa đơn mới</h3>
            </div>
            <button
              onClick={onClose}
              disabled={submitting}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">

            {/* Error message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Warning: Already paid */}
            {initialData?.amount === 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
                <div className="text-xs text-yellow-700">
                  <p className="font-semibold">Học viên đã đóng đủ học phí</p>
                  <p className="mt-0.5 text-yellow-600">Vẫn có thể tạo hóa đơn (phí khác, phí bổ sung...).</p>
                </div>
              </div>
            )}

            {/* Class/Course Info */}
            {initialData?.class_name && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-semibold text-blue-900">Thông tin lớp học</span>
                </div>
                <div className="space-y-1 text-xs text-blue-700">
                  <p><span className="font-medium">Lớp:</span> {initialData.class_name}</p>
                  {initialData.course_name && (
                    <p><span className="font-medium">Khóa học:</span> {initialData.course_name}</p>
                  )}
                </div>
              </div>
            )}

            {/* Student Search */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Học viên <span className="text-red-500">*</span>
              </label>

              {selectedStudent ? (
                <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-semibold">
                      {selectedStudent.full_name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{selectedStudent.full_name}</p>
                      <p className="text-xs text-slate-500">{selectedStudent.email || selectedStudent.phone}</p>
                      {selectedStudent.locked && (
                        <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-medium rounded">
                          <Lock className="w-3 h-3" /> Khóa từ ghi danh
                        </span>
                      )}
                    </div>
                  </div>
                  {!selectedStudent.locked && (
                    <button
                      type="button"
                      onClick={handleClearStudent}
                      className="p-1 hover:bg-indigo-100 rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-indigo-600" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm tên, email, SĐT học viên..."
                    className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {searching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />
                  )}

                  {/* Search Results */}
                  {students.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white rounded-lg border border-slate-200 shadow-lg max-h-48 overflow-y-auto">
                      {students.map(student => (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => handleSelectStudent(student)}
                          className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-3"
                        >
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-medium">
                            {student.full_name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{student.full_name}</p>
                            <p className="text-xs text-slate-500">{student.email || student.phone}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Invoice Type */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Loại hóa đơn
              </label>
              <div className="grid grid-cols-5 gap-2">
                {INVOICE_TYPES.map(type => {
                  const Icon = type.icon;
                  const isSelected = formData.invoice_type === type.value;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => updateField('invoice_type', type.value)}
                      className={`
                        flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all
                        ${isSelected
                          ? `border-${type.color}-500 bg-${type.color}-50 text-${type.color}-700`
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-[10px] font-medium text-center leading-tight">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Amount */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Số tiền <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={formatCurrency(formData.amount)}
                    onChange={(e) => updateField('amount', e.target.value)}
                    placeholder="0"
                    className="w-full h-10 pl-9 pr-12 rounded-lg border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">VNĐ</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Giảm giá
                </label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={formatCurrency(formData.discount_amount)}
                    onChange={(e) => updateField('discount_amount', e.target.value)}
                    placeholder="0"
                    className="w-full h-10 pl-9 pr-12 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">VNĐ</span>
                </div>
              </div>
            </div>

            {/* Final Amount Preview */}
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-emerald-700">Thành tiền:</span>
                <span className="text-lg font-bold text-emerald-700">
                  {finalAmount.toLocaleString()}đ
                </span>
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Hạn thanh toán
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => updateField('due_date', e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Mô tả
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder={`${selectedType?.label || 'Phí khác'} - ${selectedStudent?.full_name || 'Học viên'}`}
                  rows={2}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-4 py-3 bg-slate-50 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={submitting || !selectedStudent || !amount}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Receipt className="w-4 h-4 mr-2" />
                  Tạo hóa đơn
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateInvoiceModal;
