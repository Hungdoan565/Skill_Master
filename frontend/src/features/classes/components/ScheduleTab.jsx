/**
 * ScheduleTab Component
 * Displays session list with attendance management
 */

import {
  Calendar,
  Clock,
  User,
  UserCheck,
  ClipboardCheck,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatScheduleDisplay } from '../utils';

export function ScheduleTab({
  sessions,
  sessionsInfo,
  loading,
  classSchedule,
  onAttendanceClick
}) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <Header
        schedule={classSchedule}
        total={sessionsInfo.total}
        completed={sessionsInfo.completed}
      />

      {/* Content */}
      {loading ? (
        <LoadingState />
      ) : sessions.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <SessionsList sessions={sessions} onAttendanceClick={onAttendanceClick} />
          <Legend />
        </>
      )}
    </div>
  );
}

// Sub-components
function Header({ schedule, total, completed }) {
  const progressPercent = total ? (completed / total * 100) : 0;
  
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Lịch trình & Điểm danh</h3>
        <p className="text-sm text-slate-500">
          {formatScheduleDisplay(schedule)} • Tổng {total} buổi
        </p>
      </div>
      
      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-slate-900">{completed}/{total} buổi</p>
          <p className="text-xs text-slate-500">đã hoàn thành</p>
        </div>
        <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-500 rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          />
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

function EmptyState() {
  return (
    <div className="text-center py-12">
      <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
      <p className="text-slate-500">Chưa có lịch trình nào</p>
      <p className="text-sm text-slate-400 mt-1">
        Hãy cập nhật ngày bắt đầu/kết thúc và lịch học cho lớp
      </p>
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
            {session.day_name}, {new Date(session.date).toLocaleDateString('vi-VN', { 
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
