/**
 * TodayScheduleCard Component
 * Hiển thị lịch dạy hôm nay
 */

import { Calendar, Clock, ChevronRight, User, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const STATUS_CONFIG = {
    scheduled: { label: 'Sắp diễn ra', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
    completed: { label: 'Hoàn thành', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
    cancelled: { label: 'Đã hủy', color: 'bg-muted text-muted-foreground' }
};

function SessionItem({ session }) {
    const statusConfig = STATUS_CONFIG[session.status] || STATUS_CONFIG.scheduled;

    return (
        <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
            {/* Time */}
            <div className="flex-shrink-0 text-center">
                <div className="w-14 h-14 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex flex-col items-center justify-center">
                    <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                        {session.time?.split(' - ')[0] || '--:--'}
                    </span>
                    <span className="text-[10px] text-orange-400 dark:text-orange-500">đến</span>
                    <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                        {session.time?.split(' - ')[1] || '--:--'}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground truncate">
                    {session.className || session.classCode}
                </h4>
                <p className="text-sm text-muted-foreground truncate">{session.courseName}</p>

                <div className="flex items-center gap-4 mt-1.5">
                    {session.teacherName && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <User size={12} />
                            <span className="truncate">{session.teacherName}</span>
                        </div>
                    )}
                    {session.roomName && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin size={12} />
                            <span>{session.roomName}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Status */}
            <div className={`flex-shrink-0 px-2 py-1 rounded-lg text-xs font-medium ${statusConfig.color}`}>
                {statusConfig.label}
            </div>
        </div>
    );
}

export function TodayScheduleCard({ data, loading = false }) {
    const navigate = useNavigate();

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-border p-6">
                <div className="animate-pulse">
                    <div className="h-5 w-40 bg-muted rounded mb-4" />
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex gap-3">
                                <div className="w-14 h-14 bg-muted rounded-xl" />
                                <div className="flex-1">
                                    <div className="h-4 w-32 bg-muted rounded mb-1" />
                                    <div className="h-3 w-24 bg-muted rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const sessions = data?.sessions || [];
    const summary = data?.summary || {};

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-border p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
                        <Calendar size={20} className="text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground">Lịch hôm nay</h3>
                        <p className="text-xs text-muted-foreground">
                            {summary.total || 0} buổi học • {summary.completed || 0} hoàn thành
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/admin/schedule')}
                    className="flex items-center gap-1 text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium"
                >
                    Xem lịch
                    <ChevronRight size={16} />
                </button>
            </div>

            {/* Sessions List */}
            <div className="space-y-1">
                {sessions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                            <Calendar size={28} className="text-orange-300 dark:text-orange-500" />
                        </div>
                        <p className="font-medium text-muted-foreground">Không có buổi học hôm nay</p>
                        <p className="text-sm mt-1">Nghỉ ngơi hoặc chuẩn bị cho ngày mai! 🎉</p>
                    </div>
                ) : (
                    sessions.map((session, index) => (
                        <SessionItem key={session.id || index} session={session} />
                    ))
                )}
            </div>

            {/* Summary Bar */}
            {sessions.length > 0 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <div className="flex gap-4 text-sm">
                        <span className="text-muted-foreground">
                            <span className="font-medium text-blue-600 dark:text-blue-400">{summary.scheduled || 0}</span> sắp diễn ra
                        </span>
                        <span className="text-muted-foreground">
                            <span className="font-medium text-emerald-600 dark:text-emerald-400">{summary.completed || 0}</span> hoàn thành
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TodayScheduleCard;
