/**
 * Certificates Utils
 */

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const CERTIFICATE_STATUS = {
    DRAFT: 'draft',
    ISSUED: 'issued',
    REVOKED: 'revoked',
};

export const STATUS_OPTIONS = [
    { value: 'draft', label: 'Nháp', color: 'bg-slate-100 text-slate-700' },
    { value: 'issued', label: 'Đã cấp', color: 'bg-green-100 text-green-700' },
    { value: 'revoked', label: 'Đã thu hồi', color: 'bg-red-100 text-red-700' },
];

export const GRADE_OPTIONS = [
    { value: 'excellent', label: 'Xuất sắc', minScore: 9.0, color: 'bg-purple-100 text-purple-700' },
    { value: 'good', label: 'Giỏi', minScore: 8.0, color: 'bg-blue-100 text-blue-700' },
    { value: 'fair', label: 'Khá', minScore: 6.5, color: 'bg-green-100 text-green-700' },
    { value: 'pass', label: 'Đạt', minScore: 5.0, color: 'bg-yellow-100 text-yellow-700' },
];

export const getStatusConfig = (status) => {
    return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
};

export const getGradeConfig = (grade) => {
    return GRADE_OPTIONS.find(g => g.value === grade) || GRADE_OPTIONS[3];
};

export const getGradeByScore = (score) => {
    for (const grade of GRADE_OPTIONS) {
        if (score >= grade.minScore) return grade;
    }
    return null;
};

export const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

export const generateCertificateNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `CERT-${year}-${random}`;
};
