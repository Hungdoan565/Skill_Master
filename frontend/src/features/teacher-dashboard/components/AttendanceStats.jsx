import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';

/**
 * Component hiển thị thống kê điểm danh
 */
export function AttendanceStats({ stats }) {
    if (!stats) {
        return null;
    }

    const { completion_rate, by_class = [], monthly_trend } = stats;

    // Circular progress for overall completion rate
    const CircularProgress = ({ percentage, size = 120, strokeWidth = 10 }) => {
        const radius = (size - strokeWidth) / 2;
        const circumference = radius * 2 * Math.PI;
        const offset = circumference - (percentage / 100) * circumference;

        return (
            <div className="relative" style={{ width: size, height: size }}>
                <svg className="transform -rotate-90" width={size} height={size}>
                    {/* Background circle */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth={strokeWidth}
                    />
                    {/* Progress circle */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={percentage >= 80 ? '#22c55e' : percentage >= 50 ? '#f59e0b' : '#ef4444'}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">{percentage}%</span>
                    <span className="text-xs text-gray-500">Hoàn thành</span>
                </div>
            </div>
        );
    };

    return (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                    📊 Thống kê điểm danh
                </h3>
                {monthly_trend && (
                    <div className="flex items-center gap-1 text-sm">
                        <TrendingUp className={cn(
                            'h-4 w-4',
                            monthly_trend >= 0 ? 'text-green-500' : 'text-red-500'
                        )} />
                        <span className={cn(
                            monthly_trend >= 0 ? 'text-green-600' : 'text-red-600'
                        )}>
                            {monthly_trend >= 0 ? '+' : ''}{monthly_trend}% vs tháng trước
                        </span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Overall completion rate */}
                <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-gray-50">
                    <CircularProgress percentage={completion_rate || 0} />
                    <p className="mt-3 text-sm text-gray-600 text-center">
                        Tỷ lệ điểm danh đúng hạn
                    </p>
                </div>

                {/* By class breakdown */}
                <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Theo lớp học</h4>
                    {by_class.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">Chưa có dữ liệu</p>
                    ) : (
                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                            {by_class.map((item, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-700 truncate">
                                            {item.class_name}
                                        </p>
                                        <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className={cn(
                                                    'h-full rounded-full transition-all duration-500',
                                                    item.rate >= 80 ? 'bg-green-500' :
                                                        item.rate >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                                )}
                                                style={{ width: `${item.rate || 0}%` }}
                                            />
                                        </div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-600 w-12 text-right">
                                        {item.rate}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Legend */}
            <div className="mt-6 pt-4 border-t flex items-center justify-center gap-6 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-green-500" />
                    Tốt (≥80%)
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                    Trung bình (50-79%)
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-red-500" />
                    Cần cải thiện (&lt;50%)
                </span>
            </div>
        </div>
    );
}

export default AttendanceStats;
