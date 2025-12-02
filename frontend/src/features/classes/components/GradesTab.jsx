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
        <LoadingState />
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
        <h3 className="text-lg font-semibold text-slate-900">Bảng điểm</h3>
        <p className="text-sm text-slate-500">
          {summary.graded_count}/{summary.total_students} học viên đã có điểm
        </p>
      </div>
      <div className="flex items-center gap-3">
        {hasPendingChanges && (
          <span className="text-sm text-amber-600">
            {pendingCount} thay đổi chưa lưu
          </span>
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
    <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-300">
      <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
      <p className="text-slate-600 font-medium">Chưa có cấu trúc điểm</p>
      <p className="text-sm text-slate-400 mt-1">
        Khóa học này chưa được thiết lập cột điểm.<br />
        Vui lòng liên hệ Admin để cấu hình.
      </p>
    </div>
  );
}

function NoStudentsState() {
  return (
    <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-300">
      <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
      <p className="text-slate-600 font-medium">Chưa có học viên</p>
      <p className="text-sm text-slate-400 mt-1">
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
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
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
  showToast
}) {
  const weightedAvg = calculateWeightedAverage(student.enrollment_id);
  
  return (
    <tr className="hover:bg-slate-50 transition-colors">
      {/* Index */}
      <td className="px-3 py-3 text-sm text-slate-500">{index + 1}</td>
      
      {/* Student Info */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar name={student.student_name} size="sm" url={student.avatar_url} />
          <div>
            <p className="text-sm font-medium text-slate-900">{student.student_name}</p>
            <p className="text-xs text-slate-500">{student.student_email}</p>
          </div>
        </div>
      </td>
      
      {/* Grade Cells */}
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
              showToast(result.message, result.success ? 'error' : 'error');
            }
          }}
          onCancel={() => onEditCell(null)}
        />
      ))}
      
      {/* Weighted Average */}
      <td className="px-3 py-3 text-center bg-indigo-50">
        <span className={`text-sm font-semibold ${
          weightedAvg !== null
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
        className={`w-16 px-2 py-1.5 text-sm rounded transition-colors ${
          currentScore !== '' && currentScore !== null
            ? isPending 
              ? 'bg-amber-100 text-amber-700 font-medium' 
              : 'bg-slate-100 text-slate-700 font-medium'
            : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
        }`}
      >
        {currentScore !== '' && currentScore !== null ? currentScore : '—'}
      </button>
    </td>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-4 pt-2 text-sm text-slate-500">
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
        <span>≥ {GRADE_PASS_THRESHOLD}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700">Trượt</span>
        <span>&lt; {GRADE_PASS_THRESHOLD}</span>
      </div>
      <span className="text-slate-400 ml-auto">
        💡 Click vào ô điểm để chỉnh sửa
      </span>
    </div>
  );
}
