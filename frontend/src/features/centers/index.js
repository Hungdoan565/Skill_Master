/**
 * Centers Feature Module - Barrel Export
 * 
 * Module quản lý trung tâm/chi nhánh
 * 
 * Structure:
 * - components/: UI components (Cards, Modal, Filters, Tabs)
 * - hooks/: Custom hooks (useCenters, useCenterDetail, etc.)
 * - pages/: Page components (List, Detail)
 * - utils/: Constants và formatters
 */

// Page exports
export { CentersPage, CenterDetailPage } from './pages';
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
    // Detail page components
    CenterHeader,
    CenterQuickStats,
    CenterOverviewTab,
    CenterRoomsTab,
    CenterClassesTab,
    CenterStaffTab,
    CenterStudentsTab,
    CenterRevenueTab,
} from './components';

// Hooks exports
export {
    useCenters,
    useCenterForm,
    useCenterStats,
    // Detail page hooks
    useCenterDetail,
    useCenterRooms,
    useCenterClasses,
    useCenterStaff,
    useCenterStudents,
    useCenterRevenue,
} from './hooks';

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

