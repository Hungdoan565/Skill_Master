import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  GraduationCap,
  CalendarCheck,
  Receipt,
  Wallet,
  Settings,
  Building2,
  UserCog,
  Home,
  DoorOpen,
  Sparkles,
  BarChart3,
  UserPlus,
  FileText,
  Award,
  Bell,
  TrendingUp,
  Headphones,
  MessageSquare,
  Calendar,
  AlertTriangle,
  Shield,
  ScrollText,
  ClipboardCheck,
  Trophy,
  GitCompareArrows,
  BellRing,
  CalendarClock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Import logo
import logoImage from '@/assets/logo.png';

// SUPER_ADMIN: Strategic menu — system overview, user management, audit
const superAdminMenuGroups = [
  {
    id: 'overview',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    ],
  },
  {
    id: 'system-management',
    title: 'QUẢN LÝ HỆ THỐNG',
    items: [
      { label: 'Trung tâm', icon: Building2, path: '/admin/centers' },

      { label: 'Nhật ký hệ thống', icon: ScrollText, path: '/admin/audit-trail', badge: 'new' },
      { label: 'Phê duyệt', icon: ClipboardCheck, path: '/admin/approvals' },
    ],
  },
  {
    id: 'training',
    title: 'QUẢN LÝ ĐÀO TẠO',
    items: [
      { label: 'Khóa học', icon: BookOpen, path: '/admin/courses' },
      { label: 'Lớp học', icon: GraduationCap, path: '/admin/classes' },
      { label: 'Lịch dạy', icon: CalendarCheck, path: '/admin/schedule' },
      { label: 'Phòng học', icon: DoorOpen, path: '/admin/rooms' },
    ],
  },
  {
    id: 'students-finance',
    title: 'HỌC VIÊN & TÀI CHÍNH',
    items: [
      { label: 'Học viên', icon: Users, path: '/admin/students' },
      { label: 'Ghi danh', icon: UserPlus, path: '/admin/enrollments' },
      { label: 'Hóa đơn', icon: Receipt, path: '/admin/invoices' },
      { label: 'Chứng chỉ', icon: Award, path: '/admin/certificates' },
      { label: 'Hóa đơn quá hạn', icon: AlertTriangle, path: '/admin/overdue-invoices' },
    ],
  },
  {
    id: 'analytics',
    title: 'PHÂN TÍCH & BÁO CÁO',
    items: [
      { label: 'Báo cáo', icon: BarChart3, path: '/admin/reports' },
      { label: 'Thông báo', icon: Bell, path: '/admin/notifications' },
      { label: 'Bảng xếp hạng', icon: Trophy, path: '/admin/leaderboard', badge: 'new' },
      { label: 'So sánh trung tâm', icon: GitCompareArrows, path: '/admin/center-comparison', badge: 'new' },
      { label: 'Cảnh báo tùy chỉnh', icon: BellRing, path: '/admin/custom-alerts', badge: 'new' },
      { label: 'Báo cáo định kỳ', icon: CalendarClock, path: '/admin/scheduled-reports', badge: 'new' },
      { label: 'Hỗ trợ & Tư vấn', icon: Headphones, path: '/admin/support' },
      { label: 'Tài liệu', icon: FileText, path: '/admin/documents' },
    ],
  },
];

// CENTER_MANAGER: Operational menu — training, students, staff
const managerMenuGroups = [
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
      { label: 'Lịch dạy', icon: CalendarCheck, path: '/admin/schedule' },
      { label: 'Phòng học', icon: DoorOpen, path: '/admin/rooms' },
    ],
  },
  {
    id: 'students-finance',
    title: 'VẬN HÀNH TRUNG TÂM',
    items: [
      { label: 'Học viên', icon: Users, path: '/admin/students' },
      { label: 'Ghi danh', icon: UserPlus, path: '/admin/enrollments' },
      { label: 'Hóa đơn', icon: Receipt, path: '/admin/invoices' },
      { label: 'Chứng chỉ', icon: Award, path: '/admin/certificates' },
      { label: 'Hóa đơn quá hạn', icon: AlertTriangle, path: '/admin/overdue-invoices' },
    ],
  },
  {
    id: 'internal',
    title: 'NỘI BỘ',
    items: [
      { label: 'Nhân sự', icon: UserCog, path: '/admin/staff' },
      { label: 'Đơn nghỉ phép', icon: Calendar, path: '/admin/leave-requests' },
      { label: 'Bảng lương', icon: Wallet, path: '/admin/payroll' },
      { label: 'Khiếu nại lương', icon: AlertTriangle, path: '/admin/payroll-disputes' },
    ],
  },
  {
    id: 'system',
    title: 'HỆ THỐNG',
    items: [
      { label: 'Thông báo', icon: Bell, path: '/admin/notifications' },
      { label: 'Tài liệu', icon: FileText, path: '/admin/documents' },
      { label: 'Báo cáo', icon: BarChart3, path: '/admin/reports' },
      { label: 'Hỗ trợ & Tư vấn', icon: Headphones, path: '/admin/support' },
    ],
  },
];

const VISITED_STORAGE_KEY = 'admin_sidebar_visited';

function getVisitedPaths() {
  try {
    return JSON.parse(localStorage.getItem(VISITED_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function AdminSidebar() {
  const location = useLocation();
  const { isSuperAdmin } = useAuth();
  const menuGroups = isSuperAdmin?.() ? superAdminMenuGroups : managerMenuGroups;
  const [visitedPaths, setVisitedPaths] = useState(getVisitedPaths);

  // Mark current path as visited (clears 'new' badge)
  useEffect(() => {
    const current = location.pathname;
    setVisitedPaths(prev => {
      if (prev.includes(current)) return prev;
      const updated = [...prev, current];
      localStorage.setItem(VISITED_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, [location.pathname]);
  return (
    <aside className="flex h-screen w-72 flex-col bg-zinc-950 text-white">
      {/* Logo - Premium feel with glow effect */}
      <Link
        to="/"
        className="relative flex h-20 items-center gap-3 px-5 transition-all group overflow-hidden"
      >
        {/* Subtle gradient glow on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-red-600/5 to-orange-500/0 
                        opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Logo Image */}
        <div className="relative flex items-center">
          <img
            src={logoImage}
            alt="Skill Master"
            className="h-14 w-auto object-contain brightness-0 invert
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
                const isComingSoon = item.badge === 'coming';

                return (
                  <Link
                    key={item.path}
                    to={isComingSoon ? '#' : item.path}
                    onClick={isComingSoon ? (e) => e.preventDefault() : undefined}
                    className={cn(
                      'group/item flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                      isComingSoon
                        ? 'text-zinc-600 cursor-not-allowed opacity-60'
                        : isActive
                          ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-600/25'
                          : 'text-zinc-400 hover:bg-zinc-800/80 hover:text-white'
                    )}
                  >
                    <div className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                      isComingSoon
                        ? 'bg-zinc-800/50'
                        : isActive
                          ? 'bg-white/20'
                          : 'bg-zinc-800 group-hover/item:bg-zinc-700'
                    )}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    <span>{item.label}</span>

                    {/* Badge indicator */}
                    {item.badge === 'new' && !visitedPaths.includes(item.path) && (
                      <span className="ml-auto rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                        Mới
                      </span>
                    )}
                    {item.badge === 'beta' && (
                      <span className="ml-auto rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                        Beta
                      </span>
                    )}
                    {item.badge === 'coming' && (
                      <span className="ml-auto rounded-full bg-zinc-700 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                        Sắp ra mắt
                      </span>
                    )}

                    {/* Active indicator dot */}
                    {isActive && !item.badge && (
                      <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white/80" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer - Settings (Super Admin only) */}
      {isSuperAdmin?.() && (
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
      )}
    </aside>
  );
}
