/**
 * Staff Feature Module - Barrel Export
 * 
 * Module quản lý nhân viên (giáo viên, quản lý trung tâm)
 * 
 * Structure:
 * - components/: UI components (Avatar, Table, Modal, Filters)
 * - hooks/: Custom hooks (useStaff, useStaffForm)
 * - pages/: Page components
 * - utils/: Constants và formatters
 */

// Page export (default)
export { StaffPage } from './pages';
export { StaffPage as default } from './pages';

// Components exports
export {
  ColorAvatar,
  RoleBadge,
  SimpleModal,
  SimpleSelect,
  StaffTable,
  StaffFilters,
  CreateStaffModal,
  EmptyStaffState,
  LoadingState,
} from './components';

// Hooks exports
export { useStaff, useStaffForm } from './hooks';

// Utils exports
export {
  API_URL,
  ROLE_CONFIG,
  ROLE_OPTIONS,
  ROLE_FILTER_OPTIONS,
  DEFAULT_STAFF_FORM,
  formatDate,
  getInitials,
  getGradient,
} from './utils';
