/**
 * StudentGrades Page - Trang xem điểm số cho học viên
 * Redesigned: Table Compact view
 */

import { useState, useMemo } from 'react';
import { useStudentGrades } from '../hooks';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Award,
  TrendingUp,
  TrendingDown,
  BarChart3,
  AlertTriangle,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Calendar,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

const GRADE_TYPE_LABELS = {
  oral: 'Kiểm tra miệng',
  quiz_15: 'KT 15 phút',
  quiz_45: 'KT 1 tiết',
  midterm: 'Giữa kỳ',
  final: 'Cuối kỳ',
  assignment: 'Bài tập',
  participation: 'Chuyên cần',
  project: 'Dự án',
  default: 'Điểm'
};

const formatDate = (dateStr) => {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleDateString('vi-VN');
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
function StatCard({ icon: Icon, label, value, color = 'default' }) {
  const colorStyles = {
    default: 'bg-muted text-muted-foreground',
    green: 'bg-green-500/10 text-green-600 dark:text-green-400',
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    red: 'bg-red-500/10 text-red-600 dark:text-red-400'
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

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <Award className="h-16 w-16 mb-4 opacity-30" />
      <h3 className="text-lg font-medium mb-2">Chưa có điểm nào</h3>
      <p className="text-sm">Điểm số sẽ hiển thị khi giáo viên cập nhật</p>
    </div>
  );
}

// Table Header with Sort
function SortableHeader({ label, sortKey, currentSort, onSort, className }) {
  const isActive = currentSort.key === sortKey;
  const Icon = isActive 
    ? (currentSort.order === 'asc' ? ArrowUp : ArrowDown)
    : ArrowUpDown;

  return (
    <th 
      className={cn(
        "px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/50 transition-colors select-none",
        className
      )}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        <Icon className={cn("h-3.5 w-3.5", isActive ? "text-primary" : "opacity-40")} />
      </div>
    </th>
  );
}

// Grades Table Component
function GradesTable({ grades, classSummaries }) {
  const [sortConfig, setSortConfig] = useState({ key: 'date', order: 'desc' });
  const [searchTerm, setSearchTerm] = useState('');

  // Flatten all grades with class info
  const allGrades = useMemo(() => {
    const flattened = [];
    classSummaries.forEach(cs => {
      cs.grades.forEach(grade => {
        flattened.push({
          ...grade,
          className: cs.className,
          classId: cs.classId,
          courseTitle: cs.courseTitle
        });
      });
    });
    return flattened;
  }, [classSummaries]);

  // Filter by search
  const filteredGrades = useMemo(() => {
    if (!searchTerm.trim()) return allGrades;
    const term = searchTerm.toLowerCase();
    return allGrades.filter(g => 
      g.className?.toLowerCase().includes(term) ||
      g.courseTitle?.toLowerCase().includes(term) ||
      (GRADE_TYPE_LABELS[g.grade_type] || g.grade_type_name || '').toLowerCase().includes(term)
    );
  }, [allGrades, searchTerm]);

  // Sort grades
  const sortedGrades = useMemo(() => {
    const sorted = [...filteredGrades];
    sorted.sort((a, b) => {
      let aVal, bVal;
      switch (sortConfig.key) {
        case 'class':
          aVal = a.className || '';
          bVal = b.className || '';
          break;
        case 'type':
          aVal = GRADE_TYPE_LABELS[a.grade_type] || a.grade_type_name || '';
          bVal = GRADE_TYPE_LABELS[b.grade_type] || b.grade_type_name || '';
          break;
        case 'score':
          aVal = a.score ?? -1;
          bVal = b.score ?? -1;
          break;
        case 'weight':
          aVal = a.weight ?? 0;
          bVal = b.weight ?? 0;
          break;
        case 'date':
        default:
          aVal = new Date(a.graded_at || a.created_at || 0).getTime();
          bVal = new Date(b.graded_at || b.created_at || 0).getTime();
          break;
      }
      if (aVal < bVal) return sortConfig.order === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.order === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredGrades, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      order: prev.key === key && prev.order === 'desc' ? 'asc' : 'desc'
    }));
  };

  if (allGrades.length === 0) {
    return <EmptyState />;
  }

  return (
    <Card>
      <CardContent className="p-0">
        {/* Search Bar */}
        <div className="p-4 border-b">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm kiếm theo lớp, môn học..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-full whitespace-nowrap md:whitespace-normal">
            <thead className="bg-muted/40 border-b">
              <tr>
                <SortableHeader 
                  label="Lớp học" 
                  sortKey="class" 
                  currentSort={sortConfig} 
                  onSort={handleSort}
                  className="min-w-[180px]"
                />
                <SortableHeader 
                  label="Loại điểm" 
                  sortKey="type" 
                  currentSort={sortConfig} 
                  onSort={handleSort}
                  className="min-w-[120px]"
                />
                <SortableHeader 
                  label="Điểm" 
                  sortKey="score" 
                  currentSort={sortConfig} 
                  onSort={handleSort}
                  className="w-20 text-center"
                />
                <SortableHeader 
                  label="Hệ số" 
                  sortKey="weight" 
                  currentSort={sortConfig} 
                  onSort={handleSort}
                  className="w-20 text-center"
                />
                <SortableHeader 
                  label="Ngày" 
                  sortKey="date" 
                  currentSort={sortConfig} 
                  onSort={handleSort}
                  className="w-28"
                />
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Ghi chú
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sortedGrades.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Không tìm thấy điểm phù hợp
                  </td>
                </tr>
              ) : (
                sortedGrades.map((grade, idx) => {
                  const typeLabel = GRADE_TYPE_LABELS[grade.grade_type] || 
                                    GRADE_TYPE_LABELS[grade.type] || 
                                    grade.grade_type_name ||
                                    GRADE_TYPE_LABELS.default;
                  const scoreColor = getScoreColor(grade.score);
                  const scoreBg = getScoreBgColor(grade.score);

                  return (
                    <tr 
                      key={grade.id || idx} 
                      className="hover:bg-muted/50 transition-colors"
                    >
                      {/* Class */}
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

                      {/* Type */}
                      <td className="px-3 py-3">
                        <span className="text-sm">{typeLabel}</span>
                      </td>

                      {/* Score */}
                      <td className="px-3 py-3 text-center">
                        <span className={cn(
                          "inline-flex items-center justify-center min-w-[48px] px-2 py-1 rounded-md text-sm font-bold",
                          scoreBg, scoreColor
                        )}>
                          {grade.score != null ? Number(grade.score).toFixed(1) : 'N/A'}
                        </span>
                      </td>

                      {/* Weight */}
                      <td className="px-3 py-3 text-center">
                        <span className="text-sm text-muted-foreground">
                          {grade.weight ?? 1}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(grade.graded_at || grade.created_at)}
                        </div>
                      </td>

                      {/* Notes */}
                      <td className="px-3 py-3">
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]" title={grade.notes || ''}>
                          {grade.notes || '—'}
                        </p>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with count */}
        <div className="px-4 py-3 border-t bg-muted/20 text-sm text-muted-foreground">
          Hiển thị {sortedGrades.length} / {allGrades.length} điểm
        </div>
      </CardContent>
    </Card>
  );
}

// Class Summary Cards (compact horizontal view)
function ClassSummaryBar({ classSummaries }) {
  if (classSummaries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {classSummaries.map(cs => {
        const avgColor = getScoreColor(cs.avgScore);
        const avgBg = getScoreBgColor(cs.avgScore);
        
        return (
          <div 
            key={cs.classId}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-background border hover:shadow-sm transition-shadow"
          >
            <div className="p-2 rounded-lg bg-blue-500/10">
              <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate max-w-[150px]">{cs.className}</p>
              <p className="text-xs text-muted-foreground">{cs.grades.length} điểm</p>
            </div>
            <div className={cn("px-2.5 py-1 rounded-lg text-sm font-bold", avgBg, avgColor)}>
              {cs.avgScore ?? 'N/A'}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function StudentGrades() {
  const {
    grades,
    classSummaries,
    statistics,
    loading,
    error,
    refresh
  } = useStudentGrades();

  const [classFilter, setClassFilter] = useState('all');

  const filteredSummaries = classFilter && classFilter !== 'all'
    ? classSummaries.filter(cs => cs.classId === classFilter)
    : classSummaries;

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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Bảng điểm</h1>
          <p className="text-muted-foreground">Xem điểm số các môn học</p>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={BarChart3}
          label="Tổng điểm"
          value={statistics.totalGrades || 0}
        />
        <StatCard
          icon={Award}
          label="Điểm TB"
          value={statistics.overallAverage ?? 'N/A'}
          color="blue"
        />
        <StatCard
          icon={TrendingUp}
          label="Cao nhất"
          value={statistics.highestScore ?? 'N/A'}
          color="green"
        />
        <StatCard
          icon={TrendingDown}
          label="Thấp nhất"
          value={statistics.lowestScore ?? 'N/A'}
          color="red"
        />
      </div>

      {/* Class Summary Bar */}
      <ClassSummaryBar classSummaries={filteredSummaries} />

      {/* Grades Table */}
      <GradesTable grades={grades} classSummaries={filteredSummaries} />
    </div>
  );
}

export default StudentGrades;
