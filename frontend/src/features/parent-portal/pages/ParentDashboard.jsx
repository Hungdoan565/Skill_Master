import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { useParentDashboard, useParentChildren, useParentDashboardAggregator } from '../hooks';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users, CreditCard, AlertTriangle, RefreshCw, ArrowRight,
  GraduationCap, BellRing, CalendarClock, ShieldCheck,
  AlertCircle, Clock, CheckCircle2, BookOpen, TrendingUp,
  Wallet, FileText, Star, ChevronRight, Zap,
  Receipt, Calendar, BarChart3, Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency, getRelationshipTone } from './parent-portal-helpers';

// ─── Helpers ────────────────────────────────────────────────────

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Chào buổi sáng', emoji: '☀️' };
  if (hour < 18) return { text: 'Chào buổi chiều', emoji: '🌤️' };
  return { text: 'Chào buổi tối', emoji: '🌙' };
};

const formatDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' });
};

const formatShortDate = (d) => {
  if (!d) return '--/--';
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
};

const formatRelativeTime = (date) => {
  if (!date) return '';
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Hôm qua';
  if (days < 7) return `${days} ngày trước`;
  return formatShortDate(date);
};

const alertConfig = {
  overdue_invoice:    { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900', label: 'Quá hạn' },
  due_soon_invoice:   { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900', label: 'Sắp hạn' },
  absent_recent:      { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-900', label: 'Vắng học' },
  new_grade:          { icon: Star, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900', label: 'Điểm mới' },
  upcoming_session:   { icon: CalendarClock, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900', label: 'Lịch học' },
  pending_payment:    { icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:border-purple-900', label: 'Chờ duyệt' },
};

const activityTypeConfig = {
  grade:   { icon: Star, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30', dotColor: 'bg-blue-500' },
  absent:  { icon: AlertTriangle, color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30', dotColor: 'bg-orange-500' },
  session: { icon: CalendarClock, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30', dotColor: 'bg-emerald-500' },
  payment: { icon: Receipt, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30', dotColor: 'bg-purple-500' },
};

// ─── Components ─────────────────────────────────────────────────

function GreetingHeader({ name, childCount, onRefresh }) {
  const greeting = getGreeting();
  const today = formatDate(new Date());

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          {greeting.emoji} {greeting.text}, {name}!
        </h1>
        <p className="text-sm text-muted-foreground mt-1 capitalize">
          {today} — {childCount} học viên liên kết
        </p>
      </div>
      <Button variant="outline" size="icon" onClick={onRefresh} title="Làm mới" className="hover:bg-orange-50 hover:border-orange-200 transition-colors">
        <RefreshCw className="h-5 w-5 text-muted-foreground" />
      </Button>
    </div>
  );
}

function TodayFocus({ focus, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border bg-muted/30 p-4 animate-pulse h-[88px]" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: 'Buổi học hôm nay',
      value: focus.sessionsToday,
      icon: CalendarClock,
      color: focus.sessionsToday > 0 ? 'text-emerald-600' : 'text-muted-foreground',
      bg: focus.sessionsToday > 0 ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-300' : 'bg-muted/30 border-border',
      href: '/parent/schedule',
    },
    {
      label: 'Học phí cần đóng',
      value: focus.unpaidUrgent > 0 ? formatCurrency(focus.unpaidUrgentAmount) : 'Đã đóng đủ',
      icon: Wallet,
      color: focus.unpaidUrgent > 0 ? 'text-red-600' : 'text-emerald-600',
      bg: focus.unpaidUrgent > 0 ? 'bg-red-50 border-red-200 hover:border-red-300' : 'bg-emerald-50 border-emerald-200 hover:border-emerald-300',
      href: '/parent/invoices',
      badge: focus.unpaidUrgent > 0 ? `${focus.unpaidUrgent} khoản` : null,
    },
    {
      label: 'Vắng gần đây',
      value: focus.recentAbsences > 0 ? `${focus.recentAbsences} buổi` : 'Không có',
      icon: AlertTriangle,
      color: focus.recentAbsences > 0 ? 'text-orange-600' : 'text-muted-foreground',
      bg: focus.recentAbsences > 0 ? 'bg-orange-50 border-orange-200 hover:border-orange-300' : 'bg-muted/30 border-border',
      href: '/parent/attendance',
    },
    {
      label: 'Điểm mới',
      value: focus.newGrades > 0 ? `${focus.newGrades} điểm` : 'Chưa có',
      icon: Star,
      color: focus.newGrades > 0 ? 'text-blue-600' : 'text-muted-foreground',
      bg: focus.newGrades > 0 ? 'bg-blue-50 border-blue-200 hover:border-blue-300' : 'bg-muted/30 border-border',
      href: '/parent/grades',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map(c => (
        <Link key={c.label} to={c.href}>
          <div className={cn(
            'rounded-xl border p-4 transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer h-full',
            c.bg
          )}>
            <div className="flex items-center gap-2 mb-2">
              <c.icon className={cn('h-4 w-4', c.color)} />
              <span className="text-xs font-medium text-muted-foreground tracking-wide">{c.label}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={cn('text-lg font-bold tabular-nums', c.color)}>{c.value}</span>
              {c.badge && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{c.badge}</Badge>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function AlertCard({ alert }) {
  const cfg = alertConfig[alert.type] || alertConfig.upcoming_session;
  const Icon = cfg.icon;

  return (
    <Link to={alert.href} className="block">
      <div className={cn('rounded-xl border p-4 transition-all hover:shadow-md hover:-translate-y-0.5', cfg.bg)}>
        <div className="flex items-start gap-3">
          <div className={cn('p-2 rounded-lg shrink-0', cfg.color, 'bg-white/60 dark:bg-white/10')}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="text-xs">{cfg.label}</Badge>
              <span className="text-xs text-muted-foreground">{alert.childName}</span>
            </div>
            <p className="font-semibold text-sm">{alert.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
            {alert.amount > 0 && (
              <p className="text-sm font-bold mt-1 text-red-600 tabular-nums">{formatCurrency(alert.amount)}</p>
            )}
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
        </div>
      </div>
    </Link>
  );
}

function PriorityAlerts({ alerts, loading }) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-lg">Cần chú ý</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 py-6 justify-center text-muted-foreground">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500" />
            <span className="text-sm">Đang tổng hợp dữ liệu...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const criticalAlerts = alerts.filter(a => a.severity <= 2);
  const infoAlerts = alerts.filter(a => a.severity > 2);

  return (
    <Card className="border-orange-200/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-lg tracking-tight">Cần chú ý</CardTitle>
            {criticalAlerts.length > 0 && (
              <Badge variant="destructive" className="text-xs">{criticalAlerts.length}</Badge>
            )}
          </div>
        </div>
        <CardDescription>
          Ưu tiên theo mức độ ảnh hưởng đến học tập và học phí
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.length > 0 ? (
          <>
            {criticalAlerts.map(a => <AlertCard key={a.id} alert={a} />)}
            {infoAlerts.length > 0 && criticalAlerts.length > 0 && (
              <div className="border-t my-2" />
            )}
            {infoAlerts.map(a => <AlertCard key={a.id} alert={a} />)}
          </>
        ) : (
          <div className="rounded-xl border border-dashed bg-emerald-50/50 dark:bg-emerald-950/20 p-6 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
            <p className="font-medium text-emerald-700 dark:text-emerald-400">Mọi thứ ổn!</p>
            <p className="text-xs text-muted-foreground mt-1">Không có cảnh báo nào cần xử lý ngay.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RecentActivityFeed({ items, loading }) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Hoạt động gần đây</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 py-6 justify-center text-muted-foreground">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
            <span className="text-sm">Đang tải...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg tracking-tight">Hoạt động gần đây</CardTitle>
        </div>
        <CardDescription>Cập nhật 30 ngày qua từ tất cả học viên</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />

            <div className="space-y-1">
              {items.map((item, index) => {
                const cfg = activityTypeConfig[item.type] || activityTypeConfig.session;
                const Icon = cfg.icon;

                return (
                  <Link key={item.id} to={item.href} className="block group">
                    <div className="flex items-start gap-3 py-2.5 px-2 rounded-lg hover:bg-muted/50 transition-colors relative">
                      {/* Timeline dot */}
                      <div className={cn('h-[30px] w-[30px] rounded-full flex items-center justify-center shrink-0 z-10', cfg.color)}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium truncate group-hover:text-orange-600 transition-colors">{item.title}</p>
                          <span className="text-[11px] text-muted-foreground whitespace-nowrap tabular-nums">{formatRelativeTime(item.timestamp)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {item.childName} — {item.subtitle}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Chưa có hoạt động nào gần đây</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ChildSnapshotCard({ child }) {
  const hasDebt = child.unpaidAmount > 0;
  const hasNextSession = !!child.nextSession;
  const hasAttention = child.attentionItems?.length > 0;

  return (
    <Card className={cn(
      'overflow-hidden hover:shadow-lg transition-all group',
      hasAttention ? 'border-orange-300/60 hover:border-orange-400/80' : 'hover:border-orange-500/30'
    )}>
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/5 p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-orange-500/15 flex items-center justify-center text-orange-600 font-bold text-lg">
              {child.full_name?.charAt(0) || 'S'}
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">{child.full_name}</h3>
              <p className="text-xs text-muted-foreground">{getRelationshipTone(child.relationship)} • {child.center_name || 'N/A'}</p>
            </div>
          </div>
          {hasAttention ? (
            <div className="flex items-center gap-1.5">
              {child.attentionItems.map((item, i) => (
                <Badge key={i} variant={item.type === 'overdue' ? 'destructive' : 'warning'} className="text-[10px] px-1.5">
                  {item.label}
                </Badge>
              ))}
            </div>
          ) : (
            <Badge variant="secondary" className="shrink-0 text-emerald-600 bg-emerald-50 border-emerald-200">Ổn định</Badge>
          )}
        </div>
      </div>

      {/* Metrics grid */}
      <CardContent className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {/* Next session */}
          <div className="rounded-lg bg-muted/40 p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <CalendarClock className="h-3 w-3" />Buổi học tới
            </div>
            {hasNextSession ? (
              <div>
                <p className="text-sm font-semibold truncate">{child.nextSession.class_name || child.nextSession.course_title || 'Lớp học'}</p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {formatShortDate(child.nextSession.session_date || child.nextSession.date)}
                  {child.nextSession.start_time ? ` • ${child.nextSession.start_time}` : ''}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Chưa có lịch</p>
            )}
          </div>

          {/* Attendance */}
          <div className="rounded-lg bg-muted/40 p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <BarChart3 className="h-3 w-3" />Chuyên cần
            </div>
            {child.attendanceRate !== null ? (
              <div>
                <p className={cn('text-sm font-semibold tabular-nums',
                  child.attendanceRate >= 90 ? 'text-emerald-600' :
                  child.attendanceRate >= 75 ? 'text-amber-600' : 'text-red-600'
                )}>
                  {child.attendanceRate}%
                </p>
                <p className="text-xs text-muted-foreground tabular-nums">{child.attendanceTotal} buổi</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Chưa có data</p>
            )}
          </div>

          {/* Unpaid */}
          <div className="rounded-lg bg-muted/40 p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Wallet className="h-3 w-3" />Học phí
            </div>
            {child.unpaidCount > 0 ? (
              <div>
                <p className="text-sm font-semibold text-orange-600 tabular-nums">{formatCurrency(child.unpaidAmount)}</p>
                <p className="text-xs text-muted-foreground tabular-nums">{child.unpaidCount} khoản</p>
              </div>
            ) : (
              <p className="text-sm font-semibold text-emerald-600">Đã đóng đủ</p>
            )}
          </div>

          {/* Latest grade */}
          <div className="rounded-lg bg-muted/40 p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Star className="h-3 w-3" />Điểm gần nhất
            </div>
            {child.latestGrade ? (
              <div>
                <p className="text-sm font-semibold tabular-nums">{child.latestGrade.score ?? child.latestGrade.grade ?? '—'}</p>
                <p className="text-xs text-muted-foreground truncate">{child.latestGrade.grade_structure_name || child.latestGrade.subject || 'Bài kiểm tra'}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Chưa có điểm</p>
            )}
          </div>
        </div>

        {/* Action button */}
        <Button asChild className="w-full bg-orange-600 hover:bg-orange-700 text-white group-hover:shadow-md transition-shadow">
          <Link to={`/parent/child/${child.id}`}>
            Xem chi tiết <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ──────────────────────────────────────────────────

export function ParentDashboard() {
  const { profile } = useAuth();
  const {
    data: dashboardData,
    loading: dashboardLoading,
    error: dashboardError,
    refresh: refreshDashboard,
  } = useParentDashboard();
  const {
    children,
    loading: childrenLoading,
    error: childrenError,
    refresh: refreshChildren,
  } = useParentChildren();

  const {
    alerts,
    snapshots,
    recentActivity,
    todayFocus,
    loading: aggregatorLoading,
    refresh: refreshAggregator,
  } = useParentDashboardAggregator(children);

  const loading = dashboardLoading || childrenLoading;
  const parentName = profile?.full_name || 'Phụ huynh';
  const surfaceError = childrenError || dashboardError;

  const refresh = () => {
    refreshDashboard();
    refreshChildren();
    refreshAggregator();
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto" />
          <p className="mt-4 text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <GreetingHeader name={parentName} childCount={children.length} onRefresh={refresh} />

      {surfaceError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">Một phần dữ liệu chưa tải được.</p>
          <p className="mt-1 text-amber-800/90">{surfaceError}</p>
        </div>
      )}

      {/* Today's Focus — replaces OverviewStats + QuickActions */}
      <TodayFocus focus={todayFocus} loading={aggregatorLoading} />

      {/* Main content: alerts + activity feed */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Priority alerts */}
        <PriorityAlerts alerts={alerts} loading={aggregatorLoading} />

        {/* Recent activity feed */}
        <RecentActivityFeed items={recentActivity} loading={aggregatorLoading} />
      </div>

      {/* Per-child cards */}
      <div>
        <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-orange-600" />
          Học viên được liên kết
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {(snapshots.length > 0 ? snapshots : children).length > 0 ? (
            (snapshots.length > 0 ? snapshots : children).map(child => (
              <ChildSnapshotCard key={child.id} child={child} />
            ))
          ) : (
            <div className="col-span-full text-center py-12 bg-muted/30 rounded-lg border border-dashed">
              <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
              <h3 className="text-lg font-medium text-muted-foreground">Chưa có học viên nào được liên kết</h3>
              <p className="text-sm text-muted-foreground">Vui lòng liên hệ trung tâm để hoàn tất liên kết.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ParentDashboard;
