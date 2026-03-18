import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  TrendingUp, TrendingDown, Minus,
  DollarSign, AlertTriangle, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

const formatCurrency = (value) => {
  if (value == null) return '—';
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)} tỷ`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)} tr`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(0)}k`;
  return new Intl.NumberFormat('vi-VN').format(value);
};

// Minimal SVG ring chart
function CollectionRing({ value, size = 72, strokeWidth = 6 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(value, 0), 100);
  const offset = circumference - (progress / 100) * circumference;

  const color = value >= 80
    ? 'stroke-emerald-500'
    : value >= 60
      ? 'stroke-amber-500'
      : 'stroke-rose-500';

  const bgColor = value >= 80
    ? 'stroke-emerald-500/10'
    : value >= 60
      ? 'stroke-amber-500/10'
      : 'stroke-rose-500/10';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={bgColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      {/* Center label */}
      <span className="absolute text-sm font-bold tabular-nums text-foreground">
        {value}%
      </span>
    </div>
  );
}

export function FinancialOverviewCard({ data }) {
  if (!data) return null;

  const revenue = data.revenue;
  const debt = data.debt;
  const debtAmount = debt?.value || 0;
  const overdueInvoices = debt?.overdue_invoices || 0;

  const totalRevenue = revenue?.value || 0;
  const collectionRate =
    totalRevenue > 0
      ? Math.round(((totalRevenue - debtAmount) / totalRevenue) * 100)
      : 0;

  const revenueChange = Number(revenue?.change) || 0;
  const debtChange = Number(debt?.change_percent) || 0;

  return (
    <Card className="admin-surface-card overflow-hidden rounded-2xl">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 ring-1 ring-emerald-500/15">
            <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <CardTitle className="text-base font-semibold tracking-tight">
            Tổng quan tài chính
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="pt-2 space-y-4">
        {/* Revenue — hero metric */}
        <div className="rounded-xl bg-gradient-to-br from-emerald-500/6 to-transparent p-4">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Doanh thu tháng này
          </p>
          <div className="flex items-baseline gap-3">
            <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
              {formatCurrency(revenue?.value)}
            </p>
            {revenueChange !== 0 && (
              <span className={cn(
                'inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums',
                revenueChange > 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              )}>
                {revenueChange > 0 ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {Math.abs(revenueChange).toFixed(1)}%
              </span>
            )}
          </div>
        </div>

        {/* Bottom row: Debt + Collection Rate */}
        <div className="grid grid-cols-5 gap-3">
          {/* Debt — takes 3 cols */}
          <div className="col-span-3 rounded-xl border border-border/40 p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className={cn(
                'h-3.5 w-3.5',
                debtAmount > 50e6
                  ? 'text-rose-500'
                  : debtAmount > 10e6
                    ? 'text-amber-500'
                    : 'text-emerald-500'
              )} />
              <span className="text-xs font-medium text-muted-foreground">
                Công nợ chưa thu
              </span>
            </div>
            <p className="text-xl font-bold tracking-tight text-foreground tabular-nums">
              {formatCurrency(debtAmount)}
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              {debtChange !== 0 && (
                <span className={cn(
                  'inline-flex items-center gap-0.5 text-[10px] font-semibold tabular-nums',
                  debtChange > 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                )}>
                  {debtChange > 0 ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
                  {Math.abs(debtChange).toFixed(1)}%
                </span>
              )}
              {overdueInvoices > 0 && (
                <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-700 dark:text-rose-300">
                  {overdueInvoices} quá hạn
                </span>
              )}
            </div>
          </div>

          {/* Collection Rate Ring — takes 2 cols */}
          <div className="col-span-2 flex flex-col items-center justify-center rounded-xl border border-border/40 p-3">
            <CollectionRing value={collectionRate} size={64} strokeWidth={5} />
            <span className="mt-1.5 text-[10px] font-medium text-muted-foreground">
              Tỷ lệ thu
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
