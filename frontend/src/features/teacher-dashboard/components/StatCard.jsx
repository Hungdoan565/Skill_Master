import { cn } from '@/lib/utils';

/**
 * Card thống kê cho Dashboard
 */
export function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    trendLabel,
    className,
    variant = 'default'
}) {
    const variants = {
        default: 'bg-white',
        primary: 'bg-blue-50 border-blue-200',
        success: 'bg-green-50 border-green-200',
        warning: 'bg-amber-50 border-amber-200',
        danger: 'bg-red-50 border-red-200'
    };

    const iconColors = {
        default: 'text-gray-500 bg-gray-100',
        primary: 'text-blue-600 bg-blue-100',
        success: 'text-green-600 bg-green-100',
        warning: 'text-amber-600 bg-amber-100',
        danger: 'text-red-600 bg-red-100'
    };

    return (
        <div className={cn(
            'rounded-xl border p-5 shadow-sm transition-all hover:shadow-md',
            variants[variant],
            className
        )}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
                    {subtitle && (
                        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
                    )}
                    {trend !== undefined && (
                        <div className="mt-2 flex items-center gap-1">
                            <span className={cn(
                                'text-sm font-medium',
                                trend >= 0 ? 'text-green-600' : 'text-red-600'
                            )}>
                                {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
                            </span>
                            {trendLabel && (
                                <span className="text-xs text-gray-500">{trendLabel}</span>
                            )}
                        </div>
                    )}
                </div>
                {Icon && (
                    <div className={cn(
                        'rounded-lg p-3',
                        iconColors[variant]
                    )}>
                        <Icon className="h-6 w-6" />
                    </div>
                )}
            </div>
        </div>
    );
}

export default StatCard;
