/**
 * StatCard Component
 * Modern KPI card based on Tirmary design reference
 * Layout: Icon (left) | Content (right: label + value + trend)
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const ICON_COLORS = {
    orange: { bg: 'bg-orange-500', text: 'text-white' },
    emerald: { bg: 'bg-emerald-500', text: 'text-white' },
    blue: { bg: 'bg-blue-500', text: 'text-white' },
    red: { bg: 'bg-red-500', text: 'text-white' },
    purple: { bg: 'bg-purple-500', text: 'text-white' },
    amber: { bg: 'bg-amber-500', text: 'text-white' },
};

export function StatCard({
    title,
    value,
    trend,
    trendLabel,
    icon: Icon,
    iconColor = 'orange',
    loading = false,
    onClick
}) {
    if (loading) {
        return (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-border animate-pulse">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-muted" />
                    <div className="flex-1">
                        <div className="h-4 w-24 bg-muted rounded mb-3" />
                        <div className="h-8 w-32 bg-muted rounded" />
                    </div>
                </div>
            </div>
        );
    }

    const colors = ICON_COLORS[iconColor] || ICON_COLORS.orange;
    const isPositive = trend > 0;
    const isNegative = trend < 0;
    const isNeutral = trend === 0 || trend === undefined;

    return (
        <div
            onClick={onClick}
            className={`
        bg-white rounded-2xl p-6 shadow-sm border border-border
        hover:shadow-md transition-all duration-300
        ${onClick ? 'cursor-pointer hover:border-primary/20' : ''}
      `}
        >
            <div className="flex items-center gap-4">
                {/* Icon Circle */}
                <div className={`
          w-14 h-14 rounded-2xl flex items-center justify-center
          ${colors.bg} shadow-lg
        `}>
                    {Icon && <Icon size={26} className={colors.text} strokeWidth={2} />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Label */}
                    <p className="text-sm font-medium text-muted-foreground mb-1 truncate">
                        {title}
                    </p>

                    {/* Value + Trend Row */}
                    <div className="flex items-center gap-3">
                        <h3 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
                            {value}
                        </h3>

                        {/* Trend Badge */}
                        {trend !== undefined && (
                            <div className={`
                inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold
                ${isPositive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : ''}
                ${isNegative ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : ''}
                ${isNeutral ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' : ''}
              `}>
                                {isPositive && <TrendingUp size={12} />}
                                {isNegative && <TrendingDown size={12} />}
                                {isNeutral && <Minus size={12} />}
                                <span>{isPositive ? '+' : ''}{trend}%</span>
                            </div>
                        )}
                    </div>

                    {/* Trend Label */}
                    {trendLabel && (
                        <p className="text-xs text-muted-foreground mt-1">
                            {trendLabel}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default StatCard;
