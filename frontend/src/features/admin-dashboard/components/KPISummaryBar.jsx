import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const formatCurrency = (value) =>
  `${new Intl.NumberFormat('vi-VN').format(value || 0)}đ`;
const formatNumber = (value) => new Intl.NumberFormat('vi-VN').format(value || 0);

const KPI_ITEMS = [
  {
    key: 'revenue',
    label: 'Tổng doanh thu',
    helper: 'So với tháng trước',
    formatter: formatCurrency,
    accentBar: 'bg-emerald-500',
    accentBorder: 'border-emerald-200/60 dark:border-emerald-900/40',
  },
  {
    key: 'students',
    label: 'Tổng học viên',
    helper: 'Đang hoạt động',
    formatter: formatNumber,
    accentBar: 'bg-blue-500',
    accentBorder: 'border-blue-200/60 dark:border-blue-900/40',
  },
  {
    key: 'classes',
    label: 'Lớp đang học',
    helperFromData: (data) =>
      data.classes?.total
        ? `Trên tổng ${data.classes.total} lớp`
        : 'Lớp đang diễn ra',
    formatter: formatNumber,
    accentBar: 'bg-violet-500',
    accentBorder: 'border-violet-200/60 dark:border-violet-900/40',
  },
  {
    key: 'debt',
    label: 'Công nợ',
    helperFromData: (data) =>
      data.debt?.overdue_invoices
        ? `${data.debt.overdue_invoices} hóa đơn quá hạn`
        : 'Cần thu hồi',
    formatter: formatCurrency,
    inverseColors: true,
    accentBar: 'bg-rose-500',
    accentBorder: 'border-rose-200/60 dark:border-rose-900/40',
  },
];

function TrendBadge({ change, inverseColors = false }) {
  if (change === undefined || change === null) return null;
  const normalized = Number(change) || 0;
  const isPositive = normalized > 0;
  const isNegative = normalized < 0;
  const displayValue = `${Math.abs(normalized) % 1 === 0 ? Math.abs(normalized) : Math.abs(normalized).toFixed(1)}%`;

  const positiveClass = inverseColors
    ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-300'
    : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-300';
  const negativeClass = inverseColors
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-300'
    : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-300';
  const neutralClass =
    'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400';

  const base =
    'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold tabular-nums';

  if (isPositive) {
    return (
      <Badge variant="outline" className={`${base} ${positiveClass}`}>
        <TrendingUp className="h-2.5 w-2.5" />
        {displayValue}
      </Badge>
    );
  }
  if (isNegative) {
    return (
      <Badge variant="outline" className={`${base} ${negativeClass}`}>
        <TrendingDown className="h-2.5 w-2.5" />
        {displayValue}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className={`${base} ${neutralClass}`}>
      <Minus className="h-2.5 w-2.5" />
      0%
    </Badge>
  );
}

export function KPISummaryBar({ data }) {
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {KPI_ITEMS.map((item) => {
        const metric = data[item.key] || {};
        const showTrend =
          item.key !== 'classes' || metric.change !== undefined;

        return (
          <Card
            key={item.key}
            className={`admin-surface-card admin-card-hover admin-kpi-card rounded-2xl border ${item.accentBorder}`}
          >
            {/* Coloured accent stripe */}
            <span className={`admin-kpi-accent ${item.accentBar}`} />

            <CardHeader className="space-y-2 pb-1">
              <div className="flex items-start justify-between gap-2">
                <CardDescription className="text-sm font-medium text-muted-foreground leading-tight">
                  {item.label}
                </CardDescription>
                {showTrend && (
                  <TrendBadge
                    change={metric.change}
                    inverseColors={item.inverseColors}
                  />
                )}
              </div>

              <CardTitle className="admin-metric-value text-[1.75rem] font-bold leading-none tracking-tight text-foreground">
                {item.formatter(metric.value)}
              </CardTitle>
            </CardHeader>

            <CardFooter className="pt-2">
              <p className="text-xs text-muted-foreground">
                {item.helperFromData
                  ? item.helperFromData(data)
                  : item.helper}
              </p>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
