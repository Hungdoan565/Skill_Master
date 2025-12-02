/**
 * ClassesTable Component - Bảng danh sách lớp học
 */

import { useNavigate } from 'react-router-dom';
import { 
  Clock, Calendar as CalendarIcon, Users, Eye, Pencil, Trash2, BookOpen, Plus 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ColorAvatar } from './ColorAvatar';
import { STATUS_CONFIG, CATEGORY_COLORS, formatScheduleDisplay, formatDate } from '../utils';

export function ClassesTable({
  classes,
  loading,
  searchTerm,
  statusFilter,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onEdit,
  onDelete,
  onOpenModal
}) {
  const navigate = useNavigate();

  // Check selection state
  const isAllSelected = classes.length > 0 && selectedIds.length === classes.length;
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < classes.length;

  // Loading state
  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <span>Đang tải dữ liệu...</span>
        </div>
      </div>
    );
  }

  // Empty state
  if (classes.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2">
        <BookOpen className="h-10 w-10 text-slate-300" />
        <p className="text-muted-foreground">
          {searchTerm || statusFilter ? 'Không tìm thấy lớp học phù hợp' : 'Chưa có lớp học nào'}
        </p>
        {!searchTerm && !statusFilter && (
          <Button variant="outline" size="sm" onClick={onOpenModal}>
            <Plus className="mr-2 h-4 w-4" />
            Mở lớp đầu tiên
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b text-left text-sm font-medium text-muted-foreground">
            <th className="pb-3 pr-2 w-10">
              <input
                type="checkbox"
                checked={isAllSelected}
                ref={el => {
                  if (el) el.indeterminate = isSomeSelected;
                }}
                onChange={onToggleSelectAll}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </th>
            <th className="pb-3 pr-4">Lớp học</th>
            <th className="pb-3 pr-4">Khóa học</th>
            <th className="pb-3 pr-4">Giáo viên</th>
            <th className="pb-3 pr-4">Lịch học</th>
            <th className="pb-3 pr-4">Sĩ số</th>
            <th className="pb-3 pr-4">Trạng thái</th>
            <th className="pb-3 text-right">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {classes.map((cls) => (
            <ClassRow
              key={cls.id}
              cls={cls}
              isSelected={selectedIds.includes(cls.id)}
              onToggleSelect={() => onToggleSelect(cls.id)}
              onNavigate={() => navigate(`/admin/classes/${cls.id}`)}
              onEdit={() => onEdit(cls)}
              onDelete={() => onDelete(cls)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Row component
function ClassRow({ cls, isSelected, onToggleSelect, onNavigate, onEdit, onDelete }) {
  const statusCfg = STATUS_CONFIG[cls.status] || STATUS_CONFIG.upcoming;
  const categoryCfg = CATEGORY_COLORS[cls.courses?.category] || CATEGORY_COLORS.default;
  const roomName = cls.rooms?.name || cls.room || '';

  return (
    <tr className={`border-b last:border-0 transition-colors ${
      isSelected ? 'bg-indigo-50 hover:bg-indigo-100' : 'hover:bg-slate-50'
    }`}>
      {/* Checkbox */}
      <td className="py-4 pr-2 w-10">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
        />
      </td>

      {/* Lớp học */}
      <td className="py-4 pr-4">
        <div className="cursor-pointer group" onClick={onNavigate}>
          <p className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">
            {cls.name}
          </p>
          <p className="text-xs text-muted-foreground">
            <code className="bg-slate-100 px-1 rounded">{cls.code}</code>
            {roomName && <span className="ml-2">• {roomName}</span>}
          </p>
        </div>
      </td>
      
      {/* Khóa học */}
      <td className="py-4 pr-4">
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${categoryCfg}`}>
          {cls.courses?.title || '-'}
        </span>
      </td>
      
      {/* Giáo viên */}
      <td className="py-4 pr-4">
        {cls.teacher ? (
          <div className="flex items-center gap-2">
            <ColorAvatar name={cls.teacher.full_name} avatarUrl={cls.teacher.avatar_url} />
            <span className="text-sm">{cls.teacher.full_name}</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground italic">Chưa phân công</span>
        )}
      </td>
      
      {/* Lịch học */}
      <td className="py-4 pr-4">
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-1 text-slate-600">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            {formatScheduleDisplay(cls.schedule)}
          </div>
          {cls.start_date && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarIcon className="h-3 w-3" />
              {formatDate(cls.start_date)} - {formatDate(cls.end_date)}
            </div>
          )}
        </div>
      </td>
      
      {/* Sĩ số */}
      <td className="py-4 pr-4">
        <div className="flex items-center gap-1.5">
          <Users className="h-4 w-4 text-slate-400" />
          <span className={`text-sm font-medium ${
            cls.enrolled_count >= cls.max_students ? 'text-red-600' : 'text-slate-700'
          }`}>
            {cls.enrolled_count || 0}/{cls.max_students}
          </span>
        </div>
      </td>
      
      {/* Trạng thái */}
      <td className="py-4 pr-4">
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${statusCfg.color}`}>
          {statusCfg.label}
        </span>
      </td>
      
      {/* Actions */}
      <td className="py-4 text-right">
        <div className="flex items-center justify-end gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onNavigate} 
            title="Xem chi tiết"
            className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onEdit} title="Chỉnh sửa">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
            title="Xóa"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

export default ClassesTable;
