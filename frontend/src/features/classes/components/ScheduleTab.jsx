/**
 * ScheduleTab Component
 * Displays session list with attendance management
 * Enhanced with Calendar View toggle (List, Week, Calendar)
 */

import { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  User,
  UserCheck,
  ClipboardCheck,
  Loader2,
  List,
  LayoutGrid,
  CalendarDays,
  Plus,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatScheduleDisplay } from '../utils';
import { ClassCalendarView } from './ClassCalendarView';
import { WeeklyCalendarView } from './WeeklyCalendarView';
import { SessionsListSkeleton } from './Skeleton';
import { exportAttendanceToExcel } from '../utils/exportUtils';

// View mode storage key
const VIEW_MODE_KEY = 'skill_master_schedule_view_mode';

export function ScheduleTab({
  sessions,
  sessionsInfo,
  loading,
  classSchedule,
  classInfo,
  students,
  onAttendanceClick,
  onCreateSessions // New prop for creating sessions
}) {
  // View mode state with localStorage persistence
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem(VIEW_MODE_KEY) || 'list';
    } catch {
      return 'list';
    }
  });

  // Handle view mode change
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_MODE_KEY, mode);
    } catch (e) {
      console.error('Failed to save view mode:', e);
    }
  };

  // Transform sessions data for calendar view
  const calendarSessions = useMemo(() => {
    if (!sessions) return [];
    return sessions.map(session => ({
      id: session.id,
      session_date: session.date,
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

  // Export attendance handler
  const handleExportAttendance = () => {
    try {
      exportAttendanceToExcel({
        sessions,
        students: students || [],
        classInfo
      });
    } catch (error) {
      console.error('Export failed:', error);
      alert(error.message || 'Xuất dữ liệu thất bại');
    }
  };

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
        onExportAttendance={sessions?.length > 0 ? handleExportAttendance : null}
      />

      {/* Content */}
      {loading ? (
        <SessionsListSkeleton count={5} />
      ) : sessions.length === 0 ? (
        <EmptyState onCreateSessions={onCreateSessions} />
      ) : (
        <>
          {viewMode === 'list' ? (
            <SessionsList sessions={sessions} onAttendanceClick={onAttendanceClick} />
          ) : viewMode === 'week' ? (
            <WeeklyCalendarView
              sessions={sessions}
              onSessionClick={onAttendanceClick}
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
    </div>
  );
}

// Sub-components
function Header({ schedule, total, completed, viewMode, onViewModeChange, onCreateSessions, onExportAttendance }) {
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
          {/* View Mode Toggle - 3 options: List, Week, Calendar */}
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
              onClick={() => onViewModeChange('week')}
              className={`
                px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5
                ${viewMode === 'week'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
                }
              `}
              title="Xem theo tuần"
            >
              <CalendarDays className="w-4 h-4" />
              <span className="hidden sm:inline">Tuần</span>
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
              title="Xem dạng lịch tháng"
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

          {/* Export Attendance Button */}
          {onExportAttendance && (
            <Button
              size="sm"
              variant="outline"
              onClick={onExportAttendance}
              className="whitespace-nowrap text-emerald-600 border-emerald-200 hover:bg-emerald-50"
            >
              <Download className="w-4 h-4 mr-1" />
              Xuất Excel
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

function SessionsList({ sessions, onAttendanceClick }) {
  return (
    <div className="space-y-2">
      {sessions.map((session, index) => (
        <SessionItem
          key={index}
          session={session}
          onAttendanceClick={onAttendanceClick}
        />
      ))}
    </div>
  );
}

function SessionItem({ session, onAttendanceClick }) {
  const isToday = session.status === 'today';
  const isCompleted = session.status === 'completed';
  const isUpcoming = session.status === 'upcoming';
  const hasAttendance = session.is_marked;

  // Check if session is in the future (cannot mark attendance)
  const sessionDate = new Date(session.date);
  sessionDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isFutureSession = sessionDate > today;
  const canMarkAttendance = !isFutureSession && session.status !== 'cancelled';

  const containerClass = isToday
    ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500/20'
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
      {/* Session Number */}
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${numberClass}`}>
        {session.session_number}
      </div>

      {/* Session Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`font-semibold ${isToday ? 'text-indigo-900' : 'text-slate-900'}`}>
            {session.day_name}, {(() => {
              // Parse date as local time to avoid timezone issues
              const [year, month, day] = session.date.split('-').map(Number);
              const date = new Date(year, month - 1, day);
              return date.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              });
            })()}
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
              {session.teacher.full_name}
            </span>
          )}
        </div>
      </div>

      {/* Attendance Status & Action */}
      <div className="flex items-center gap-3">
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
        {isFutureSession && !isToday ? (
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-50 text-blue-600 border border-blue-200">Sắp tới</Badge>
            <span className="text-xs text-slate-400" title="Chỉ điểm danh được buổi đã học">
              (Chưa thể điểm danh)
            </span>
          </div>
        ) : (
          <Button
            size="sm"
            className={`${hasAttendance
              ? 'bg-slate-600 hover:bg-slate-700'
              : 'bg-indigo-600 hover:bg-indigo-700'
              } text-white`}
            onClick={() => canMarkAttendance && onAttendanceClick(session)}
            disabled={!canMarkAttendance}
            title={!canMarkAttendance ? 'Chỉ điểm danh được buổi đã học' : ''}
          >
            <ClipboardCheck className="w-4 h-4 mr-1.5" />
            {hasAttendance ? 'Xem/Sửa' : 'Điểm danh'}
          </Button>
        )}
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
    </div>
  );
}
