/**
 * TeacherAttendancePage Component
 * Trang điểm danh cho giáo viên
 * Route: /teacher/classes/:id/attendance
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useTeacherAttendance } from '../hooks';
import { StudentNotePopover } from '../components/StudentNotePopover';
import { TeachingNotesSection } from '../components/TeachingNotesSection';
import {
    ArrowLeft,
    Check,
    Clock,
    X,
    FileText,
    Lock,
    AlertTriangle,
    Loader2,
    RefreshCw,
    Users,
    Save,
    CheckCircle2,
    MessageSquarePlus,
    ClipboardCheck
} from 'lucide-react';
import { TeacherPageHeader } from '@/components/ui/teacher-page-header';

const STATUS_OPTIONS = [
    { value: 'present', label: 'Có mặt', icon: Check, color: 'emerald' },
    { value: 'late', label: 'Đi trễ', icon: Clock, color: 'amber' },
    { value: 'absent', label: 'Vắng', icon: X, color: 'red' },
    { value: 'excused', label: 'Có phép', icon: FileText, color: 'blue' },
];

const STATUS_COLORS = {
    present: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20', active: 'bg-emerald-500 text-white' },
    late: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20', active: 'bg-amber-500 text-white' },
    absent: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/20', active: 'bg-red-500 text-white' },
    excused: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20', active: 'bg-blue-500 text-white' },
};

export function TeacherAttendancePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();

    const {
        sessions,
        selectedSession,
        attendance,
        loading,
        saving,
        error,
        editStatus,
        hasChanges,
        summary,
        fetchSessions,
        selectSession,
        updateAttendance,
        saveAttendance,
        markAllPresent,
        markAllAbsent,
        refetch
    } = useTeacherAttendance(id);

    const [className, setClassName] = useState('');
    const [noteTarget, setNoteTarget] = useState(null);
    const [showSaveAnimation, setShowSaveAnimation] = useState(false);

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    useEffect(() => {
        if (sessions.length > 0 && !selectedSession) {
            const todaySession = sessions.find(s => {
                const sessionDate = new Date(s.date).toDateString();
                return sessionDate === new Date().toDateString();
            });
            selectSession(todaySession || sessions[0]);
        }
    }, [sessions, selectedSession, selectSession]);

    useEffect(() => {
        if (sessions.length > 0 && sessions[0]?.class_name) {
            setClassName(sessions[0].class_name);
        }
    }, [sessions]);

    const handleSave = async () => {
        const result = await saveAttendance();
        if (result.success) {
            toast.success('Đã lưu điểm danh thành công');
            setShowSaveAnimation(true);
            setTimeout(() => setShowSaveAnimation(false), 2000);
        } else {
            toast.error(result.message || 'Lỗi khi lưu điểm danh');
        }
    };

    const handleCancel = () => {
        if (hasChanges) {
            if (window.confirm('Bạn có thay đổi chưa lưu. Bạn có chắc muốn hủy?')) {
                navigate(`/teacher/classes/${id}`);
            }
        } else {
            navigate(`/teacher/classes/${id}`);
        }
    };

    const formatSessionDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('vi-VN', {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const canSave = hasChanges && editStatus?.canEdit && !saving;

    if (loading && sessions.length === 0) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto" />
                    <p className="mt-4 text-muted-foreground">Đang tải dữ liệu điểm danh...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center p-6 bg-red-500/10 rounded-2xl max-w-md">
                    <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-red-500 mb-2">Đã có lỗi xảy ra</h2>
                    <p className="text-red-500 mb-4">{error}</p>
                    <Button onClick={refetch} variant="outline" className="text-red-500">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Thử lại
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
            {/* Header */}
            <TeacherPageHeader
                title={`Điểm danh lớp ${className || '...'}`}
                subtitle="Quản lý điểm danh học viên theo buổi học"
                icon={ClipboardCheck}
                iconColorClass="text-emerald-600 dark:text-emerald-300 bg-emerald-500/10 dark:bg-emerald-400/15"
                breadcrumbs={[
                    { label: 'Lớp học', href: '/teacher/classes' },
                    { label: className || 'Chi tiết lớp', href: `/teacher/classes/${id}` },
                    { label: 'Điểm danh' }
                ]}
                actions={
                    <Button
                        variant="outline"
                        onClick={() => navigate(`/teacher/classes/${id}`)}
                        className="bg-card"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Trở lại lớp
                    </Button>
                }
            />

            {/* Session Selector */}
            <SessionSelector
                sessions={sessions}
                selectedSession={selectedSession}
                onSelect={selectSession}
                editStatus={editStatus}
                formatDate={formatSessionDate}
            />

            {/* Bulk Actions & Summary */}
            <BulkActionsBar
                summary={summary}
                onMarkAllPresent={markAllPresent}
                onMarkAllAbsent={markAllAbsent}
                canEdit={editStatus?.canEdit}
            />

            {/* Student List */}
            <StudentAttendanceList
                attendance={attendance}
                onUpdateStatus={updateAttendance}
                canEdit={editStatus?.canEdit}
                loading={loading}
                onOpenNote={(studentId, studentName) => setNoteTarget({ studentId, studentName })}
            />

            {/* Student Note Popover */}
            {noteTarget && (
                <StudentNotePopover
                    studentId={noteTarget.studentId}
                    classId={id}
                    sessionId={selectedSession?.id}
                    studentName={noteTarget.studentName}
                    onClose={() => setNoteTarget(null)}
                />
            )}

            {/* Teaching Notes Section */}
            {selectedSession && (
                <TeachingNotesSection
                    sessionId={selectedSession.id}
                    initialNotes={selectedSession.teacher_notes}
                    initialHomework={selectedSession.homework}
                />
            )}

            {/* Sticky Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        {hasChanges ? (
                            <span className="text-amber-500 font-medium">Có thay đổi chưa lưu</span>
                        ) : (
                            <span>Không có thay đổi</span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={handleCancel}>
                            Hủy
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={!canSave && !showSaveAnimation}
                            className={cn(
                                "bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50 transition-all duration-300",
                                showSaveAnimation ? "bg-green-500 hover:bg-green-600 animate-success-pop" : ""
                            )}
                        >
                            {showSaveAnimation ? (
                                <>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Đã lưu thành công!
                                </>
                            ) : saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Đang lưu...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Lưu điểm danh
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SessionSelector({ sessions, selectedSession, onSelect, editStatus, formatDate }) {
    return (
        <div className="bg-card rounded-2xl shadow-sm border border-border p-4 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Chọn buổi học
                    </label>
                    <select
                        value={selectedSession?.id || ''}
                        onChange={(e) => {
                            const session = sessions.find(s => s.id === e.target.value);
                            onSelect(session);
                        }}
                        className="w-full h-10 rounded-lg border border-border bg-card text-foreground px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                        <option value="">-- Chọn buổi học --</option>
                        {sessions.map((session) => (
                            <option key={session.id} value={session.id}>
                                Buổi {session.session_number} - {formatDate(session.date)}
                            </option>
                        ))}
                    </select>
                </div>

                {selectedSession && (
                    <div className="flex items-center gap-3">
                        <EditStatusBadge editStatus={editStatus} />
                    </div>
                )}
            </div>

            {selectedSession && (
                <div className="mt-3 pt-3 border-t border-border text-sm text-muted-foreground">
                    <span className="font-medium">{selectedSession.title || `Buổi ${selectedSession.session_number}`}</span>
                    {selectedSession.start_time && (
                        <span className="ml-2">• {selectedSession.start_time?.slice(0, 5)} - {selectedSession.end_time?.slice(0, 5)}</span>
                    )}
                    {selectedSession.room_name && (
                        <span className="ml-2">• Phòng: {selectedSession.room_name}</span>
                    )}
                </div>
            )}
        </div>
    );
}

function EditStatusBadge({ editStatus }) {
    if (!editStatus) return null;

    if (editStatus.canEdit) {
        const hours = editStatus.hoursRemaining || 0;
        const h = Math.floor(hours);
        const m = Math.round((hours % 1) * 60);
        
        // Color based on urgency
        let colorClasses, iconColor;
        if (hours > 12) {
            colorClasses = 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20';
            iconColor = 'text-emerald-500';
        } else if (hours > 4) {
            colorClasses = 'bg-amber-500/10 text-amber-600 border border-amber-500/20';
            iconColor = 'text-amber-500';
        } else {
            colorClasses = 'bg-red-500/10 text-red-600 border border-red-500/20 animate-pulse';
            iconColor = 'text-red-500';
        }

        return (
            <span className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
                colorClasses
            )}>
                <Clock className={cn('h-3.5 w-3.5', iconColor)} />
                Còn {h > 0 ? `${h}h` : ''}{m > 0 ? `${m}p` : ''} để chỉnh sửa
            </span>
        );
    }

    if (editStatus.reason === 'locked') {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
                <Lock className="h-3.5 w-3.5" />
                Đã khóa
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
            <AlertTriangle className="h-3.5 w-3.5" />
            Hết hạn chỉnh sửa — Liên hệ Admin
        </span>
    );
}


function BulkActionsBar({ summary, onMarkAllPresent, onMarkAllAbsent, canEdit }) {
    return (
        <div className="bg-card rounded-2xl shadow-sm border border-border p-4 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onMarkAllPresent}
                        disabled={!canEdit}
                        className="text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10"
                    >
                        <Check className="h-4 w-4 mr-1" />
                        Có mặt tất cả
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onMarkAllAbsent}
                        disabled={!canEdit}
                        className="text-red-500 border-red-500/20 hover:bg-red-500/10"
                    >
                        <X className="h-4 w-4 mr-1" />
                        Vắng tất cả
                    </Button>
                </div>

                <div className="flex items-center gap-4 text-sm">
                    <span className="text-emerald-500 flex items-center gap-1">
                        <Check className="h-4 w-4" /> {summary?.present || 0}
                    </span>
                    <span className="text-amber-500 flex items-center gap-1">
                        <Clock className="h-4 w-4" /> {summary?.late || 0}
                    </span>
                    <span className="text-red-500 flex items-center gap-1">
                        <X className="h-4 w-4" /> {summary?.absent || 0}
                    </span>
                    <span className="text-blue-500 flex items-center gap-1">
                        <FileText className="h-4 w-4" /> {summary?.excused || 0}
                    </span>
                    <span className="text-muted-foreground">/ {summary?.total || 0} học viên</span>
                </div>
            </div>
        </div>
    );
}

function StudentAttendanceList({ attendance, onUpdateStatus, canEdit, loading, onOpenNote }) {
    if (loading) {
        return (
            <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
                <div className="flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                    <span className="ml-3 text-muted-foreground">Đang tải danh sách...</span>
                </div>
            </div>
        );
    }

    if (!attendance || attendance.length === 0) {
        return (
            <div className="bg-card rounded-2xl shadow-sm border border-border p-12 text-center">
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Chưa có dữ liệu điểm danh</h3>
                <p className="text-muted-foreground">Vui lòng chọn buổi học để xem danh sách học viên</p>
            </div>
        );
    }

    return (
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full min-w-full whitespace-nowrap md:whitespace-normal">
                    <thead>
                        <tr className="bg-muted border-b border-border">
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground w-12">#</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Học viên</th>
                            <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Trạng thái điểm danh</th>
                        </tr>
                    </thead>
                    <tbody>
                        {attendance.map((record, idx) => (
                            <StudentRow
                                key={record.student_id || idx}
                                index={idx + 1}
                                record={record}
                                onUpdateStatus={onUpdateStatus}
                                canEdit={canEdit}
                                onOpenNote={onOpenNote}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function StudentRow({ index, record, onUpdateStatus, canEdit, onOpenNote }) {
    const studentName = record.student_name || record.full_name || 'Học viên';
    const initials = studentName.split(' ').map(n => n[0]).slice(-2).join('').toUpperCase();

    return (
        <tr className="border-b border-border hover:bg-muted transition-colors">
            <td className="py-3 px-4 text-sm text-muted-foreground font-medium">{index}</td>
            <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-medium text-sm">
                        {initials}
                    </div>
                    <div>
                        <p className="font-medium text-foreground">{studentName}</p>
                        {record.student_code && (
                            <p className="text-xs text-muted-foreground">{record.student_code}</p>
                        )}
                    </div>
                    <button
                        onClick={() => onOpenNote?.(record.student_id, studentName)}
                        className="ml-auto p-1.5 rounded-lg text-muted-foreground hover:text-blue-600 hover:bg-blue-500/10 transition-colors"
                        title="Thêm nhận xét"
                    >
                        <MessageSquarePlus className="h-4 w-4" />
                    </button>
                </div>
            </td>
            <td className="py-3 px-4">
                <div className="flex items-center justify-center gap-1">
                    {STATUS_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        const isActive = record.status === option.value;
                        const colors = STATUS_COLORS[option.value];

                        return (
                            <button
                                key={option.value}
                                onClick={() => canEdit && onUpdateStatus(record.student_id, option.value)}
                                disabled={!canEdit}
                                title={option.label}
                                className={cn(
                                    'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                                    'border',
                                    isActive
                                        ? colors.active
                                        : `${colors.bg} ${colors.text} ${colors.border} hover:opacity-80`,
                                    !canEdit && 'opacity-50 cursor-not-allowed'
                                )}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">{option.label}</span>
                            </button>
                        );
                    })}
                </div>
            </td>
        </tr>
    );
}

export default TeacherAttendancePage;
