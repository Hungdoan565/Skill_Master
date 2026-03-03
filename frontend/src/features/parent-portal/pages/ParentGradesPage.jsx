import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, BarChart3, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useParentChildren } from '../hooks/useParentChildren';
import { useParentChildGrades } from '../hooks/useParentChildGrades';

const formatDate = (dateString) => {
  if (!dateString) return '--/--/----';
  return new Date(dateString).toLocaleDateString('vi-VN');
};

// Child selector component (reusable pills)
const ChildSelector = ({ children, selectedId, onSelect }) => (
  <div className="flex gap-2 flex-wrap mb-6">
    {children.map(child => (
      <button
        key={child.id}
        onClick={() => onSelect(child.id)}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          selectedId === child.id
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
    <Card>
      <CardContent className="p-0">
        <div className="divide-y">
          {grades.map((grade, idx) => (
            <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
              <div>
                <p className="font-medium text-lg">{grade.className}</p>
                <p className="text-sm text-muted-foreground">{grade.courseTitle}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400 bg-muted px-2 py-0.5 rounded">
                    {grade.gradeType}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Ngày: {formatDate(grade.assessmentDate)}
                  </span>
                </div>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <div className="flex items-baseline sm:justify-end gap-1">
                  <span className={cn(
                    "text-2xl font-bold",
                    grade.score >= 8 ? 'text-green-600' : 
                    grade.score >= 6.5 ? 'text-blue-600' : 
                    grade.score >= 5 ? 'text-amber-600' : 'text-red-600'
                  )}>
                    {grade.score?.toFixed(1) || 'N/A'}
                  </span>
                  <span className="text-xs text-muted-foreground">/ 10.0</span>
                </div>
                {grade.score !== undefined && grade.score !== null && (
                  <p className={cn(
                    "text-xs font-medium mt-1 uppercase tracking-wider",
                    grade.score >= 8 ? 'text-green-600' : 
                    grade.score >= 6.5 ? 'text-blue-600' : 
                    grade.score >= 5 ? 'text-amber-600' : 'text-red-600'
                  )}>
                    {grade.score >= 8 ? 'Giỏi' : 
                     grade.score >= 6.5 ? 'Khá' : 
                     grade.score >= 5 ? 'Trung bình' : 'Yếu'}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ParentGradesPage() {
  const { children, loading: childrenLoading } = useParentChildren();
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

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="bg-orange-100 p-2 rounded-lg">
          <BarChart3 className="h-6 w-6 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Bảng điểm</h1>
          <p className="text-muted-foreground">Xem kết quả học tập của các con</p>
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
