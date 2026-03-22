/**
 * GradesTab Component
 * Displays grade matrix with inline editing (Excel-like)
 */

import {
  GraduationCap,
  Users,
  CheckCircle2,
  X,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from './Avatar';
import { GradesTableSkeleton } from './Skeleton';
import { GRADE_PASS_THRESHOLD } from '../utils';

export function GradesTab({
  gradeStructures,
  gradeMatrix,
  loading,
  saving,
  gradesSummary,
  editingCell,
  pendingGrades,
  hasPendingChanges,
  onEditCell,
  onSaveAll,
  getDisplayScore,
  calculateWeightedAverage,
  processGradeInput,
  isCellPending,
  showToast
}) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <Header
        summary={gradesSummary}
        hasPendingChanges={hasPendingChanges}
        pendingCount={Object.keys(pendingGrades).length}
        saving={saving}
        onSave={onSaveAll}
      />

      {/* Content */}
      {loading ? (
        <GradesTableSkeleton rows={8} columns={gradeStructures.length || 3} />
      ) : gradeStructures.length === 0 ? (
        <NoStructureState />
      ) : gradeMatrix.length === 0 ? (
        <NoStudentsState />
      ) : (
        <>
          <GradeTable
            structures={gradeStructures}
            students={gradeMatrix}
            editingCell={editingCell}
            onEditCell={onEditCell}
            getDisplayScore={getDisplayScore}
            calculateWeightedAverage={calculateWeightedAverage}
            processGradeInput={processGradeInput}
            isCellPending={isCellPending}
            showToast={showToast}
          />
          <Legend />
        </>
      )}
    </div>
  );
}

// Sub-components
function Header({ summary, hasPendingChanges, pendingCount, saving, onSave }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Bảng điểm</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {summary.graded_count}/{summary.total_students} học viên đã có điểm
        </p>
      </div>
      <div className="flex items-center gap-3">
        {hasPendingChanges && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
              {pendingCount} thay đổi chưa lưu
            </span>
          </div>
        )}
        <Button
          onClick={onSave}
          disabled={!hasPendingChanges || saving}
          className="gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang lưu...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Lưu bảng điểm
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
    </div>
  );
}

function NoStructureState() {
  return (
    <div className="text-center py-12 bg-white dark:bg-zinc-900 shadow-md rounded-lg border border-dashed border-slate-300 dark:border-zinc-800">
      <GraduationCap className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
      <p className="text-slate-600 dark:text-slate-400 font-medium">Chưa có cấu trúc điểm</p>
      <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
        Khóa học này chưa được thiết lập cột điểm.<br />
        Vui lòng liên hệ Admin để cấu hình.
      </p>
    </div>
  );
}

function NoStudentsState() {
  return (
    <div className="text-center py-12 bg-white dark:bg-zinc-900 shadow-md rounded-lg border border-dashed border-slate-300 dark:border-zinc-800">
      <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
      <p className="text-slate-600 dark:text-slate-400 font-medium">Chưa có học viên</p>
      <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
        Lớp này chưa có học viên ghi danh.
      </p>
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
  showToast
}) {
  // Navigate between cells
  const handleCellNavigate = (currentEnrollmentId, currentStructureIndex, direction) => {
    const studentIndex = students.findIndex(s => s.enrollment_id === currentEnrollmentId);
    if (studentIndex === -1) return;

    let newStudentIndex = studentIndex;
    let newStructureIndex = currentStructureIndex;

    switch (direction) {
      case 'next':
        if (currentStructureIndex < structures.length - 1) {
          newStructureIndex = currentStructureIndex + 1;
        } else if (studentIndex < students.length - 1) {
          newStudentIndex = studentIndex + 1;
          newStructureIndex = 0;
        }
        break;
      case 'prev':
        if (currentStructureIndex > 0) {
          newStructureIndex = currentStructureIndex - 1;
        } else if (studentIndex > 0) {
          newStudentIndex = studentIndex - 1;
          newStructureIndex = structures.length - 1;
        }
        break;
      case 'down':
        if (studentIndex < students.length - 1) {
          newStudentIndex = studentIndex + 1;
        }
        break;
      case 'up':
        if (studentIndex > 0) {
          newStudentIndex = studentIndex - 1;
        }
        break;
    }

    // Only navigate if position changed
    if (newStudentIndex !== studentIndex || newStructureIndex !== currentStructureIndex) {
      const newStudent = students[newStudentIndex];
      const newStructure = structures[newStructureIndex];
      onEditCell({ enrollment_id: newStudent.enrollment_id, structure_id: newStructure.id });
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 shadow-md border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-full whitespace-nowrap md:whitespace-normal">
          <thead className="bg-slate-50 dark:bg-zinc-800/50 border-b border-slate-200 dark:border-zinc-800">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide w-12">#</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide min-w-[200px]">Học viên</th>
              {structures.map(structure => (
                <th key={structure.id} className="px-3 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide min-w-[100px]">
                  <div>{structure.name}</div>
                  <div className="text-[10px] font-normal text-slate-400 dark:text-slate-500 mt-0.5">
                    {Math.round(structure.weight * 100)}% • Max {structure.max_score}
                  </div>
                </th>
              ))}
              <th className="px-3 py-3 text-center text-xs font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wide min-w-[90px] bg-indigo-50 dark:bg-indigo-950/40">Tổng kết</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide min-w-[80px]">Kết quả</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
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
                onCellNavigate={handleCellNavigate}
              />
            ))}
          </tbody>
        </table>
      </div>
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
  onCellNavigate
}) {
  const weightedAvg = calculateWeightedAverage(student.enrollment_id);

  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
      {/* Index */}
      <td className="px-3 py-3 text-sm text-slate-500 dark:text-slate-400">{index + 1}</td>

      {/* Student Info */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar name={student.student_name} size="sm" url={student.avatar_url} />
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{student.student_name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{student.student_email}</p>
          </div>
        </div>
      </td>

      {/* Grade Cells */}
      {structures.map((structure, structureIndex) => (
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
              showToast(result.message, result.success ? 'error' : 'error');
            }
          }}
          onCancel={() => onEditCell(null)}
          onNavigate={(direction) => onCellNavigate(student.enrollment_id, structureIndex, direction)}
        />
      ))}

      {/* Weighted Average */}
      <td className="px-3 py-3 text-center bg-indigo-50 dark:bg-indigo-950/40">
        <span className={`text-sm font-semibold ${weightedAvg !== null
          ? weightedAvg >= 8
            ? 'text-emerald-600'
            : weightedAvg >= GRADE_PASS_THRESHOLD
              ? 'text-indigo-600'
              : 'text-red-600'
          : 'text-slate-400'
          }`}>
          {weightedAvg !== null ? weightedAvg.toFixed(2) : '—'}
        </span>
      </td>

      {/* Pass/Fail */}
      <td className="px-3 py-3 text-center">
        {weightedAvg !== null ? (
          weightedAvg >= GRADE_PASS_THRESHOLD ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              Đậu
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
              <X className="w-3 h-3" />
              Trượt
            </span>
          )
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )}
      </td>
    </tr>
  );
}

function GradeCell({ enrollmentId, structure, isEditing, isPending, currentScore, onEdit, onBlur, onCancel, onNavigate }) {
  if (isEditing) {
    return (
      <td className="px-2 py-2 text-center">
        <input
          type="number"
          min="0"
          max={structure.max_score}
          step="0.25"
          autoFocus
          className="w-16 px-2 py-1 text-center text-sm border border-indigo-400 dark:border-indigo-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-zinc-900 dark:text-slate-100"
          defaultValue={currentScore}
          onKeyDown={(e) => {
            // Allow numeric input
            if (!/[\d.]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter', 'Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
              e.preventDefault();
            }
            // Enter = save and blur
            if (e.key === 'Enter') {
              e.target.blur();
            }
            // Escape = cancel
            if (e.key === 'Escape') {
              onCancel();
            }
            // Tab = save and go to next cell
            if (e.key === 'Tab') {
              e.preventDefault();
              onBlur(e.target.value);
              onNavigate && onNavigate(e.shiftKey ? 'prev' : 'next');
            }
            // Arrow keys for navigation
            if (e.key === 'ArrowRight' && e.target.selectionStart === e.target.value.length) {
              e.preventDefault();
              onBlur(e.target.value);
              onNavigate && onNavigate('next');
            }
            if (e.key === 'ArrowLeft' && e.target.selectionStart === 0) {
              e.preventDefault();
              onBlur(e.target.value);
              onNavigate && onNavigate('prev');
            }
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              onBlur(e.target.value);
              onNavigate && onNavigate('down');
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              onBlur(e.target.value);
              onNavigate && onNavigate('up');
            }
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
        className={`w-16 px-2 py-1.5 text-sm rounded transition-colors ${currentScore !== '' && currentScore !== null
          ? isPending
            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium'
            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium'
          : 'bg-slate-50 dark:bg-zinc-800 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-700'
        }`}
      >
        {currentScore !== '' && currentScore !== null ? currentScore : '—'}
      </button>
    </td>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-4 pt-2 text-sm text-slate-500 dark:text-slate-400">
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-700 border dark:border-slate-600" />
        <span>Đã lưu</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 rounded bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700" />
        <span>Chưa lưu</span>
      </div>
      <div className="border-l border-slate-300 dark:border-slate-600 h-4 mx-1" />
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">Đậu</span>
        <span>≥ {GRADE_PASS_THRESHOLD}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">Trượt</span>
        <span>&lt; {GRADE_PASS_THRESHOLD}</span>
      </div>
      <span className="text-slate-400 dark:text-slate-500 ml-auto">
        💡 Click vào ô điểm để chỉnh sửa • Tab/Shift+Tab hoặc phím mũi tên để di chuyển
      </span>
    </div>
  );
}
