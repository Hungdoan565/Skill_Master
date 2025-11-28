import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  GraduationCap,
  Calendar,
  Receipt,
  Wallet,
  Settings,
  Building2,
  UserCog,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { label: 'Khóa học', icon: BookOpen, path: '/admin/courses' },
  { label: 'Lớp học', icon: GraduationCap, path: '/admin/classes' },
  { label: 'Lịch học', icon: Calendar, path: '/admin/scheduler' },
  { label: 'Học viên', icon: Users, path: '/admin/students' },
  { label: 'Hóa đơn', icon: Receipt, path: '/admin/invoices' },
  { label: 'Bảng lương', icon: Wallet, path: '/admin/payrolls' },
  { label: 'Nhân sự', icon: UserCog, path: '/admin/staff' },
  { label: 'Trung tâm', icon: Building2, path: '/admin/centers' },
];

export function AdminSidebar() {
  const location = useLocation();

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-slate-900 text-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-slate-700 px-6">
        <GraduationCap className="h-8 w-8 text-indigo-400" />
        <span className="text-xl font-bold">Skill Master</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-700 p-4">
        <Link
          to="/admin/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <Settings className="h-5 w-5" />
          Cài đặt
        </Link>
      </div>
    </aside>
  );
}
