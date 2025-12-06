/**
 * LiveActivityStream Component
 * Feed hoạt động real-time trong hệ thống
 * - Enrollment mới
 * - Thanh toán
 * - Điểm danh
 * - Thay đổi lịch học
 */

import { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
    Activity,
    UserPlus,
    CreditCard,
    CheckSquare,
    Calendar,
    Bell,
    Award,
    FileText,
    RefreshCw,
    ChevronDown,
    CircleDot
} from 'lucide-react';

// Activity type configuration
const ACTIVITY_TYPES = {
    enrollment: {
        icon: UserPlus,
        color: 'bg-blue-500',
        label: 'Ghi danh'
    },
    payment: {
        icon: CreditCard,
        color: 'bg-green-500',
        label: 'Thanh toán'
    },
    attendance: {
        icon: CheckSquare,
        color: 'bg-purple-500',
        label: 'Điểm danh'
    },
    schedule: {
        icon: Calendar,
        color: 'bg-orange-500',
        label: 'Lịch học'
    },
    grade: {
        icon: Award,
        color: 'bg-yellow-500',
        label: 'Điểm số'
    },
    document: {
        icon: FileText,
        color: 'bg-cyan-500',
        label: 'Tài liệu'
    },
    notification: {
        icon: Bell,
        color: 'bg-pink-500',
        label: 'Thông báo'
    }
};

// Format relative time in Vietnamese
const formatRelativeTime = (date) => {
    try {
        return formatDistanceToNow(new Date(date), {
            addSuffix: true,
            locale: vi
        });
    } catch {
        return 'vừa xong';
    }
};

// Activity item component
function ActivityItem({ activity }) {
    const config = ACTIVITY_TYPES[activity.type] || ACTIVITY_TYPES.notification;
    const Icon = config.icon;

    return (
        <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
            {/* Icon */}
            <div className={`
        flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
        ${config.color}
      `}>
                <Icon size={14} className="text-white" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 line-clamp-2">
                    <span className="font-medium">{activity.actor}</span>
                    {' '}{activity.action}
                </p>
                {activity.details && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {activity.details}
                    </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                    {formatRelativeTime(activity.timestamp)}
                </p>
            </div>

            {/* Live indicator */}
            {activity.isNew && (
                <CircleDot size={12} className="text-green-500 flex-shrink-0 animate-pulse" />
            )}
        </div>
    );
}

// Loading skeleton
function ActivitySkeleton() {
    return (
        <div className="flex items-start gap-3 p-3 animate-pulse">
            <div className="w-8 h-8 bg-gray-200 rounded-full" />
            <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
        </div>
    );
}

// Empty state
function EmptyState() {
    return (
        <div className="py-8 text-center">
            <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Chưa có hoạt động nào</p>
        </div>
    );
}

/**
 * LiveActivityStream Component
 * @param {Object} props
 * @param {Array} props.activities - Array of activity objects
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.onRefresh - Refresh callback
 * @param {number} props.maxItems - Maximum items to show (default: 10)
 * @param {boolean} props.showLoadMore - Show load more button
 * @param {Function} props.onLoadMore - Load more callback
 */
export function LiveActivityStream({
    activities = [],
    loading = false,
    onRefresh,
    maxItems = 10,
    showLoadMore = false,
    onLoadMore
}) {
    const [displayCount, setDisplayCount] = useState(maxItems);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            await onRefresh?.();
        } finally {
            setIsRefreshing(false);
        }
    }, [onRefresh]);

    const handleLoadMore = () => {
        setDisplayCount(prev => prev + 5);
        onLoadMore?.();
    };

    const displayedActivities = activities.slice(0, displayCount);
    const hasMore = activities.length > displayCount;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                        <Activity className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Hoạt động gần đây</h3>
                        <p className="text-xs text-gray-500">Cập nhật realtime</p>
                    </div>
                </div>

                {onRefresh && (
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <RefreshCw
                            size={18}
                            className={isRefreshing ? 'animate-spin' : ''}
                        />
                    </button>
                )}
            </div>

            {/* Activity list */}
            <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
                {loading ? (
                    [...Array(5)].map((_, i) => <ActivitySkeleton key={i} />)
                ) : displayedActivities.length === 0 ? (
                    <EmptyState />
                ) : (
                    displayedActivities.map((activity, index) => (
                        <ActivityItem
                            key={activity.id || index}
                            activity={activity}
                        />
                    ))
                )}
            </div>

            {/* Load more button */}
            {(showLoadMore || hasMore) && displayedActivities.length > 0 && (
                <div className="p-3 border-t border-gray-100">
                    <button
                        onClick={handleLoadMore}
                        className="w-full py-2 text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                        <ChevronDown size={16} />
                        Xem thêm
                    </button>
                </div>
            )}
        </div>
    );
}

export default LiveActivityStream;
