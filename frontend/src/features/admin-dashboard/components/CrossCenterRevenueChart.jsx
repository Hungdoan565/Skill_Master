import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { BarChart3 } from 'lucide-react';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const formatYAxis = (value) => {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}T`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(0)}Tr`;
  return new Intl.NumberFormat('vi-VN').format(value);
};

const formatTooltipValue = (value) => [
  new Intl.NumberFormat('vi-VN').format(value) + 'đ',
  'Doanh thu',
];

export function CrossCenterRevenueChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <Card className="admin-surface-card h-full rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base font-semibold tracking-tight">Doanh thu theo tháng</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            So sánh doanh thu giữa các trung tâm
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[320px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
              <BarChart3 className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Chưa có dữ liệu doanh thu</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const dataKeys = Object.keys(data[0]).filter(
    (key) => key !== 'month' && key !== 'date' && key !== 'name'
  );
  const xKey = data[0]?.month ? 'month' : data[0]?.date ? 'date' : 'name';

  return (
    <Card className="admin-surface-card h-full rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base font-semibold tracking-tight">Doanh thu theo tháng</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          So sánh doanh thu giữa các trung tâm
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="hsl(var(--border))"
                strokeOpacity={0.6}
              />
              <XAxis
                dataKey={xKey}
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                tickFormatter={formatYAxis}
                dx={-8}
              />
              <Tooltip
                formatter={formatTooltipValue}
                contentStyle={{
                  borderRadius: '0.75rem',
                  border: '1px solid hsl(var(--border))',
                  backgroundColor: 'hsl(var(--card))',
                  color: 'hsl(var(--foreground))',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                  padding: '10px 14px',
                }}
                itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 500, fontSize: 12 }}
                labelStyle={{ color: 'hsl(var(--muted-foreground))', fontSize: 11, marginBottom: 4 }}
              />
              <Legend
                wrapperStyle={{
                  paddingTop: '20px',
                  fontSize: '12px',
                  color: 'hsl(var(--muted-foreground))',
                }}
              />
              {dataKeys.slice(0, 5).map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={key}
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  strokeWidth={2.5}
                  dot={{ r: 3.5, strokeWidth: 2, fill: 'hsl(var(--card))' }}
                  activeDot={{ r: 5.5, strokeWidth: 0 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
