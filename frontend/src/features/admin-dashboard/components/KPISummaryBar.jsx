import { Card, CardContent } from '@/components/ui/card';
import {
  TrendingUp, TrendingDown, Minus,
  DollarSign, Users, BookOpen, Receipt
} from 'lucide-react';
import { cn } from '@/lib/utils';

const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN').format(value || 0) + 'đ';
const formatNumber = (value) => new Intl.NumberFormat('vi-VN').format(value || 0);

const KPI_ITEMS = [
  {
    key: 'revenue',
    label: 'Tổng doanh thu',
    helper: 'So với tháng trước',
    formatter: formatCurrency,
    icon: DollarSign,
    gradient: 'from-emerald-500/8 to-emerald-500/2',
    iconBg: 'bg-emerald-500/12',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    ringColor: 'ring-emerald-500/20',
  },
  {
    key: 'students',
    label: 'Tổng học viên',
    helper: 'Đang hoạt động',
    formatter: formatNumber,
    icon: Users,
    gradient: 'from-blue-500/8 to-blue-500/2',
    iconBg: 'bg-blue-500/12',
    iconColor: 'text-blue-600 dark:text-blue-400',
    ringColor: 'ring-blue-500/20',
  },
  {
    key: 'classes',
    label: 'Lớp đang học',
    helperFromData: (data) =>
      data.classes?.total
        ? 'Lớp đang diễn ra'
        : 'Lớp đang diễn ra',
    formatter: formatNumber,
    icon: BookOpen,
    gradient: 'from-violet-500/8 to-violet-500/2',
    iconBg: 'bg-violet-500/12',
    iconColor: 'text-violet-600 dark:text-violet-400',
    ringColor: 'ring-violet-500/20',
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
    icon: Receipt,
    gradient: 'from-rose-500/8 to-rose-500/2',
    iconBg: 'bg-rose-500/12',
    iconColor: 'text-rose-600 dark:text-rose-400',
    ringColor: 'ring-rose-500/20',
  },
];

function TrendBadge({ change, inverseColors = false }) {
  if (change === undefined || change === null) return null;
  const normalized = Number(change) || 0;
  const isPositive = normalized > 0;
  const isNegative = normalized < 0;
  const displayValue = `${Math.abs(normalized) % 1 === 0 ? Math.abs(normalized) : Math.abs(normalized).toFixed(1)}%`;

  const effectivePositive = inverseColors ? isNegative : isPositive;
  const effectiveNegative = inverseColors ? isPositive : isNegative;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums',
        'transition-colors duration-200',
        effectivePositive && 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
        effectiveNegative && 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
        !effectivePositive && !effectiveNegative && 'bg-slate-500/10 text-slate-600 dark:text-slate-400'
      )}
    >
      {isPositive ? (
        <TrendingUp className="h-3 w-3" />
      ) : isNegative ? (
        <TrendingDown className="h-3 w-3" />
      ) : (
        <Minus className="h-3 w-3" />
      )}
      {isNegative ? '' : '+'}{displayValue}
    </span>
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
        const Icon = item.icon;

        return (
          <Card
            key={item.key}
            className={cn(
              'group relative overflow-hidden rounded-2xl border border-border/60',
              'bg-gradient-to-br', item.gradient,
              'transition-all duration-300',
              'hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.08)]',
              'hover:border-border'
            )}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-xl',
                    item.iconBg,
                    'ring-1', item.ringColor,
                    'transition-transform duration-300 group-hover:scale-105'
                  )}>
                    <Icon className={cn('h-4.5 w-4.5', item.iconColor)} />
                  </div>
                  <span className="text-[13px] font-medium text-muted-foreground">
                    {item.label}
                  </span>
                </div>
                {showTrend && <TrendBadge change={metric.change} inverseColors={item.inverseColors} />}
              </div>

              <p className="text-[1.75rem] font-bold leading-none tracking-tight text-foreground tabular-nums">
                {item.formatter(metric.value)}
              </p>

              <p className="mt-2 text-[11px] text-muted-foreground/70">
                {item.helperFromData ? item.helperFromData(data) : item.helper}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
