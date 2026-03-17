import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    Users,
    Calendar,
    ClipboardCheck,
    FileSpreadsheet,
    GraduationCap,
    Clock,
    MapPin,
    Award,
    UserCheck,
    CalendarCheck,
    Loader2,
    AlertCircle,
    RefreshCw,
    BookOpen,
    BarChart3,
    Search,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Timer,
    ChevronRight
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

const DAY_NAMES = { 0: 'CN', 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7' };

const formatSchedule = (schedule) => {
    if (!schedule) return 'Chưa có lịch';
    let arr = schedule;
    if (typeof schedule === 'string') {
        try { arr = JSON.parse(schedule); } catch { return schedule; }
    }
    if (!Array.isArray(arr) || arr.length === 0) return typeof schedule === 'string' ? schedule : 'Chưa có lịch';
    const groups = {};
    arr.forEach(s => {
        const key = `${s.start}-${s.end}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(DAY_NAMES[s.day] || `T${s.day}`);
    });
    return Object.entries(groups).map(([time, days]) => `${days.join(', ')} • ${time}`).join(' | ');
};

export function TeacherClassDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [classData, setClassData] = useState(null);
    const [classAverageGrade, setClassAverageGrade] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');


    const getAuthHeaders = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Chưa đăng nhập');
        return {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
        };
    }, []);

    const fetchClassDetail = useCallback(async () => {
        if (!id) return;
        try {
            setLoading(true);
            setError(null);
            const headers = await getAuthHeaders();

            const response = await fetch(`${API_URL}/api/teacher/classes/${id}`, { headers });
            if (!response.ok) throw new Error('Lỗi khi tải thông tin lớp');
            const result = await response.json();
            if (!result.success) throw new Error(result.message || 'Lỗi');

            setClassData(result.data || null);

            // Fetch grade summary separately (non-blocking for page render)
            try {
                const gradesSummaryRes = await fetch(`${API_URL}/api/teacher/classes/${id}/grades/summary`, { headers });
                if (!gradesSummaryRes.ok) {
                    setClassAverageGrade(null);
                } else {
                    const gradesSummary = await gradesSummaryRes.json();
                    if (gradesSummary?.success) {
                        const rawAverage = gradesSummary?.data?.classAverage;
                        const numericAverage = Number(rawAverage);
                        setClassAverageGrade(Number.isFinite(numericAverage) ? numericAverage.toFixed(2) : null);
                    } else {
                        setClassAverageGrade(null);
                    }
                }
            } catch {
                setClassAverageGrade(null);
            }
        } catch (err) {
            console.error('Class detail fetch error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [id, getAuthHeaders]);

    useEffect(() => {
        fetchClassDetail();
    }, [fetchClassDetail]);

    const formatDate = (dateStr) => {
        if (!dateStr) return '--';
        return new Date(dateStr).toLocaleDateString('vi-VN');
    };

    const getStatusBadge = (status) => {
        const configs = {
            active: { label: 'Đang học', className: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' },
            ongoing: { label: 'Đang học', className: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' },
            upcoming: { label: 'Sắp khai giảng', className: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' },
            completed: { label: 'Hoàn thành', className: 'bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400' },
            cancelled: { label: 'Đã hủy', className: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400' }
        };
        const config = configs[status] || configs.upcoming;
        return <span className={cn('px-2.5 py-1 text-xs font-medium rounded-full', config.className)}>{config.label}</span>;
    };

    const tabs = [
        { id: 'overview', label: 'Tổng quan', icon: BarChart3 },
        { id: 'students', label: 'Học viên', icon: Users },
        { id: 'sessions', label: 'Buổi học', icon: Calendar },
        { id: 'attendance', label: 'Điểm danh', icon: ClipboardCheck }
    ];

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto" />
                    <p className="mt-4 text-gray-500 dark:text-gray-400">Đang tải thông tin lớp...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center p-6 bg-red-50 dark:bg-red-500/10 rounded-xl max-w-md">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">Đã có lỗi xảy ra</h2>
                    <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
                    <Button onClick={fetchClassDetail} variant="outline" className="text-red-600">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Thử lại
                    </Button>
                </div>
            </div>
        );
    }

    if (!classData) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <BookOpen className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Không tìm thấy lớp học</h2>
                    <Button onClick={() => navigate('/teacher/classes')} variant="outline">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Quay lại danh sách
                    </Button>
                </div>
            </div>
        );
    }

    // Backend response shape: { ...classFields, students: [...], sessions: [...], totalStudents, totalSessions, completedSessions }
    // classData IS the whole response (not classData.class)
    const students = classData.students || [];
    const sessions = classData.sessions || [];
    const totalSessions = classData.totalSessions || sessions.length || 0;
    const completedSessions = classData.completedSessions || sessions.filter(s => s.status === 'completed').length || 0;
    const progressPercent = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" onClick={() => navigate('/teacher/classes')} className="shrink-0">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{classData.name}</h1>
                                {getStatusBadge(classData.status)}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                    <BookOpen className="h-4 w-4" />
                                    {classData.code}
                                </span>
                                <span className="flex items-center gap-1">
                                    <GraduationCap className="h-4 w-4" />
                                    {classData.courses?.title || 'Chưa có khóa học'}
                                </span>
                                {classData.schedule && (
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        {formatSchedule(classData.schedule)}
                                    </span>
                                )}
                                {classData.rooms?.name && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        {classData.rooms.name}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={() => navigate(`/teacher/classes/${id}/attendance`)} className="bg-orange-500 hover:bg-orange-600 text-white">
                            <ClipboardCheck className="h-4 w-4 mr-2" />
                            Điểm danh
                        </Button>
                        <Button variant="outline" onClick={() => navigate(`/teacher/classes/${id}/gradebook`)} className="border-orange-300 text-orange-600 hover:bg-orange-50 dark:border-orange-500/30 dark:hover:bg-orange-500/10">
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            Sổ điểm
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Users} label="Học viên" value={classData.totalStudents || students.length} color="blue" />
                <StatCard icon={UserCheck} label="Tỷ lệ đi học" value={`${classData.attendanceRate || 0}%`} color="green" />
                <StatCard icon={CalendarCheck} label="Buổi học" value={`${completedSessions}/${totalSessions}`} color="purple" />
                <StatCard icon={Award} label="Điểm TB" value={classAverageGrade ?? '--'} color="orange" />
            </div>

            {/* Tab Navigation */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-1 p-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                                    activeTab === tab.id
                                        ? 'bg-orange-500 text-white'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <div className="p-6">
                    {activeTab === 'overview' && (
                        <OverviewTab classData={classData} students={students} sessions={sessions} formatDate={formatDate} progressPercent={progressPercent} completedSessions={completedSessions} totalSessions={totalSessions} />
                    )}
                    {activeTab === 'students' && (
                        <StudentsTab students={students} />
                    )}
                    {activeTab === 'sessions' && (
                        <SessionsTab sessions={sessions} formatDate={formatDate} />
                    )}
                    {activeTab === 'attendance' && (
                        <AttendanceTab classId={id} sessions={sessions} navigate={navigate} formatDate={formatDate} />
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color }) {
    const colorClasses = {
        blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
        green: 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400',
        purple: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400',
        orange: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400'
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center gap-4">
                <div className={cn('p-3 rounded-xl', colorClasses[color])}>
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
                </div>
            </div>
        </div>
    );
}

function OverviewTab({ classData, students, sessions, formatDate, progressPercent, completedSessions, totalSessions }) {
    const recentSessions = [...sessions]
        .sort((a, b) => new Date(b.session_date) - new Date(a.session_date))
        .slice(0, 5);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Class Info */}
            <div className="space-y-6">
                <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Thông tin lớp học</h3>
                    <div className="space-y-3 text-sm">
                        <InfoRow label="Khóa học" value={classData.courses?.title || '--'} />
                        <InfoRow label="Ngày bắt đầu" value={formatDate(classData.start_date)} />
                        <InfoRow label="Ngày kết thúc" value={formatDate(classData.end_date)} />
                        {classData.schedule && (
                            <InfoRow label="Lịch học" value={formatSchedule(classData.schedule)} />
                        )}
                        <InfoRow label="Số buổi đã học" value={`${completedSessions}/${totalSessions}`} />
                        <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                            <span className="text-gray-500 dark:text-gray-400">Tiến độ</span>
                            <div className="flex items-center gap-3">
                                <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-orange-500 rounded-full transition-all duration-500"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                                <span className="font-medium text-gray-900 dark:text-white text-xs">{progressPercent}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {students.length > 0 && (
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Học viên ({students.length})</h3>
                        <div className="flex flex-wrap gap-1.5">
                            {students.slice(0, 10).map((s, idx) => {
                                const name = s.full_name || 'U';
                                const initial = name.split(' ').map(n => n[0]).slice(-1).join('').toUpperCase();
                                return (
                                    <div key={s.id || idx} className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-medium" title={name}>
                                        {s.avatar_url ? (
                                            <img src={s.avatar_url} alt={name} className="w-9 h-9 rounded-full object-cover" />
                                        ) : initial}
                                    </div>
                                );
                            })}
                            {students.length > 10 && (
                                <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 text-xs font-medium">+{students.length - 10}</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Right: Recent Sessions */}
            <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Buổi học gần đây</h3>
                {recentSessions.length > 0 ? (
                    <div className="space-y-2">
                        {recentSessions.map((session, idx) => (
                            <div key={session.id || idx} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                                <SessionDot status={session.status} />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                                        Buổi {session.session_number || (idx + 1)}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {formatDate(session.session_date)}
                                        {session.start_time && ` • ${session.start_time.slice(0, 5)}`}
                                    </p>
                                </div>
                                <SessionStatusBadge status={session.status} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-400">
                        <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Chưa có buổi học nào</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function InfoRow({ label, value }) {
    return (
        <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-gray-500 dark:text-gray-400">{label}</span>
            <span className="font-medium text-gray-900 dark:text-white">{value}</span>
        </div>
    );
}

function SessionDot({ status }) {
    const colors = {
        completed: 'bg-green-500',
        ongoing: 'bg-blue-500 animate-pulse',
        scheduled: 'bg-gray-400',
        pending: 'bg-amber-500',
        cancelled: 'bg-red-500'
    };
    return <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', colors[status] || colors.scheduled)} />;
}

function StudentsTab({ students }) {
    const [search, setSearch] = useState('');

    const filteredStudents = students.filter(s => {
        const name = (s.full_name || '').toLowerCase();
        const email = (s.email || '').toLowerCase();
        return name.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
    });

    if (students.length === 0) {
        return (
            <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Chưa có học viên trong lớp</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm kiếm học viên..."
                    className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Học viên</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Email</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Điện thoại</th>
                            <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Chuyên cần</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.map((student, idx) => {
                            const name = student.full_name || 'Học viên';
                            const initial = name.split(' ').map(n => n[0]).slice(-1).join('').toUpperCase();
                            // Backend provides attendance_rate per student
                            const attendanceRate = student.attendance_rate ?? null;

                            return (
                                <tr key={student.id || idx} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-medium text-sm shrink-0">
                                                {student.avatar_url ? (
                                                    <img src={student.avatar_url} alt={name} className="w-9 h-9 rounded-full object-cover" />
                                                ) : initial}
                                            </div>
                                            <span className="font-medium text-gray-900 dark:text-white">{name}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{student.email || '--'}</td>
                                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{student.phone || '--'}</td>
                                    <td className="py-3 px-4">
                                        {attendanceRate !== null ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={cn(
                                                            'h-full rounded-full transition-all',
                                                            attendanceRate >= 80 ? 'bg-green-500' :
                                                                attendanceRate >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                                        )}
                                                        style={{ width: `${Math.min(attendanceRate, 100)}%` }}
                                                    />
                                                </div>
                                                <span className={cn(
                                                    'text-xs font-medium',
                                                    attendanceRate >= 80 ? 'text-green-600 dark:text-green-400' :
                                                        attendanceRate >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
                                                )}>
                                                    {attendanceRate}%
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400 text-center block">--</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {filteredStudents.length === 0 && search && (
                <div className="text-center py-6 text-gray-400 text-sm">Không tìm thấy học viên nào phù hợp</div>
            )}
        </div>
    );
}

function SessionsTab({ sessions, formatDate }) {
    if (sessions.length === 0) {
        return (
            <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Chưa có buổi học nào được tạo</p>
            </div>
        );
    }

    const completed = sessions.filter(s => s.status === 'completed');
    const upcoming = sessions.filter(s => s.status !== 'completed' && s.status !== 'cancelled');
    const cancelled = sessions.filter(s => s.status === 'cancelled');

    const renderSessionGroup = (title, icon, items, emptyText) => {
        const Icon = icon;
        return (
            <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {title} ({items.length})
                </h4>
                {items.length > 0 ? (
                    <div className="space-y-1.5">
                        {items.map((session, idx) => (
                            <div key={session.id || idx} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                                <SessionDot status={session.status} />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-gray-900 dark:text-white">
                                        Buổi {session.session_number || (idx + 1)}
                                    </p>
                                </div>
                                <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                                    {formatDate(session.session_date)}
                                </span>
                                <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                                    {session.start_time?.slice(0, 5) || '--'}
                                </span>
                                <SessionStatusBadge status={session.status} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-gray-400 italic pl-6">{emptyText}</p>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {renderSessionGroup('Sắp tới', Timer, upcoming, 'Không có buổi sắp tới')}
            {renderSessionGroup('Đã hoàn thành', CheckCircle2, completed, 'Chưa có buổi hoàn thành')}
            {cancelled.length > 0 && renderSessionGroup('Đã hủy', XCircle, cancelled, '')}
        </div>
    );
}

function AttendanceTab({ classId, sessions, navigate, formatDate }) {
    const completedSessions = sessions.filter(s => s.status === 'completed');
    const upcomingSessions = sessions.filter(s => s.status !== 'completed' && s.status !== 'cancelled');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-500/10 rounded-xl border border-orange-200 dark:border-orange-500/20">
                <div>
                    <h3 className="font-semibold text-orange-700 dark:text-orange-400">Điểm danh nhanh</h3>
                    <p className="text-sm text-orange-600 dark:text-orange-300">Truy cập trang điểm danh đầy đủ để quản lý</p>
                </div>
                <Button onClick={() => navigate(`/teacher/classes/${classId}/attendance`)} className="bg-orange-500 hover:bg-orange-600 text-white shrink-0">
                    <ClipboardCheck className="h-4 w-4 mr-2" />
                    Mở trang điểm danh
                    <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
            </div>

            {upcomingSessions.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        Cần điểm danh ({upcomingSessions.length})
                    </h4>
                    <div className="space-y-2">
                        {upcomingSessions.slice(0, 5).map((session, idx) => (
                            <div key={session.id || idx} className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-500/5 rounded-xl border border-amber-200 dark:border-amber-500/20">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-gray-900 dark:text-white">
                                        Buổi {session.session_number || (idx + 1)}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {formatDate(session.session_date)}
                                        {session.start_time && ` • ${session.start_time.slice(0, 5)}`}
                                    </p>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => navigate(`/teacher/classes/${classId}/attendance`)} className="text-amber-600 border-amber-300 hover:bg-amber-100 dark:border-amber-500/30 dark:hover:bg-amber-500/10 shrink-0">
                                    Điểm danh
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {completedSessions.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Đã điểm danh ({completedSessions.length})
                    </h4>
                    <div className="space-y-1.5">
                        {completedSessions.slice(0, 5).map((session, idx) => (
                            <div key={session.id || idx} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                                <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
                                <p className="font-medium text-sm text-gray-900 dark:text-white flex-1">
                                    Buổi {session.session_number || (idx + 1)}
                                </p>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatDate(session.session_date)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {sessions.length === 0 && (
                <div className="text-center py-8">
                    <ClipboardCheck className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Chưa có buổi học nào để điểm danh</p>
                </div>
            )}
        </div>
    );
}

function SessionStatusBadge({ status }) {
    const configs = {
        completed: { label: 'Hoàn thành', className: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' },
        ongoing: { label: 'Đang diễn ra', className: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' },
        scheduled: { label: 'Đã lên lịch', className: 'bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400' },
        cancelled: { label: 'Đã hủy', className: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400' },
        pending: { label: 'Chờ điểm danh', className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' }
    };
    const config = configs[status] || configs.scheduled;
    return <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full shrink-0', config.className)}>{config.label}</span>;
}

export default TeacherClassDetailPage;
