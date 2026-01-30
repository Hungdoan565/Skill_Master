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
    BarChart3
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

export function TeacherClassDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [classData, setClassData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    const fetchClassDetail = useCallback(async () => {
        if (!id) return;

        try {
            setLoading(true);
            setError(null);

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error('Chưa đăng nhập');
            }

            const response = await fetch(`${API_URL}/api/teacher/classes/${id}`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Lỗi khi tải thông tin lớp');

            const result = await response.json();
            setClassData(result.data || null);

        } catch (err) {
            console.error('Class detail fetch error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchClassDetail();
    }, [fetchClassDetail]);

    const formatDate = (dateStr) => {
        if (!dateStr) return '--';
        return new Date(dateStr).toLocaleDateString('vi-VN');
    };

    const getStatusBadge = (status) => {
        const configs = {
            active: { label: 'Đang học', className: 'bg-green-100 text-green-700' },
            ongoing: { label: 'Đang học', className: 'bg-green-100 text-green-700' },
            upcoming: { label: 'Sắp khai giảng', className: 'bg-blue-100 text-blue-700' },
            completed: { label: 'Hoàn thành', className: 'bg-gray-100 text-gray-700' },
            cancelled: { label: 'Đã hủy', className: 'bg-red-100 text-red-700' }
        };
        const config = configs[status] || configs.upcoming;
        return <span className={cn('px-2 py-1 text-xs font-medium rounded-full', config.className)}>{config.label}</span>;
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
                    <p className="mt-4 text-gray-600">Đang tải thông tin lớp...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center p-6 bg-red-50 rounded-xl max-w-md">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-red-700 mb-2">Đã có lỗi xảy ra</h2>
                    <p className="text-red-600 mb-4">{error}</p>
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
                    <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-gray-700 mb-2">Không tìm thấy lớp học</h2>
                    <Button onClick={() => navigate('/teacher/classes')} variant="outline">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Quay lại danh sách
                    </Button>
                </div>
            </div>
        );
    }

    const classInfo = classData.class || classData;
    const students = classData.students || [];
    const sessions = classData.sessions || [];

    const stats = {
        studentCount: classInfo.student_count || students.length || 0,
        attendanceRate: classInfo.attendance_rate || 0,
        sessionCount: classInfo.total_sessions || sessions.length || 0,
        avgGrade: classInfo.avg_grade || 0
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => navigate('/teacher/classes')}
                            className="shrink-0"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-gray-900">{classInfo.name}</h1>
                                {getStatusBadge(classInfo.status)}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                    <BookOpen className="h-4 w-4" />
                                    {classInfo.code}
                                </span>
                                <span className="flex items-center gap-1">
                                    <GraduationCap className="h-4 w-4" />
                                    {classInfo.course_name || 'Chưa có khóa học'}
                                </span>
                                {classInfo.schedule && (
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        {classInfo.schedule}
                                    </span>
                                )}
                                {classInfo.room_name && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        {classInfo.room_name}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => navigate(`/teacher/classes/${id}/attendance`)}
                            className="bg-orange-500 hover:bg-orange-600 text-white"
                        >
                            <ClipboardCheck className="h-4 w-4 mr-2" />
                            Điểm danh
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => navigate(`/teacher/classes/${id}/gradebook`)}
                            className="border-orange-300 text-orange-600 hover:bg-orange-50"
                        >
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            Sổ điểm
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={Users}
                    label="Học viên"
                    value={stats.studentCount}
                    color="blue"
                />
                <StatCard
                    icon={UserCheck}
                    label="Tỷ lệ đi học"
                    value={`${stats.attendanceRate}%`}
                    color="green"
                />
                <StatCard
                    icon={CalendarCheck}
                    label="Buổi học"
                    value={stats.sessionCount}
                    color="purple"
                />
                <StatCard
                    icon={Award}
                    label="Điểm TB"
                    value={stats.avgGrade > 0 ? stats.avgGrade.toFixed(1) : '--'}
                    color="orange"
                />
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-1 p-2 border-b border-slate-200 overflow-x-auto">
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
                                        : 'text-gray-600 hover:bg-gray-100'
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {activeTab === 'overview' && (
                        <OverviewTab classInfo={classInfo} students={students} sessions={sessions} />
                    )}
                    {activeTab === 'students' && (
                        <StudentsTab students={students} />
                    )}
                    {activeTab === 'sessions' && (
                        <SessionsTab sessions={sessions} />
                    )}
                    {activeTab === 'attendance' && (
                        <AttendanceTab classId={id} navigate={navigate} />
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color }) {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        purple: 'bg-purple-50 text-purple-600',
        orange: 'bg-orange-50 text-orange-600'
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-4">
                <div className={cn('p-3 rounded-xl', colorClasses[color])}>
                    <Icon className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    <p className="text-sm text-gray-500">{label}</p>
                </div>
            </div>
        </div>
    );
}

function OverviewTab({ classInfo, students, sessions }) {
    const formatDate = (dateStr) => {
        if (!dateStr) return '--';
        return new Date(dateStr).toLocaleDateString('vi-VN');
    };

    const recentSessions = sessions.slice(0, 5);
    const topStudents = students.slice(0, 5);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Thông tin lớp học</h3>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-slate-100">
                        <span className="text-gray-500">Ngày bắt đầu</span>
                        <span className="font-medium">{formatDate(classInfo.start_date)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                        <span className="text-gray-500">Ngày kết thúc</span>
                        <span className="font-medium">{formatDate(classInfo.end_date)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                        <span className="text-gray-500">Số buổi đã học</span>
                        <span className="font-medium">{classInfo.completed_sessions || 0}/{classInfo.total_sessions || 0}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                        <span className="text-gray-500">Tiến độ</span>
                        <span className="font-medium">{classInfo.progress || 0}%</span>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Buổi học gần đây</h3>
                {recentSessions.length > 0 ? (
                    <div className="space-y-2">
                        {recentSessions.map((session, idx) => (
                            <div key={session.id || idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <div>
                                    <p className="font-medium text-sm">{session.title || `Buổi ${session.session_number || idx + 1}`}</p>
                                    <p className="text-xs text-gray-500">{formatDate(session.date)}</p>
                                </div>
                                <SessionStatusBadge status={session.status} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-sm">Chưa có buổi học nào</p>
                )}
            </div>
        </div>
    );
}

function StudentsTab({ students }) {
    if (students.length === 0) {
        return (
            <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Chưa có học viên trong lớp</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Học viên</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Email</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Điện thoại</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Chuyên cần</th>
                    </tr>
                </thead>
                <tbody>
                    {students.map((student, idx) => (
                        <tr key={student.id || idx} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-medium text-sm">
                                        {(student.full_name || student.name || 'U')[0].toUpperCase()}
                                    </div>
                                    <span className="font-medium text-gray-900">{student.full_name || student.name}</span>
                                </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">{student.email || '--'}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{student.phone || '--'}</td>
                            <td className="py-3 px-4 text-center">
                                <span className="text-sm font-medium">{student.attendance_rate || 0}%</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}


function SessionsTab({ sessions }) {
    const formatDate = (dateStr) => {
        if (!dateStr) return '--';
        return new Date(dateStr).toLocaleDateString('vi-VN');
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '--';
        return timeStr.slice(0, 5);
    };

    if (sessions.length === 0) {
        return (
            <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Chưa có buổi học nào được tạo</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Buổi</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Ngày</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Thời gian</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Phòng</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Trạng thái</th>
                    </tr>
                </thead>
                <tbody>
                    {sessions.map((session, idx) => (
                        <tr key={session.id || idx} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4 font-medium text-gray-900">
                                {session.title || `Buổi ${session.session_number || idx + 1}`}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">{formatDate(session.date)}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                                {formatTime(session.start_time)} - {formatTime(session.end_time)}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">{session.room_name || '--'}</td>
                            <td className="py-3 px-4 text-center">
                                <SessionStatusBadge status={session.status} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function AttendanceTab({ classId, navigate }) {
    return (
        <div className="text-center py-12">
            <ClipboardCheck className="h-16 w-16 text-orange-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Quản lý điểm danh</h3>
            <p className="text-gray-500 mb-6">Truy cập trang điểm danh để xem chi tiết và điểm danh học viên</p>
            <Button
                onClick={() => navigate(`/teacher/classes/${classId}/attendance`)}
                className="bg-orange-500 hover:bg-orange-600 text-white"
            >
                <ClipboardCheck className="h-4 w-4 mr-2" />
                Đi đến trang điểm danh
            </Button>
        </div>
    );
}

function SessionStatusBadge({ status }) {
    const configs = {
        completed: { label: 'Đã hoàn thành', className: 'bg-green-100 text-green-700' },
        ongoing: { label: 'Đang diễn ra', className: 'bg-blue-100 text-blue-700' },
        scheduled: { label: 'Đã lên lịch', className: 'bg-gray-100 text-gray-700' },
        cancelled: { label: 'Đã hủy', className: 'bg-red-100 text-red-700' },
        pending: { label: 'Chờ điểm danh', className: 'bg-amber-100 text-amber-700' }
    };
    const config = configs[status] || configs.scheduled;
    return (
        <span className={cn('px-2 py-1 text-xs font-medium rounded-full', config.className)}>
            {config.label}
        </span>
    );
}

export default TeacherClassDetailPage;