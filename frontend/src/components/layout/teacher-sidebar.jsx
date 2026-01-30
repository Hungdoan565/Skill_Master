import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  DollarSign,
  Clock,
  Home,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Import logo
import logoImage from '@/assets/logo.png';

// Menu items for teacher portal
const menuGroups = [
  {
    id: 'overview',
    items: [
      { label: 'Tổng quan', icon: LayoutDashboard, path: '/teacher' },
    ],
  },
  {
    id: 'teaching',
    title: 'GIẢNG DẠY',
    items: [
      { label: 'Lịch dạy', icon: CalendarDays, path: '/teacher/schedule' },
      { label: 'Lớp học', icon: BookOpen, path: '/teacher/classes' },
      { label: 'Điểm danh', icon: ClipboardCheck, path: '/teacher/attendance' },
    ],
  },
  {
    id: 'management',
    title: 'QUẢN LÝ',
    items: [
      { label: 'Bảng lương', icon: DollarSign, path: '/teacher/payroll' },
      { label: 'Lịch trống', icon: Clock, path: '/teacher/availability' },
    ],
  },
];

export function TeacherSidebar() {
  const location = useLocation();

  return (
    <aside className="flex h-screen w-72 flex-col bg-zinc-950 text-white">
      {/* Logo */}
      <Link
        to="/"
        aria-label="Về trang chủ Skill Master"
        className="relative flex h-20 items-center gap-3 px-5 transition-all group overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/5 to-indigo-500/0 
                        opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative flex items-center">
          <img
            src={logoImage}
            alt="Skill Master"
            className="h-12 w-auto object-contain brightness-0 invert
                       group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="relative flex flex-col ml-1">
          <span className="text-[11px] text-zinc-500 flex items-center gap-1.5">
            <Home className="h-3 w-3" />
            <span>Về trang chủ</span>
          </span>
        </div>
      </Link>

      {/* Divider */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent" />

      {/* Role Badge */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600/10 border border-blue-600/20">
          <GraduationCap className="h-4 w-4 text-blue-400" />
          <span className="text-xs font-medium text-blue-400">Giáo viên</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-none px-4 py-4">
        {menuGroups.map((group, index) => (
          <div key={group.id} className={cn(
            index > 0 && group.title ? 'mt-8' : 'mb-2'
          )}>
            {group.title && (
              <h3 className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
                {group.title}
              </h3>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = location.pathname === item.path || 
                  (item.path === '/teacher' && location.pathname === '/teacher/dashboard');

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'group/item flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50',
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-600/25'
                        : 'text-zinc-400 hover:bg-zinc-800/80 hover:text-white'
                    )}
                  >
                    <div className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                      isActive
                        ? 'bg-white/20'
                        : 'bg-zinc-800 group-hover/item:bg-zinc-700'
                    )}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    <span>{item.label}</span>
                    {isActive && (
                      <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white/80" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4">
        <div className="mb-4 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
        <Link
          to="/teacher/profile"
          className="group/support flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800/80 hover:text-white transition-all duration-200"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 group-hover/support:bg-zinc-700 transition-colors">
            <HelpCircle className="h-4 w-4" />
          </div>
          <span>Hỗ trợ</span>
        </Link>
      </div>
    </aside>
  );
}
