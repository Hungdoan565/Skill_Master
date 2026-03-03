/**
 * SlimStatBar Component
 * 
 * Compact horizontal statistics bar for high-density admin dashboards.
 * Replaces large StatCards grid with a slim ~80px bar.
 * 
 * Features:
 * - Clickable stats to filter table data
 * - Compact design maximizing screen real estate for table
 * - Dark mode compatible
 * 
 * @param {Object} statistics - Data statistics from API
 * @param {boolean} loading - Loading state
 * @param {function} onStatusClick - Filter handler (status)
 * @param {function} onOverdueClick - Overdue filter handler
 */

import { TrendingUp, AlertCircle, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SlimStatBar({
    statistics,
    loading,
    onStatusClick,
    onOverdueClick,
    onMonthlyRevenueClick
}) {
    const overdueCount = statistics?.counts?.overdue || 0;

    const stats = [
        {
            id: 'revenue',
            label: 'Tổng thu',
            value: loading ? '...' : formatCompactCurrency(statistics?.monthlyRevenue || 0),
            icon: TrendingUp,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-500',
            onClick: onMonthlyRevenueClick,
        },
        {
            id: 'debt',
            label: 'Còn nợ',
            value: loading ? '...' : formatCompactCurrency(statistics?.totalDebt || 0),
            icon: AlertCircle,
            color: 'text-red-600',
            bgColor: 'bg-red-500',
            onClick: () => onStatusClick?.('unpaid'),
        },
        {
            id: 'overdue',
            label: 'Quá hạn',
            value: loading ? '...' : overdueCount,
            icon: AlertTriangle,
            color: 'text-orange-600',
            bgColor: 'bg-orange-500',
            onClick: onOverdueClick,
            highlight: overdueCount > 0,
        },
        {
            id: 'partial',
            label: 'Thanh toán 1 phần',
            value: loading ? '...' : (statistics?.counts?.partial || 0),
            icon: Clock,
            color: 'text-amber-600',
            bgColor: 'bg-amber-500',
            onClick: () => onStatusClick?.('partial'),
        },
        {
            id: 'paid',
            label: 'Hoàn thành',
            value: loading ? '...' : (statistics?.counts?.paid || 0),
            icon: CheckCircle2,
            color: 'text-blue-600',
            bgColor: 'bg-blue-500',
            onClick: () => onStatusClick?.('paid'),
        },
    ];

    return (
        <div className="flex items-center gap-1 px-4 py-3 bg-white border-b border-border overflow-x-auto">
            {stats.map((stat, index) => (
                <StatItem key={stat.id} stat={stat} isFirst={index === 0} />
            ))}
        </div>
    );
}

function StatItem({ stat, isFirst }) {
    const Icon = stat.icon;

    return (
        <>
            {!isFirst && (
                <div className="w-px h-8 bg-border mx-2 flex-shrink-0" />
            )}
            <button
                onClick={stat.onClick}
                className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all',
                    'hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
                    stat.highlight && 'bg-orange-50 dark:bg-orange-950/30 animate-pulse'
                )}
                title={`Lọc theo: ${stat.label}`}
            >
                {/* Dot indicator */}
                <span className={cn('w-2 h-2 rounded-full flex-shrink-0', stat.bgColor)} />

                {/* Label */}
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {stat.label}
                </span>

                {/* Value */}
                <span className={cn(
                    'text-sm font-semibold font-mono tabular-nums whitespace-nowrap',
                    stat.color
                )}>
                    {stat.value}
                </span>
            </button>
        </>
    );
}

/**
 * Format large numbers to compact form (e.g., 64,000,000 -> 64M)
 */
function formatCompactCurrency(amount) {
    if (amount >= 1_000_000_000) {
        return `${(amount / 1_000_000_000).toFixed(1)}B`;
    }
    if (amount >= 1_000_000) {
        return `${(amount / 1_000_000).toFixed(0)}M`;
    }
    if (amount >= 1_000) {
        return `${(amount / 1_000).toFixed(0)}K`;
    }
    return amount.toLocaleString();
}

export default SlimStatBar;
