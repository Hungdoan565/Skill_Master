import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, ArrowRight,
  Users, GraduationCap, Briefcase,
  Banknote, BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Helpers ────────────────────────────────────────────────────

const formatCompactCurrency = (value) => {
  if (!value) return '0đ';
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1).replace('.0', '')}tỷ`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace('.0', '')}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return `${new Intl.NumberFormat('vi-VN').format(value)}đ`;
};

// ─── Config ────────────────────────────────────────────────────

const HEALTH_CONFIG = {
  good: {
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-300',
    label: 'Hoạt động tốt',
    accentBar: 'from-emerald-400 to-emerald-600',
    dot: 'bg-emerald-500',
  },
  warning: {
    badge: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300',
    label: 'Cần theo dõi',
    accentBar: 'from-amber-400 to-amber-600',
    dot: 'bg-amber-500',
  },
  critical: {
    badge: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-300',
    label: 'Cảnh báo',
    accentBar: 'from-rose-400 to-rose-600',
    dot: 'bg-rose-500',
  },
  default: {
    badge: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400',
    label: 'Chưa rõ',
    accentBar: 'from-slate-300 to-slate-500',
    dot: 'bg-slate-400',
  },
};

const getProgressColor = (type, value) => {
  if (type === 'collection') {
    if (value >= 90) return 'bg-emerald-500';
    if (value >= 80) return 'bg-amber-500';
    return 'bg-rose-500';
  }
  if (type === 'attendance') {
    if (value >= 85) return 'bg-blue-500';
    if (value >= 75) return 'bg-amber-500';
    return 'bg-rose-500';
  }
  return 'bg-primary';
};

const getProgressTrack = (type, value) => {
  if (type === 'collection') {
    if (value >= 90) return 'bg-emerald-100 dark:bg-emerald-900/20';
    if (value >= 80) return 'bg-amber-100 dark:bg-amber-900/20';
    return 'bg-rose-100 dark:bg-rose-900/20';
  }
  if (type === 'attendance') {
    if (value >= 85) return 'bg-blue-100 dark:bg-blue-900/20';
    if (value >= 75) return 'bg-amber-100 dark:bg-amber-900/20';
    return 'bg-rose-100 dark:bg-rose-900/20';
  }
  return 'bg-muted';
};

// ─── StatPill sub-component ──────────────────────────────────

function StatPill({ icon: Icon, label, value, isAnomaly = false }) {
  return (
    <div className={cn(
      'flex flex-col items-center gap-1 rounded-lg py-2.5 px-1 transition-colors',
      isAnomaly
        ? 'bg-rose-50 dark:bg-rose-900/15'
        : 'bg-muted/50'
    )}>
      <Icon className={cn(
        'h-3.5 w-3.5',
        isAnomaly ? 'text-rose-500' : 'text-muted-foreground/70'
      )} />
      <span className={cn(
        'text-lg font-bold tabular-nums leading-none',
        isAnomaly ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'
      )}>
        {value}
      </span>
      <span className="text-[10px] text-muted-foreground leading-none">{label}</span>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────

export function CenterHealthCards({ centers }) {
  if (!centers || centers.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
      {centers.map((center) => {
        const status = center.health_status || 'default';
        const config = HEALTH_CONFIG[status] || HEALTH_CONFIG.default;
        const centerId = center.id || center.center_id;

        return (
          <Card
            key={centerId}
            className={cn(
              'group relative flex flex-col overflow-hidden rounded-2xl border',
              'bg-white dark:bg-slate-900',
              'shadow-sm hover:shadow-md transition-all duration-300',
              'hover:-translate-y-0.5',
            )}
          >
            {/* Gradient accent stripe */}
            <span className={cn('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', config.accentBar)} />

            <CardHeader className="pb-2 pt-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn('h-2 w-2 rounded-full flex-shrink-0 ring-2 ring-offset-1', config.dot, 
                    status === 'good' ? 'ring-emerald-200' : status === 'warning' ? 'ring-amber-200' : status === 'critical' ? 'ring-rose-200' : 'ring-slate-200'
                  )} />
                  <CardTitle className="truncate text-[15px] font-semibold leading-snug tracking-tight">
                    {center.name}
                  </CardTitle>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    'flex-shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                    config.badge
                  )}
                >
                  {config.label}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="flex-1 space-y-4 text-sm">
              {/* Revenue block */}
              <div className="flex items-end justify-between rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-800/30 px-3.5 py-3">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Banknote className="h-3.5 w-3.5 text-muted-foreground/60" />
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Doanh thu</p>
                  </div>
                  <p className="text-xl font-bold tracking-tight text-foreground tabular-nums">
                    {formatCompactCurrency(center.revenue)}
                  </p>
                </div>
                {center.revenue_change !== undefined && center.revenue_change !== null && center.revenue_change !== 0 && (
                  <span className={cn(
                    'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                    center.revenue_change > 0
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400'
                  )}>
                    {center.revenue_change > 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {Math.abs(center.revenue_change)}%
                  </span>
                )}
              </div>

              {/* Stat pills with icons */}
              <div className="grid grid-cols-3 gap-2">
                <StatPill
                  icon={Users}
                  label="Học viên"
                  value={center.student_count || 0}
                  isAnomaly={(center.student_count || 0) === 0}
                />
                <StatPill
                  icon={GraduationCap}
                  label="Lớp học"
                  value={center.class_count || 0}
                  isAnomaly={(center.class_count || 0) === 0}
                />
                <StatPill
                  icon={Briefcase}
                  label="Nhân sự"
                  value={center.staff_count || 0}
                  isAnomaly={(center.staff_count || 0) === 0}
                />
              </div>

              {/* Progress bars — thicker + colored track */}
              <div className="space-y-3">
                {[
                  { label: 'Tỷ lệ thu', icon: Banknote, type: 'collection', value: center.collection_rate || 0 },
                  { label: 'Điểm danh', icon: BarChart3, type: 'attendance', value: center.attendance_rate || 0 },
                ].map(({ label, icon: BarIcon, type, value }) => (
                  <div key={label} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <BarIcon className="h-3 w-3" />
                        {label}
                      </span>
                      <span className={cn(
                        'text-xs font-bold tabular-nums',
                        value >= 85 ? 'text-emerald-600 dark:text-emerald-400'
                          : value >= 75 ? 'text-amber-600 dark:text-amber-400'
                          : 'text-rose-600 dark:text-rose-400'
                      )}>
                        {value}%
                      </span>
                    </div>
                    <div className={cn('h-2 w-full overflow-hidden rounded-full', getProgressTrack(type, value))}>
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-700 ease-out',
                          getProgressColor(type, value)
                        )}
                        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>

            <CardFooter className="mt-auto border-t border-border/50 pt-3.5 pb-3.5">
              <Link
                to={`/admin/centers/${centerId}`}
                className={cn(
                  'flex items-center justify-center gap-1.5 w-full',
                  'text-xs font-semibold text-muted-foreground',
                  'hover:text-foreground transition-colors',
                  'group-hover:text-primary'
                )}
              >
                Xem chi tiết
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
