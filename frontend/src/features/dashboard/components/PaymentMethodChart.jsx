import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { CreditCard } from 'lucide-react';

const PIE_COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

const formatCurrency = (value) => {
  if (!value) return '0đ';
  return `${(value || 0).toLocaleString('vi-VN')}đ`;
};

const formatCompact = (value) => {
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
        <p className="text-sm font-bold text-foreground">{payload[0].name}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export function PaymentMethodChart({ data = [], loading = false }) {
  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <div className="h-6 w-40 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent className="h-[280px] flex items-center justify-center">
          <div className="h-[200px] bg-slate-50 rounded-full w-[200px] animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    name: item.method,
    value: Number(item.total)
  }));

  const totalRevenue = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="h-full flex flex-col relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 to-blue-500" />
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-sky-500/10 via-blue-500/5 to-transparent pointer-events-none" />
      <CardHeader className="pb-2 relative z-10">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <div className="p-2 bg-sky-100 dark:bg-sky-900/30 rounded-lg">
            <CreditCard className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          </div>
          Phương thức thanh toán
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-6">
        {chartData.length === 0 ? (
          <div className="flex-1 flex items-center justify-center h-[280px] text-muted-foreground">
            <p className="text-sm">Chưa có dữ liệu</p>
          </div>
        ) : (
          <div className="h-[280px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  animationDuration={1000}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                      strokeWidth={0}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  formatter={(value, entry) => {
                    const percentage = totalRevenue > 0 ? ((entry.payload.value / totalRevenue) * 100).toFixed(1) : 0;
                    return <span className="text-xs text-muted-foreground">{value} ({percentage}%)</span>;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Stat Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
              <span className="text-xs font-medium text-muted-foreground">Tổng</span>
              <span className="text-xl font-bold text-foreground">
                {formatCompact(totalRevenue)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PaymentMethodChart;