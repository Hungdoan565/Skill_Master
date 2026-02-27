import { Link } from 'react-router-dom';
import {
    Calendar,
    ClipboardList,
    DollarSign,
    Clock,
    FileText,
    Settings,
    Zap
} from 'lucide-react';

/**
 * Component Quick Actions cho Teacher Dashboard
 */
export function QuickActions() {
    const actions = [
        {
            label: 'Xem lịch dạy',
            description: 'Lịch tuần này',
            icon: Calendar,
            href: '/teacher/schedule',
            color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20'
        },
        {
            label: 'Điểm danh',
            description: 'Điểm danh nhanh',
            icon: ClipboardList,
            href: '/teacher/attendance',
            color: 'bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20'
        },
        {
            label: 'Bảng lương',
            description: 'Xem thu nhập',
            icon: DollarSign,
            href: '/teacher/payroll',
            color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
        },
        {
            label: 'Lịch trống',
            description: 'Cập nhật lịch',
            icon: Clock,
            href: '/teacher/availability',
            color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20'
        },
        {
            label: 'Đơn xin nghỉ',
            description: 'Gửi đơn nghỉ phép',
            icon: FileText,
            href: '/teacher/leave-requests',
            color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20'
        },
        {
            label: 'Cài đặt',
            description: 'Thông tin cá nhân',
            icon: Settings,
            href: '/teacher/profile',
            color: 'bg-muted text-muted-foreground hover:bg-muted/80'
        }
    ];

    return (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Thao tác nhanh
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {actions.map((action) => (
                    <Link
                        key={action.href}
                        to={action.href}
                        className={`
              flex flex-col items-center justify-center p-4 rounded-xl
              transition-all duration-200 group
              ${action.color}
            `}
                    >
                        <action.icon className="h-6 w-6 mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium text-center">{action.label}</span>
                        <span className="text-xs text-muted-foreground text-center mt-0.5">
                            {action.description}
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
}

export default QuickActions;
