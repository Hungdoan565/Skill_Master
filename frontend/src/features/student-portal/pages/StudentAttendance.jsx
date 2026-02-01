/**
 * StudentAttendance Page - Trang xem điểm danh cho học viên
 * Redesigned with Calendar Heatmap + Hybrid layout
 */

import { useState } from 'react';
import { useStudentAttendance } from '../hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CalendarCheck,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  BookOpen,
  Calendar as CalendarIcon,
  Percent,
  FileText,
  ChevronDown,
  ChevronUp,
  Filter,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  format,
  subWeeks,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isAfter,
  isToday,
  startOfDay,
  addWeeks
} from 'date-fns';
import { vi } from 'date-fns/locale';

// Configuration for status colors and labels
const STATUS_CONFIG = {
  present: { 
    label: 'Có mặt', 
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    dotColor: 'bg-green-500 dark:bg-green-600',
    borderColor: 'border-green-200 dark:border-green-800'
  },
  absent: { 
    label: 'Vắng mặt', 
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    dotColor: 'bg-red-500 dark:bg-red-600',
    borderColor: 'border-red-200 dark:border-red-800'
  },
  late: { 
    label: 'Đi trễ', 
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    dotColor: 'bg-amber-500 dark:bg-amber-600',
    borderColor: 'border-amber-200 dark:border-amber-800'
  },
  excused: { 
    label: 'Có phép', 
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    dotColor: 'bg-blue-500 dark:bg-blue-600',
    borderColor: 'border-blue-200 dark:border-blue-800'
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Compact Stat Card Component
function CompactStatCard({ icon: Icon, label, value, color = 'default' }) {
  const colorStyles = {
    default: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
  };

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
        <div className={cn('p-2 rounded-full mb-2', colorStyles[color])}>
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}

// Status Badge Component
function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.absent;
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider', config.color)}>
      {config.label}
    </span>
  );
}

// Class Summary Chip Component
function ClassSummaryChip({ summary }) {
  const rate = typeof summary.attendanceRate === 'number' 
    ? summary.attendanceRate.toFixed(0) 
    : (summary.attendanceRate || 0);
    
  let colorClass = 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  if (rate >= 80) colorClass = 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
  else if (rate >= 60) colorClass = 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
  else colorClass = 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';

  return (
    <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium whitespace-nowrap', colorClass)}>
      <BookOpen className="h-3.5 w-3.5" />
      <span>{summary.className}</span>
      <span className="font-bold border-l border-current/20 pl-2">{rate}%</span>
    </div>
  );
}

// Calendar Heatmap Component
function AttendanceHeatmap({ records }) {
  const today = startOfDay(new Date());
  // Generate last 5 weeks
  const endDate = endOfWeek(today, { weekStartsOn: 1 });
  const startDate = subWeeks(startOfWeek(today, { weekStartsOn: 1 }), 4);
  
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  // Helper to get status for a day
  const getStatusForDay = (date) => {
    // Check if future
    if (isAfter(date, today)) return 'future';

    // Find records
    const dayRecords = records.filter(r => isSameDay(new Date(r.session_date), date));
    if (dayRecords.length === 0) return 'none';

    // Priority: Absent > Late > Excused > Present
    if (dayRecords.some(r => r.status === 'absent')) return 'absent';
    if (dayRecords.some(r => r.status === 'late')) return 'late';
    if (dayRecords.some(r => r.status === 'excused')) return 'excused';
    return 'present';
  };

  return (
    <Card className="overflow-hidden border-none shadow-none bg-transparent sm:bg-card sm:border sm:shadow-sm">
      <CardHeader className="px-0 sm:px-6 pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          Biểu đồ chuyên cần
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        <div className="w-full overflow-x-auto pb-2">
          <div className="min-w-[300px]">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2 text-center">
              {weekDays.map(day => (
                <div key={day} className="text-xs text-muted-foreground font-medium">{day}</div>
              ))}
            </div>
            
            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, idx) => {
                const status = getStatusForDay(day);
                const isDayToday = isToday(day);
                const dateNum = format(day, 'd');
                
                let dotClass = '';
                
                if (status === 'future') {
                  dotClass = 'bg-transparent border-2 border-dashed border-gray-200 dark:border-gray-700';
                } else if (status === 'none') {
                  dotClass = 'bg-gray-100 dark:bg-gray-800'; // Empty/No Class
                } else {
                  dotClass = STATUS_CONFIG[status]?.dotColor || 'bg-gray-300';
                }

                return (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <div 
                      className={cn(
                        "h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center transition-all relative group",
                        dotClass,
                        isDayToday && "ring-2 ring-offset-2 ring-primary dark:ring-offset-background"
                      )}
                      title={`${format(day, 'dd/MM/yyyy')}${status !== 'none' && status !== 'future' ? `: ${STATUS_CONFIG[status]?.label}` : ''}`}
                    >
                      {/* For none/future, show date number nicely */}
                      {(status === 'none' || status === 'future') && (
                        <span className="text-[10px] text-gray-400 font-medium">{dateNum}</span>
                      )}
                      {/* For statuses, show check/x or just color */}
                      {status === 'present' && <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white opacity-90" />}
                      {status === 'absent' && <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white opacity-90" />}
                      {status === 'late' && <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-white opacity-90" />}
                      {status === 'excused' && <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-white opacity-90" />}
                    
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 whitespace-nowrap bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-md border">
                        {format(day, 'dd/MM')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-4 pt-4 border-t border-border/50">
          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
            <div key={key} className="flex items-center gap-2">
              <div className={cn("h-3 w-3 rounded-full", config.dotColor)} />
              <span className="text-xs text-muted-foreground">{config.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700" />
            <span className="text-xs text-muted-foreground">Không học</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Attendance History Table
function HistoryTable({ records }) {
  const [expanded, setExpanded] = useState(false);
  const displayRecords = expanded ? records : records.slice(0, 10);

  if (records.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground bg-muted/20 rounded-lg">
        <Clock className="h-10 w-10 mx-auto mb-3 opacity-20" />
        <p>Chưa có dữ liệu điểm danh</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-medium">
              <tr>
                <th className="px-4 py-3">Ngày</th>
                <th className="px-4 py-3">Lớp học</th>
                <th className="px-4 py-3 text-center">Trạng thái</th>
                <th className="px-4 py-3">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {displayRecords.map((record) => (
                <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium whitespace-nowrap text-foreground">
                    {formatDate(record.session_date)}
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {record.class_name}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={record.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate" title={record.notes || ''}>
                    {record.notes || '--'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {records.length > 10 && (
        <div className="flex justify-center">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-sm text-primary font-medium hover:underline p-2"
          >
            {expanded ? (
              <>Thu gọn <ChevronUp className="h-4 w-4" /></>
            ) : (
              <>Xem tất cả ({records.length}) <ChevronDown className="h-4 w-4" /></>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export function StudentAttendance() {
  const { records, classSummaries, statistics, loading, error, refresh } = useStudentAttendance();
  const [classFilter, setClassFilter] = useState('all');

  // Filter logic
  const filteredRecords = classFilter && classFilter !== 'all'
    ? records.filter(r => r.class_id === classFilter)
    : records;

  const filteredSummaries = classFilter && classFilter !== 'all'
    ? classSummaries.filter(cs => cs.classId === classFilter)
    : classSummaries;

  // Derive unique classes for filter
  const uniqueClasses = classSummaries.map(cs => ({
    id: cs.classId,
    name: cs.className
  }));

  const stats = statistics || {};

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        <p className="text-muted-foreground text-sm animate-pulse">Đang tải dữ liệu điểm danh...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="text-center p-6 bg-destructive/5 rounded-xl border border-destructive/20 max-w-md w-full">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-destructive mb-2">Đã có lỗi xảy ra</h2>
          <p className="text-muted-foreground text-sm mb-6">{error}</p>
          <button
            onClick={refresh}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors w-full font-medium"
          >
            <RefreshCw className="h-4 w-4" />
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* 1. Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Điểm danh</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Theo dõi chuyên cần và lịch sử điểm danh của bạn
          </p>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-full md:w-[220px] bg-background">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Tất cả lớp học" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả lớp học</SelectItem>
              {uniqueClasses.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <button
            onClick={refresh}
            className="p-2.5 rounded-lg border bg-background hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 2. Class Summaries Bar (Chips) */}
      {classSummaries.length > 0 && (
        <div className="flex flex-wrap gap-3 pb-2">
          {filteredSummaries.map(summary => (
            <ClassSummaryChip key={summary.classId} summary={summary} />
          ))}
        </div>
      )}

      {/* 3. Compact Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <CompactStatCard
          icon={CalendarCheck}
          label="Tổng số buổi"
          value={stats.totalSessions || 0}
        />
        <CompactStatCard
          icon={CheckCircle}
          label="Có mặt"
          value={stats.presentCount || 0}
          color="green"
        />
        <CompactStatCard
          icon={XCircle}
          label="Vắng mặt"
          value={stats.absentCount || 0}
          color="red"
        />
        <CompactStatCard
          icon={Percent}
          label="Tỷ lệ chuyên cần"
          value={`${typeof stats.attendanceRate === 'number' ? stats.attendanceRate.toFixed(0) : (stats.attendanceRate || 0)}%`}
          color="blue"
        />
      </div>

      {/* 4. Calendar Heatmap */}
      <AttendanceHeatmap records={filteredRecords} />

      {/* 5. Recent History Table */}
      <Card>
        <CardHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Lịch sử gần đây
            </CardTitle>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              {filteredRecords.length} bản ghi
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <HistoryTable records={filteredRecords} />
        </CardContent>
      </Card>
    </div>
  );
}

export default StudentAttendance;
