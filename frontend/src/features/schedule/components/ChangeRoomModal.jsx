/**
 * ChangeRoomModal - Modal đổi phòng học cho một buổi học
 * Hiển thị danh sách phòng với trạng thái trống/bận
 */

import { useState, useEffect } from 'react';
import { 
  X, 
  DoorOpen,
  Check,
  Clock,
  Loader2,
  AlertCircle,
  Search,
  Users,
  MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function ChangeRoomModal({ 
  isOpen, 
  onClose, 
  session,
  onSuccess 
}) {
  const [rooms, setRooms] = useState([]);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch available rooms
  useEffect(() => {
    if (!isOpen || !session?.id) return;

    const fetchRooms = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: { session: authSession } } = await supabase.auth.getSession();
        if (!authSession) throw new Error('Chưa đăng nhập');

        const res = await fetch(
          `${API_URL}/api/admin/sessions/${session.id}/available-rooms`,
          { headers: { Authorization: `Bearer ${authSession.access_token}` } }
        );

        const json = await res.json();
        if (!res.ok) throw new Error(json.message || 'Lỗi tải dữ liệu');

        setRooms(json.data || []);
        setSessionInfo(json.sessionInfo);
        
        // Pre-select current room
        const current = json.data?.find(r => r.isCurrent);
        if (current) setSelectedRoomId(current.id);
      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [isOpen, session]);

  // Save change
  const handleSave = async () => {
    if (!selectedRoomId) return;

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
        body: JSON.stringify({ room_id: selectedRoomId })
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

  // Filter rooms by search
  const filteredRooms = rooms.filter(r => 
    !searchTerm || 
    r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort: available first, then busy
  const sortedRooms = [...filteredRooms].sort((a, b) => {
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
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <DoorOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Đổi phòng học</h2>
                <p className="text-purple-200 text-sm">
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
              placeholder="Tìm phòng học..."
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
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <p className="text-red-600">{error}</p>
            </div>
          ) : sortedRooms.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              Không tìm thấy phòng học
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {sortedRooms.map((room) => {
                const isSelected = selectedRoomId === room.id;
                const isDisabled = room.isBusy && !room.isCurrent;

                return (
                  <button
                    key={room.id}
                    onClick={() => !isDisabled && setSelectedRoomId(room.id)}
                    disabled={isDisabled}
                    className={`
                      flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center
                      ${isSelected 
                        ? 'border-purple-500 bg-purple-50' 
                        : isDisabled
                          ? 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed'
                          : 'border-slate-200 hover:border-purple-300 hover:bg-purple-50/50'
                      }
                    `}
                  >
                    {/* Icon */}
                    <div className={`
                      w-12 h-12 rounded-xl flex items-center justify-center
                      ${isDisabled ? 'bg-slate-200' : 'bg-purple-100'}
                    `}>
                      <DoorOpen className={`w-6 h-6 ${isDisabled ? 'text-slate-400' : 'text-purple-600'}`} />
                    </div>

                    {/* Name */}
                    <div>
                      <h4 className="font-semibold text-slate-900">
                        {room.name || room.code}
                      </h4>
                      {room.code && room.name && (
                        <p className="text-xs text-slate-500">{room.code}</p>
                      )}
                    </div>

                    {/* Capacity */}
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Users className="w-3 h-3" />
                      <span>{room.capacity || '?'} chỗ</span>
                    </div>

                    {/* Status badges */}
                    <div className="flex flex-wrap gap-1 justify-center">
                      {room.isCurrent && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                          Hiện tại
                        </span>
                      )}
                      {room.isBusy && !room.isCurrent && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                          Đang sử dụng
                        </span>
                      )}
                      {!room.isBusy && !room.isCurrent && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                          Trống
                        </span>
                      )}
                    </div>

                    {/* Selected indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
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
            disabled={saving || !selectedRoomId}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang lưu...
              </>
            ) : (
              'Xác nhận đổi phòng'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ChangeRoomModal;
