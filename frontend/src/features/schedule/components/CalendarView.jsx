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

// Status config
const STATUS_CONFIG = {
  scheduled: {
    bg: 'bg-blue-100 hover:bg-blue-200',
    border: 'border-l-blue-500',
    text: 'text-blue-700',
    dot: 'bg-blue-500'
  },
  in_progress: {
    bg: 'bg-amber-100 hover:bg-amber-200',
    border: 'border-l-amber-500',
    text: 'text-amber-700',
    dot: 'bg-amber-500 animate-pulse'
  },
  overdue: {
    bg: 'bg-red-100 hover:bg-red-200',
    border: 'border-l-red-500',
    text: 'text-red-700',
    dot: 'bg-red-500'
  },
  completed: {
    bg: 'bg-green-100 hover:bg-green-200',
    border: 'border-l-green-500',
    text: 'text-green-700',
    dot: 'bg-green-500'
  },
  cancelled: {
    bg: 'bg-slate-100 hover:bg-slate-200',
    border: 'border-l-slate-400',
    text: 'text-slate-500 line-through',
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
        <div className="text-[10px] text-slate-500 mt-0.5">
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
            <div className="flex items-center gap-1 text-xs text-slate-600">
              <Clock className="w-3 h-3" />
              <span>{formatTime(session.start_time)} - {formatTime(session.end_time)}</span>
            </div>
            {session.users?.full_name && (
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <User className="w-3 h-3" />
                <span className="truncate">{session.users.full_name}</span>
              </div>
            )}
            {session.classes?.rooms?.name && (
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="w-3 h-3" />
                <span>{session.classes.rooms.name}</span>
              </div>
            )}
          </div>
        </div>
        <span className="text-xs font-bold text-slate-400">#{session.session_number}</span>
      </div>
    </button>
  );
}

// ============================================
// WEEK VIEW COMPONENT
// ============================================
function WeekView({ sessions, currentDate, onSessionClick }) {
  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);
  const today = formatDateKey(new Date());
  
  // Group sessions by date and hour
  const sessionsByDateTime = useMemo(() => {
    const map = {};
    sessions.forEach(session => {
      const dateKey = session.session_date;
      const hour = parseInt(session.start_time?.split(':')[0] || '0');
      const key = `${dateKey}-${hour}`;
      if (!map[key]) map[key] = [];
      map[key].push(session);
    });
    return map;
  }, [sessions]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header - Days - Sticky */}
      <div className="sticky top-0 z-20 grid grid-cols-8 border-b border-slate-200 bg-slate-50 shadow-sm">
        <div className="p-2 bg-slate-50 border-r border-slate-200">
          <span className="text-xs font-medium text-slate-500">Giờ</span>
        </div>
        {weekDates.map((date, i) => {
          const dateKey = formatDateKey(date);
          const isToday = dateKey === today;
          return (
            <div 
              key={i}
              className={`p-2 text-center border-r border-slate-200 last:border-r-0 ${
                isToday ? 'bg-indigo-50' : 'bg-slate-50'
              }`}
            >
              <div className={`text-xs font-medium ${isToday ? 'text-indigo-600' : 'text-slate-500'}`}>
                {DAYS_OF_WEEK[(i + 1) % 7]}
              </div>
              <div className={`text-lg font-bold ${isToday ? 'text-indigo-600' : 'text-slate-900'}`}>
                {date.getDate()}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Time Grid */}
      <div className="max-h-[600px] overflow-y-auto">
        {WORK_HOURS.map(hour => (
          <div key={hour} className="grid grid-cols-8 border-b border-slate-100 min-h-20">
            {/* Hour label */}
            <div className="p-2 border-r border-slate-200 bg-slate-50">
              <span className="text-xs font-medium text-slate-500">
                {String(hour).padStart(2, '0')}:00
              </span>
            </div>
            
            {/* Day cells */}
            {weekDates.map((date, i) => {
              const dateKey = formatDateKey(date);
              const isToday = dateKey === today;
              const cellKey = `${dateKey}-${hour}`;
              const cellSessions = sessionsByDateTime[cellKey] || [];
              
              return (
                <div 
                  key={i}
                  className={`p-1 border-r border-slate-100 last:border-r-0 ${
                    isToday ? 'bg-indigo-50/30' : ''
                  }`}
                >
                  {cellSessions.map(session => (
                    <SessionCard 
                      key={session.id} 
                      session={session} 
                      onClick={onSessionClick}
                      compact
                    />
                  ))}
                </div>
              );
            })}
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
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header - Days of week - Sticky */}
      <div className="sticky top-0 z-20 grid grid-cols-7 border-b border-slate-200 bg-slate-50 shadow-sm">
        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => (
          <div key={day} className="p-2 text-center text-xs font-medium text-slate-500 border-r border-slate-200 last:border-r-0">
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
                min-h-[120px] p-1.5 border-b border-r border-slate-100 
                ${!isCurrentMonth ? 'bg-slate-50/50' : ''}
                ${isToday ? 'bg-indigo-50/50' : ''}
              `}
            >
              {/* Date number */}
              <div className={`
                text-sm font-medium mb-1
                ${isToday ? 'text-indigo-600' : isCurrentMonth ? 'text-slate-900' : 'text-slate-400'}
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
                    className="w-full text-[10px] text-indigo-600 hover:text-indigo-800 font-medium text-center py-1 hover:bg-indigo-50 rounded transition-colors"
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
          
          <h2 className="text-lg font-semibold text-slate-900 ml-2">
            {getTitle()}
          </h2>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => handleViewModeChange('week')}
            className={`
              px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5
              ${viewMode === 'week' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
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
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
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
        <span className="font-medium text-slate-600">Chú thích:</span>
        {[
          { status: 'scheduled', label: 'Chưa học' },
          { status: 'in_progress', label: 'Đang học' },
          { status: 'overdue', label: 'Quá hạn' },
          { status: 'completed', label: 'Hoàn thành' },
          { status: 'cancelled', label: 'Đã hủy' }
        ].map(({ status, label }) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[status].dot}`} />
            <span className="text-slate-600">{label}</span>
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
