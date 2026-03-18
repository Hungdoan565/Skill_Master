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
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

const APPROVAL_TYPES = [
  {
    key: 'enrollments',
    label: 'Ghi danh',
    icon: UserPlus,
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
    activeBorder: 'border-l-blue-500',
  },
  {
    key: 'certificates',
    label: 'Chứng chỉ',
    icon: Award,
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-500',
    activeBorder: 'border-l-violet-500',
  },
  {
    key: 'payments',
    label: 'Thanh toán',
    icon: CreditCard,
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-500',
    activeBorder: 'border-l-emerald-500',
  },
  {
    key: 'payroll',
    label: 'Lương',
    icon: Wallet,
    iconBg: 'bg-orange-500/10',
    iconColor: 'text-orange-500',
    activeBorder: 'border-l-orange-500',
  },
  {
    key: 'disputes',
    label: 'Khiếu nại',
    icon: AlertTriangle,
    iconBg: 'bg-rose-500/10',
    iconColor: 'text-rose-500',
    activeBorder: 'border-l-rose-500',
  },
  {
    key: 'leaves',
    label: 'Nghỉ phép',
    icon: CalendarOff,
    iconBg: 'bg-teal-500/10',
    iconColor: 'text-teal-500',
    activeBorder: 'border-l-teal-500',
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
    <Card className="admin-surface-card flex flex-col rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
              <ClipboardCheck className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-base font-semibold tracking-tight">Chờ phê duyệt</CardTitle>
          </div>
          {counts && counts.total > 0 && (
            <span className="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-bold text-white tabular-nums">
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
          <p className="py-6 text-center text-sm text-muted-foreground">Không thể tải dữ liệu</p>
        ) : (
          <div className="space-y-1">
            {APPROVAL_TYPES.map(({ key, label, icon: Icon, iconBg, iconColor, activeBorder }) => {
              const count = counts[key] || 0;
              const isActive = count > 0;
              return (
                <div
                  key={key}
                  className={cn(
                    'admin-interactive-row flex items-center justify-between rounded-xl px-3 py-2.5',
                    'border border-transparent',
                    isActive && `border-l-2 ${activeBorder} rounded-l-none bg-muted/30`
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={cn('flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg', iconBg)}>
                      <Icon className={cn('h-3.5 w-3.5', iconColor)} />
                    </div>
                    <span className={cn('text-sm', isActive ? 'font-medium text-foreground' : 'text-muted-foreground')}>
                      {label}
                    </span>
                  </div>
                  <span className={cn(
                    'admin-metric-value text-sm font-semibold',
                    isActive ? 'text-foreground' : 'text-muted-foreground/40'
                  )}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {!loading && counts && (
        <CardFooter className="mt-auto border-t pt-4">
          <Link
            to="/admin/approvals"
            className="admin-cta-link admin-focus-ring w-full"
          >
            Xem tất cả
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}
