import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, DollarSign, AlertTriangle, PieChart } from 'lucide-react';
import { cn } from '@/lib/utils';

const formatCurrency = (value) => {
  if (value == null) return '—';
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)} tỷ`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)} tr`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(0)}k`;
  return new Intl.NumberFormat('vi-VN').format(value);
};

export function FinancialOverviewCard({ data }) {
  if (!data) return null;

  const revenue = data.revenue;
  const debt = data.debt;
  const revenueChange = revenue?.change;
  const debtAmount = debt?.value || 0;
  const overdueInvoices = debt?.overdue_invoices || 0;

  const totalRevenue = revenue?.value || 0;
  const collectionRate =
    totalRevenue > 0
      ? Math.round(((totalRevenue - debtAmount) / totalRevenue) * 100)
      : 0;

  const debtSeverity =
    debtAmount > 50e6 ? 'high' : debtAmount > 10e6 ? 'medium' : 'low';

  const stats = [
    {
      label: 'Doanh thu tháng này',
      value: formatCurrency(revenue?.value),
      change: revenueChange,
      icon: DollarSign,
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-500',
    },
    {
      label: 'Công nợ chưa thu',
      value: formatCurrency(debtAmount),
      change: debt?.change_percent,
      inverseColors: true,
      icon: AlertTriangle,
      iconBg:
        debtSeverity === 'high'
          ? 'bg-rose-500/10'
          : debtSeverity === 'medium'
            ? 'bg-amber-500/10'
            : 'bg-emerald-500/10',
      iconColor:
        debtSeverity === 'high'
          ? 'text-rose-500'
          : debtSeverity === 'medium'
            ? 'text-amber-500'
            : 'text-emerald-500',
      subtitle: overdueInvoices > 0 ? `${overdueInvoices} hóa đơn quá hạn` : null,
    },
    {
      label: 'Tỷ lệ thu',
      value: `${collectionRate}%`,
      icon: PieChart,
      iconBg:
        collectionRate >= 80
          ? 'bg-emerald-500/10'
          : collectionRate >= 60
            ? 'bg-amber-500/10'
            : 'bg-rose-500/10',
      iconColor:
        collectionRate >= 80
          ? 'text-emerald-500'
          : collectionRate >= 60
            ? 'text-amber-500'
            : 'text-rose-500',
      progressValue: collectionRate,
    },
  ];

  return (
    <Card className="admin-surface-card rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10">
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </div>
          <CardTitle className="text-base font-semibold tracking-tight">Tổng quan tài chính</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-5">
          {stats.map((stat, i) => {
            const normalized = Number(stat.change) || 0;
            const TrendIcon =
              normalized > 0
                ? TrendingUp
                : normalized < 0
                  ? TrendingDown
                  : Minus;
            const isPositive = stat.inverseColors
              ? normalized < 0
              : normalized > 0;
            const isNegative = stat.inverseColors
              ? normalized > 0
              : normalized < 0;

            return (
              <div
                key={i}
                className={cn(
                  'flex items-start gap-3',
                  i < stats.length - 1 && 'pb-5 border-b border-border/50'
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl',
                    stat.iconBg
                  )}
                >
                  <stat.icon className={cn('h-4 w-4', stat.iconColor)} />
                </div>

                {/* Body */}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                  <div className="mt-0.5 flex items-baseline gap-2">
                    <p className="admin-metric-value text-xl font-bold tracking-tight text-foreground">
                      {stat.value}
                    </p>
                    {stat.change != null && (
                      <span
                        className={cn(
                          'flex items-center gap-0.5 text-xs font-medium tabular-nums',
                          isPositive && 'text-emerald-600 dark:text-emerald-400',
                          isNegative && 'text-rose-600 dark:text-rose-400',
                          !isPositive && !isNegative && 'text-muted-foreground'
                        )}
                      >
                        <TrendIcon className="h-3 w-3" />
                        {Math.abs(normalized).toFixed(1)}%
                      </span>
                    )}
                  </div>

                  {stat.subtitle && (
                    <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">
                      {stat.subtitle}
                    </p>
                  )}

                  {stat.progressValue != null && (
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-700',
                          stat.progressValue >= 80
                            ? 'bg-emerald-500'
                            : stat.progressValue >= 60
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                        )}
                        style={{ width: `${Math.min(stat.progressValue, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
