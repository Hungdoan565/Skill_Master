/**
 * ClassCalendarView Component
 * A simplified calendar view specifically for Class Detail page
 * Adapted from the global CalendarView component
 */

import { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Constants
const DAYS_OF_WEEK = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const MONTHS = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
                'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

// Status configuration
const STATUS_CONFIG = {
  scheduled: {
    bg: 'bg-blue-100 hover:bg-blue-200',
    border: 'border-l-blue-500',
    text: 'text-blue-700',
    dot: 'bg-blue-500'
  },
  upcoming: {
    bg: 'bg-blue-100 hover:bg-blue-200',
    border: 'border-l-blue-500',
    text: 'text-blue-700',
    dot: 'bg-blue-500'
  },
  today: {
    bg: 'bg-amber-100 hover:bg-amber-200',
    border: 'border-l-amber-500',
    text: 'text-amber-700',
    dot: 'bg-amber-500 animate-pulse'
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

// Helper functions
const formatDateKey = (date) => {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

const getMonthDates = (year, month) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

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

const formatTime = (time) => time?.substring(0, 5) || '';

// Session Card Component
function SessionCard({ session, onClick }) {
  const status = session.status || 'scheduled';
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.scheduled;

  return (
    <button
      onClick={() => onClick?.(session)}
      className={`
        w-full text-left p-1.5 rounded text-xs border-l-2 mb-1 transition-colors
        ${config.bg} ${config.border}
      `}
    >
      <div className="flex items-center gap-1">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
        <span className={`font-medium truncate ${config.text}`}>
          #{session.session_number}
        </span>
        {session.is_marked && (
          <CheckCircle className="w-3 h-3 text-green-600 ml-auto shrink-0" />
        )}
      </div>
      <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
        <Clock className="w-2.5 h-2.5" />
        {formatTime(session.start_time)}
      </div>
    </button>
  );
}

export function ClassCalendarView({
  sessions = [],
  onSessionClick
}) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Navigation
  const navigate = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get calendar dates
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

  // Stats
  const stats = useMemo(() => {
    const total = sessions.length;
    const completed = sessions.filter(s => s.status === 'completed').length;
    const cancelled = sessions.filter(s => s.status === 'cancelled').length;
    const marked = sessions.filter(s => s.is_marked).length;
    return { total, completed, cancelled, marked };
  }, [sessions]);

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Hôm nay
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <h2 className="text-lg font-semibold text-slate-900 ml-2">
            {MONTHS[month]} {year}
          </h2>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-slate-600">{stats.completed}/{stats.total} hoàn thành</span>
          </div>
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-slate-600">{stats.marked} đã điểm danh</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Header - Days of week */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
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
                  min-h-[100px] p-1.5 border-b border-r border-slate-100 
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
                <div className="space-y-0.5 max-h-16 overflow-y-auto">
                  {daySessions.slice(0, 2).map(session => (
                    <SessionCard
                      key={session.id || session.session_number}
                      session={session}
                      onClick={onSessionClick}
                    />
                  ))}
                  {daySessions.length > 2 && (
                    <div className="text-[10px] text-slate-500 text-center">
                      +{daySessions.length - 2} buổi khác
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <span className="font-medium text-slate-600">Chú thích:</span>
        {[
          { status: 'scheduled', label: 'Sắp tới' },
          { status: 'today', label: 'Đang diễn ra' },
          { status: 'completed', label: 'Đã hoàn thành' },
          { status: 'cancelled', label: 'Đã hủy' }
        ].map(({ status, label }) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[status].dot}`} />
            <span className="text-slate-600">{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <CheckCircle className="w-3 h-3 text-green-600" />
          <span className="text-slate-600">Đã điểm danh</span>
        </div>
      </div>
    </div>
  );
}

export default ClassCalendarView;
