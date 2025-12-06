/**
 * ModernStatCard Component
 * Card hiển thị số liệu với thiết kế hiện đại
 * - Gradient background support
 * - Animation khi hover
 * - Icon support với nhiều màu sắc
 * - Trend indicator
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// Color variants với gradient backgrounds
const colorVariants = {
    blue: {
        bg: 'bg-gradient-to-br from-blue-500 to-blue-600',
        lightBg: 'bg-blue-50',
        text: 'text-blue-600',
        icon: 'text-white',
    },
    green: {
        bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
        lightBg: 'bg-emerald-50',
        text: 'text-emerald-600',
        icon: 'text-white',
    },
    orange: {
        bg: 'bg-gradient-to-br from-orange-500 to-orange-600',
        lightBg: 'bg-orange-50',
        text: 'text-orange-600',
        icon: 'text-white',
    },
    purple: {
        bg: 'bg-gradient-to-br from-purple-500 to-purple-600',
        lightBg: 'bg-purple-50',
        text: 'text-purple-600',
        icon: 'text-white',
    },
    red: {
        bg: 'bg-gradient-to-br from-red-500 to-red-600',
        lightBg: 'bg-red-50',
        text: 'text-red-600',
        icon: 'text-white',
    },
    gray: {
        bg: 'bg-gradient-to-br from-gray-500 to-gray-600',
        lightBg: 'bg-gray-50',
        text: 'text-gray-600',
        icon: 'text-white',
    },
    indigo: {
        bg: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
        lightBg: 'bg-indigo-50',
        text: 'text-indigo-600',
        icon: 'text-white',
    },
    cyan: {
        bg: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
        lightBg: 'bg-cyan-50',
        text: 'text-cyan-600',
        icon: 'text-white',
    },
};

// Trend Badge component
function TrendBadge({ trend, trendUp }) {
    if (trend === null || trend === undefined) return null;

    const isPositive = trendUp ?? trend >= 0;
    const isNeutral = trend === 0;

    return (
        <div
            className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
        ${isNeutral
                    ? 'bg-gray-100 text-gray-600'
                    : isPositive
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                }
      `}
        >
            {isNeutral ? (
                <Minus size={12} />
            ) : isPositive ? (
                <TrendingUp size={12} />
            ) : (
                <TrendingDown size={12} />
            )}
            <span>{trend > 0 ? '+' : ''}{trend}%</span>
        </div>
    );
}

// Loading skeleton
function ModernStatCardSkeleton({ variant = 'default' }) {
    if (variant === 'gradient') {
        return (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 p-6 animate-pulse">
                <div className="h-6 w-24 bg-white/30 rounded mb-4" />
                <div className="h-10 w-32 bg-white/30 rounded mb-2" />
                <div className="h-4 w-20 bg-white/30 rounded" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
            <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 bg-gray-200 rounded-xl" />
                <div className="h-6 w-16 bg-gray-200 rounded-full" />
            </div>
            <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
            <div className="h-8 w-32 bg-gray-200 rounded" />
        </div>
    );
}

/**
 * ModernStatCard
 * @param {Object} props
 * @param {string} props.title - Card title
 * @param {string|number} props.value - Main value to display
 * @param {string} props.description - Optional description text
 * @param {number} props.trend - Trend percentage
 * @param {boolean} props.trendUp - Force trend direction (optional)
 * @param {React.ComponentType} props.icon - Lucide icon component
 * @param {string} props.color - Color variant
 * @param {string} props.variant - 'default' | 'gradient' | 'compact'
 * @param {boolean} props.loading - Show loading skeleton
 * @param {Function} props.onClick - Click handler
 */
export function ModernStatCard({
    title,
    value,
    description,
    trend,
    trendUp,
    icon: Icon,
    color = 'blue',
    variant = 'default',
    loading = false,
    onClick
}) {
    const colors = colorVariants[color] || colorVariants.blue;

    if (loading) {
        return <ModernStatCardSkeleton variant={variant} />;
    }

    // Gradient variant - full gradient background
    if (variant === 'gradient') {
        return (
            <div
                className={`
          relative overflow-hidden rounded-2xl p-6 ${colors.bg}
          hover:shadow-lg hover:scale-[1.02] transition-all duration-300
          ${onClick ? 'cursor-pointer' : ''}
        `}
                onClick={onClick}
            >
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-6 -translate-x-6" />

                <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                        <p className="text-white/80 text-sm font-medium">{title}</p>
                        {Icon && (
                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                <Icon size={20} className="text-white" />
                            </div>
                        )}
                    </div>

                    <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>

                    <div className="flex items-center gap-3">
                        {description && (
                            <p className="text-white/70 text-sm">{description}</p>
                        )}
                        {trend !== null && trend !== undefined && (
                            <div
                                className={`
                  inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                  bg-white/20 text-white backdrop-blur-sm
                `}
                            >
                                {(trendUp ?? trend >= 0) ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                <span>{trend > 0 ? '+' : ''}{trend}%</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Compact variant - smaller card
    if (variant === 'compact') {
        return (
            <div
                className={`
          bg-white rounded-xl border border-gray-100 p-4
          hover:shadow-md hover:border-gray-200 transition-all duration-200
          ${onClick ? 'cursor-pointer' : ''}
        `}
                onClick={onClick}
            >
                <div className="flex items-center gap-3">
                    {Icon && (
                        <div className={`p-2 rounded-lg ${colors.lightBg}`}>
                            <Icon size={18} className={colors.text} />
                        </div>
                    )}

                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 truncate">{title}</p>
                        <div className="flex items-baseline gap-2">
                            <h4 className="text-lg font-bold text-gray-900">{value}</h4>
                            <TrendBadge trend={trend} trendUp={trendUp} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Default variant - standard card with icon
    return (
        <div
            className={`
        bg-white rounded-2xl border border-gray-100 shadow-sm p-6
        hover:shadow-md hover:border-gray-200 transition-all duration-200
        ${onClick ? 'cursor-pointer' : ''}
      `}
            onClick={onClick}
        >
            <div className="flex items-start justify-between mb-4">
                {Icon && (
                    <div className={`p-3 rounded-xl ${colors.bg}`}>
                        <Icon size={24} className={colors.icon} />
                    </div>
                )}
                <TrendBadge trend={trend} trendUp={trendUp} />
            </div>

            <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
            <h3 className="text-2xl lg:text-3xl font-bold text-gray-900">{value}</h3>

            {description && (
                <p className="text-xs text-gray-400 mt-2">{description}</p>
            )}
        </div>
    );
}

export default ModernStatCard;
