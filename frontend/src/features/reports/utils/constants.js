/**
 * Reports Utils - Constants
 */

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Report types
export const REPORT_TYPES = {
    REVENUE: 'revenue',
    ENROLLMENT: 'enrollment',
    ATTENDANCE: 'attendance',
    GRADES: 'grades',
    STAFF: 'staff',
    COURSES: 'courses'
};

// Report type labels (Vietnamese)
export const REPORT_TYPE_LABELS = {
    revenue: 'Doanh thu',
    enrollment: 'Tuyển sinh',
    attendance: 'Chuyên cần',
    grades: 'Điểm số',
    staff: 'Nhân sự',
    courses: 'Khóa học'
};

// Date range presets
export const DATE_PRESETS = [
    { label: 'Hôm nay', value: 'today' },
    { label: '7 ngày qua', value: '7days' },
    { label: '30 ngày qua', value: '30days' },
    { label: 'Tháng này', value: 'thisMonth' },
    { label: 'Tháng trước', value: 'lastMonth' },
    { label: 'Quý này', value: 'thisQuarter' },
    { label: 'Năm nay', value: 'thisYear' },
    { label: 'Tùy chỉnh', value: 'custom' }
];

// Get date range from preset
export function getDateRangeFromPreset(preset) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (preset) {
        case 'today':
            return { start: today, end: today };
        case '7days':
            return {
                start: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000),
                end: today
            };
        case '30days':
            return {
                start: new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000),
                end: today
            };
        case 'thisMonth':
            return {
                start: new Date(now.getFullYear(), now.getMonth(), 1),
                end: today
            };
        case 'lastMonth':
            return {
                start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
                end: new Date(now.getFullYear(), now.getMonth(), 0)
            };
        case 'thisQuarter': {
            const quarter = Math.floor(now.getMonth() / 3);
            return {
                start: new Date(now.getFullYear(), quarter * 3, 1),
                end: today
            };
        }
        case 'thisYear':
            return {
                start: new Date(now.getFullYear(), 0, 1),
                end: today
            };
        default:
            return { start: today, end: today };
    }
}

// Format date to YYYY-MM-DD
export function formatDateParam(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
}

// Format currency
export function formatCurrency(amount) {
    if (!amount && amount !== 0) return '0 đ';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0
    }).format(amount);
}

// Format number with commas
export function formatNumber(num) {
    if (!num && num !== 0) return '0';
    return new Intl.NumberFormat('vi-VN').format(num);
}

// Format percentage
export function formatPercent(value, decimals = 1) {
    if (!value && value !== 0) return '0%';
    return `${value.toFixed(decimals)}%`;
}

// Chart colors
export const CHART_COLORS = [
    '#3b82f6', // blue
    '#22c55e', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange
    '#6366f1', // indigo
    '#84cc16'  // lime
];

// Payment method labels
export const PAYMENT_METHOD_LABELS = {
    cash: 'Tiền mặt',
    bank_transfer: 'Chuyển khoản',
    card: 'Thẻ',
    momo: 'MoMo',
    vnpay: 'VNPay'
};

// Attendance status labels
export const ATTENDANCE_STATUS_LABELS = {
    present: 'Có mặt',
    absent: 'Vắng',
    late: 'Trễ',
    excused: 'Có phép'
};
