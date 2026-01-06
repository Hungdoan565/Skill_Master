/**
 * Certificate constants
 * Extracted from CertificatesPage for reuse
 */

import { Globe, FileText, BookOpen, Users, Award } from 'lucide-react';

// Category icons and colors
export const CATEGORY_CONFIG = {
    language: {
        icon: Globe,
        color: 'bg-blue-500',
        borderColor: '#3b82f6',
        bgLight: 'bg-blue-50',
        textColor: 'text-blue-700',
        label: 'Ngoại ngữ'
    },
    office: {
        icon: FileText,
        color: 'bg-green-500',
        borderColor: '#22c55e',
        bgLight: 'bg-green-50',
        textColor: 'text-green-700',
        label: 'Tin học văn phòng'
    },
    programming: {
        icon: BookOpen,
        color: 'bg-purple-500',
        borderColor: '#a855f7',
        bgLight: 'bg-purple-50',
        textColor: 'text-purple-700',
        label: 'Lập trình'
    },
    soft_skill: {
        icon: Users,
        color: 'bg-orange-500',
        borderColor: '#f97316',
        bgLight: 'bg-orange-50',
        textColor: 'text-orange-700',
        label: 'Kỹ năng mềm'
    },
    other: {
        icon: Award,
        color: 'bg-gray-500',
        borderColor: '#6b7280',
        bgLight: 'bg-gray-50',
        textColor: 'text-gray-700',
        label: 'Khác'
    }
};

// Provider logos (placeholder)
export const PROVIDER_LOGOS = {
    'British Council / IDP / Cambridge': '🇬🇧',
    'ETS': '🇺🇸',
    'Microsoft': '🪟',
};
