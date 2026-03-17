import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
    ChevronLeft,
    ChevronRight,
    Clock,
    MapPin,
    CheckCircle,
    XCircle,
    AlertCircle,
    RefreshCw,
    CalendarDays,
    Sun,
    Moon,
    Sunrise,
    AlertTriangle,
    Repeat,
    Wallet,
    Shield,
    CalendarX
} from 'lucide-react';
import { useTeacherSchedule } from '../hooks/useTeacherSchedule';
import { TeacherPageHeader } from '@/components/ui/teacher-page-header';

// Time slots configuration (Sáng/Chiều/Tối)
const TIME_SLOTS = [
    {
        key: 'morning',
        label: 'Sáng',
        Icon: Sunrise,
        startHour: 6,
        endHour: 12,
        bgClass: 'bg-amber-500/5',
        headerClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
        borderClass: 'border-amber-500/20'
    },
    {
        key: 'afternoon',
        label: 'Chiều',
        Icon: Sun,
        startHour: 12,
        endHour: 18,
        bgClass: 'bg-orange-500/5',
        headerClass: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
        borderClass: 'border-orange-500/20'
    },
    {
        key: 'evening',
        label: 'Tối',
        Icon: Moon,
        startHour: 18,
        endHour: 23,
        bgClass: 'bg-indigo-500/5',
        headerClass: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20',
        borderClass: 'border-indigo-500/20'
    }
];

// Get time slot for a session
const getTimeSlot = (timeStr) => {
    if (!timeStr) return 'morning';
    const hour = parseInt(timeStr.split(':')[0], 10);
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
};

const formatDateOnlyLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Teacher Schedule Page - Trang lịch dạy của giáo viên
 */
export function TeacherSchedulePage() {
    const [currentWeekStart, setCurrentWeekStart] = useState(() => {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const monday = new Date(now);
        monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        monday.setHours(0, 0, 0, 0);
        return monday;
    });

    const weekEnd = useMemo(() => {
        const end = new Date(currentWeekStart);
        end.setDate(currentWeekStart.getDate() + 6);
        return end;
    }, [currentWeekStart]);

    const startDateStr = formatDateOnlyLocal(currentWeekStart);
    const endDateStr = formatDateOnlyLocal(weekEnd);

    const { schedule, stats, loading, error, refetch } = useTeacherSchedule(startDateStr, endDateStr);

    // Navigation
    const goToPrevWeek = () => {
        const newStart = new Date(currentWeekStart);
        newStart.setDate(newStart.getDate() - 7);
        setCurrentWeekStart(newStart);
    };

    const goToNextWeek = () => {
        const newStart = new Date(currentWeekStart);
        newStart.setDate(newStart.getDate() + 7);
        setCurrentWeekStart(newStart);
    };

    const goToThisWeek = () => {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const monday = new Date(now);
        monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        monday.setHours(0, 0, 0, 0);
        setCurrentWeekStart(monday);
    };

    // Helpers
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    };

    const formatWeekRange = () => {
        const start = currentWeekStart.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
        const end = weekEnd.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        return `${start} - ${end}`;
    };

    const getDayName = (dayOfWeek) => {
        const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        return days[dayOfWeek];
    };

    const getFullDayName = (dayOfWeek) => {
        const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        return days[dayOfWeek];
    };

    const isToday = (dateStr) => {
        const today = formatDateOnlyLocal(new Date());
        return dateStr === today;
    };

    const isPast = (dateStr) => {
        const today = formatDateOnlyLocal(new Date());
        return dateStr < today;
    };

    const formatTime = (time) => {
        if (!time) return '--:--';
        return time.slice(0, 5);
    };

    const getStatusConfig = (status) => {
        const configs = {
            completed: {
                label: 'Hoàn thành',
                icon: CheckCircle,
                class: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/20'
            },
            scheduled: {
                label: 'Đã lên lịch',
                icon: Clock,
                class: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/20'
            },
            in_progress: {
                label: 'Đang diễn ra',
                icon: AlertCircle,
                class: 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/20'
            },
            cancelled: {
                label: 'Đã hủy',
                icon: XCircle,
                class: 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/20'
            }
        };
        return configs[status] || configs.scheduled;
    };

    const getOperationalBadges = (session) => {
        const meta = session.operationalMeta || {};
        const badges = [];

        if (meta.isSubstituted) {
            badges.push({
                key: 'substituted',
                icon: Repeat,
                label: 'Dạy thay',
                className: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20'
            });
        }

        if (meta.hasAnyConflict) {
            badges.push({
                key: 'conflict',
                icon: AlertTriangle,
                label: meta.hasTeacherConflict && meta.hasRoomConflict
                    ? 'Trùng GV + phòng'
                    : meta.hasTeacherConflict
                        ? 'Trùng GV'
                        : 'Trùng phòng',
                className: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
            });
        }

        if (meta.isHoliday) {
            badges.push({
                key: 'holiday',
                icon: CalendarX,
                label: meta.holidayName || 'Ngày lễ',
                className: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
            });
        }

        if (meta.exceptionType) {
            badges.push({
                key: `exception-${meta.exceptionType}`,
                icon: CalendarDays,
                label: meta.exceptionType === 'makeup'
                    ? 'Buổi bù'
                    : meta.exceptionType === 'reschedule'
                        ? 'Đổi lịch'
                        : 'Ngoại lệ',
                className: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20'
            });
        }

        if (meta.payroll?.isLocked) {
            badges.push({
                key: 'payroll-locked',
                icon: Shield,
                label: 'Đã khóa lương',
                className: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20'
            });
        } else if (meta.payroll?.isEligibleForPayroll) {
            badges.push({
                key: 'payroll-eligible',
                icon: Wallet,
                label: 'Có thể tính lương',
                className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
            });
        }

        return badges;
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Đang tải lịch dạy...</p>
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
                title="Lịch dạy"
                subtitle="Xem và theo dõi các buổi dạy của bạn"
                icon={CalendarDays}
                iconColorClass="text-blue-600 bg-blue-50"
                actions={
                    <div className="flex items-center gap-1 sm:gap-2 bg-white p-1 rounded-xl border shadow-sm">
                        <button
                            onClick={goToPrevWeek}
                            className="p-2 sm:px-3 sm:py-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground btn-tactile"
                            title="Tuần trước"
                        >
                            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>

                        <button
                            onClick={goToThisWeek}
                            className="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors btn-tactile whitespace-nowrap"
                        >
                            Tuần này
                        </button>

                        <div className="px-2 sm:px-3 py-1.5 bg-muted/50 rounded-lg text-xs sm:text-sm font-medium text-foreground min-w-[140px] sm:min-w-[170px] text-center border border-border/50">
                            {formatWeekRange()}
                        </div>

                        <button
                            onClick={goToNextWeek}
                            className="p-2 sm:px-3 sm:py-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground btn-tactile"
                            title="Tuần sau"
                        >
                            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>

                        <div className="w-px h-6 bg-border mx-1"></div>

                        <button
                            onClick={refetch}
                            className="p-2 sm:px-3 sm:py-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground btn-tactile"
                            title="Làm mới"
                        >
                            <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                    </div>
                }
            />

            {/* Stats Summary */}
            {stats && (
                <div className="mb-6 animate-fade-in-up stagger-1">
                    <div className="mb-2 text-xs text-muted-foreground">
                        Phạm vi thống kê: tuần đang chọn ({stats.range?.startDate || startDateStr} đến {stats.range?.endDate || endDateStr})
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        <div className="bg-white rounded-2xl border border-border p-4 text-center hover-card-lift">
                            <p className="text-2xl font-bold text-blue-600">{stats.totalSessions}</p>
                            <p className="text-xs text-muted-foreground">Tổng buổi dạy</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-border p-4 text-center hover-card-lift">
                            <p className="text-2xl font-bold text-green-600">{stats.completedSessions}</p>
                            <p className="text-xs text-muted-foreground">Đã hoàn thành</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-border p-4 text-center hover-card-lift">
                            <p className="text-2xl font-bold text-purple-600">{stats.totalHours}h</p>
                            <p className="text-xs text-muted-foreground">Tổng số giờ</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-border p-4 text-center hover-card-lift">
                            <p className="text-2xl font-bold text-rose-600">{stats.conflictSessions || 0}</p>
                            <p className="text-xs text-muted-foreground">Buổi có xung đột</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-border p-4 text-center hover-card-lift">
                            <p className="text-2xl font-bold text-indigo-600">{stats.substitutedSessions || 0}</p>
                            <p className="text-xs text-muted-foreground">Buổi dạy thay</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-border p-4 text-center hover-card-lift">
                            <p className="text-2xl font-bold text-amber-600">{stats.holidaySessions || 0}</p>
                            <p className="text-xs text-muted-foreground">Buổi vào ngày lễ</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Schedule Grid - with Sáng/Chiều/Tối grouping */}
            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden animate-fade-in-up stagger-2">
                {/* Days Header */}
                <div className="grid grid-cols-8 border-b border-border bg-slate-50">
                    {/* Empty cell for time slot labels */}
                    <div className="p-3 text-center border-r border-border bg-muted">
                        <p className="text-xs font-medium text-muted-foreground">Buổi</p>
                    </div>
                    {schedule.map((day) => (
                        <div
                            key={day.date}
                            className={cn(
                                'p-3 text-center border-r border-border last:border-r-0',
                                isToday(day.date) && 'bg-blue-500/10'
                            )}
                        >
                            <p className={cn(
                                'text-xs font-medium',
                                isToday(day.date) ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'
                            )}>
                                {getFullDayName(day.dayOfWeek)}
                            </p>
                            <p className={cn(
                                'text-lg font-bold mt-1',
                                isToday(day.date) ? 'text-blue-600 dark:text-blue-400' : 'text-foreground'
                            )}>
                                {formatDate(day.date)}
                            </p>
                            {isToday(day.date) && (
                                <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-blue-600 text-white rounded-full">
                                    Hôm nay
                                </span>
                            )}
                        </div>
                    ))}
                </div>

                {/* Schedule Content - grouped by time slots */}
                {TIME_SLOTS.map((slot) => (
                    <div key={slot.key} className={cn('border-b border-border', slot.borderClass)}>
                        <div className="grid grid-cols-8 min-h-[120px]">
                            {/* Time slot label */}
                            <div className={cn(
                                'p-3 border-r border-border flex flex-col items-center justify-center',
                                slot.headerClass
                            )}>
                                <span className="text-xl mb-1"><slot.Icon className="h-5 w-5" /></span>
                                <span className="text-xs font-semibold">{slot.label}</span>
                                <span className="text-[10px] opacity-75 mt-0.5">
                                    {slot.startHour}:00 - {slot.endHour}:00
                                </span>
                            </div>

                            {/* Day cells for this slot */}
                            {schedule.map((day) => {
                                // Filter sessions for this time slot
                                const slotSessions = day.sessions.filter(s => getTimeSlot(s.start_time) === slot.key);

                                return (
                                    <div
                                        key={`${day.date}-${slot.key}`}
                                        className={cn(
                                            'border-r border-border last:border-r-0 p-2',
                                            slot.bgClass,
                                            isToday(day.date) && 'ring-1 ring-inset ring-blue-500/30',
                                            isPast(day.date) && !isToday(day.date) && 'opacity-75'
                                        )}
                                    >
                                        {slotSessions.length === 0 ? (
                                            <div className="h-full flex items-center justify-center text-muted-foreground/50 text-[10px]">
                                                <span>—</span>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {slotSessions.map((session) => {
                                                    const statusConfig = getStatusConfig(session.status);
                                                    const StatusIcon = statusConfig.icon;

                                                    return (
                                                        <div
                                                            key={session.id}
                                                            className={cn(
                                                                'rounded-lg border p-2 cursor-pointer transition-all hover-card-lift',
                                                                statusConfig.class,
                                                                session.operationalMeta?.hasAnyConflict && 'ring-1 ring-inset ring-rose-500/40'
                                                            )}
                                                        >
                                                            {/* Time */}
                                                            <div className="flex items-center gap-1 text-xs font-medium mb-1">
                                                                <Clock className="h-3 w-3" />
                                                                {formatTime(session.start_time)} - {formatTime(session.end_time)}
                                                            </div>

                                                            {/* Class name */}
                                                            <h4 className="font-semibold text-sm truncate" title={session.class_name}>
                                                                {session.class_name || session.class_code}
                                                            </h4>

                                                            {/* Course */}
                                                            <p className="text-xs truncate opacity-80 mt-0.5" title={session.course_name}>
                                                                {session.course_name}
                                                            </p>

                                                            {/* Room */}
                                                            {session.room_name && (
                                                                <div className="flex items-center gap-1 text-xs mt-1 opacity-80">
                                                                    <MapPin className="h-3 w-3" />
                                                                    {session.room_name}
                                                                </div>
                                                            )}

                                                            {/* Status */}
                                                            <div className="flex items-center gap-1 text-xs mt-1">
                                                                <StatusIcon className="h-3 w-3" />
                                                                {statusConfig.label}
                                                            </div>

                                                            {/* Operational badges */}
                                                            {getOperationalBadges(session).length > 0 && (
                                                                <div className="flex flex-wrap gap-1 mt-1.5">
                                                                    {getOperationalBadges(session).map((badge) => {
                                                                        const Icon = badge.icon;
                                                                        return (
                                                                            <span
                                                                                key={badge.key}
                                                                                className={cn(
                                                                                    'inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded-full border',
                                                                                    badge.className
                                                                                )}
                                                                            >
                                                                                <Icon className="h-2.5 w-2.5" />
                                                                                {badge.label}
                                                                            </span>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-green-500/20 border border-green-500/20"></span>
                    Hoàn thành
                </span>
                <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-blue-500/20 border border-blue-500/20"></span>
                    Đã lên lịch
                </span>
                <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-amber-500/20 border border-amber-500/20"></span>
                    Đang diễn ra
                </span>
                <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-red-500/20 border border-red-500/20"></span>
                    Đã hủy
                </span>
            </div>
        </div>
    );
}

export default TeacherSchedulePage;
