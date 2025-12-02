/**
 * CourseTable Component - Bảng danh sách khóa học
 */

import { BookOpen, Clock, Pencil, Trash2, Loader2, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CategoryBadge } from './CategoryBadge';
import { formatPrice } from '../utils';

export function CourseTable({ 
  courses, 
  loading, 
  searchTerm,
  deletingId,
  onDelete, 
  onEdit, 
  onConfigGrade 
}) {
  // Loading state
  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-red-500 mr-2" />
        <p className="text-muted-foreground">Đang tải dữ liệu...</p>
      </div>
    );
  }

  // Empty state
  if (courses.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2">
        <BookOpen className="w-10 h-10 text-zinc-300" />
        <p className="text-muted-foreground">
          {searchTerm
            ? 'Không tìm thấy khóa học phù hợp'
            : 'Chưa có khóa học nào. Bấm "Tạo khóa học" để thêm mới.'}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b text-left text-sm font-medium text-muted-foreground">
            <th className="pb-3 pr-4">Mã</th>
            <th className="pb-3 pr-4">Tên khóa học</th>
            <th className="pb-3 pr-4">Danh mục</th>
            <th className="pb-3 pr-4">Trình độ</th>
            <th className="pb-3 pr-4 text-right">Học phí</th>
            <th className="pb-3 pr-4 text-center">Số buổi</th>
            <th className="pb-3 text-right">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((course) => (
            <CourseRow
              key={course.id}
              course={course}
              deletingId={deletingId}
              onDelete={onDelete}
              onEdit={onEdit}
              onConfigGrade={onConfigGrade}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Course Row Component - tách riêng để tối ưu render
function CourseRow({ course, deletingId, onDelete, onEdit, onConfigGrade }) {
  return (
    <tr className="border-b last:border-0 hover:bg-slate-50 transition-colors">
      {/* Mã khóa học */}
      <td className="py-4 pr-4">
        <code className="rounded bg-slate-100 px-2 py-1 text-sm font-mono">
          {course.code}
        </code>
      </td>

      {/* Tên & Mô tả */}
      <td className="py-4 pr-4">
        <div className="flex items-center gap-3">
          {course.cover_image ? (
            <img 
              src={course.cover_image} 
              alt={course.title}
              className="w-10 h-10 rounded-lg object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-red-500" />
            </div>
          )}
          <div>
            <p className="font-medium">{course.title}</p>
            {course.description && (
              <p className="text-sm text-muted-foreground line-clamp-1 max-w-xs">
                {course.description}
              </p>
            )}
          </div>
        </div>
      </td>

      {/* Danh mục */}
      <td className="py-4 pr-4">
        <CategoryBadge category={course.category} />
      </td>

      {/* Trình độ */}
      <td className="py-4 pr-4">
        <span className="text-sm text-zinc-600">{course.level || '-'}</span>
      </td>

      {/* Học phí */}
      <td className="py-4 pr-4 text-right font-mono font-medium text-emerald-600 tabular-nums">
        {formatPrice(course.price)}
      </td>

      {/* Số buổi */}
      <td className="py-4 pr-4 text-center">
        <span className="inline-flex items-center gap-1 text-sm">
          <Clock className="w-3.5 h-3.5 text-zinc-400" />
          {course.total_sessions || '-'} buổi
        </span>
      </td>

      {/* Actions */}
      <td className="py-4 text-right">
        <div className="flex items-center justify-end gap-1">
          {/* Cấu hình điểm */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
            onClick={() => onConfigGrade(course)}
            title="Cấu hình cột điểm"
          >
            <Settings2 className="h-4 w-4" />
          </Button>

          {/* Chỉnh sửa */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => onEdit?.(course)}
          >
            <Pencil className="h-4 w-4" />
          </Button>

          {/* Xóa */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-red-50"
            onClick={() => onDelete(course.id, course.title)}
            disabled={deletingId === course.id}
          >
            {deletingId === course.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </td>
    </tr>
  );
}

export default CourseTable;
