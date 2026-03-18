import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { useCenterContext } from '@/contexts/center-context';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  ClipboardCheck,
  UserPlus,
  Award,
  CreditCard,
  Wallet,
  AlertTriangle,
  CalendarOff,
  ArrowRight,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

const APPROVAL_TYPES = [
  {
    key: 'enrollments',
    label: 'Ghi danh',
    icon: UserPlus,
    gradient: 'from-blue-500 to-blue-600',
    softBg: 'bg-blue-500/8',
    softColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    key: 'certificates',
    label: 'Chứng chỉ',
    icon: Award,
    gradient: 'from-violet-500 to-violet-600',
    softBg: 'bg-violet-500/8',
    softColor: 'text-violet-600 dark:text-violet-400',
  },
  {
    key: 'payments',
    label: 'Thanh toán',
    icon: CreditCard,
    gradient: 'from-emerald-500 to-emerald-600',
    softBg: 'bg-emerald-500/8',
    softColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    key: 'payroll',
    label: 'Lương',
    icon: Wallet,
    gradient: 'from-orange-500 to-orange-600',
    softBg: 'bg-orange-500/8',
    softColor: 'text-orange-600 dark:text-orange-400',
  },
  {
    key: 'disputes',
    label: 'Khiếu nại',
    icon: AlertTriangle,
    gradient: 'from-rose-500 to-rose-600',
    softBg: 'bg-rose-500/8',
    softColor: 'text-rose-600 dark:text-rose-400',
  },
  {
    key: 'leaves',
    label: 'Nghỉ phép',
    icon: CalendarOff,
    gradient: 'from-teal-500 to-teal-600',
    softBg: 'bg-teal-500/8',
    softColor: 'text-teal-600 dark:text-teal-400',
  },
];

export function PendingApprovalsCard() {
  const { session } = useAuth();
  const [counts, setCounts] = useState(null);
  const [loading, setLoading] = useState(true);

  let selectedCenterId = null;
  try {
    const ctx = useCenterContext();
    selectedCenterId = ctx.selectedCenterId;
  } catch { /* not in provider */ }

  const fetchCounts = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const params = new URLSearchParams();
      if (selectedCenterId) params.set('center_id', selectedCenterId);
      const res = await fetch(`${API_URL}/api/admin/pending-approvals?${params}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      const json = await res.json();
      if (json.success) setCounts(json.data);
    } catch (err) {
      console.error('Failed to fetch pending approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!session?.access_token) return;
    fetchCounts();
    const interval = setInterval(fetchCounts, 60000);
    return () => clearInterval(interval);
  }, [session?.access_token, selectedCenterId]);

  return (
    <Card className="admin-surface-card flex flex-col overflow-hidden rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/15">
              <ClipboardCheck className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-base font-semibold tracking-tight">
              Chờ phê duyệt
            </CardTitle>
          </div>
          {counts && counts.total > 0 && (
            <span className={cn(
              'inline-flex min-w-[1.75rem] items-center justify-center',
              'rounded-full bg-rose-500 px-2.5 py-1 text-[11px] font-bold text-white tabular-nums',
              'shadow-sm shadow-rose-500/30',
              'animate-in fade-in duration-300'
            )}>
              {counts.total}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 pt-0">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !counts ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Không thể tải dữ liệu
          </p>
        ) : (
          <div className="space-y-1">
            {APPROVAL_TYPES.map(({ key, label, icon: Icon, softBg, softColor, gradient }) => {
              const count = counts[key] || 0;
              const isActive = count > 0;

              return (
                <div
                  key={key}
                  className={cn(
                    'group flex items-center justify-between rounded-xl px-3 py-2.5',
                    'transition-all duration-200',
                    isActive
                      ? 'bg-muted/40 hover:bg-muted/60 cursor-pointer'
                      : 'hover:bg-muted/20'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {/* Icon with gradient fill when active */}
                    <div className={cn(
                      'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg',
                      'transition-all duration-200',
                      isActive
                        ? `bg-gradient-to-br ${gradient} shadow-sm`
                        : softBg
                    )}>
                      <Icon className={cn(
                        'h-3.5 w-3.5',
                        isActive ? 'text-white' : softColor
                      )} />
                    </div>
                    <span className={cn(
                      'text-sm transition-colors',
                      isActive ? 'font-medium text-foreground' : 'text-muted-foreground'
                    )}>
                      {label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isActive ? (
                      <>
                        <span className="min-w-[1.5rem] rounded-md bg-foreground/[0.06] px-2 py-0.5 text-center text-sm font-semibold tabular-nums text-foreground">
                          {count}
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
                      </>
                    ) : (
                      <span className="text-sm font-medium text-muted-foreground/30 tabular-nums">
                        0
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {!loading && counts && (
        <CardFooter className="mt-auto border-t border-border/40 pt-4">
          <Link
            to="/admin/approvals"
            className={cn(
              'group/cta flex w-full items-center justify-center gap-2',
              'rounded-xl py-2 text-sm font-medium',
              'text-muted-foreground transition-all duration-200',
              'hover:text-foreground hover:bg-muted/40'
            )}
          >
            Xem tất cả
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/cta:translate-x-1" />
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}
