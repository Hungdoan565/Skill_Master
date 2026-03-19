import React, { useState, useRef, useEffect, Suspense, lazy } from 'react';
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
import ChatWidget from '@/features/chatbot/ChatWidget';
import { GooeyToaster } from 'goey-toast';
import 'goey-toast/styles.css';
import {
  StudentDashboard,
  StudentSchedule,
  StudentGrades,
  StudentAttendance,
  StudentTuition,
  StudentPayment,
  StudentCertificates,
  StudentSupportPage,
  StudentCourseCatalog,
  StudentCourseDetail
} from '@/features/student-portal';
import {
  ParentDashboard,
  ParentChildDetail,
  ParentSchedulePage,
  ParentGradesPage,
  ParentAttendancePage,
  ParentInvoicesPage,
  ParentProfilePage,
  ParentSupportPage
} from '@/features/parent-portal';
import { TeacherLeaveRequestsPage } from '@/features/teacher-leave';
import { TeacherProfilePage } from '@/features/teacher-profile';
import NotFoundPage from '@/components/NotFoundPage';
import { ToastProvider } from '@/components/ui/toast';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
// REFACTORED: Import từ feature modules thay vì file monolithic
import { InvoicesPage, OverdueDashboardPage } from '@/features/invoices';
import { ClassDetailPage } from '@/features/classes';
import { CoursesPage } from '@/features/courses';
import { ClassesPage } from '@/features/classes-list';
import { DashboardPage } from '@/features/dashboard';
import { StaffPage, SalaryConfigPage } from '@/features/staff';
import { RoomsPage } from '@/features/rooms';
import { StudentsPage, StudentDetailPage } from '@/features/students';
import { PayrollPage, TeacherPayrollPage, DisputeManagementPage } from '@/features/payroll';
import { SchedulePage } from '@/features/schedule';
import { HolidaysPage } from '@/features/holidays';
import { GradesPage } from '@/features/grades';
import { CentersPage, CenterDetailPage } from '@/features/centers';
import { SettingsPage } from '@/features/settings';
import { EnrollmentsPage, NewEnrollmentPage } from '@/features/enrollments';
import { DocumentsPage } from '@/features/documents';
import { CertificatesPage } from '@/features/certificates';
import { PublicCertificateVerification } from '@/features/certificates/pages/PublicCertificateVerification';
// ConsultationRequestsPage removed — merged into unified SupportPage inbox
import { SupportPage } from '@/features/support';
import { TeacherDashboardPage } from '@/features/teacher-dashboard';
import AdminNotificationsPage from '@/features/notifications/AdminNotificationsPage';
import AuditTrailPage from '@/features/audit-trail/pages/AuditTrailPage';
import { LeaveManagementPage } from '@/features/leave-management';
import { TeacherSchedulePage } from '@/features/teacher-schedule';
import { TeacherClassesPage } from '@/features/teacher-classes';
import { TeacherAvailabilityPage } from '@/features/teacher-availability';
import {
  TeacherClassDetailPage,
  TeacherAttendancePage,
  TeacherQuickAttendancePage
} from '@/features/teacher-attendance';
import { TeacherGradebookPage } from '@/features/teacher-gradebook';
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
import { CoursesPage as PublicCoursesPage } from '@/pages/public/courses';
import { CourseDetailPage } from '@/pages/public/courses/detail';
import { ProtectedRoute, GuestRoute, TeacherRoute, StudentRoute, AdminRoute, ParentRoute } from '@/components/auth/protected-route';
import { useAuth } from '@/contexts/auth-context';

// ============================================
// LAZY LOADED COMPONENTS (Code Splitting)
// ============================================
const ApprovalInboxPage = lazy(() => import('@/features/approvals/pages/ApprovalInboxPage'));
const LeaderboardPage = lazy(() => import('@/features/leaderboard/pages/LeaderboardPage'));
const CenterComparisonPage = lazy(() => import('@/features/center-comparison/pages/CenterComparisonPage'));
const CustomAlertsPage = lazy(() => import('@/features/custom-alerts/pages/CustomAlertsPage'));
const ScheduledReportsPage = lazy(() => import('@/features/scheduled-reports/pages/ScheduledReportsPage'));
// Heavy public pages loaded on-demand for better initial bundle
const AboutPage = lazy(() => import('@/pages/public/about').then(m => ({ default: m.AboutPage })));
const BlogPage = lazy(() => import('@/pages/public/blog').then(m => ({ default: m.BlogPage })));
const BlogDetailPage = lazy(() => import('@/pages/public/blog/[slug]'));
const ContactPage = lazy(() => import('@/pages/public/contact').then(m => ({ default: m.ContactPage })));
const RoadmapPage = lazy(() => import('@/pages/public/roadmap').then(m => ({ default: m.RoadmapPage })));
const AssessmentPage = lazy(() => import('@/pages/public/resources/assessment').then(m => ({ default: m.AssessmentPage })));
const QuizPage = lazy(() => import('@/pages/public/resources/assessment/[slug]/page').then(m => ({ default: m.QuizPage })));
const ResultPage = lazy(() => import('@/pages/public/resources/assessment/[slug]/result').then(m => ({ default: m.ResultPage })));
const ChinhSachPage = lazy(() => import('@/pages/public/policies').then(m => ({ default: m.ChinhSachPage })));
const DieuKhoanPage = lazy(() => import('@/pages/public/policies').then(m => ({ default: m.DieuKhoanPage })));
const BaoMatPage = lazy(() => import('@/pages/public/policies').then(m => ({ default: m.BaoMatPage })));
const FaqPage = lazy(() => import('@/pages/public/policies').then(m => ({ default: m.FaqPage })));
const TeacherSettingsPage = lazy(() => import('@/features/teacher-profile/pages/TeacherSettingsPage'));
const StudentProgressPage = lazy(() => import('@/features/teacher-classes/pages/StudentProgressPage'));
const AssessmentManagementPage = lazy(() => import('@/features/assessment/pages/AssessmentManagementPage'));
const StudentAssessmentPage = lazy(() => import('@/features/assessment/pages/StudentAssessmentPage'));
const AssignmentsWorkspacePage = lazy(() => import('@/features/assignments/pages/AssignmentsWorkspacePage'));
const LaborContractsPage = lazy(() => import('@/features/staff/pages/LaborContractsPage'));

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

  const getProfilePath = () => {
    switch (roleCode) {
      case 'SUPER_ADMIN':
      case 'CENTER_MANAGER':
        return '/admin/settings';
      case 'TEACHER':
        return '/teacher/profile';
      case 'PARENT':
        return '/parent/profile';
      default:
        return '/';
    }
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
      action: () => { setIsOpen(false); navigate(getProfilePath()); },
    },
    {
      label: 'Cài đặt',
      icon: Settings,
      action: () => { setIsOpen(false); navigate('/admin/settings'); },
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
    <ErrorBoundary>
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

            {/* Policy & Legal Pages */}
            <Route path="chinh-sach" element={<Suspense fallback={<PageLoader />}><ChinhSachPage /></Suspense>} />
            <Route path="dieu-khoan" element={<Suspense fallback={<PageLoader />}><DieuKhoanPage /></Suspense>} />
            <Route path="bao-mat" element={<Suspense fallback={<PageLoader />}><BaoMatPage /></Suspense>} />
            <Route path="faq" element={<Suspense fallback={<PageLoader />}><FaqPage /></Suspense>} />

            {/* Public Certificate Verification - No login required */}
            <Route path="verify-certificate" element={<PublicCertificateVerification />} />
            <Route path="certificates/:id/view" element={<CertificatesPage />} />
            <Route path="certificates/:id/print" element={<CertificatesPage />} />

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
              <Route path="invoices/overdue" element={<OverdueDashboardPage />} />
              <Route path="grades" element={<GradesPage />} />
              <Route path="payroll" element={<PayrollPage />} />
              <Route path="leave-requests" element={<Suspense fallback={<PageLoader />}><LeaveManagementPage /></Suspense>} />
              <Route path="payroll-disputes" element={<DisputeManagementPage />} />
              <Route path="staff" element={<StaffPage />} />
              <Route path="salary-config" element={<SalaryConfigPage />} />
              <Route path="centers" element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <CentersPage />
                </ProtectedRoute>
              } />
              <Route path="centers/:id" element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <CenterDetailPage />
                </ProtectedRoute>
              } />
              <Route path="rooms" element={<RoomsPage />} />
              <Route path="holidays" element={<HolidaysPage />} />
              <Route path="documents" element={<DocumentsPage />} />
              <Route path="certificates" element={<CertificatesPage />} />
              <Route path="certificates/list" element={<CertificatesPage />} />
              <Route path="certificates/bulk-print" element={<CertificatesPage />} />
              <Route path="certificates/type/:id" element={<CertificatesPage />} />
              <Route path="certificates/:id/print" element={<CertificatesPage />} />
              <Route path="certificates/:id/view" element={<CertificatesPage />} />
              {/* consultation-requests redirects to support tab (unified inbox) */}
              <Route path="consultation-requests" element={<SupportPage />} />
              <Route path="support" element={<SupportPage />} />
              <Route path="support-tickets" element={<SupportPage />} />
              <Route path="approvals" element={<Suspense fallback={<PageLoader />}><ApprovalInboxPage /></Suspense>} />
              <Route path="notifications" element={<AdminNotificationsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="audit-trail" element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'CENTER_MANAGER']}>
                  <AuditTrailPage />
                </ProtectedRoute>
              } />

              <Route path="reports" element={<ReportsPage />} />
              <Route path="reports/revenue" element={<RevenueReportPage />} />
              <Route path="reports/enrollment" element={<EnrollmentReportPage />} />
              <Route path="reports/attendance" element={<AttendanceReportPage />} />
              <Route path="reports/grades" element={<GradesReportPage />} />
              <Route path="reports/staff" element={<StaffReportPage />} />
              <Route path="reports/courses" element={<CoursesReportPage />} />
              <Route path="invoices/overdue" element={<OverdueDashboardPage />} />
              <Route path="overdue-invoices" element={<OverdueDashboardPage />} />
              <Route path="leaderboard" element={<Suspense fallback={<PageLoader />}><LeaderboardPage /></Suspense>} />
              <Route path="center-comparison" element={<Suspense fallback={<PageLoader />}><CenterComparisonPage /></Suspense>} />
              <Route path="custom-alerts" element={<Suspense fallback={<PageLoader />}><CustomAlertsPage /></Suspense>} />
              <Route path="scheduled-reports" element={<Suspense fallback={<PageLoader />}><ScheduledReportsPage /></Suspense>} />
              <Route path="assessment" element={<Suspense fallback={<PageLoader />}><AssessmentManagementPage /></Suspense>} />
              <Route path="assignments" element={<Suspense fallback={<PageLoader />}><AssignmentsWorkspacePage /></Suspense>} />
              <Route path="labor-contracts" element={<Suspense fallback={<PageLoader />}><LaborContractsPage /></Suspense>} />
            </Route>

            {/* Teacher Routes - Chỉ TEACHER */}
            <Route path="teacher" element={
              <ProtectedRoute allowedRoles={['TEACHER']}>
                <TeacherLayout />
              </ProtectedRoute>
            }>
              <Route index element={<TeacherDashboardPage />} />
              <Route path="dashboard" element={<TeacherDashboardPage />} />
              <Route path="schedule" element={<TeacherSchedulePage />} />
              <Route path="classes" element={<TeacherClassesPage />} />
              <Route path="classes/:id" element={<TeacherClassDetailPage />} />
              <Route path="classes/:id/attendance" element={<TeacherAttendancePage />} />
              <Route path="classes/:id/gradebook" element={<TeacherGradebookPage />} />
              <Route path="classes/:classId/students/:studentId" element={<Suspense fallback={<PageLoader />}><StudentProgressPage /></Suspense>} />
              <Route path="payroll" element={<TeacherPayrollPage />} />
              <Route path="availability" element={<TeacherAvailabilityPage />} />
              <Route path="leave-requests" element={<TeacherLeaveRequestsPage />} />
              <Route path="attendance" element={<TeacherQuickAttendancePage />} />
              <Route path="profile" element={<TeacherProfilePage />} />
              <Route path="settings" element={<Suspense fallback={<PageLoader />}><TeacherSettingsPage /></Suspense>} />
              <Route path="assessment" element={<Suspense fallback={<PageLoader />}><AssessmentManagementPage /></Suspense>} />
              <Route path="assignments" element={<Suspense fallback={<PageLoader />}><AssignmentsWorkspacePage /></Suspense>} />
            </Route>

            {/* Student Routes - Chỉ STUDENT */}
            <Route path="student" element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentLayout />
              </ProtectedRoute>
            }>
              <Route index element={<StudentDashboard />} />
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="schedule" element={<StudentSchedule />} />
              <Route path="grades" element={<StudentGrades />} />
              <Route path="attendance" element={<StudentAttendance />} />
              <Route path="tuition" element={<StudentTuition />} />
              <Route path="payment" element={<StudentPayment />} />
              <Route path="certificates" element={<StudentCertificates />} />
              <Route path="support" element={<StudentSupportPage />} />
              <Route path="courses" element={<StudentCourseCatalog />} />
              <Route path="courses/:courseId" element={<StudentCourseDetail />} />
              <Route path="assessment" element={<Suspense fallback={<PageLoader />}><StudentAssessmentPage /></Suspense>} />
              <Route path="assignments" element={<Suspense fallback={<PageLoader />}><AssignmentsWorkspacePage /></Suspense>} />
            </Route>

            {/* Parent Routes - Chỉ PARENT */}
            <Route path="parent" element={
              <ProtectedRoute allowedRoles={['PARENT']}>
                <ParentLayout />
              </ProtectedRoute>
            }>
              <Route index element={<ParentDashboard />} />
              <Route path="dashboard" element={<ParentDashboard />} />
              <Route path="children" element={<ParentDashboard />} />
              <Route path="child/:studentId" element={<ParentChildDetail />} />
              <Route path="schedule" element={<ParentSchedulePage />} />
              <Route path="grades" element={<ParentGradesPage />} />
              <Route path="attendance" element={<ParentAttendancePage />} />
              <Route path="invoices" element={<ParentInvoicesPage />} />
              <Route path="profile" element={<ParentProfilePage />} />
              <Route path="support" element={<ParentSupportPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
        <ChatWidget />
        <GooeyToaster position="top-center" />
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
