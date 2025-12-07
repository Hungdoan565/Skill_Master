import { Link } from 'react-router-dom';
import {
    Calendar,
    ClipboardList,
    DollarSign,
    Clock,
    FileText,
    Settings
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
            color: 'bg-blue-50 text-blue-600 hover:bg-blue-100'
        },
        {
            label: 'Điểm danh',
            description: 'Điểm danh nhanh',
            icon: ClipboardList,
            href: '/teacher/attendance',
            color: 'bg-green-50 text-green-600 hover:bg-green-100'
        },
        {
            label: 'Bảng lương',
            description: 'Xem thu nhập',
            icon: DollarSign,
            href: '/teacher/payroll',
            color: 'bg-amber-50 text-amber-600 hover:bg-amber-100'
        },
        {
            label: 'Lịch trống',
            description: 'Cập nhật lịch',
            icon: Clock,
            href: '/teacher/availability',
            color: 'bg-purple-50 text-purple-600 hover:bg-purple-100'
        },
        {
            label: 'Đơn xin nghỉ',
            description: 'Gửi đơn nghỉ phép',
            icon: FileText,
            href: '/teacher/leave-requests',
            color: 'bg-rose-50 text-rose-600 hover:bg-rose-100'
        },
        {
            label: 'Cài đặt',
            description: 'Thông tin cá nhân',
            icon: Settings,
            href: '/teacher/profile',
            color: 'bg-gray-50 text-gray-600 hover:bg-gray-100'
        }
    ];

    return (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                ⚡ Thao tác nhanh
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
                        <span className="text-xs text-gray-500 text-center mt-0.5">
                            {action.description}
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
}

export default QuickActions;
