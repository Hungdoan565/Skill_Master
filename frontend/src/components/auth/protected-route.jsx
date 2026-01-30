import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';
import { ForbiddenPage } from '@/components/errors/forbidden-page';

/**
 * ProtectedRoute - Bảo vệ route dựa trên role từ AuthContext
 * 
 * Best Practice:
 * 1. Chờ AuthContext initialized
 * 2. Check user đã login chưa
 * 3. Check profile đã load chưa  
 * 4. Check role có được phép không
 */
export function ProtectedRoute({ 
  children, 
  allowedRoles = ['SUPER_ADMIN', 'CENTER_MANAGER', 'TEACHER'],
  redirectTo = '/login'
}) {
  const location = useLocation();
  const { user, profile, initialized, isAuthenticated } = useAuth();

  // 1. Chờ auth khởi tạo xong
  if (!initialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-indigo-600" />
          <p className="mt-4 text-sm text-slate-600">Đang kiểm tra phiên đăng nhập...</p>
        </div>
      </div>
    );
  }

  // 2. Chưa đăng nhập -> redirect về login
  if (!user) {
    console.log('[ProtectedRoute] No user, redirecting to login');
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`${redirectTo}?redirectTo=${returnUrl}`} replace />;
  }

  // 3. Đã đăng nhập nhưng chưa có profile (DB chưa setup hoặc lỗi fetch)
  // Only allow strict domain-based fallback for admin routes (security fix)
  if (!profile) {
    // SECURITY: Only allow @skillmaster.edu.vn domain as fallback
    // Removed: user?.email?.includes('admin') - too permissive
    const isKnownAdminDomain = user?.email?.endsWith('@skillmaster.edu.vn');
    const isAdminRoute = allowedRoles.includes('SUPER_ADMIN') || allowedRoles.includes('CENTER_MANAGER');
    
    if (isKnownAdminDomain && isAdminRoute) {
      console.log('[ProtectedRoute] No profile but trusted admin domain - allowing access temporarily');
      return children ? children : <Outlet />;
    }
    
    console.log('[ProtectedRoute] User exists but no profile - DB may not be setup');
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center max-w-md px-6">
          <div className="mx-auto h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Chưa hoàn tất cấu hình</h2>
          <p className="text-slate-600 mb-4">
            Tài khoản của bạn chưa có thông tin profile trong hệ thống. 
            Vui lòng liên hệ quản trị viên hoặc chạy SQL schema để thiết lập database.
          </p>
          <p className="text-xs text-slate-500 mb-6">
            User ID: {user?.id}<br/>
            Email: {user?.email}
          </p>
          <a 
            href="/" 
            className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Về trang chủ
          </a>
        </div>
      </div>
    );
  }

  // 4. Kiểm tra role
  const userRoleCode = profile?.roles?.code;
  console.log('[ProtectedRoute] Checking access | Role:', userRoleCode, '| Allowed:', allowedRoles);

  if (!allowedRoles.includes(userRoleCode)) {
    console.log('[ProtectedRoute] Access denied - showing 403');
    
    // Thay vì redirect, hiển thị trang 403 Forbidden
    let message = 'Bạn không có quyền truy cập vào trang này.';
    let redirectPath = '/';
    
    // Gợi ý redirect về dashboard đúng role
    switch (userRoleCode) {
      case 'STUDENT':
        message = 'Trang này dành cho giáo viên và quản trị viên. Bạn là học viên nên không có quyền truy cập.';
        redirectPath = '/student/schedule';
        break;
      case 'PARENT':
        message = 'Trang này không dành cho phụ huynh. Vui lòng quay về trang quản lý con em.';
        redirectPath = '/parent/dashboard';
        break;
      case 'TEACHER':
        message = 'Trang này chỉ dành cho quản trị viên. Bạn là giáo viên nên không có quyền truy cập.';
        redirectPath = '/teacher/schedule';
        break;
      case 'SUPER_ADMIN':
      case 'CENTER_MANAGER':
        message = 'Trang này không dành cho quản trị viên.';
        redirectPath = '/admin/dashboard';
        break;
    }
    
    return <ForbiddenPage message={message} redirectPath={redirectPath} />;
  }

  console.log('[ProtectedRoute] Access granted');
  return children ? children : <Outlet />;
}

/**
 * GuestRoute - Chỉ cho phép user CHƯA đăng nhập (dùng cho login/register page)
 * Nếu đã đăng nhập -> redirect về dashboard theo role
 */
export function GuestRoute({ children }) {
  const { isAuthenticated, getRedirectPath, initialized } = useAuth();

  // Chờ auth khởi tạo xong
  if (!initialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-indigo-600" />
          <p className="mt-4 text-sm text-slate-600">Đang kiểm tra...</p>
        </div>
      </div>
    );
  }

  // Đã đăng nhập -> redirect về dashboard
  if (isAuthenticated) {
    const redirectTo = getRedirectPath();
    console.log('[GuestRoute] User authenticated, redirecting to:', redirectTo);
    return <Navigate to={redirectTo} replace />;
  }

  return children ? children : <Outlet />;
}

/**
 * StudentRoute - Route dành cho Student
 */
export function StudentRoute({ children }) {
  return (
    <ProtectedRoute 
      allowedRoles={['STUDENT']} 
      redirectTo="/login"
    >
      {children}
    </ProtectedRoute>
  );
}

/**
 * TeacherRoute - Route dành cho Teacher
 */
export function TeacherRoute({ children }) {
  return (
    <ProtectedRoute 
      allowedRoles={['TEACHER', 'SUPER_ADMIN', 'CENTER_MANAGER']} 
      redirectTo="/login"
    >
      {children}
    </ProtectedRoute>
  );
}

/**
 * AdminRoute - Route dành cho Admin (SUPER_ADMIN, CENTER_MANAGER)
 */
export function AdminRoute({ children }) {
  return (
    <ProtectedRoute 
      allowedRoles={['SUPER_ADMIN', 'CENTER_MANAGER']} 
      redirectTo="/login"
    >
      {children}
    </ProtectedRoute>
  );
}

/**
 * ParentRoute - Route dành cho Parent (phụ huynh)
 */
export function ParentRoute({ children }) {
  return (
    <ProtectedRoute 
      allowedRoles={['PARENT']} 
      redirectTo="/login"
    >
      {children}
    </ProtectedRoute>
  );
}
