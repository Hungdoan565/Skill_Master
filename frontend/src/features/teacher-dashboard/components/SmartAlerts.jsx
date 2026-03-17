import { AlertTriangle, CheckCircle, Info, Bell, ClipboardCheck, DollarSign, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

/**
 * Smart Alerts - Cảnh báo thông minh dựa trên dữ liệu thực tế của giáo viên
 * Thay thế section "Mẹo hôm nay" static
 */
export function SmartAlerts({ overview, todaySessions, pendingLeaveCount = 0 }) {
    const alerts = [];

    const pendingAttendance = overview?.pending_attendance || 0;
    const payrollStatus = overview?.payroll_status;
    const payrollAmount = overview?.payroll_amount;
    const todayCount = overview?.today_sessions || todaySessions?.length || 0;

    // Critical: nhiều buổi chưa điểm danh
    if (pendingAttendance > 2) {
        alerts.push({
            id: 'attendance-critical',
            type: 'danger',
            icon: ClipboardCheck,
            title: `${pendingAttendance} buổi chưa điểm danh`,
            message: 'Điểm danh sớm để đảm bảo tính lương chính xác và không bị trừ lương.',
            action: { label: 'Điểm danh ngay', href: '/teacher/attendance' }
        });
    } else if (pendingAttendance > 0) {
        alerts.push({
            id: 'attendance-warn',
            type: 'warning',
            icon: ClipboardCheck,
            title: `${pendingAttendance} buổi chưa điểm danh`,
            message: 'Vui lòng điểm danh để dữ liệu luôn cập nhật.',
            action: { label: 'Điểm danh', href: '/teacher/attendance' }
        });
    }

    // Payroll status alerts
    if (payrollStatus === 'paid') {
        alerts.push({
            id: 'payroll-paid',
            type: 'success',
            icon: DollarSign,
            title: 'Lương tháng này đã được thanh toán',
            message: payrollAmount
                ? `Số tiền: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(payrollAmount)}`
                : 'Kiểm tra chi tiết trong mục Bảng lương.',
            action: { label: 'Xem bảng lương', href: '/teacher/payroll' }
        });
    } else if (payrollStatus === 'approved') {
        alerts.push({
            id: 'payroll-approved',
            type: 'info',
            icon: DollarSign,
            title: 'Bảng lương tháng này đã được duyệt',
            message: 'Lương đang trong quá trình thanh toán.',
            action: { label: 'Xem chi tiết', href: '/teacher/payroll' }
        });
    } else if (payrollStatus === 'pending') {
        alerts.push({
            id: 'payroll-pending',
            type: 'info',
            icon: DollarSign,
            title: 'Bảng lương tháng này đang chờ duyệt',
            message: 'Admin đang xem xét bảng lương của bạn.',
            action: { label: 'Xem bảng lương', href: '/teacher/payroll' }
        });
    }

    // Pending leave requests
    if (pendingLeaveCount > 0) {
        alerts.push({
            id: 'leave-pending',
            type: 'info',
            icon: FileText,
            title: `${pendingLeaveCount} đơn xin nghỉ đang chờ phê duyệt`,
            message: 'Admin chưa xử lý đơn nghỉ của bạn.',
            action: { label: 'Xem đơn nghỉ', href: '/teacher/leave-requests' }
        });
    }

    // No classes today
    if (todayCount === 0) {
        alerts.push({
            id: 'no-today',
            type: 'neutral',
            icon: Info,
            title: 'Hôm nay không có lịch dạy',
            message: 'Kiểm tra lịch tuần này hoặc cập nhật lịch trống của bạn.',
            action: { label: 'Xem lịch tuần', href: '/teacher/schedule' }
        });
    }

    // All good state
    if (alerts.length === 0) {
        alerts.push({
            id: 'all-good',
            type: 'success',
            icon: CheckCircle,
            title: 'Mọi thứ đều ổn!',
            message: 'Không có cảnh báo nào. Chúc bạn dạy học hiệu quả hôm nay.',
            action: null
        });
    }

    const typeConfig = {
        danger: {
            border: 'border-red-200 dark:border-red-500/30',
            bg: 'bg-red-50 dark:bg-red-500/10',
            icon: 'text-red-500',
            title: 'text-red-800 dark:text-red-300',
            message: 'text-red-700 dark:text-red-400',
            action: 'bg-red-600 hover:bg-red-700 text-white'
        },
        warning: {
            border: 'border-amber-200 dark:border-amber-500/30',
            bg: 'bg-amber-50 dark:bg-amber-500/10',
            icon: 'text-amber-500',
            title: 'text-amber-800 dark:text-amber-300',
            message: 'text-amber-700 dark:text-amber-400',
            action: 'bg-amber-600 hover:bg-amber-700 text-white'
        },
        success: {
            border: 'border-green-200 dark:border-green-500/30',
            bg: 'bg-green-50 dark:bg-green-500/10',
            icon: 'text-green-500',
            title: 'text-green-800 dark:text-green-300',
            message: 'text-green-700 dark:text-green-400',
            action: 'bg-green-600 hover:bg-green-700 text-white'
        },
        info: {
            border: 'border-blue-200 dark:border-blue-500/30',
            bg: 'bg-blue-50 dark:bg-blue-500/10',
            icon: 'text-blue-500',
            title: 'text-blue-800 dark:text-blue-300',
            message: 'text-blue-700 dark:text-blue-400',
            action: 'bg-blue-600 hover:bg-blue-700 text-white'
        },
        neutral: {
            border: 'border-border',
            bg: 'bg-muted/40',
            icon: 'text-muted-foreground',
            title: 'text-foreground',
            message: 'text-muted-foreground',
            action: 'bg-primary hover:bg-primary/90 text-primary-foreground'
        }
    };

    return (
        <div className="rounded-2xl border border-border bg-white dark:bg-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Bell className="h-5 w-5 text-amber-500" />
                Thông báo & Nhắc nhở
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {alerts.map(alert => {
                    const config = typeConfig[alert.type];
                    const AlertIcon = alert.icon;
                    return (
                        <div
                            key={alert.id}
                            className={cn(
                                'rounded-xl border p-4 flex flex-col gap-2',
                                config.border,
                                config.bg
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <AlertIcon className={cn('h-4 w-4 shrink-0', config.icon)} />
                                <h4 className={cn('text-sm font-semibold', config.title)}>
                                    {alert.title}
                                </h4>
                            </div>
                            <p className={cn('text-xs leading-relaxed', config.message)}>
                                {alert.message}
                            </p>
                            {alert.action && (
                                <Link
                                    to={alert.action.href}
                                    className={cn(
                                        'mt-1 inline-flex items-center self-start px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                                        config.action
                                    )}
                                >
                                    {alert.action.label}
                                </Link>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default SmartAlerts;
