import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { useCenterContext } from '@/contexts/center-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  { key: 'enrollments', label: 'Ghi danh', icon: UserPlus, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { key: 'certificates', label: 'Chứng chỉ', icon: Award, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { key: 'payments', label: 'Thanh toán', icon: CreditCard, color: 'text-green-500', bg: 'bg-green-500/10' },
  { key: 'payroll', label: 'Lương', icon: Wallet, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { key: 'disputes', label: 'Khiếu nại', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
  { key: 'leaves', label: 'Nghỉ phép', icon: CalendarOff, color: 'text-teal-500', bg: 'bg-teal-500/10' },
];

export function PendingApprovalsCard() {
  const { session } = useAuth();
  const [counts, setCounts] = useState(null);
  const [loading, setLoading] = useState(true);

  // Try to get center context (may not exist if not in provider)
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
    <Card className="bg-card border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <ClipboardCheck className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-base font-semibold">Chờ phê duyệt</CardTitle>
          </div>
          {counts && counts.total > 0 && (
            <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-bold text-red-600">
              {counts.total}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !counts ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Không thể tải dữ liệu</p>
        ) : (
          <>
            <div className="space-y-2">
              {APPROVAL_TYPES.map(({ key, label, icon: Icon, color, bg }) => {
                const count = counts[key] || 0;
                return (
                  <div
                    key={key}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2 transition-colors",
                      count > 0 ? "bg-muted/50" : ""
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={cn("flex h-7 w-7 items-center justify-center rounded-md", bg)}>
                        <Icon className={cn("h-3.5 w-3.5", color)} />
                      </div>
                      <span className={cn("text-sm", count > 0 ? "font-medium text-foreground" : "text-muted-foreground")}>
                        {label}
                      </span>
                    </div>
                    <span className={cn(
                      "text-sm font-semibold tabular-nums",
                      count > 0 ? "text-foreground" : "text-muted-foreground/50"
                    )}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
            <Link
              to="/admin/approvals"
              className="mt-4 flex items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Xem tất cả
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
