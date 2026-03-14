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
import {
  PERIOD_PRESETS,
  buildCalendarGridDays,
  buildPeriodRange,
  deriveDayStatus,
  filterByStatus,
  paginateRecords,
} from '../utils/attendanceView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STATUS_STYLES = {
  present: {
    label: 'Có mặt',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    icon: Check,
    iconClass: 'text-white',
  },
  absent: {
    label: 'Vắng mặt',
    badge: 'bg-rose-100 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
    icon: X,
    iconClass: 'text-white',
  },
  late: {
    label: 'Đi trễ',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    icon: Clock,
    iconClass: 'text-white',
  },
  excused: {
    label: 'Có phép',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
    icon: Minus,
    iconClass: 'text-white',
  },
  none: {
    label: 'Không học',
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-200',
    icon: null,
    iconClass: '',
  },
  future: {
    label: 'Tương lai',
    badge: 'bg-slate-100 text-slate-500 border-slate-200',
    dot: 'bg-transparent border border-dashed border-slate-300',
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

function StatCard({ title, value, color = 'default', icon: Icon }) {
  const colorMap = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    danger: 'bg-rose-100 text-rose-700 border-rose-200',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
  };

  return (
    <Card className="shadow-sm border-slate-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
            <p className="text-2xl font-semibold mt-1">{value}</p>
          </div>
          <div className={cn('h-10 w-10 rounded-full border flex items-center justify-center', colorMap[color])}>
            <Icon className="h-5 w-5" />
          </div>
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
        'px-3 py-2 rounded-lg border text-left transition-all min-w-[220px]',
        isActive ? 'bg-primary/10 border-primary/30 shadow-sm' : 'bg-white border-slate-200 hover:bg-slate-50'
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
    const base = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
    };
    (records || []).forEach((record) => {
      if (base[record.status] !== undefined) {
        base[record.status] += 1;
      }
    });
    return base;
  }, [records]);

  const weekdayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  return (
    <Card className="shadow-sm border-slate-200">
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

      <CardContent className="space-y-4">
        <div className="grid grid-cols-7 gap-2 text-center text-xs text-muted-foreground font-medium">
          {weekdayLabels.map((label) => (
            <div key={label}>{label}</div>
          ))}
        </div>

        <div className="space-y-2">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-2">
              {week.map((day) => {
                const dayStatus = deriveDayStatus(records, day, today);
                const isInRequestedRange = isWithinInterval(day, { start: rangeStart, end: rangeEnd });
                const isDimmed = statusFocus !== 'all' && dayStatus !== statusFocus && dayStatus !== 'future' && dayStatus !== 'none';

                const config = STATUS_STYLES[dayStatus] || STATUS_STYLES.none;
                const Icon = config.icon;
                const dayRecords = (records || []).filter((record) =>
                  format(new Date(record.session_date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
                );

                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      'relative rounded-xl border p-2 h-16 transition-all bg-white',
                      isInRequestedRange ? 'border-slate-200' : 'border-slate-100 bg-slate-50',
                      isDimmed ? 'opacity-35' : 'opacity-100'
                    )}
                    title={
                      dayStatus === 'none'
                        ? `${format(day, 'dd/MM/yyyy')}: Không có dữ liệu`
                        : `${format(day, 'dd/MM/yyyy')}: ${config.label} (${dayRecords.length})`
                    }
                  >
                    <div className="relative z-10 text-[11px] text-slate-500">{format(day, 'd')}</div>

                    <div className="absolute inset-0 flex items-center justify-center">
                      {Icon ? (
                        <div className={cn('h-8 w-8 rounded-full flex items-center justify-center', config.dot)}>
                          <Icon className={cn('h-4 w-4 shrink-0', config.iconClass)} />
                        </div>
                      ) : (
                        <div className={cn('h-8 w-8 rounded-full flex items-center justify-center', config.dot)} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={statusFocus === 'all' ? 'default' : 'outline'}
            onClick={() => onStatusFocusChange('all')}
          >
            Tất cả ({records.length})
          </Button>
          {['present', 'absent', 'late', 'excused', 'none'].map((statusKey) => {
            const config = STATUS_STYLES[statusKey];
            const count = statusKey === 'none' ? 0 : statusCounts[statusKey] || 0;
            return (
              <Button
                key={statusKey}
                type="button"
                size="sm"
                variant={statusFocus === statusKey ? 'default' : 'outline'}
                className="gap-2"
                onClick={() => onStatusFocusChange(statusKey)}
              >
                <span className={cn('h-2 w-2 rounded-full', config.dot)} />
                {config.label} {statusKey === 'none' ? '' : `(${count})`}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function HistoryTable({ records, hasActiveFilters, onResetFilters }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [records.length, pageSize]);

  const pagination = useMemo(() => paginateRecords(records, page, pageSize), [records, page, pageSize]);

  if (records.length === 0) {
    return (
      <Card className="shadow-sm border-slate-200">
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
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Lịch sử điểm danh</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="bg-slate-50 border-y border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Ngày</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Lớp học</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Trạng thái</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Giờ vào</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pagination.items.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50 transition-colors">
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

        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/70 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground">
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

  const activeClassSummary = classFilter === 'all'
    ? null
    : classSummaries.find((summary) => summary.classId === classFilter) || null;

  const hasActiveFilters = classFilter !== 'all' || periodPreset !== 'd30' || statusFocus !== 'all';

  const handleResetFilters = () => {
    setClassFilter('all');
    setPeriodPreset('d30');
    setStatusFocus('all');
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <Card className="w-full max-w-lg border-rose-200 bg-rose-50/70">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-10 w-10 mx-auto text-rose-600 mb-3" />
            <h2 className="text-lg font-semibold text-rose-700 mb-2">Không thể tải điểm danh</h2>
            <p className="text-sm text-rose-600 mb-4">{error}</p>
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
    <div className="space-y-6 p-6">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Điểm danh</h1>
          <p className="text-muted-foreground">Theo dõi chuyên cần theo lớp, trạng thái và thời gian</p>
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

      <Card className="border-slate-200 shadow-sm bg-white">
        <CardContent className="p-4 flex flex-wrap items-center gap-3 text-sm">
          <span className="text-muted-foreground">Khoảng thời gian:</span>
          <span className="font-medium">
            {format(periodRange.startDate, 'dd/MM/yyyy', { locale: localeVi })} - {format(periodRange.endDate, 'dd/MM/yyyy', { locale: localeVi })}
          </span>
          {activeClassSummary ? (
            <>
              <span className="text-muted-foreground">|</span>
              <span>Lớp:</span>
              <span className="font-medium">{activeClassSummary.className}</span>
            </>
          ) : null}
          {statusFocus !== 'all' ? (
            <>
              <span className="text-muted-foreground">|</span>
              <span>Trạng thái:</span>
              <span className="font-medium">{STATUS_STYLES[statusFocus]?.label}</span>
            </>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Tỷ lệ chuyên cần"
          value={formatPercent(statistics.attendanceRate || 0)}
          color="default"
          icon={Calendar}
        />
        <StatCard
          title="Có mặt"
          value={statistics.presentCount || 0}
          color="success"
          icon={Check}
        />
        <StatCard
          title="Vắng mặt"
          value={statistics.absentCount || 0}
          color="danger"
          icon={X}
        />
        <StatCard
          title="Đi trễ"
          value={statistics.lateCount || 0}
          color="warning"
          icon={Clock}
        />
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Theo lớp học</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
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
        </CardContent>
      </Card>

      <AttendanceHeatmap
        records={filteredRecords}
        rangeStart={periodRange.startDate}
        rangeEnd={periodRange.endDate}
        statusFocus={statusFocus}
        onStatusFocusChange={setStatusFocus}
      />

      <HistoryTable
        records={filteredRecords}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={handleResetFilters}
      />
    </div>
  );
}

export default StudentAttendance;
