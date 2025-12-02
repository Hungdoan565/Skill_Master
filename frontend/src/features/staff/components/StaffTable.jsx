/**
 * StaffTable Component
 * Bảng danh sách nhân viên
 */

import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ColorAvatar } from './ColorAvatar';
import { RoleBadge } from './RoleBadge';
import { formatDate } from '../utils';

export function StaffTable({ staff = [], onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b text-left text-sm font-medium text-muted-foreground">
            <th className="pb-3 pr-4">Nhân viên</th>
            <th className="pb-3 pr-4">Email</th>
            <th className="pb-3 pr-4">Vai trò</th>
            <th className="pb-3 pr-4">Trạng thái</th>
            <th className="pb-3 pr-4">Ngày tạo</th>
            <th className="pb-3 text-right">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {staff.map((member) => (
            <tr
              key={member.id}
              className="border-b last:border-0 hover:bg-slate-50 transition-colors"
            >
              {/* Avatar + Name */}
              <td className="py-4 pr-4">
                <div className="flex items-center gap-3">
                  <ColorAvatar 
                    name={member.full_name} 
                    avatarUrl={member.avatar_url}
                  />
                  <div>
                    <p className="font-medium text-slate-900">
                      {member.full_name}
                    </p>
                    {member.phone && (
                      <p className="text-sm text-muted-foreground">
                        {member.phone}
                      </p>
                    )}
                  </div>
                </div>
              </td>
              
              {/* Email */}
              <td className="py-4 pr-4">
                <span className="text-sm text-slate-600">
                  {member.email}
                </span>
              </td>
              
              {/* Role Badge */}
              <td className="py-4 pr-4">
                <RoleBadge roleCode={member.roles?.code || 'TEACHER'} />
              </td>
              
              {/* Status */}
              <td className="py-4 pr-4">
                <Badge variant={member.status === 'active' ? 'success' : 'secondary'}>
                  {member.status === 'active' ? 'Hoạt động' : 'Ngừng'}
                </Badge>
              </td>
              
              {/* Created Date */}
              <td className="py-4 pr-4 text-sm text-muted-foreground">
                {formatDate(member.created_at)}
              </td>
              
              {/* Actions */}
              <td className="py-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    title="Chỉnh sửa"
                    onClick={() => onEdit?.(member)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    title="Xóa"
                    onClick={() => onDelete?.(member)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default StaffTable;
