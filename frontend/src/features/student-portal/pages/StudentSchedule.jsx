/**
 * StudentSchedule Page - Trang lịch học của học viên
 * Features:
 * - Week/Month view với navigation
 * - Swipe gestures cho mobile
 * - Countdown timer cho buổi sắp bắt đầu
 * - Export calendar ra ICS
 * - Push notification nhắc trước 30 phút
 */
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSwipeable } from 'react-swipeable';
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
  AlertCircle,
  LayoutGrid,
  List,
  Download,
  Bell,
  BellOff,
  Timer
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
import { useStudentSchedule } from '../hooks/useStudentSchedule';
import { Badge } from '@/components/ui/badge';
import { gooeyToast } from 'goey-toast';

// Configuration
const DAYS_OF_WEEK = [
  { value: 2, label: 'Thứ 2', short: 'T2' },
  { value: 3, label: 'Thứ 3', short: 'T3' },
  { value: 4, label: 'Thứ 4', short: 'T4' },
  { value: 5, label: 'Thứ 5', short: 'T5' },
  { value: 6, label: 'Thứ 6', short: 'T6' },
  { value: 7, label: 'Thứ 7', short: 'T7' },
  { value: 8, label: 'CN', short: 'CN' }
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

const STATUS_CONFIG = {
  scheduled: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Sắp tới' },
  completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Đã học' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Đã hủy' },
  in_progress: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Đang học' }
};

// ============ ICS EXPORT UTILITY ============
const generateICSFile = (sessions, fileName = 'lich-hoc.ics') => {
  const formatICSDate = (dateStr, timeStr) => {
    const date = new Date(`${dateStr}T${timeStr}`);
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const escapeICS = (text) => {
    if (!text) return '';
    return text.replace(/[,;\\]/g, (match) => '\\' + match).replace(/\n/g, '\\n');
  };

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Skill Master//Student Schedule//VI',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Lịch học Skill Master',
    'X-WR-TIMEZONE:Asia/Ho_Chi_Minh'
  ];

  sessions.forEach((session, index) => {
    if (session.status === 'cancelled') return; // Skip cancelled sessions
    
    const uid = `${session.sessionId || index}@skillmaster.edu.vn`;
    const dtStart = formatICSDate(session.sessionDate, session.startTime);
    const dtEnd = formatICSDate(session.sessionDate, session.endTime);
    const summary = escapeICS(`${session.className} - Buổi ${session.sessionNumber || ''}`);
    const description = escapeICS(`Khóa học: ${session.courseName || 'N/A'}\\nGiáo viên: ${session.teacherName || 'N/A'}`);
    const location = escapeICS(session.roomName || '');

    icsContent.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      location ? `LOCATION:${location}` : '',
      'STATUS:CONFIRMED',
      // Alarm 30 minutes before
      'BEGIN:VALARM',
      'TRIGGER:-PT30M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Nhắc nhở: Buổi học sắp bắt đầu trong 30 phút',
      'END:VALARM',
      'END:VEVENT'
    );
  });

  icsContent.push('END:VCALENDAR');
  
  const blob = new Blob([icsContent.filter(Boolean).join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ============ NOTIFICATION UTILITY ============
const NOTIFICATION_KEY = 'schedule_notifications_enabled';
const NOTIFIED_SESSIONS_KEY = 'notified_session_ids';

const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    return { granted: false, reason: 'not_supported' };
  }
  
  if (Notification.permission === 'granted') {
    return { granted: true };
  }
  
  if (Notification.permission === 'denied') {
    return { granted: false, reason: 'denied' };
  }
  
  const permission = await Notification.requestPermission();
  return { granted: permission === 'granted', reason: permission };
};

const showNotification = (title, body, tag) => {
  if (Notification.permission !== 'granted') return;
  
  const notification = new Notification(title, {
    body,
    icon: '/favicon.ico',
    tag,
    requireInteraction: true
  });
  
  notification.onclick = () => {
    window.focus();
    notification.close();
  };
  
  // Auto close after 30 seconds
  setTimeout(() => notification.close(), 30000);
};

const getNotifiedSessions = () => {
  try {
    return JSON.parse(localStorage.getItem(NOTIFIED_SESSIONS_KEY) || '[]');
  } catch {
    return [];
  }
};

const markSessionNotified = (sessionId) => {
  const notified = getNotifiedSessions();
  if (!notified.includes(sessionId)) {
    notified.push(sessionId);
    // Keep only last 100 session IDs
    if (notified.length > 100) notified.shift();
    localStorage.setItem(NOTIFIED_SESSIONS_KEY, JSON.stringify(notified));
  }
};

// ============ COUNTDOWN HOOK ============
const useCountdown = (targetDate) => {
  const [timeLeft, setTimeLeft] = useState(null);
  
  useEffect(() => {
    if (!targetDate) return;
    
    const calculateTimeLeft = () => {
      const now = new Date();
      const target = new Date(targetDate);
      const diff = target - now;
      
      if (diff <= 0) return null;
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      return { hours, minutes, seconds, total: diff };
    };
    
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    
    return () => clearInterval(timer);
  }, [targetDate]);
  
  return timeLeft;
};

// Utils
const getCourseColor = (courseId) => {
  if (!courseId) return COURSE_COLORS[0];
  const str = String(courseId);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return COURSE_COLORS[Math.abs(hash) % COURSE_COLORS.length];
};

const formatTime = (time) => {
  if (!time) return '--:--';
  return time.slice(0, 5);
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
};

// ============ TIME SLOT GROUPING ============
const TIME_SLOTS = [
  { 
    key: 'morning', 
    label: 'Sáng', 
    icon: '🌅', 
    range: '06:00 - 12:00',
    startHour: 6, 
    endHour: 12,
    bg: 'bg-amber-50 dark:bg-amber-900/10',
    border: 'border-amber-200 dark:border-amber-800'
  },
  { 
    key: 'afternoon', 
    label: 'Chiều', 
    icon: '☀️', 
    range: '12:00 - 18:00',
    startHour: 12, 
    endHour: 18,
    bg: 'bg-orange-50 dark:bg-orange-900/10',
    border: 'border-orange-200 dark:border-orange-800'
  },
  { 
    key: 'evening', 
    label: 'Tối', 
    icon: '🌙', 
    range: '18:00 - 23:00',
    startHour: 18, 
    endHour: 23,
    bg: 'bg-indigo-50 dark:bg-indigo-900/10',
    border: 'border-indigo-200 dark:border-indigo-800'
  }
];

const getTimeSlot = (timeStr) => {
  if (!timeStr) return null;
  const hour = parseInt(timeStr.split(':')[0], 10);
  return TIME_SLOTS.find(slot => hour >= slot.startHour && hour < slot.endHour) || TIME_SLOTS[2];
};

const groupSessionsByTimeSlot = (sessions) => {
  const grouped = {
    morning: [],
    afternoon: [],
    evening: []
  };
  
  sessions.forEach(session => {
    const slot = getTimeSlot(session.startTime);
    if (slot) {
      grouped[slot.key].push(session);
    }
  });
  
  return grouped;
};

// Components
const CountdownBadge = ({ targetDateTime }) => {
  const timeLeft = useCountdown(targetDateTime);
  
  if (!timeLeft || timeLeft.total > 2 * 60 * 60 * 1000) return null; // Only show if within 2 hours
  
  const formatCountdown = () => {
    if (timeLeft.hours > 0) {
      return `Còn ${timeLeft.hours}h ${timeLeft.minutes}p`;
    }
    if (timeLeft.minutes > 0) {
      return `Còn ${timeLeft.minutes} phút`;
    }
    return `Còn ${timeLeft.seconds}s`;
  };
  
  return (
    <div className="flex items-center gap-1 text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full animate-pulse">
      <Timer className="h-3 w-3" />
      {formatCountdown()}
    </div>
  );
};

const ScheduleEvent = ({ event, onClick, isCompact = false }) => {
  const colorScheme = getCourseColor(event.courseId);
  const status = STATUS_CONFIG[event.status] || STATUS_CONFIG.scheduled;
  const eventDateTime = `${event.sessionDate}T${event.startTime}`;
  
  // Calculate if upcoming (within 2 hours)
  const isUpcoming = useMemo(() => {
    if (event.status !== 'scheduled') return false;
    const now = new Date();
    const eventStart = new Date(eventDateTime);
    const diff = eventStart - now;
    return diff > 0 && diff < 2 * 60 * 60 * 1000; // 2 hours
  }, [event, eventDateTime]);

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick(event); }}
      className={cn(
        'rounded-lg border-l-4 cursor-pointer transition-all relative',
        'hover:shadow-md hover:scale-[1.02]',
        isCompact ? 'p-1.5' : 'p-3',
        colorScheme.bg,
        colorScheme.border,
        isUpcoming && 'ring-2 ring-red-400 ring-offset-1 animate-pulse'
      )}
    >
      <div className={cn('font-medium truncate', isCompact ? 'text-xs' : 'text-sm', colorScheme.text)}>
        {event.className}
      </div>
      
      {!isCompact && (
        <>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-2 flex-wrap">
             <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 h-5 bg-white/50 border-0', status.text)}>
                {status.label}
             </Badge>
             {isUpcoming && <CountdownBadge targetDateTime={eventDateTime} />}
          </div>
        </>
      )}
      
      {isCompact && (
        <div className="text-[10px] text-muted-foreground mt-0.5">
        </div>
      )}
    </div>
  );
};

const ClassDetailModal = ({ isOpen, onClose, event }) => {
  if (!event) return null;
  
  const colorScheme = getCourseColor(event.courseId);
  const status = STATUS_CONFIG[event.status] || STATUS_CONFIG.scheduled;

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
            <div className="flex justify-between items-start">
              <h3 className={cn('font-semibold text-lg', colorScheme.text)}>
                {event.className}
              </h3>
              <span className={cn('text-xs px-2 py-1 rounded-full bg-white/80 font-medium', status.text)}>
                {status.label}
              </span>
            </div>
            {event.courseName && (
<p className="text-sm text-muted-foreground mt-1">{event.courseName}
</p>
            )}
            <p className="text-sm text-muted-foreground mt-2">Buổi số: {event.sessionNumber}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Thời gian</p>
                <p className="text-sm text-muted-foreground">{event.startTime} - {event.endTime}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Ngày học</p>
                <p className="text-sm text-muted-foreground">{event.dayOfWeek || event.date}</p>
              </div>
            </div>

            {event.roomName && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Phòng học</p>
                  <p className="text-sm text-muted-foreground">{event.roomName}</p>
                </div>
              </div>
            )}

            {event.teacherName && (
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Giáo viên</p>
                  <p className="text-sm text-muted-foreground">{event.teacherName}</p>
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
  const [viewType, setViewType] = useState('week'); // 'week' | 'month'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem(NOTIFICATION_KEY) === 'true';
  });

  // Navigation handlers
  const handlePrev = useCallback(() => {
    const newDate = new Date(currentDate);
    if (viewType === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  }, [currentDate, viewType]);

  const handleNext = useCallback(() => {
    const newDate = new Date(currentDate);
    if (viewType === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  }, [currentDate, viewType]);

  // Swipe handlers for mobile
  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleNext,
    onSwipedRight: handlePrev,
    trackMouse: false,
    trackTouch: true,
    delta: 50,
    preventScrollOnSwipe: true
  });

  // Calculate Start/End Date based on View Type
  const { startDate, endDate } = useMemo(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    if (viewType === 'week') {
      // Get Monday
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      
      // Get Sunday
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else {
      // First day of month
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      
      // Last day of month
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
      
      // Expand to cover full weeks for calendar grid (start on Monday)
      const startDay = start.getDay(); // 0=Sun, 1=Mon...
      const prevDays = startDay === 0 ? 6 : startDay - 1;
      start.setDate(start.getDate() - prevDays);
      
      // Expand end to finish week (end on Sunday)
      const endDay = end.getDay();
      const nextDays = endDay === 0 ? 0 : 7 - endDay;
      end.setDate(end.getDate() + nextDays);
    }

    return { startDate: start, endDate: end };
  }, [currentDate, viewType]);

  const { sessions, classes, statistics, loading, error, refresh } = useStudentSchedule({
    classId: classFilter,
    startDate,
    endDate,
    viewType
  });

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Toggle notifications
  const handleToggleNotifications = async () => {
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
      localStorage.setItem(NOTIFICATION_KEY, 'false');
      gooeyToast.info('Đã tắt thông báo nhắc lịch học');
    } else {
      const result = await requestNotificationPermission();
      if (result.granted) {
        setNotificationsEnabled(true);
        localStorage.setItem(NOTIFICATION_KEY, 'true');
        gooeyToast.success('Đã bật thông báo! Bạn sẽ được nhắc trước 30 phút mỗi buổi học.');
      } else if (result.reason === 'denied') {
        gooeyToast.error('Trình duyệt đã chặn thông báo. Vui lòng cho phép trong cài đặt.', {
          description: 'Cho phép thông báo trong cài đặt trình duyệt để nhận lịch học',
          action: {
            label: 'Hướng dẫn',
            onClick: () => window.open('https://support.google.com/chrome/answer/3220216', '_blank')
          }
        });
      } else {
        gooeyToast.error('Trình duyệt không hỗ trợ thông báo.');
      }
    }
  };

  // Export ICS handler
  const handleExportICS = () => {
    if (!sessions || sessions.length === 0) {
      gooeyToast.error('Không có lịch học để xuất');
      return;
    }
    const fileName = `lich-hoc-${currentDate.toISOString().split('T')[0]}.ics`;
    generateICSFile(sessions, fileName);
    gooeyToast.success('Đã tải file lịch học (.ics)');
  };

  // Notification effect - check sessions every minute
  useEffect(() => {
    if (!notificationsEnabled || !sessions?.length) return;

    const checkUpcomingSessions = () => {
      const now = new Date();
      const notifiedIds = getNotifiedSessions();

      sessions.forEach(session => {
        if (session.status !== 'scheduled') return;
        if (notifiedIds.includes(session.sessionId)) return;

        const sessionStart = new Date(`${session.sessionDate}T${session.startTime}`);
        const diffMinutes = (sessionStart - now) / (1000 * 60);

        // Notify if session starts in 25-35 minutes (targeting ~30 min)
        if (diffMinutes > 25 && diffMinutes <= 35) {
          showNotification(
            `🔔 Sắp đến giờ học!`,
            `${session.className} bắt đầu lúc ${formatTime(session.startTime)}${session.roomName ? ` tại ${session.roomName}` : ''}`,
            `session-${session.sessionId}`
          );
          markSessionNotified(session.sessionId);
        }
      });
    };

    // Check immediately and then every minute
    checkUpcomingSessions();
    const interval = setInterval(checkUpcomingSessions, 60000);
    return () => clearInterval(interval);
  }, [notificationsEnabled, sessions]);

  const formatRange = () => {
    if (viewType === 'week') {
      // Re-calculate actual week start/end for display (not including padding)
      const d = new Date(currentDate);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const start = new Date(d);
      start.setDate(diff);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      
      return `${start.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} - ${end.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
    }
  };

  // Group sessions by date string YYYY-MM-DD
  const sessionsByDate = useMemo(() => {
    const grouped = {};
    sessions.forEach(session => {
      // session.sessionDate is YYYY-MM-DD
      const dateKey = session.sessionDate.split('T')[0];
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(session);
    });
    return grouped;
  }, [sessions]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days = [];
    const curr = new Date(startDate);
    while (curr <= endDate) {
      days.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
    }
    return days;
  }, [startDate, endDate]);

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isCurrentMonth = (date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setDetailModalOpen(true);
  };

  if (loading && !sessions.length) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Đang tải lịch học...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lịch học của tôi</h1>
          <div className="flex items-center gap-2 mt-1">
             <span className="text-sm text-muted-foreground">
               {statistics.totalSessions || 0} buổi học
             </span>
             <span className="text-muted-foreground/30">|</span>
             <span className="text-sm text-muted-foreground">
               {statistics.upcomingSessions || 0} sắp tới
             </span>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center bg-muted p-1 rounded-lg border border-border">
            <Button
               variant={viewType === 'week' ? 'white' : 'ghost'}
               size="sm"
               className={cn("h-8", viewType === 'week' && "shadow-sm bg-white")}
            >
               <LayoutGrid className="w-4 h-4 mr-2" />
               Tuần
             </Button>
             <Button
               variant={viewType === 'month' ? 'white' : 'ghost'}
               size="sm"
               className={cn("h-8", viewType === 'month' && "shadow-sm bg-white")}
             >
               <Calendar className="w-4 h-4 mr-2" />
               Tháng
             </Button>
          </div>

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
          
          <div className="flex items-center gap-1">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleExportICS} 
              title="Xuất file lịch (.ics)"
              disabled={!sessions?.length}
            >
              <Download className="h-4 w-4" />
            </Button>
            
            <Button 
              variant={notificationsEnabled ? "default" : "outline"}
              size="icon" 
              onClick={handleToggleNotifications} 
              title={notificationsEnabled ? "Tắt thông báo" : "Bật thông báo nhắc lịch"}
              className={notificationsEnabled ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {notificationsEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            </Button>
            
            <Button variant="outline" size="icon" onClick={refresh} title="Làm mới">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handlePrev}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold capitalize text-foreground">
              {currentDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
            </h2>
            {!isToday(currentDate) && (
              <Button variant="outline" size="xs" onClick={handleToday} className="h-7 text-xs">
                Hôm nay
              </Button>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={handleNext}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>

      {/* Views - Swipeable */}
      <div 
        {...swipeHandlers}
        className="bg-white rounded-xl border border-border overflow-hidden shadow-sm touch-pan-y"
      >
        <div className="sm:hidden text-center text-xs text-muted-foreground py-1 bg-slate-50 border-b border-border">
        </div>
        
        {/* Header Grid */}
        <div className={cn(
          "grid grid-cols-7 border-b border-border bg-slate-50",
        )}>
          {DAYS_OF_WEEK.map((day) => (
            <div key={day.value} className="p-3 text-center border-r border-border last:border-r-0">
              <span className="hidden sm:inline text-sm font-medium text-muted-foreground">{day.label}</span>
              <span className="sm:hidden text-sm font-medium text-muted-foreground">{day.short}</span>
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className={cn(
           "grid",
           viewType === 'month' ? "grid-cols-7 auto-rows-[minmax(100px,auto)]" : "grid-cols-1 sm:grid-cols-7 min-h-[500px]"
        )}>
          {calendarDays.map((date, index) => {
            const dateKey = date.toISOString().split('T')[0];
            const daySessions = sessionsByDate[dateKey] || [];
            const isDayToday = isToday(date);
            const isCurrMonth = isCurrentMonth(date);
            const dayValue = date.getDay() === 0 ? 8 : date.getDay() + 1;
            const dayLabel = DAYS_OF_WEEK.find(d => d.value === dayValue)?.label;
            
            return (
               <div
                 key={dateKey}
                 className={cn(
                   "border-r border-b border-border p-2 relative transition-colors",
                   viewType === 'week' && "sm:border-r last:border-r-0",
                   isDayToday && "bg-blue-50/30 dark:bg-blue-900/10",
                   !isCurrMonth && viewType === 'month' && "bg-muted/30 text-muted-foreground"
                 )}
               >
                 {/* Mobile Day Header (Week View only) */}
                 <div className={cn(
                   "sm:hidden font-medium mb-3 flex items-center gap-2 pb-2 border-b border-border",
                 )}>
                   <div className={cn(
                     "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                     isDayToday ? "bg-blue-600 text-white" : "bg-muted text-foreground"
                   )}>
                     {date.getDate()}
                   </div>
                   <div className="flex flex-col">
                     <span className="text-sm font-semibold text-foreground">{dayLabel}</span>
                   </div>
                 </div>

                 {/* Desktop/Month Date Header */}
                 <div className={cn(
                   "flex items-center justify-between mb-2",
                   viewType === 'week' && "hidden sm:flex"
                 )}>
                   <span className={cn(
                     "text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full",
                     isDayToday 

                       ? "bg-blue-600 text-white" 

                       : isCurrMonth ? "text-foreground" : "text-muted-foreground"
                   )}>
                     {date.getDate()}
                   </span>
                   {daySessions.length > 0 && (
                     <span className="text-xs text-muted-foreground font-medium">{daySessions.length}</span>
                   )}
                 </div>
                 
                  <div className="space-y-2 pl-2 sm:pl-0">
                    {daySessions.length > 0 ? (
                      viewType === 'week' ? (
                        // Week view: Group by time slots (Sáng/Chiều/Tối)
                        <>
                          {(() => {
                            const grouped = groupSessionsByTimeSlot(daySessions);
                            return TIME_SLOTS.map(slot => {
                              const slotSessions = grouped[slot.key];
                              if (slotSessions.length === 0) return null;
                              
                              return (
                                <div key={slot.key} className={cn("rounded-lg p-1.5 border", slot.bg, slot.border)}>
                                  <div className="flex items-center gap-1.5 mb-1.5 px-1">
                                    <span className="text-sm">{slot.icon}</span>
                                    <span className="text-xs font-medium text-muted-foreground">
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                    </span>
                                  </div>
                                  <div className="space-y-1">
                                    {slotSessions.map((session) => (
                                      <ScheduleEvent 
                                        key={session.sessionId} 
                                        event={session} 
                                        onClick={handleEventClick}
                                        isCompact={false}
                                      />
                                    ))}
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </>
                      ) : (
                        // Month view: Compact, no grouping
                        daySessions.map((session) => (
                          <ScheduleEvent 
                            key={session.sessionId} 
                            event={session} 
                            onClick={handleEventClick}
                            isCompact={true}
                          />
                        ))
                      )
                    ) : (
                      viewType === 'week' && (
                        <div className="h-full flex items-center justify-center sm:pt-10 text-muted-foreground/50 text-xs italic py-4 sm:py-0">
                           <span className="hidden sm:inline">Trống</span>
                        </div>
                      )
                    )}
                  </div>
               </div>
            );
          })}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-sm p-4 bg-slate-50 rounded-lg">
        <span className="font-medium text-foreground">Trạng thái:</span>
        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
          <div key={key} className="flex items-center gap-2">
            <span className={cn("w-3 h-3 rounded-full", config.bg.replace('bg-', 'bg-').replace('100', '500'))}></span>
            <span className="text-muted-foreground">{config.label}</span>
          </div>
        ))}
      </div>

      <ClassDetailModal
        isOpen={detailModalOpen}
        onClose={setDetailModalOpen}
        event={selectedEvent}
      />
    </div>
  );
}

export default StudentSchedule;
