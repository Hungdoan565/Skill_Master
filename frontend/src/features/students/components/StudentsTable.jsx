/**
 * StudentsTable Component (Refactored)
 * 
 * Bảng danh sách học viên - sử dụng DataTable component
 * ✅ Pagination, sorting, empty states
 * ✅ Consistent với các modules khác
 */

import { useMemo } from 'react';
import { Mail, Phone, Eye, Edit, UserCog } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { ColorAvatar } from './ColorAvatar';
import { formatDate } from '../utils';

export function StudentsTable({ 
  students = [], 
  loading = false,
  onViewDetails, 
  onEdit, 
  onPromote 
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
        <Badge variant={value === 'active' ? 'success' : 'secondary'}>
          {value === 'active' ? 'Hoạt động' : 'Ngừng'}
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
        </div>
      ),
    },
  ], [onViewDetails, onEdit, onPromote]);

  return (
    <DataTable
      columns={columns}
      data={students}
      loading={loading}
      rowKey="id"
      pagination
      pageSize={20}
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
