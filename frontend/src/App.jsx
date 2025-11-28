import React from 'react';
import axios from 'axios';
import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
  Link,
} from 'react-router-dom';
import { AdminLayout } from '@/layouts/admin-layout';
import { DashboardPage } from '@/pages/admin/dashboard-page';
import { CoursesPage } from '@/pages/admin/courses-page';
import { LoginPage } from '@/pages/auth/login-page';
import { AuthPage } from '@/pages/auth/auth-page';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuth } from '@/contexts/auth-context';

const PlaceholderPage = ({ title, description }) => (
  <div className="p-6">
    <h1 className="text-2xl font-bold">{title}</h1>
    {description && <p className="text-muted-foreground mt-2">{description}</p>}
  </div>
);

// Header công khai với auth-aware button
const PublicHeader = () => {
  const { user } = useAuth();
  
  return (
    <header className="border-b bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-indigo-600">Skill Master</Link>
        <nav className="flex items-center gap-6">
          <Link to="/" className="text-sm font-medium hover:text-indigo-600">Trang chủ</Link>
          <Link to="/courses" className="text-sm font-medium hover:text-indigo-600">Khóa học</Link>
          {user ? (
            <Link to="/admin/dashboard" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              Vào Dashboard
            </Link>
          ) : (
            <Link to="/login" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              Đăng nhập
            </Link>
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

        {/* Auth Pages - Login & Register with smooth transitions */}
        <Route path="login" element={<AuthPage />} />
        <Route path="register" element={<AuthPage />} />

        {/* Protected Admin Routes */}
        <Route path="admin" element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="classes" element={<PlaceholderPage title="Quản lý Lớp học" description="Danh sách các lớp học" />} />
          <Route path="classes/:id" element={<PlaceholderPage title="Chi tiết Lớp học" />} />
          <Route path="scheduler" element={<PlaceholderPage title="Lịch học" description="Xếp lịch và quản lý phòng học" />} />
          <Route path="students" element={<PlaceholderPage title="Quản lý Học viên" description="Danh sách học viên" />} />
          <Route path="students/:id" element={<PlaceholderPage title="Hồ sơ Học viên" />} />
          <Route path="enrollments/new" element={<PlaceholderPage title="Ghi danh" description="Đăng ký học viên vào lớp" />} />
          <Route path="invoices" element={<PlaceholderPage title="Quản lý Hóa đơn" description="Danh sách hóa đơn học phí" />} />
          <Route path="payrolls" element={<PlaceholderPage title="Bảng lương" description="Tính lương giáo viên" />} />
          <Route path="staff" element={<PlaceholderPage title="Quản lý Nhân sự" description="Danh sách nhân viên, giáo viên" />} />
          <Route path="centers" element={<PlaceholderPage title="Quản lý Trung tâm" description="Thông tin các chi nhánh" />} />
        </Route>

        {/* Teacher Routes (sẽ thêm ProtectedRoute + role check sau) */}
        <Route path="teacher" element={<TeacherLayout />}>
          <Route path="schedule" element={<PlaceholderPage title="Teacher • Schedule" />} />
          <Route path="classes" element={<PlaceholderPage title="Teacher • Classes" />} />
          <Route path="classes/:id/attendance" element={<PlaceholderPage title="Teacher • Attendance" />} />
          <Route path="classes/:id/gradebook" element={<PlaceholderPage title="Teacher • Gradebook" />} />
          <Route path="payroll" element={<PlaceholderPage title="Teacher • Payroll" />} />
        </Route>

        {/* Student Routes (sẽ thêm ProtectedRoute + role check sau) */}
        <Route path="student" element={<StudentLayout />}>
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
