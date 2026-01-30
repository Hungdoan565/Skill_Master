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

// Hooks
export {
  useStudentDashboard,
  useStudentSchedule,
  useStudentGrades,
  useStudentAttendance,
  useStudentInvoices,
  useStudentCertificates,
  useStudentPaymentConfig
} from './hooks';
