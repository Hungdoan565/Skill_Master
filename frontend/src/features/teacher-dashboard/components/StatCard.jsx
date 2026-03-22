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
        default: 'bg-card/95 border-border',
        primary: 'bg-blue-500/10 dark:bg-blue-500/12 border-blue-500/20 dark:border-blue-500/25',
        success: 'bg-green-500/10 dark:bg-green-500/12 border-green-500/20 dark:border-green-500/25',
        warning: 'bg-amber-500/10 dark:bg-amber-500/12 border-amber-500/20 dark:border-amber-500/25',
        danger: 'bg-red-500/10 dark:bg-red-500/12 border-red-500/20 dark:border-red-500/25'
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
            'overflow-hidden rounded-2xl border p-4 shadow-sm shadow-black/5 transition-all hover-card-lift dark:shadow-black/20',
            variants[variant],
            className
        )}>
            {/* Icon row */}
            {Icon && (
                <div className={cn(
                    'inline-flex rounded-lg p-2 mb-3',
                    iconColors[variant]
                )}>
                    <Icon className="h-5 w-5" />
                </div>
            )}
            {/* Content */}
            <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground truncate">{title}</p>
                <p className="mt-1 text-2xl font-bold text-foreground leading-tight break-words">
                    {value}
                </p>
                {subtitle && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{subtitle}</p>
                )}
                {trend !== undefined && (
                    <div className="mt-2 flex items-center gap-1">
                        <span className={cn(
                            'text-xs font-medium',
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
        </div>
    );
}

export default StatCard;
