import { useEffect, useMemo, useState } from 'react';
import { useStudentGrades } from '../hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Award,
  BarChart3,
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronRight,
  ListTree,
  RefreshCw,
  RotateCcw,
  Search,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  filterGrades,
  flattenClassSummaries,
  groupByClass,
  groupByTranscriptPeriod,
  nextSortConfig,
  paginateRecords,
  sortGrades,
  toggleExpandedGroupState,
} from '../utils/gradesView';

const GRADE_TYPE_LABELS = {
  oral: 'Kiểm tra miệng',
  quiz_15: 'KT 15 phút',
  quiz_45: 'KT 1 tiết',
  midterm: 'Giữa kỳ',
  final: 'Cuối kỳ',
  assignment: 'Bài tập',
  participation: 'Chuyên cần',
  project: 'Dự án',
  default: 'Điểm',
};

const VIEW_MODE = {
  OVERVIEW: 'overview',
  TRANSCRIPT: 'transcript',
};

const PAGE_SIZE_OPTIONS = [5, 10, 20];

const formatDate = (dateStr) => {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleDateString('vi-VN');
};

const formatScore = (score) => {
  if (score === null || score === undefined || Number.isNaN(Number(score))) return 'N/A';
  return Number(score).toFixed(1);
};

const getScoreColor = (score) => {
  if (score === null || score === undefined) return 'text-muted-foreground';
  if (score >= 8) return 'text-green-600 dark:text-green-400';
  if (score >= 5) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
};

const getScoreBgColor = (score) => {
  if (score === null || score === undefined) return 'bg-muted';
  if (score >= 8) return 'bg-green-500/10';
  if (score >= 5) return 'bg-amber-500/10';
  return 'bg-red-500/10';
};

const getGradeTypeLabel = (grade) => {
  if (grade?.gradeTypeLabel) return grade.gradeTypeLabel;
  if (grade?.grade_type && GRADE_TYPE_LABELS[grade.grade_type]) return GRADE_TYPE_LABELS[grade.grade_type];
  if (grade?.type && GRADE_TYPE_LABELS[grade.type]) return GRADE_TYPE_LABELS[grade.type];
  return grade?.grade_type_name || GRADE_TYPE_LABELS.default;
};

function StatCard({ icon: Icon, label, value, color = 'default' }) {
  const colorStyles = {
    default: 'bg-muted text-muted-foreground',
    green: 'bg-green-500/10 text-green-600 dark:text-green-400',
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    red: 'bg-red-500/10 text-red-600 dark:text-red-400',
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn('p-2.5 rounded-xl', colorStyles[color])}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center text-muted-foreground">
      <Award className="h-12 w-12 mb-3 opacity-30" />
      <h3 className="text-base font-semibold mb-2 text-foreground">{title}</h3>
      <p className="text-sm max-w-lg">{description}</p>
      {actionLabel ? (
        <Button type="button" variant="outline" className="mt-4" onClick={onAction}>
          <RotateCcw className="h-4 w-4 mr-2" />
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

function SortableHeader({ label, sortKey, currentSort, onSort, className }) {
  const isActive = currentSort.key === sortKey;
  const Icon = isActive ? (currentSort.order === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <th
      className={cn(
        'px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-slate-50 transition-colors select-none',
        className
      )}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        <Icon className={cn('h-3.5 w-3.5', isActive ? 'text-primary' : 'opacity-40')} />
      </div>
    </th>
  );
}

function GradeRow({ grade }) {
  const scoreColor = getScoreColor(grade.score);
  const scoreBg = getScoreBgColor(grade.score);

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-blue-500/10">
            <BookOpen className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{grade.className}</p>
            <p className="text-xs text-muted-foreground truncate">{grade.courseTitle}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-3">
        <span className="text-sm">{getGradeTypeLabel(grade)}</span>
      </td>
      <td className="px-3 py-3 text-center">
        <span className={cn('inline-flex items-center justify-center min-w-[48px] px-2 py-1 rounded-md text-sm font-bold', scoreBg, scoreColor)}>
          {formatScore(grade.score)}
        </span>
      </td>
      <td className="px-3 py-3 text-center">
        <span className="text-sm text-muted-foreground">{grade.weight ?? 1}</span>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          {formatDate(grade.graded_at || grade.created_at)}
        </div>
      </td>
      <td className="px-3 py-3">
        <p className="text-sm text-muted-foreground truncate max-w-[200px]" title={grade.notes || ''}>
          {grade.notes || '--'}
        </p>
      </td>
    </tr>
  );
}

function MobileGradeCard({ grade }) {
  const scoreColor = getScoreColor(grade.score);
  const scoreBg = getScoreBgColor(grade.score);

  return (
    <div className="rounded-lg border p-3 space-y-2 bg-card">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium leading-tight">{grade.className}</p>
          <p className="text-xs text-muted-foreground">{grade.courseTitle}</p>
        </div>
        <span className={cn('inline-flex items-center justify-center min-w-[44px] px-2 py-1 rounded-md text-xs font-bold', scoreBg, scoreColor)}>
          {formatScore(grade.score)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <p className="text-muted-foreground">Loai diem</p>
        <p className="text-right">{getGradeTypeLabel(grade)}</p>
        <p className="text-muted-foreground">He so</p>
        <p className="text-right">{grade.weight ?? 1}</p>
        <p className="text-muted-foreground">Ngay</p>
        <p className="text-right">{formatDate(grade.graded_at || grade.created_at)}</p>
      </div>

      {grade.notes ? <p className="text-xs text-muted-foreground">{grade.notes}</p> : null}
    </div>
  );
}

function PaginationControls({ pagination, pageSize, onPageChange, onPageSizeChange }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-t bg-muted/20 text-sm text-muted-foreground">
      <div>
        Hiển thị {pagination.startItem}-{pagination.endItem} / {pagination.totalItems} điểm
      </div>

      <div className="flex items-center gap-2">
        <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
          <SelectTrigger className="h-8 w-[92px]">
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
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.currentPage - 1)}
          disabled={pagination.currentPage <= 1}
        >
          Trước
        </Button>
        <span className="px-1">
          {pagination.currentPage}/{pagination.totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.currentPage + 1)}
          disabled={pagination.currentPage >= pagination.totalPages}
        >
          Sau
        </Button>
      </div>
    </div>
  );
}

function ClassGroupPanel({ groups, expandedGroups, onToggle, onFocusClass }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ListTree className="h-4 w-4" />
          Tổng quan theo lớp
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {groups.map((group) => {
          const isExpanded = Boolean(expandedGroups[group.id]);
          const avgColor = getScoreColor(group.average);
          const avgBg = getScoreBgColor(group.average);

          return (
            <div key={group.id} className="rounded-xl border bg-card">
              <button
                type="button"
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/30 rounded-xl transition-colors"
                onClick={() => onToggle(group.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  <div className="min-w-0">
                    <p className="font-medium truncate">{group.className}</p>
                    <p className="text-xs text-muted-foreground truncate">{group.courseTitle || 'Môn học'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{group.totalGrades} điểm</span>
                  <span className={cn('px-2 py-1 rounded-md text-xs font-semibold', avgBg, avgColor)}>{group.average ?? 'N/A'}</span>
                </div>
              </button>

              {isExpanded ? (
                <div className="px-4 pb-4 space-y-3 border-t">
                  <div className="pt-3 space-y-2">
                    {group.grades.slice(0, 3).map((grade) => (
                      <div key={`${group.id}-${grade.id}`} className="flex items-center justify-between text-sm rounded-md bg-muted/30 px-3 py-2">
                        <div>
                          <p className="font-medium">{getGradeTypeLabel(grade)}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(grade.graded_at || grade.created_at)}</p>
                        </div>
                        <span className={cn('font-semibold', getScoreColor(grade.score))}>{formatScore(grade.score)}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onFocusClass(group.classId || group.id)}
                  >
                    Lọc theo lớp này
                  </Button>
                </div>
              ) : null}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function DetailedGradesSection({ rows, sortConfig, onSort, pagination, pageSize, onPageChange, onPageSizeChange }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Chi tiết điểm</CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-full whitespace-nowrap md:whitespace-normal">
            <thead className="bg-muted/40 border-b">
              <tr>
                <SortableHeader label="Lớp học" sortKey="class" currentSort={sortConfig} onSort={onSort} className="min-w-[180px]" />
                <SortableHeader label="Loại điểm" sortKey="type" currentSort={sortConfig} onSort={onSort} className="min-w-[120px]" />
                <SortableHeader label="Điểm" sortKey="score" currentSort={sortConfig} onSort={onSort} className="w-20 text-center" />
                <SortableHeader label="Hệ số" sortKey="weight" currentSort={sortConfig} onSort={onSort} className="w-20 text-center" />
                <SortableHeader label="Ngày" sortKey="date" currentSort={sortConfig} onSort={onSort} className="w-28" />
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ghi chú</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {pagination.pageItems.map((grade) => (
                <GradeRow key={grade.id} grade={grade} />
              ))}
            </tbody>
          </table>
        </div>

        <div className="md:hidden space-y-2 px-4 py-3">
          {pagination.pageItems.map((grade) => (
            <MobileGradeCard key={grade.id} grade={grade} />
          ))}
        </div>

        <PaginationControls
          pagination={pagination}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </CardContent>
    </Card>
  );
}

function TranscriptView({ groups }) {
  return (
    <div className="space-y-3">
      {groups.map((group, index) => (
        <details key={group.period} className="rounded-xl border bg-card" open={index === 0}>
          <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between hover:bg-muted/30 rounded-xl">
            <div>
              <p className="font-medium">{group.period}</p>
              <p className="text-xs text-muted-foreground">{group.totalGrades} điểm - Điểm TB {group.average ?? 'N/A'}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </summary>

          <div className="border-t px-4 py-3 space-y-2">
            {group.grades.slice(0, 8).map((grade) => (
              <div key={`transcript-${grade.id}`} className="flex items-center justify-between gap-3 rounded-md bg-muted/30 px-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="font-medium truncate">{grade.className}</p>
                  <p className="text-xs text-muted-foreground truncate">{getGradeTypeLabel(grade)} - {formatDate(grade.graded_at || grade.created_at)}</p>
                </div>
                <span className={cn('font-semibold', getScoreColor(grade.score))}>{formatScore(grade.score)}</span>
              </div>
            ))}

            {group.grades.length > 8 ? (
              <p className="text-xs text-muted-foreground">Và {group.grades.length - 8} điểm khác trong kỳ này...</p>
            ) : null}
          </div>
        </details>
      ))}
    </div>
  );
}

export function StudentGrades() {
  const { classSummaries, statistics, loading, error, refresh } = useStudentGrades();

  const [classFilter, setClassFilter] = useState('all');
  const [viewMode, setViewMode] = useState(VIEW_MODE.OVERVIEW);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'date', order: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [expandedGroups, setExpandedGroups] = useState({});

  const uniqueClasses = classSummaries.map((summary) => ({
    id: summary.classId,
    name: summary.className,
  }));

  const filteredSummaries = classFilter !== 'all'
    ? classSummaries.filter((summary) => summary.classId === classFilter)
    : classSummaries;

  const normalizedGrades = useMemo(
    () => flattenClassSummaries(filteredSummaries).map((grade) => ({
      ...grade,
      gradeTypeLabel: getGradeTypeLabel(grade),
    })),
    [filteredSummaries]
  );

  const filteredGrades = useMemo(
    () => filterGrades(normalizedGrades, searchTerm),
    [normalizedGrades, searchTerm]
  );

  const sortedGrades = useMemo(
    () => sortGrades(filteredGrades, sortConfig),
    [filteredGrades, sortConfig]
  );

  const classGroups = useMemo(() => groupByClass(sortedGrades), [sortedGrades]);
  const transcriptGroups = useMemo(() => groupByTranscriptPeriod(sortedGrades), [sortedGrades]);
  const pagination = useMemo(() => paginateRecords(sortedGrades, currentPage, pageSize), [sortedGrades, currentPage, pageSize]);

  useEffect(() => {
    if (currentPage > pagination.totalPages) {
      setCurrentPage(pagination.totalPages);
    }
  }, [currentPage, pagination.totalPages]);

  const handleSort = (key) => {
    setSortConfig((previous) => nextSortConfig(previous, key));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setClassFilter('all');
    setSearchTerm('');
    setSortConfig({ key: 'date', order: 'desc' });
    setCurrentPage(1);
  };

  const handleToggleGroup = (groupId) => {
    setExpandedGroups((previous) => toggleExpandedGroupState(previous, groupId));
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Đang tải điểm số...</p>
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
          <Button type="button" onClick={refresh} variant="destructive">
            <RefreshCw className="h-4 w-4 mr-2" />
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Bảng điểm</h1>
          <p className="text-muted-foreground">Xem điểm theo lớp, bộ lọc nhanh và chi tiết phân trang</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={classFilter} onValueChange={(value) => { setClassFilter(value); setCurrentPage(1); }}>
            <SelectTrigger className="w-[210px]">
              <SelectValue placeholder="Tất cả lớp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả lớp</SelectItem>
              {uniqueClasses.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="w-[190px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={VIEW_MODE.OVERVIEW}>Tổng quan + chi tiết</SelectItem>
              <SelectItem value={VIEW_MODE.TRANSCRIPT}>Xem theo học kỳ</SelectItem>
            </SelectContent>
          </Select>

          <Button type="button" variant="ghost" size="icon" onClick={refresh} title="Làm mới dữ liệu">
            <RefreshCw className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={BarChart3} label="Tổng điểm" value={statistics.totalGrades || 0} />
        <StatCard icon={Award} label="Điểm TB" value={statistics.overallAverage ?? 'N/A'} color="blue" />
        <StatCard icon={TrendingUp} label="Cao nhất" value={statistics.highestScore ?? 'N/A'} color="green" />
        <StatCard icon={TrendingDown} label="Thấp nhất" value={statistics.lowestScore ?? 'N/A'} color="red" />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                data-testid="grades-search-input"
                type="text"
                placeholder="Tìm theo lớp, môn học, loại điểm..."
                value={searchTerm}
                onChange={(event) => { setSearchTerm(event.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{filteredGrades.length} kết quả</span>
              {(searchTerm || classFilter !== 'all') ? (
                <Button type="button" variant="outline" size="sm" onClick={handleResetFilters}>
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  Bỏ lọc
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      {normalizedGrades.length === 0 ? (
        <EmptyState
          title="Chưa có điểm nào"
          description="Điểm sẽ hiển thị sau khi giáo viên cập nhật kết quả học tập."
        />
      ) : null}

      {normalizedGrades.length > 0 && filteredGrades.length === 0 ? (
        <EmptyState
          title="Không tìm thấy điểm phù hợp"
          description="Bộ lọc hiện tại không có kết quả. Bạn có thể reset bộ lọc để xem toàn bộ điểm."
          actionLabel="Reset bộ lọc"
          onAction={handleResetFilters}
        />
      ) : null}

      {filteredGrades.length > 0 && viewMode === VIEW_MODE.OVERVIEW ? (
        <>
          <ClassGroupPanel
            groups={classGroups}
            expandedGroups={expandedGroups}
            onToggle={handleToggleGroup}
            onFocusClass={(classId) => {
              setClassFilter(classId);
              setCurrentPage(1);
            }}
          />

          <DetailedGradesSection
            rows={sortedGrades}
            sortConfig={sortConfig}
            onSort={handleSort}
            pagination={pagination}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
          />
        </>
      ) : null}

      {filteredGrades.length > 0 && viewMode === VIEW_MODE.TRANSCRIPT ? (
        <TranscriptView groups={transcriptGroups} />
      ) : null}
    </div>
  );
}

export default StudentGrades;
