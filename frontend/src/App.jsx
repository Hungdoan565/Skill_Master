import '@/lib/i18n.js';
import React, { useState, useRef, useEffect, Suspense, lazy } from 'react';
import i18n from 'i18next';
import { I18nextProvider } from 'react-i18next';
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
import { StudentLayout } from '@/layouts/student-layout';
import { TeacherLayout } from '@/layouts/teacher-layout';
import { ParentLayout } from '@/layouts/parent-layout';
const StudentDashboard = lazy(() => import('@/features/student-portal').then(m => ({ default: m.StudentDashboard })));
const StudentSchedule = lazy(() => import('@/features/student-portal').then(m => ({ default: m.StudentSchedule })));
const StudentGrades = lazy(() => import('@/features/student-portal').then(m => ({ default: m.StudentGrades })));
const StudentAttendance = lazy(() => import('@/features/student-portal').then(m => ({ default: m.StudentAttendance })));
const StudentTuition = lazy(() => import('@/features/student-portal').then(m => ({ default: m.StudentTuition })));
const StudentPayment = lazy(() => import('@/features/student-portal').then(m => ({ default: m.StudentPayment })));
const StudentCertificates = lazy(() => import('@/features/student-portal').then(m => ({ default: m.StudentCertificates })));
const StudentSupportPage = lazy(() => import('@/features/student-portal').then(m => ({ default: m.StudentSupportPage })));

const ParentDashboard = lazy(() => import('@/features/parent-portal').then(m => ({ default: m.ParentDashboard })));
const ParentChildDetail = lazy(() => import('@/features/parent-portal').then(m => ({ default: m.ParentChildDetail })));
const ParentSchedulePage = lazy(() => import('@/features/parent-portal').then(m => ({ default: m.ParentSchedulePage })));
const ParentGradesPage = lazy(() => import('@/features/parent-portal').then(m => ({ default: m.ParentGradesPage })));
const ParentAttendancePage = lazy(() => import('@/features/parent-portal').then(m => ({ default: m.ParentAttendancePage })));
const ParentInvoicesPage = lazy(() => import('@/features/parent-portal').then(m => ({ default: m.ParentInvoicesPage })));
const ParentProfilePage = lazy(() => import('@/features/parent-portal').then(m => ({ default: m.ParentProfilePage })));

const TeacherLeaveRequestsPage = lazy(() => import('@/features/teacher-leave').then(m => ({ default: m.TeacherLeaveRequestsPage })));

const TeacherProfilePage = lazy(() => import('@/features/teacher-profile').then(m => ({ default: m.TeacherProfilePage })));
const TeacherSettingsPage = lazy(() => import('@/features/teacher-profile').then(m => ({ default: m.TeacherSettingsPage })));

import NotFoundPage from '@/components/NotFoundPage';
import { ToastProvider } from '@/components/ui/toast';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import { DashboardSkeleton, PageSkeleton, TableSkeleton } from '@/components/skeletons';
// REFACTORED: Import từ feature modules thay vì file monolithic
const InvoicesPage = lazy(() => import('@/features/invoices').then(m => ({ default: m.InvoicesPage })));
const OverdueDashboardPage = lazy(() => import('@/features/invoices').then(m => ({ default: m.OverdueDashboardPage })));

const FinancialDashboardPage = lazy(() => import('@/features/finance').then(m => ({ default: m.FinancialDashboardPage })));

const ClassDetailPage = lazy(() => import('@/features/classes').then(m => ({ default: m.ClassDetailPage })));

const CoursesPage = lazy(() => import('@/features/courses').then(m => ({ default: m.CoursesPage })));

const ClassesPage = lazy(() => import('@/features/classes-list').then(m => ({ default: m.ClassesPage })));

const DashboardPage = lazy(() => import('@/features/dashboard').then(m => ({ default: m.DashboardPage })));

const StaffPage = lazy(() => import('@/features/staff').then(m => ({ default: m.StaffPage })));
const SalaryConfigPage = lazy(() => import('@/features/staff').then(m => ({ default: m.SalaryConfigPage })));

const RoomsPage = lazy(() => import('@/features/rooms').then(m => ({ default: m.RoomsPage })));

const StudentsPage = lazy(() => import('@/features/students').then(m => ({ default: m.StudentsPage })));
const StudentDetailPage = lazy(() => import('@/features/students').then(m => ({ default: m.StudentDetailPage })));

const PayrollPage = lazy(() => import('@/features/payroll').then(m => ({ default: m.PayrollPage })));
const TeacherPayrollPage = lazy(() => import('@/features/payroll').then(m => ({ default: m.TeacherPayrollPage })));
const DisputeManagementPage = lazy(() => import('@/features/payroll').then(m => ({ default: m.DisputeManagementPage })));

const SchedulePage = lazy(() => import('@/features/schedule').then(m => ({ default: m.SchedulePage })));

const HolidaysPage = lazy(() => import('@/features/holidays').then(m => ({ default: m.HolidaysPage })));

const GradesPage = lazy(() => import('@/features/grades').then(m => ({ default: m.GradesPage })));

const CentersPage = lazy(() => import('@/features/centers').then(m => ({ default: m.CentersPage })));
const CenterDetailPage = lazy(() => import('@/features/centers').then(m => ({ default: m.CenterDetailPage })));

const SettingsPage = lazy(() => import('@/features/settings').then(m => ({ default: m.SettingsPage })));

const EnrollmentsPage = lazy(() => import('@/features/enrollments').then(m => ({ default: m.EnrollmentsPage })));
const NewEnrollmentPage = lazy(() => import('@/features/enrollments').then(m => ({ default: m.NewEnrollmentPage })));

const DocumentsPage = lazy(() => import('@/features/documents').then(m => ({ default: m.DocumentsPage })));

const CertificatesPage = lazy(() => import('@/features/certificates').then(m => ({ default: m.CertificatesPage })));
const CertificateTypeDetailPage = lazy(() => import('@/features/certificates').then(m => ({ default: m.CertificateTypeDetailPage })));
const CertificatePrintPage = lazy(() => import('@/features/certificates').then(m => ({ default: m.CertificatePrintPage })));
const CertificateListPage = lazy(() => import('@/features/certificates').then(m => ({ default: m.CertificateListPage })));
const CertificateBulkPrintPage = lazy(() => import('@/features/certificates').then(m => ({ default: m.CertificateBulkPrintPage })));
const CertificateViewPage = lazy(() => import('@/features/certificates').then(m => ({ default: m.CertificateViewPage })));

const PublicCertificateVerification = lazy(() => import('@/features/certificates/pages/PublicCertificateVerification').then(m => ({ default: m.PublicCertificateVerification })));

const SupportPage = lazy(() => import('@/features/support').then(m => ({ default: m.SupportPage })));

const TeacherDashboardPage = lazy(() => import('@/features/teacher-dashboard').then(m => ({ default: m.TeacherDashboardPage })));

const AdminNotificationsPage = lazy(() => import('@/features/notifications/AdminNotificationsPage'));

const TeacherSchedulePage = lazy(() => import('@/features/teacher-schedule').then(m => ({ default: m.TeacherSchedulePage })));

const TeacherClassesPage = lazy(() => import('@/features/teacher-classes').then(m => ({ default: m.TeacherClassesPage })));

const TeacherAvailabilityPage = lazy(() => import('@/features/teacher-availability').then(m => ({ default: m.TeacherAvailabilityPage })));

const TeacherClassDetailPage = lazy(() => import('@/features/teacher-attendance').then(m => ({ default: m.TeacherClassDetailPage })));
const TeacherAttendancePage = lazy(() => import('@/features/teacher-attendance').then(m => ({ default: m.TeacherAttendancePage })));
const TeacherQuickAttendancePage = lazy(() => import('@/features/teacher-attendance').then(m => ({ default: m.TeacherQuickAttendancePage })));

const TeacherGradebookPage = lazy(() => import('@/features/teacher-gradebook').then(m => ({ default: m.TeacherGradebookPage })));

const ReportsPage = lazy(() => import('@/features/reports').then(m => ({ default: m.ReportsPage })));
const RevenueReportPage = lazy(() => import('@/features/reports').then(m => ({ default: m.RevenueReportPage })));
const EnrollmentReportPage = lazy(() => import('@/features/reports').then(m => ({ default: m.EnrollmentReportPage })));
const AttendanceReportPage = lazy(() => import('@/features/reports').then(m => ({ default: m.AttendanceReportPage })));
const GradesReportPage = lazy(() => import('@/features/reports').then(m => ({ default: m.GradesReportPage })));
const StaffReportPage = lazy(() => import('@/features/reports').then(m => ({ default: m.StaffReportPage })));
const CoursesReportPage = lazy(() => import('@/features/reports').then(m => ({ default: m.CoursesReportPage })));

import { LoginPage } from '@/pages/auth/login-page';
import { AuthPage } from '@/pages/auth/auth-page';
import { LandingPage } from '@/pages/landing/landing-page';
import { CoursesPage as PublicCoursesPage } from '@/pages/public/courses';
import { CourseDetailPage } from '@/pages/public/courses/detail';
import { ProtectedRoute, GuestRoute, TeacherRoute, StudentRoute, AdminRoute, ParentRoute } from '@/components/auth/protected-route';
import { useAuth } from '@/contexts/auth-context';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/contexts/theme-context';

// ============================================
// LAZY LOADED COMPONENTS (Code Splitting)
// ============================================
// Heavy public pages loaded on-demand for better initial bundle
const AboutPage = lazy(() => import('@/pages/public/about').then(m => ({ default: m.AboutPage })));
const BlogPage = lazy(() => import('@/pages/public/blog').then(m => ({ default: m.BlogPage })));
const BlogDetailPage = lazy(() => import('@/pages/public/blog/[slug]'));
const ContactPage = lazy(() => import('@/pages/public/contact').then(m => ({ default: m.ContactPage })));
const RoadmapPage = lazy(() => import('@/pages/public/roadmap').then(m => ({ default: m.RoadmapPage })));
const AssessmentPage = lazy(() => import('@/pages/public/resources/assessment').then(m => ({ default: m.AssessmentPage })));
const QuizPage = lazy(() => import('@/pages/public/resources/assessment/[slug]/page').then(m => ({ default: m.QuizPage })));
const ResultPage = lazy(() => import('@/pages/public/resources/assessment/[slug]/result').then(m => ({ default: m.ResultPage })));
const MessagingPage = lazy(() => import('@/features/messaging/pages/MessagingPage').then(m => ({ default: m.MessagingPage })));
const AnalyticsDashboardPage = lazy(() => import('@/features/analytics').then(m => ({ default: m.AnalyticsDashboardPage })));
const LeaveManagementPage = lazy(() => import('@/features/leave-management').then(m => ({ default: m.LeaveManagementPage })));
const AuditLogPage = lazy(() => import('@/features/audit').then(m => ({ default: m.AuditLogPage })));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-zinc-200 border-t-red-600 rounded-full animate-spin" />
      <p className="text-zinc-500 text-sm font-medium">Đang tải...</p>
    </div>
  </div>
);

// Role Badge Component
const RoleBadge = ({ roleCode }) => {
  const roleConfig = {
    SUPER_ADMIN: { label: 'Super Admin', color: 'bg-red-500/10 text-red-700 ring-1 ring-inset ring-red-600/20' },
    CENTER_MANAGER: { label: 'Quản lý', color: 'bg-purple-500/10 text-purple-700 ring-1 ring-inset ring-purple-600/20' },
    TEACHER: { label: 'Giáo viên', color: 'bg-blue-500/10 text-blue-700 ring-1 ring-inset ring-blue-600/20' },
    STUDENT: { label: 'Học viên', color: 'bg-green-500/10 text-green-700 ring-1 ring-inset ring-green-600/20' },
    PARENT: { label: 'Phụ huynh', color: 'bg-amber-500/10 text-amber-700 ring-1 ring-inset ring-amber-600/20' },
  };
  const config = roleConfig[roleCode] || { label: 'User', color: 'bg-gray-500/10 text-gray-700 ring-1 ring-inset ring-gray-600/20' };
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
  const hasDashboard = roleCode && ['SUPER_ADMIN', 'CENTER_MANAGER', 'TEACHER', 'PARENT'].includes(roleCode);

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

      {/* Dropdown Menu - Landing Page Style */}
      <div
        className={`
          absolute right-0 top-full mt-2 w-64 origin-top-right
          rounded-2xl border border-zinc-200/80 bg-white py-2 
          shadow-xl shadow-zinc-200/50
          transition-all duration-200 ease-out z-50
          ${isOpen
            ? 'opacity-100 scale-100 translate-y-0 visible'
            : 'opacity-0 scale-95 -translate-y-2 invisible pointer-events-none'
          }
        `}
      >
        {/* User Info Header */}
        <div className="px-4 py-3 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="h-11 w-11 rounded-full object-cover" />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white">
                {getInitials(displayName)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-900 truncate">{displayName}</p>
              <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
            </div>
          </div>
          {roleCode && (
            <span className={`mt-2 inline-block text-[10px] font-medium px-2 py-0.5 rounded-full ${roleCode === 'SUPER_ADMIN' ? 'bg-red-100 text-red-700' : 'bg-zinc-100 text-zinc-700'}`}>
              {roleCode}
            </span>
          )}
        </div>
      </div>

      {/* Menu Items */}
      <div className="py-1">
        {menuItems.filter(item => !['Trợ giúp'].includes(item.label)).map((item, index) => (
          <div key={item.label}>
            {item.divider && <div className="my-1 mx-3 border-t border-zinc-100" />}
            <button
              onClick={item.action}
              className={`
                  w-full flex items-center gap-3 px-4 py-2.5 text-sm
                  transition-colors duration-150
                  ${item.danger
                  ? 'text-red-600 hover:bg-red-50'
                  : item.highlight
                    ? 'text-indigo-600 hover:bg-indigo-50'
                    : 'text-zinc-700 hover:bg-zinc-50'
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
  );
};

// Header công khai với auth-aware button và hiển thị user info
const PublicHeader = () => {
  const { user, profile, isAuthenticated, getRedirectPath, signOut } = useAuth();
  const navigate = useNavigate();

  // Lấy thông tin user
  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || '';
  const avatarUrl = profile?.avatar_url;
  const roleCode = profile?.roles?.code || null;

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

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <BrowserRouter>
          <Routes>
            {/* Landing Page - Standalone with its own header/footer */}
            <Route index element={<LandingPage />} />

            {/* Public Pages - Lazy loaded with Suspense */}
            <Route path="about" element={<Suspense fallback={<PageLoader />}><AboutPage /></Suspense>} />
            <Route path="resources" element={<Suspense fallback={<PageLoader />}><BlogPage /></Suspense>} />
            <Route path="blog" element={<Suspense fallback={<PageLoader />}><BlogPage /></Suspense>} />
            <Route path="blog/:slug" element={<Suspense fallback={<PageLoader />}><BlogDetailPage /></Suspense>} />
            <Route path="contact" element={<Suspense fallback={<PageLoader />}><ContactPage /></Suspense>} />
            <Route path="roadmap" element={<Suspense fallback={<PageLoader />}><RoadmapPage /></Suspense>} />
            <Route path="roadmap/:slug" element={<Suspense fallback={<PageLoader />}><RoadmapPage /></Suspense>} />

            {/* Assessment/Placement Test Pages - Lazy loaded */}
            <Route path="assessment" element={<Suspense fallback={<PageLoader />}><AssessmentPage /></Suspense>} />
            <Route path="assessment/:slug" element={<Suspense fallback={<PageLoader />}><QuizPage /></Suspense>} />
            <Route path="assessment/:slug/result" element={<Suspense fallback={<PageLoader />}><ResultPage /></Suspense>} />

            {/* Public Courses Page - Standalone with its own header/footer */}
            <Route path="courses" element={<PublicCoursesPage />} />
            <Route path="courses/:id" element={<CourseDetailPage />} />

            {/* Public Certificate Verification - No login required */}
            <Route path="verify-certificate" element={<PublicCertificateVerification />} />
            <Route path="certificates/:id/view" element={<Suspense fallback={<PageSkeleton />}><CertificateViewPage /></Suspense>} />
            <Route path="certificates/:id/print" element={<Suspense fallback={<PageSkeleton />}><CertificatePrintPage /></Suspense>} />

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
              <Route index element={<Suspense fallback={<DashboardSkeleton />}><DashboardPage /></Suspense>} />
              <Route path="dashboard" element={<Suspense fallback={<DashboardSkeleton />}><DashboardPage /></Suspense>} />
              <Route path="courses" element={<Suspense fallback={<TableSkeleton />}><CoursesPage /></Suspense>} />
              <Route path="classes" element={<Suspense fallback={<TableSkeleton />}><ClassesPage /></Suspense>} />
              <Route path="classes/:id" element={<Suspense fallback={<PageSkeleton />}><ClassDetailPage /></Suspense>} />
              <Route path="schedule" element={<Suspense fallback={<TableSkeleton />}><SchedulePage /></Suspense>} />
              <Route path="students" element={<Suspense fallback={<TableSkeleton />}><StudentsPage /></Suspense>} />
              <Route path="students/:id" element={<Suspense fallback={<PageSkeleton />}><StudentDetailPage /></Suspense>} />
              <Route path="enrollments" element={<Suspense fallback={<PageSkeleton />}><EnrollmentsPage /></Suspense>} />
              <Route path="enrollments/new" element={<Suspense fallback={<PageSkeleton />}><NewEnrollmentPage /></Suspense>} />
              <Route path="invoices" element={<Suspense fallback={<TableSkeleton />}><InvoicesPage /></Suspense>} />
              <Route path="invoices/overdue" element={<Suspense fallback={<DashboardSkeleton />}><OverdueDashboardPage /></Suspense>} />
              <Route path="finance" element={<Suspense fallback={<DashboardSkeleton />}><FinancialDashboardPage /></Suspense>} />
              <Route path="grades" element={<Suspense fallback={<PageSkeleton />}><GradesPage /></Suspense>} />
              <Route path="payroll" element={<Suspense fallback={<PageSkeleton />}><PayrollPage /></Suspense>} />
              <Route path="payroll-disputes" element={<Suspense fallback={<PageSkeleton />}><DisputeManagementPage /></Suspense>} />
              <Route path="staff" element={<Suspense fallback={<PageSkeleton />}><StaffPage /></Suspense>} />
              <Route path="salary-config" element={<Suspense fallback={<PageSkeleton />}><SalaryConfigPage /></Suspense>} />
              <Route path="leave-requests" element={<Suspense fallback={<PageLoader />}><LeaveManagementPage /></Suspense>} />
              <Route path="audit-logs" element={<Suspense fallback={<PageSkeleton />}><AuditLogPage /></Suspense>} />
              <Route path="centers" element={<Suspense fallback={<TableSkeleton />}><CentersPage /></Suspense>} />
              <Route path="centers/:id" element={<Suspense fallback={<PageSkeleton />}><CenterDetailPage /></Suspense>} />
              <Route path="rooms" element={<Suspense fallback={<PageSkeleton />}><RoomsPage /></Suspense>} />
              <Route path="holidays" element={<Suspense fallback={<PageSkeleton />}><HolidaysPage /></Suspense>} />
              <Route path="documents" element={<Suspense fallback={<PageSkeleton />}><DocumentsPage /></Suspense>} />
              <Route path="certificates" element={<Suspense fallback={<PageSkeleton />}><CertificatesPage /></Suspense>} />
              <Route path="certificates/list" element={<Suspense fallback={<TableSkeleton />}><CertificateListPage /></Suspense>} />
              <Route path="certificates/bulk-print" element={<Suspense fallback={<PageSkeleton />}><CertificateBulkPrintPage /></Suspense>} />
              <Route path="certificates/type/:id" element={<Suspense fallback={<PageSkeleton />}><CertificateTypeDetailPage /></Suspense>} />
              <Route path="certificates/:id/print" element={<Suspense fallback={<PageSkeleton />}><CertificatePrintPage /></Suspense>} />
              <Route path="certificates/:id/view" element={<Suspense fallback={<PageSkeleton />}><CertificateViewPage /></Suspense>} />
              <Route path="support" element={<Suspense fallback={<PageSkeleton />}><SupportPage /></Suspense>} />
              <Route path="support-tickets" element={<Suspense fallback={<PageSkeleton />}><SupportPage /></Suspense>} />
              <Route path="notifications" element={<Suspense fallback={<PageSkeleton />}><AdminNotificationsPage /></Suspense>} />
              <Route path="settings" element={<Suspense fallback={<PageSkeleton />}><SettingsPage /></Suspense>} />
              <Route path="reports" element={<Suspense fallback={<PageSkeleton />}><ReportsPage /></Suspense>} />
              <Route path="analytics" element={<Suspense fallback={<PageLoader />}><AnalyticsDashboardPage /></Suspense>} />
              <Route path="reports/revenue" element={<Suspense fallback={<PageSkeleton />}><RevenueReportPage /></Suspense>} />
              <Route path="reports/enrollment" element={<Suspense fallback={<PageSkeleton />}><EnrollmentReportPage /></Suspense>} />
              <Route path="reports/attendance" element={<Suspense fallback={<PageSkeleton />}><AttendanceReportPage /></Suspense>} />
              <Route path="reports/grades" element={<Suspense fallback={<PageSkeleton />}><GradesReportPage /></Suspense>} />
              <Route path="reports/staff" element={<Suspense fallback={<PageSkeleton />}><StaffReportPage /></Suspense>} />
              <Route path="reports/courses" element={<Suspense fallback={<PageSkeleton />}><CoursesReportPage /></Suspense>} />
            </Route>

            {/* Teacher Routes - Chỉ TEACHER */}
            <Route path="teacher" element={
              <ProtectedRoute allowedRoles={['TEACHER']}>
                <TeacherLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Suspense fallback={<DashboardSkeleton />}><TeacherDashboardPage /></Suspense>} />
              <Route path="dashboard" element={<Suspense fallback={<DashboardSkeleton />}><TeacherDashboardPage /></Suspense>} />
              <Route path="schedule" element={<Suspense fallback={<PageSkeleton />}><TeacherSchedulePage /></Suspense>} />
              <Route path="classes" element={<Suspense fallback={<PageSkeleton />}><TeacherClassesPage /></Suspense>} />
              <Route path="classes/:id" element={<Suspense fallback={<PageSkeleton />}><TeacherClassDetailPage /></Suspense>} />
              <Route path="classes/:id/attendance" element={<Suspense fallback={<PageSkeleton />}><TeacherAttendancePage /></Suspense>} />
              <Route path="classes/:id/gradebook" element={<Suspense fallback={<PageSkeleton />}><TeacherGradebookPage /></Suspense>} />
              <Route path="payroll" element={<Suspense fallback={<PageSkeleton />}><TeacherPayrollPage /></Suspense>} />
              <Route path="availability" element={<Suspense fallback={<PageSkeleton />}><TeacherAvailabilityPage /></Suspense>} />
              <Route path="leave-requests" element={<Suspense fallback={<PageSkeleton />}><TeacherLeaveRequestsPage /></Suspense>} />
              <Route path="attendance" element={<Suspense fallback={<PageSkeleton />}><TeacherQuickAttendancePage /></Suspense>} />
              <Route path="messages" element={<Suspense fallback={<PageLoader />}><MessagingPage /></Suspense>} />
              <Route path="profile" element={<Suspense fallback={<PageSkeleton />}><TeacherProfilePage /></Suspense>} />
              <Route path="settings" element={<Suspense fallback={<PageSkeleton />}><TeacherSettingsPage /></Suspense>} />
            </Route>

            {/* Student Routes - Chỉ STUDENT */}
            <Route path="student" element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Suspense fallback={<DashboardSkeleton />}><StudentDashboard /></Suspense>} />
              <Route path="dashboard" element={<Suspense fallback={<DashboardSkeleton />}><StudentDashboard /></Suspense>} />
              <Route path="schedule" element={<Suspense fallback={<PageSkeleton />}><StudentSchedule /></Suspense>} />
              <Route path="grades" element={<Suspense fallback={<PageSkeleton />}><StudentGrades /></Suspense>} />
              <Route path="attendance" element={<Suspense fallback={<PageSkeleton />}><StudentAttendance /></Suspense>} />
              <Route path="tuition" element={<Suspense fallback={<PageSkeleton />}><StudentTuition /></Suspense>} />
              <Route path="payment" element={<Suspense fallback={<PageSkeleton />}><StudentPayment /></Suspense>} />
              <Route path="certificates" element={<Suspense fallback={<PageSkeleton />}><StudentCertificates /></Suspense>} />
              <Route path="support" element={<Suspense fallback={<PageSkeleton />}><StudentSupportPage /></Suspense>} />
              <Route path="messages" element={<Suspense fallback={<PageLoader />}><MessagingPage /></Suspense>} />
            </Route>

            {/* Parent Routes - Chỉ PARENT */}
            <Route path="parent" element={
              <ProtectedRoute allowedRoles={['PARENT']}>
                <ParentLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Suspense fallback={<DashboardSkeleton />}><ParentDashboard /></Suspense>} />
              <Route path="dashboard" element={<Suspense fallback={<DashboardSkeleton />}><ParentDashboard /></Suspense>} />
              <Route path="children" element={<Suspense fallback={<DashboardSkeleton />}><ParentDashboard /></Suspense>} />
              <Route path="child/:studentId" element={<Suspense fallback={<PageSkeleton />}><ParentChildDetail /></Suspense>} />
              <Route path="schedule" element={<Suspense fallback={<PageSkeleton />}><ParentSchedulePage /></Suspense>} />
              <Route path="grades" element={<Suspense fallback={<PageSkeleton />}><ParentGradesPage /></Suspense>} />
              <Route path="attendance" element={<Suspense fallback={<PageSkeleton />}><ParentAttendancePage /></Suspense>} />
              <Route path="invoices" element={<Suspense fallback={<PageSkeleton />}><ParentInvoicesPage /></Suspense>} />
              <Route path="messages" element={<Suspense fallback={<PageLoader />}><MessagingPage /></Suspense>} />
              <Route path="profile" element={<Suspense fallback={<PageSkeleton />}><ParentProfilePage /></Suspense>} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          <Toaster position="top-right" richColors closeButton />
          </BrowserRouter>
        </ToastProvider>
      </ThemeProvider>
      </ErrorBoundary>
    </I18nextProvider>
  );
}

export default App;
