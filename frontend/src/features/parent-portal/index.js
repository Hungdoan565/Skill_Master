/**
 * Parent Portal Feature Module - Barrel Export
 */

// Pages
export { ParentDashboard } from './pages/ParentDashboard';
export { ParentChildDetail } from './pages/ParentChildDetail';
export { default as ParentSchedulePage } from './pages/ParentSchedulePage';
export { default as ParentGradesPage } from './pages/ParentGradesPage';
export { default as ParentAttendancePage } from './pages/ParentAttendancePage';
export { default as ParentInvoicesPage } from './pages/ParentInvoicesPage';
export { ParentProfilePage } from './pages/ParentProfilePage';
export { default as ParentSupportPage } from './pages/ParentSupportPage';

// Hooks
export {
  useParentDashboard,
  useParentChildren,
  useParentChildSchedule,
  useParentChildGrades,
  useParentChildAttendance,
  useParentChildInvoices,
  useParentPaymentConfig,
  useParentSupport
} from './hooks';
