/**
 * CancelSessionModal - Modal xác nhận hủy buổi học
 * Yêu cầu nhập lý do hủy
 */

import { useState } from 'react';
import { 
  X, 
  XCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Lý do hủy thường gặp
const CANCEL_REASONS = [
  { value: 'teacher_sick', label: 'Giáo viên nghỉ ốm' },
  { value: 'teacher_leave', label: 'Giáo viên xin nghỉ phép' },
  { value: 'room_issue', label: 'Sự cố phòng học (điện, máy lạnh...)' },
  { value: 'holiday', label: 'Nghỉ lễ' },
  { value: 'weather', label: 'Thời tiết xấu (bão, lũ)' },
  { value: 'low_attendance', label: 'Học viên xin nghỉ nhiều' },
  { value: 'other', label: 'Lý do khác' },
];

export function CancelSessionModal({ 
  isOpen, 
  onClose, 
  session,
  onSuccess 
}) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Reset state when modal opens
  const resetState = () => {
    setSelectedReason('');
    setCustomReason('');
    setError(null);
  };

  // Handle save
  const handleSave = async () => {
    const reason = selectedReason === 'other' ? customReason : CANCEL_REASONS.find(r => r.value === selectedReason)?.label;
    
    if (!reason?.trim()) {
      setError('Vui lòng chọn hoặc nhập lý do hủy');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) throw new Error('Chưa đăng nhập');

      const res = await fetch(`${API_URL}/api/admin/sessions/${session.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${authSession.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: 'cancelled',
          notes: `[HỦY] ${reason}`
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Không thể hủy buổi học');

      onSuccess?.();
      onClose();
      resetState();
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-rose-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Hủy buổi học</h2>
                <p className="text-red-200 text-sm">
                  Buổi #{session?.session_number} • {session?.session_date}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Warning */}
        <div className="mx-6 mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-800">Lưu ý quan trọng</p>
            <p className="text-amber-700 mt-1">
              Buổi học đã hủy không thể hoàn tác. Học viên và giáo viên sẽ được thông báo về việc hủy buổi này.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Lý do hủy buổi học <span className="text-red-500">*</span>
          </label>

          {/* Reason options */}
          <div className="space-y-2 mb-4">
            {CANCEL_REASONS.map((reason) => (
              <label
                key={reason.value}
                className={`
                  flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
                  ${selectedReason === reason.value 
                    ? 'border-red-500 bg-red-50' 
                    : 'border-slate-200 hover:border-red-300'
                  }
                `}
              >
                <input
                  type="radio"
                  name="cancelReason"
                  value={reason.value}
                  checked={selectedReason === reason.value}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-4 h-4 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm text-slate-700">{reason.label}</span>
              </label>
            ))}
          </div>

          {/* Custom reason input */}
          {selectedReason === 'other' && (
            <textarea
              placeholder="Nhập lý do cụ thể..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Quay lại
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving || !selectedReason}
            className="bg-red-600 hover:bg-red-700"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang hủy...
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 mr-2" />
                Xác nhận hủy buổi
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CancelSessionModal;
