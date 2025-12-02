/**
 * QuickActionsCard Component
 * Card chứa các action nhanh
 */

import { UserPlus, BookOpen, CalendarPlus, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { QuickAction } from './QuickAction';

export function QuickActionsCard() {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'Thêm sinh viên',
      description: 'Đăng ký sinh viên mới',
      icon: UserPlus,
      color: 'emerald',
      onClick: () => navigate('/admin/students')
    },
    {
      title: 'Tạo khóa học',
      description: 'Thêm khóa học mới',
      icon: BookOpen,
      color: 'blue',
      onClick: () => navigate('/admin/courses')
    },
    {
      title: 'Tạo lớp học',
      description: 'Mở lớp học mới',
      icon: CalendarPlus,
      color: 'amber',
      onClick: () => navigate('/admin/classes')
    },
    {
      title: 'Xem hóa đơn',
      description: 'Quản lý thanh toán',
      icon: FileText,
      color: 'red',
      onClick: () => navigate('/admin/invoices')
    }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Thao tác nhanh</h3>
      <div className="space-y-2">
        {actions.map((action, index) => (
          <QuickAction
            key={index}
            title={action.title}
            description={action.description}
            icon={action.icon}
            color={action.color}
            onClick={action.onClick}
          />
        ))}
      </div>
    </div>
  );
}

export default QuickActionsCard;
