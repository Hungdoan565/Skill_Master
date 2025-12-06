/**
 * StatusBadges Component
 * Collection of status badge components for dashboard
 * - Connection status
 * - Online/offline indicator
 * - Role badges
 * - Priority indicators
 */

import {
    Wifi,
    WifiOff,
    CheckCircle2,
    XCircle,
    Clock,
    AlertTriangle,
    Shield,
    User,
    GraduationCap,
    Building2
} from 'lucide-react';

// Status badge configurations
const STATUS_CONFIG = {
    // General statuses
    active: {
        label: 'Hoạt động',
        className: 'bg-green-100 text-green-700 border-green-200',
        icon: CheckCircle2
    },
    inactive: {
        label: 'Không hoạt động',
        className: 'bg-gray-100 text-gray-600 border-gray-200',
        icon: XCircle
    },
    pending: {
        label: 'Chờ xử lý',
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        icon: Clock
    },
    warning: {
        label: 'Cảnh báo',
        className: 'bg-orange-100 text-orange-700 border-orange-200',
        icon: AlertTriangle
    },
    error: {
        label: 'Lỗi',
        className: 'bg-red-100 text-red-700 border-red-200',
        icon: XCircle
    },

    // Connection statuses
    online: {
        label: 'Trực tuyến',
        className: 'bg-green-100 text-green-700 border-green-200',
        icon: Wifi
    },
    offline: {
        label: 'Ngoại tuyến',
        className: 'bg-gray-100 text-gray-600 border-gray-200',
        icon: WifiOff
    },

    // Payment statuses
    paid: {
        label: 'Đã thanh toán',
        className: 'bg-green-100 text-green-700 border-green-200',
        icon: CheckCircle2
    },
    unpaid: {
        label: 'Chưa thanh toán',
        className: 'bg-red-100 text-red-700 border-red-200',
        icon: XCircle
    },
    partial: {
        label: 'Thanh toán một phần',
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        icon: Clock
    },
    overdue: {
        label: 'Quá hạn',
        className: 'bg-red-100 text-red-700 border-red-200',
        icon: AlertTriangle
    },

    // Enrollment statuses
    enrolled: {
        label: 'Đã ghi danh',
        className: 'bg-blue-100 text-blue-700 border-blue-200',
        icon: CheckCircle2
    },
    completed: {
        label: 'Hoàn thành',
        className: 'bg-green-100 text-green-700 border-green-200',
        icon: CheckCircle2
    },
    dropped: {
        label: 'Đã nghỉ',
        className: 'bg-gray-100 text-gray-600 border-gray-200',
        icon: XCircle
    }
};

// Role configurations
const ROLE_CONFIG = {
    SUPER_ADMIN: {
        label: 'Super Admin',
        className: 'bg-purple-100 text-purple-700 border-purple-200',
        icon: Shield
    },
    CENTER_MANAGER: {
        label: 'Quản lý trung tâm',
        className: 'bg-blue-100 text-blue-700 border-blue-200',
        icon: Building2
    },
    TEACHER: {
        label: 'Giáo viên',
        className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        icon: GraduationCap
    },
    STUDENT: {
        label: 'Học viên',
        className: 'bg-cyan-100 text-cyan-700 border-cyan-200',
        icon: User
    }
};

// Priority configurations
const PRIORITY_CONFIG = {
    high: {
        label: 'Cao',
        className: 'bg-red-100 text-red-700 border-red-200',
        dot: 'bg-red-500'
    },
    medium: {
        label: 'Trung bình',
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        dot: 'bg-yellow-500'
    },
    low: {
        label: 'Thấp',
        className: 'bg-green-100 text-green-700 border-green-200',
        dot: 'bg-green-500'
    }
};

/**
 * StatusBadge - General status badge
 */
export function StatusBadge({
    status,
    customLabel,
    showIcon = true,
    size = 'sm' // 'xs' | 'sm' | 'md'
}) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.inactive;
    const Icon = config.icon;

    const sizeClasses = {
        xs: 'px-1.5 py-0.5 text-xs gap-1',
        sm: 'px-2 py-1 text-xs gap-1.5',
        md: 'px-3 py-1.5 text-sm gap-2'
    };

    const iconSizes = {
        xs: 10,
        sm: 12,
        md: 14
    };

    return (
        <span className={`
      inline-flex items-center rounded-full border font-medium
      ${config.className}
      ${sizeClasses[size]}
    `}>
            {showIcon && Icon && (
                <Icon size={iconSizes[size]} className="flex-shrink-0" />
            )}
            {customLabel || config.label}
        </span>
    );
}

/**
 * RoleBadge - User role badge
 */
export function RoleBadge({
    role,
    showIcon = true,
    size = 'sm'
}) {
    const config = ROLE_CONFIG[role] || ROLE_CONFIG.STUDENT;
    const Icon = config.icon;

    const sizeClasses = {
        xs: 'px-1.5 py-0.5 text-xs gap-1',
        sm: 'px-2 py-1 text-xs gap-1.5',
        md: 'px-3 py-1.5 text-sm gap-2'
    };

    const iconSizes = {
        xs: 10,
        sm: 12,
        md: 14
    };

    return (
        <span className={`
      inline-flex items-center rounded-full border font-medium
      ${config.className}
      ${sizeClasses[size]}
    `}>
            {showIcon && Icon && (
                <Icon size={iconSizes[size]} className="flex-shrink-0" />
            )}
            {config.label}
        </span>
    );
}

/**
 * PriorityBadge - Priority indicator
 */
export function PriorityBadge({
    priority,
    showLabel = true,
    size = 'sm'
}) {
    const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;

    const sizeClasses = {
        xs: 'px-1.5 py-0.5 text-xs gap-1',
        sm: 'px-2 py-1 text-xs gap-1.5',
        md: 'px-3 py-1.5 text-sm gap-2'
    };

    const dotSizes = {
        xs: 'w-1.5 h-1.5',
        sm: 'w-2 h-2',
        md: 'w-2.5 h-2.5'
    };

    return (
        <span className={`
      inline-flex items-center rounded-full border font-medium
      ${config.className}
      ${sizeClasses[size]}
    `}>
            <span className={`${dotSizes[size]} rounded-full ${config.dot}`} />
            {showLabel && config.label}
        </span>
    );
}

/**
 * ConnectionStatus - Real-time connection indicator
 */
export function ConnectionStatus({
    isConnected,
    showLabel = true,
    size = 'sm'
}) {
    const config = isConnected ? STATUS_CONFIG.online : STATUS_CONFIG.offline;
    const Icon = config.icon;

    const sizeClasses = {
        xs: 'text-xs gap-1',
        sm: 'text-xs gap-1.5',
        md: 'text-sm gap-2'
    };

    const iconSizes = {
        xs: 10,
        sm: 12,
        md: 14
    };

    return (
        <span className={`
      inline-flex items-center font-medium
      ${isConnected ? 'text-green-600' : 'text-gray-500'}
      ${sizeClasses[size]}
    `}>
            <span className="relative flex h-2 w-2">
                {isConnected && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
            </span>
            {showLabel && (
                <span className="ml-1">{config.label}</span>
            )}
        </span>
    );
}

/**
 * OnlineIndicator - Simple online dot
 */
export function OnlineIndicator({ isOnline = false }) {
    return (
        <span className="relative flex h-3 w-3">
            {isOnline && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            )}
            <span className={`
        relative inline-flex rounded-full h-3 w-3
        ${isOnline ? 'bg-green-500' : 'bg-gray-300'}
      `} />
        </span>
    );
}

// Export all badge configurations for external use
export const StatusBadges = {
    StatusBadge,
    RoleBadge,
    PriorityBadge,
    ConnectionStatus,
    OnlineIndicator,
    STATUS_CONFIG,
    ROLE_CONFIG,
    PRIORITY_CONFIG
};

export default StatusBadges;
