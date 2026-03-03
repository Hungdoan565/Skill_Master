/**
 * AddStudentModal Component
 * Modal for searching and enrolling students to class
 */

import { Loader2, Search, X, AlertCircle, Users, Mail, Phone, Plus, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from './Avatar';
import { MIN_SEARCH_LENGTH } from '../utils';
import { useState } from 'react';

export function AddStudentModal({
  show,
  onClose,
  searchQuery,
  onSearch,
  searchResults,
  searching,
  resultType,
  enrolling,
  onEnroll,
  onBatchEnroll,
  defaultTuitionFee = 0
}) {
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [batchEnrolling, setBatchEnrolling] = useState(false);

  const toggleStudent = (studentId) => {
    setSelectedIds(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleBatchEnroll = async () => {
    if (selectedIds.length === 0) return;
    console.log('[AddStudentModal] Batch enrolling students:', selectedIds);
    console.log('[AddStudentModal] Available students:', searchResults.map(s => ({ id: s.id, name: s.full_name })));
    setBatchEnrolling(true);
    try {
      await onBatchEnroll(selectedIds, defaultTuitionFee);
      setSelectedIds([]);
      setBatchMode(false);
    } catch (error) {
      console.error('[AddStudentModal] Batch enroll failed:', error);
    } finally {
      setBatchEnrolling(false);
    }
  };

  const handleClose = () => {
    setSelectedIds([]);
    setBatchMode(false);
    onClose();
  };
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900">Thêm học viên vào lớp</h3>
            {batchMode && (
              <p className="text-sm text-blue-600 mt-1">
                ✓ Đã chọn {selectedIds.length} học viên
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Tìm theo tên, email hoặc số điện thoại..."
              className="pl-10"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => onSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-200 rounded"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-slate-500">
              💡 Nhập ít nhất {MIN_SEARCH_LENGTH} ký tự để tìm kiếm. Học viên đã trong lớp sẽ tự động bị loại trừ.
            </p>
            <label className="flex items-center gap-2 text-sm text-blue-600 cursor-pointer">
              <input
                type="checkbox"
                checked={batchMode}
                onChange={(e) => {
                  setBatchMode(e.target.checked);
                  if (!e.target.checked) setSelectedIds([]);
                }}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              Chọn nhiều
            </label>
          </div>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto p-4 max-h-[350px]">
          {searching ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
              <p className="text-sm text-slate-500">Đang tải...</p>
            </div>
          ) : searchResults.length === 0 ? (
            <EmptyState
              hasSearchQuery={searchQuery.length >= MIN_SEARCH_LENGTH}
              resultType={resultType}
            />
          ) : (
            <div className="space-y-2">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-slate-500">
                  {resultType === 'recent' ? (
                    <>🕐 Học viên mới đăng ký ({searchResults.length})</>
                  ) : (
                    <>🔍 Kết quả tìm kiếm ({searchResults.length})</>
                  )}
                </p>
              </div>

              {/* Results List */}
              {searchResults.map((student) => (
                <StudentItem
                  key={student.id}
                  student={student}
                  isEnrolling={enrolling === student.id}
                  onEnroll={() => onEnroll(student, defaultTuitionFee)}
                  batchMode={batchMode}
                  isSelected={selectedIds.includes(student.id)}
                  onToggle={() => toggleStudent(student.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50">
          {batchMode && selectedIds.length > 0 ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">
                Đã chọn <strong>{selectedIds.length}</strong> học viên
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedIds([])}
                  disabled={batchEnrolling}
                >
                  Bỏ chọn
                </Button>
                <Button
                  size="sm"
                  onClick={handleBatchEnroll}
                  disabled={batchEnrolling}
                >
                  {batchEnrolling ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Đang thêm...</>
                  ) : (
                    <><Plus className="w-4 h-4 mr-2" /> Thêm {selectedIds.length} học viên</>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center">
              📋 Học phí mặc định: <strong>{defaultTuitionFee.toLocaleString()}đ</strong> (theo khóa học)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Student Item sub-component
function StudentItem({ student, isEnrolling, onEnroll, batchMode, isSelected, onToggle }) {
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg transition-colors border ${batchMode && isSelected
        ? 'bg-blue-50 border-blue-300'
        : 'bg-slate-50 hover:bg-slate-100 border-transparent hover:border-slate-200'
        }`}
      onClick={batchMode ? onToggle : undefined}
      style={batchMode ? { cursor: 'pointer' } : undefined}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar name={student.full_name} url={student.avatar_url} size="md" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-900 truncate">{student.full_name}</p>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Mail className="w-3 h-3" />
            <span className="truncate">{student.email}</span>
          </div>
          {student.phone && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Phone className="w-3 h-3" />
              <span>{student.phone}</span>
            </div>
          )}
        </div>
      </div>
      {batchMode ? (
        <div className="ml-3 shrink-0">
          {isSelected ? (
            <CheckCircle2 className="w-6 h-6 text-blue-600" />
          ) : (
            <div className="w-6 h-6 rounded-full border-2 border-slate-300" />
          )}
        </div>
      ) : (
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onEnroll();
          }}
          disabled={isEnrolling}
          className="ml-3 shrink-0"
        >
          {isEnrolling ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Plus className="w-4 h-4 mr-1" /> Thêm
            </>
          )}
        </Button>
      )}
    </div>
  );
}

// Empty State sub-component
function EmptyState({ hasSearchQuery, resultType }) {
  // Show hint for short search query
  if (resultType === 'hint') {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center">
          <Search className="w-8 h-8 text-blue-400" />
        </div>
        <p className="text-slate-600 font-medium">Nhập thêm ký tự để tìm kiếm</p>
        <p className="text-sm text-slate-400 mt-1">
          Cần ít nhất {MIN_SEARCH_LENGTH} ký tự
        </p>
      </div>
    );
  }

  // Show error state
  if (resultType === 'error') {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <p className="text-slate-600 font-medium">Lỗi khi tìm kiếm</p>
        <p className="text-sm text-slate-400 mt-1">Vui lòng thử lại</p>
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      {hasSearchQuery ? (
        <>
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-600 font-medium">Không tìm thấy học viên</p>
          <p className="text-sm text-slate-400 mt-1">Thử tìm với từ khóa khác</p>
        </>
      ) : (
        <>
          <div className="w-16 h-16 mx-auto mb-4 bg-amber-50 rounded-full flex items-center justify-center">
            <Users className="w-8 h-8 text-amber-400" />
          </div>
          <p className="text-slate-600 font-medium">Chưa có học viên nào</p>
          <p className="text-sm text-slate-400 mt-1">
            Tất cả học viên đã được thêm vào lớp hoặc chưa có học viên trong hệ thống
          </p>
        </>
      )}
    </div>
  );
}
