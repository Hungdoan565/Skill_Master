/**
 * StudentAttendance Page - Trang xem điểm danh cho học viên
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
  Calendar,
  Percent,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  present: { label: 'Có mặt', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  absent: { label: 'Vắng mặt', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  late: { label: 'Đi trễ', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  excused: { label: 'Có phép', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' }
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

function StatCard({ icon: Icon, label, value, color = 'default' }) {
  const colorStyles = {
    default: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={cn('p-3 rounded-xl', colorStyles[color])}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.absent;
  return (
    <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', config.color)}>
      {config.label}
    </span>
  );
}

function AttendanceRecord({ record }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="p-2 rounded-lg bg-muted">
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{record.class_name}</p>
          <p className="text-sm text-muted-foreground">{formatDate(record.session_date)}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <StatusBadge status={record.status} />
        {record.notes && (
          <span className="text-xs text-muted-foreground max-w-[120px] truncate" title={record.notes}>
            <FileText className="h-3 w-3 inline mr-1" />
            {record.notes}
          </span>
        )}
      </div>
    </div>
  );
}

function ClassSummaryCard({ summary }) {
  const rateColor = summary.attendanceRate >= 80 ? 'text-green-600 dark:text-green-400' :
                    summary.attendanceRate >= 60 ? 'text-amber-600 dark:text-amber-400' :
                    'text-red-600 dark:text-red-400';

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b bg-muted/30">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold">{summary.className}</h3>
              <p className="text-sm text-muted-foreground">
                {summary.presentCount}/{summary.totalSessions} buổi có mặt
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className={cn('text-2xl font-bold', rateColor)}>
              {typeof summary.attendanceRate === 'number' ? summary.attendanceRate.toFixed(0) : (summary.attendanceRate || 0)}%
            </div>
            <div className="text-sm text-muted-foreground">Tỷ lệ</div>
          </div>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="grid grid-cols-4 gap-2 text-center text-sm">
          <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
            <p className="font-semibold text-green-600 dark:text-green-400">{summary.presentCount || 0}</p>
            <p className="text-xs text-muted-foreground">Có mặt</p>
          </div>
          <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
            <p className="font-semibold text-red-600 dark:text-red-400">{summary.absentCount || 0}</p>
            <p className="text-xs text-muted-foreground">Vắng</p>
          </div>
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
            <p className="font-semibold text-amber-600 dark:text-amber-400">{summary.lateCount || 0}</p>
            <p className="text-xs text-muted-foreground">Trễ</p>
          </div>
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <p className="font-semibold text-blue-600 dark:text-blue-400">{summary.excusedCount || 0}</p>
            <p className="text-xs text-muted-foreground">Có phép</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <CalendarCheck className="h-16 w-16 mb-4 opacity-30" />
      <h3 className="text-lg font-medium mb-2">Chưa có dữ liệu điểm danh</h3>
      <p className="text-sm">Dữ liệu sẽ hiển thị khi có buổi học được điểm danh</p>
    </div>
  );
}

export function StudentAttendance() {
  const { records, classSummaries, statistics, loading, error, refresh } = useStudentAttendance();
  const [classFilter, setClassFilter] = useState('all');

  const filteredRecords = classFilter && classFilter !== 'all'
    ? records.filter(r => r.class_id === classFilter)
    : records;

  const filteredSummaries = classFilter && classFilter !== 'all'
    ? classSummaries.filter(cs => cs.classId === classFilter)
    : classSummaries;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Đang tải điểm danh...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center p-6 bg-destructive/10 rounded-xl max-w-md">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-destructive mb-2">Đã có lỗi xảy ra</h2>
          <p className="text-destructive/80 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="inline-flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const uniqueClasses = classSummaries.map(cs => ({
    id: cs.classId,
    name: cs.className
  }));

  const stats = statistics || {};

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Điểm danh</h1>
          <p className="text-muted-foreground">Theo dõi tình hình chuyên cần của bạn</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tất cả lớp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả lớp</SelectItem>
              {uniqueClasses.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            onClick={refresh}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={CalendarCheck}
          label="Tổng số buổi"
          value={stats.totalSessions || 0}
        />
        <StatCard
          icon={CheckCircle}
          label="Có mặt"
          value={stats.presentCount || 0}
          color="green"
        />
        <StatCard
          icon={XCircle}
          label="Vắng mặt"
          value={stats.absentCount || 0}
          color="red"
        />
        <StatCard
          icon={Percent}
          label="Tỷ lệ chuyên cần"
          value={`${typeof stats.attendanceRate === 'number' ? stats.attendanceRate.toFixed(0) : (stats.attendanceRate || 0)}%`}
          color="blue"
        />
      </div>

      {/* Class Summaries */}
      {filteredSummaries.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Thống kê theo lớp</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredSummaries.map((summary) => (
              <ClassSummaryCard key={summary.classId} summary={summary} />
            ))}
          </div>
        </div>
      )}

      {/* Attendance History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" />
            Lịch sử điểm danh
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRecords.length > 0 ? (
            <div className="space-y-2">
              {filteredRecords.map((record) => (
                <AttendanceRecord key={record.id} record={record} />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default StudentAttendance;

