/**
 * Enrollments Utils - Constants và helpers
 */

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const ENROLLMENT_STATUS = {
    ACTIVE: 'active',
    COMPLETED: 'completed',
    DROPPED: 'dropped',
    PENDING: 'pending',
};

export const STATUS_OPTIONS = [
    { value: 'active', label: 'Đang học', color: 'bg-green-100 text-green-700' },
    { value: 'completed', label: 'Hoàn thành', color: 'bg-blue-100 text-blue-700' },
    { value: 'dropped', label: 'Đã nghỉ', color: 'bg-red-100 text-red-700' },
    { value: 'pending', label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-700' },
];

export const getStatusConfig = (status) => {
    return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
};

export const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

export const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '—';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(amount);
};
