import { useAuth } from '@/contexts/auth-context';
import { useTeacherDashboard } from '../hooks/useTeacherDashboard';
import {
    StatCard,
    TodaySchedule,
    AttendanceStats,
    ClassesSummary,
    QuickActions
} from '../components';
import {
    CalendarDays,
    Clock,
    DollarSign,
    ClipboardCheck,
    RefreshCw,
    AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Teacher Dashboard Page - Trang tổng quan cho giáo viên
 */
export function TeacherDashboardPage() {
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const {
        overview,
        todaySessions,
        attendanceStats,
        classesSummary,
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

    // Handle mark attendance click
    const handleMarkAttendance = (session) => {
        navigate(`/teacher/attendance?session=${session.id}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center p-6 bg-red-50 rounded-xl max-w-md">
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

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">
                                {getGreeting()}, {profile?.full_name || 'Giáo viên'}! 👋
                            </h1>
                            <p className="mt-1 text-blue-100">
                                {new Date().toLocaleDateString('vi-VN', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                        <button
                            onClick={refetch}
                            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                            title="Làm mới dữ liệu"
                        >
                            <RefreshCw className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Buổi dạy hôm nay"
                        value={overview?.today_sessions || 0}
                        subtitle={overview?.next_session ? `Kế tiếp: ${overview.next_session}` : 'Không có buổi'}
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
                        subtitle="Tháng này"
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
                </div>

                {/* Quick Actions */}
                <QuickActions />

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Today Schedule */}
                    <TodaySchedule
                        sessions={todaySessions}
                        onMarkAttendance={handleMarkAttendance}
                    />

                    {/* Attendance Stats */}
                    <AttendanceStats stats={attendanceStats} />
                </div>

                {/* Classes Summary */}
                <ClassesSummary classes={classesSummary} />

                {/* Tips Section */}
                <div className="rounded-xl border bg-gradient-to-r from-amber-50 to-orange-50 p-6">
                    <h3 className="text-lg font-semibold text-amber-900 mb-3">
                        💡 Mẹo hôm nay
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white/60 rounded-lg p-4">
                            <h4 className="font-medium text-amber-800">Điểm danh đúng hạn</h4>
                            <p className="text-sm text-amber-700 mt-1">
                                Hãy điểm danh ngay sau mỗi buổi học để đảm bảo dữ liệu chính xác và nhận lương đầy đủ.
                            </p>
                        </div>
                        <div className="bg-white/60 rounded-lg p-4">
                            <h4 className="font-medium text-amber-800">Cập nhật lịch trống</h4>
                            <p className="text-sm text-amber-700 mt-1">
                                Luôn cập nhật lịch trống để admin có thể xếp lịch phù hợp cho bạn.
                            </p>
                        </div>
                        <div className="bg-white/60 rounded-lg p-4">
                            <h4 className="font-medium text-amber-800">Kiểm tra bảng lương</h4>
                            <p className="text-sm text-amber-700 mt-1">
                                Kiểm tra bảng lương định kỳ và báo cáo ngay nếu có sai sót.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TeacherDashboardPage;
