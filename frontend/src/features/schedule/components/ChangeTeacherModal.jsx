/**
 * ChangeTeacherModal - Modal đổi giáo viên cho một buổi học
 * Hiển thị danh sách GV với trạng thái rảnh/bận
 */

import { useState, useEffect } from 'react';
import { 
  X, 
  UserCog,
  Check,
  Clock,
  Loader2,
  AlertCircle,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function ChangeTeacherModal({ 
  isOpen, 
  onClose, 
  session,
  onSuccess 
}) {
  const [teachers, setTeachers] = useState([]);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch available teachers
  useEffect(() => {
    if (!isOpen || !session?.id) return;

    const fetchTeachers = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: { session: authSession } } = await supabase.auth.getSession();
        if (!authSession) throw new Error('Chưa đăng nhập');

        const res = await fetch(
          `${API_URL}/api/admin/sessions/${session.id}/available-teachers`,
          { headers: { Authorization: `Bearer ${authSession.access_token}` } }
        );

        const json = await res.json();
        if (!res.ok) throw new Error(json.message || 'Lỗi tải dữ liệu');

        setTeachers(json.data || []);
        setSessionInfo(json.sessionInfo);
        
        // Pre-select current teacher
        const current = json.data?.find(t => t.isCurrent);
        if (current) setSelectedTeacherId(current.id);
      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, [isOpen, session]);

  // Save change
  const handleSave = async () => {
    if (!selectedTeacherId) return;

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
        body: JSON.stringify({ teacher_id: selectedTeacherId })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Không thể cập nhật');

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

  // Filter teachers by search
  const filteredTeachers = teachers.filter(t => 
    !searchTerm || 
    t.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort: available first, then busy
  const sortedTeachers = [...filteredTeachers].sort((a, b) => {
    if (a.isCurrent) return -1;
    if (b.isCurrent) return 1;
    if (a.isBusy && !b.isBusy) return 1;
    if (!a.isBusy && b.isBusy) return -1;
    return 0;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-linear-to-r from-red-500 to-orange-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <UserCog className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Đổi giáo viên</h2>
                <p className="text-blue-200 text-sm">
                  Buổi #{session?.session_number} • {session?.classes?.name}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Session Info */}
        {sessionInfo && (
          <div className="px-6 py-3 bg-slate-50 border-b text-sm text-slate-600">
            <Clock className="w-4 h-4 inline mr-2" />
            {sessionInfo.date} • {sessionInfo.startTime} - {sessionInfo.endTime}
          </div>
        )}

        {/* Search */}
        <div className="px-6 py-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Tìm giáo viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <p className="text-red-600">{error}</p>
            </div>
          ) : sortedTeachers.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              Không tìm thấy giáo viên
            </div>
          ) : (
            <div className="space-y-2">
              {sortedTeachers.map((teacher) => {
                const isSelected = selectedTeacherId === teacher.id;
                const isDisabled = teacher.isBusy && !teacher.isCurrent;

                return (
                  <button
                    key={teacher.id}
                    onClick={() => !isDisabled && setSelectedTeacherId(teacher.id)}
                    disabled={isDisabled}
                    className={`
                      w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left
                      ${isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : isDisabled
                          ? 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed'
                          : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
                      }
                    `}
                  >
                    {/* Avatar */}
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center text-white font-bold
                      ${isDisabled ? 'bg-slate-400' : 'bg-linear-to-br from-blue-500 to-indigo-500'}
                    `}>
                      {teacher.avatar_url ? (
                        <img src={teacher.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        (teacher.full_name || teacher.email || '?')[0].toUpperCase()
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-900 truncate">
                          {teacher.full_name || 'Chưa có tên'}
                        </h4>
                        {teacher.isCurrent && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                            Hiện tại
                          </span>
                        )}
                        {teacher.isBusy && !teacher.isCurrent && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                            Đang dạy
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 truncate">{teacher.email}</p>
                    </div>

                    {/* Selected indicator */}
                    {isSelected && (
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving || !selectedTeacherId}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang lưu...
              </>
            ) : (
              'Xác nhận đổi GV'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ChangeTeacherModal;
