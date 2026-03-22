import { Link } from 'react-router-dom';
import {
    Calendar,
    ClipboardList,
    DollarSign,
    Clock,
    FileText,
    GraduationCap,
    Zap
} from 'lucide-react';

/**
 * Component Quick Actions cho Teacher Dashboard
 */
export function QuickActions({ pendingLeaveCount = 0 }) {
    const actions = [
        {
            label: 'Xem lịch dạy',
            description: 'Lịch tuần này',
            icon: Calendar,
            href: '/teacher/schedule',
            color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20',
            badge: null
        },
        {
            label: 'Điểm danh',
            description: 'Điểm danh nhanh',
            icon: ClipboardList,
            href: '/teacher/attendance',
            color: 'bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20',
            badge: null
        },
        {
            label: 'Bảng lương',
            description: 'Xem thu nhập',
            icon: DollarSign,
            href: '/teacher/payroll',
            color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20',
            badge: null
        },
        {
            label: 'Lịch trống',
            description: 'Cập nhật lịch',
            icon: Clock,
            href: '/teacher/availability',
            color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20',
            badge: null
        },
        {
            label: 'Đơn xin nghỉ',
            description: 'Gửi đơn nghỉ phép',
            icon: FileText,
            href: '/teacher/leave-requests',
            color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20',
            badge: pendingLeaveCount > 0 ? pendingLeaveCount : null
        },
        {
            label: 'Bảng điểm',
            description: 'Xem & nhập điểm',
            icon: GraduationCap,
            href: '/teacher/classes',
            color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-500/20',
            badge: null
        }
    ];

    return (
        <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card/95 shadow-sm shadow-black/5 dark:shadow-black/20">
            <div className="p-5 border-b border-border/50 bg-slate-50/50 dark:bg-muted/20 flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                <h3 className="text-base font-semibold text-foreground">
                    Thao tác nhanh
                </h3>
            </div>

            <div className="p-4 grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                {actions.map((action) => (
                    <Link
                        key={action.href + action.label}
                        to={action.href}
                        className={`
                            group relative flex flex-col items-center justify-center p-3 rounded-xl
                            transition-all duration-300 border border-transparent
                            hover:-translate-y-1 hover:border-border hover:shadow-md hover:shadow-black/10 dark:hover:shadow-black/30
                            ${action.color}
                        `}
                    >
                        {/* Badge for pending count */}
                        {action.badge !== null && (
                            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow">
                                {action.badge > 9 ? '9+' : action.badge}
                            </span>
                        )}
                        <div className="mb-2 rounded-full bg-background/80 p-2.5 shadow-sm ring-1 ring-border/60 transition-transform duration-300 group-hover:scale-110">
                            <action.icon className="h-5 w-5 text-current" />
                        </div>
                        <span className="text-center text-[12px] font-medium leading-tight text-foreground/90 transition-colors group-hover:text-current">{action.label}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}

export default QuickActions;
