/**
 * StudentTransferModal Component
 * Interface for transferring students between classes
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import {
  X,
  ArrowRight,
  Search,
  Users,
  UserMinus,
  CheckSquare,
  Square,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowLeftRight,
  GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function StudentTransferModal({
  show,
  onClose,
  classId,
  students,
  onSuccess
}) {
  const { session } = useAuth();
  
  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json'
  });
  
  const isOpen = show;
  const sourceClassId = classId;
  const sourceClassName = '';
  const sourceStudents = students || [];
  const onTransferSuccess = onSuccess;
  // State
  const [step, setStep] = useState('select-students'); // select-students, select-class, confirm
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [targetClassId, setTargetClassId] = useState('');
  const [availableClasses, setAvailableClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [classSearchQuery, setClassSearchQuery] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [result, setResult] = useState(null);
  const [keepInOriginal, setKeepInOriginal] = useState(false); // Copy instead of transfer

  // Fetch available classes for transfer
  const fetchClasses = useCallback(async () => {
    setLoadingClasses(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/classes?limit=100`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) throw new Error('Failed to fetch classes');
      
      const data = await response.json();
      // Exclude current class
      const filteredClasses = (data.data || []).filter(c => c.id !== sourceClassId);
      setAvailableClasses(filteredClasses);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoadingClasses(false);
    }
  }, [getAuthHeaders, sourceClassId]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep('select-students');
      setSelectedStudentIds([]);
      setTargetClassId('');
      setResult(null);
      setSearchQuery('');
      setClassSearchQuery('');
      setKeepInOriginal(false);
      fetchClasses();
    }
  }, [isOpen, fetchClasses]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return sourceStudents;
    const query = searchQuery.toLowerCase();
    return sourceStudents.filter(s => 
      s.full_name?.toLowerCase().includes(query) ||
      s.email?.toLowerCase().includes(query)
    );
  }, [sourceStudents, searchQuery]);

  // Filtered classes
  const filteredClasses = useMemo(() => {
    if (!classSearchQuery.trim()) return availableClasses;
    const query = classSearchQuery.toLowerCase();
    return availableClasses.filter(c => 
      c.name?.toLowerCase().includes(query) ||
      c.code?.toLowerCase().includes(query) ||
      c.course_name?.toLowerCase().includes(query)
    );
  }, [availableClasses, classSearchQuery]);

  // Selected students data
  const selectedStudents = useMemo(() => {
    return sourceStudents.filter(s => selectedStudentIds.includes(s.student_id || s.id));
  }, [sourceStudents, selectedStudentIds]);

  // Target class data
  const targetClass = useMemo(() => {
    return availableClasses.find(c => c.id === targetClassId);
  }, [availableClasses, targetClassId]);

  // Selection handlers
  const toggleSelect = useCallback((studentId) => {
    setSelectedStudentIds(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    const allIds = filteredStudents.map(s => s.student_id || s.id);
    if (allIds.every(id => selectedStudentIds.includes(id))) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(allIds);
    }
  }, [filteredStudents, selectedStudentIds]);

  // Transfer logic
  const handleTransfer = async () => {
    if (selectedStudentIds.length === 0 || !targetClassId) return;
    
    setTransferring(true);
    setResult(null);

    const results = {
      enrolled: 0,
      removed: 0,
      errors: []
    };

    try {
      // Step 1: Enroll students in target class
      for (const studentId of selectedStudentIds) {
        try {
          const enrollResponse = await fetch(`${API_URL}/api/admin/classes/${targetClassId}/students`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ student_id: studentId })
          });

          if (enrollResponse.ok) {
            results.enrolled++;
          } else {
            const error = await enrollResponse.json();
            // If already enrolled, count as success
            if (error.message?.includes('đã ghi danh') || error.message?.includes('already')) {
              results.enrolled++;
            } else {
              throw new Error(error.message);
            }
          }
        } catch (error) {
          const student = sourceStudents.find(s => (s.student_id || s.id) === studentId);
          results.errors.push({
            student: student?.full_name || studentId,
            error: `Thêm vào lớp mới: ${error.message}`
          });
        }
      }

      // Step 2: Remove from source class (if not keeping in original)
      if (!keepInOriginal && results.enrolled > 0) {
        for (const studentId of selectedStudentIds) {
          try {
            const removeResponse = await fetch(
              `${API_URL}/api/admin/classes/${sourceClassId}/students/${studentId}`,
              {
                method: 'DELETE',
                headers: getAuthHeaders()
              }
            );

            if (removeResponse.ok) {
              results.removed++;
            }
          } catch (error) {
            // Non-critical error - student is already in new class
            console.warn('Error removing from source:', error);
          }
        }
      }

      setResult(results);
      
      if (results.enrolled > 0) {
        onTransferSuccess?.();
      }
    } catch (error) {
      setResult({
        enrolled: 0,
        removed: 0,
        errors: [{ student: 'Hệ thống', error: error.message }]
      });
    } finally {
      setTransferring(false);
    }
  };

  const handleClose = () => {
    setStep('select-students');
    setSelectedStudentIds([]);
    setTargetClassId('');
    setResult(null);
    onClose();
  };

  // Navigation
  const canProceedToClassSelect = selectedStudentIds.length > 0;
  const canProceedToConfirm = targetClassId !== '';

  const allSelected = filteredStudents.length > 0 && 
    filteredStudents.every(s => selectedStudentIds.includes(s.student_id || s.id));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-blue-500 to-indigo-500 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <ArrowLeftRight className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {keepInOriginal ? 'Sao chép học viên' : 'Chuyển học viên'}
              </h2>
              <p className="text-sm text-white/80">
                Từ lớp: {sourceClassName}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 p-4 border-b border-slate-200 bg-slate-50">
          <StepIndicator
            number={1}
            label="Chọn học viên"
            active={step === 'select-students'}
            completed={step !== 'select-students'}
          />
          <div className="w-8 h-0.5 bg-slate-300" />
          <StepIndicator
            number={2}
            label="Chọn lớp đích"
            active={step === 'select-class'}
            completed={step === 'confirm'}
          />
          <div className="w-8 h-0.5 bg-slate-300" />
          <StepIndicator
            number={3}
            label="Xác nhận"
            active={step === 'confirm'}
            completed={result !== null}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Step 1: Select Students */}
          {step === 'select-students' && (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm học viên..."
                  className="pl-10"
                />
              </div>

              {/* Select All */}
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg"
              >
                {allSelected ? (
                  <CheckSquare className="w-5 h-5 text-blue-600" />
                ) : (
                  <Square className="w-5 h-5 text-slate-400" />
                )}
                Chọn tất cả ({filteredStudents.length})
              </button>

              {/* Student List */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {filteredStudents.map(student => (
                  <div
                    key={student.student_id || student.id}
                    onClick={() => toggleSelect(student.student_id || student.id)}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                      ${selectedStudentIds.includes(student.student_id || student.id)
                        ? 'bg-blue-50 border-blue-300'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                      }
                    `}
                  >
                    {selectedStudentIds.includes(student.student_id || student.id) ? (
                      <CheckSquare className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400" />
                    )}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-medium text-sm">
                      {student.full_name?.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{student.full_name}</p>
                      <p className="text-sm text-slate-500">{student.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Select Target Class */}
          {step === 'select-class' && (
            <div className="space-y-4">
              {/* Options */}
              <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={keepInOriginal}
                    onChange={(e) => setKeepInOriginal(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">
                    Giữ lại trong lớp gốc (sao chép thay vì chuyển)
                  </span>
                </label>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  value={classSearchQuery}
                  onChange={(e) => setClassSearchQuery(e.target.value)}
                  placeholder="Tìm lớp đích..."
                  className="pl-10"
                />
              </div>

              {/* Class List */}
              {loadingClasses ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {filteredClasses.map(cls => (
                    <div
                      key={cls.id}
                      onClick={() => setTargetClassId(cls.id)}
                      className={`
                        flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                        ${targetClassId === cls.id
                          ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/20'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                        }
                      `}
                    >
                      <div className={`
                        w-10 h-10 rounded-lg flex items-center justify-center
                        ${targetClassId === cls.id ? 'bg-blue-500' : 'bg-slate-100'}
                      `}>
                        <GraduationCap className={`w-5 h-5 ${targetClassId === cls.id ? 'text-white' : 'text-slate-500'}`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{cls.name}</p>
                        <p className="text-sm text-slate-500">
                          {cls.course_name} • {cls.current_students || 0}/{cls.max_students || '∞'} học viên
                        </p>
                      </div>
                      {targetClassId === cls.id && (
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 'confirm' && !result && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-3">
                  {keepInOriginal ? 'Xác nhận sao chép' : 'Xác nhận chuyển'}
                </h4>
                <div className="flex items-center gap-4">
                  <div className="flex-1 p-3 bg-white rounded-lg">
                    <p className="text-sm text-slate-500">Từ lớp</p>
                    <p className="font-medium text-slate-900">{sourceClassName}</p>
                  </div>
                  <ArrowRight className="w-6 h-6 text-blue-500" />
                  <div className="flex-1 p-3 bg-white rounded-lg">
                    <p className="text-sm text-slate-500">Đến lớp</p>
                    <p className="font-medium text-slate-900">{targetClass?.name}</p>
                  </div>
                </div>
              </div>

              {/* Students to transfer */}
              <div className="p-4 bg-slate-50 rounded-xl">
                <h4 className="font-medium text-slate-900 mb-2">
                  Học viên được {keepInOriginal ? 'sao chép' : 'chuyển'} ({selectedStudents.length})
                </h4>
                <div className="max-h-[200px] overflow-y-auto space-y-1">
                  {selectedStudents.map(student => (
                    <div key={student.student_id || student.id} className="flex items-center gap-2 text-sm text-slate-600">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-medium">
                        {student.full_name?.charAt(0)}
                      </div>
                      {student.full_name}
                    </div>
                  ))}
                </div>
              </div>

              {!keepInOriginal && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-amber-900">Lưu ý</h4>
                      <p className="text-sm text-amber-700">
                        Học viên sẽ bị xóa khỏi lớp "{sourceClassName}" sau khi chuyển.
                        Dữ liệu điểm danh và thanh toán sẽ được giữ nguyên ở lớp cũ.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl ${result.enrolled > 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-start gap-3">
                  {result.enrolled > 0 ? (
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  )}
                  <div>
                    <h4 className={`text-lg font-semibold ${result.enrolled > 0 ? 'text-emerald-900' : 'text-red-900'}`}>
                      {result.enrolled > 0 
                        ? `${keepInOriginal ? 'Sao chép' : 'Chuyển'} thành công!`
                        : 'Không thể thực hiện'
                      }
                    </h4>
                    <p className="text-sm mt-1 text-slate-600">
                      {result.enrolled > 0 && (
                        <>Đã thêm {result.enrolled} học viên vào lớp mới.</>
                      )}
                      {result.removed > 0 && !keepInOriginal && (
                        <> Đã xóa {result.removed} học viên khỏi lớp cũ.</>
                      )}
                    </p>
                    {result.errors.length > 0 && (
                      <div className="mt-2 text-sm text-red-700">
                        <p className="font-medium">Lỗi ({result.errors.length}):</p>
                        {result.errors.map((e, i) => (
                          <p key={i}>• {e.student}: {e.error}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50 flex-shrink-0">
          <div>
            {step !== 'select-students' && !result && (
              <Button
                variant="outline"
                onClick={() => setStep(step === 'confirm' ? 'select-class' : 'select-students')}
              >
                Quay lại
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleClose}>
              {result ? 'Đóng' : 'Hủy'}
            </Button>
            
            {step === 'select-students' && (
              <Button
                onClick={() => setStep('select-class')}
                disabled={!canProceedToClassSelect}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Tiếp tục ({selectedStudentIds.length} học viên)
              </Button>
            )}

            {step === 'select-class' && (
              <Button
                onClick={() => setStep('confirm')}
                disabled={!canProceedToConfirm}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Xem lại
              </Button>
            )}

            {step === 'confirm' && !result && (
              <Button
                onClick={handleTransfer}
                disabled={transferring}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {transferring ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <ArrowLeftRight className="w-4 h-4 mr-2" />
                    {keepInOriginal ? 'Sao chép' : 'Chuyển'}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Step Indicator Component
function StepIndicator({ number, label, active, completed }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
        ${completed 
          ? 'bg-blue-500 text-white' 
          : active 
            ? 'bg-blue-500 text-white' 
            : 'bg-slate-200 text-slate-500'
        }
      `}>
        {completed ? <CheckCircle className="w-4 h-4" /> : number}
      </div>
      <span className={`text-sm ${active || completed ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>
        {label}
      </span>
    </div>
  );
}

export default StudentTransferModal;
