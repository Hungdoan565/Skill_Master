/**
 * StudentGrades Page - Trang xem điểm số cho học viên
 */

import { useState } from 'react';
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
  BookOpen,
  Calendar,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

const GRADE_TYPE_LABELS = {
  oral: 'Kiểm tra miệng',
  quiz_15: 'Kiểm tra 15 phút',
  quiz_45: 'Kiểm tra 1 tiết',
  midterm: 'Giữa kỳ',
  final: 'Cuối kỳ',
  assignment: 'Bài tập',
  participation: 'Điểm chuyên cần',
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
  if (score >= 8) return 'bg-green-100 dark:bg-green-900/30';
  if (score >= 5) return 'bg-amber-100 dark:bg-amber-900/30';
  return 'bg-red-100 dark:bg-red-900/30';
};

function StatCard({ icon: Icon, label, value, color = 'default' }) {
  const colorStyles = {
    default: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
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

function GradeItem({ grade }) {
  const typeLabel = GRADE_TYPE_LABELS[grade.grade_type] || 
                    GRADE_TYPE_LABELS[grade.type] || 
                    grade.grade_type_name ||
                    GRADE_TYPE_LABELS.default;
  
  const score = grade.score;
  const scoreColor = getScoreColor(score);
  const scoreBg = getScoreBgColor(score);

  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={cn('p-2 rounded-lg', scoreBg)}>
          <FileText className={cn('h-4 w-4', scoreColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{typeLabel}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(grade.graded_at || grade.created_at)}</span>
            {grade.weight && (
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                Hệ số: {grade.weight}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className={cn('text-xl font-bold', scoreColor)}>
          {score !== null && score !== undefined ? score.toFixed(1) : 'N/A'}
        </div>
        {grade.notes && (
          <p className="text-xs text-muted-foreground max-w-[150px] truncate" title={grade.notes}>
            {grade.notes}
          </p>
        )}
      </div>
    </div>
  );
}

function ClassGradeCard({ classSummary }) {
  const avgColor = getScoreColor(classSummary.avgScore);

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b bg-muted/30">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold">{classSummary.className}</h3>
              <p className="text-sm text-muted-foreground">{classSummary.courseTitle}</p>
            </div>
          </div>
          <div className="text-right">
            <div className={cn('text-2xl font-bold', avgColor)}>
              {classSummary.avgScore !== null ? classSummary.avgScore.toFixed(1) : 'N/A'}
            </div>
            <div className="text-sm text-muted-foreground">Điểm TB</div>
          </div>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="space-y-2">
          {classSummary.grades.length > 0 ? (
            classSummary.grades.map((grade) => (
              <GradeItem key={grade.id} grade={grade} />
            ))
          ) : (
            <p className="text-center text-muted-foreground py-4">Chưa có điểm</p>
          )}
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

export function StudentGrades() {
  const {
    grades,
    classSummaries,
    statistics,
    loading,
    error,
    refresh
  } = useStudentGrades();

  const [classFilter, setClassFilter] = useState('');

  const filteredSummaries = classFilter
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
              <SelectItem value="">Tất cả lớp</SelectItem>
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
          icon={BarChart3}
          label="Tổng số điểm"
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
          label="Điểm cao nhất"
          value={statistics.highestScore ?? 'N/A'}
          color="green"
        />
        <StatCard
          icon={TrendingDown}
          label="Điểm thấp nhất"
          value={statistics.lowestScore ?? 'N/A'}
          color="red"
        />
      </div>

      {/* Grades by Class */}
      {filteredSummaries.length > 0 ? (
        <div className="space-y-4">
          {filteredSummaries.map((classSummary) => (
            <ClassGradeCard key={classSummary.classId} classSummary={classSummary} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <EmptyState />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default StudentGrades;

