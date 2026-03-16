/**
 * StudentProgressPage Component
 * Aggregated student progress view for teachers
 * Route: /teacher/classes/:classId/students/:studentId
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import {
    ArrowLeft,
    User,
    CheckCircle,
    XCircle,
    Clock,
    FileText,
    TrendingUp,
    TrendingDown,
    Minus,
    GraduationCap,
    Calendar,
    Loader2,
    AlertTriangle,
    RefreshCw,
    BarChart3,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

const TREND_CONFIG = {
    improving: { label: 'Tiến bộ', icon: TrendingUp, color: 'text-green-600 bg-green-50' },
    declining: { label: 'Giảm sút', icon: TrendingDown, color: 'text-red-600 bg-red-50' },
    stable: { label: 'Ổn định', icon: Minus, color: 'text-blue-600 bg-blue-50' },
};

const NOTE_TYPE_LABELS = {
    academic: { label: 'Học tập', color: 'bg-blue-100 text-blue-700' },
    behavior: { label: 'Thái độ', color: 'bg-amber-100 text-amber-700' },
    general: { label: 'Chung', color: 'bg-slate-100 text-slate-600' },
};

const ATTENDANCE_STATUS_CONFIG = {
    present: { color: 'bg-green-500', tooltip: 'Có mặt' },
    late: { color: 'bg-amber-400', tooltip: 'Đi trễ' },
    absent: { color: 'bg-red-500', tooltip: 'Vắng' },
    excused: { color: 'bg-blue-400', tooltip: 'Có phép' },
};

export function StudentProgressPage() {
    const { classId, studentId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchProgress = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Chưa đăng nhập');

            const response = await fetch(
                `${API_URL}/api/teacher/classes/${classId}/students/${studentId}/progress`,
                { headers: { 'Authorization': `Bearer ${session.access_token}` } }
            );

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Lỗi tải dữ liệu');

            setData(result.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [classId, studentId]);

    useEffect(() => {
        fetchProgress();
    }, [fetchProgress]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto" />
                    <p className="mt-3 text-muted-foreground">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center p-6 bg-red-50 rounded-2xl max-w-md">
                    <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-3" />
                    <p className="text-red-600 mb-4">{error}</p>
                    <Button onClick={fetchProgress} variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" /> Thử lại
                    </Button>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { student, className: clsName, attendance, grades, trend, recent_notes } = data;
    const trendConfig = TREND_CONFIG[trend] || TREND_CONFIG.stable;
    const TrendIcon = trendConfig.icon;

    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        return parts.length > 1
            ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
            : parts[0][0].toUpperCase();
    };

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-border p-6">
                <div className="flex items-center gap-4 mb-4">
                    <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="shrink-0">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Tiến độ học viên</h1>
                        <p className="text-sm text-muted-foreground">Lớp: {clsName}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {student.avatar_url ? (
                        <img src={student.avatar_url} alt={student.full_name} className="h-14 w-14 rounded-full object-cover border-2 border-border" />
                    ) : (
                        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                            {getInitials(student.full_name)}
                        </div>
                    )}
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">{student.full_name}</h2>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Attendance Rate */}
                <div className="bg-white rounded-2xl shadow-sm border border-border p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 rounded-lg bg-green-500/10">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">Tỉ lệ chuyên cần</span>
                    </div>
                    <p className="text-3xl font-bold text-foreground">{attendance.attendance_rate}%</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {attendance.attended}/{attendance.total_sessions} buổi
                    </p>
                </div>

                {/* Grade Average */}
                <div className="bg-white rounded-2xl shadow-sm border border-border p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 rounded-lg bg-blue-500/10">
                            <BarChart3 className="h-5 w-5 text-blue-500" />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">Điểm trung bình</span>
                    </div>
                    <p className="text-3xl font-bold text-foreground">
                        {grades.average !== null ? grades.average : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {grades.items.length > 0 ? `${grades.items.length} bài đánh giá` : 'Chưa có điểm'}
                    </p>
                </div>

                {/* Trend */}
                <div className="bg-white rounded-2xl shadow-sm border border-border p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className={cn('p-2.5 rounded-lg', trendConfig.color.split(' ')[1])}>
                            <TrendIcon className={cn('h-5 w-5', trendConfig.color.split(' ')[0])} />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">Xu hướng</span>
                    </div>
                    <p className={cn('text-3xl font-bold', trendConfig.color.split(' ')[0])}>
                        {trendConfig.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        So sánh nửa đầu và nửa sau
                    </p>
                </div>
            </div>

            {/* Attendance Dots + Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-border p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Điểm danh gần đây
                </h3>

                {attendance.recent && attendance.recent.length > 0 ? (
                    <div className="flex items-center gap-2 flex-wrap">
                        {attendance.recent.map((r, i) => {
                            const config = ATTENDANCE_STATUS_CONFIG[r.status] || ATTENDANCE_STATUS_CONFIG.absent;
                            return (
                                <div key={i} className="flex flex-col items-center gap-1" title={`${config.tooltip} - ${r.session_date}`}>
                                    <div className={cn('w-4 h-4 rounded-full', config.color)} />
                                    <span className="text-[9px] text-muted-foreground">
                                        {new Date(r.session_date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">Chưa có dữ liệu điểm danh</p>
                )}

                <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-green-500" /> Có mặt: {attendance.attended}</span>
                    <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Trễ: {attendance.late}</span>
                    <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-red-500" /> Vắng: {attendance.absent}</span>
                    <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-blue-400" /> Phép: {attendance.excused}</span>
                </div>
            </div>

            {/* Grades */}
            {grades.items.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-border p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        Bảng điểm
                    </h3>
                    <div className="space-y-2">
                        {grades.items.map((g, i) => {
                            const pct = g.max_score > 0 ? (g.score / g.max_score) * 100 : 0;
                            const barColor = pct >= 70 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-500';
                            return (
                                <div key={i} className="flex items-center gap-3">
                                    <span className="text-sm text-foreground w-36 truncate">{g.name || `Bài ${i + 1}`}</span>
                                    <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                                        <div className={cn('h-full rounded-full transition-all', barColor)} style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className="text-sm font-medium text-foreground w-20 text-right">{g.score}/{g.max_score}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Recent Notes */}
            <div className="bg-white rounded-2xl shadow-sm border border-border p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Nhận xét gần đây
                </h3>
                {recent_notes.length > 0 ? (
                    <div className="space-y-3">
                        {recent_notes.map((note, i) => {
                            const typeInfo = NOTE_TYPE_LABELS[note.note_type] || NOTE_TYPE_LABELS.general;
                            return (
                                <div key={i} className="p-3 rounded-lg bg-slate-50 border border-border">
                                    <p className="text-sm text-foreground whitespace-pre-wrap">{note.content}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium', typeInfo.color)}>
                                            {typeInfo.label}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {new Date(note.created_at).toLocaleDateString('vi-VN', {
                                                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Chưa có nhận xét nào</p>
                )}
            </div>
        </div>
    );
}

export default StudentProgressPage;
