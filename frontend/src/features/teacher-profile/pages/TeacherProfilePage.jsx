import { useTeacherProfile } from '../hooks/useTeacherProfile';
import {
    Mail,
    Phone,
    DollarSign,
    Calendar,
    Building2,
    BookOpen,
    GraduationCap,
    Clock,
    AlertTriangle,
    RefreshCw
} from 'lucide-react';

export default function TeacherProfilePage() {
    const { profile, loading, error, refetch } = useTeacherProfile();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center p-6 bg-red-500/10 border border-red-500/20 rounded-2xl max-w-md shadow-sm">
                    <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">Đã có lỗi xảy ra</h2>
                    <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
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

    // Safely extract profile details
    const {
        email = '',
        full_name = 'Giáo viên',
        phone = 'Chưa cập nhật',
        avatar_url = null,
        hourly_rate = 0,
        status = 'ACTIVE',
        created_at = new Date().toISOString(),
        centers = [],
        stats = {}
    } = profile || {};

    // Get initials for avatar fallback
    const getInitials = (name) => {
        if (!name) return 'GV';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'Chưa cập nhật';
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    // Primary center
    const primaryCenter = centers.length > 0 ? centers[0] : null;

    return (
        <div className="min-h-screen bg-white pb-12">
            {/* Header / Hero Section */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white pb-16 pt-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                            {avatar_url ? (
                                <img
                                    src={avatar_url}
                                    alt={full_name}
                                    className="h-32 w-32 rounded-full border-4 border-white/20 object-cover shadow-lg"
                                />
                            ) : (
                                <div className="h-32 w-32 rounded-full border-4 border-white/20 shadow-lg bg-blue-500 flex items-center justify-center text-4xl font-bold text-white">
                                    {getInitials(full_name)}
                                </div>
                            )}
                        </div>

                        {/* Name & Role */}
                        <div className="flex-1 text-center md:text-left mt-4 md:mt-0">
                            <h1 className="text-3xl font-bold">{full_name}</h1>
                            <div className="mt-2 flex flex-col md:flex-row items-center gap-3">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-500/30 text-blue-50 border border-blue-400/30">
                                    {status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm nghỉ'}
                                </span>
                                <div className="flex items-center text-blue-100 text-sm">
                                    <Mail className="h-4 w-4 mr-1.5" />
                                    {email}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={refetch}
                            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors self-center md:self-start mt-4 md:mt-0"
                            title="Làm mới dữ liệu"
                        >
                            <RefreshCw className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 space-y-6">
                
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Classes Stat */}
                    <div className="bg-white rounded-2xl shadow-sm border border-border p-5 flex items-center">
                        <div className="p-3 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 mr-4">
                            <BookOpen className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Tổng lớp dạy</p>
                            <p className="text-2xl font-bold text-foreground">{stats.totalClasses || 0}</p>
                        </div>
                    </div>
                    
                    {/* Sessions Stat */}
                    <div className="bg-white rounded-2xl shadow-sm border border-border p-5 flex items-center">
                        <div className="p-3 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 mr-4">
                            <GraduationCap className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Tổng buổi dạy</p>
                            <p className="text-2xl font-bold text-foreground">{stats.totalSessions || 0}</p>
                        </div>
                    </div>

                    {/* Hours Stat */}
                    <div className="bg-white rounded-2xl shadow-sm border border-border p-5 flex items-center">
                        <div className="p-3 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 mr-4">
                            <Clock className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Số giờ năm nay</p>
                            <p className="text-2xl font-bold text-foreground">{stats.totalHoursThisYear || 0}</p>
                        </div>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column: Personal Info */}
                    <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
                        <div className="px-6 py-4 border-b border-border bg-slate-50">
                            <h2 className="text-lg font-semibold text-foreground">Thông tin cá nhân</h2>
                        </div>
                        <div className="p-6">
                            <ul className="space-y-4">
                                <li className="flex items-center">
                                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground mr-4">
                                        <Mail className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Email</p>
                                        <p className="text-base text-foreground">{email}</p>
                                    </div>
                                </li>
                                <li className="flex items-center">
                                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground mr-4">
                                        <Phone className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Số điện thoại</p>
                                        <p className="text-base text-foreground">{phone}</p>
                                    </div>
                                </li>
                                <li className="flex items-center">
                                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground mr-4">
                                        <DollarSign className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Lương theo giờ</p>
                                        <p className="text-base text-foreground">{formatCurrency(hourly_rate)}/h</p>
                                    </div>
                                </li>
                                <li className="flex items-center">
                                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground mr-4">
                                        <Calendar className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Ngày tham gia</p>
                                        <p className="text-base text-foreground">{formatDate(created_at)}</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Right Column: Center Info */}
                    <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
                        <div className="px-6 py-4 border-b border-border bg-slate-50">
                            <h2 className="text-lg font-semibold text-foreground">Trung tâm</h2>
                        </div>
                        <div className="p-6">
                            {primaryCenter ? (
                                <ul className="space-y-4">
                                    <li className="flex items-start">
                                        <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 mr-4 shrink-0">
                                            <Building2 className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Tên trung tâm</p>
                                            <p className="text-base font-medium text-foreground">{primaryCenter.name || 'Chưa cập nhật'}</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start">
                                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground mr-4 shrink-0">
                                            <Mail className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Địa chỉ</p>
                                            <p className="text-base text-foreground">{primaryCenter.address || 'Chưa cập nhật'}</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start">
                                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground mr-4 shrink-0">
                                            <Phone className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Hotline</p>
                                            <p className="text-base text-foreground">{primaryCenter.phone || primaryCenter.hotline || 'Chưa cập nhật'}</p>
                                        </div>
                                    </li>
                                </ul>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <Building2 className="h-12 w-12 text-muted-foreground/30 mb-3" />
                                    <p className="text-muted-foreground font-medium">Chưa liên kết trung tâm</p>
                                    <p className="text-sm text-muted-foreground/70 mt-1">Vui lòng liên hệ quản trị viên để được hỗ trợ.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
