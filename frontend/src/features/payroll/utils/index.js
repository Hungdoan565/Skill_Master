/**
 * Payroll Utils - Tiện ích cho feature Payroll
 */

// API URL từ environment
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Format số tiền VNĐ
 */
export function formatCurrency(amount) {
    if (!amount && amount !== 0) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(amount);
}

/**
 * Format ngày tháng
 */
export function formatDate(dateString) {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

/**
 * Format thời gian
 */
export function formatTime(timeString) {
    if (!timeString) return '--';
    // timeString có thể là "HH:MM:SS" hoặc "HH:MM"
    return timeString.slice(0, 5);
}

/**
 * Format tháng/năm
 */
export function formatMonthYear(month, year) {
    const monthNames = [
        'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
        'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
        'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];
    return `${monthNames[month - 1]}/${year}`;
}

/**
 * Lấy label status payroll
 */
export function getPayrollStatusLabel(status) {
    const labels = {
        draft: 'Nháp',
        pending: 'Chờ duyệt',
        approved: 'Đã duyệt',
        paid: 'Đã thanh toán'
    };
    return labels[status] || status;
}

/**
 * Lấy màu badge cho status
 */
export function getPayrollStatusColor(status) {
    const colors = {
        draft: 'secondary',
        pending: 'warning',
        approved: 'info',
        paid: 'success'
    };
    return colors[status] || 'secondary';
}

/**
 * Format số giờ
 */
export function formatHours(hours) {
    if (!hours && hours !== 0) return '0h';
    const h = parseFloat(hours);
    if (h === Math.floor(h)) return `${Math.floor(h)}h`;
    return `${h.toFixed(1)}h`;
}

/**
 * Lấy tháng hiện tại
 */
export function getCurrentMonth() {
    const now = new Date();
    return {
        month: now.getMonth() + 1,
        year: now.getFullYear()
    };
}

/**
 * Lấy danh sách tháng trong năm
 */
export function getMonthOptions(year = new Date().getFullYear()) {
    const months = [];
    for (let i = 1; i <= 12; i++) {
        months.push({
            value: i,
            label: `Tháng ${i}/${year}`
        });
    }
    return months;
}

/**
 * Lấy danh sách năm (5 năm gần nhất)
 */
export function getYearOptions() {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= currentYear - 4; i--) {
        years.push({
            value: i,
            label: `Năm ${i}`
        });
    }
    return years;
}
