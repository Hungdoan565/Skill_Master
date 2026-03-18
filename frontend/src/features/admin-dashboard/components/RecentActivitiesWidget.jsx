import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  LogIn,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ENTITY_LABELS = {
  grade: 'Điểm',
  grades: 'Điểm',
  student: 'Học viên',
  students: 'Học viên',
  payment: 'Thanh toán',
  payments: 'Thanh toán',
  invoice: 'Hóa đơn',
  class: 'Lớp học',
  teacher: 'Giáo viên',
  user: 'Người dùng',
  center: 'Trung tâm',
  course: 'Khóa học',
  attendance: 'Điểm danh',
  enrollment: 'Ghi danh',
  enrollments: 'Ghi danh',
  user_profiles: 'Nhân sự',
  staff: 'Nhân sự',
  setting: 'Cài đặt',
  settings: 'Cài đặt',
};

const ACTION_CONFIG = {
  CREATE: {
    label: 'Tạo mới',
    icon: Plus,
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300',
  },
  UPDATE: {
    label: 'Cập nhật',
    icon: Pencil,
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    badgeClass: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  },
  DELETE: {
    label: 'Xóa',
    icon: Trash2,
    iconBg: 'bg-rose-100 dark:bg-rose-900/30',
    iconColor: 'text-rose-600 dark:text-rose-400',
    badgeClass: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-300',
  },
  LOGIN: {
    label: 'Đăng nhập',
    icon: LogIn,
    iconBg: 'bg-violet-100 dark:bg-violet-900/30',
    iconColor: 'text-violet-600 dark:text-violet-400',
    badgeClass: 'border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-800 dark:bg-violet-900/20 dark:text-violet-300',
  },
  LOGOUT: {
    label: 'Đăng xuất',
    icon: LogOut,
    iconBg: 'bg-slate-100 dark:bg-slate-800',
    iconColor: 'text-slate-500 dark:text-slate-400',
    badgeClass: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400',
  },
};

const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  const diffInSeconds = Math.floor((Date.now() - new Date(dateString)) / 1000);
  if (diffInSeconds < 60) return 'Vừa xong';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
  return new Date(dateString).toLocaleDateString('vi-VN');
};

// Build display sentence
const buildActivityText = (activity) => {
  const action = ACTION_CONFIG[activity.action]?.label?.toLowerCase() || activity.action;
  const entity = ENTITY_LABELS[activity.entity_type?.toLowerCase()] || activity.entity_type || '';
  return `đã ${action} ${entity}`.trim();
};

export function RecentActivitiesWidget({ activities }) {
  if (!activities || !Array.isArray(activities) || activities.length === 0) return null;

  return (
    <Card className="admin-surface-card rounded-2xl overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Activity className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <CardTitle className="text-base font-semibold tracking-tight">
              Hoạt động gần đây
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px] font-medium text-muted-foreground">
            {activities.length} mục
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-6 pb-0">
        <div className="max-h-[420px] overflow-y-auto -mr-2 pr-2">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-border via-border/60 to-transparent" />

            <div className="space-y-0.5">
              {activities.map((activity, index) => {
                const config = ACTION_CONFIG[activity.action] || ACTION_CONFIG.LOGOUT;
                const Icon = config.icon;
                const actorName = activity.actor_name || activity.user_email || 'System';

                return (
                  <div
                    key={activity.id || index}
                    className="relative flex items-start gap-3 py-3 px-1 rounded-lg hover:bg-muted/40 transition-colors group"
                  >
                    {/* Timeline dot / icon */}
                    <div className={cn(
                      "relative z-10 flex-shrink-0 w-[30px] h-[30px] rounded-full flex items-center justify-center ring-2 ring-background",
                      config.iconBg
                    )}>
                      <Icon className={cn("h-3.5 w-3.5", config.iconColor)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-sm font-semibold text-foreground truncate max-w-[160px]">
                          {actorName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {buildActivityText(activity)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-muted-foreground/70">
                          {formatRelativeTime(activity.created_at)}
                        </span>
                        {activity.center_name && (
                          <>
                            <span className="text-muted-foreground/30">·</span>
                            <span className="text-[11px] text-muted-foreground/70 truncate max-w-[140px]">
                              {activity.center_name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action badge */}
                    <Badge
                      variant="outline"
                      className={cn(
                        'flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold mt-1 opacity-80 group-hover:opacity-100 transition-opacity',
                        config.badgeClass
                      )}
                    >
                      {config.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t pt-4 mt-2">
        <Link
          to="/admin/audit-trail"
          className="admin-cta-link admin-focus-ring w-full inline-flex items-center justify-center gap-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
        >
          Xem tất cả hoạt động
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardFooter>
    </Card>
  );
}
