/**
 * SessionFilters Component - Bộ lọc cho danh sách sessions
 */

import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Filter, 
  User, 
  Building2,
  DoorOpen,
  ChevronDown,
  X,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/auth-context';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Quick date presets
const DATE_PRESETS = [
  { label: 'Hôm nay', value: 'today' },
  { label: 'Tuần này', value: 'week' },
  { label: 'Tháng này', value: 'month' }
];

// Status options
const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'scheduled', label: 'Chưa dạy' },
  { value: 'completed', label: 'Đã hoàn thành' },
  { value: 'cancelled', label: 'Đã hủy' }
];

export function SessionFilters({ 
  filters, 
  onFilterChange,
  onPresetClick,
  activePreset = 'week',
  loading = false,
  sessionCount = 0
}) {
  const { profile } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [centers, setCenters] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Kiểm tra quyền: SUPER_ADMIN có thể xem tất cả centers
  const isSuperAdmin = profile?.roles?.code === 'SUPER_ADMIN';
  const userCenterId = profile?.center_id;
  const userCenterName = profile?.centers?.name;

  // Fetch filter options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.warn('No active session - skipping filter options fetch');
          return;
        }

        const headers = { Authorization: `Bearer ${session.access_token}` };

        // Fetch teachers - with better error handling
        try {
          const teachersRes = await fetch(`${API_URL}/api/teachers`, { headers });
          if (teachersRes.ok) {
            const teachersData = await teachersRes.json();
            setTeachers(teachersData.data || []);
          } else if (teachersRes.status !== 404) {
            console.warn(`Teachers API returned ${teachersRes.status}`);
          }
        } catch (err) {
          console.warn('Failed to fetch teachers:', err.message);
        }

        // Fetch centers
        try {
          const centersRes = await fetch(`${API_URL}/api/admin/centers`, { headers });
          if (centersRes.ok) {
            const centersData = await centersRes.json();
            setCenters(centersData.data || []);
          } else if (centersRes.status !== 404) {
            console.warn(`Centers API returned ${centersRes.status}`);
          }
        } catch (err) {
          console.warn('Failed to fetch centers:', err.message);
        }

        // Fetch rooms
        try {
          const roomsRes = await fetch(`${API_URL}/api/rooms`, { headers });
          if (roomsRes.ok) {
            const roomsData = await roomsRes.json();
            setRooms(roomsData.data || []);
          } else if (roomsRes.status !== 404) {
            console.warn(`Rooms API returned ${roomsRes.status}`);
          }
        } catch (err) {
          console.warn('Failed to fetch rooms:', err.message);
        }
      } catch (err) {
        console.error('Error fetching filter options:', err);
      }
    };

    fetchOptions();
  }, []);

  const hasActiveFilters = filters.status || filters.teacherId || filters.centerId || filters.roomId;

  // Lọc rooms theo center nếu đã chọn
  const filteredRooms = filters.centerId 
    ? rooms.filter(r => r.center_id === filters.centerId)
    : rooms;

  const clearFilters = () => {
    onFilterChange({
      status: '',
      teacherId: '',
      centerId: '',
      roomId: ''
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-4 space-y-4">
      {/* Quick Date Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-slate-600 dark:text-gray-300 mr-2">
          <Calendar className="w-4 h-4 inline mr-1" />
          Xem theo:
        </span>
        {DATE_PRESETS.map(preset => {
          const isActive = activePreset === preset.value;
          return (
            <button
              key={preset.value}
              onClick={() => onPresetClick(preset.value)}
              disabled={loading}
              className={`
                px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                disabled:opacity-50 disabled:cursor-not-allowed
                ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-300 dark:ring-indigo-700'
                    : 'bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-600 hover:shadow-sm'
                }
              `}
            >
              {preset.label}
            </button>
          );
        })}
        
        {/* Session Count & Loading Indicator */}
        {loading ? (
          <div className="flex items-center gap-2 ml-4 text-sm text-slate-500 dark:text-gray-400">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Đang tải...</span>
          </div>
        ) : sessionCount > 0 ? (
          <div className="ml-4 px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-medium">
            {sessionCount} buổi học
          </div>
        ) : null}
        
        {/* Custom Date Range */}
        <div className="flex items-center gap-2 ml-4">
          <Input
            type="date"
            value={filters.startDate}
            onChange={(e) => onFilterChange({ startDate: e.target.value })}
            disabled={loading}
            className="h-8 w-36 text-sm"
          />
          <span className="text-slate-400 dark:text-gray-500">→</span>
          <Input
            type="date"
            value={filters.endDate}
            onChange={(e) => onFilterChange({ endDate: e.target.value })}
            disabled={loading}
            className="h-8 w-36 text-sm"
          />
        </div>
      </div>

      {/* Main Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status Filter */}
        <div className="relative">
          <select
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value })}
            className="h-9 pl-3 pr-8 rounded-lg border border-slate-200 dark:border-gray-600 text-sm 
                       bg-white dark:bg-gray-700 dark:text-gray-200 appearance-none cursor-pointer
                       focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-400 pointer-events-none" />
        </div>

        {/* Teacher Filter */}
        <div className="relative">
          <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-400" />
          <select
            value={filters.teacherId}
            onChange={(e) => onFilterChange({ teacherId: e.target.value })}
            className="h-9 pl-9 pr-8 rounded-lg border border-slate-200 dark:border-gray-600 text-sm 
                       bg-white dark:bg-gray-700 dark:text-gray-200 appearance-none cursor-pointer min-w-[180px]
                       focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Tất cả giáo viên</option>
            {teachers.map(t => (
              <option key={t.id} value={t.id}>{t.full_name || t.email}</option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Center Filter - Chỉ SUPER_ADMIN mới thấy dropdown */}
        {isSuperAdmin ? (
          <div className="relative">
            <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-400" />
            <select
              value={filters.centerId}
              onChange={(e) => onFilterChange({ centerId: e.target.value, roomId: '' })}
              className="h-9 pl-9 pr-8 rounded-lg border border-slate-200 dark:border-gray-600 text-sm 
                         bg-white dark:bg-gray-700 dark:text-gray-200 appearance-none cursor-pointer min-w-[180px]
                         focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Tất cả trung tâm</option>
              {centers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        ) : (
          // CENTER_MANAGER: Hiển thị tên trung tâm dạng badge
          <div className="flex items-center gap-2 h-9 px-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800">
            <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
              {userCenterName || 'Trung tâm của bạn'}
            </span>
          </div>
        )}

        {/* Room Filter */}
        <div className="relative">
          <DoorOpen className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-400" />
          <select
            value={filters.roomId || ''}
            onChange={(e) => onFilterChange({ roomId: e.target.value })}
            className="h-9 pl-9 pr-8 rounded-lg border border-slate-200 dark:border-gray-600 text-sm 
                       bg-white dark:bg-gray-700 dark:text-gray-200 appearance-none cursor-pointer min-w-[160px]
                       focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Tất cả phòng</option>
            {filteredRooms.map(r => (
              <option key={r.id} value={r.id}>
                {r.name} {r.centers?.name ? `(${r.centers.name})` : ''}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-slate-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
          >
            <X className="w-4 h-4 mr-1" />
            Xóa bộ lọc
          </Button>
        )}
      </div>
    </div>
  );
}

export default SessionFilters;
