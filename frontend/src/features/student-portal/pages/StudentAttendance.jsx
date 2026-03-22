import { useEffect, useMemo, useState } from 'react';
import {
  format,
  isWithinInterval,
  startOfDay,
} from 'date-fns';
import { vi as localeVi } from 'date-fns/locale';
import {
  AlertCircle,
  Calendar,
  Check,
  Clock,
  RefreshCw,
  X,
  Minus,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';

import { useStudentAttendance } from '../hooks';
import { useCountUp } from '../hooks/useCountUp';
import {
  PERIOD_PRESETS,
  buildCalendarGridDays,
  buildPeriodRange,
  deriveDayStatus,
  filterByStatus,
  paginateRecords,
  aggregateWeeklyRates,
} from '../utils/attendanceView';
import { ProgressRing } from '../components/ProgressRing';
import { TrendSparkline } from '../components/TrendSparkline';
import { AttendancePopover } from '../components/AttendancePopover';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/* ────────────────────── Constants ────────────────────── */

const STATUS_STYLES = {
  present: {
    label: 'Có mặt',
    badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500',
    icon: Check,
    iconClass: 'text-white',
  },
  absent: {
    label: 'Vắng mặt',
    badge: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800',
    dot: 'bg-rose-500',
    icon: X,
    iconClass: 'text-white',
  },
  late: {
    label: 'Đi trễ',
    badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
    icon: Clock,
    iconClass: 'text-white',
  },
  excused: {
    label: 'Có phép',
    badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    dot: 'bg-blue-500',
    icon: Minus,
    iconClass: 'text-white',
  },
  none: {
    label: 'Không học',
    badge: 'bg-muted text-muted-foreground border-border',
    dot: 'bg-muted',
    icon: null,
    iconClass: '',
  },
  future: {
    label: 'Tương lai',
    badge: 'bg-muted text-muted-foreground border-border',
    dot: 'bg-transparent border border-dashed border-border',
    icon: null,
    iconClass: '',
  },
};

const PERIOD_OPTIONS = [
  { value: 'd7', label: PERIOD_PRESETS.d7 },
  { value: 'd30', label: PERIOD_PRESETS.d30 },
  { value: 'term', label: PERIOD_PRESETS.term },
];

const PAGE_SIZE_OPTIONS = [10, 20, 30];

/* ────────────────────── Helpers ────────────────────── */

const formatDate = (dateStr) => {
  if (!dateStr) return '--';
  return format(new Date(dateStr), 'dd/MM/yyyy', { locale: localeVi });
};

const formatPercent = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '--';
  return `${Number(value).toFixed(1)}%`;
};

const formatTime = (timeStr) => {
  if (!timeStr) return '--:--';
  return String(timeStr).slice(0, 5);
};

/* ────────────────────── Sub-components ────────────────────── */

function CountUpValue({ value }) {
  const animated = useCountUp(value);
  return <>{animated}</>;
}

function StatCard({ title, value, color = 'default', icon: Icon, children }) {
  const colorMap = {
    default: 'bg-muted text-foreground border-border',
    success: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50',
    danger: 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/50',
    warning: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50',
  };

  return (
    <Card className="shadow-sm border-border overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
            <p className="text-2xl font-semibold mt-1">{value}</p>
          </div>
          {children || (
            <div className={cn('h-10 w-10 rounded-full border flex items-center justify-center', colorMap[color])}>
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }) {
  const config = STATUS_STYLES[status] || STATUS_STYLES.none;
  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs font-medium', config.badge)}>
      <span className={cn('h-2 w-2 rounded-full', config.dot)} />
      {config.label}
    </span>
  );
}

function ClassSummaryChip({ summary, isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-3 py-2 rounded-lg border text-left transition-all min-w-[180px] shrink-0',
        isActive ? 'bg-primary/10 border-primary/30 shadow-sm' : 'bg-card border-border hover:bg-muted/50'
      )}
    >
      <p className="font-medium text-sm truncate">{summary.className}</p>
      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
        <span>{summary.totalSessions || 0} buổi</span>
        <span className="font-medium text-foreground">{formatPercent(summary.attendanceRate || 0)}</span>
      </div>
    </button>
  );
}

/* ────────────────────── Compact Heatmap ────────────────────── */

function AttendanceHeatmap({ records, rangeStart, rangeEnd, statusFocus, onStatusFocusChange }) {
  const today = startOfDay(new Date());
  const calendarDays = useMemo(() => buildCalendarGridDays(rangeStart, rangeEnd), [rangeStart, rangeEnd]);

  const weeks = useMemo(() => {
    const chunks = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      chunks.push(calendarDays.slice(i, i + 7));
    }
    return chunks;
  }, [calendarDays]);

  const statusCounts = useMemo(() => {
    const base = { present: 0, absent: 0, late: 0, excused: 0 };
    (records || []).forEach((record) => {
      if (base[record.status] !== undefined) base[record.status] += 1;
    });
    return base;
  }, [records]);

  const weekdayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  return (
    <Card className="shadow-sm border-border">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            Biểu đồ chuyên cần
          </CardTitle>
          <div className="text-xs text-muted-foreground">
            {format(rangeStart, "dd/MM/yyyy", { locale: localeVi })} - {format(rangeEnd, "dd/MM/yyyy", { locale: localeVi })}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1.5 text-center text-xs text-muted-foreground font-medium">
          {weekdayLabels.map((label) => (
            <div key={label}>{label}</div>
          ))}
        </div>

        {/* Calendar grid — compact cells */}
        <div className="space-y-1.5">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-1.5">
              {week.map((day) => {
                const dayStatus = deriveDayStatus(records, day, today);
                const isInRequestedRange = isWithinInterval(day, { start: rangeStart, end: rangeEnd });
                const isDimmed = statusFocus !== 'all' && dayStatus !== statusFocus && dayStatus !== 'future' && dayStatus !== 'none';

                const config = STATUS_STYLES[dayStatus] || STATUS_STYLES.none;
                const Icon = config.icon;
                const dayRecords = (records || []).filter((record) =>
                  format(new Date(record.session_date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
                );

                const cellContent = (
                  <div
                    className={cn(
                      'relative rounded-lg p-1 h-10 transition-all cursor-default group',
                      isInRequestedRange ? 'bg-card' : 'bg-muted/60',
                      isDimmed ? 'opacity-35' : 'opacity-100',
                      dayRecords.length > 0 && 'cursor-pointer hover:scale-105 motion-reduce:hover:scale-100'
                    )}
                    style={{ transition: 'transform 150ms ease, opacity 200ms ease' }}
                  >
                    <div className="relative z-10 text-[10px] leading-none text-muted-foreground font-medium">
                      {format(day, 'd')}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      {Icon ? (
                        <div className={cn('h-6 w-6 rounded-full flex items-center justify-center', config.dot)}>
                          <Icon className={cn('h-3 w-3 shrink-0', config.iconClass)} />
                        </div>
                      ) : (
                        <div className={cn('h-6 w-6 rounded-full flex items-center justify-center', config.dot)} />
                      )}
                    </div>
                  </div>
                );

                // Wrap with popover if there are records
                if (dayRecords.length > 0) {
                  return (
                    <AttendancePopover key={day.toISOString()} date={day} records={dayRecords}>
                      {cellContent}
                    </AttendancePopover>
                  );
                }

                return <div key={day.toISOString()}>{cellContent}</div>;
              })}
            </div>
          ))}
        </div>

        {/* Legend — lighter chips */}
        <div className="pt-3 border-t border-border flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => onStatusFocusChange('all')}
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
              statusFocus === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            Tất cả ({records.length})
          </button>
          {['present', 'absent', 'late', 'excused', 'none'].map((statusKey) => {
            const config = STATUS_STYLES[statusKey];
            const count = statusKey === 'none' ? 0 : statusCounts[statusKey] || 0;
            return (
              <button
                key={statusKey}
                type="button"
                onClick={() => onStatusFocusChange(statusKey)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                  statusFocus === statusKey
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                <span className={cn('h-2 w-2 rounded-full', config.dot)} />
                {config.label} {statusKey === 'none' ? '' : `(${count})`}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/* ────────────────────── History Table ────────────────────── */

function HistoryTable({ records, hasActiveFilters, onResetFilters }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [records.length, pageSize]);

  const pagination = useMemo(() => paginateRecords(records, page, pageSize), [records, page, pageSize]);

  if (records.length === 0) {
    return (
      <Card className="shadow-sm border-border">
        <CardContent className="py-10 text-center space-y-3">
          <p className="font-medium">Không tìm thấy dữ liệu điểm danh</p>
          <p className="text-sm text-muted-foreground">
            {hasActiveFilters
              ? 'Bộ lọc hiện tại không có kết quả. Bạn có thể reset để xem toàn bộ dữ liệu.'
              : 'Dữ liệu điểm danh sẽ xuất hiện khi có buổi học được ghi nhận.'}
          </p>
          {hasActiveFilters ? (
            <Button type="button" variant="outline" onClick={onResetFilters}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset bộ lọc
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Lịch sử điểm danh</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="bg-muted/50 border-y border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ngày</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Lớp học</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Trạng thái</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Giờ vào</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pagination.items.map((record) => (
                <tr key={record.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium">{formatDate(record.session_date)}</td>
                  <td className="px-4 py-3 text-sm">
                    <p className="font-medium">{record.class_name}</p>
                    <p className="text-xs text-muted-foreground">{record.course_title}</p>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <StatusBadge status={record.status} />
                  </td>
                  <td className="px-4 py-3 text-sm">{formatTime(record.check_in_time)}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{record.notes || '--'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-border bg-muted/50 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground">
          <div>
            Hiển thị {pagination.startItem}-{pagination.endItem} / {pagination.totalItems} bản ghi
          </div>

          <div className="flex items-center gap-2">
            <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
              <SelectTrigger className="h-8 w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}/trang
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>{pagination.page}/{pagination.totalPages}</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
              disabled={pagination.page >= pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ────────────────────── Skeleton Loading ────────────────────── */

function AttendanceSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-44" />
          <Skeleton className="h-9 w-36" />
        </div>
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-7 w-16" />
                </div>
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Class chips skeleton */}
      <div className="flex gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-44 rounded-lg" />
        ))}
      </div>

      {/* Heatmap skeleton */}
      <Card className="shadow-sm">
        <CardContent className="p-5">
          <Skeleton className="h-5 w-48 mb-4" />
          <div className="space-y-1.5">
            {Array.from({ length: 5 }).map((_, row) => (
              <div key={row} className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: 7 }).map((_, col) => (
                  <Skeleton key={col} className="h-10 rounded-lg" />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Table skeleton */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="p-4">
            <Skeleton className="h-5 w-36 mb-4" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-4 py-3 border-t border-border flex gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/* ────────────────────── Main Component ────────────────────── */

export function StudentAttendance() {
  const [classFilter, setClassFilter] = useState('all');
  const [periodPreset, setPeriodPreset] = useState('d30');
  const [statusFocus, setStatusFocus] = useState('all');

  const periodRange = useMemo(() => buildPeriodRange(periodPreset), [periodPreset]);

  const { records, classSummaries, statistics, loading, error, refresh } = useStudentAttendance({
    classId: classFilter !== 'all' ? classFilter : null,
    startDate: periodRange.startKey,
    endDate: periodRange.endKey,
  });

  const filteredRecords = useMemo(
    () => filterByStatus(records || [], statusFocus),
    [records, statusFocus]
  );

  const weeklyRates = useMemo(
    () => aggregateWeeklyRates(records || [], periodRange.startDate, periodRange.endDate),
    [records, periodRange.startDate, periodRange.endDate]
  );

  const hasActiveFilters = classFilter !== 'all' || periodPreset !== 'd30' || statusFocus !== 'all';

  const handleResetFilters = () => {
    setClassFilter('all');
    setPeriodPreset('d30');
    setStatusFocus('all');
  };

  /* ── Loading ── */
  if (loading) {
    return <AttendanceSkeleton />;
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <Card className="w-full max-w-lg border-rose-200 dark:border-rose-900/50 bg-rose-50/70 dark:bg-rose-900/20">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-10 w-10 mx-auto text-rose-600 dark:text-rose-400 mb-3" />
            <h2 className="text-lg font-semibold text-rose-700 dark:text-rose-400 mb-2">Không thể tải điểm danh</h2>
            <p className="text-sm text-rose-600 dark:text-rose-500 mb-4">{error}</p>
            <Button onClick={refresh} variant="destructive">
              <RefreshCw className="h-4 w-4 mr-2" />
              Thử lại
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-6">
      {/* ── Section 1: Header + Filters + Date Range (inline) ── */}
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Điểm danh</h1>
          <p className="text-muted-foreground">
            Theo dõi chuyên cần theo lớp, trạng thái và thời gian
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {format(periodRange.startDate, 'dd/MM/yyyy', { locale: localeVi })} – {format(periodRange.endDate, 'dd/MM/yyyy', { locale: localeVi })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Tất cả lớp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả lớp</SelectItem>
              {classSummaries.map((summary) => (
                <SelectItem key={summary.classId} value={summary.classId}>
                  {summary.className}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={periodPreset} onValueChange={setPeriodPreset}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters ? (
            <Button type="button" variant="outline" onClick={handleResetFilters}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset bộ lọc
            </Button>
          ) : null}

          <Button type="button" variant="outline" onClick={refresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
        </div>
      </div>

      {/* ── Section 2: Stat Cards + Sparkline + Class Chips ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Tỷ lệ chuyên cần"
          value={formatPercent(statistics.attendanceRate || 0)}
          color="default"
          icon={Calendar}
        >
          <ProgressRing value={Number(statistics.attendanceRate) || 0} />
        </StatCard>
        <StatCard
          title="Có mặt"
          value={<CountUpValue value={statistics.presentCount || 0} />}
          color="success"
          icon={Check}
        />
        <StatCard
          title="Vắng mặt"
          value={<CountUpValue value={statistics.absentCount || 0} />}
          color="danger"
          icon={X}
        />
        <StatCard
          title="Đi trễ"
          value={<CountUpValue value={statistics.lateCount || 0} />}
          color="warning"
          icon={Clock}
        />
      </div>

      {/* Trend sparkline */}
      <Card className="shadow-sm border-border">
        <CardContent className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Xu hướng chuyên cần theo tuần</p>
          <TrendSparkline data={weeklyRates} height={60} />
        </CardContent>
      </Card>

      {/* Class chips — no Card wrapper, horizontal scroll */}
      {classSummaries.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
          <ClassSummaryChip
            summary={{ classId: 'all', className: 'Tất cả lớp', totalSessions: statistics.totalSessions || 0, attendanceRate: statistics.attendanceRate || 0 }}
            isActive={classFilter === 'all'}
            onClick={() => setClassFilter('all')}
          />
          {classSummaries.map((summary) => (
            <ClassSummaryChip
              key={summary.classId}
              summary={summary}
              isActive={classFilter === summary.classId}
              onClick={() => setClassFilter(summary.classId)}
            />
          ))}
        </div>
      )}

      {/* ── Section 3: Compact Heatmap ── */}
      <AttendanceHeatmap
        records={filteredRecords}
        rangeStart={periodRange.startDate}
        rangeEnd={periodRange.endDate}
        statusFocus={statusFocus}
        onStatusFocusChange={setStatusFocus}
      />

      {/* ── Section 4: History Table ── */}
      <HistoryTable
        records={filteredRecords}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={handleResetFilters}
      />
    </div>
  );
}

export default StudentAttendance;
