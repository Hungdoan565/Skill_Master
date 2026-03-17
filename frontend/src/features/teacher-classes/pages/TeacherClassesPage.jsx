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
    RefreshCw,
    XCircle,
    CheckCircle,
    PauseCircle,
    PlayCircle,
    AlertTriangle,
    ShieldCheck,
    Shuffle,
    CalendarOff,
    Lock
} from 'lucide-react';
import { useTeacherClasses } from '../hooks/useTeacherClasses';
import { TeacherPageHeader } from '@/components/ui/teacher-page-header';

const parseDateOnlyLocal = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const parsed = new Date(year, month - 1, day);
    if (
        parsed.getFullYear() !== year ||
        parsed.getMonth() !== month - 1 ||
        parsed.getDate() !== day
    ) {
        return null;
    }
    return parsed;
};

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

        const matchesStatus = statusFilter === 'all' || cls.statusNormalized === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Status counts
    const statusCounts = {
        all: classes.length,
        ongoing: classes.filter(c => c.statusNormalized === 'ongoing').length,
        upcoming: classes.filter(c => c.statusNormalized === 'upcoming').length,
        completed: classes.filter(c => c.statusNormalized === 'completed').length
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

    const DAY_NAMES = { 0: 'CN', 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7' };

    const formatSchedule = (schedule) => {
        if (!schedule) return 'Chưa có lịch';
        let scheduleArr = schedule;
        if (typeof schedule === 'string') {
            try { scheduleArr = JSON.parse(schedule); } catch { return schedule; }
        }
        if (!Array.isArray(scheduleArr) || scheduleArr.length === 0) {
            return typeof schedule === 'string' ? schedule : 'Chưa có lịch';
        }
        const timeGroups = {};
        scheduleArr.forEach(s => {
            const timeKey = `${s.start}-${s.end}`;
            if (!timeGroups[timeKey]) timeGroups[timeKey] = [];
            timeGroups[timeKey].push(DAY_NAMES[s.day] || `T${s.day}`);
        });
        return Object.entries(timeGroups)
            .map(([time, days]) => `${days.join(', ')} • ${time}`)
            .join(' | ');
    };

    const getProgressColor = (progress) => {
        if (progress >= 80) return 'bg-green-500';
        if (progress >= 50) return 'bg-blue-500';
        if (progress >= 25) return 'bg-amber-500';
        return 'bg-muted-foreground';
    };

    const getOperationalRiskConfig = (summary) => {
        const risk = summary?.riskLevel || 'low';
        if (risk === 'high') {
            return {
                label: 'Rủi ro cao (toàn khóa)',
                className: 'bg-red-500/15 text-red-700 dark:text-red-300',
                icon: AlertTriangle
            };
        }
        if (risk === 'medium') {
            return {
                label: 'Cần lưu ý (toàn khóa)',
                className: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
                icon: AlertTriangle
            };
        }
        return {
            label: 'Ổn định (toàn khóa)',
            className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
            icon: ShieldCheck
        };
    };

    const getOperationalSignals = (summary) => {
        const signals = [];
        if ((summary?.conflictSessions || 0) > 0) {
            signals.push({
                key: 'conflict',
                label: `${summary.conflictSessions} buổi xung đột (toàn khóa)`,
                icon: AlertTriangle,
                className: 'bg-red-500/10 text-red-700 dark:text-red-300'
            });
        }
        if ((summary?.substitutedSessions || 0) > 0) {
            signals.push({
                key: 'substituted',
                label: `${summary.substitutedSessions} buổi dạy thay (toàn khóa)`,
                icon: Shuffle,
                className: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
            });
        }
        if ((summary?.holidaySessions || 0) > 0) {
            signals.push({
                key: 'holiday',
                label: `${summary.holidaySessions} buổi nghỉ lễ (toàn khóa)`,
                icon: CalendarOff,
                className: 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
            });
        }
        if ((summary?.payrollLockedSessions || 0) > 0) {
            signals.push({
                key: 'payrollLocked',
                label: `${summary.payrollLockedSessions} buổi đã khóa lương (toàn khóa)`,
                icon: Lock,
                className: 'bg-slate-500/10 text-slate-700 dark:text-slate-300'
            });
        }
        return signals;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '--';
        const parsed = parseDateOnlyLocal(dateStr);
        if (!parsed) return '--';
        return parsed.toLocaleDateString('vi-VN');
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-12">
            {/* Header */}
            <TeacherPageHeader
                title="Lớp học của tôi"
                subtitle="Quản lý và theo dõi các lớp bạn đang dạy"
                icon={BookOpen}
                iconColorClass="text-purple-600 bg-purple-50"
                actions={
                    <button
                        onClick={refetch}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border shadow-sm rounded-xl hover:bg-muted transition-colors btn-tactile text-sm font-medium"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Làm mới
                    </button>
                }
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 animate-fade-in-up stagger-1">
                <button
                    onClick={() => setStatusFilter('all')}
                    className={cn(
                        'p-4 rounded-2xl border text-left transition-all hover-card-lift',
                        statusFilter === 'all' ? 'border-blue-500/50 bg-blue-500/10 ring-2 ring-blue-500/20' : 'bg-white border-border hover:border-border/80'
                    )}
                >
                    <p className="text-2xl font-bold text-foreground">{statusCounts.all}</p>
                    <p className="text-sm text-muted-foreground">Tất cả lớp</p>
                </button>
                <button
                    onClick={() => setStatusFilter('ongoing')}
                    className={cn(
                        'p-4 rounded-2xl border text-left transition-all hover-card-lift',
                        statusFilter === 'ongoing' ? 'border-green-500/50 bg-green-500/10 ring-2 ring-green-500/20' : 'bg-white border-border hover:border-border/80'
                    )}
                >
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{statusCounts.ongoing}</p>
                    <p className="text-sm text-muted-foreground">Đang học</p>
                </button>
                <button
                    onClick={() => setStatusFilter('upcoming')}
                    className={cn(
                        'p-4 rounded-2xl border text-left transition-all hover-card-lift',
                        statusFilter === 'upcoming' ? 'border-blue-500/50 bg-blue-500/10 ring-2 ring-blue-500/20' : 'bg-white border-border hover:border-border/80'
                    )}
                >
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{statusCounts.upcoming}</p>
                    <p className="text-sm text-muted-foreground">Sắp khai giảng</p>
                </button>
                <button
                    onClick={() => setStatusFilter('completed')}
                    className={cn(
                        'p-4 rounded-2xl border text-left transition-all hover-card-lift',
                        statusFilter === 'completed' ? 'border-muted-foreground bg-muted ring-2 ring-muted' : 'bg-white border-border hover:border-border/80'
                    )}
                >
                    <p className="text-2xl font-bold text-muted-foreground">{statusCounts.completed}</p>
                    <p className="text-sm text-muted-foreground">Hoàn thành</p>
                </button>
            </div>

            {/* Search */}
            <div className="bg-white rounded-2xl border border-border p-4 mb-6 shadow-sm animate-fade-in-up stagger-2">
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
                        const statusConfig = getStatusConfig(cls.statusNormalized || cls.status);
                        const StatusIcon = statusConfig.icon;
                        const progress = cls.progress || 0;
                        const operationalSignals = getOperationalSignals(cls.operationalSummary);
                        const riskConfig = getOperationalRiskConfig(cls.operationalSummary);
                        const RiskIcon = riskConfig.icon;

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
                                    <div className="mt-2">
                                        <span className={cn(
                                            'inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium',
                                            riskConfig.className
                                        )}>
                                            <RiskIcon className="h-3 w-3" />
                                            {riskConfig.label}
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-4 space-y-3">
                                    {/* Course */}
                                    <div className="flex items-center gap-2 text-sm">
                                        <BookOpen className="h-4 w-4 text-muted-foreground/50" />
                                        <span className="text-muted-foreground truncate">{cls.courses?.title || cls.course_name || 'Chưa có khóa học'}</span>
                                    </div>

                                    {/* Students */}
                                    <div className="flex items-center gap-2 text-sm">
                                        <Users className="h-4 w-4 text-muted-foreground/50" />
                                        <span className="text-muted-foreground">{cls.studentCount || 0} học viên</span>
                                    </div>

                                    {/* Schedule */}
                                    <div className="flex items-start gap-2 text-sm">
                                        <Calendar className="h-4 w-4 text-muted-foreground/50 mt-0.5 shrink-0" />
                                        <div className="text-muted-foreground">
                                            <span>{formatSchedule(cls.schedule)}</span>
                                            <span className="block text-xs opacity-70 mt-0.5">
                                                {formatDate(cls.start_date)} - {formatDate(cls.end_date)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Sessions */}
                                    <div className="flex items-center gap-2 text-sm">
                                        <Clock className="h-4 w-4 text-muted-foreground/50" />
                                        <span className="text-muted-foreground">
                                            {cls.completedSessions || 0}/{cls.totalSessions || 0} buổi
                                        </span>
                                    </div>

                                    {operationalSignals.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {operationalSignals.map((signal) => {
                                                const SignalIcon = signal.icon;
                                                return (
                                                    <span
                                                        key={signal.key}
                                                        className={cn(
                                                            'inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium',
                                                            signal.className
                                                        )}
                                                    >
                                                        <SignalIcon className="h-3 w-3" />
                                                        {signal.label}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Progress */}
                                    <div>
                                        <div className="flex items-center justify-between text-xs mb-1.5">
                                            <span className="text-muted-foreground font-medium">Tiến độ</span>
                                            <span className="font-bold text-foreground">{progress}%</span>
                                        </div>
                                        <div className="h-2.5 bg-muted/60 rounded-full overflow-hidden border border-border/50">
                                            <div
                                                className={cn(
                                                    'h-full rounded-full transition-all duration-1000 ease-out shadow-sm',
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
