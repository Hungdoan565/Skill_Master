/**
 * Classes List Feature Module - Barrel Export
 * 
 * Module quản lý danh sách lớp học với các chức năng:
 * - CRUD classes
 * - Kiểm tra xung đột lịch học
 * - Bulk selection & delete
 * - Filter & Search
 * 
 * @example
 * // Import page
 * import { ClassesPage } from '@/features/classes-list';
 * 
 * // Import individual components
 * import { ClassesTable, CreateClassModal } from '@/features/classes-list';
 */

// Pages
export { ClassesPage } from './pages';

// Components
export {
  ColorAvatar,
  SimpleModal,
  Select,
  ClassesTable,
  BulkActionBar,
  ClassFilters,
  DeleteClassModal,
  BulkDeleteModal,
  ConflictCard,
  CreateClassModal
} from './components';

// Hooks
export {
  useClassesList,
  useClassForm,
  useConflictCheck,
  useFormOptions
} from './hooks';

// Utils
export {
  API_URL,
  STATUS_CONFIG,
  DAY_NAMES,
  DAYS_OF_WEEK,
  CATEGORY_COLORS,
  DEFAULT_CLASS_FORM,
  parseSchedule,
  formatScheduleDisplay,
  formatDate,
  generateClassName,
  generateClassCode,
  getCategoryColor,
  buildScheduleArray
} from './utils';
