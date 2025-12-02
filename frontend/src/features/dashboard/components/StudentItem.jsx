/**
 * StudentItem Component
 * Hiển thị thông tin sinh viên trong danh sách
 */

import { Calendar } from 'lucide-react';

export function StudentItem({ student }) {
  // Get name from either 'name' or 'full_name' field
  const studentName = student.name || student.full_name;
  
  // Generate avatar from name
  const getInitials = (name) => {
    if (!name || name === 'N/A') return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const hasName = studentName && studentName !== 'N/A' && studentName !== 'Chưa cập nhật';

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
      {/* Avatar - solid orange */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
        <span className="text-sm font-semibold text-white">
          {hasName ? getInitials(studentName) : '?'}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">
          {hasName ? studentName : 'Chưa cập nhật'}
        </p>
        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
          <Calendar size={12} />
          {formatDate(student.created_at)}
        </p>
      </div>
    </div>
  );
}

export default StudentItem;
