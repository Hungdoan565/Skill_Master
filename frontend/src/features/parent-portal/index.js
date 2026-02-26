/**
 * Parent Portal Feature Module - Barrel Export
 */

// Pages
export { ParentDashboard } from './pages/ParentDashboard';
export { ParentChildDetail } from './pages/ParentChildDetail';
export { ParentSchedulePage } from './pages/ParentSchedulePage';
export { ParentGradesPage } from './pages/ParentGradesPage';
export { ParentAttendancePage } from './pages/ParentAttendancePage';
export { ParentInvoicesPage } from './pages/ParentInvoicesPage';
export { ParentProfilePage } from './pages/ParentProfilePage';

// Hooks
export {
  useParentDashboard,
  useParentChildren,
  useParentChildSchedule,
  useParentChildGrades,
  useParentChildAttendance,
  useParentChildInvoices,
  useParentPaymentConfig
} from './hooks';
