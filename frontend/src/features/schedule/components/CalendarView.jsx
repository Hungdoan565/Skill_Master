/**
 * CalendarView Component - Hiển thị lịch dạy dạng Calendar
 * Hỗ trợ 2 mode: Week view và Month view
 */

import { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  User,
  MapPin,
  LayoutGrid,
  List,
  AlertTriangle,
  CheckCircle,
  XCircle,
  PlayCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CalendarSkeleton } from './CalendarSkeleton';
import { DaySessionsModal } from './DaySessionsModal';

// ============================================
// CONSTANTS
// ============================================
const DAYS_OF_WEEK = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const DAYS_FULL = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
const MONTHS = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 
                'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

// Working hours for week view
const WORK_HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7:00 - 21:00

// Time slots configuration (Sáng/Chiều/Tối)
const TIME_SLOTS = [
  { 
    key: 'morning', 
    label: 'Sáng', 
    icon: '🌅', 
    startHour: 6, 
    endHour: 12, 
    bgClass: 'bg-amber-50',
    headerClass: 'bg-amber-100 text-amber-800',
    borderClass: 'border-amber-200'
  },
  { 
    key: 'afternoon', 
    label: 'Chiều', 
    icon: '☀️', 
    startHour: 12, 
    endHour: 18, 
    bgClass: 'bg-orange-50',
    headerClass: 'bg-orange-100 text-orange-800',
    borderClass: 'border-orange-200'
  },
  { 
    key: 'evening', 
    label: 'Tối', 
    icon: '🌙', 
    startHour: 18, 
    endHour: 23, 
    bgClass: 'bg-indigo-50',
    headerClass: 'bg-indigo-100 text-indigo-800',
    borderClass: 'border-indigo-200'
  }
];

// Get time slot for a session
const getTimeSlot = (timeStr) => {
  if (!timeStr) return 'morning';
  const hour = parseInt(timeStr.split(':')[0], 10);
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
};

// Group sessions by time slot
const groupSessionsByTimeSlot = (sessions) => {
  const grouped = {
    morning: [],
    afternoon: [],
    evening: []
  };
  
  sessions.forEach(session => {
    const slot = getTimeSlot(session.start_time);
    grouped[slot].push(session);
  });
  
  // Sort sessions within each slot by start_time
  Object.keys(grouped).forEach(slot => {
    grouped[slot].sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
  });
  
  return grouped;
};

// Status config
const STATUS_CONFIG = {
  scheduled: {
    bg: 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50',
    border: 'border-l-blue-500',
    text: 'text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500'
  },
  in_progress: {
    bg: 'bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50',
    border: 'border-l-amber-500',
    text: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500 animate-pulse'
  },
  overdue: {
    bg: 'bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50',
    border: 'border-l-red-500',
    text: 'text-red-700 dark:text-red-300',
    dot: 'bg-red-500'
  },
  completed: {
    bg: 'bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50',
    border: 'border-l-green-500',
    text: 'text-green-700 dark:text-green-300',
    dot: 'bg-green-500'
  },
  cancelled: {
    bg: 'bg-slate-100 hover:bg-slate-200 dark:bg-gray-700 dark:hover:bg-gray-600',
    border: 'border-l-slate-400',
    text: 'text-slate-500 dark:text-gray-400 line-through',
    dot: 'bg-slate-400'
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================
const getDisplayStatus = (session) => {
  if (session.status === 'completed') return 'completed';
  if (session.status === 'cancelled') return 'cancelled';
  
  const now = new Date();
  const sessionStart = new Date(`${session.session_date}T${session.start_time}`);
  const sessionEnd = new Date(`${session.session_date}T${session.end_time}`);
  
  if (now >= sessionStart && now <= sessionEnd) return 'in_progress';
  if (now > sessionEnd) return 'overdue';
  return 'scheduled';
};

const formatTime = (time) => time?.substring(0, 5) || '';

const getWeekDates = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  const monday = new Date(d.setDate(diff));
  
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return date;
  });
};

const getMonthDates = (year, month) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  
  // Get previous month days to fill the first week
  const prevMonthDays = startDay === 0 ? 6 : startDay - 1;
  const dates = [];
  
  // Previous month
  for (let i = prevMonthDays - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    dates.push({ date: d, isCurrentMonth: false });
  }
  
  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    dates.push({ date: new Date(year, month, i), isCurrentMonth: true });
  }
  
  // Next month to fill 6 weeks
  const remaining = 42 - dates.length;
  for (let i = 1; i <= remaining; i++) {
    dates.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
  }
  
  return dates;
};

const formatDateKey = (date) => {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

// ============================================
// SESSION CARD COMPONENT
// ============================================
function SessionCard({ session, onClick, compact = false }) {
  const status = getDisplayStatus(session);
  const config = STATUS_CONFIG[status];
  
  if (compact) {
    return (
      <button
        onClick={() => onClick?.(session)}
        className={`
          w-full text-left p-1.5 rounded text-xs border-l-2 mb-1 transition-colors
          ${config.bg} ${config.border}
        `}
      >
        <div className="flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
          <span className={`font-medium truncate ${config.text}`}>
            {session.classes?.name || 'N/A'}
          </span>
        </div>
        <div className="text-[10px] text-slate-500 dark:text-gray-400 mt-0.5">
          {formatTime(session.start_time)}
        </div>
      </button>
    );
  }
  
  return (
    <button
      onClick={() => onClick?.(session)}
      className={`
        w-full text-left p-2 rounded-lg border-l-4 mb-2 transition-all shadow-sm hover:shadow
        ${config.bg} ${config.border}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full shrink-0 ${config.dot}`} />
            <span className={`font-medium text-sm truncate ${config.text}`}>
              {session.classes?.name || 'N/A'}
            </span>
          </div>
          <div className="mt-1 space-y-0.5">
            <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-gray-400">
              <Clock className="w-3 h-3" />
              <span>{formatTime(session.start_time)} - {formatTime(session.end_time)}</span>
            </div>
            {session.users?.full_name && (
              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-gray-400">
                <User className="w-3 h-3" />
                <span className="truncate">{session.users.full_name}</span>
              </div>
            )}
            {session.classes?.rooms?.name && (
              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-gray-400">
                <MapPin className="w-3 h-3" />
                <span>{session.classes.rooms.name}</span>
              </div>
            )}
          </div>
        </div>
        <span className="text-xs font-bold text-slate-400 dark:text-gray-500">#{session.session_number}</span>
      </div>
    </button>
  );
}

// ============================================
// WEEK VIEW COMPONENT (with Sáng/Chiều/Tối grouping)
// ============================================
function WeekView({ sessions, currentDate, onSessionClick }) {
  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);
  const today = formatDateKey(new Date());
  
  // Group sessions by date and time slot
  const sessionsByDateAndSlot = useMemo(() => {
    const map = {};
    sessions.forEach(session => {
      const dateKey = session.session_date;
      const slot = getTimeSlot(session.start_time);
      const key = `${dateKey}-${slot}`;
      if (!map[key]) map[key] = [];
      map[key].push(session);
    });
    // Sort sessions within each slot
    Object.keys(map).forEach(key => {
      map[key].sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
    });
    return map;
  }, [sessions]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 overflow-hidden">
      {/* Header - Days - Sticky */}
      <div className="sticky top-0 z-20 grid grid-cols-8 border-b border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 shadow-sm">
        <div className="p-2 bg-slate-50 dark:bg-gray-800 border-r border-slate-200 dark:border-gray-700">
          <span className="text-xs font-medium text-slate-500 dark:text-gray-400">Buổi</span>
        </div>
        {weekDates.map((date, i) => {
          const dateKey = formatDateKey(date);
          const isToday = dateKey === today;
          return (
            <div 
              key={i}
              className={`p-2 text-center border-r border-slate-200 dark:border-gray-700 last:border-r-0 ${
                isToday ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-slate-50 dark:bg-gray-800'
              }`}
            >
              <div className={`text-xs font-medium ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-gray-400'}`}>
                {DAYS_OF_WEEK[(i + 1) % 7]}
              </div>
              <div className={`text-lg font-bold ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-gray-100'}`}>
                {date.getDate()}
              </div>
              {isToday && (
                <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[10px] font-medium bg-indigo-600 text-white rounded-full">
                  Hôm nay
                </span>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Time Slot Grid (Sáng/Chiều/Tối) */}
      <div className="max-h-[600px] overflow-y-auto">
        {TIME_SLOTS.map(slot => (
          <div key={slot.key} className={`border-b ${slot.borderClass}`}>
            {/* Time slot row */}
            <div className="grid grid-cols-8 min-h-[120px]">
              {/* Slot label */}
              <div className={`p-2 border-r ${slot.borderClass} ${slot.headerClass} flex flex-col items-center justify-center`}>
                <span className="text-xl mb-1">{slot.icon}</span>
                <span className="text-xs font-semibold">{slot.label}</span>
                <span className="text-[10px] opacity-75 mt-0.5">
                  {slot.startHour}:00 - {slot.endHour}:00
                </span>
              </div>
              
              {/* Day cells for this slot */}
              {weekDates.map((date, i) => {
                const dateKey = formatDateKey(date);
                const isToday = dateKey === today;
                const cellKey = `${dateKey}-${slot.key}`;
                const cellSessions = sessionsByDateAndSlot[cellKey] || [];
                
                return (
                  <div 
                    key={i}
                    className={`p-1.5 border-r ${slot.borderClass} dark:border-gray-700 last:border-r-0 ${slot.bgClass} dark:bg-gray-800/50 ${
                      isToday ? 'ring-1 ring-inset ring-indigo-200 dark:ring-indigo-800' : ''
                    }`}
                  >
                    {cellSessions.length === 0 ? (
                      <div className="h-full flex items-center justify-center">
                        <span className="text-[10px] text-slate-400 dark:text-gray-600">—</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {cellSessions.map(session => (
                          <SessionCard 
                            key={session.id} 
                            session={session} 
                            onClick={onSessionClick}
                            compact
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// MONTH VIEW COMPONENT
// ============================================
function MonthView({ sessions, currentDate, onSessionClick, onShowMore }) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthDates = useMemo(() => getMonthDates(year, month), [year, month]);
  const today = formatDateKey(new Date());
  
  // Group sessions by date
  const sessionsByDate = useMemo(() => {
    const map = {};
    sessions.forEach(session => {
      const dateKey = session.session_date;
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(session);
    });
    return map;
  }, [sessions]);
  
  const MAX_VISIBLE_SESSIONS = 3;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 overflow-hidden">
      {/* Header - Days of week - Sticky */}
      <div className="sticky top-0 z-20 grid grid-cols-7 border-b border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 shadow-sm">
        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => (
          <div key={day} className="p-2 text-center text-xs font-medium text-slate-500 dark:text-gray-400 border-r border-slate-200 dark:border-gray-700 last:border-r-0">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {monthDates.map(({ date, isCurrentMonth }, i) => {
          const dateKey = formatDateKey(date);
          const isToday = dateKey === today;
          const daySessions = sessionsByDate[dateKey] || [];
          
          return (
            <div 
              key={i}
              className={`
                min-h-[120px] p-1.5 border-b border-r border-slate-100 dark:border-gray-700
                ${!isCurrentMonth ? 'bg-slate-50/50 dark:bg-gray-900/50' : ''}
                ${isToday ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''}
              `}
            >
              {/* Date number */}
              <div className={`
                text-sm font-medium mb-1
                ${isToday ? 'text-indigo-600 dark:text-indigo-400' : isCurrentMonth ? 'text-slate-900 dark:text-gray-100' : 'text-slate-400 dark:text-gray-600'}
              `}>
                <span className={`
                  inline-flex items-center justify-center w-6 h-6 rounded-full
                  ${isToday ? 'bg-indigo-600 text-white' : ''}
                `}>
                  {date.getDate()}
                </span>
              </div>
              
              {/* Sessions */}
              <div className="space-y-0.5 max-h-20 overflow-y-auto">
                {daySessions.slice(0, MAX_VISIBLE_SESSIONS).map(session => (
                  <SessionCard 
                    key={session.id} 
                    session={session} 
                    onClick={onSessionClick}
                    compact
                  />
                ))}
                {daySessions.length > MAX_VISIBLE_SESSIONS && (
                  <button
                    onClick={() => onShowMore?.(dateKey, daySessions)}
                    className="w-full text-[10px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium text-center py-1 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition-colors"
                  >
                    +{daySessions.length - MAX_VISIBLE_SESSIONS} buổi khác
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// MAIN CALENDAR VIEW COMPONENT
// ============================================
export function CalendarView({ 
  sessions = [], 
  loading = false,
  onSessionClick,
  onDateChange,
  onAction,
  initialView = 'week'
}) {
  const [viewMode, setViewMode] = useState(initialView); // 'week' | 'month'
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Modal state for showing all sessions in a day
  const [dayModalState, setDayModalState] = useState({
    isOpen: false,
    date: null,
    sessions: []
  });
  
  const handleShowMore = (date, sessions) => {
    setDayModalState({
      isOpen: true,
      date,
      sessions
    });
  };
  
  const closeDayModal = () => {
    setDayModalState({
      isOpen: false,
      date: null,
      sessions: []
    });
  };

  // Navigation
  const navigate = (direction) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + direction * 7);
    } else {
      newDate.setMonth(newDate.getMonth() + direction);
    }
    setCurrentDate(newDate);
    
    // Calculate date range for parent to fetch data
    if (onDateChange) {
      if (viewMode === 'week') {
        const weekDates = getWeekDates(newDate);
        onDateChange({
          startDate: formatDateKey(weekDates[0]),
          endDate: formatDateKey(weekDates[6])
        });
      } else {
        const year = newDate.getFullYear();
        const month = newDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        onDateChange({
          startDate: formatDateKey(firstDay),
          endDate: formatDateKey(lastDay)
        });
      }
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    
    if (onDateChange) {
      if (viewMode === 'week') {
        const weekDates = getWeekDates(today);
        onDateChange({
          startDate: formatDateKey(weekDates[0]),
          endDate: formatDateKey(weekDates[6])
        });
      } else {
        const year = today.getFullYear();
        const month = today.getMonth();
        onDateChange({
          startDate: formatDateKey(new Date(year, month, 1)),
          endDate: formatDateKey(new Date(year, month + 1, 0))
        });
      }
    }
  };

  // Get display title
  const getTitle = () => {
    if (viewMode === 'week') {
      const weekDates = getWeekDates(currentDate);
      const start = weekDates[0];
      const end = weekDates[6];
      if (start.getMonth() === end.getMonth()) {
        return `${start.getDate()} - ${end.getDate()} ${MONTHS[start.getMonth()]} ${start.getFullYear()}`;
      }
      return `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}/${end.getFullYear()}`;
    }
    return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  };

  // Handle view mode change
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    
    // Recalculate date range
    if (onDateChange) {
      if (mode === 'week') {
        const weekDates = getWeekDates(currentDate);
        onDateChange({
          startDate: formatDateKey(weekDates[0]),
          endDate: formatDateKey(weekDates[6])
        });
      } else {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        onDateChange({
          startDate: formatDateKey(new Date(year, month, 1)),
          endDate: formatDateKey(new Date(year, month + 1, 0))
        });
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Show loading skeleton */}
      {loading ? (
        <CalendarSkeleton />
      ) : (
      <>
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
          >
            Hôm nay
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          
          <h2 className="text-lg font-semibold text-slate-900 dark:text-gray-100 ml-2">
            {getTitle()}
          </h2>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => handleViewModeChange('week')}
            className={`
              px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5
              ${viewMode === 'week' 
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200'
              }
            `}
          >
            <List className="w-4 h-4" />
            Tuần
          </button>
          <button
            onClick={() => handleViewModeChange('month')}
            className={`
              px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5
              ${viewMode === 'month' 
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200'
              }
            `}
          >
            <LayoutGrid className="w-4 h-4" />
            Tháng
          </button>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <span className="font-medium text-slate-600 dark:text-gray-400">Chú thích:</span>
        {[
          { status: 'scheduled', label: 'Chưa học' },
          { status: 'in_progress', label: 'Đang học' },
          { status: 'overdue', label: 'Quá hạn' },
          { status: 'completed', label: 'Hoàn thành' },
          { status: 'cancelled', label: 'Đã hủy' }
        ].map(({ status, label }) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[status].dot}`} />
            <span className="text-slate-600 dark:text-gray-400">{label}</span>
          </div>
        ))}
      </div>
      
      {/* Calendar Content */}
      {viewMode === 'week' ? (
        <WeekView 
          sessions={sessions} 
          currentDate={currentDate}
          onSessionClick={onSessionClick}
        />
      ) : (
        <MonthView 
          sessions={sessions} 
          currentDate={currentDate}
          onSessionClick={onSessionClick}
          onShowMore={handleShowMore}
        />
      )}
      </>
      )}
      
      {/* Day Sessions Modal */}
      <DaySessionsModal
        isOpen={dayModalState.isOpen}
        onClose={closeDayModal}
        date={dayModalState.date}
        sessions={dayModalState.sessions}
        onAction={onAction}
      />
    </div>
  );
}

export default CalendarView;
