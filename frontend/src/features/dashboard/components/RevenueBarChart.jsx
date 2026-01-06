/**
 * RevenueBarChart Component
 * Modern bar chart with comparison toggle
 * Colors: Orange (current), Dark gray (previous)
 */

import { useState } from 'react';
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

const CustomLegend = ({ payload }) => (
    <div className="flex items-center justify-center gap-6 mt-4">
        {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.color }} />
                <span className="text-xs font-medium text-muted-foreground">{entry.value}</span>
            </div>
        ))}
    </div>
);

export function RevenueBarChart({ data = [], previousData = [], loading = false, height = 320 }) {
    const [showComparison, setShowComparison] = useState(false);

    if (loading) {
        return (
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border animate-pulse">
                <div className="h-6 w-48 bg-muted rounded mb-2" />
                <div className="h-4 w-32 bg-muted rounded mb-6" />
                <div className="h-[280px] bg-muted/50 rounded-xl" />
            </div>
        );
    }

    // Transform and merge data
    // Note: previousData should come from API for real comparison
    const chartData = data.map((item, index) => ({
        name: item.label || item.month,
        current: item.revenue || 0,
        // Only show previous if real data provided, no mock
        previous: previousData[index]?.revenue || null,
    }));

    return (
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-foreground">Phân tích doanh thu</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">12 tháng gần nhất</p>
                </div>

                {/* Comparison Toggle */}
                <button
                    onClick={() => setShowComparison(!showComparison)}
                    className={`
            px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
            ${showComparison
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }
          `}
                >
                    {showComparison ? '📊 So sánh: Bật' : '📊 So sánh'}
                </button>
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

                            {showComparison && (
                                <>
                                    <Legend content={<CustomLegend />} />
                                    <Bar
                                        dataKey="previous"
                                        name="Kỳ trước"
                                        fill="#6b7280"
                                        radius={[4, 4, 0, 0]}
                                        maxBarSize={30}
                                    />
                                </>
                            )}

                            <Bar
                                dataKey="current"
                                name={showComparison ? "Kỳ này" : "Doanh thu"}
                                fill="#f97316"
                                radius={[6, 6, 0, 0]}
                                maxBarSize={showComparison ? 30 : 40}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}

export default RevenueBarChart;

