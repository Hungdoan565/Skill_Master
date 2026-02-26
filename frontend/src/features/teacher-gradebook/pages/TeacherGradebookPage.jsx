/**
 * TeacherGradebookPage Component
 * Trang quản lý điểm số cho giáo viên
 * Route: /teacher/classes/:id/gradebook
 */

import { useEffect, useState, useMemo } from 'react';
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
    CheckCircle2
} from 'lucide-react';

const GRADE_TYPE_TABS = [
    { value: 'participation', label: 'Chuyên cần' },
    { value: 'assignment', label: 'Bài tập' },
    { value: 'quiz', label: 'Kiểm tra' },
    { value: 'midterm', label: 'Giữa kỳ' },
    { value: 'final', label: 'Cuối kỳ' },
];

export function TeacherGradebookPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();

    const {
        students,
        grades,
        gradeTypes,
        selectedGradeType,
        loading,
        saving,
        error,
        lockStatus,
        hasChanges,
        fetchGrades,
        selectGradeType,
        updateGrade,
        saveGrades,
        lockGrades,
        refetch
    } = useTeacherGrades(id);

    const [className, setClassName] = useState('');
    const [showLockConfirm, setShowLockConfirm] = useState(false);

    useEffect(() => {
        fetchGrades();
    }, [fetchGrades]);

    useEffect(() => {
        if (!selectedGradeType && gradeTypes.length > 0) {
            selectGradeType(gradeTypes[0].value);
        }
    }, [gradeTypes, selectedGradeType, selectGradeType]);

    const currentGradeType = useMemo(() => {
        return gradeTypes.find(t => t.value === selectedGradeType) || gradeTypes[0];
    }, [gradeTypes, selectedGradeType]);

    const isLocked = useMemo(() => {
        return lockStatus[selectedGradeType] || false;
    }, [lockStatus, selectedGradeType]);

    const summaryStats = useMemo(() => {
        if (!students.length || !selectedGradeType) {
            return { average: 0, highest: 0, lowest: 0, count: 0 };
        }

        const relevantGrades = grades.filter(g => g.grade_type === selectedGradeType);
        const scores = relevantGrades
            .map(g => g.score)
            .filter(s => s !== null && s !== undefined);

        if (scores.length === 0) {
            return { average: 0, highest: 0, lowest: 0, count: 0 };
        }

        return {
            average: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2),
            highest: Math.max(...scores),
            lowest: Math.min(...scores),
            count: scores.length
        };
    }, [grades, students, selectedGradeType]);

    const getStudentGrade = (studentId) => {
        return grades.find(
            g => g.student_id === studentId && g.grade_type === selectedGradeType
        );
    };

    const handleScoreChange = (studentId, value, maxScore = 10) => {
        const numValue = value === '' ? null : parseFloat(value);
        if (numValue !== null && (numValue < 0 || numValue > maxScore)) return;
        updateGrade(studentId, selectedGradeType, numValue, maxScore);
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
        const result = await lockGrades(selectedGradeType);
        if (result.success) {
            toast.success('Đã khóa điểm thành công');
            setShowLockConfirm(false);
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
                    <p className="mt-4 text-gray-600">Đang tải dữ liệu điểm...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center p-6 bg-red-50 rounded-xl max-w-md">
                    <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-red-700 mb-2">Đã có lỗi xảy ra</h2>
                    <p className="text-red-600 mb-4">{error}</p>
                    <Button onClick={refetch} variant="outline" className="text-red-600">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Thử lại
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
            {/* Header */}
            <PageHeader
                classId={id}
                className={className}
                isLocked={isLocked}
                lockStatus={lockStatus}
                selectedGradeType={selectedGradeType}
                navigate={navigate}
            />

            {/* Grade Type Tabs */}
            <GradeTypeTabs
                gradeTypes={gradeTypes}
                selectedGradeType={selectedGradeType}
                onSelect={selectGradeType}
                lockStatus={lockStatus}
            />

            {/* Summary Stats */}
            <SummaryStatsBar stats={summaryStats} gradeType={currentGradeType} />

            {/* Grade Input Table */}
            <GradeInputTable
                students={students}
                getStudentGrade={getStudentGrade}
                onScoreChange={handleScoreChange}
                isLocked={isLocked}
                loading={loading}
                maxScore={currentGradeType?.max_score || 10}
            />

            {/* Lock Confirmation Modal */}
            {showLockConfirm && (
                <LockConfirmModal
                    gradeType={currentGradeType}
                    onConfirm={handleLock}
                    onCancel={() => setShowLockConfirm(false)}
                    loading={loading}
                />
            )}

            {/* Sticky Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                        {hasChanges ? (
                            <span className="text-amber-600 font-medium">Có thay đổi chưa lưu</span>
                        ) : (
                            <span>Không có thay đổi</span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setShowLockConfirm(true)}
                            disabled={isLocked || hasChanges}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                            <Lock className="h-4 w-4 mr-2" />
                            Khóa điểm
                        </Button>
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

function PageHeader({ classId, className, isLocked, lockStatus, selectedGradeType, navigate }) {
    const lockInfo = lockStatus[selectedGradeType];

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
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
                        <h1 className="text-2xl font-bold text-gray-900">
                            Sổ điểm {className || ''}
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
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
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                    <Lock className="h-3.5 w-3.5" />
                    Đã khóa
                </span>
                {lockInfo?.locked_by && (
                    <span className="text-xs text-gray-500 mt-1">
                        Bởi: {lockInfo.locked_by} {lockInfo.locked_at && `- ${new Date(lockInfo.locked_at).toLocaleDateString('vi-VN')}`}
                    </span>
                )}
            </div>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
            <Unlock className="h-3.5 w-3.5" />
            Có thể chỉnh sửa
        </span>
    );
}

function GradeTypeTabs({ gradeTypes, selectedGradeType, onSelect, lockStatus }) {
    const tabs = gradeTypes.length > 0 ? gradeTypes : GRADE_TYPE_TABS;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-4">
            <div className="flex flex-wrap gap-2">
                {tabs.map((type) => {
                    const isActive = selectedGradeType === type.value;
                    const isTypeLocked = lockStatus[type.value];

                    return (
                        <button
                            key={type.value}
                            onClick={() => onSelect(type.value)}
                            className={cn(
                                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                                isActive
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-slate-100 text-gray-700 hover:bg-slate-200'
                            )}
                        >
                            {type.label}
                            {isTypeLocked && <Lock className="h-3 w-3" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function SummaryStatsBar({ stats, gradeType }) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-xs text-blue-600 font-medium">Điểm TB lớp</p>
                        <p className="text-lg font-bold text-blue-700">{stats.average}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-xs text-emerald-600 font-medium">Điểm cao nhất</p>
                        <p className="text-lg font-bold text-emerald-700">{stats.highest}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
                    <div className="p-2 bg-red-100 rounded-lg">
                        <TrendingDown className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                        <p className="text-xs text-red-600 font-medium">Điểm thấp nhất</p>
                        <p className="text-lg font-bold text-red-700">{stats.lowest}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
                    <div className="p-2 bg-purple-100 rounded-lg">
                        <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                        <p className="text-xs text-purple-600 font-medium">Đã nhập điểm</p>
                        <p className="text-lg font-bold text-purple-700">{stats.count}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function GradeInputTable({ students, getStudentGrade, onScoreChange, isLocked, loading, maxScore }) {
    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                <div className="flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                    <span className="ml-3 text-gray-600">Đang tải danh sách...</span>
                </div>
            </div>
        );
    }

    if (!students || students.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Chưa có học viên</h3>
                <p className="text-gray-500">Lớp học chưa có học viên nào được ghi danh</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full min-w-full whitespace-nowrap md:whitespace-normal">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 w-12">#</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 w-12">Ảnh</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Họ tên học viên</th>
                            <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 w-32">Điểm</th>
                            <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 w-24">Thang điểm</th>
                            <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 w-24">Phần trăm</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Ghi chú</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map((student, idx) => (
                            <StudentGradeRow
                                key={student.id || student.student_id || idx}
                                index={idx + 1}
                                student={student}
                                grade={getStudentGrade(student.id || student.student_id)}
                                onScoreChange={onScoreChange}
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

function StudentGradeRow({ index, student, grade, onScoreChange, isLocked, maxScore }) {
    const studentName = student.full_name || student.name || 'Học viên';
    const initials = studentName.split(' ').map(n => n[0]).slice(-2).join('').toUpperCase();
    const studentId = student.id || student.student_id;

    const score = grade?.score ?? '';
    const gradeMaxScore = grade?.max_score || maxScore;
    const percentage = score !== '' && score !== null
        ? ((score / gradeMaxScore) * 100).toFixed(1)
        : '-';

    return (
        <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
            <td className="py-3 px-4 text-sm text-gray-500 font-medium">{index}</td>
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
                    <p className="font-medium text-gray-900">{studentName}</p>
                    {student.student_code && (
                        <p className="text-xs text-gray-500">{student.student_code}</p>
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
                    onChange={(e) => onScoreChange(studentId, e.target.value, gradeMaxScore)}
                    disabled={isLocked}
                    placeholder="--"
                    className={cn(
                        'w-full h-10 text-center rounded-lg border bg-white px-3 text-sm',
                        'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent',
                        isLocked
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200'
                            : 'border-slate-200 hover:border-slate-300'
                    )}
                />
            </td>
            <td className="py-3 px-4 text-center text-sm text-gray-600">
                {gradeMaxScore}
            </td>
            <td className="py-3 px-4 text-center">
                <span className={cn(
                    'text-sm font-medium',
                    percentage !== '-' && parseFloat(percentage) >= 50
                        ? 'text-emerald-600'
                        : percentage !== '-'
                            ? 'text-red-600'
                            : 'text-gray-400'
                )}>
                    {percentage !== '-' ? `${percentage}%` : '-'}
                </span>
            </td>
            <td className="py-3 px-4">
                <input
                    type="text"
                    value={grade?.notes || ''}
                    disabled={isLocked}
                    placeholder="Ghi chú..."
                    className={cn(
                        'w-full h-10 rounded-lg border bg-white px-3 text-sm',
                        'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent',
                        isLocked
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200'
                            : 'border-slate-200 hover:border-slate-300'
                    )}
                />
            </td>
        </tr>
    );
}

function LockConfirmModal({ gradeType, onConfirm, onCancel, loading }) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="h-8 w-8 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Xác nhận khóa điểm
                    </h3>
                    <p className="text-gray-600 mb-6">
                        Bạn có chắc muốn khóa điểm <strong>{gradeType?.label}</strong>?
                        Sau khi khóa, bạn sẽ không thể chỉnh sửa điểm này nữa.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                        <Button
                            variant="outline"
                            onClick={onCancel}
                            disabled={loading}
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={onConfirm}
                            disabled={loading}
                            className="bg-red-500 hover:bg-red-600 text-white"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Đang khóa...
                                </>
                            ) : (
                                <>
                                    <Lock className="h-4 w-4 mr-2" />
                                    Khóa điểm
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TeacherGradebookPage;

