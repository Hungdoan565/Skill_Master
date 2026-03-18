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
import { formatCurrency } from '../utils';

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
                        <Card key={i} className="p-4 animate-pulse border-gray-200 shadow-sm">
                            <div className="h-4 w-20 bg-gray-100 rounded mb-2" />
                            <div className="h-8 w-32 bg-gray-100 rounded" />
                        </Card>
                    ))}
                </div>
                <Card className="p-6 animate-pulse border-gray-200 shadow-sm">
                    <div className="h-6 w-40 bg-gray-100 rounded mb-4" />
                    <div className="h-64 bg-gray-50/50 rounded" />
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Revenue Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    subText={`${statistics?.counts?.unpaid || 0} hóa đơn chưa thanh toán`}
                />
                <StatCard
                    title="Đang chờ thanh toán"
                    value={statistics?.counts?.partial || 0}
                    icon={CreditCard}
                    color="amber"
                    subText="Hóa đơn thanh toán một phần"
                />
                <StatCard
                    title="Đã thanh toán"
                    value={statistics?.counts?.paid || 0}
                    icon={Receipt}
                    color="indigo"
                    subText="Hóa đơn hoàn tất"
                />
            </div>

            {/* Revenue Chart */}
            <Card className="p-6 border-gray-200 shadow-sm bg-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Doanh thu theo tháng</h3>
                        <p className="text-sm text-gray-500 mt-1">12 tháng gần nhất</p>
                    </div>
                    <Button
                        onClick={() => navigate(`/admin/invoices?centerId=${centerId}`)}
                        variant="outline"
                        className="gap-2 border-gray-200 text-gray-700 hover:bg-gray-50"
                    >
                        <ExternalLink className="h-4 w-4" />
                        Xem tất cả hóa đơn
                    </Button>
                </div>

                {revenueData.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-gray-500 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                        <div className="text-center">
                            <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                            <p className="text-sm">Chưa có dữ liệu doanh thu</p>
                        </div>
                    </div>
                ) : (
                    <div className="h-[300px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis
                                    dataKey="month"
                                    tick={{ fontSize: 12, fill: '#6b7280' }}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    tick={{ fontSize: 12, fill: '#6b7280' }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={formatYAxis}
                                    dx={-10}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e5e7eb', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#4f46e5"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                    activeDot={{ r: 6, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </Card>

            {/* Summary stats */}
            {summary && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="p-5 border-gray-200 shadow-sm bg-white">
                        <p className="text-sm font-medium text-gray-500 mb-2">Tổng doanh thu (12 tháng)</p>
                        <p className="text-2xl font-bold text-gray-900 tracking-tight">
                            {formatCurrency(summary.totalRevenue)}
                        </p>
                    </Card>
                    <Card className="p-5 border-gray-200 shadow-sm bg-white">
                        <p className="text-sm font-medium text-gray-500 mb-2">Trung bình doanh thu / tháng</p>
                        <p className="text-2xl font-bold text-gray-900 tracking-tight">
                            {formatCurrency(summary.avgRevenue)}
                        </p>
                    </Card>
                    <Card className="p-5 border-gray-200 shadow-sm bg-white">
                        <p className="text-sm font-medium text-gray-500 mb-2">Tăng trưởng (so với tháng trước)</p>
                        <div className="flex items-center gap-2.5">
                            <p className={`text-2xl font-bold tracking-tight ${summary.trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
                                {summary.trend > 0 ? '+' : ''}{summary.trend}%
                            </p>
                            <div className={`p-1 rounded-full ${summary.trendUp ? 'bg-emerald-100' : 'bg-red-100'}`}>
                                {summary.trendUp ? (
                                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                                ) : (
                                    <TrendingDown className="h-4 w-4 text-red-600" />
                                )}
                            </div>
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
        emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', iconBg: 'bg-emerald-100', iconText: 'text-emerald-600' },
        red: { bg: 'bg-red-50', text: 'text-red-600', iconBg: 'bg-red-100', iconText: 'text-red-600' },
        amber: { bg: 'bg-amber-50', text: 'text-amber-600', iconBg: 'bg-amber-100', iconText: 'text-amber-600' },
        indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', iconBg: 'bg-indigo-100', iconText: 'text-indigo-600' }
    };
    const colors = colorMap[color] || colorMap.emerald;

    return (
        <Card className="p-5 border-gray-200 shadow-sm bg-white hover:border-gray-300 transition-colors group">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-2.5 rounded-xl ${colors.iconBg} group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className={`h-5 w-5 ${colors.iconText}`} />
                </div>
                {trend !== undefined && (
                    <Badge variant="outline" className={`font-medium border-0 ${trendUp ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {trendUp ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                        {trend > 0 ? '+' : ''}{trend}%
                    </Badge>
                )}
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
                </div>
            </div>
            {subText && (
                <p className="text-xs text-gray-500 mt-2 font-medium">
                    {subText}
                </p>
            )}
        </Card>
    );
}

// Custom tooltip for chart
function CustomTooltip({ active, payload, label }) {
    if (!active || !payload || !payload.length) return null;

    return (
        <div className="bg-white px-4 py-3 shadow-md rounded-xl border border-gray-100 min-w-[150px]">
            <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
            <p className="text-lg font-bold text-gray-900">
                {formatCurrency(payload[0].value)}
            </p>
        </div>
    );
}

function formatYAxis(value) {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value;
}

export default CenterRevenueTab;
