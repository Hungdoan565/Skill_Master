/**
 * HolidayManagementModal - Modal quản lý ngày lễ/nghỉ
 * Cho phép admin thêm/sửa/xóa ngày nghỉ lễ
 */

import { useState, useEffect } from 'react';
import { 
  X, 
  CalendarOff,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  Calendar,
  Edit2,
  Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabaseClient';
import { ConfirmModal } from './ConfirmModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Default Vietnamese holidays (for seeding)
const DEFAULT_HOLIDAYS = [
  { date: '2025-01-01', name: 'Tết Dương lịch', is_recurring: true },
  { date: '2025-04-30', name: 'Ngày Giải phóng miền Nam', is_recurring: true },
  { date: '2025-05-01', name: 'Ngày Quốc tế Lao động', is_recurring: true },
  { date: '2025-09-02', name: 'Quốc khánh', is_recurring: true },
];

export function HolidayManagementModal({ 
  isOpen, 
  onClose,
  onSuccess 
}) {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // New holiday form
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    name: '',
    is_recurring: false
  });
  const [editingId, setEditingId] = useState(null);
  
  // Confirm delete modal
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    holidayId: null,
    holidayName: ''
  });
  const [deleting, setDeleting] = useState(false);

  // Fetch holidays
  useEffect(() => {
    if (!isOpen) return;
    
    const fetchHolidays = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Chưa đăng nhập');
        
        const res = await fetch(`${API_URL}/api/admin/holidays`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        
        const json = await res.json();
        if (!res.ok) throw new Error(json.message);
        
        setHolidays(json.data || []);
      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
        // Use default holidays if API fails
        setHolidays(DEFAULT_HOLIDAYS.map((h, i) => ({ ...h, id: `default-${i}` })));
      } finally {
        setLoading(false);
      }
    };
    
    fetchHolidays();
  }, [isOpen]);

  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle save
  const handleSave = async () => {
    if (!formData.date || !formData.name) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Chưa đăng nhập');
      
      const url = editingId 
        ? `${API_URL}/api/admin/holidays/${editingId}`
        : `${API_URL}/api/admin/holidays`;
      
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      
      // Refresh list
      if (editingId) {
        setHolidays(prev => prev.map(h => h.id === editingId ? json.data : h));
      } else {
        setHolidays(prev => [...prev, json.data]);
      }
      
      // Reset form
      setFormData({ date: '', name: '', is_recurring: false });
      setShowForm(false);
      setEditingId(null);
      
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
    const id = deleteModal.holidayId;
    if (!id) return;
    
    setDeleting(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Chưa đăng nhập');
      
      const res = await fetch(`${API_URL}/api/admin/holidays/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message);
      }
      
      setHolidays(prev => prev.filter(h => h.id !== id));
      setDeleteModal({ isOpen: false, holidayId: null, holidayName: '' });
      onSuccess?.();
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };
  
  // Open delete confirmation
  const openDeleteModal = (holiday) => {
    setDeleteModal({
      isOpen: true,
      holidayId: holiday.id,
      holidayName: holiday.name
    });
  };

  // Handle edit
  const handleEdit = (holiday) => {
    setFormData({
      date: holiday.date,
      name: holiday.name,
      is_recurring: holiday.is_recurring
    });
    setEditingId(holiday.id);
    setShowForm(true);
  };

  if (!isOpen) return null;

  // Group holidays by year
  const groupedHolidays = holidays.reduce((acc, h) => {
    const year = new Date(h.date).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(h);
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
        aria-labelledby="holiday-dialog-title"
      >
        {/* Header */}
        <div className="bg-linear-to-r from-red-600 to-orange-600 px-6 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <CalendarOff className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 
                  className="text-lg font-semibold text-white"
                  id="holiday-dialog-title"
                >Quản Lý Ngày Lễ</h2>
                <p className="text-red-100 text-sm">
                  Các buổi học rơi vào ngày nghỉ sẽ được bỏ qua
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
          
          {/* Add button */}
          {!showForm && (
            <Button
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
                setFormData({ date: '', name: '', is_recurring: false });
              }}
              className="mb-4 bg-red-600 hover:bg-red-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Thêm ngày nghỉ
            </Button>
          )}
          
          {/* Form */}
          {showForm && (
            <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h3 className="font-medium text-slate-900 mb-4">
                {editingId ? 'Sửa ngày nghỉ' : 'Thêm ngày nghỉ mới'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Ngày
                  </label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tên ngày nghỉ
                  </label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="VD: Tết Nguyên Đán"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_recurring}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_recurring: e.target.checked }))}
                    className="w-4 h-4 text-red-600 rounded"
                  />
                  <span className="text-sm text-slate-700">
                    Lặp lại hàng năm (chỉ so sánh ngày/tháng)
                  </span>
                </label>
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {editingId ? 'Cập nhật' : 'Thêm'}
                </Button>
              </div>
            </div>
          )}
          
          {/* Holidays list */}
          {loading ? (
            <div className="py-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-red-600" />
              <p className="text-sm text-slate-500 mt-2">Đang tải danh sách...</p>
            </div>
          ) : holidays.length === 0 ? (
            <div className="py-8 text-center">
              <CalendarOff className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-slate-500 mt-2">Chưa có ngày nghỉ lễ nào</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedHolidays).sort((a, b) => b[0] - a[0]).map(([year, yearHolidays]) => (
                <div key={year}>
                  <h3 className="text-sm font-medium text-slate-500 mb-2">Năm {year}</h3>
                  <div className="space-y-2">
                    {yearHolidays.sort((a, b) => a.date.localeCompare(b.date)).map(holiday => (
                      <div 
                        key={holiday.id}
                        className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-red-300 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-red-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{holiday.name}</p>
                            <p className="text-sm text-slate-500">
                              {new Date(holiday.date).toLocaleDateString('vi-VN', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                              {holiday.is_recurring && (
                                <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                                  Lặp lại hàng năm
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEdit(holiday)}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4 text-slate-500" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(holiday)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
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
        onClose={() => setDeleteModal({ isOpen: false, holidayId: null, holidayName: '' })}
        onConfirm={handleDelete}
        type="danger"
        title="Xác nhận xóa ngày nghỉ"
        message={`Bạn có chắc chắn muốn xóa "${deleteModal.holidayName}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        loading={deleting}
      />
    </div>
  );
}

export default HolidayManagementModal;
