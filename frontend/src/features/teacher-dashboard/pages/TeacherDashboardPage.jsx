import { useAuth } from '@/contexts/auth-context';
import { useTeacherDashboard } from '../hooks/useTeacherDashboard';
import { StatCard } from '../components/StatCard';
import { QuickActions } from '../components/QuickActions';
import { TodaySchedule } from '../components/TodaySchedule';
import { AttendanceStats } from '../components/AttendanceStats';
import { ClassesSummary } from '../components/ClassesSummary';
import { UpcomingSessions } from '../components/UpcomingSessions';
import { SmartAlerts } from '../components/SmartAlerts';
import {
    CalendarDays,
    Clock,
    DollarSign,
    ClipboardCheck,
    RefreshCw,
    AlertTriangle,
    Home,
    BookOpen,
    Banknote
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TeacherPageHeader } from '@/components/ui/teacher-page-header';

/**
 * Teacher Dashboard Page - Trang tổng quan cho giáo viên
 */
export function TeacherDashboardPage() {
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const {
        overview,
        todaySessions,
        upcomingSessions,
        attendanceStats,
        classesSummary,
        pendingLeaveCount,
        loading,
        error,
        refetch
    } = useTeacherDashboard();

    // Get greeting based on time
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Chào buổi sáng';
        if (hour < 18) return 'Chào buổi chiều';
        return 'Chào buổi tối';
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    // Get payroll display info
    const getPayrollDisplay = () => {
        const status = overview?.payroll_status;
        if (!status) return { label: 'Chưa có', variant: 'default', subtitle: 'Chưa chốt lương tháng này' };
        if (status === 'paid') return {
            label: 'Đã thanh toán',
            variant: 'success',
            subtitle: overview?.payroll_amount ? formatCurrency(overview.payroll_amount) : 'Đã trả đủ'
        };
        if (status === 'approved') return {
            label: 'Đã duyệt',
            variant: 'primary',
            subtitle: overview?.payroll_amount ? formatCurrency(overview.payroll_amount) : 'Đang chờ thanh toán'
        };
        if (status === 'pending') return {
            label: 'Chờ duyệt',
            variant: 'warning',
            subtitle: 'Admin đang xem xét'
        };
        return { label: status, variant: 'default', subtitle: '' };
    };

    // Handle mark attendance click
    const handleMarkAttendance = (session) => {
        navigate(`/teacher/attendance?session=${session.id}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center p-6 bg-red-500/10 rounded-2xl max-w-md">
                    <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-red-700 mb-2">Đã có lỗi xảy ra</h2>
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={refetch}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    const payrollDisplay = getPayrollDisplay();

    return (
        <div className="min-h-screen bg-secondary/30 dark:bg-background pb-12">
            {/* Header */}
            <div className="bg-white dark:bg-card border-b border-border/50 sticky top-0 z-10 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <TeacherPageHeader
                        title={`${getGreeting()}, ${profile?.full_name || 'Giáo viên'}! 👋`}
                        subtitle={new Date().toLocaleDateString('vi-VN', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                        icon={Home}
                        iconColorClass="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10"
                        showBreadcrumb={false}
                        actions={
                            <button
                                onClick={refetch}
                                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted dark:hover:bg-slate-800 transition-colors group btn-tactile"
                                title="Làm mới dữ liệu"
                            >
                                <RefreshCw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
                                <span className="hidden sm:inline">Làm mới</span>
                            </button>
                        }
                    />
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Stats Cards - 5 cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 animate-fade-in-up stagger-1">
                    <StatCard
                        title="Buổi dạy hôm nay"
                        value={overview?.today_sessions || 0}
                        subtitle={overview?.today_completed > 0
                            ? `${overview.today_completed} đã hoàn thành`
                            : 'Chưa có buổi hoàn thành'}
                        icon={CalendarDays}
                        variant="primary"
                    />
                    <StatCard
                        title="Giờ dạy tháng này"
                        value={`${overview?.monthly_hours || 0}h`}
                        subtitle={`${overview?.monthly_sessions || 0} buổi học`}
                        icon={Clock}
                        variant="success"
                    />
                    <StatCard
                        title="Thu nhập ước tính"
                        value={formatCurrency(overview?.estimated_income)}
                        subtitle="Dựa trên buổi đã hoàn thành"
                        icon={DollarSign}
                        variant="warning"
                    />
                    <StatCard
                        title="Cần điểm danh"
                        value={overview?.pending_attendance || 0}
                        subtitle="Buổi chưa điểm danh"
                        icon={ClipboardCheck}
                        variant={overview?.pending_attendance > 0 ? 'danger' : 'default'}
                    />
                    <StatCard
                        title="Bảng lương tháng này"
                        value={payrollDisplay.label}
                        subtitle={payrollDisplay.subtitle}
                        icon={Banknote}
                        variant={payrollDisplay.variant}
                    />
                </div>

                {/* Smart Alerts - replaces static Tips */}
                <div className="animate-fade-in-up stagger-2">
                    <SmartAlerts
                        overview={overview}
                        todaySessions={todaySessions}
                        pendingLeaveCount={pendingLeaveCount}
                    />
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up stagger-3">
                    {/* Left Column - Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Today Schedule */}
                        <TodaySchedule
                            sessions={todaySessions}
                            onMarkAttendance={handleMarkAttendance}
                        />

                        {/* Attendance Stats */}
                        <AttendanceStats stats={attendanceStats} />

                        {/* Classes Summary */}
                        <ClassesSummary classes={classesSummary} />
                    </div>

                    {/* Right Column - Sidebar */}
                    <div className="lg:sticky lg:top-24 self-start space-y-6 animate-fade-in-up stagger-4">
                        {/* Quick Actions */}
                        <QuickActions pendingLeaveCount={pendingLeaveCount} />

                        {/* Upcoming Sessions - 7 days ahead */}
                        <UpcomingSessions sessions={upcomingSessions} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TeacherDashboardPage;
