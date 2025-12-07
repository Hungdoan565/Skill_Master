import { cn } from '@/lib/utils';
import { Clock, MapPin, Users, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * Component hiển thị lịch dạy hôm nay
 */
export function TodaySchedule({ sessions = [], onMarkAttendance }) {
    if (sessions.length === 0) {
        return (
            <div className="rounded-xl border bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    📅 Lịch dạy hôm nay
                </h3>
                <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Không có buổi học nào hôm nay</p>
                    <p className="text-sm mt-1">Nghỉ ngơi và chuẩn bị cho ngày mai nhé!</p>
                </div>
            </div>
        );
    }

    const getStatusBadge = (status, attendanceCompleted) => {
        if (attendanceCompleted) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    <CheckCircle className="h-3 w-3" /> Đã điểm danh
                </span>
            );
        }

        const statusConfig = {
            scheduled: { label: 'Chưa bắt đầu', class: 'bg-gray-100 text-gray-700' },
            in_progress: { label: 'Đang diễn ra', class: 'bg-blue-100 text-blue-700' },
            completed: { label: 'Hoàn thành', class: 'bg-green-100 text-green-700' },
            cancelled: { label: 'Đã hủy', class: 'bg-red-100 text-red-700' }
        };

        const config = statusConfig[status] || statusConfig.scheduled;
        return (
            <span className={cn(
                'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                config.class
            )}>
                {config.label}
            </span>
        );
    };

    const formatTime = (time) => {
        if (!time) return '--:--';
        return time.slice(0, 5);
    };

    const isCurrentSession = (session) => {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        const [startHour, startMin] = (session.start_time || '00:00').split(':').map(Number);
        const [endHour, endMin] = (session.end_time || '23:59').split(':').map(Number);

        const startTime = startHour * 60 + startMin;
        const endTime = endHour * 60 + endMin;

        return currentTime >= startTime && currentTime <= endTime;
    };

    return (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                    📅 Lịch dạy hôm nay
                </h3>
                <span className="text-sm text-gray-500">
                    {sessions.length} buổi học
                </span>
            </div>

            <div className="space-y-3">
                {sessions.map((session) => {
                    const isCurrent = isCurrentSession(session);
                    const needsAttendance = !session.attendance_completed &&
                        (session.status === 'in_progress' || session.status === 'completed');

                    return (
                        <div
                            key={session.id}
                            className={cn(
                                'rounded-lg border p-4 transition-all',
                                isCurrent ? 'border-blue-300 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300',
                                session.status === 'cancelled' && 'opacity-60'
                            )}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    {/* Class name */}
                                    <h4 className="font-medium text-gray-900 truncate">
                                        {session.class_name || 'Lớp học'}
                                    </h4>

                                    {/* Course name */}
                                    <p className="text-sm text-gray-500 truncate">
                                        {session.course_name}
                                    </p>

                                    {/* Time & Room */}
                                    <div className="flex items-center gap-4 mt-2 text-sm">
                                        <span className="flex items-center gap-1 text-gray-600">
                                            <Clock className="h-4 w-4" />
                                            {formatTime(session.start_time)} - {formatTime(session.end_time)}
                                        </span>
                                        {session.room_name && (
                                            <span className="flex items-center gap-1 text-gray-600">
                                                <MapPin className="h-4 w-4" />
                                                {session.room_name}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1 text-gray-600">
                                            <Users className="h-4 w-4" />
                                            {session.student_count || 0} học viên
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                    {getStatusBadge(session.status, session.attendance_completed)}

                                    {needsAttendance && onMarkAttendance && (
                                        <button
                                            onClick={() => onMarkAttendance(session)}
                                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            <AlertCircle className="h-3 w-3" />
                                            Điểm danh
                                        </button>
                                    )}
                                </div>
                            </div>

                            {isCurrent && (
                                <div className="mt-3 pt-3 border-t border-blue-200">
                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                                        </span>
                                        Đang diễn ra
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default TodaySchedule;
