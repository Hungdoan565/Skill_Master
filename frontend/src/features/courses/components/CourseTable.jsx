/**
 * CourseTable Component - Bảng danh sách khóa học với batch selection
 * Updated: Added Status column + Actions dropdown menu
 */

import { BookOpen, Clock, Pencil, Trash2, Loader2, Settings2, Copy, BarChart3, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CategoryBadge } from './CategoryBadge';
import { formatPrice, COURSE_STATUS } from '../utils';

// Status Badge Component
function StatusBadge({ status }) {
  const config = COURSE_STATUS.find(s => s.value === status) || COURSE_STATUS[0];
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}

export function CourseTable({
  courses,
  loading,
  searchTerm,
  deletingId,
  selectedIds = [],
  onSelectionChange,
  onDelete,
  onEdit,
  onClone,
  onViewAnalytics,
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
      <div className="flex flex-col items-center justify-center py-12 px-4">
        {searchTerm ? (
          // No search results
          <>
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">Không tìm thấy kết quả</h3>
            <p className="text-muted-foreground text-sm text-center max-w-sm">
              Không có khóa học nào phù hợp với "{searchTerm}". Thử tìm kiếm với từ khóa khác.
            </p>
          </>
        ) : (
          // First time - no courses
          <>
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center mb-4">
              <BookOpen className="w-10 h-10 text-red-400" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">Chưa có khóa học nào</h3>
            <p className="text-muted-foreground text-sm text-center max-w-sm mb-4">
              Bắt đầu tạo khóa học đầu tiên để quản lý chương trình đào tạo của bạn.
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span>💡</span>
              Bấm nút "Tạo khóa học" ở góc trên bên phải
            </p>
          </>
        )}
      </div>
    );
  }

  // Handle select all
  const handleSelectAll = (checked) => {
    if (checked) {
      onSelectionChange?.(courses.map(c => c.id));
    } else {
      onSelectionChange?.([]);
    }
  };

  // Handle single select
  const handleSelect = (id, checked) => {
    if (checked) {
      onSelectionChange?.([...selectedIds, id]);
    } else {
      onSelectionChange?.(selectedIds.filter(sid => sid !== id));
    }
  };

  const allSelected = courses.length > 0 && selectedIds.length === courses.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < courses.length;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-full whitespace-nowrap md:whitespace-normal">
        <thead>
          <tr className="border-b text-left text-sm font-medium text-muted-foreground">
            <th className="pb-3 pr-2 w-10">
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Chọn tất cả"
              />
            </th>
            <th className="pb-3 pr-4">Mã</th>
            <th className="pb-3 pr-4">Tên khóa học</th>
            <th className="pb-3 pr-4">Danh mục</th>
            <th className="pb-3 pr-4">Trạng thái</th>
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
              isSelected={selectedIds.includes(course.id)}
              onSelect={handleSelect}
              onDelete={onDelete}
              onEdit={onEdit}
              onClone={onClone}
              onViewAnalytics={onViewAnalytics}
              onConfigGrade={onConfigGrade}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Course Row Component - tách riêng để tối ưu render
function CourseRow({
  course,
  deletingId,
  isSelected,
  onSelect,
  onDelete,
  onEdit,
  onClone,
  onViewAnalytics,
  onConfigGrade
}) {
  return (
    <tr className={`border-b last:border-0 hover:bg-accent/50 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}>
      {/* Checkbox */}
      <td className="py-4 pr-2">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(course.id, checked)}
          aria-label={`Chọn ${course.title}`}
        />
      </td>

      {/* Mã khóa học */}
      <td className="py-4 pr-4">
        <code className="rounded bg-muted px-2 py-1 text-sm font-mono">
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

      {/* Trạng thái - NEW COLUMN */}
      <td className="py-4 pr-4">
        <StatusBadge status={course.status} />
      </td>

      {/* Học phí */}
      <td className="py-4 pr-4 text-right font-mono font-medium text-emerald-600 tabular-nums">
        {formatPrice(course.price)}
      </td>

      {/* Số buổi */}
      <td className="py-4 pr-4 text-center">
        <span className="inline-flex items-center gap-1 text-sm">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          {course.total_sessions || '-'} buổi
        </span>
      </td>

      {/* Actions - Dropdown Menu */}
      <td className="py-4 text-right">
        <div className="flex items-center justify-end gap-1">
          {/* Quick Edit Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            onClick={() => onEdit?.(course)}
            title="Chỉnh sửa"
          >
            <Pencil className="h-4 w-4" />
          </Button>

          {/* More Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Thao tác khác"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onViewAnalytics?.(course)}>
                <BarChart3 className="h-4 w-4 mr-2 text-purple-600" />
                Xem thống kê
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onClone?.(course)}>
                <Copy className="h-4 w-4 mr-2 text-emerald-600" />
                Nhân bản
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onConfigGrade?.(course)}>
                <Settings2 className="h-4 w-4 mr-2 text-indigo-600" />
                Cấu hình điểm
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete?.(course)}
                disabled={deletingId === course.id}
                className="text-destructive focus:text-destructive"
              >
                {deletingId === course.id ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Xóa khóa học
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  );
}

export default CourseTable;
