/**
 * CenterRevenueTab Component - Tab doanh thu với biểu đồ
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    Receipt,
    ExternalLink,
    Calendar,
    CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

export function CenterRevenueTab({
    revenueData = [],
    statistics,
    loading = false,
    centerId
}) {
    const navigate = useNavigate();

    // Calculate summary
    const summary = useMemo(() => {
        if (!revenueData.length) return null;

        const totalRevenue = revenueData.reduce((sum, m) => sum + (m.revenue || 0), 0);
        const avgRevenue = totalRevenue / revenueData.length;
        const currentMonth = revenueData[revenueData.length - 1];
        const lastMonth = revenueData[revenueData.length - 2];

        const trend = lastMonth?.revenue
            ? ((currentMonth?.revenue - lastMonth.revenue) / lastMonth.revenue * 100).toFixed(1)
            : 0;

        return {
            totalRevenue,
            avgRevenue,
            currentMonth: currentMonth?.revenue || 0,
            trend: parseFloat(trend),
            trendUp: parseFloat(trend) >= 0
        };
    }, [revenueData]);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <Card key={i} className="p-4 animate-pulse">
                            <div className="h-4 w-20 bg-gray-200 rounded mb-2" />
                            <div className="h-8 w-32 bg-gray-200 rounded" />
                        </Card>
                    ))}
                </div>
                <Card className="p-6 animate-pulse">
                    <div className="h-6 w-40 bg-gray-200 rounded mb-4" />
                    <div className="h-64 bg-gray-100 rounded" />
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Revenue Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    title="Doanh thu tháng này"
                    value={formatCurrency(summary?.currentMonth || 0)}
                    icon={DollarSign}
                    color="emerald"
                    trend={summary?.trend}
                    trendUp={summary?.trendUp}
                />
                <StatCard
                    title="Tổng còn nợ"
                    value={formatCurrency(statistics?.totalDebt || 0)}
                    icon={AlertCircle}
                    color="red"
                    subText={`${statistics?.counts?.unpaid || 0} chưa thanh toán`}
                />
                <StatCard
                    title="Đang chờ thanh toán"
                    value={statistics?.counts?.partial || 0}
                    icon={CreditCard}
                    color="amber"
                    subText="Hóa đơn"
                />
                <StatCard
                    title="Đã thanh toán"
                    value={statistics?.counts?.paid || 0}
                    icon={Receipt}
                    color="blue"
                    subText="Hóa đơn"
                />
            </div>

            {/* Revenue Chart */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="font-semibold text-gray-900">Doanh thu theo tháng</h3>
                        <p className="text-sm text-gray-500 mt-0.5">12 tháng gần nhất</p>
                    </div>
                    <Button
                        onClick={() => navigate(`/admin/invoices?centerId=${centerId}`)}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                    >
                        <ExternalLink className="h-4 w-4" />
                        Xem hóa đơn
                    </Button>
                </div>

                {revenueData.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-gray-500">
                        <div className="text-center">
                            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p>Chưa có dữ liệu doanh thu</p>
                        </div>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                                dataKey="month"
                                tick={{ fontSize: 12, fill: '#6b7280' }}
                                tickLine={false}
                                axisLine={{ stroke: '#e5e7eb' }}
                            />
                            <YAxis
                                tick={{ fontSize: 12, fill: '#6b7280' }}
                                tickLine={false}
                                axisLine={{ stroke: '#e5e7eb' }}
                                tickFormatter={(value) => formatYAxis(value)}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="#6366f1"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorRevenue)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </Card>

            {/* Summary stats */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-4">
                        <p className="text-sm text-gray-500 mb-1">Tổng doanh thu (12 tháng)</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {formatCurrency(summary.totalRevenue)}
                        </p>
                    </Card>
                    <Card className="p-4">
                        <p className="text-sm text-gray-500 mb-1">Trung bình/tháng</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {formatCurrency(summary.avgRevenue)}
                        </p>
                    </Card>
                    <Card className="p-4">
                        <p className="text-sm text-gray-500 mb-1">Tăng trưởng so tháng trước</p>
                        <div className="flex items-center gap-2">
                            <p className={`text-2xl font-bold ${summary.trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
                                {summary.trend > 0 ? '+' : ''}{summary.trend}%
                            </p>
                            {summary.trendUp ? (
                                <TrendingUp className="h-5 w-5 text-emerald-500" />
                            ) : (
                                <TrendingDown className="h-5 w-5 text-red-500" />
                            )}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}

// Stat Card component
function StatCard({ title, value, icon: Icon, color, trend, trendUp, subText }) {
    const colorMap = {
        emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
        red: { bg: 'bg-red-50', text: 'text-red-600' },
        amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
        blue: { bg: 'bg-blue-50', text: 'text-blue-600' }
    };
    const colors = colorMap[color] || colorMap.emerald;

    return (
        <Card className="p-4">
            <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${colors.bg}`}>
                    <Icon className={`h-5 w-5 ${colors.text}`} />
                </div>
                {trend !== undefined && (
                    <Badge className={trendUp ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                        {trendUp ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                        {trend > 0 ? '+' : ''}{trend}%
                    </Badge>
                )}
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500">{subText || title}</p>
        </Card>
    );
}

// Custom tooltip for chart
function CustomTooltip({ active, payload, label }) {
    if (!active || !payload || !payload.length) return null;

    return (
        <div className="bg-white px-3 py-2 shadow-lg rounded-lg border border-gray-100">
            <p className="text-sm font-medium text-gray-900">{label}</p>
            <p className="text-sm text-indigo-600">
                {formatCurrency(payload[0].value)}
            </p>
        </div>
    );
}

// Helper functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0
    }).format(amount);
}

function formatYAxis(value) {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value;
}

export default CenterRevenueTab;
