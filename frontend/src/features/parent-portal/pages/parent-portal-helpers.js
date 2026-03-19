import { normalizeParentChildren } from '../utils/normalizers';
import {
    buildParentChildDetailNavigation,
    buildParentChildOverview,
    buildParentDashboardInsights,
    buildInvoiceGroups,
    buildHouseholdFinanceSummary,
    buildParentGradesGroups,
    buildParentScheduleGroups,
    getPriorityInvoice,
} from '../utils/insights.js';

export const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0 ₫';

    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(amount);
};

export const formatDate = (dateString) => {
    if (!dateString) return '--/--/----';
    return new Date(dateString).toLocaleDateString('vi-VN');
};

export const formatTime = (time) => {
    if (!time) return '--:--';
    return time.slice(0, 5);
};

export const getRelationshipTone = (relationship) => {
    if (relationship === 'father') return 'Cha';
    if (relationship === 'mother') return 'Mẹ';
    if (relationship === 'guardian') return 'Người giám hộ';
    return 'Phụ huynh liên kết';
};

export const getNormalizedChildren = (children) => normalizeParentChildren(children);

export {
    buildParentChildDetailNavigation,
    buildParentDashboardInsights,
    buildParentChildOverview,
    buildInvoiceGroups,
    buildHouseholdFinanceSummary,
    buildParentGradesGroups,
    buildParentScheduleGroups,
    getPriorityInvoice,
};
