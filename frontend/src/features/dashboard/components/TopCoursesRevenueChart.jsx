import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { BookOpen } from 'lucide-react';

const formatCurrency = (value) => {
  if (!value) return '0đ';
  return `${(value || 0).toLocaleString('vi-VN')}đ`;
};

const formatMillions = (value) => {
  if (!value) return '0';
  if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
  if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toString();
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-border p-3 rounded-xl shadow-xl">
        <p className="text-sm font-bold text-foreground">{payload[0].payload.course_name}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {payload[0].name}: {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export function TopCoursesRevenueChart({ data = [], loading = false }) {
  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <div className="h-6 w-48 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent className="h-[280px]">
          <div className="h-full w-full bg-slate-50 rounded-xl animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map(item => ({
    ...item,
    revenue: Number(item.revenue)
  }));

  const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0);

  return (
    <Card className="h-full flex flex-col relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 to-cyan-500" />
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-sky-500/10 via-cyan-500/5 to-transparent pointer-events-none" />
      <CardHeader className="pb-2 relative z-10 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <div className="p-2 bg-sky-100 dark:bg-sky-900/30 rounded-lg">
            <BookOpen className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          </div>
          Top khóa học
        </CardTitle>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Tổng doanh thu</p>
          <p className="text-lg font-bold text-foreground">
            {formatMillions(totalRevenue)}
          </p>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-6">
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[280px] text-muted-foreground">
            <p className="text-sm">Chưa có dữ liệu doanh thu khóa học</p>
          </div>
        ) : (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity={1} />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={true}
                  vertical={true}
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  tickFormatter={formatMillions}
                />
                <YAxis
                  dataKey="course_name"
                  type="category"
                  width={180}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  tickFormatter={(val) => val.length > 25 ? val.substring(0, 25) + '...' : val}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }} />
                <Bar
                  dataKey="revenue"
                  name="Doanh thu"
                  fill="url(#barGradient)"
                  radius={[0, 6, 6, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TopCoursesRevenueChart;