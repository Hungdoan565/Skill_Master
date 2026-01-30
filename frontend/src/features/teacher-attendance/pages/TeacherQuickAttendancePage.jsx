/**
 * TeacherQuickAttendancePage Component
 * Trang điểm danh nhanh cho giáo viên
 * Route: /teacher/attendance
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import {
    RefreshCw,
    Users,
    MapPin,
    Clock,
    AlertTriangle,
    CheckCircle,
    Calendar,
    Loader2,
    AlertCircle,
    ChevronRight
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

const STATUS_CONFIG = {
    completed: { label: 'Đã điểm danh', className: 'bg-green-100 text-green-700 border-green-200' },
    pending: { label: 'Chưa điểm danh', className: 'bg-amber-100 text-amber-700 border-amber-200' },
    upcoming: { label: 'Sắp tới', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    locked: { label: 'Đã khóa', className: 'bg-gray-100 text-gray-500 border-gray-200' }
};

function StatusBadge({ status }) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.upcoming;
    return (
        <span className={cn(
            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
            config.className
        )}>
            {config.label}
        </span>
    );
}

function SessionCard({ session, onNavigate }) {
    const formatTime = (time) => time?.slice(0, 5) || '--:--';

    return (
        <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-2 mb-3">
                <span className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-medium">
                    {formatTime(session.start_time)} - {formatTime(session.end_time)}
                </span>
                <StatusBadge status={session.attendanceStatus} />
            </div>

            <h3 className="font-semibold text-gray-900 truncate mb-1">
                {session.class_name || 'Lớp học'}
            </h3>
            <p className="text-sm text-gray-500 truncate mb-3">
                Buổi {session.session_number || '?'} • {session.course_name || 'Khóa học'}
            </p>

            <div className="flex items-center gap-4 text-xs text-gray-600 mb-4">
                <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {session.student_count || 0}
                </span>
                {session.room_name && (
                    <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {session.room_name}
                    </span>
                )}
            </div>

            <Button
                size="sm"
                className="w-full"
                variant={session.attendanceStatus === 'completed' ? 'outline' : 'default'}
                onClick={() => onNavigate(session)}
            >
                {session.attendanceStatus === 'completed' ? 'Xem điểm danh' : 'Điểm danh'}
            </Button>
        </div>
    );
}

function PendingAlert({ sessions, onNavigate }) {
    if (!sessions.length) return null;

    return (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                    <h3 className="font-semibold text-amber-800">
                        Cần điểm danh ({sessions.length} buổi)
                    </h3>
                    <p className="text-sm text-amber-700 mt-1">
                        Các buổi học đã qua nhưng chưa được điểm danh
                    </p>
                    <div className="mt-3 space-y-2">
                        {sessions.slice(0, 3).map((session) => (
                            <div
                                key={session.id}
                                className="flex items-center justify-between bg-white rounded-lg p-2 border border-amber-100"
                            >
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {session.class_name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {formatDate(session.session_date)} • Buổi {session.session_number}
                                    </p>
                                </div>
                                <Button size="sm" variant="ghost" onClick={() => onNavigate(session)}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        {sessions.length > 3 && (
                            <p className="text-xs text-amber-600 text-center">
                                và {sessions.length - 3} buổi khác...
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

function formatFullDate(date) {
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return `${days[date.getDay()]}, ${date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
}

export function TeacherQuickAttendancePage() {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSchedule = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Chưa đăng nhập');

            const today = new Date();
            const startDate = new Date(today);
            startDate.setDate(startDate.getDate() - 7);
            const endDate = new Date(today);
            endDate.setDate(endDate.getDate() + 7);

            const params = new URLSearchParams({
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0]
            });

            const response = await fetch(`${API_URL}/api/teacher/schedule?${params}`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Lỗi khi tải lịch dạy');

            const result = await response.json();
            setSessions(result.data?.schedule || []);
        } catch (err) {
            console.error('Schedule fetch error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSchedule();
    }, [fetchSchedule]);

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const categorizedSessions = useMemo(() => {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        return sessions.map(session => {
            const sessionDate = session.session_date;
            const isToday = sessionDate === todayStr;
            const isPast = sessionDate < todayStr;
            const isFuture = sessionDate > todayStr;

            let attendanceStatus = 'upcoming';

            if (session.attendance_completed) {
                attendanceStatus = 'completed';
            } else if (isPast) {
                attendanceStatus = session.is_locked ? 'locked' : 'pending';
            } else if (isToday) {
                const [endHour, endMin] = (session.end_time || '23:59').split(':').map(Number);
                const endTime = endHour * 60 + endMin;
                if (currentTime > endTime) {
                    attendanceStatus = session.is_locked ? 'locked' : 'pending';
                }
            }

            return { ...session, attendanceStatus };
        });
    }, [sessions, todayStr]);

    const todaySessions = useMemo(() => {
        return categorizedSessions.filter(s => s.session_date === todayStr);
    }, [categorizedSessions, todayStr]);

    const pendingSessions = useMemo(() => {
        return categorizedSessions.filter(s => s.attendanceStatus === 'pending');
    }, [categorizedSessions]);

    const upcomingSessions = useMemo(() => {
        return categorizedSessions
            .filter(s => s.session_date > todayStr)
            .sort((a, b) => a.session_date.localeCompare(b.session_date) ||
                           (a.start_time || '').localeCompare(b.start_time || ''));
    }, [categorizedSessions, todayStr]);

    const handleNavigate = (session) => {
        navigate(`/teacher/classes/${session.class_id}/attendance?session=${session.id}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                    <p className="text-gray-600">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl border border-red-200 p-6 max-w-md text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-2">Đã xảy ra lỗi</h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <Button onClick={fetchSchedule}>Thử lại</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Điểm danh nhanh</h1>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Quản lý điểm danh các buổi học
                            </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={fetchSchedule}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Làm mới
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* Pending Alert */}
                <PendingAlert sessions={pendingSessions} onNavigate={handleNavigate} />

                {/* Today's Sessions */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <h2 className="text-lg font-semibold text-gray-900">
                            Hôm nay - {formatFullDate(today)}
                        </h2>
                    </div>

                    {todaySessions.length === 0 ? (
                        <div className="bg-white rounded-xl border p-8 text-center">
                            <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-600">Hôm nay bạn không có buổi dạy nào</p>
                            <p className="text-sm text-gray-400 mt-1">
                                Nghỉ ngơi và chuẩn bị cho các buổi học sắp tới
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {todaySessions.map(session => (
                                <SessionCard
                                    key={session.id}
                                    session={session}
                                    onNavigate={handleNavigate}
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* Upcoming Sessions */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <ChevronRight className="h-5 w-5 text-green-600" />
                        <h2 className="text-lg font-semibold text-gray-900">
                            Buổi học sắp tới (7 ngày)
                        </h2>
                    </div>

                    {upcomingSessions.length === 0 ? (
                        <div className="bg-white rounded-xl border p-8 text-center">
                            <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-600">Không có buổi học sắp tới</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border divide-y">
                            {upcomingSessions.map(session => (
                                <div
                                    key={session.id}
                                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="text-center min-w-[60px]">
                                            <p className="text-xs text-gray-500">
                                                {new Date(session.session_date).toLocaleDateString('vi-VN', { weekday: 'short' })}
                                            </p>
                                            <p className="text-lg font-bold text-gray-900">
                                                {new Date(session.session_date).getDate()}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Th{new Date(session.session_date).getMonth() + 1}
                                            </p>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-gray-900 truncate">
                                                {session.class_name}
                                            </p>
                                            <p className="text-sm text-gray-500 truncate">
                                                Buổi {session.session_number} • {session.course_name}
                                            </p>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {session.start_time?.slice(0, 5)} - {session.end_time?.slice(0, 5)}
                                                </span>
                                                {session.room_name && (
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="h-3 w-3" />
                                                        {session.room_name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <StatusBadge status="upcoming" />
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

export default TeacherQuickAttendancePage;

