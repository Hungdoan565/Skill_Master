/**
 * MakeupClassModal - Modal tạo buổi học bù
 * Cho phép tạo buổi học bù cho học viên nghỉ học
 */

import { useState, useEffect } from 'react';
import { 
  X, 
  CalendarPlus,
  Loader2,
  AlertCircle,
  Search,
  User,
  Clock,
  Calendar,
  MapPin,
  CheckCircle,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function MakeupClassModal({ 
  isOpen, 
  onClose, 
  originalSession,  // Buổi học gốc mà học viên nghỉ
  student,          // Học viên cần học bù
  onSuccess 
}) {
  const [step, setStep] = useState(1); // 1: Chọn ngày, 2: Chọn slot, 3: Xác nhận
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // Form data
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notes, setNotes] = useState('');

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedDate('');
      setSelectedSlot(null);
      setAvailableSlots([]);
      setNotes('');
      setError(null);
    }
  }, [isOpen]);

  // Fetch available slots when date is selected
  useEffect(() => {
    if (!selectedDate || !originalSession) return;
    
    const fetchAvailableSlots = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Chưa đăng nhập');
        
        // Fetch sessions on the selected date that match the course
        const res = await fetch(
          `${API_URL}/api/admin/sessions?startDate=${selectedDate}&endDate=${selectedDate}`,
          { headers: { Authorization: `Bearer ${session.access_token}` } }
        );
        
        const json = await res.json();
        if (!res.ok) throw new Error(json.message);
        
        // Filter: same course, has available seats, not the same class
        const courseId = originalSession.classes?.course_id;
        const slots = (json.data || []).filter(s => 
          s.classes?.course_id === courseId &&
          s.class_id !== originalSession.class_id &&
          s.status === 'scheduled'
        );
        
        setAvailableSlots(slots);
      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAvailableSlots();
  }, [selectedDate, originalSession]);

  // Handle create makeup
  const handleSubmit = async () => {
    if (!selectedSlot || !student) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Chưa đăng nhập');
      
      const res = await fetch(`${API_URL}/api/admin/makeup-sessions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          original_session_id: originalSession.id,
          makeup_session_id: selectedSlot.id,
          student_id: student.id,
          notes: notes
        })
      });
      
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Không thể tạo buổi học bù');
      
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

  // Get min date (today)
  const today = new Date().toISOString().split('T')[0];
  
  // Get max date (2 weeks from original session)
  const maxDate = new Date(originalSession?.session_date || today);
  maxDate.setDate(maxDate.getDate() + 14);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg m-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <CalendarPlus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Tạo Buổi Học Bù</h2>
                <p className="text-blue-100 text-sm">
                  {student?.full_name || 'Học viên'}
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
        
        {/* Steps indicator */}
        <div className="px-6 py-3 bg-slate-50 border-b">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center">
                <div className={`
                  w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium
                  ${step >= s ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}
                `}>
                  {step > s ? <CheckCircle className="w-4 h-4" /> : s}
                </div>
                {s < 3 && (
                  <div className={`w-12 h-0.5 mx-1 ${step > s ? 'bg-blue-600' : 'bg-slate-200'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>Chọn ngày</span>
            <span>Chọn buổi</span>
            <span>Xác nhận</span>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Original session info */}
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800">Buổi học gốc đã nghỉ:</p>
                <p className="text-amber-700">
                  {originalSession?.classes?.name} - Buổi #{originalSession?.session_number}
                </p>
                <p className="text-amber-600">
                  {originalSession?.session_date} | {originalSession?.start_time?.substring(0, 5)} - {originalSession?.end_time?.substring(0, 5)}
                </p>
              </div>
            </div>
          </div>
          
          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          {/* Step 1: Select Date */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Chọn ngày học bù
                </label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={today}
                  max={maxDateStr}
                  className="w-full"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Chọn ngày trong vòng 2 tuần từ buổi học gốc
                </p>
              </div>
              
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!selectedDate}
                onClick={() => setStep(2)}
              >
                Tiếp tục
              </Button>
            </div>
          )}
          
          {/* Step 2: Select Slot */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Chọn buổi học bù
                </label>
                <button
                  onClick={() => setStep(1)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Đổi ngày
                </button>
              </div>
              
              {loading ? (
                <div className="py-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                  <p className="text-sm text-slate-500 mt-2">Đang tìm buổi học phù hợp...</p>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="py-8 text-center">
                  <AlertCircle className="w-8 h-8 mx-auto text-slate-400" />
                  <p className="text-slate-600 mt-2">Không có buổi học phù hợp</p>
                  <p className="text-sm text-slate-500">Thử chọn ngày khác</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {availableSlots.map(slot => (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot)}
                      className={`
                        w-full p-3 rounded-lg border-2 text-left transition-all
                        ${selectedSlot?.id === slot.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-slate-200 hover:border-blue-300'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-900">
                          {slot.classes?.name}
                        </span>
                        {selectedSlot?.id === slot.id && (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {slot.start_time?.substring(0, 5)} - {slot.end_time?.substring(0, 5)}
                        </span>
                        {slot.classes?.rooms?.name && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {slot.classes.rooms.name}
                          </span>
                        )}
                        {slot.users?.full_name && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {slot.users.full_name}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep(1)}
                >
                  Quay lại
                </Button>
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={!selectedSlot}
                  onClick={() => setStep(3)}
                >
                  Tiếp tục
                </Button>
              </div>
            </div>
          )}
          
          {/* Step 3: Confirm */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg space-y-3">
                <h3 className="font-medium text-slate-900">Xác nhận thông tin</h3>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-500">Học viên:</span>
                    <p className="font-medium">{student?.full_name}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Ngày học bù:</span>
                    <p className="font-medium">{selectedDate}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Lớp:</span>
                    <p className="font-medium">{selectedSlot?.classes?.name}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Thời gian:</span>
                    <p className="font-medium">
                      {selectedSlot?.start_time?.substring(0, 5)} - {selectedSlot?.end_time?.substring(0, 5)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ghi chú (tùy chọn)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none"
                  placeholder="Ví dụ: Học bù do nghỉ ốm..."
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep(2)}
                >
                  Quay lại
                </Button>
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={saving}
                  onClick={handleSubmit}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Đang tạo...
                    </>
                  ) : (
                    'Xác nhận tạo'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MakeupClassModal;
