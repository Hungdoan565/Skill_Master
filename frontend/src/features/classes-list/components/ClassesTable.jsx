/**
 * ClassesTable Component - Bảng danh sách lớp học
 */

import { useNavigate } from 'react-router-dom';
import {
  Clock, Calendar as CalendarIcon, Users, Eye, Pencil, Trash2, BookOpen, Plus, AlertCircle, AlertTriangle, DollarSign, TrendingUp, MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              <th className="pb-3 pr-2 w-10"></th>
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
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="border-b last:border-0 animate-pulse">
                <td className="py-4 pr-2">
                  <div className="h-4 w-4 bg-slate-200 rounded"></div>
                </td>
                <td className="py-4 pr-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-32"></div>
                    <div className="h-3 bg-slate-100 rounded w-24"></div>
                  </div>
                </td>
                <td className="py-4 pr-4">
                  <div className="h-6 bg-slate-200 rounded-full w-24"></div>
                </td>
                <td className="py-4 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-slate-200 rounded-full"></div>
                    <div className="h-4 bg-slate-200 rounded w-20"></div>
                  </div>
                </td>
                <td className="py-4 pr-4">
                  <div className="space-y-1">
                    <div className="h-4 bg-slate-200 rounded w-28"></div>
                    <div className="h-3 bg-slate-100 rounded w-32"></div>
                  </div>
                </td>
                <td className="py-4 pr-4">
                  <div className="h-4 bg-slate-200 rounded w-16"></div>
                </td>
                <td className="py-4 pr-4">
                  <div className="h-6 bg-slate-200 rounded-full w-20"></div>
                </td>
                <td className="py-4">
                  <div className="flex items-center justify-end gap-1">
                    <div className="h-8 w-8 bg-slate-200 rounded"></div>
                    <div className="h-8 w-8 bg-slate-200 rounded"></div>
                    <div className="h-8 w-8 bg-slate-200 rounded"></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
  const navigate = useNavigate();
  const statusCfg = STATUS_CONFIG[cls.status] || STATUS_CONFIG.upcoming;
  const categoryCfg = CATEGORY_COLORS[cls.courses?.category] || CATEGORY_COLORS.default;
  const roomName = cls.rooms?.name || cls.room || '';

  // Calculate enrollment percentage
  const enrollmentPercentage = cls.max_students > 0
    ? (cls.enrolled_count / cls.max_students) * 100
    : 0;

  return (
    <tr className={`border-b last:border-0 transition-colors ${isSelected ? 'bg-indigo-50 hover:bg-indigo-100' : 'hover:bg-slate-50'
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
          <div className="flex items-center gap-2">
            <p className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">
              {cls.name}
            </p>
            {/* Conflict Warning */}
            {cls.conflicts?.has_conflict && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-semibold mb-1">⚠️ Xung đột lịch học</p>
                    {cls.conflicts.details?.slice(0, 2).map((conflict, idx) => (
                      <p key={idx} className="text-xs">
                        • {conflict.conflict_type.includes('room') ? 'Phòng' : 'GV'} trùng với {conflict.class_name}
                      </p>
                    ))}
                    {cls.conflicts.details?.length > 2 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        +{cls.conflicts.details.length - 2} xung đột khác
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            <code className="bg-slate-100 px-1 rounded">{cls.code}</code>
            {roomName && <span className="ml-2">• {roomName}</span>}
          </p>
        </div>
      </td>

      {/* Khóa học */}
      <td className="py-4 pr-4">
        {cls.courses ? (
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${categoryCfg}`}>
            <BookOpen className="h-3 w-3 mr-1" />
            {cls.courses.title}
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Chưa có khóa học
          </span>
        )}
      </td>

      {/* Giáo viên */}
      <td className="py-4 pr-4">
        {cls.teacher ? (
          <div className="flex items-center gap-2">
            <ColorAvatar name={cls.teacher.full_name} avatarUrl={cls.teacher.avatar_url} />
            <div className="flex flex-col">
              <span className="text-sm">{cls.teacher.full_name}</span>
              {cls.teacher.active_classes_count > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <span className={`text-xs ${
                        cls.teacher.active_classes_count >= 10 ? 'text-red-600' :
                        cls.teacher.active_classes_count >= 7 ? 'text-amber-600' :
                        'text-slate-500'
                      }`}>
                        {cls.teacher.active_classes_count} lớp
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Đang dạy {cls.teacher.active_classes_count} lớp</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
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
            <span className={formatScheduleDisplay(cls.schedule) === '-' ? 'text-muted-foreground italic' : ''}>
              {formatScheduleDisplay(cls.schedule)}
            </span>
          </div>
          {cls.start_date && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarIcon className="h-3 w-3" />
              {formatDate(cls.start_date)}
              {cls.end_date && <> - {formatDate(cls.end_date)}</>}
            </div>
          )}
          {/* Progress bar */}
          {cls.sessions_progress?.total > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center gap-1">
                    <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 transition-all"
                        style={{ width: `${cls.sessions_progress.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500">
                      {cls.sessions_progress.completed}/{cls.sessions_progress.total}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Đã học {cls.sessions_progress.completed}/{cls.sessions_progress.total} buổi ({cls.sessions_progress.percentage}%)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </td>

      {/* Sĩ số */}
      <td className="py-4 pr-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-slate-400" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <span className={`text-sm font-medium ${
                    enrollmentPercentage >= 100 ? 'text-red-600' :
                    enrollmentPercentage >= 80 ? 'text-amber-600' :
                    'text-slate-700'
                  }`}>
                    {cls.enrolled_count || 0}/{cls.max_students || 0}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    <p className="font-semibold">Chi tiết ghi danh:</p>
                    <p className="text-xs">✅ Đang học: {cls.enrollment_breakdown?.active || 0}</p>
                    {cls.enrollment_breakdown?.pending > 0 && (
                      <p className="text-xs">⏳ Chờ xác nhận: {cls.enrollment_breakdown.pending}</p>
                    )}
                    {cls.enrollment_breakdown?.dropped > 0 && (
                      <p className="text-xs text-red-400">❌ Đã bỏ học: {cls.enrollment_breakdown.dropped}</p>
                    )}
                    {cls.enrollment_breakdown?.completed > 0 && (
                      <p className="text-xs">🎓 Hoàn thành: {cls.enrollment_breakdown.completed}</p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {enrollmentPercentage >= 100 && (
              <span className="text-xs text-red-600 font-medium">Đầy</span>
            )}
          </div>
          {/* Payment Status */}
          {cls.payment_status?.has_unpaid && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center gap-1 text-xs text-amber-600">
                    <DollarSign className="h-3 w-3" />
                    <span>{cls.payment_status.unpaid_count} chưa đóng đủ</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{cls.payment_status.unpaid_count} học viên chưa đóng đủ học phí</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
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

          {/* Quick Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" title="Thao tác nhanh">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/admin/classes/${cls.id}/attendance`)}>
                📋 Điểm danh
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/admin/classes/${cls.id}/grades`)}>
                📊 Nhập điểm
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/admin/classes/${cls.id}/sessions`)}>
                📅 Xem lịch
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/admin/classes/${cls.id}/students`)}>
                👥 Học viên
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="h-3 w-3 mr-2" />
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-3 w-3 mr-2" />
                Xóa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  );
}

export default ClassesTable;
