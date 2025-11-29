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
  Home,
  DoorOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Menu được gom nhóm theo chức năng
const menuGroups = [
  {
    id: 'overview',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    ],
  },
  {
    id: 'training',
    title: 'QUẢN LÝ ĐÀO TẠO',
    items: [
      { label: 'Khóa học', icon: BookOpen, path: '/admin/courses' },
      { label: 'Lớp học', icon: GraduationCap, path: '/admin/classes' },
      { label: 'Lịch học', icon: Calendar, path: '/admin/scheduler' },
    ],
  },
  {
    id: 'students-finance',
    title: 'HỌC VIÊN & TÀI CHÍNH',
    items: [
      { label: 'Học viên', icon: Users, path: '/admin/students' },
      { label: 'Hóa đơn', icon: Receipt, path: '/admin/invoices' },
    ],
  },
  {
    id: 'internal',
    title: 'NỘI BỘ',
    items: [
      { label: 'Nhân sự', icon: UserCog, path: '/admin/staff' },
      { label: 'Bảng lương', icon: Wallet, path: '/admin/payrolls' },
    ],
  },
  {
    id: 'system',
    title: 'HỆ THỐNG',
    items: [
      { label: 'Trung tâm', icon: Building2, path: '/admin/centers' },
      { label: 'Phòng học', icon: DoorOpen, path: '/admin/rooms' },
    ],
  },
];

export function AdminSidebar() {
  const location = useLocation();

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-slate-900 text-white">
      {/* Logo - Click để về trang chủ */}
      <Link 
        to="/"
        className="flex h-16 items-center gap-2 border-b border-slate-700 px-6 transition-all hover:bg-slate-800 group"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 transition-transform group-hover:scale-105">
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold leading-tight">Skill Master</span>
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <Home className="h-2.5 w-2.5" />
            Về trang chủ
          </span>
        </div>
      </Link>

      {/* Navigation - Gom nhóm */}
      <nav className="flex-1 overflow-y-auto p-4">
        {menuGroups.map((group, index) => (
          <div key={group.id} className={cn(
            // Tăng khoảng cách giữa các nhóm (trừ nhóm đầu)
            index > 0 && group.title ? 'mt-6' : 'mb-1'
          )}>
            {/* Group Title - Tăng độ sáng, tracking-wider */}
            {group.title && (
              <h3 className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                {group.title}
              </h3>
            )}
            {/* Group Items */}
            <div className="space-y-1">
              {group.items.map((item) => {
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
            </div>
          </div>
        ))}
      </nav>

      {/* Footer - Thêm border-t để tách biệt khu vực System */}
      <div className="border-t border-slate-700/50 p-4">
        <Link
          to="/admin/settings"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            location.pathname === '/admin/settings'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          )}
        >
          <Settings className="h-5 w-5" />
          Cài đặt
        </Link>
      </div>
    </aside>
  );
}
