import React from 'react';
import axios from 'axios';
import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
  Link,
} from 'react-router-dom';

const PlaceholderPage = ({ title, description }) => (
  <div style={{ padding: 24 }}>
    <h1>{title}</h1>
    {description && <p>{description}</p>}
  </div>
);

const PublicLayout = () => (
  <div>
    <header style={{ padding: 16, borderBottom: '1px solid #ccc' }}>
      <strong>Skill Master</strong>
      <nav style={{ marginTop: 8, display: 'flex', gap: 12 }}>
        <Link to="/">Home</Link>
        <Link to="/courses">Courses</Link>
        <Link to="/login">Login</Link>
      </nav>
    </header>
    <Outlet />
  </div>
);

const AdminLayout = () => (
  <div style={{ display: 'flex', minHeight: '100vh' }}>
    <aside style={{ width: 220, borderRight: '1px solid #ddd', padding: 16 }}>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Link to="dashboard">Dashboard</Link>
        <Link to="courses">Courses</Link>
        <Link to="classes">Classes</Link>
        <Link to="scheduler">Scheduler</Link>
        <Link to="students">Students</Link>
        <Link to="enrollments/new">Enrollments</Link>
        <Link to="invoices">Invoices</Link>
        <Link to="payrolls">Payrolls</Link>
        <Link to="staff">Staff</Link>
        <Link to="centers">Centers</Link>
      </nav>
    </aside>
    <main style={{ flex: 1 }}>
      <Outlet />
    </main>
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
    <div style={{ padding: 24 }}>
      <h1>Welcome to Skill Master</h1>
      <p>This is the public landing page. Use the navigation to explore portals.</p>
      <h3>Backend status</h3>
      <pre>{JSON.stringify(health, null, 2)}</pre>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="courses" element={<PlaceholderPage title="Course Catalog" />} />
          <Route path="courses/:id" element={<PlaceholderPage title="Course Detail" />} />
          <Route path="login" element={<PlaceholderPage title="Login" description="Auth form coming soon." />} />
        </Route>

        <Route path="admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<PlaceholderPage title="Admin Dashboard" />} />
          <Route path="courses" element={<PlaceholderPage title="Admin • Courses" />} />
          <Route path="classes" element={<PlaceholderPage title="Admin • Classes" />} />
          <Route path="classes/:id" element={<PlaceholderPage title="Admin • Class Detail" />} />
          <Route path="scheduler" element={<PlaceholderPage title="Admin • Scheduler" />} />
          <Route path="students" element={<PlaceholderPage title="Admin • Students" />} />
          <Route path="students/:id" element={<PlaceholderPage title="Admin • Student Profile" />} />
          <Route path="enrollments/new" element={<PlaceholderPage title="Admin • Enrollment" />} />
          <Route path="invoices" element={<PlaceholderPage title="Admin • Invoices" />} />
          <Route path="payrolls" element={<PlaceholderPage title="Admin • Payrolls" />} />
          <Route path="staff" element={<PlaceholderPage title="Admin • Staff" />} />
          <Route path="centers" element={<PlaceholderPage title="Admin • Centers" />} />
        </Route>

        <Route path="teacher" element={<TeacherLayout />}>
          <Route path="schedule" element={<PlaceholderPage title="Teacher • Schedule" />} />
          <Route path="classes" element={<PlaceholderPage title="Teacher • Classes" />} />
          <Route path="classes/:id/attendance" element={<PlaceholderPage title="Teacher • Attendance" />} />
          <Route path="classes/:id/gradebook" element={<PlaceholderPage title="Teacher • Gradebook" />} />
          <Route path="payroll" element={<PlaceholderPage title="Teacher • Payroll" />} />
        </Route>

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
