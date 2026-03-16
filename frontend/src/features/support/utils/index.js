/**
 * Support Utils
 */

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const TICKET_STATUS = {
    OPEN: 'open',
    IN_PROGRESS: 'in_progress',
    RESOLVED: 'resolved',
    CLOSED: 'closed',
};

export const STATUS_OPTIONS = [
    { value: 'open', label: 'Mới', color: 'bg-blue-100 text-blue-700', bgColor: 'bg-blue-500' },
    { value: 'in_progress', label: 'Đang xử lý', color: 'bg-yellow-100 text-yellow-700', bgColor: 'bg-yellow-500' },
    { value: 'resolved', label: 'Đã giải quyết', color: 'bg-green-100 text-green-700', bgColor: 'bg-green-500' },
    { value: 'closed', label: 'Đã đóng', color: 'bg-slate-100 text-slate-700', bgColor: 'bg-slate-500' },
];

export const PRIORITY_OPTIONS = [
    { value: 'low', label: 'Thấp', color: 'bg-slate-100 text-slate-700' },
    { value: 'medium', label: 'Trung bình', color: 'bg-blue-100 text-blue-700' },
    { value: 'high', label: 'Cao', color: 'bg-orange-100 text-orange-700' },
    { value: 'urgent', label: 'Khẩn cấp', color: 'bg-red-100 text-red-700' },
];

export const CATEGORY_OPTIONS = [
    { value: 'general', label: 'Chung', icon: 'HelpCircle' },
    { value: 'consultation', label: 'Tư vấn', icon: 'ClipboardList' },
    { value: 'technical', label: 'Kỹ thuật', icon: 'Settings' },
    { value: 'billing', label: 'Thanh toán', icon: 'CreditCard' },
    { value: 'course', label: 'Khóa học', icon: 'BookOpen' },
    { value: 'schedule', label: 'Lịch học', icon: 'Calendar' },
    { value: 'certificate', label: 'Chứng chỉ', icon: 'Award' },
    { value: 'other', label: 'Khác', icon: 'HelpCircle' },
];

export const getStatusConfig = (status) => {
    return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
};

export const getPriorityConfig = (priority) => {
    return PRIORITY_OPTIONS.find(p => p.value === priority) || PRIORITY_OPTIONS[1];
};

export const getCategoryConfig = (category) => {
    return CATEGORY_OPTIONS.find(c => c.value === category) || CATEGORY_OPTIONS[5];
};

export const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return formatDate(dateString);
};
