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
  Sparkles,
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
    <aside className="flex h-screen w-72 flex-col bg-zinc-950 text-white">
      {/* Logo - Premium feel with glow effect */}
      <Link 
        to="/"
        className="relative flex h-20 items-center gap-3 px-6 transition-all group overflow-hidden"
      >
        {/* Subtle gradient glow on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-red-600/5 to-orange-500/0 
                        opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative flex h-11 w-11 items-center justify-center rounded-xl 
                        bg-gradient-to-br from-red-500 to-orange-600 
                        shadow-lg shadow-red-500/25 
                        transition-transform group-hover:scale-105">
          <span className="font-display text-xl font-bold text-white">S</span>
          {/* Decorative dot */}
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-white rounded-full 
                          shadow-sm opacity-90" />
        </div>
        
        <div className="relative flex flex-col">
          <span className="font-display text-xl font-bold tracking-tight text-white">
            Skill Master
          </span>
          <span className="text-[11px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
            <Home className="h-3 w-3" />
            <span>Về trang chủ</span>
          </span>
        </div>
      </Link>

      {/* Divider with gradient */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent" />

      {/* Navigation - Refined spacing and styling */}
      <nav className="flex-1 overflow-y-auto scrollbar-none px-4 py-6">
        {menuGroups.map((group, index) => (
          <div key={group.id} className={cn(
            index > 0 && group.title ? 'mt-8' : 'mb-2'
          )}>
            {/* Group Title - More refined */}
            {group.title && (
              <h3 className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
                {group.title}
              </h3>
            )}
            {/* Group Items - Enhanced hover states */}
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'group/item flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-600/25'
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
                    
                    {/* Active indicator dot */}
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

      {/* Footer - Settings with premium feel */}
      <div className="p-4">
        {/* Divider */}
        <div className="mb-4 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
        
        <Link
          to="/admin/settings"
          className={cn(
            'group/settings flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
            location.pathname === '/admin/settings'
              ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-600/25'
              : 'text-zinc-400 hover:bg-zinc-800/80 hover:text-white'
          )}
        >
          <div className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
            location.pathname === '/admin/settings'
              ? 'bg-white/20' 
              : 'bg-zinc-800 group-hover/settings:bg-zinc-700'
          )}>
            <Settings className="h-4 w-4" />
          </div>
          <span>Cài đặt</span>
        </Link>
      </div>
    </aside>
  );
}
