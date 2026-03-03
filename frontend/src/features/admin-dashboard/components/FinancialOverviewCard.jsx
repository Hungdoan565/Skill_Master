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

  // Calculate collection rate
  const totalRevenue = revenue?.value || 0;
  const collectionRate = totalRevenue > 0 
    ? Math.round(((totalRevenue - debtAmount) / totalRevenue) * 100) 
    : 0;

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
      iconBg: debtAmount > 50e6 ? 'bg-red-500/10' : debtAmount > 10e6 ? 'bg-amber-500/10' : 'bg-emerald-500/10',
      iconColor: debtAmount > 50e6 ? 'text-red-500' : debtAmount > 10e6 ? 'text-amber-500' : 'text-emerald-500',
      subtitle: overdueInvoices > 0 ? `${overdueInvoices} hóa đơn quá hạn` : null,
    },
    {
      label: 'Tỷ lệ thu',
      value: `${collectionRate}%`,
      icon: PieChart,
      iconBg: collectionRate >= 80 ? 'bg-emerald-500/10' : collectionRate >= 60 ? 'bg-amber-500/10' : 'bg-red-500/10',
      iconColor: collectionRate >= 80 ? 'text-emerald-500' : collectionRate >= 60 ? 'text-amber-500' : 'text-red-500',
      progressValue: collectionRate,
    },
  ];

  return (
    <Card className="bg-card border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </div>
          <CardTitle className="text-base font-semibold">Tổng quan tài chính</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {stats.map((stat, i) => {
            const TrendIcon = stat.change > 0 ? TrendingUp : stat.change < 0 ? TrendingDown : Minus;
            const isPositive = stat.inverseColors ? stat.change < 0 : stat.change > 0;
            const isNegative = stat.inverseColors ? stat.change > 0 : stat.change < 0;

            return (
              <div key={i} className="flex items-start gap-3">
                <div className={cn("flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg", stat.iconBg)}>
                  <stat.icon className={cn("h-4 w-4", stat.iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-lg font-bold tracking-tight">{stat.value}</p>
                    {stat.change != null && (
                      <span className={cn(
                        "flex items-center gap-0.5 text-xs font-medium",
                        isPositive && "text-emerald-600",
                        isNegative && "text-red-600",
                        !isPositive && !isNegative && "text-muted-foreground"
                      )}>
                        <TrendIcon className="h-3 w-3" />
                        {Math.abs(stat.change).toFixed(1)}%
                      </span>
                    )}
                  </div>
                  {stat.subtitle && (
                    <p className="text-xs text-amber-600">{stat.subtitle}</p>
                  )}
                  {stat.progressValue != null && (
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          stat.progressValue >= 80 ? "bg-emerald-500" : stat.progressValue >= 60 ? "bg-amber-500" : "bg-red-500"
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
