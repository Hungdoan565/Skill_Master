import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, BarChart3, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useParentChildren } from '../hooks/useParentChildren';
import { useParentChildGrades } from '../hooks/useParentChildGrades';
import { buildParentGradesGroups, formatDate } from './parent-portal-helpers';
import { ChevronDown, ChevronUp } from 'lucide-react';

// Child selector component (reusable pills)
const ChildSelector = ({ children, selectedId, onSelect }) => (
  <div className="flex gap-2 flex-wrap mb-6">
    {children.map(child => (
      <button
        key={child.id}
        onClick={() => onSelect(child.id)}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedId === child.id
          ? 'bg-orange-500 text-white shadow-sm'
          : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
          }`}
      >
        {child.full_name}
      </button>
    ))}
  </div>
);

function GradesList({ studentId }) {
  const { grades, loading, error } = useParentChildGrades(studentId);
  const groupedGrades = buildParentGradesGroups(grades);
  const [expandedGroups, setExpandedGroups] = useState({});

  const toggleGroup = (groupKey) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg border border-red-100">
        <p>{error}</p>
      </div>
    );
  }

  if (!grades || grades.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
        <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Chưa có điểm số</h3>
        <p className="text-sm">Học viên hiện chưa có dữ liệu điểm số nào.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groupedGrades.map((group) => (
        <Card key={group.classKey}>
          <CardContent className="p-0">
            <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-medium text-lg">{group.className}</p>
                <p className="text-sm text-muted-foreground">{group.courseTitle}</p>
                <p className="mt-1 text-xs text-muted-foreground">{group.assessmentCountLabel}</p>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{group.summaryLabel}</p>
                <div className="flex items-baseline sm:justify-end gap-1">
                  <span className={cn(
                    "text-2xl font-bold",
                    group.summaryScore >= 8 ? 'text-green-600' :
                      group.summaryScore >= 6.5 ? 'text-blue-600' :
                        group.summaryScore >= 5 ? 'text-amber-600' : 'text-red-600'
                  )}>
                    {group.summaryScore?.toFixed?.(1) ?? group.summaryScore ?? 'N/A'}
                  </span>
                  <span className="text-xs text-muted-foreground">/ 10.0</span>
                </div>
                {group.latestScore != null && (
                  <p className="mt-1 text-xs text-muted-foreground">Đầu điểm gần nhất: {group.latestScore.toFixed?.(1) ?? group.latestScore}/10</p>
                )}
              </div>
            </div>

            <div className="border-t px-4 py-3 space-y-2">
              {(expandedGroups[group.classKey] ? group.assessments : group.assessments.slice(0, 3)).map((assessment) => (
                <div key={assessment.id} className="flex flex-col gap-2 rounded-lg border bg-slate-50/80 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{assessment.gradeType}</p>
                    <p className="text-xs text-muted-foreground">Ngày: {formatDate(assessment.assessmentDate)}</p>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <span className={cn(
                      "text-lg font-bold",
                      assessment.score >= 8 ? 'text-green-600' :
                        assessment.score >= 6.5 ? 'text-blue-600' :
                          assessment.score >= 5 ? 'text-amber-600' : 'text-red-600'
                    )}>
                      {assessment.score?.toFixed?.(1) ?? assessment.score ?? 'N/A'}
                    </span>
                    <span className="ml-1 text-xs text-muted-foreground">/ 10.0</span>
                  </div>
                </div>
              ))}

              {group.assessments.length > 3 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleGroup(group.classKey)}
                  className="h-9 rounded-lg px-3 text-sm text-orange-700 hover:bg-orange-50 hover:text-orange-800"
                >
                  {expandedGroups[group.classKey] ? (
                    <ChevronUp className="mr-2 h-4 w-4" />
                  ) : (
                    <ChevronDown className="mr-2 h-4 w-4" />
                  )}
                  {expandedGroups[group.classKey]
                    ? 'Thu gọn đầu điểm'
                    : `Xem thêm ${group.assessments.length - 3} đầu điểm`}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function ParentGradesPage() {
  const { children, loading: childrenLoading, error: childrenError } = useParentChildren();
  const [selectedChildId, setSelectedChildId] = useState(null);

  useEffect(() => {
    if (children && children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].id);
    }
  }, [children, selectedChildId]);

  if (childrenLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (childrenError) {
    return (
      <div className="space-y-6 p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-medium">Không thể tải danh sách học viên liên kết</p>
          <p className="mt-1">{childrenError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="bg-orange-100 p-2 rounded-lg">
          <BarChart3 className="h-6 w-6 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Bảng điểm</h1>
          <p className="text-muted-foreground">Theo dõi kết quả học tập của học viên được liên kết</p>
        </div>
      </div>

      {children && children.length > 0 ? (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border shadow-sm">
          <ChildSelector
            children={children}
            selectedId={selectedChildId}
            onSelect={setSelectedChildId}
          />

          <div className="mt-6">
            {selectedChildId ? (
              <GradesList studentId={selectedChildId} />
            ) : (
              <div className="text-center p-8 text-muted-foreground">
                Vui lòng chọn học viên để xem bảng điểm
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl border shadow-sm">
          <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Chưa có dữ liệu học viên</h3>
          <p className="text-sm text-muted-foreground mt-1">Không tìm thấy thông tin học viên nào liên kết với tài khoản này.</p>
        </div>
      )}
    </div>
  );
}
