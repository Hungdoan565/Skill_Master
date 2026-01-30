/**
 * Parent Portal Feature Module - Barrel Export
 */

// Pages
export { ParentDashboard } from './pages/ParentDashboard';
export { ParentChildDetail } from './pages/ParentChildDetail';

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
