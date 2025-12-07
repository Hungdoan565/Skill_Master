import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
  Link,
  useNavigate,
} from 'react-router-dom';
import { ChevronDown, LogOut, User, Settings, HelpCircle, LayoutDashboard } from 'lucide-react';
import { AdminLayout } from '@/layouts/admin-layout';
import { ToastProvider } from '@/components/ui/toast';
// REFACTORED: Import từ feature modules thay vì file monolithic
import { InvoicesPage } from '@/features/invoices';
import { ClassDetailPage } from '@/features/classes';
import { CoursesPage } from '@/features/courses';
import { ClassesPage } from '@/features/classes-list';
import { DashboardPage } from '@/features/dashboard';
import { StaffPage } from '@/features/staff';
import { RoomsPage } from '@/features/rooms';
import { StudentsPage, StudentDetailPage } from '@/features/students';
import { PayrollPage, TeacherPayrollPage } from '@/features/payroll';
import { SchedulePage } from '@/features/schedule';
import { GradesPage } from '@/features/grades';
import { CentersPage, CenterDetailPage } from '@/features/centers';
import { SettingsPage } from '@/features/settings';
import { EnrollmentsPage, NewEnrollmentPage } from '@/features/enrollments';
import { DocumentsPage } from '@/features/documents';
import { CertificatesPage, CertificateTypeDetailPage, CertificatePrintPage } from '@/features/certificates';
import { SupportPage } from '@/features/support';
import { TeacherDashboardPage } from '@/features/teacher-dashboard';
import { TeacherSchedulePage } from '@/features/teacher-schedule';
import { TeacherClassesPage } from '@/features/teacher-classes';
import { TeacherAvailabilityPage } from '@/features/teacher-availability';
import {
  ReportsPage,
  RevenueReportPage,
  EnrollmentReportPage,
  AttendanceReportPage,
  GradesReportPage,
  StaffReportPage,
  CoursesReportPage
} from '@/features/reports';
import { LoginPage } from '@/pages/auth/login-page';
import { AuthPage } from '@/pages/auth/auth-page';
import { LandingPage } from '@/pages/landing/landing-page';
import { CoursesPage as PublicCoursesPage } from '@/pages/public/courses-page';
import { AboutPage } from '@/pages/public/about-page';
import { BlogPage } from '@/pages/public/blog-page';
import { ContactPage } from '@/pages/public/contact-page-new';
import { RoadmapPage } from '@/pages/public/roadmap-page';
import { ProtectedRoute, GuestRoute, TeacherRoute, StudentRoute, AdminRoute } from '@/components/auth/protected-route';
import { useAuth } from '@/contexts/auth-context';

const PlaceholderPage = ({ title, description }) => (
  <div className="p-6">
    <h1 className="text-2xl font-bold">{title}</h1>
    {description && <p className="text-muted-foreground mt-2">{description}</p>}
  </div>
);

// Role Badge Component
const RoleBadge = ({ roleCode }) => {
  const roleConfig = {
    SUPER_ADMIN: { label: 'Super Admin', color: 'bg-red-100 text-red-700' },
    CENTER_MANAGER: { label: 'Quản lý', color: 'bg-purple-100 text-purple-700' },
    TEACHER: { label: 'Giáo viên', color: 'bg-blue-100 text-blue-700' },
    STUDENT: { label: 'Học viên', color: 'bg-green-100 text-green-700' },
  };
  const config = roleConfig[roleCode] || { label: 'User', color: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${config.color}`}>
      {config.label}
    </span>
  );
};

// User Dropdown Component cho Public Header
const UserDropdown = ({ user, profile, displayName, avatarUrl, roleCode, onLogout, getRedirectPath }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Kiểm tra có dashboard không
  const hasDashboard = roleCode && ['SUPER_ADMIN', 'CENTER_MANAGER', 'TEACHER'].includes(roleCode);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getGradient = (name) => {
    const gradients = [
      'from-indigo-500 to-purple-600',
      'from-pink-500 to-rose-600',
      'from-cyan-500 to-blue-600',
      'from-emerald-500 to-teal-600',
    ];
    return gradients[name ? name.charCodeAt(0) % gradients.length : 0];
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await onLogout();
  };

  const menuItems = [
    ...(hasDashboard ? [{
      label: 'Vào Dashboard',
      icon: LayoutDashboard,
      action: () => { setIsOpen(false); navigate(getRedirectPath()); },
      highlight: true,
    }] : []),
    {
      label: 'Hồ sơ cá nhân',
      icon: User,
      action: () => { setIsOpen(false); navigate('/profile'); },
    },
    {
      label: 'Cài đặt',
      icon: Settings,
      action: () => { setIsOpen(false); navigate('/settings'); },
    },
    {
      label: 'Trợ giúp',
      icon: HelpCircle,
      action: () => { setIsOpen(false); navigate('/help'); },
      divider: true,
    },
    {
      label: 'Đăng xuất',
      icon: LogOut,
      action: handleLogout,
      danger: true,
    },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 rounded-full pl-1 pr-3 py-1 transition-all duration-200
          hover:bg-slate-100 cursor-pointer border border-transparent
          ${isOpen ? 'bg-slate-100 border-slate-200' : ''}
        `}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} className="h-8 w-8 rounded-full object-cover ring-2 ring-white" />
        ) : (
          <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${getGradient(displayName)} text-xs font-semibold text-white ring-2 ring-white`}>
            {getInitials(displayName)}
          </div>
        )}
        <span className="text-sm font-medium text-slate-700 hidden sm:block max-w-[100px] truncate">{displayName}</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      <div
        className={`
          absolute right-0 top-full mt-2 w-72 origin-top-right
          rounded-xl border border-slate-200 bg-white py-2 shadow-xl shadow-slate-200/50
          transition-all duration-200 ease-out z-50
          ${isOpen
            ? 'opacity-100 scale-100 translate-y-0 visible'
            : 'opacity-0 scale-95 -translate-y-2 invisible pointer-events-none'
          }
        `}
      >
        {/* User Info Header */}
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="h-12 w-12 rounded-full object-cover ring-2 ring-slate-100" />
            ) : (
              <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${getGradient(displayName)} text-sm font-semibold text-white ring-2 ring-slate-100`}>
                {getInitials(displayName)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{displayName}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              <div className="mt-1">
                {roleCode && <RoleBadge roleCode={roleCode} />}
              </div>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="py-1">
          {menuItems.map((item, index) => (
            <div key={item.label}>
              {item.divider && <div className="my-1 border-t border-slate-100" />}
              <button
                onClick={item.action}
                className={`
                  w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150
                  ${item.danger
                    ? 'text-red-600 hover:bg-red-50'
                    : item.highlight
                      ? 'text-indigo-600 hover:bg-indigo-50 font-medium'
                      : 'text-slate-700 hover:bg-slate-50'
                  }
                `}
              >
                <item.icon className={`h-4 w-4 ${item.danger ? 'text-red-500' : item.highlight ? 'text-indigo-500' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.highlight && (
                  <span className="ml-auto text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded">Admin</span>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Header công khai với auth-aware button và hiển thị user info
const PublicHeader = () => {
  const { user, profile, isAuthenticated, getRedirectPath, signOut } = useAuth();
  const navigate = useNavigate();

  // Lấy thông tin user
  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || '';
  const avatarUrl = profile?.avatar_url;
  const roleCode = profile?.roles?.code || (user?.email?.includes('admin') ? 'SUPER_ADMIN' : null);

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <header className="border-b bg-white px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 transition-transform group-hover:scale-105">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <span className="text-xl font-bold text-slate-900">Skill Master</span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link to="/" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Trang chủ</Link>
          <Link to="/courses" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Khóa học</Link>

          {/* User Dropdown khi đã đăng nhập */}
          {isAuthenticated ? (
            <UserDropdown
              user={user}
              profile={profile}
              displayName={displayName}
              avatarUrl={avatarUrl}
              roleCode={roleCode}
              onLogout={handleLogout}
              getRedirectPath={getRedirectPath}
            />
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
                Đăng nhập
              </Link>
              <Link to="/register" className="rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-medium text-white hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm">
                Đăng ký
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

const PublicLayout = () => (
  <div className="min-h-screen">
    <PublicHeader />
    <Outlet />
  </div>
);

const TeacherLayout = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { path: '/teacher', label: 'Tổng quan', icon: '📊' },
    { path: '/teacher/schedule', label: 'Lịch dạy', icon: '📅' },
    { path: '/teacher/classes', label: 'Lớp học', icon: '📚' },
    { path: '/teacher/payroll', label: 'Bảng lương', icon: '💰' },
    { path: '/teacher/availability', label: 'Lịch trống', icon: '⏰' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Link to="/teacher" className="flex items-center gap-2">
                <span className="text-2xl">🎓</span>
                <span className="font-bold text-xl text-gray-900">Skill Master</span>
              </Link>
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                Giáo viên
              </span>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* User Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
                  {profile?.full_name?.charAt(0) || 'T'}
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700">
                  {profile?.full_name || 'Giáo viên'}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="font-medium text-gray-900">{profile?.full_name}</p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>
                  <Link
                    to="/teacher/profile"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User className="h-4 w-4" />
                    Thông tin cá nhân
                  </Link>
                  <Link
                    to="/teacher/settings"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings className="h-4 w-4" />
                    Cài đặt
                  </Link>
                  <div className="border-t border-gray-100 mt-2 pt-2">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                    >
                      <LogOut className="h-4 w-4" />
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-200 px-4 py-2 overflow-x-auto">
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors whitespace-nowrap"
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>
    </div>
  );
};

const StudentLayout = () => (
  <div style={{ padding: 16 }}>
    <nav style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
      <Link to="schedule">Schedule</Link>
      <Link to="results">Results</Link>
      <Link to="tuition">Tuition</Link>
      <Link to="materials">Materials</Link>
    </nav>
    <Outlet />
  </div>
);

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Landing Page - Standalone with its own header/footer */}
          <Route index element={<LandingPage />} />

          {/* Public Pages - Standalone with their own header/footer */}
          <Route path="about" element={<AboutPage />} />
          <Route path="resources" element={<BlogPage />} />
          <Route path="blog" element={<BlogPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="roadmap" element={<RoadmapPage />} />

          {/* Public Courses Page - Standalone with its own header/footer */}
          <Route path="courses" element={<PublicCoursesPage />} />
          <Route path="courses/:id" element={<PublicCoursesPage />} />

          {/* Auth Pages - Chỉ cho phép khi CHƯA đăng nhập */}
          <Route path="login" element={
            <GuestRoute>
              <AuthPage />
            </GuestRoute>
          } />
          <Route path="register" element={
            <GuestRoute>
              <AuthPage />
            </GuestRoute>
          } />

          {/* Protected Admin Routes - Chỉ SUPER_ADMIN và CENTER_MANAGER */}
          <Route path="admin" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'CENTER_MANAGER']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<DashboardPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="courses" element={<CoursesPage />} />
            <Route path="classes" element={<ClassesPage />} />
            <Route path="classes/:id" element={<ClassDetailPage />} />
            <Route path="schedule" element={<SchedulePage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="students/:id" element={<StudentDetailPage />} />
            <Route path="enrollments" element={<EnrollmentsPage />} />
            <Route path="enrollments/new" element={<NewEnrollmentPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="grades" element={<GradesPage />} />
            <Route path="payroll" element={<PayrollPage />} />
            <Route path="staff" element={<StaffPage />} />
            <Route path="centers" element={<CentersPage />} />
            <Route path="centers/:id" element={<CenterDetailPage />} />
            <Route path="rooms" element={<RoomsPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="certificates" element={<CertificatesPage />} />
            <Route path="certificates/type/:id" element={<CertificateTypeDetailPage />} />
            <Route path="certificates/:id/print" element={<CertificatePrintPage />} />
            <Route path="support" element={<SupportPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="reports/revenue" element={<RevenueReportPage />} />
            <Route path="reports/enrollment" element={<EnrollmentReportPage />} />
            <Route path="reports/attendance" element={<AttendanceReportPage />} />
            <Route path="reports/grades" element={<GradesReportPage />} />
            <Route path="reports/staff" element={<StaffReportPage />} />
            <Route path="reports/courses" element={<CoursesReportPage />} />
          </Route>

          {/* Teacher Routes - Chỉ TEACHER (và Admin cũng vào được) */}
          <Route path="teacher" element={
            <ProtectedRoute allowedRoles={['TEACHER', 'SUPER_ADMIN', 'CENTER_MANAGER']}>
              <TeacherLayout />
            </ProtectedRoute>
          }>
            <Route index element={<TeacherDashboardPage />} />
            <Route path="dashboard" element={<TeacherDashboardPage />} />
            <Route path="schedule" element={<TeacherSchedulePage />} />
            <Route path="classes" element={<TeacherClassesPage />} />
            <Route path="classes/:id" element={<PlaceholderPage title="Giáo viên • Chi tiết lớp học" />} />
            <Route path="classes/:id/attendance" element={<PlaceholderPage title="Giáo viên • Điểm danh" />} />
            <Route path="classes/:id/gradebook" element={<PlaceholderPage title="Giáo viên • Sổ điểm" />} />
            <Route path="payroll" element={<TeacherPayrollPage />} />
            <Route path="availability" element={<TeacherAvailabilityPage />} />
            <Route path="leave-requests" element={<PlaceholderPage title="Giáo viên • Đơn xin nghỉ" description="Quản lý đơn xin nghỉ phép" />} />
            <Route path="attendance" element={<PlaceholderPage title="Giáo viên • Điểm danh nhanh" />} />
            <Route path="profile" element={<PlaceholderPage title="Giáo viên • Thông tin cá nhân" />} />
            <Route path="settings" element={<PlaceholderPage title="Giáo viên • Cài đặt" />} />
          </Route>

          {/* Student Routes - Chỉ STUDENT */}
          <Route path="student" element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentLayout />
            </ProtectedRoute>
          }>
            <Route path="schedule" element={<PlaceholderPage title="Student • Schedule" />} />
            <Route path="results" element={<PlaceholderPage title="Student • Results" />} />
            <Route path="tuition" element={<PlaceholderPage title="Student • Tuition" />} />
            <Route path="materials" element={<PlaceholderPage title="Student • Materials" />} />
          </Route>

          <Route path="*" element={<PlaceholderPage title="404" description="Page not found" />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
