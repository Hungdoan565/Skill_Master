/**
 * ScheduleExceptionModal - Modal đánh dấu ngoại lệ cho lịch học
 * Cho phép nghỉ tuần, đổi lịch tạm thời cho một lớp
 */

import { useState, useEffect } from 'react';
import { 
  X, 
  CalendarX2,
  Loader2,
  AlertCircle,
  Calendar,
  Save,
  Info,
  ArrowRight,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const EXCEPTION_TYPES = [
  { 
    value: 'skip_week', 
    label: 'Nghỉ tuần', 
    description: 'Bỏ qua tất cả buổi học trong tuần được chọn',
    color: 'text-red-600 bg-red-50 border-red-200'
  },
  { 
    value: 'skip_day', 
    label: 'Nghỉ ngày', 
    description: 'Bỏ qua buổi học vào một ngày cụ thể',
    color: 'text-amber-600 bg-amber-50 border-amber-200'
  },
  { 
    value: 'reschedule', 
    label: 'Đổi lịch', 
    description: 'Dời buổi học sang ngày/giờ khác',
    color: 'text-blue-600 bg-blue-50 border-blue-200'
  },
  { 
    value: 'extra_session', 
    label: 'Thêm buổi', 
    description: 'Thêm một buổi học ngoài lịch thường',
    color: 'text-green-600 bg-green-50 border-green-200'
  }
];

export function ScheduleExceptionModal({ 
  isOpen, 
  onClose,
  classData,  // { id, name, code, schedule }
  onSuccess 
}) {
  const [exceptionType, setExceptionType] = useState('skip_week');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    // For skip_week
    week_start: '',
    // For skip_day
    skip_date: '',
    // For reschedule
    original_date: '',
    new_date: '',
    new_start_time: '18:00',
    new_end_time: '20:00',
    // For extra_session
    extra_date: '',
    extra_start_time: '18:00',
    extra_end_time: '20:00',
    // Common
    reason: ''
  });

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setExceptionType('skip_week');
      setFormData({
        week_start: '',
        skip_date: '',
        original_date: '',
        new_date: '',
        new_start_time: '18:00',
        new_end_time: '20:00',
        extra_date: '',
        extra_start_time: '18:00',
        extra_end_time: '20:00',
        reason: ''
      });
      setError(null);
    }
  }, [isOpen]);

  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Get week dates from a date
  const getWeekRange = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    
    const format = (d) => d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    return `${format(monday)} - ${format(sunday)}`;
  };

  // Handle save
  const handleSave = async () => {
    // Validate
    if (exceptionType === 'skip_week' && !formData.week_start) {
      setError('Vui lòng chọn tuần nghỉ');
      return;
    }
    if (exceptionType === 'skip_day' && !formData.skip_date) {
      setError('Vui lòng chọn ngày nghỉ');
      return;
    }
    if (exceptionType === 'reschedule' && (!formData.original_date || !formData.new_date)) {
      setError('Vui lòng chọn ngày gốc và ngày mới');
      return;
    }
    if (exceptionType === 'extra_session' && !formData.extra_date) {
      setError('Vui lòng chọn ngày thêm buổi');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Chưa đăng nhập');
      
      const payload = {
        class_id: classData.id,
        exception_type: exceptionType,
        reason: formData.reason,
        ...formData
      };
      
      const res = await fetch(`${API_URL}/api/admin/classes/${classData.id}/schedule-exceptions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Không thể tạo ngoại lệ');
      
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg m-4 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exception-dialog-title"
      >
        {/* Header */}
        <div className="bg-linear-to-r from-orange-600 to-red-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <CalendarX2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 
                  className="text-lg font-semibold text-white"
                  id="exception-dialog-title"
                >Ngoại Lệ Lịch Học</h2>
                <p className="text-orange-100 text-sm">
                  {classData?.name || 'Lớp học'}
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
        <div className="p-6 space-y-4">
          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          {/* Exception type selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Loại ngoại lệ
            </label>
            <div className="grid grid-cols-2 gap-2">
              {EXCEPTION_TYPES.map(type => (
                <button
                  key={type.value}
                  onClick={() => setExceptionType(type.value)}
                  className={`
                    p-3 rounded-lg border-2 text-left transition-all
                    ${exceptionType === type.value 
                      ? type.color + ' border-current' 
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }
                  `}
                >
                  <p className="font-medium text-sm">{type.label}</p>
                  <p className="text-xs opacity-75 mt-0.5">{type.description}</p>
                </button>
              ))}
            </div>
          </div>
          
          {/* Skip Week Form */}
          {exceptionType === 'skip_week' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-2" />
                Chọn một ngày trong tuần nghỉ
              </label>
              <Input
                type="date"
                value={formData.week_start}
                onChange={(e) => setFormData(prev => ({ ...prev, week_start: e.target.value }))}
                min={today}
              />
              {formData.week_start && (
                <p className="text-sm text-slate-500 mt-1">
                  Tuần nghỉ: {getWeekRange(formData.week_start)}
                </p>
              )}
            </div>
          )}
          
          {/* Skip Day Form */}
          {exceptionType === 'skip_day' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-2" />
                Chọn ngày nghỉ
              </label>
              <Input
                type="date"
                value={formData.skip_date}
                onChange={(e) => setFormData(prev => ({ ...prev, skip_date: e.target.value }))}
                min={today}
              />
            </div>
          )}
          
          {/* Reschedule Form */}
          {exceptionType === 'reschedule' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Ngày gốc
                  </label>
                  <Input
                    type="date"
                    value={formData.original_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, original_date: e.target.value }))}
                    min={today}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Chuyển sang ngày
                  </label>
                  <Input
                    type="date"
                    value={formData.new_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, new_date: e.target.value }))}
                    min={today}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Giờ mới bắt đầu
                  </label>
                  <Input
                    type="time"
                    value={formData.new_start_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, new_start_time: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Giờ mới kết thúc
                  </label>
                  <Input
                    type="time"
                    value={formData.new_end_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, new_end_time: e.target.value }))}
                  />
                </div>
              </div>
              
              {formData.original_date && formData.new_date && (
                <div className="p-3 bg-blue-50 rounded-lg flex items-center gap-2 text-sm text-blue-700">
                  <Info className="w-4 h-4" />
                  <span>
                    {formData.original_date} 
                    <ArrowRight className="w-4 h-4 inline mx-1" /> 
                    {formData.new_date} ({formData.new_start_time} - {formData.new_end_time})
                  </span>
                </div>
              )}
            </div>
          )}
          
          {/* Extra Session Form */}
          {exceptionType === 'extra_session' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Ngày thêm buổi
                </label>
                <Input
                  type="date"
                  value={formData.extra_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, extra_date: e.target.value }))}
                  min={today}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Giờ bắt đầu
                  </label>
                  <Input
                    type="time"
                    value={formData.extra_start_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, extra_start_time: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Giờ kết thúc
                  </label>
                  <Input
                    type="time"
                    value={formData.extra_end_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, extra_end_time: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Lý do (tùy chọn)
            </label>
            <Input
              type="text"
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="VD: Nghỉ lễ, Giáo viên bận, Bù buổi trước..."
            />
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            Hủy
          </Button>
          <Button
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Áp dụng
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ScheduleExceptionModal;
