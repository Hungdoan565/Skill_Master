import { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
    Users,
    Calendar,
    Clock,
    BookOpen,
    ChevronRight,
    Search,
    Filter,
    RefreshCw,
    XCircle,
    CheckCircle,
    PlayCircle,
    PauseCircle
} from 'lucide-react';
import { useTeacherClasses } from '../hooks/useTeacherClasses';

/**
 * Teacher Classes Page - Trang danh sách lớp học của giáo viên
 */
export function TeacherClassesPage() {
    const { classes, loading, error, refetch } = useTeacherClasses();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Filter classes
    const filteredClasses = classes.filter(cls => {
        const matchesSearch = !searchTerm ||
            cls.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cls.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cls.course_name?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || cls.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Status counts
    const statusCounts = {
        all: classes.length,
        active: classes.filter(c => c.status === 'active' || c.status === 'ongoing').length,
        upcoming: classes.filter(c => c.status === 'upcoming').length,
        completed: classes.filter(c => c.status === 'completed').length
    };

    const getStatusConfig = (status) => {
        const configs = {
            active: {
                label: 'Đang học',
                icon: PlayCircle,
                class: 'bg-green-500/20 text-green-700 dark:text-green-400'
            },
            ongoing: {
                label: 'Đang học',
                icon: PlayCircle,
                class: 'bg-green-500/20 text-green-700 dark:text-green-400'
            },
            upcoming: {
                label: 'Sắp khai giảng',
                icon: Clock,
                class: 'bg-blue-500/20 text-blue-700 dark:text-blue-400'
            },
            completed: {
                label: 'Hoàn thành',
                icon: CheckCircle,
                class: 'bg-muted text-foreground'
            },
            cancelled: {
                label: 'Đã hủy',
                icon: XCircle,
                class: 'bg-red-500/20 text-red-700 dark:text-red-400'
            },
            paused: {
                label: 'Tạm dừng',
                icon: PauseCircle,
                class: 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
            }
        };
        return configs[status] || configs.upcoming;
    };

    const getProgressColor = (progress) => {
        if (progress >= 80) return 'bg-green-500';
        if (progress >= 50) return 'bg-blue-500';
        if (progress >= 25) return 'bg-amber-500';
        return 'bg-muted-foreground';
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '--';
        return new Date(dateStr).toLocaleDateString('vi-VN');
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Đang tải danh sách lớp...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center p-6 bg-red-500/10 rounded-2xl max-w-md">
                    <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">Đã có lỗi xảy ra</h2>
                    <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                    <button
                        onClick={refetch}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <BookOpen className="h-6 w-6 text-purple-500" />
                        Lớp học của tôi
                    </h1>
                    <p className="text-muted-foreground mt-1">Quản lý và theo dõi các lớp bạn đang dạy</p>
                </div>

                <button
                    onClick={refetch}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-lg hover:bg-muted transition-colors"
                >
                    <RefreshCw className="h-4 w-4" />
                    Làm mới
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <button
                    onClick={() => setStatusFilter('all')}
                    className={cn(
                        'p-4 rounded-2xl border text-left transition-all',
                        statusFilter === 'all' ? 'border-blue-500/50 bg-blue-500/10 ring-2 ring-blue-500/20' : 'bg-white border-border hover:border-border/80'
                    )}
                >
                    <p className="text-2xl font-bold text-foreground">{statusCounts.all}</p>
                    <p className="text-sm text-muted-foreground">Tất cả lớp</p>
                </button>
                <button
                    onClick={() => setStatusFilter('active')}
                    className={cn(
                        'p-4 rounded-2xl border text-left transition-all',
                        statusFilter === 'active' ? 'border-green-500/50 bg-green-500/10 ring-2 ring-green-500/20' : 'bg-white border-border hover:border-border/80'
                    )}
                >
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{statusCounts.active}</p>
                    <p className="text-sm text-muted-foreground">Đang học</p>
                </button>
                <button
                    onClick={() => setStatusFilter('upcoming')}
                    className={cn(
                        'p-4 rounded-2xl border text-left transition-all',
                        statusFilter === 'upcoming' ? 'border-blue-500/50 bg-blue-500/10 ring-2 ring-blue-500/20' : 'bg-white border-border hover:border-border/80'
                    )}
                >
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{statusCounts.upcoming}</p>
                    <p className="text-sm text-muted-foreground">Sắp khai giảng</p>
                </button>
                <button
                    onClick={() => setStatusFilter('completed')}
                    className={cn(
                        'p-4 rounded-2xl border text-left transition-all',
                        statusFilter === 'completed' ? 'border-muted-foreground bg-muted ring-2 ring-muted' : 'bg-white border-border hover:border-border/80'
                    )}
                >
                    <p className="text-2xl font-bold text-muted-foreground">{statusCounts.completed}</p>
                    <p className="text-sm text-muted-foreground">Hoàn thành</p>
                </button>
            </div>

            {/* Search */}
            <div className="bg-white rounded-2xl border border-border p-4 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên lớp, mã lớp, hoặc khóa học..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-transparent border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

            {/* Classes List */}
            {filteredClasses.length === 0 ? (
                <div className="bg-white rounded-2xl border border-border p-12 text-center">
                    <BookOpen className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">Không tìm thấy lớp học</h3>
                    <p className="text-muted-foreground">
                        {searchTerm || statusFilter !== 'all'
                            ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
                            : 'Bạn chưa được phân công lớp học nào'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredClasses.map((cls) => {
                        const statusConfig = getStatusConfig(cls.status);
                        const StatusIcon = statusConfig.icon;
                        const progress = cls.progress || 0;

                        return (
                            <div
                                key={cls.id}
                                className="bg-white rounded-2xl border border-border hover:border-blue-500/50 hover:shadow-md transition-all overflow-hidden"
                            >
                                {/* Header */}
                                <div className="p-4 border-b border-border bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-semibold text-foreground truncate">
                                                {cls.name}
                                            </h3>
                                            <p className="text-sm text-muted-foreground truncate">
                                                {cls.code}
                                            </p>
                                        </div>
                                        <span className={cn(
                                            'inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full shrink-0',
                                            statusConfig.class
                                        )}>
                                            <StatusIcon className="h-3 w-3" />
                                            {statusConfig.label}
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-4 space-y-3">
                                    {/* Course */}
                                    <div className="flex items-center gap-2 text-sm">
                                        <BookOpen className="h-4 w-4 text-muted-foreground/50" />
                                        <span className="text-muted-foreground truncate">{cls.course_name || 'Chưa có khóa học'}</span>
                                    </div>

                                    {/* Students */}
                                    <div className="flex items-center gap-2 text-sm">
                                        <Users className="h-4 w-4 text-muted-foreground/50" />
                                        <span className="text-muted-foreground">{cls.student_count || 0} học viên</span>
                                    </div>

                                    {/* Schedule */}
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="h-4 w-4 text-muted-foreground/50" />
                                        <span className="text-muted-foreground">
                                            {formatDate(cls.start_date)} - {formatDate(cls.end_date)}
                                        </span>
                                    </div>

                                    {/* Sessions */}
                                    <div className="flex items-center gap-2 text-sm">
                                        <Clock className="h-4 w-4 text-muted-foreground/50" />
                                        <span className="text-muted-foreground">
                                            {cls.completed_sessions || 0}/{cls.total_sessions || 0} buổi
                                        </span>
                                    </div>

                                    {/* Progress */}
                                    <div>
                                        <div className="flex items-center justify-between text-xs mb-1">
                                            <span className="text-muted-foreground">Tiến độ</span>
                                            <span className="font-medium text-foreground">{progress}%</span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={cn(
                                                    'h-full rounded-full transition-all duration-500',
                                                    getProgressColor(progress)
                                                )}
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="p-4 border-t border-border bg-slate-50 flex items-center gap-2">
                                    <Link
                                        to={`/teacher/classes/${cls.id}/attendance`}
                                        className="flex-1 px-3 py-2 text-sm font-medium text-center text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                    >
                                        Điểm danh
                                    </Link>
                                    <Link
                                        to={`/teacher/classes/${cls.id}/gradebook`}
                                        className="flex-1 px-3 py-2 text-sm font-medium text-center text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors"
                                    >
                                        Sổ điểm
                                    </Link>
                                    <Link
                                        to={`/teacher/classes/${cls.id}`}
                                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default TeacherClassesPage;
