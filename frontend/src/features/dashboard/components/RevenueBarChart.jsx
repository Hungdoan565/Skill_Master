/**
 * RevenueBarChart Component
 * Modern bar chart matching Healthcare/Tirmary design reference
 * Colors: Orange primary bars, dark secondary for comparison
 */

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';

const formatCurrency = (value) => {
    if (!value) return '0đ';
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card border border-border p-3 rounded-xl shadow-xl">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    {label}
                </p>
                {payload.map((entry, index) => (
                    <p key={index} className="text-sm font-semibold" style={{ color: entry.color }}>
                        {entry.name}: {formatCurrency(entry.value)} đ
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export function RevenueBarChart({ data = [], loading = false, height = 320 }) {
    if (loading) {
        return (
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border animate-pulse">
                <div className="h-6 w-48 bg-muted rounded mb-2" />
                <div className="h-4 w-32 bg-muted rounded mb-6" />
                <div className="h-[280px] bg-muted/50 rounded-xl" />
            </div>
        );
    }

    // Transform data for chart
    const chartData = data.map(item => ({
        name: item.label || item.month,
        revenue: item.revenue || 0,
    }));

    return (
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border h-full">
            {/* Header */}
            <div className="mb-6">
                <h3 className="text-lg font-bold text-foreground">Phân tích doanh thu</h3>
                <p className="text-sm text-muted-foreground mt-0.5">12 tháng gần nhất</p>
            </div>

            {/* Chart */}
            {chartData.length === 0 ? (
                <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                    <p className="text-sm">Chưa có dữ liệu doanh thu</p>
                </div>
            ) : (
                <div style={{ width: '100%', height }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="hsl(var(--border))"
                            />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                                tickFormatter={formatCurrency}
                                width={50}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }} />
                            <Bar
                                dataKey="revenue"
                                name="Doanh thu"
                                fill="#f97316"
                                radius={[6, 6, 0, 0]}
                                maxBarSize={40}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}

export default RevenueBarChart;
