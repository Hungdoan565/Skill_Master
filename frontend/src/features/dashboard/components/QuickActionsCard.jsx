/**
 * QuickActionsCard Component
 * Card chứa các action nhanh
 */

import { UserPlus, BookOpen, CalendarPlus, FileText, Zap } from 'lucide-react';
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
    <div className="bg-card rounded-2xl shadow-sm border border-border relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent pointer-events-none" />
      
      <div className="p-6 relative z-10">
        <h3 className="font-bold text-lg text-foreground mb-4 flex items-center gap-2">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
            <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          Thao tác nhanh
        </h3>
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
    </div>
  );
}

export default QuickActionsCard;
