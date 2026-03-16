/**
 * StudentsTable Component (Refactored)
 * 
 * Bảng danh sách học viên - sử dụng DataTable component
 * ✅ Pagination, sorting, empty states
 * ✅ Consistent với các modules khác
 * ✅ Lock/Unlock + Reset Password (Super Admin)
 */

import { useMemo } from 'react';
import { Mail, Phone, Eye, Edit, UserCog, Lock, Unlock, KeyRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { ColorAvatar } from './ColorAvatar';
import { formatDate } from '../utils';

export function StudentsTable({ 
  students = [], 
  loading = false,
  selectedRows = [],
  onSelectionChange,
  currentPage = 1,
  pageSize = 20,
  totalItems = 0,
  onPageChange,
  onPageSizeChange,
  onViewDetails, 
  onEdit, 
  onPromote,
  onLockUser,
  onUnlockUser,
  onResetPassword,
  isSuperAdmin = false,
}) {
  // Define columns for DataTable
  const columns = useMemo(() => [
    {
      key: 'full_name',
      label: 'Học viên',
      sortable: true,
      render: (_, student) => (
        <div className="flex items-center gap-3">
          <ColorAvatar
            name={student.full_name}
            avatarUrl={student.avatar_url}
          />
          <div>
            <p className="font-medium text-slate-900">
              {student.full_name || 'Chưa cập nhật'}
            </p>
            <p className="text-xs text-muted-foreground">
              ID: {student.id.slice(0, 8)}...
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Liên hệ',
      sortable: true,
      render: (_, student) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-sm text-slate-600">
            <Mail className="h-3.5 w-3.5 text-slate-400" />
            {student.email}
          </div>
          {student.phone && (
            <div className="flex items-center gap-1.5 text-sm text-slate-600">
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              {student.phone}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Trạng thái',
      sortable: true,
      render: (value) => (
        <Badge variant={
          value === 'active' ? 'success' 
          : value === 'suspended' ? 'destructive' 
          : 'secondary'
        }>
          {value === 'active' ? 'Hoạt động' 
           : value === 'suspended' ? 'Đã khóa' 
           : 'Ngừng'}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      label: 'Ngày đăng ký',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(value)}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (_, student) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onViewDetails(student); }}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Xem chi tiết"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(student); }}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Chỉnh sửa"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onPromote(student); }}
            className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            title="Nâng cấp vai trò"
          >
            <UserCog className="h-4 w-4" />
          </button>

          {/* Lock / Unlock (SUPER_ADMIN only) */}
          {isSuperAdmin && (
            student.status === 'suspended' ? (
              <button
                onClick={(e) => { e.stopPropagation(); onUnlockUser?.(student.id); }}
                className="p-2 rounded-lg text-green-600 hover:text-green-700 hover:bg-green-50 transition-colors"
                title="Mở khóa tài khoản"
              >
                <Unlock className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); onLockUser?.(student.id); }}
                className="p-2 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Khóa tài khoản"
              >
                <Lock className="h-4 w-4" />
              </button>
            )
          )}

          {/* Reset Password (SUPER_ADMIN only) */}
          {isSuperAdmin && (
            <button
              onClick={(e) => { e.stopPropagation(); onResetPassword?.(student.id); }}
              className="p-2 rounded-lg text-amber-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
              title="Đặt lại mật khẩu"
            >
              <KeyRound className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ], [onViewDetails, onEdit, onPromote, onLockUser, onUnlockUser, onResetPassword, isSuperAdmin]);

  return (
    <DataTable
      columns={columns}
      data={students}
      loading={loading}
      rowKey="id"
      selectable
      selectedRows={selectedRows}
      onSelectionChange={onSelectionChange}
      pagination
      currentPage={currentPage}
      pageSize={pageSize}
      totalItems={totalItems}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      pageSizeOptions={[10, 20, 50, 100]}
      emptyVariant="search"
      emptyTitle="Không tìm thấy học viên"
      emptyDescription="Không có học viên nào phù hợp với bộ lọc của bạn"
      onRowClick={(row) => onViewDetails(row)}
      rowClassName="cursor-pointer"
    />
  );
}

export default StudentsTable;
