/**
 * TeacherAvailabilityModal - Modal quản lý lịch rảnh/bận của giáo viên
 * Cho phép GV đăng ký các khung giờ không thể dạy
 */

import { useState, useEffect } from 'react';
import { 
  X, 
  UserCog,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  Clock,
  Calendar,
  Save,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabaseClient';
import { ConfirmModal } from './ConfirmModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const DAYS_OF_WEEK = [
  { value: 2, label: 'Thứ 2' },
  { value: 3, label: 'Thứ 3' },
  { value: 4, label: 'Thứ 4' },
  { value: 5, label: 'Thứ 5' },
  { value: 6, label: 'Thứ 6' },
  { value: 7, label: 'Thứ 7' },
  { value: 8, label: 'Chủ nhật' }
];

const AVAILABILITY_TYPES = [
  { value: 'unavailable', label: 'Không thể dạy', color: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'preferred', label: 'Ưu tiên dạy', color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'temporary', label: 'Nghỉ tạm thời', color: 'bg-amber-100 text-amber-700 border-amber-200' }
];

export function TeacherAvailabilityModal({ 
  isOpen, 
  onClose,
  teacher,  // { id, full_name, email }
  onSuccess 
}) {
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // New entry form
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'unavailable',
    days: [],
    start_time: '08:00',
    end_time: '17:00',
    start_date: '',  // For temporary type
    end_date: '',
    reason: ''
  });
  
  // Confirm delete modal
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    slotId: null
  });
  const [deleting, setDeleting] = useState(false);
  
  // Teachers list (for admin to select)
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  // Fetch teachers list when modal opens (if no teacher provided)
  useEffect(() => {
    if (!isOpen) return;
    
    // Reset states
    setLoading(false);
    setError(null);
    setAvailability([]);
    setShowForm(false);
    
    // If teacher is provided, use it
    if (teacher?.id) {
      setSelectedTeacher(teacher);
      return;
    }
    
    // Otherwise fetch teachers list for admin to select
    const fetchTeachers = async () => {
      setLoadingTeachers(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Chưa đăng nhập');
        
        const res = await fetch(`${API_URL}/api/teachers`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        
        const json = await res.json();
        if (!res.ok) throw new Error(json.message);
        
        setTeachers(json.data || []);
      } catch (err) {
        console.error('Error fetching teachers:', err);
        setError(err.message);
      } finally {
        setLoadingTeachers(false);
      }
    };
    
    fetchTeachers();
  }, [isOpen, teacher?.id]);

  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Fetch availability when teacher is selected
  useEffect(() => {
    if (!isOpen || !selectedTeacher?.id) return;
    
    const fetchAvailability = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Chưa đăng nhập');
        
        const res = await fetch(`${API_URL}/api/admin/teacher-availability/${selectedTeacher.id}`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        
        const json = await res.json();
        if (!res.ok) throw new Error(json.message);
        
        setAvailability(json.data || []);
      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAvailability();
  }, [isOpen, selectedTeacher?.id]);

  // Handle toggle day
  const toggleDay = (dayValue) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(dayValue) 
        ? prev.days.filter(d => d !== dayValue)
        : [...prev.days, dayValue]
    }));
  };

  // Handle save
  const handleSave = async () => {
    if (!selectedTeacher?.id) {
      setError('Vui lòng chọn giáo viên');
      return;
    }
    
    if (formData.days.length === 0 && formData.type !== 'temporary') {
      setError('Vui lòng chọn ít nhất một ngày');
      return;
    }
    
    if (formData.type === 'temporary' && (!formData.start_date || !formData.end_date)) {
      setError('Vui lòng chọn khoảng thời gian nghỉ');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Chưa đăng nhập');
      
      const res = await fetch(`${API_URL}/api/admin/teacher-availability/${selectedTeacher.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      
      // Refresh list
      setAvailability(prev => [...prev, ...json.data]);
      
      // Reset form
      setFormData({
        type: 'unavailable',
        days: [],
        start_time: '08:00',
        end_time: '17:00',
        start_date: '',
        end_date: '',
        reason: ''
      });
      setShowForm(false);
      
      onSuccess?.();
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

// Handle delete
  const handleDelete = async () => {
    const id = deleteModal.slotId;
    if (!id) return;
    
    setDeleting(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Chưa đăng nhập');
      
      // Call DELETE API
      const res = await fetch(`${API_URL}/api/admin/teacher-availability/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      
      // Remove from local state
      setAvailability(prev => prev.filter(a => a.id !== id));
      setDeleteModal({ isOpen: false, slotId: null });
      onSuccess?.();
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };
  
  // Open delete confirmation
  const openDeleteModal = (slotId) => {
    setDeleteModal({ isOpen: true, slotId });
  };

  if (!isOpen) return null;

  // Group by type
  const groupedAvailability = availability.reduce((acc, a) => {
    if (!acc[a.type]) acc[a.type] = [];
    acc[a.type].push(a);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl m-4 max-h-[90vh] overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="teacher-avail-dialog-title"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <UserCog className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 
                  className="text-lg font-semibold text-white"
                  id="teacher-avail-dialog-title"
                >Lịch Rảnh/Bận Giáo Viên</h2>
                <p className="text-orange-100 text-sm">
                  {selectedTeacher?.full_name || 'Chọn giáo viên để quản lý lịch'}
                </p>
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
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          {/* Teacher selector (nếu không có teacher prop) */}
          {!teacher?.id && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Chọn giáo viên
              </label>
              {loadingTeachers ? (
                <div className="flex items-center gap-2 text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Đang tải danh sách giáo viên...</span>
                </div>
              ) : teachers.length === 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-amber-700 text-sm">Không tìm thấy giáo viên nào</p>
                </div>
              ) : (
                <select
                  value={selectedTeacher?.id || ''}
                  onChange={(e) => {
                    const t = teachers.find(t => t.id === e.target.value);
                    setSelectedTeacher(t);
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">-- Chọn giáo viên --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.full_name} ({t.email})</option>
                  ))}
                </select>
              )}
            </div>
          )}
          
          {/* Nếu đã chọn giáo viên thì hiển thị form và list */}
          {selectedTeacher?.id ? (
            <>
              {/* Add button */}
              {!showForm && (
                <Button
                  onClick={() => setShowForm(true)}
                  className="mb-4 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm khung giờ
                </Button>
              )}
          
          {/* Form */}
          {showForm && (
            <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h3 className="font-medium text-slate-900 mb-4">Thêm khung giờ mới</h3>
              
              {/* Type selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Loại</label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABILITY_TYPES.map(type => (
                    <button
                      key={type.value}
                      onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                      className={`
                        px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all
                        ${formData.type === type.value 
                          ? type.color + ' border-current' 
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }
                      `}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Days selector (for recurring types) */}
              {formData.type !== 'temporary' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Ngày trong tuần
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map(day => (
                      <button
                        key={day.value}
                        onClick={() => toggleDay(day.value)}
                        className={`
                          w-12 h-12 rounded-lg text-sm font-medium border-2 transition-all
                          ${formData.days.includes(day.value)
                            ? 'bg-indigo-100 border-indigo-500 text-indigo-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                          }
                        `}
                      >
                        {day.label.replace('Thứ ', 'T').replace('Chủ nhật', 'CN')}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Time range (for recurring types) */}
              {formData.type !== 'temporary' && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Từ giờ
                    </label>
                    <Input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Đến giờ
                    </label>
                    <Input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                    />
                  </div>
                </div>
              )}
              
              {/* Date range (for temporary type) */}
              {formData.type === 'temporary' && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Ngày bắt đầu nghỉ
                    </label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Ngày kết thúc nghỉ
                    </label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    />
                  </div>
                </div>
              )}
              
              {/* Reason */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Lý do (tùy chọn)
                </label>
                <Input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="VD: Có lịch dạy ở trường đại học..."
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Lưu
                </Button>
              </div>
            </div>
          )}
          
          {/* Availability list */}
          {loading ? (
            <div className="py-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
              <p className="text-sm text-slate-500 mt-2">Đang tải lịch rảnh/bận...</p>
            </div>
          ) : availability.length === 0 ? (
            <div className="py-8 text-center">
              <Calendar className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-slate-500 mt-2">Chưa có lịch rảnh/bận nào</p>
              <p className="text-sm text-slate-400">
                Giáo viên có thể dạy tất cả các khung giờ
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {AVAILABILITY_TYPES.map(type => {
                const items = groupedAvailability[type.value] || [];
                if (items.length === 0) return null;
                
                return (
                  <div key={type.value}>
                    <h4 className="text-sm font-medium text-slate-500 mb-2 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        type.value === 'unavailable' ? 'bg-red-500' :
                        type.value === 'preferred' ? 'bg-green-500' : 'bg-amber-500'
                      }`} />
                      {type.label}
                    </h4>
                    
                    <div className="space-y-2">
                      {items.map(item => (
                        <div 
                          key={item.id}
                          className={`
                            flex items-center justify-between p-3 rounded-lg border
                            ${type.color}
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <Clock className="w-4 h-4" />
                            <div>
                              {item.type === 'temporary' ? (
                                <p className="font-medium">
                                  {item.start_date} → {item.end_date}
                                </p>
                              ) : (
                                <>
                                  <p className="font-medium">
                                    {item.days?.map(d => DAYS_OF_WEEK.find(x => x.value === d)?.label.replace('Thứ ', 'T')).join(', ')}
                                  </p>
                                  <p className="text-sm opacity-75">
                                    {item.start_time?.substring(0, 5)} - {item.end_time?.substring(0, 5)}
                                  </p>
                                </>
                              )}
                              {item.reason && (
                                <p className="text-xs opacity-75 mt-1">{item.reason}</p>
                              )}
                            </div>
                          </div>
                          
                          <button
                            onClick={() => openDeleteModal(item.id)}
                            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
            </>
          ) : !loadingTeachers && !teacher?.id && (
            <div className="py-8 text-center">
              <UserCog className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-slate-500 mt-2">Chọn giáo viên để xem và quản lý lịch rảnh/bận</p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t shrink-0">
          <Button
            variant="outline"
            className="w-full"
            onClick={onClose}
          >
            Đóng
          </Button>
        </div>
      </div>
      
      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, slotId: null })}
        onConfirm={handleDelete}
        type="danger"
        title="Xác nhận xóa khung giờ"
        message="Bạn có chắc chắn muốn xóa khung giờ này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        loading={deleting}
      />
    </div>
  );
}

export default TeacherAvailabilityModal;
