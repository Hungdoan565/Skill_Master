/**
 * SessionFilters Component - Bộ lọc cho danh sách sessions
 */

import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Filter, 
  User, 
  Building2,
  ChevronDown,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
  activePreset = 'today'
}) {
  const [teachers, setTeachers] = useState([]);
  const [centers, setCenters] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Fetch filter options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const headers = { Authorization: `Bearer ${session.access_token}` };

        // Fetch teachers
        const teachersRes = await fetch(`${API_URL}/api/admin/teachers`, { headers });
        if (teachersRes.ok) {
          const teachersData = await teachersRes.json();
          setTeachers(teachersData.data || []);
        }

        // Fetch centers
        const centersRes = await fetch(`${API_URL}/api/centers`, { headers });
        if (centersRes.ok) {
          const centersData = await centersRes.json();
          setCenters(centersData.data || []);
        }
      } catch (err) {
        console.error('Error fetching filter options:', err);
      }
    };

    fetchOptions();
  }, []);

  const hasActiveFilters = filters.status || filters.teacherId || filters.centerId;

  const clearFilters = () => {
    onFilterChange({
      status: '',
      teacherId: '',
      centerId: ''
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
      {/* Quick Date Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-slate-600 mr-2">
          <Calendar className="w-4 h-4 inline mr-1" />
          Xem theo:
        </span>
        {DATE_PRESETS.map(preset => (
          <button
            key={preset.value}
            onClick={() => onPresetClick(preset.value)}
            className={`
              px-3 py-1.5 rounded-lg text-sm font-medium transition-all
              ${activePreset === preset.value
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }
            `}
          >
            {preset.label}
          </button>
        ))}
        
        {/* Custom Date Range */}
        <div className="flex items-center gap-2 ml-4">
          <Input
            type="date"
            value={filters.startDate}
            onChange={(e) => onFilterChange({ startDate: e.target.value })}
            className="h-8 w-36 text-sm"
          />
          <span className="text-slate-400">→</span>
          <Input
            type="date"
            value={filters.endDate}
            onChange={(e) => onFilterChange({ endDate: e.target.value })}
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
            className="h-9 pl-3 pr-8 rounded-lg border border-slate-200 text-sm 
                       bg-white appearance-none cursor-pointer
                       focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Teacher Filter */}
        <div className="relative">
          <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={filters.teacherId}
            onChange={(e) => onFilterChange({ teacherId: e.target.value })}
            className="h-9 pl-9 pr-8 rounded-lg border border-slate-200 text-sm 
                       bg-white appearance-none cursor-pointer min-w-[180px]
                       focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Tất cả giáo viên</option>
            {teachers.map(t => (
              <option key={t.id} value={t.id}>{t.full_name || t.email}</option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Center Filter */}
        <div className="relative">
          <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={filters.centerId}
            onChange={(e) => onFilterChange({ centerId: e.target.value })}
            className="h-9 pl-9 pr-8 rounded-lg border border-slate-200 text-sm 
                       bg-white appearance-none cursor-pointer min-w-[180px]
                       focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Tất cả trung tâm</option>
            {centers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
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
            className="text-slate-500 hover:text-red-600"
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
