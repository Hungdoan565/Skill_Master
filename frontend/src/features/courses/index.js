/**
 * Courses Feature Module - Barrel Export
 * 
 * Module quản lý khóa học với các chức năng:
 * - CRUD courses
 * - Cấu hình cột điểm (Grade Structure)
 * - Lọc và tìm kiếm
 * 
 * @example
 * // Import page
 * import { CoursesPage } from '@/features/courses';
 * 
 * // Import individual components
 * import { CategoryBadge, CourseTable } from '@/features/courses';
 * 
 * // Import hooks
 * import { useCourses, useGradeStructure } from '@/features/courses';
 */

// Pages
export { CoursesPage } from './pages';

// Components
export { 
  CategoryBadge,
  CourseFilters,
  CourseTable,
  CreateCourseModal,
  GradeStructureModal
} from './components';

// Hooks
export { 
  useCourses,
  useGradeStructure,
  useCourseForm
} from './hooks';

// Utils
export {
  API_URL,
  CATEGORY_CONFIG,
  CATEGORIES,
  LEVELS,
  COURSE_STATUS,
  DEFAULT_COURSE_FORM,
  GRADE_TEMPLATES,
  DEFAULT_GRADE_CONFIG,
  formatPriceInput,
  parsePriceValue,
  formatPrice,
  getCategoryConfig,
  getTemplateByCategory,
  calculateTotalWeight,
  isWeightValid,
  calculateTotalMaxScore,
  validateCourseForm,
  validateGradeStructure
} from './utils';
