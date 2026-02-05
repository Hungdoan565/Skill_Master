/**
 * ChangeRoomModal - Modal đổi phòng học cho một buổi học
 * Style đồng bộ với CreateCourseModal (màu cam-đỏ)
 * Hỗ trợ Grid/List view, tìm kiếm, và hiển thị tốt khi có nhiều phòng
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  DoorOpen,
  Check,
  Clock,
  Loader2,
  AlertCircle,
  Search,
  Users,
  Building2,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronUp,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Số phòng hiển thị mặc định (show more nếu vượt quá)
const INITIAL_DISPLAY_COUNT = 8;

/* =============================================
 * Room Grid Card Component
 * ============================================= */
function RoomGridCard({ room, isSelected, onSelect }) {
  const isDisabled = room.isBusy && !room.isCurrent;
  
  return (
    <button
      onClick={onSelect}
      disabled={isDisabled}
      className={`
        relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center
        ${isSelected 
          ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200' 
          : isDisabled
            ? 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed'
            : 'border-slate-200 hover:border-orange-300 hover:bg-orange-50/50'
        }
      `}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}

      {/* Icon */}
      <div className={`
        w-12 h-12 rounded-xl flex items-center justify-center
        ${isSelected ? 'bg-orange-100' : isDisabled ? 'bg-slate-200' : 'bg-slate-100'}
      `}>
        <DoorOpen className={`w-6 h-6 ${isSelected ? 'text-orange-600' : isDisabled ? 'text-slate-400' : 'text-slate-600'}`} />
      </div>

      {/* Name */}
      <div>
        <h4 className={`font-semibold ${isSelected ? 'text-orange-700' : 'text-slate-900'}`}>
          {room.name || room.code}
        </h4>
        {room.centers?.name && (
          <p className="text-xs text-slate-500">{room.centers.name}</p>
        )}
      </div>

      {/* Capacity */}
      <div className="flex items-center gap-1 text-xs text-slate-500">
        <Users className="w-3 h-3" />
        <span>{room.capacity || '?'} chỗ</span>
      </div>

      {/* Status badge */}
      <StatusBadge room={room} />
    </button>
  );
}

/* =============================================
 * Room List Item Component
 * ============================================= */
function RoomListItem({ room, isSelected, onSelect }) {
  const isDisabled = room.isBusy && !room.isCurrent;
  
  return (
    <button
      onClick={onSelect}
      disabled={isDisabled}
      className={`
        w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left
        ${isSelected 
          ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200' 
          : isDisabled
            ? 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed'
            : 'border-slate-200 hover:border-orange-300 hover:bg-orange-50/50'
        }
      `}
    >
      {/* Icon */}
      <div className={`
        w-10 h-10 rounded-lg flex items-center justify-center shrink-0
        ${isSelected ? 'bg-orange-100' : isDisabled ? 'bg-slate-200' : 'bg-slate-100'}
      `}>
        <DoorOpen className={`w-5 h-5 ${isSelected ? 'text-orange-600' : isDisabled ? 'text-slate-400' : 'text-slate-600'}`} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className={`font-semibold truncate ${isSelected ? 'text-orange-700' : 'text-slate-900'}`}>
          {room.name || room.code}
        </h4>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          {room.centers?.name && (
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {room.centers.name}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {room.capacity || '?'} chỗ
          </span>
        </div>
      </div>

      {/* Status & Selection */}
      <div className="flex items-center gap-2 shrink-0">
        <StatusBadge room={room} compact />
        {isSelected && (
          <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
    </button>
  );
}

/* =============================================
 * Status Badge Component
 * ============================================= */
function StatusBadge({ room, compact = false }) {
  if (room.isCurrent) {
    return (
      <span className={`px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium ${compact ? '' : 'mt-1'}`}>
        {compact ? 'Hiện tại' : 'Phòng hiện tại'}
      </span>
    );
  }
  
  if (room.isBusy) {
    return (
      <span className={`px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium ${compact ? '' : 'mt-1'}`}>
        {compact ? 'Đang dùng' : 'Đang sử dụng'}
      </span>
    );
  }
  
  return (
    <span className={`px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium ${compact ? '' : 'mt-1'}`}>
      Còn trống
    </span>
  );
}

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
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [showAll, setShowAll] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'available' | 'busy'

  // ⚠️ TẤT CẢ HOOKS PHẢI Ở TRƯỚC EARLY RETURN
  
  // Filter rooms by search and status
  const filteredRooms = useMemo(() => {
    return rooms.filter(r => {
      // Search filter
      const matchSearch = !searchTerm || 
        r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.centers?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      let matchStatus = true;
      if (filterStatus === 'available') {
        matchStatus = !r.isBusy || r.isCurrent;
      } else if (filterStatus === 'busy') {
        matchStatus = r.isBusy && !r.isCurrent;
      }
      
      return matchSearch && matchStatus;
    });
  }, [rooms, searchTerm, filterStatus]);

  // Sort: current first, then available, then busy
  const sortedRooms = useMemo(() => {
    return [...filteredRooms].sort((a, b) => {
      if (a.isCurrent) return -1;
      if (b.isCurrent) return 1;
      if (a.isBusy && !b.isBusy) return 1;
      if (!a.isBusy && b.isBusy) return -1;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [filteredRooms]);

  // Stats
  const stats = useMemo(() => ({
    total: rooms.length,
    available: rooms.filter(r => !r.isBusy || r.isCurrent).length,
    busy: rooms.filter(r => r.isBusy && !r.isCurrent).length
  }), [rooms]);

  // Rooms to display (with show more/less)
  const displayedRooms = showAll ? sortedRooms : sortedRooms.slice(0, INITIAL_DISPLAY_COUNT);
  const hasMoreRooms = sortedRooms.length > INITIAL_DISPLAY_COUNT;
  const remainingCount = sortedRooms.length - INITIAL_DISPLAY_COUNT;

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

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // ⚠️ EARLY RETURN SAU TẤT CẢ HOOKS
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal - Style giống CreateCourseModal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header - Màu cam-đỏ giống Course */}
        <div className="bg-linear-to-r from-red-500 to-orange-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <DoorOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Đổi phòng học</h2>
                <p className="text-sm text-white/80">
                  Buổi #{session?.session_number} • {session?.classes?.name}
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

        {/* Session Info */}
        {sessionInfo && (
          <div className="px-6 py-3 bg-orange-50 border-b border-orange-100 text-sm">
            <div className="flex items-center gap-4 text-slate-600">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-orange-500" />
                <span>{formatDate(sessionInfo.date)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-medium">{sessionInfo.startTime?.slice(0,5)} - {sessionInfo.endTime?.slice(0,5)}</span>
              </div>
            </div>
            {sessionInfo.currentRoom && (
              <div className="flex items-center gap-1.5 mt-1 text-orange-700">
                <Building2 className="w-4 h-4" />
                <span>Phòng hiện tại: <strong>{sessionInfo.currentRoom}</strong></span>
              </div>
            )}
          </div>
        )}

        {/* Search & Filters */}
        <div className="px-6 py-3 border-b space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Tìm phòng học..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Filter bar */}
          <div className="flex items-center justify-between">
            {/* Status filters */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả ({stats.total})
              </button>
              <button
                onClick={() => setFilterStatus('available')}
                className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
                  filterStatus === 'available'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Còn trống ({stats.available})
              </button>
              <button
                onClick={() => setFilterStatus('busy')}
                className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
                  filterStatus === 'busy'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Đang dùng ({stats.busy})
              </button>
            </div>
            
            {/* View mode toggle */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white shadow-sm text-orange-600'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Xem dạng lưới"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white shadow-sm text-orange-600'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Xem dạng danh sách"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
              <p className="text-sm text-slate-500 mt-2">Đang tải danh sách phòng...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-red-600 font-medium mb-1">{error}</p>
              {error.includes('migration') && (
                <p className="text-sm text-slate-500 mb-3">
                  Liên hệ admin để kích hoạt tính năng này
                </p>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.reload()}
              >
                Thử lại
              </Button>
            </div>
          ) : sortedRooms.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <DoorOpen className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">Không tìm thấy phòng học</p>
              {(searchTerm || filterStatus !== 'all') && (
                <Button 
                  variant="link" 
                  size="sm"
                  onClick={() => { setSearchTerm(''); setFilterStatus('all'); }}
                  className="mt-2 text-orange-600"
                >
                  Xóa bộ lọc
                </Button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {displayedRooms.map((room) => (
                  <RoomGridCard
                    key={room.id}
                    room={room}
                    isSelected={selectedRoomId === room.id}
                    onSelect={() => !room.isBusy || room.isCurrent ? setSelectedRoomId(room.id) : null}
                  />
                ))}
              </div>
              
              {/* Show More/Less */}
              {hasMoreRooms && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="w-full py-2 text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center justify-center gap-1 hover:bg-orange-50 rounded-lg transition-colors"
                >
                  {showAll ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Thu gọn
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Xem thêm {remainingCount} phòng khác
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            /* List View */
            <div className="space-y-2">
              {displayedRooms.map((room) => (
                <RoomListItem
                  key={room.id}
                  room={room}
                  isSelected={selectedRoomId === room.id}
                  onSelect={() => !room.isBusy || room.isCurrent ? setSelectedRoomId(room.id) : null}
                />
              ))}
              
              {/* Show More/Less */}
              {hasMoreRooms && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="w-full py-2 text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center justify-center gap-1 hover:bg-orange-50 rounded-lg transition-colors"
                >
                  {showAll ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Thu gọn
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Xem thêm {remainingCount} phòng khác
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t flex items-center justify-end gap-3 shrink-0">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving || !selectedRoomId}
            className="bg-orange-500 hover:bg-orange-600 text-white"
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
