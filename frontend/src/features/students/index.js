/**
 * Students Feature Module - Barrel Export
 * 
 * Module quản lý học viên
 * 
 * Structure:
 * - components/: UI components (Avatar, Table, Modal, Filters)
 * - hooks/: Custom hooks (useStudents)
 * - pages/: Page components
 * - utils/: Constants và formatters
 */

// Page export (default)
export { StudentsPage } from './pages';
export { StudentsPage as default } from './pages';

// Components exports
export {
  ColorAvatar,
  ActionMenu,
  SimpleModal,
  SimpleSelect,
  StudentFilters,
  StudentsTable,
  PromoteModal,
  LoadingState,
} from './components';

// Hooks exports
export { useStudents } from './hooks';

// Utils exports
export {
  API_URL,
  STATUS_OPTIONS,
  ROLE_OPTIONS,
  AVATAR_GRADIENTS,
  formatDate,
  getInitials,
  getGradient,
} from './utils';
