/**
 * GradesPage - Trang quản lý điểm số
 * Features:
 * - Class selector dropdown
 * - Excel-like grade matrix
 * - Bulk save
 * - Export CSV/JSON/Excel
 * - Statistics cards
 * - Student transcript modal
 */

import { useEffect, useState } from 'react';
import {
    GraduationCap,
    Users,
    CheckCircle2,
    X,
    Loader2,
    Save,
    Download,
    FileSpreadsheet,
    FileJson,
    FileText,
    ChevronDown,
    AlertCircle,
    BarChart3,
    TrendingUp,
    Target,
    Trophy,
    Eye
} from 'lucide-react';
import { useGradesAdmin } from '../hooks/useGradesAdmin';
import { StudentTranscriptModal } from '../components/StudentTranscriptModal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Avatar component (simple)
function Avatar({ name, url, size = 'sm' }) {
    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base'
    };

    if (url) {
        return (
            <img
                src={url}
                alt={name}
                className={cn('rounded-full object-cover', sizeClasses[size])}
            />
        );
    }

    const initials = name
        ?.split(' ')
        .map(n => n[0])
        .slice(-2)
        .join('')
        .toUpperCase() || '?';

    return (
        <div className={cn(
            'rounded-full bg-gradient-to-br from-indigo-500 to-purple-600',
            'flex items-center justify-center text-white font-medium',
            sizeClasses[size]
        )}>
            {initials}
        </div>
    );
}

// Toast notification
function Toast({ message, type, onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={cn(
            'fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50',
            'animate-in slide-in-from-bottom-2',
            type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        )}>
            {type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{message}</span>
        </div>
    );
}

export default function GradesPage() {
    const {
        classes,
        selectedClassId,
        loadingClasses,
        fetchClasses,
        selectClass,
        gradeStructures,
        gradeMatrix,
        loadingGrades,
        savingGrades,
        courseInfo,
        fetchGrades,
        editingCell,
        setEditingCell,
        hasPendingChanges,
        saveAllGrades,
        processGradeInput,
        clearPendingGrades,
        getDisplayScore,
        calculateWeightedAverage,
        isCellPending,
        statistics,
        GRADE_PASS_THRESHOLD,
        exportToCSV,
        exportToJSON,
        exportToExcel,
        pendingGrades
    } = useGradesAdmin();

    const [toast, setToast] = useState(null);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [transcriptStudent, setTranscriptStudent] = useState(null); // { id, name }

    // Initial load
    useEffect(() => {
        fetchClasses();
    }, [fetchClasses]);

    // Load grades when class selected
    useEffect(() => {
        if (selectedClassId) {
            fetchGrades(selectedClassId);
        }
    }, [selectedClassId, fetchGrades]);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    const handleSaveAll = async () => {
        const result = await saveAllGrades();
        showToast(
            result.success
                ? `Đã lưu ${result.count} điểm thành công`
                : result.message,
            result.success ? 'success' : 'error'
        );
    };

    const handleExport = (format) => {
        setShowExportMenu(false);
        let result;
        if (format === 'excel') {
            result = exportToExcel();
        } else if (format === 'csv') {
            result = exportToCSV();
        } else {
            result = exportToJSON();
        }
        if (result.success) {
            showToast(`Xuất file ${format.toUpperCase()} thành công`, 'success');
        } else {
            showToast(result.message, 'error');
        }
    };

    const selectedClass = classes.find(c => c.id === selectedClassId);

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
                <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-100 rounded-xl">
                                <GraduationCap className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900">Quản lý Điểm</h1>
                                <p className="text-sm text-slate-500">
                                    {courseInfo ? `${courseInfo.courseTitle} - ${courseInfo.classCode}` : 'Chọn lớp để xem bảng điểm'}
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            {/* Export Dropdown */}
                            {gradeMatrix.length > 0 && (
                                <div className="relative">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowExportMenu(!showExportMenu)}
                                        className="gap-2"
                                    >
                                        <Download className="w-4 h-4" />
                                        Xuất file
                                        <ChevronDown className={cn(
                                            'w-4 h-4 transition-transform',
                                            showExportMenu && 'rotate-180'
                                        )} />
                                    </Button>

                                    {showExportMenu && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-10"
                                                onClick={() => setShowExportMenu(false)}
                                            />
                                            <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                                                <button
                                                    onClick={() => handleExport('excel')}
                                                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                                                >
                                                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                                                    Xuất Excel (có style)
                                                </button>
                                                <button
                                                    onClick={() => handleExport('csv')}
                                                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                                                >
                                                    <FileText className="w-4 h-4 text-blue-600" />
                                                    Xuất CSV (đơn giản)
                                                </button>
                                                <button
                                                    onClick={() => handleExport('json')}
                                                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                                                >
                                                    <FileJson className="w-4 h-4 text-amber-600" />
                                                    Xuất JSON (Backup)
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Save Button */}
                            {hasPendingChanges && (
                                <Button
                                    onClick={handleSaveAll}
                                    disabled={savingGrades}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                                >
                                    {savingGrades ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Đang lưu...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Lưu ({Object.keys(pendingGrades).length})
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
                {/* Class Selector */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Chọn lớp học
                    </label>
                    <select
                        value={selectedClassId || ''}
                        onChange={(e) => selectClass(e.target.value)}
                        disabled={loadingClasses}
                        className="w-full max-w-md px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                        {loadingClasses ? (
                            <option>Đang tải...</option>
                        ) : classes.length === 0 ? (
                            <option value="">Không có lớp nào</option>
                        ) : (
                            <>
                                <option value="">-- Chọn lớp --</option>
                                {classes.map(cls => (
                                    <option key={cls.id} value={cls.id}>
                                        {cls.code} - {cls.name} ({cls.courses?.title}) - {cls.enrolled_count || 0} HV
                                    </option>
                                ))}
                            </>
                        )}
                    </select>
                </div>

                {/* Content */}
                {!selectedClassId ? (
                    <EmptyState message="Vui lòng chọn lớp học để xem bảng điểm" />
                ) : loadingGrades ? (
                    <LoadingState />
                ) : gradeStructures.length === 0 ? (
                    <NoStructureState courseTitle={courseInfo?.courseTitle} />
                ) : gradeMatrix.length === 0 ? (
                    <NoStudentsState />
                ) : (
                    <>
                        {/* Statistics Cards */}
                        <StatisticsCards statistics={statistics} passThreshold={GRADE_PASS_THRESHOLD} />

                        {/* Grade Table */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <GradeTable
                                structures={gradeStructures}
                                students={gradeMatrix}
                                editingCell={editingCell}
                                onEditCell={setEditingCell}
                                getDisplayScore={getDisplayScore}
                                calculateWeightedAverage={calculateWeightedAverage}
                                processGradeInput={processGradeInput}
                                isCellPending={isCellPending}
                                showToast={showToast}
                                passThreshold={GRADE_PASS_THRESHOLD}
                                onViewTranscript={setTranscriptStudent}
                            />
                        </div>

                        {/* Legend */}
                        <Legend passThreshold={GRADE_PASS_THRESHOLD} />
                    </>
                )}
            </div>

            {/* Toast */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {/* Student Transcript Modal */}
            <StudentTranscriptModal
                studentId={transcriptStudent?.id}
                studentName={transcriptStudent?.name}
                isOpen={!!transcriptStudent}
                onClose={() => setTranscriptStudent(null)}
            />
        </div>
    );
}

// === Sub Components ===

function StatisticsCards({ statistics, passThreshold }) {
    const cards = [
        {
            title: 'Tổng học viên',
            value: statistics.totalStudents,
            icon: Users,
            color: 'bg-blue-50 text-blue-600',
            iconBg: 'bg-blue-100'
        },
        {
            title: 'Đã chấm điểm',
            value: `${statistics.gradedCount}/${statistics.totalStudents}`,
            icon: Target,
            color: 'bg-indigo-50 text-indigo-600',
            iconBg: 'bg-indigo-100'
        },
        {
            title: 'Tỷ lệ đậu',
            value: `${statistics.passRate}%`,
            subtitle: `${statistics.passCount} đậu / ${statistics.failCount} trượt`,
            icon: TrendingUp,
            color: statistics.passRate >= 70 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600',
            iconBg: statistics.passRate >= 70 ? 'bg-emerald-100' : 'bg-amber-100'
        },
        {
            title: 'Điểm TB lớp',
            value: statistics.averageScore,
            subtitle: `Điểm đậu: ≥${passThreshold}`,
            icon: Trophy,
            color: parseFloat(statistics.averageScore) >= passThreshold ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600',
            iconBg: parseFloat(statistics.averageScore) >= passThreshold ? 'bg-emerald-100' : 'bg-red-100'
        }
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {cards.map((card, i) => (
                <div
                    key={i}
                    className={cn(
                        'rounded-xl p-4 border',
                        card.color
                    )}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium uppercase tracking-wide opacity-75">
                            {card.title}
                        </span>
                        <div className={cn('p-1.5 rounded-lg', card.iconBg)}>
                            <card.icon className="w-4 h-4" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold">{card.value}</p>
                    {card.subtitle && (
                        <p className="text-xs opacity-75 mt-1">{card.subtitle}</p>
                    )}
                </div>
            ))}
        </div>
    );
}

function GradeTable({
    structures,
    students,
    editingCell,
    onEditCell,
    getDisplayScore,
    calculateWeightedAverage,
    processGradeInput,
    isCellPending,
    showToast,
    passThreshold,
    onViewTranscript
}) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-full whitespace-nowrap md:whitespace-normal">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide w-12">#</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide min-w-[200px]">Học viên</th>
                        {structures.map(structure => (
                            <th key={structure.id} className="px-3 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wide min-w-[100px]">
                                <div>{structure.name}</div>
                                <div className="text-[10px] font-normal text-slate-400 mt-0.5">
                                    {Math.round(structure.weight * 100)}% • Max {structure.max_score}
                                </div>
                            </th>
                        ))}
                        <th className="px-3 py-3 text-center text-xs font-semibold text-indigo-700 uppercase tracking-wide min-w-[90px] bg-indigo-50">Tổng kết</th>
                        <th className="px-3 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wide min-w-[80px]">Kết quả</th>
                        <th className="px-3 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wide w-12"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {students.map((student, index) => (
                        <StudentRow
                            key={student.enrollment_id}
                            student={student}
                            index={index}
                            structures={structures}
                            editingCell={editingCell}
                            onEditCell={onEditCell}
                            getDisplayScore={getDisplayScore}
                            calculateWeightedAverage={calculateWeightedAverage}
                            processGradeInput={processGradeInput}
                            isCellPending={isCellPending}
                            showToast={showToast}
                            passThreshold={passThreshold}
                            onViewTranscript={onViewTranscript}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function StudentRow({
    student,
    index,
    structures,
    editingCell,
    onEditCell,
    getDisplayScore,
    calculateWeightedAverage,
    processGradeInput,
    isCellPending,
    showToast,
    passThreshold,
    onViewTranscript
}) {
    const weightedAvg = calculateWeightedAverage(student.enrollment_id);

    return (
        <tr className="hover:bg-slate-50 transition-colors">
            <td className="px-3 py-3 text-sm text-slate-500">{index + 1}</td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                    <Avatar name={student.student_name} size="sm" url={student.avatar_url} />
                    <div>
                        <p className="text-sm font-medium text-slate-900">{student.student_name}</p>
                        <p className="text-xs text-slate-500">{student.student_email}</p>
                    </div>
                </div>
            </td>

            {structures.map(structure => (
                <GradeCell
                    key={structure.id}
                    enrollmentId={student.enrollment_id}
                    structure={structure}
                    isEditing={editingCell?.enrollment_id === student.enrollment_id && editingCell?.structure_id === structure.id}
                    isPending={isCellPending(student.enrollment_id, structure.id)}
                    currentScore={getDisplayScore(student.enrollment_id, structure.id)}
                    onEdit={() => onEditCell({ enrollment_id: student.enrollment_id, structure_id: structure.id })}
                    onBlur={(value) => {
                        const result = processGradeInput(student.enrollment_id, structure.id, value, structure.max_score);
                        if (result.message) {
                            showToast(result.message, 'error');
                        }
                    }}
                    onCancel={() => onEditCell(null)}
                />
            ))}

            <td className="px-3 py-3 text-center bg-indigo-50">
                <span className={cn(
                    'text-sm font-semibold',
                    weightedAvg !== null
                        ? weightedAvg >= 8
                            ? 'text-emerald-600'
                            : weightedAvg >= passThreshold
                                ? 'text-indigo-600'
                                : 'text-red-600'
                        : 'text-slate-400'
                )}>
                    {weightedAvg !== null ? weightedAvg.toFixed(2) : '—'}
                </span>
            </td>

            <td className="px-3 py-3 text-center">
                {weightedAvg !== null ? (
                    weightedAvg >= passThreshold ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            <CheckCircle2 className="w-3 h-3" />
                            Đậu
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            <X className="w-3 h-3" />
                            Trượt
                        </span>
                    )
                ) : (
                    <span className="text-xs text-slate-400">—</span>
                )}
            </td>

            {/* View Transcript button */}
            <td className="px-2 py-3 text-center">
                <button
                    onClick={() => onViewTranscript({ id: student.student_id, name: student.student_name })}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Xem bảng điểm tổng hợp"
                >
                    <Eye className="w-4 h-4" />
                </button>
            </td>
        </tr>
    );
}

function GradeCell({ enrollmentId, structure, isEditing, isPending, currentScore, onEdit, onBlur, onCancel }) {
    if (isEditing) {
        return (
            <td className="px-2 py-2 text-center">
                <input
                    type="number"
                    min="0"
                    max={structure.max_score}
                    step="0.25"
                    autoFocus
                    className="w-16 px-2 py-1 text-center text-sm border border-indigo-400 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    defaultValue={currentScore}
                    onKeyDown={(e) => {
                        if (!/[\d.]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter', 'Escape', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                            e.preventDefault();
                        }
                        if (e.key === 'Enter') e.target.blur();
                        if (e.key === 'Escape') onCancel();
                    }}
                    onBlur={(e) => onBlur(e.target.value)}
                />
            </td>
        );
    }

    return (
        <td className="px-2 py-2 text-center">
            <button
                onClick={onEdit}
                className={cn(
                    'w-16 px-2 py-1.5 text-sm rounded transition-colors',
                    currentScore !== '' && currentScore !== null
                        ? isPending
                            ? 'bg-amber-100 text-amber-700 font-medium'
                            : 'bg-slate-100 text-slate-700 font-medium'
                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                )}
            >
                {currentScore !== '' && currentScore !== null ? currentScore : '—'}
            </button>
        </td>
    );
}

function EmptyState({ message }) {
    return (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
            <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">{message}</p>
        </div>
    );
}

function LoadingState() {
    return (
        <div className="flex items-center justify-center py-16 bg-white rounded-xl">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <span className="ml-3 text-slate-600">Đang tải bảng điểm...</span>
        </div>
    );
}

function NoStructureState({ courseTitle }) {
    return (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
            <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">Chưa có cấu trúc điểm</p>
            <p className="text-sm text-slate-400 mt-2">
                Khóa học "{courseTitle}" chưa được thiết lập cột điểm.<br />
                Vui lòng vào phần Khóa học để cấu hình cột điểm.
            </p>
        </div>
    );
}

function NoStudentsState() {
    return (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">Chưa có học viên</p>
            <p className="text-sm text-slate-400 mt-2">
                Lớp này chưa có học viên ghi danh.
            </p>
        </div>
    );
}

function Legend({ passThreshold }) {
    return (
        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-slate-200 text-sm text-slate-500">
            <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-slate-100 border" />
                <span>Đã lưu</span>
            </div>
            <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-amber-100 border border-amber-300" />
                <span>Chưa lưu</span>
            </div>
            <div className="border-l border-slate-300 h-4 mx-1" />
            <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700">Đậu</span>
                <span>≥ {passThreshold}</span>
            </div>
            <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700">Trượt</span>
                <span>&lt; {passThreshold}</span>
            </div>
            <span className="text-slate-400 ml-auto">
                💡 Click vào ô điểm để chỉnh sửa • Enter để lưu • Esc để hủy
            </span>
        </div>
    );
}
