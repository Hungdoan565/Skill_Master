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
        default: 'bg-card border-border',
        primary: 'bg-blue-500/10 border-blue-500/20',
        success: 'bg-green-500/10 border-green-500/20',
        warning: 'bg-amber-500/10 border-amber-500/20',
        danger: 'bg-red-500/10 border-red-500/20'
    };

    const iconColors = {
        default: 'text-muted-foreground bg-muted',
        primary: 'text-blue-600 dark:text-blue-400 bg-blue-500/20',
        success: 'text-green-600 dark:text-green-400 bg-green-500/20',
        warning: 'text-amber-600 dark:text-amber-400 bg-amber-500/20',
        danger: 'text-red-600 dark:text-red-400 bg-red-500/20'
    };

    return (
        <div className={cn(
            'rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md',
            variants[variant],
            className
        )}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
                    {subtitle && (
                        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
                    )}
                    {trend !== undefined && (
                        <div className="mt-2 flex items-center gap-1">
                            <span className={cn(
                                'text-sm font-medium',
                                trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            )}>
                                {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
                            </span>
                            {trendLabel && (
                                <span className="text-xs text-muted-foreground">{trendLabel}</span>
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
