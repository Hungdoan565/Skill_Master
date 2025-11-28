import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Hiển thị loading spinner khi đang kiểm tra session
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-sm text-slate-600">Đang kiểm tra bảo mật...</p>
        </div>
      </div>
    );
  }

  // Nếu chưa đăng nhập -> redirect về login với redirectTo param
  if (!user) {
    const redirectTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirectTo=${redirectTo}`} replace />;
  }

  // Nếu đã đăng nhập -> render children hoặc Outlet
  return children ? children : <Outlet />;
}
