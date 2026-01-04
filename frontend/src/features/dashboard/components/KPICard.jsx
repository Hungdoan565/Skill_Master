import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export function KPICard({
    title,
    value,
    trend,
    trendLabel,
    icon: Icon,
    iconColor = "text-blue-600",
    iconBg = "bg-blue-50",
    loading = false
}) {
    if (loading) {
        return (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
                <div className="flex justify-between items-start mb-4">
                    <div className="h-10 w-10 bg-gray-100 rounded-xl" />
                    <div className="h-6 w-16 bg-gray-100 rounded-full" />
                </div>
                <div className="h-8 w-32 bg-gray-100 rounded mb-2" />
                <div className="h-4 w-24 bg-gray-100 rounded" />
            </div>
        );
    }

    const isPositive = trend > 0;
    const isNegative = trend < 0;
    const isNeutral = trend === 0;

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
                <div className={cn("p-3 rounded-xl transition-colors", iconBg, "group-hover:scale-105 duration-300")}>
                    {Icon && <Icon size={22} className={iconColor} />}
                </div>
                {trend !== undefined && (
                    <div className={cn(
                        "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold",
                        isPositive && "bg-emerald-50 text-emerald-700",
                        isNegative && "bg-red-50 text-red-700",
                        isNeutral && "bg-gray-50 text-gray-600"
                    )}>
                        {isPositive && <ArrowUp size={14} />}
                        {isNegative && <ArrowDown size={14} />}
                        {isNeutral && <Minus size={14} />}
                        <span>{Math.abs(trend)}%</span>
                    </div>
                )}
            </div>

            <div className="space-y-1">
                <h3 className="text-sm font-medium text-gray-500">{title}</h3>
                <div className="flex items-baseline gap-2">
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{value}</h2>
                    {trendLabel && (
                        <span className="text-xs text-gray-400 font-medium">
                            {trendLabel}
                        </span>
                    )}
                </div>
            </div>

            {/* Sparkline decoration effect */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-10 transition-opacity" />
        </div>
    );
}

export default KPICard;
