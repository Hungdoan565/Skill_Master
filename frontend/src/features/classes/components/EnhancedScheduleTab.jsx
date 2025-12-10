/**
 * EnhancedScheduleTab Component
 * Enhanced session management with selection, bulk edit, and reschedule features
 */

import { useState, useMemo, useCallback } from 'react';
import {
  Calendar,
  Clock,
  User,
  UserCheck,
  ClipboardCheck,
  Loader2,
  List,
  LayoutGrid,
  Plus,
  CheckSquare,
  Square,
  MinusSquare,
  Settings,
  CalendarDays,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatScheduleDisplay } from '../utils';
import { ClassCalendarView } from './ClassCalendarView';
import { SessionBulkEditModal } from './SessionBulkEditModal';
import { SessionRescheduleModal } from './SessionRescheduleModal';

// View mode storage key
const VIEW_MODE_KEY = 'skill_master_schedule_view_mode';

export function EnhancedScheduleTab({
  sessions,
  sessionsInfo,
  loading,
  classSchedule,
  availableTeachers = [],
  availableRooms = [],
  onAttendanceClick,
  onCreateSessions,
  onBulkUpdateSessions,
  onRescheduleSession,
  onDeleteSession
}) {
  // View mode state
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem(VIEW_MODE_KEY) || 'list';
    } catch {
      return 'list';
    }
  });

  // Selection state
  const [selectedSessionIds, setSelectedSessionIds] = useState([]);
  const [bulkEditModalOpen, setBulkEditModalOpen] = useState(false);
  const [rescheduleModal, setRescheduleModal] = useState({ open: false, session: null });
  const [bulkLoading, setBulkLoading] = useState(false);

  // Handle view mode change
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_MODE_KEY, mode);
    } catch (e) {
      console.error('Failed to save view mode:', e);
    }
  };

  // Selection handlers
  const toggleSelectSession = useCallback((sessionId) => {
    setSelectedSessionIds(prev => 
      prev.includes(sessionId)
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedSessionIds.length === sessions.length) {
      setSelectedSessionIds([]);
    } else {
      setSelectedSessionIds(sessions.map(s => s.id));
    }
  }, [sessions, selectedSessionIds.length]);

  const clearSelection = useCallback(() => {
    setSelectedSessionIds([]);
  }, []);

  // Get selected sessions
  const selectedSessions = useMemo(() => {
    return sessions.filter(s => selectedSessionIds.includes(s.id));
  }, [sessions, selectedSessionIds]);

  // Bulk edit handler
  const handleBulkUpdate = async (sessionIds, updates) => {
    setBulkLoading(true);
    try {
      await onBulkUpdateSessions(sessionIds, updates);
      clearSelection();
    } finally {
      setBulkLoading(false);
    }
  };

  // Reschedule handler
  const handleReschedule = async (sessionId, updates) => {
    setBulkLoading(true);
    try {
      await onRescheduleSession(sessionId, updates);
      setRescheduleModal({ open: false, session: null });
    } finally {
      setBulkLoading(false);
    }
  };

  // Transform sessions data for calendar view
  const calendarSessions = useMemo(() => {
    if (!sessions) return [];
    return sessions.map(session => ({
      id: session.id,
      session_date: session.date || session.session_date,
      start_time: session.start_time,
      end_time: session.end_time,
      session_number: session.session_number,
      status: session.status === 'today' ? 'scheduled' : session.status,
      is_marked: session.is_marked,
      classes: {
        name: `Buổi ${session.session_number}`
      },
      users: session.teacher
    }));
  }, [sessions]);

  const hasSelection = selectedSessionIds.length > 0;
  const allSelected = sessions.length > 0 && selectedSessionIds.length === sessions.length;
  const someSelected = hasSelection && !allSelected;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Header
        schedule={classSchedule}
        total={sessionsInfo.total}
        completed={sessionsInfo.completed}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        onCreateSessions={onCreateSessions}
      />

      {/* Bulk Action Bar */}
      {hasSelection && (
        <BulkActionBar
          selectedCount={selectedSessionIds.length}
          onClearSelection={clearSelection}
          onBulkEdit={() => setBulkEditModalOpen(true)}
        />
      )}

      {/* Content */}
      {loading ? (
        <LoadingState />
      ) : sessions.length === 0 ? (
        <EmptyState onCreateSessions={onCreateSessions} />
      ) : (
        <>
          {viewMode === 'list' ? (
            <EnhancedSessionsList
              sessions={sessions}
              selectedSessionIds={selectedSessionIds}
              allSelected={allSelected}
              someSelected={someSelected}
              onToggleSelect={toggleSelectSession}
              onToggleSelectAll={toggleSelectAll}
              onAttendanceClick={onAttendanceClick}
              onRescheduleClick={(session) => setRescheduleModal({ open: true, session })}
            />
          ) : (
            <ClassCalendarView 
              sessions={calendarSessions} 
              onSessionClick={onAttendanceClick}
            />
          )}
          <Legend />
        </>
      )}

      {/* Bulk Edit Modal */}
      <SessionBulkEditModal
        isOpen={bulkEditModalOpen}
        onClose={() => setBulkEditModalOpen(false)}
        selectedSessions={selectedSessions}
        availableTeachers={availableTeachers}
        availableRooms={availableRooms}
        onSubmit={handleBulkUpdate}
        loading={bulkLoading}
      />

      {/* Reschedule Modal */}
      <SessionRescheduleModal
        isOpen={rescheduleModal.open}
        onClose={() => setRescheduleModal({ open: false, session: null })}
        session={rescheduleModal.session}
        availableTeachers={availableTeachers}
        availableRooms={availableRooms}
        onSubmit={handleReschedule}
        loading={bulkLoading}
      />
    </div>
  );
}

// Sub-components
function Header({ schedule, total, completed, viewMode, onViewModeChange, onCreateSessions }) {
  const progressPercent = total ? (completed / total * 100) : 0;
  
  return (
    <div className="flex flex-col gap-4 pb-4 border-b border-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Lịch trình & Điểm danh</h3>
          <p className="text-sm text-slate-500">
            {formatScheduleDisplay(schedule)} • Tổng {total} buổi
          </p>
        </div>
        
        {/* Actions Row */}
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => onViewModeChange('list')}
              className={`
                px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5
                ${viewMode === 'list' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
                }
              `}
              title="Xem dạng danh sách"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Danh sách</span>
            </button>
            <button
              onClick={() => onViewModeChange('calendar')}
              className={`
                px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5
                ${viewMode === 'calendar' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
                }
              `}
              title="Xem dạng lịch"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Lịch</span>
            </button>
          </div>

          {/* Create Sessions Button */}
          {onCreateSessions && (
            <Button
              size="sm"
              variant="outline"
              onClick={onCreateSessions}
              className="whitespace-nowrap"
            >
              <Plus className="w-4 h-4 mr-1" />
              Tạo nhiều buổi
            </Button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-medium text-slate-900">{completed}/{total} buổi</p>
          <p className="text-xs text-slate-500">đã hoàn thành</p>
        </div>
      </div>
    </div>
  );
}

function BulkActionBar({ selectedCount, onClearSelection, onBulkEdit }) {
  return (
    <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-indigo-600" />
          <span className="font-medium text-indigo-900">
            Đã chọn {selectedCount} buổi học
          </span>
        </div>
        <button
          onClick={onClearSelection}
          className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
        >
          Bỏ chọn
        </button>
      </div>
      <div className="flex items-center gap-2">
        <Button 
          size="sm"
          onClick={onBulkEdit}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Settings className="w-4 h-4 mr-1.5" />
          Sửa hàng loạt
        </Button>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="text-center py-12">
      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
      <p className="text-slate-500">Đang tải lịch trình...</p>
    </div>
  );
}

function EmptyState({ onCreateSessions }) {
  return (
    <div className="text-center py-12">
      <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
      <p className="text-slate-500">Chưa có lịch trình nào</p>
      <p className="text-sm text-slate-400 mt-1">
        Hãy cập nhật ngày bắt đầu/kết thúc và lịch học cho lớp
      </p>
      {onCreateSessions && (
        <Button
          className="mt-4"
          onClick={onCreateSessions}
        >
          <Plus className="w-4 h-4 mr-2" />
          Tạo lịch học tự động
        </Button>
      )}
    </div>
  );
}

function EnhancedSessionsList({ 
  sessions, 
  selectedSessionIds, 
  allSelected,
  someSelected,
  onToggleSelect, 
  onToggleSelectAll,
  onAttendanceClick,
  onRescheduleClick 
}) {
  return (
    <div className="space-y-2">
      {/* Select All Header */}
      <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-lg">
        <button
          onClick={onToggleSelectAll}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          {allSelected ? (
            <CheckSquare className="w-5 h-5 text-indigo-600" />
          ) : someSelected ? (
            <MinusSquare className="w-5 h-5 text-indigo-600" />
          ) : (
            <Square className="w-5 h-5 text-slate-400" />
          )}
          <span>Chọn tất cả</span>
        </button>
      </div>

      {/* Session Items */}
      {sessions.map((session) => (
        <EnhancedSessionItem
          key={session.id}
          session={session}
          isSelected={selectedSessionIds.includes(session.id)}
          onToggleSelect={() => onToggleSelect(session.id)}
          onAttendanceClick={onAttendanceClick}
          onRescheduleClick={onRescheduleClick}
        />
      ))}
    </div>
  );
}

function EnhancedSessionItem({ 
  session, 
  isSelected, 
  onToggleSelect, 
  onAttendanceClick,
  onRescheduleClick 
}) {
  const [showMenu, setShowMenu] = useState(false);
  const isToday = session.status === 'today';
  const isCompleted = session.status === 'completed';
  const isUpcoming = session.status === 'upcoming';
  const hasAttendance = session.is_marked;

  const containerClass = isSelected
    ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/20'
    : isToday 
      ? 'bg-indigo-50 border-indigo-200' 
      : isCompleted 
        ? 'bg-slate-50 border-slate-200' 
        : 'bg-white border-slate-200 hover:border-slate-300';

  const numberClass = isToday 
    ? 'bg-indigo-500 text-white' 
    : isCompleted 
      ? 'bg-slate-300 text-slate-600' 
      : 'bg-slate-100 text-slate-700';

  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${containerClass}`}>
      {/* Checkbox */}
      <button
        onClick={onToggleSelect}
        className="flex-shrink-0"
      >
        {isSelected ? (
          <CheckSquare className="w-5 h-5 text-indigo-600" />
        ) : (
          <Square className="w-5 h-5 text-slate-400 hover:text-slate-600" />
        )}
      </button>

      {/* Session Number */}
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${numberClass}`}>
        {session.session_number}
      </div>

      {/* Session Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`font-semibold ${isToday ? 'text-indigo-900' : 'text-slate-900'}`}>
            {session.day_name}, {new Date(session.date || session.session_date).toLocaleDateString('vi-VN', { 
              day: '2-digit', 
              month: '2-digit', 
              year: 'numeric' 
            })}
          </p>
          {isToday && (
            <Badge className="bg-indigo-500 text-white text-xs">Hôm nay</Badge>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {session.start_time} - {session.end_time}
          </span>
          {session.teacher && (
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              {session.teacher.full_name || session.teacher}
            </span>
          )}
        </div>
      </div>

      {/* Attendance Status & Actions */}
      <div className="flex items-center gap-2">
        {/* Attendance Summary */}
        {hasAttendance && session.attendance_summary && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 rounded-lg">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">
              {session.attendance_summary.present + session.attendance_summary.late}/{session.total_students}
            </span>
          </div>
        )}

        {/* Status Badge or Action Button */}
        {isUpcoming && !isToday ? (
          <Badge className="bg-blue-50 text-blue-600 border border-blue-200">Sắp tới</Badge>
        ) : (
          <Button
            size="sm"
            className={`${
              hasAttendance 
                ? 'bg-slate-600 hover:bg-slate-700' 
                : 'bg-indigo-600 hover:bg-indigo-700'
            } text-white`}
            onClick={() => onAttendanceClick(session)}
          >
            <ClipboardCheck className="w-4 h-4 mr-1.5" />
            {hasAttendance ? 'Xem/Sửa' : 'Điểm danh'}
          </Button>
        )}

        {/* More Actions Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-slate-500" />
          </button>

          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowMenu(false)} 
              />
              <div className="absolute right-0 top-full mt-1 z-20 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1">
                <button
                  onClick={() => {
                    onRescheduleClick(session);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <CalendarDays className="w-4 h-4" />
                  Dời lịch buổi này
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-200 text-sm text-slate-500">
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded bg-indigo-500" />
        <span>Hôm nay</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded bg-slate-300" />
        <span>Đã học</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300" />
        <span>Sắp tới</span>
      </div>
      <div className="flex items-center gap-1.5">
        <UserCheck className="w-4 h-4 text-emerald-600" />
        <span>Đã điểm danh</span>
      </div>
      <div className="flex items-center gap-1.5">
        <CheckSquare className="w-4 h-4 text-indigo-600" />
        <span>Đã chọn</span>
      </div>
    </div>
  );
}

export default EnhancedScheduleTab;
