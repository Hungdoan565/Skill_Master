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
import { DashboardPage } from '@/pages/admin/dashboard-page';
import { CoursesPage } from '@/pages/admin/courses-page';
import { StaffPage } from '@/pages/admin/staff-page';
import { StudentsPage } from '@/pages/admin/students-page';
import { LoginPage } from '@/pages/auth/login-page';
import { AuthPage } from '@/pages/auth/auth-page';
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

const TeacherLayout = () => (
  <div style={{ padding: 16 }}>
    <nav style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
      <Link to="schedule">My Schedule</Link>
      <Link to="classes">My Classes</Link>
      <Link to="payroll">Payroll</Link>
    </nav>
    <Outlet />
  </div>
);

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

const LandingPage = () => {
  const [health, setHealth] = React.useState(null);

  React.useEffect(() => {
    axios.get('/api/health').then((res) => setHealth(res.data));
  }, []);

  return (
    <div className="bg-slate-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-indigo-800 py-20 text-white">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h1 className="text-4xl font-bold md:text-5xl">
            Nâng cao kỹ năng của bạn cùng Skill Master
          </h1>
          <p className="mt-4 text-lg text-indigo-100">
            Hệ thống đào tạo Anh ngữ và Tin học hàng đầu
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              to="/courses"
              className="rounded-md bg-white px-6 py-3 font-semibold text-indigo-600 hover:bg-indigo-50"
            >
              Xem khóa học
            </Link>
            <Link
              to="/login"
              className="rounded-md border border-white px-6 py-3 font-semibold text-white hover:bg-white/10"
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      </section>

      {/* Backend status (for dev) */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="text-xl font-semibold">Trạng thái hệ thống</h2>
        <pre className="mt-4 rounded-md bg-slate-800 p-4 text-sm text-slate-100">
          {JSON.stringify(health, null, 2)}
        </pre>
      </section>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="courses" element={<PlaceholderPage title="Course Catalog" />} />
          <Route path="courses/:id" element={<PlaceholderPage title="Course Detail" />} />
        </Route>

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
          <Route path="classes" element={<PlaceholderPage title="Quản lý Lớp học" description="Danh sách các lớp học" />} />
          <Route path="classes/:id" element={<PlaceholderPage title="Chi tiết Lớp học" />} />
          <Route path="scheduler" element={<PlaceholderPage title="Lịch học" description="Xếp lịch và quản lý phòng học" />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="students/:id" element={<PlaceholderPage title="Hồ sơ Học viên" />} />
          <Route path="enrollments/new" element={<PlaceholderPage title="Ghi danh" description="Đăng ký học viên vào lớp" />} />
          <Route path="invoices" element={<PlaceholderPage title="Quản lý Hóa đơn" description="Danh sách hóa đơn học phí" />} />
          <Route path="payrolls" element={<PlaceholderPage title="Bảng lương" description="Tính lương giáo viên" />} />
          <Route path="staff" element={<StaffPage />} />
          <Route path="centers" element={<PlaceholderPage title="Quản lý Trung tâm" description="Thông tin các chi nhánh" />} />
        </Route>

        {/* Teacher Routes - Chỉ TEACHER (và Admin cũng vào được) */}
        <Route path="teacher" element={
          <ProtectedRoute allowedRoles={['TEACHER', 'SUPER_ADMIN', 'CENTER_MANAGER']}>
            <TeacherLayout />
          </ProtectedRoute>
        }>
          <Route path="schedule" element={<PlaceholderPage title="Teacher • Schedule" />} />
          <Route path="classes" element={<PlaceholderPage title="Teacher • Classes" />} />
          <Route path="classes/:id/attendance" element={<PlaceholderPage title="Teacher • Attendance" />} />
          <Route path="classes/:id/gradebook" element={<PlaceholderPage title="Teacher • Gradebook" />} />
          <Route path="payroll" element={<PlaceholderPage title="Teacher • Payroll" />} />
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
  );
}

export default App;
