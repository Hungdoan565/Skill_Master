import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { BarChart3, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

// Curated palette — not oversaturated, blends well
const CHART_COLORS = [
  { stroke: '#3b82f6', fill: '#3b82f6' },  // blue
  { stroke: '#10b981', fill: '#10b981' },  // emerald
  { stroke: '#f59e0b', fill: '#f59e0b' },  // amber
  { stroke: '#8b5cf6', fill: '#8b5cf6' },  // violet
  { stroke: '#ef4444', fill: '#ef4444' },  // rose
];

const formatYAxis = (value) => {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}T`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(0)}Tr`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
  return value;
};

const formatTooltipValue = (value, name) => [
  new Intl.NumberFormat('vi-VN').format(value) + 'đ',
  name,
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-lg">
      <p className="mb-2 text-xs font-medium text-muted-foreground">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-foreground">{entry.name}</span>
            </div>
            <span className="text-xs font-semibold tabular-nums text-foreground">
              {new Intl.NumberFormat('vi-VN').format(entry.value)}đ
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export function CrossCenterRevenueChart({ data }) {
  // Transform backend format: [{month, centers: [{center_name, revenue}]}]
  // into recharts format: [{month, "CenterA": 123, "CenterB": 456}]
  const { chartData, centerNames } = useMemo(() => {
    if (!data || data.length === 0) return { chartData: [], centerNames: [] };

    // Check if already flat format (has keys other than month/date/name/centers)
    const sample = data[0];
    const hasNestedCenters = sample?.centers && Array.isArray(sample.centers);

    if (!hasNestedCenters) {
      // Already flat format
      const keys = Object.keys(sample).filter(
        (k) => k !== 'month' && k !== 'date' && k !== 'name'
      );
      return { chartData: data, centerNames: keys };
    }

    // Build flat format from nested centers
    const allNames = new Set();
    const flat = data.map((row) => {
      const entry = { month: row.month || row.date || row.name };
      (row.centers || []).forEach((c) => {
        const name = c.center_name || c.name || `Center ${c.center_id}`;
        entry[name] = c.revenue || 0;
        allNames.add(name);
      });
      return entry;
    });

    return { chartData: flat, centerNames: [...allNames] };
  }, [data]);

  // Total across all centers
  const totalRevenue = useMemo(() => {
    return chartData.reduce((sum, row) => {
      centerNames.forEach((name) => {
        sum += row[name] || 0;
      });
      return sum;
    }, 0);
  }, [chartData, centerNames]);

  if (!chartData.length || !centerNames.length) {
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

  return (
    <Card className="admin-surface-card h-full rounded-2xl">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-semibold tracking-tight">Doanh thu theo tháng</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              So sánh doanh thu giữa các trung tâm
            </CardDescription>
          </div>
          {totalRevenue > 0 && (
            <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 dark:bg-emerald-900/20">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-700 tabular-nums dark:text-emerald-300">
                {formatYAxis(totalRevenue)}đ
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Legend */}
        <div className="mb-4 flex flex-wrap gap-3">
          {centerNames.slice(0, 5).map((name, i) => (
            <div key={name} className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length].stroke }}
              />
              <span className="text-[11px] text-muted-foreground">{name}</span>
            </div>
          ))}
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -8, bottom: 4 }}>
              <defs>
                {centerNames.slice(0, 5).map((name, i) => (
                  <linearGradient key={name} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS[i % CHART_COLORS.length].fill} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={CHART_COLORS[i % CHART_COLORS.length].fill} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="hsl(var(--border))"
                strokeOpacity={0.5}
              />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                tickFormatter={formatYAxis}
                width={48}
              />
              <Tooltip content={<CustomTooltip />} />
              {centerNames.slice(0, 5).map((name, i) => (
                <Area
                  key={name}
                  type="monotone"
                  dataKey={name}
                  name={name}
                  stroke={CHART_COLORS[i % CHART_COLORS.length].stroke}
                  fill={`url(#grad-${i})`}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, fill: 'hsl(var(--card))' }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
