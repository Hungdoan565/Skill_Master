/**
 * Centers Formatters
 */

import { DAY_LABELS } from './constants';

/**
 * Format working hours for display
 */
export function formatWorkingHours(workingHours) {
    if (!workingHours) return 'Chưa cấu hình';

    const days = Object.entries(workingHours);
    const openDays = days.filter(([_, hours]) => hours?.open && hours?.close);

    if (openDays.length === 0) return 'Chưa mở cửa';

    // Check if all days have same hours
    const firstHours = openDays[0]?.[1];
    const allSame = openDays.every(([_, h]) =>
        h?.open === firstHours?.open && h?.close === firstHours?.close
    );

    if (allSame && openDays.length >= 5) {
        return `${firstHours.open} - ${firstHours.close} (${openDays.length} ngày/tuần)`;
    }

    return `${openDays.length} ngày/tuần`;
}

/**
 * Get day label in Vietnamese
 */
export function getDayLabel(day) {
    return DAY_LABELS[day] || day;
}

/**
 * Format date to Vietnamese format
 */
export function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

/**
 * Get initials from name
 */
export function getInitials(name) {
    if (!name) return '?';
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

/**
 * Format phone number
 */
export function formatPhone(phone) {
    if (!phone) return '';
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    // Format: 028-1234-5678 or 0901-234-567
    if (digits.length === 10) {
        return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    if (digits.length === 11) {
        return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
    }
    return phone;
}

/**
 * Get gradient background class based on name
 */
export function getGradient(name) {
    if (!name) return 'bg-gradient-to-br from-indigo-400 to-indigo-600';

    // Hash name to get consistent color
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = ((hash << 5) - hash) + name.charCodeAt(i);
        hash = hash & hash;
    }

    const gradients = [
        'bg-gradient-to-br from-blue-400 to-blue-600',
        'bg-gradient-to-br from-purple-400 to-purple-600',
        'bg-gradient-to-br from-pink-400 to-pink-600',
        'bg-gradient-to-br from-green-400 to-green-600',
        'bg-gradient-to-br from-yellow-400 to-yellow-600',
        'bg-gradient-to-br from-red-400 to-red-600',
        'bg-gradient-to-br from-indigo-400 to-indigo-600',
        'bg-gradient-to-br from-teal-400 to-teal-600',
    ];

    return gradients[Math.abs(hash) % gradients.length];
}
