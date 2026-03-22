/**
 * StaffTable Component
 * Bảng danh sách nhân viên - Full features version
 */

import { Pencil, Trash2, Eye, RotateCcw, DollarSign, Building2, Lock, Unlock, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ColorAvatar } from './ColorAvatar';
import { RoleBadge } from './RoleBadge';
import { formatDate } from '../utils';

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN').format(amount || 0);
};

export function StaffTable({
  staff = [],
  onViewDetail,
  onEdit,
  onDelete,
  onRestore,
  onLockUser,
  onUnlockUser,
  onResetPassword,
  isSuperAdmin = false,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-full whitespace-nowrap md:whitespace-normal">
        <thead>
          <tr className="border-b text-left text-sm font-medium text-muted-foreground">
            <th className="pb-3 pr-4">Nhân viên</th>
            <th className="pb-3 pr-4">Liên hệ</th>
            <th className="pb-3 pr-4">Vai trò</th>
            <th className="pb-3 pr-4">Lương/giờ</th>
            <th className="pb-3 pr-4">Trạng thái</th>
            <th className="pb-3 text-right">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {staff.map((member) => (
            <tr
              key={member.id}
              className={`border-b last:border-0 hover:bg-muted/50 transition-colors ${member.status === 'inactive' || member.status === 'suspended' ? 'opacity-60' : ''
                }`}
            >
              {/* Avatar + Name + Center */}
              <td className="py-4 pr-4">
                <div className="flex items-center gap-3">
                  <ColorAvatar
                    name={member.full_name}
                    avatarUrl={member.avatar_url}
                  />
                  <div>
                    <p className="font-medium text-foreground">
                      {member.full_name}
                    </p>
                    {member.centers?.name && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {member.centers.name}
                      </p>
                    )}
                  </div>
                </div>
              </td>

              {/* Contact */}
              <td className="py-4 pr-4">
                <div className="space-y-0.5">
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                  {member.phone && (
                    <p className="text-xs text-muted-foreground">{member.phone}</p>
                  )}
                </div>
              </td>

              {/* Role Badge */}
              <td className="py-4 pr-4">
                <RoleBadge roleCode={member.roles?.code || 'TEACHER'} />
              </td>

              {/* Hourly Rate (for teachers) */}
              <td className="py-4 pr-4">
                {member.roles?.code === 'TEACHER' ? (
                  <div className="flex items-center gap-1 text-sm text-emerald-700 dark:text-emerald-400">
                    <DollarSign className="h-3.5 w-3.5" />
                    {formatCurrency(member.hourly_rate || 150000)}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </td>

              {/* Status */}
              <td className="py-4 pr-4">
                <Badge variant={
                  member.status === 'active' ? 'success'
                    : member.status === 'suspended' ? 'destructive'
                      : 'secondary'
                }>
                  {member.status === 'active' ? 'Hoạt động'
                    : member.status === 'suspended' ? 'Đã khóa'
                      : 'Ngừng'}
                </Badge>
              </td>

              {/* Actions */}
              <td className="py-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  {/* View Detail */}
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Xem chi tiết"
                    onClick={() => onViewDetail?.(member)}
                  >
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </Button>

                  {/* Edit */}
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Chỉnh sửa"
                    onClick={() => onEdit?.(member)}
                  >
                    <Pencil className="h-4 w-4 text-blue-500" />
                  </Button>

                  {/* Lock / Unlock (SUPER_ADMIN only) */}
                  {isSuperAdmin && (
                    member.status === 'suspended' ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Mở khóa tài khoản"
                        onClick={() => onUnlockUser?.(member.id)}
                      >
                        <Unlock className="h-4 w-4 text-green-600" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Khóa tài khoản"
                        onClick={() => onLockUser?.(member.id)}
                        disabled={member.roles?.code === 'SUPER_ADMIN'}
                      >
                        <Lock className="h-4 w-4 text-red-500" />
                      </Button>
                    )
                  )}

                  {/* Reset Password (SUPER_ADMIN only) */}
                  {isSuperAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Đặt lại mật khẩu"
                      onClick={() => onResetPassword?.(member.id)}
                    >
                      <KeyRound className="h-4 w-4 text-amber-500" />
                    </Button>
                  )}

                  {/* Delete or Restore */}
                  {member.status === 'inactive' ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Khôi phục"
                      onClick={() => onRestore?.(member.id)}
                    >
                      <RotateCcw className="h-4 w-4 text-green-500" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      title="Xóa"
                      onClick={() => onDelete?.(member)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
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
