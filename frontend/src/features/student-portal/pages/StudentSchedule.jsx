/**
 * StudentSchedule Page - Trang lịch học của học viên
 */
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  MapPin,
  User,
  BookOpen,
  X,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useStudentSchedule } from '../hooks';

const DAYS_OF_WEEK = [
  { value: 2, label: 'Thứ 2' },
  { value: 3, label: 'Thứ 3' },
  { value: 4, label: 'Thứ 4' },
  { value: 5, label: 'Thứ 5' },
  { value: 6, label: 'Thứ 6' },
  { value: 7, label: 'Thứ 7' },
  { value: 8, label: 'CN' }
];

const COURSE_COLORS = [
  { bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-l-blue-500', text: 'text-blue-700 dark:text-blue-300' },
  { bg: 'bg-emerald-100 dark:bg-emerald-900/30', border: 'border-l-emerald-500', text: 'text-emerald-700 dark:text-emerald-300' },
  { bg: 'bg-purple-100 dark:bg-purple-900/30', border: 'border-l-purple-500', text: 'text-purple-700 dark:text-purple-300' },
  { bg: 'bg-amber-100 dark:bg-amber-900/30', border: 'border-l-amber-500', text: 'text-amber-700 dark:text-amber-300' },
  { bg: 'bg-rose-100 dark:bg-rose-900/30', border: 'border-l-rose-500', text: 'text-rose-700 dark:text-rose-300' },
  { bg: 'bg-cyan-100 dark:bg-cyan-900/30', border: 'border-l-cyan-500', text: 'text-cyan-700 dark:text-cyan-300' },
  { bg: 'bg-indigo-100 dark:bg-indigo-900/30', border: 'border-l-indigo-500', text: 'text-indigo-700 dark:text-indigo-300' },
  { bg: 'bg-orange-100 dark:bg-orange-900/30', border: 'border-l-orange-500', text: 'text-orange-700 dark:text-orange-300' },
];

const getCourseColor = (courseId) => {
  if (!courseId) return COURSE_COLORS[0];
  const index = typeof courseId === 'string' 
    ? courseId.charCodeAt(0) % COURSE_COLORS.length 
    : courseId % COURSE_COLORS.length;
  return COURSE_COLORS[index];
};

const formatTime = (time) => {
  if (!time) return '--:--';
  return time.slice(0, 5);
};

const ScheduleEvent = ({ event, onClick }) => {
  const colorScheme = getCourseColor(event.courseId);
  
  return (
    <div
      onClick={() => onClick(event)}
      className={cn(
        'rounded-lg border-l-4 p-3 cursor-pointer transition-all',
        'hover:shadow-md hover:scale-[1.02]',
        colorScheme.bg,
        colorScheme.border
      )}
    >
      <div className={cn('font-medium text-sm truncate', colorScheme.text)}>
        {event.className}
      </div>
      <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 mt-1">
        <Clock className="h-3 w-3" />
        <span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
      </div>
      {event.roomName && (
        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
          <MapPin className="h-3 w-3" />
          <span className="truncate">{event.roomName}</span>
        </div>
      )}
      {event.teacherName && (
        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
          <User className="h-3 w-3" />
          <span className="truncate">{event.teacherName}</span>
        </div>
      )}
    </div>
  );
};

const ClassDetailModal = ({ isOpen, onClose, event }) => {
  if (!event) return null;
  
  const colorScheme = getCourseColor(event.courseId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Chi tiết buổi học
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div className={cn('p-4 rounded-lg border-l-4', colorScheme.bg, colorScheme.border)}>
            <h3 className={cn('font-semibold text-lg', colorScheme.text)}>
              {event.className}
            </h3>
            {event.courseName && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {event.courseName}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Thời gian</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {formatTime(event.startTime)} - {formatTime(event.endTime)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Ngày học</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {DAYS_OF_WEEK.find(d => d.value === event.dayOfWeek)?.label || `Thứ ${event.dayOfWeek}`}
                </p>
              </div>
            </div>

            {event.roomName && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Phòng học</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{event.roomName}</p>
                </div>
              </div>
            )}

            {event.teacherName && (
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Giáo viên</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{event.teacherName}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={() => onClose(false)}>
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export function StudentSchedule() {
  const [classFilter, setClassFilter] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  const { events, classes, loading, error, refresh } = useStudentSchedule(classFilter !== 'all' ? classFilter : null);

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    if (!classFilter || classFilter === 'all') return events;
    return events.filter(e => e.classId === classFilter);
  }, [events, classFilter]);

  const eventsByDay = useMemo(() => {
    const grouped = {};
    DAYS_OF_WEEK.forEach(day => {
      grouped[day.value] = filteredEvents.filter(e => e.dayOfWeek === day.value);
    });
    return grouped;
  }, [filteredEvents]);

  const weekEnd = useMemo(() => {
    const end = new Date(currentWeekStart);
    end.setDate(currentWeekStart.getDate() + 6);
    return end;
  }, [currentWeekStart]);

  const goToPrevWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const goToNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  const goToThisWeek = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(monday);
  };

  const formatWeekRange = () => {
    const start = currentWeekStart.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    const end = weekEnd.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${start} - ${end}`;
  };

  const getDateForDay = (dayIndex) => {
    const date = new Date(currentWeekStart);
    date.setDate(currentWeekStart.getDate() + dayIndex);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  const isToday = (dayIndex) => {
    const date = new Date(currentWeekStart);
    date.setDate(currentWeekStart.getDate() + dayIndex);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setDetailModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Đang tải lịch học...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center p-6 bg-red-50 dark:bg-red-900/20 rounded-xl max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">Đã có lỗi xảy ra</h2>
          <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
          <Button onClick={refresh} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            📅 Lịch học
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Xem lịch học theo tuần
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tất cả lớp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả lớp</SelectItem>
              {classes?.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="outline" size="icon" onClick={goToPrevWeek} title="Tuần trước">
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <Button variant="ghost" onClick={goToThisWeek} className="text-blue-600 dark:text-blue-400">
          Tuần này
        </Button>

        <div className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 min-w-[180px] text-center">
          {formatWeekRange()}
        </div>

        <Button variant="outline" size="icon" onClick={goToNextWeek} title="Tuần sau">
          <ChevronRight className="h-5 w-5" />
        </Button>

        <Button variant="outline" size="icon" onClick={refresh} title="Làm mới">
          <RefreshCw className="h-5 w-5" />
        </Button>
      </div>

      {/* Week Timetable */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          {DAYS_OF_WEEK.map((day, index) => (
            <div
              key={day.value}
              className={cn(
                'p-3 text-center border-r border-slate-200 dark:border-slate-700 last:border-r-0',
                isToday(index) && 'bg-blue-50 dark:bg-blue-900/20'
              )}
            >
              <p className={cn(
                'text-xs font-medium',
                isToday(index) ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'
              )}>
                {day.label}
              </p>
              <p className={cn(
                'text-sm font-semibold mt-1',
                isToday(index) ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'
              )}>
                {getDateForDay(index)}
              </p>
              {isToday(index) && (
                <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-blue-600 text-white rounded-full">
                  Hôm nay
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Schedule grid */}
        <div className="grid grid-cols-7 min-h-[400px]">
          {DAYS_OF_WEEK.map((day, index) => (
            <div
              key={day.value}
              className={cn(
                'border-r border-slate-200 dark:border-slate-700 last:border-r-0 p-2 space-y-2',
                isToday(index) && 'bg-blue-50/30 dark:bg-blue-900/10'
              )}
            >
              {eventsByDay[day.value]?.length === 0 ? (
                <div className="h-full min-h-[100px] flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
                  <span className="hidden sm:inline">Không có lịch</span>
                  <span className="sm:hidden">—</span>
                </div>
              ) : (
                eventsByDay[day.value]?.map((event, idx) => (
                  <ScheduleEvent
                    key={event.classId || idx}
                    event={event}
                    onClick={handleEventClick}
                  />
                ))
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-600 dark:text-slate-400">
        <span className="text-slate-500 dark:text-slate-400">Màu theo khóa học:</span>
        {COURSE_COLORS.slice(0, 4).map((color, idx) => (
          <span key={idx} className="flex items-center gap-2">
            <span className={cn('w-4 h-4 rounded border-l-4', color.bg, color.border)}></span>
          </span>
        ))}
      </div>

      {/* Class Detail Modal */}
      <ClassDetailModal
        isOpen={detailModalOpen}
        onClose={setDetailModalOpen}
        event={selectedEvent}
      />
    </div>
  );
}

export default StudentSchedule;

