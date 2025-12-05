/**
 * Centers Feature Module - Barrel Export
 * 
 * Module quản lý trung tâm/chi nhánh
 * 
 * Structure:
 * - components/: UI components (Cards, Modal, Filters)
 * - hooks/: Custom hooks (useCenters, useCenterForm, useCenterStats)
 * - pages/: Page components
 * - utils/: Constants và formatters
 */

// Page export (default)
export { CentersPage } from './pages';
export { CentersPage as default } from './pages';

// Components exports
export {
    CenterCard,
    CenterFormModal,
    CenterStatsCards,
    CenterFilters,
    CenterDetailModal,
    AssignManagerModal,
    DeleteConfirmModal,
    LogoUpload,
    Pagination,
} from './components';

// Hooks exports
export { useCenters, useCenterForm, useCenterStats } from './hooks';

// Utils exports
export {
    API_URL,
    STATUS_CONFIG,
    STATUS_OPTIONS,
    DEFAULT_CENTER_FORM,
    DEFAULT_WORKING_HOURS,
    DAY_LABELS,
    formatWorkingHours,
    formatDate,
    getInitials,
    getGradient,
    exportCentersToExcel,
} from './utils';
