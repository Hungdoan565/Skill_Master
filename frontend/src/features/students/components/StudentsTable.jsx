/**
 * StudentsTable Component
 * Bảng danh sách học viên
 */

import { Mail, Phone, Calendar, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ColorAvatar } from './ColorAvatar';
import { ActionMenu } from './ActionMenu';
import { formatDate } from '../utils';

export function StudentsTable({ students = [], onViewDetails, onEdit, onPromote }) {
  if (students.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2">
        <AlertCircle className="h-10 w-10 text-slate-300" />
        <p className="text-muted-foreground">
          Không tìm thấy học viên phù hợp
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b text-left text-sm font-medium text-muted-foreground">
            <th className="pb-3 pr-4">Học viên</th>
            <th className="pb-3 pr-4">Liên hệ</th>
            <th className="pb-3 pr-4">Trạng thái</th>
            <th className="pb-3 pr-4">Ngày đăng ký</th>
            <th className="pb-3 text-right">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr
              key={student.id}
              className="border-b last:border-0 hover:bg-slate-50 transition-colors"
            >
              {/* Avatar + Name */}
              <td className="py-4 pr-4">
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
              </td>

              {/* Contact */}
              <td className="py-4 pr-4">
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
              </td>

              {/* Status */}
              <td className="py-4 pr-4">
                <Badge variant={student.status === 'active' ? 'success' : 'secondary'}>
                  {student.status === 'active' ? 'Hoạt động' : 'Ngừng'}
                </Badge>
              </td>

              {/* Created Date */}
              <td className="py-4 pr-4">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(student.created_at)}
                </div>
              </td>

              {/* Actions */}
              <td className="py-4 text-right">
                <ActionMenu
                  student={student}
                  onViewDetails={onViewDetails}
                  onEdit={onEdit}
                  onPromote={onPromote}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default StudentsTable;
