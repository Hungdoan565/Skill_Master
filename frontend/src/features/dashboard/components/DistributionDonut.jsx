/**
 * DistributionDonut Component
 * Donut chart for course/student distribution
 * Based on Healthcare dashboard reference
 */

import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip
} from 'recharts';

const COLORS = ['#f97316', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card border border-border p-3 rounded-xl shadow-xl">
                <p className="text-sm font-bold text-foreground">{payload[0].name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                    {payload[0].value} học viên ({payload[0].payload.percentage}%)
                </p>
            </div>
        );
    }
    return null;
};

export function DistributionDonut({ data = [], loading = false }) {
    if (loading) {
        return (
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border animate-pulse h-full">
                <div className="h-6 w-40 bg-muted rounded mb-2" />
                <div className="h-4 w-28 bg-muted rounded mb-6" />
                <div className="h-[200px] bg-muted/50 rounded-full mx-auto w-[200px]" />
            </div>
        );
    }

    // Calculate total and percentages
    const total = data.reduce((sum, item) => sum + (item.value || 0), 0);
    const chartData = data
        .map(item => ({
            ...item,
            percentage: total > 0 ? Math.round((item.value / total) * 100) : 0
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);

    return (
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border h-full flex flex-col">
            {/* Header */}
            <div className="mb-4">
                <h3 className="text-lg font-bold text-foreground">Phân bố học viên</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Theo khóa học</p>
            </div>

            {/* Chart */}
            {chartData.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <p className="text-sm">Chưa có dữ liệu</p>
                </div>
            ) : (
                <>
                    <div className="flex-1 relative" style={{ minHeight: 200 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={85}
                                    paddingAngle={3}
                                    dataKey="value"
                                    animationBegin={0}
                                    animationDuration={1000}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                            strokeWidth={0}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Center Total */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-foreground">{total}</p>
                                <p className="text-xs text-muted-foreground">Tổng số</p>
                            </div>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 pt-4 border-t border-border">
                        {chartData.map((item, index) => (
                            <div key={index} className="flex items-center gap-2 min-w-0">
                                <div
                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                />
                                <span className="text-xs text-muted-foreground truncate flex-1">
                                    {item.name}
                                </span>
                                <span className="text-xs font-semibold text-foreground">
                                    {item.percentage}%
                                </span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export default DistributionDonut;
