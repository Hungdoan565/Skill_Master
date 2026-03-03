/**
 * Student Portal Feature Module - Barrel Export
 */

// Pages
export { StudentDashboard } from './pages/StudentDashboard';
export { StudentSchedule } from './pages/StudentSchedule';
export { StudentGrades } from './pages/StudentGrades';
export { StudentAttendance } from './pages/StudentAttendance';
export { StudentTuition } from './pages/StudentTuition';
export { StudentPayment } from './pages/StudentPayment';
export { StudentCertificates } from './pages/StudentCertificates';
export { default as StudentSupportPage } from './pages/StudentSupportPage';
export { default as StudentCourseCatalog } from './pages/StudentCourseCatalog';
export { default as StudentCourseDetail } from './pages/StudentCourseDetail';

// Hooks
export {
  useStudentDashboard,
  useStudentSchedule,
  useStudentGrades,
  useStudentAttendance,
  useStudentInvoices,
  useStudentCertificates,
  useStudentPaymentConfig,
  useStudentSupport
} from './hooks';
