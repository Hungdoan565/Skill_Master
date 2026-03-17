/**
 * TeacherGradebookPage Component
 * Trang quản lý điểm số cho giáo viên
 * Route: /teacher/classes/:id/gradebook
 * 
 * Uses dynamic grade_structures from backend (per-course, UUID-based)
 */

import { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useTeacherGrades } from '../hooks';
import {
    ArrowLeft,
    Lock,
    Unlock,
    AlertTriangle,
    Loader2,
    RefreshCw,
    Users,
    Save,
    TrendingUp,
    TrendingDown,
    BarChart3,
    FileSpreadsheet,
    Award
} from 'lucide-react';

export function TeacherGradebookPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();

    const {
        students,
        gradeStructures,
        selectedStructureId,
        selectedStructure,
        summaryStats,
        loading,
        saving,
        error,
        lockStatus,
        hasChanges,
        fetchGrades,
        selectStructure,
        updateScore,
        updateNotes,
        saveGrades,
        lockGrades,
        refetch,
        getStudentGrade,
    } = useTeacherGrades(id);

    useEffect(() => {
        fetchGrades();
    }, [fetchGrades]);

    const isLocked = useMemo(() => {
        const status = lockStatus[selectedStructureId];
        return status?.isLocked || false;
    }, [lockStatus, selectedStructureId]);

    const handleScoreChange = (enrollmentId, value) => {
        const maxScore = selectedStructure?.max_score || 10;
        updateScore(enrollmentId, value, maxScore);
    };

    const handleNotesChange = (enrollmentId, value) => {
        updateNotes(enrollmentId, value);
    };

    const handleSave = async () => {
        const result = await saveGrades();
        if (result.success) {
            toast.success('Đã lưu điểm thành công');
        } else {
            toast.error(result.message || 'Lỗi khi lưu điểm');
        }
    };

    const handleLock = async () => {
        const result = await lockGrades(selectedStructureId);
        if (result.success) {
            toast.success('Đã khóa điểm thành công');
        } else {
            toast.error(result.message || 'Lỗi khi khóa điểm');
        }
    };

    const canSave = hasChanges && !isLocked && !saving;

    if (loading && students.length === 0) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto" />
                    <p className="mt-4 text-gray-500 dark:text-gray-400">Đang tải dữ liệu điểm...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center p-6 bg-red-50 dark:bg-red-500/10 rounded-2xl max-w-md">
                    <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">Đã có lỗi xảy ra</h2>
                    <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
                    <Button onClick={refetch} variant="outline" className="text-red-500">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Thử lại
                    </Button>
                </div>
            </div>
        );
    }

    // Empty state: no grade structures configured for this course
    if (!loading && gradeStructures.length === 0) {
        return (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" onClick={() => navigate(`/teacher/classes/${id}`)} className="shrink-0">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sổ điểm</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Quản lý điểm số học viên theo loại điểm</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                    <FileSpreadsheet className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Chưa có cấu trúc điểm</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                        Khóa học này chưa được cấu hình cấu trúc điểm (VD: Chuyên cần, Bài tập, Kiểm tra...). 
                        Liên hệ quản trị viên để thiết lập.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
            {/* Header */}
            <PageHeader
                classId={id}
                isLocked={isLocked}
                lockStatus={lockStatus}
                selectedStructureId={selectedStructureId}
                navigate={navigate}
            />

            {/* Grade Structure Tabs */}
            <GradeStructureTabs
                structures={gradeStructures}
                selectedId={selectedStructureId}
                onSelect={selectStructure}
                lockStatus={lockStatus}
            />

            {/* Summary Stats */}
            <SummaryStatsBar
                stats={summaryStats}
                structure={selectedStructure}
            />

            {/* Grade Input Table */}
            <GradeInputTable
                students={students}
                getStudentGrade={getStudentGrade}
                onScoreChange={handleScoreChange}
                onNotesChange={handleNotesChange}
                isLocked={isLocked}
                loading={loading}
                maxScore={selectedStructure?.max_score || 10}
            />

            {/* Sticky Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {hasChanges ? (
                            <span className="text-amber-500 font-medium flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                Có thay đổi chưa lưu
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-green-500" />
                                Đã lưu
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {!isLocked && (
                            <Button
                                variant="outline"
                                onClick={handleLock}
                                disabled={hasChanges}
                                className="text-red-500 border-red-200 dark:border-red-500/20 hover:bg-red-50 dark:hover:bg-red-500/10"
                            >
                                <Lock className="h-4 w-4 mr-2" />
                                Khóa điểm
                            </Button>
                        )}
                        <Button
                            onClick={handleSave}
                            disabled={!canSave}
                            className="bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Đang lưu...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Lưu điểm
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PageHeader({ classId, isLocked, lockStatus, selectedStructureId, navigate }) {
    const lockInfo = lockStatus[selectedStructureId];

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate(`/teacher/classes/${classId}`)}
                        className="shrink-0"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Sổ điểm
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Quản lý điểm số học viên theo loại điểm
                        </p>
                    </div>
                </div>
                <LockStatusBadge isLocked={isLocked} lockInfo={lockInfo} />
            </div>
        </div>
    );
}

function LockStatusBadge({ isLocked, lockInfo }) {
    if (isLocked) {
        return (
            <div className="flex flex-col items-end">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400">
                    <Lock className="h-3.5 w-3.5" />
                    Đã khóa
                </span>
                {lockInfo?.lockedAt && (
                    <span className="text-xs text-gray-400 mt-1">
                        {new Date(lockInfo.lockedAt).toLocaleDateString('vi-VN')}
                    </span>
                )}
            </div>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Unlock className="h-3.5 w-3.5" />
            Có thể chỉnh sửa
        </span>
    );
}

function GradeStructureTabs({ structures, selectedId, onSelect, lockStatus }) {
    if (!structures || structures.length === 0) return null;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4">
            <div className="flex flex-wrap gap-2">
                {structures.map((gs) => {
                    const isActive = selectedId === gs.id;
                    const isTypeLocked = lockStatus[gs.id]?.isLocked;

                    return (
                        <button
                            key={gs.id}
                            onClick={() => onSelect(gs.id)}
                            className={cn(
                                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                                isActive
                                    ? 'bg-orange-500 text-white shadow-sm'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            )}
                        >
                            {gs.name}
                            {gs.weight && (
                                <span className={cn(
                                    'text-xs px-1.5 py-0.5 rounded',
                                    isActive
                                        ? 'bg-white/20 text-white'
                                        : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                                )}>
                                    {(gs.weight * 100).toFixed(0)}%
                                </span>
                            )}
                            {isTypeLocked && <Lock className="h-3 w-3" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function SummaryStatsBar({ stats, structure }) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
                    <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-lg">
                        <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Điểm TB lớp</p>
                        <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{stats.average || '--'}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Điểm cao nhất</p>
                        <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{stats.highest || '--'}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-500/10 rounded-xl">
                    <div className="p-2 bg-red-100 dark:bg-red-500/20 rounded-lg">
                        <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                        <p className="text-xs text-red-600 dark:text-red-400 font-medium">Điểm thấp nhất</p>
                        <p className="text-lg font-bold text-red-700 dark:text-red-300">{stats.lowest || '--'}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-500/10 rounded-xl">
                    <div className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-lg">
                        <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Đã nhập điểm</p>
                        <p className="text-lg font-bold text-purple-700 dark:text-purple-300">{stats.count}/{stats.count > 0 ? stats.count : '--'}</p>
                    </div>
                </div>
            </div>

            {/* Grade structure info */}
            {structure && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                        <Award className="h-3.5 w-3.5" />
                        Thang điểm: <strong className="text-gray-700 dark:text-gray-300">{structure.max_score}</strong>
                    </span>
                    {structure.weight && (
                        <span>
                            Trọng số: <strong className="text-gray-700 dark:text-gray-300">{(structure.weight * 100).toFixed(0)}%</strong>
                        </span>
                    )}
                    {structure.description && (
                        <span className="hidden sm:inline">{structure.description}</span>
                    )}
                </div>
            )}
        </div>
    );
}

function GradeInputTable({ students, getStudentGrade, onScoreChange, onNotesChange, isLocked, loading, maxScore }) {
    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
                <div className="flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                    <span className="ml-3 text-gray-500 dark:text-gray-400">Đang tải danh sách...</span>
                </div>
            </div>
        );
    }

    if (!students || students.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                <Users className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Chưa có học viên</h3>
                <p className="text-gray-500 dark:text-gray-400">Lớp học chưa có học viên nào được ghi danh</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400 w-12">#</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400 w-12">Ảnh</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Họ tên học viên</th>
                            <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400 w-28">Điểm</th>
                            <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400 w-20">Thang điểm</th>
                            <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400 w-24">Phần trăm</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400 min-w-[180px]">Ghi chú</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map((student, idx) => (
                            <StudentGradeRow
                                key={student.enrollment_id || student.id || idx}
                                index={idx + 1}
                                student={student}
                                grade={getStudentGrade(student.enrollment_id)}
                                onScoreChange={onScoreChange}
                                onNotesChange={onNotesChange}
                                isLocked={isLocked}
                                maxScore={maxScore}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function StudentGradeRow({ index, student, grade, onScoreChange, onNotesChange, isLocked, maxScore }) {
    const studentName = student.full_name || 'Học viên';
    const initials = studentName.split(' ').map(n => n[0]).slice(-2).join('').toUpperCase();
    const enrollmentId = student.enrollment_id;

    const score = grade?.score ?? '';
    const gradeMaxScore = grade?.max_score || maxScore;
    const notes = grade?.notes || '';
    const percentage = score !== '' && score !== null
        ? ((score / gradeMaxScore) * 100).toFixed(1)
        : '-';

    return (
        <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
            <td className="py-3 px-4 text-sm text-gray-400 font-medium">{index}</td>
            <td className="py-3 px-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-medium text-sm">
                    {student.avatar_url ? (
                        <img
                            src={student.avatar_url}
                            alt={studentName}
                            className="w-10 h-10 rounded-full object-cover"
                        />
                    ) : (
                        initials
                    )}
                </div>
            </td>
            <td className="py-3 px-4">
                <div>
                    <p className="font-medium text-gray-900 dark:text-white">{studentName}</p>
                    {student.student_code && (
                        <p className="text-xs text-gray-400">{student.student_code}</p>
                    )}
                </div>
            </td>
            <td className="py-3 px-4">
                <input
                    type="number"
                    min="0"
                    max={gradeMaxScore}
                    step="0.1"
                    value={score}
                    onChange={(e) => onScoreChange(enrollmentId, e.target.value)}
                    disabled={isLocked}
                    placeholder="--"
                    className={cn(
                        'w-full h-10 text-center rounded-lg border bg-white dark:bg-gray-900 px-3 text-sm',
                        'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent',
                        isLocked
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed border-gray-200 dark:border-gray-600'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-900 dark:text-white'
                    )}
                />
            </td>
            <td className="py-3 px-4 text-center text-sm text-gray-400">
                {gradeMaxScore}
            </td>
            <td className="py-3 px-4 text-center">
                <span className={cn(
                    'text-sm font-medium',
                    percentage !== '-' && parseFloat(percentage) >= 50
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : percentage !== '-'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-gray-400'
                )}>
                    {percentage !== '-' ? `${percentage}%` : '-'}
                </span>
            </td>
            <td className="py-3 px-4">
                <input
                    type="text"
                    value={notes}
                    onChange={(e) => onNotesChange(enrollmentId, e.target.value)}
                    disabled={isLocked}
                    placeholder="Ghi chú..."
                    className={cn(
                        'w-full h-10 rounded-lg border bg-white dark:bg-gray-900 px-3 text-sm',
                        'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent',
                        isLocked
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed border-gray-200 dark:border-gray-600'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-900 dark:text-white'
                    )}
                />
            </td>
        </tr>
    );
}

export default TeacherGradebookPage;
