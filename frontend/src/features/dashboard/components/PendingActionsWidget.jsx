import { AlertTriangle, CheckCircle2, FileText, GraduationCap, Clock, Scale } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PendingActionsWidget({ categories = [], total = 0, loading = false }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent p-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-muted rounded animate-pulse" />
              <div className="h-3 w-20 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const CATEGORY_CONFIG = {
    overdue_invoices: { icon: FileText, color: 'text-red-600', bg: 'bg-red-50', label: 'Hóa đơn quá hạn', path: '/admin/invoices' },
    pending_enrollments: { icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Ghi danh chờ duyệt', path: '/admin/enrollments' },
    pending_leave_requests: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Đơn xin nghỉ chờ duyệt', path: '/admin/leave' },
    pending_disputes: { icon: Scale, color: 'text-purple-600', bg: 'bg-purple-50', label: 'Khiếu nại lương', path: '/admin/payroll-disputes' },
  };

  if (total === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/25">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Cần xử lý</h3>
              <p className="text-sm text-muted-foreground">Công việc chờ giải quyết</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 mb-3">
            <CheckCircle2 className="h-7 w-7 text-emerald-500" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Không có việc cần xử lý 🎉</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
      <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/25">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Cần xử lý</h3>
              <p className="text-sm text-muted-foreground">Công việc chờ giải quyết</p>
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-700 font-bold text-lg">
            {total}
          </div>
        </div>
      </div>
      <div className="p-4 space-y-2">
        {categories.map((cat) => {
          const config = CATEGORY_CONFIG[cat.key] || {};
          const Icon = config.icon || AlertTriangle;
          return (
            <button
              key={cat.key}
              onClick={() => navigate(config.path || '/admin')}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group text-left"
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${config.bg || 'bg-muted'}`}>
                <Icon className={`h-4 w-4 ${config.color || 'text-muted-foreground'}`} />
              </div>
              <span className="flex-1 text-sm font-medium text-foreground group-hover:text-foreground/80">
                {config.label || cat.label || cat.key}
              </span>
              <span className={`inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full text-xs font-bold ${
                cat.count > 0 ? `${config.bg || 'bg-muted'} ${config.color || 'text-foreground'}` : 'bg-muted text-muted-foreground'
              }`}>
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
