/**
 * CreateClassModal Component - Modal tạo/sửa lớp học
 */

import { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon, RefreshCw, Check, AlertTriangle, AlertCircle, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SimpleModal } from './SimpleModal';
import { Select } from './Select';
import { ConflictCard } from './ConflictCard';
import { DAYS_OF_WEEK, DAY_NAMES, STATUS_CONFIG } from '../utils';
import { useConflictCheck } from '../hooks';

// ConfirmModal Component - Xác nhận xung đột lịch học
function ConflictConfirmModal({ isOpen, onClose, onConfirm, messages }) {
  // ESC key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="conflict-confirm-title"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-linear-to-r from-amber-500 to-amber-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 id="conflict-confirm-title" className="text-lg font-semibold text-white">
                  Phát hiện xung đột lịch học
                </h2>
                <p className="text-sm text-white/80">Vui lòng xác nhận để tiếp tục</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-slate-600 mb-4">
            Hệ thống phát hiện xung đột lịch học sau:
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 max-h-40 overflow-y-auto">
            <ul className="space-y-1 text-sm text-amber-800">
              {messages.map((msg, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>{msg}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-slate-500 text-sm">
            Bạn vẫn muốn tiếp tục tạo lớp học với xung đột này?
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Hủy bỏ
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Check className="w-4 h-4 mr-2" />
            Tiếp tục tạo lớp
          </Button>
        </div>
      </div>
    </div>
  );
}

export function CreateClassModal({
  isOpen,
  onClose,
  // Form state
  formData,
  selectedDays,
  startTime,
  endTime,
  submitting,
  isEditing,
  editingClass,
  formError,
  validationErrors = {},
  // Options
  courses,
  teachers,
  centers,
  rooms,
  // Handlers
  onUpdateField,
  onToggleDay,
  onSetStartTime,
  onSetEndTime,
  onCourseChange,
  onStartDateChange,
  onRegenerateName,
  onSubmit,
  onClearValidationError,
  // Helpers
  getRoomsByCenter,
  getRoomById
}) {
  // Local state for validation
  const [capacityError, setCapacityError] = useState(null);
  const [showConflictConfirm, setShowConflictConfirm] = useState(false);
  const [pendingSubmitEvent, setPendingSubmitEvent] = useState(null);

  // Get selected room
  const selectedRoom = getRoomById(formData.room_id);

  // Clear capacity error when room or max_students change
  useEffect(() => {
    setCapacityError(null);
  }, [formData.room_id, formData.max_students]);

  // Conflict check
  const { status: conflictStatus, messages: conflictMessages, isConflict } = useConflictCheck({
    teacherId: formData.teacher_id,
    roomId: formData.room_id,
    startDate: formData.start_date,
    endDate: formData.end_date,
    schedule: formData.schedule,
    excludeClassId: editingClass?.id
  });

  // Handle submit with conflict check
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate sĩ số không vượt sức chứa phòng
    if (selectedRoom && formData.max_students > selectedRoom.capacity) {
      setCapacityError(`Sĩ số tối đa (${formData.max_students}) không được vượt quá sức chứa phòng (${selectedRoom.capacity} chỗ)`);
      return;
    }

    if (isConflict) {
      setPendingSubmitEvent(e);
      setShowConflictConfirm(true);
      return;
    }

    onSubmit(e);
  };

  // Handle conflict confirm
  const handleConflictConfirm = () => {
    setShowConflictConfirm(false);
    if (pendingSubmitEvent) {
      onSubmit(pendingSubmitEvent);
      setPendingSubmitEvent(null);
    }
  };

  return (
    <>
      <SimpleModal
        isOpen={isOpen}
        onClose={onClose}
        title={isEditing ? '✏️ Chỉnh sửa Lớp học' : '🎓 Mở lớp mới'}
        size="2xl"
      >
        <form onSubmit={handleSubmit}>
          {/* Form Error */}
          {formError && (
            <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="text-sm">{formError}</span>
            </div>
          )}

          {/* Capacity Error */}
          {capacityError && (
            <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="text-sm">{capacityError}</span>
            </div>
          )}

          <div className="flex flex-col lg:flex-row">
            {/* CỘT TRÁI - FORM */}
            <div className="w-full lg:w-2/5 p-5 space-y-4 border-r">
              {/* Mã lớp & Tên lớp */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Mã lớp</Label>
                  <Input
                    placeholder="Tự động tạo khi chọn khóa học..."
                    value={formData.code}
                    readOnly
                    className="h-9 text-sm bg-slate-50 text-slate-600 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Tên lớp <span className="text-red-500">*</span></Label>
                  <div className="flex gap-1.5">
                    <Input
                      placeholder="Tự động sinh khi chọn khóa học..."
                      value={formData.name}
                      onChange={(e) => {
                        onUpdateField('name', e.target.value);
                        onClearValidationError?.('name');
                      }}
                      required
                      className={`h-9 text-sm flex-1 ${validationErrors.name ? 'border-red-400 focus:ring-red-500' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={onRegenerateName}
                      className="h-9 w-9 flex items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                      title="Tự động tạo tên lớp"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                  {validationErrors.name && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {validationErrors.name}
                    </p>
                  )}
                </div>
              </div>

              {/* Khóa học */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Khóa học <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.course_id}
                  onChange={(v) => {
                    onCourseChange(v);
                    onClearValidationError?.('course_id');
                  }}
                  placeholder="Chọn khóa học"
                  options={courses.map(c => ({ value: c.id, label: `${c.code} - ${c.title}` }))}
                  error={validationErrors.course_id}
                />
                {validationErrors.course_id && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.course_id}
                  </p>
                )}
              </div>

              {/* Giáo viên */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1">
                  Giáo viên <span className="text-red-500">*</span>
                  {formData.teacher_id && <span className="text-slate-400">(Xem lịch bên phải)</span>}
                </Label>
                <Select
                  value={formData.teacher_id}
                  onChange={(v) => {
                    onUpdateField('teacher_id', v);
                    onClearValidationError?.('teacher_id');
                  }}
                  placeholder="Chọn giáo viên"
                  options={teachers.map(t => ({ value: t.id, label: t.full_name || t.email }))}
                  error={validationErrors.teacher_id}
                />
                {validationErrors.teacher_id && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.teacher_id}
                  </p>
                )}
              </div>

              {/* Trung tâm & Phòng học */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Trung tâm <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.center_id}
                    onChange={(v) => {
                      onUpdateField('center_id', v);
                      onUpdateField('room_id', '');
                      onClearValidationError?.('center_id');
                    }}
                    placeholder="Chọn"
                    options={centers.map(c => ({ value: c.id, label: c.name }))}
                    error={validationErrors.center_id}
                  />
                  {validationErrors.center_id && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {validationErrors.center_id}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium flex items-center gap-1">
                    Phòng học
                    {selectedRoom && <span className="text-slate-400">({selectedRoom.capacity} chỗ)</span>}
                  </Label>
                  <Select
                    value={formData.room_id}
                    onChange={(v) => onUpdateField('room_id', v)}
                    placeholder="Chọn phòng"
                    options={getRoomsByCenter(formData.center_id).map(r => ({
                      value: r.id,
                      label: `${r.name} (${r.capacity} chỗ)`
                    }))}
                  />
                </div>
              </div>

              {/* Ngày khai giảng & Kết thúc */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Ngày khai giảng <span className="text-red-500">*</span></Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => {
                      onStartDateChange(e.target.value);
                      onClearValidationError?.('start_date');
                    }}
                    className={`h-9 text-sm ${validationErrors.start_date ? 'border-red-400 focus:ring-red-500' : ''}`}
                  />
                  {validationErrors.start_date && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {validationErrors.start_date}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Ngày kết thúc <span className="text-red-500">*</span></Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => {
                      onUpdateField('end_date', e.target.value);
                      onClearValidationError?.('end_date');
                    }}
                    className={`h-9 text-sm ${validationErrors.end_date ? 'border-red-400 focus:ring-red-500' : ''}`}
                  />
                  {validationErrors.end_date && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {validationErrors.end_date}
                    </p>
                  )}
                </div>
              </div>

              {/* Chọn thứ trong tuần */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Chọn thứ trong tuần <span className="text-red-500">*</span></Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        onToggleDay(value);
                        onClearValidationError?.('schedule');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-300 ${selectedDays.includes(value)
                        ? 'bg-gradient-to-br from-red-500 to-orange-500 text-white border-transparent shadow-md shadow-orange-500/20 scale-105'
                        : validationErrors.schedule
                          ? 'bg-white text-slate-600 border-red-300 hover:border-red-400'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50/30'
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {validationErrors.schedule && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.schedule}
                  </p>
                )}
              </div>

              {/* Giờ bắt đầu & Kết thúc */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Giờ bắt đầu</Label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => {
                      onSetStartTime(e.target.value);
                      onClearValidationError?.('time');
                    }}
                    className={`h-9 text-sm ${validationErrors.time ? 'border-red-400 focus:ring-red-500' : ''}`}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Giờ kết thúc</Label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => {
                      onSetEndTime(e.target.value);
                      onClearValidationError?.('time');
                    }}
                    className={`h-9 text-sm ${validationErrors.time ? 'border-red-400 focus:ring-red-500' : ''}`}
                  />
                  {validationErrors.time && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {validationErrors.time}
                    </p>
                  )}
                </div>
              </div>

              {/* Sĩ số & Trạng thái */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Sĩ số tối đa</Label>
                  <Input
                    type="number"
                    min="1"
                    max={selectedRoom?.capacity || 100}
                    value={formData.max_students}
                    onChange={(e) => onUpdateField('max_students', parseInt(e.target.value) || 20)}
                    className={`h-9 text-sm ${selectedRoom && formData.max_students > selectedRoom.capacity
                      ? 'border-red-300 focus:ring-red-500'
                      : ''
                      }`}
                  />
                  {/* Warning nếu sĩ số vượt sức chứa phòng */}
                  {selectedRoom && formData.max_students > selectedRoom.capacity && (
                    <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                      <AlertTriangle className="h-3 w-3" />
                      Vượt quá sức chứa phòng ({selectedRoom.capacity} chỗ)
                    </p>
                  )}
                  {selectedRoom && formData.max_students <= selectedRoom.capacity && (
                    <p className="text-xs text-slate-500 mt-1">
                      Sức chứa phòng: <span className="font-medium">{selectedRoom.capacity} chỗ</span>
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Trạng thái</Label>
                  <Select
                    value={formData.status}
                    onChange={(v) => onUpdateField('status', v)}
                    placeholder="Chọn"
                    options={Object.entries(STATUS_CONFIG).map(([value, { label }]) => ({ value, label }))}
                  />
                </div>
              </div>

              {/* Lịch học đã chọn (Preview) */}
              {formData.schedule.length > 0 && (
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-100/50 backdrop-blur-sm shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-start gap-2">
                    <CalendarIcon className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                    <div className="text-sm text-orange-900">
                      <p className="font-semibold">Lịch học đã chọn:</p>
                      <p className="text-orange-700/80">
                        {selectedDays.map(d => DAY_NAMES[d]).join(', ')} | {startTime} - {endTime}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* CỘT PHẢI - SMART VALIDATION CARD */}
            <div className="w-full lg:w-3/5 p-6 bg-slate-50 border-l flex flex-col">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Kiểm tra tình trạng</h3>

              <ConflictCard status={conflictStatus} messages={conflictMessages} />

              {/* Thông tin tổng quan lớp học */}
              {formData.course_id && (
                <div className="mt-4 bg-white rounded-lg border border-slate-200 p-4">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-orange-500" />
                    Thông tin lớp học
                  </h4>
                  <div className="space-y-2 text-sm">
                    {/* Khóa học */}
                    {formData.course_id && (
                      <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500">Khóa học:</span>
                        <span className="font-medium text-slate-800 text-right max-w-[60%] truncate">
                          {courses.find(c => c.id === formData.course_id)?.title || 'N/A'}
                        </span>
                      </div>
                    )}

                    {/* Giáo viên */}
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Giáo viên:</span>
                      <span className={`font-medium ${formData.teacher_id ? 'text-slate-800' : 'text-amber-600'}`}>
                        {formData.teacher_id
                          ? teachers.find(t => t.id === formData.teacher_id)?.full_name || 'N/A'
                          : 'Chưa phân công'
                        }
                      </span>
                    </div>

                    {/* Phòng học */}
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Phòng học:</span>
                      <span className={`font-medium ${selectedRoom ? 'text-slate-800' : 'text-amber-600'}`}>
                        {selectedRoom
                          ? `${selectedRoom.name} (${selectedRoom.capacity} chỗ)`
                          : 'Chưa chọn'
                        }
                      </span>
                    </div>

                    {/* Thời gian */}
                    {formData.start_date && formData.end_date && (
                      <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500">Thời gian:</span>
                        <span className="font-medium text-slate-800">
                          {new Date(formData.start_date).toLocaleDateString('vi-VN')} - {new Date(formData.end_date).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    )}

                    {/* Sĩ số */}
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-slate-500">Sĩ số tối đa:</span>
                      <span className={`font-medium ${selectedRoom && formData.max_students > selectedRoom.capacity
                        ? 'text-red-600'
                        : 'text-slate-800'
                        }`}>
                        {formData.max_students} học viên
                        {selectedRoom && formData.max_students > selectedRoom.capacity && (
                          <span className="text-red-500 text-xs ml-1">(vượt quá!)</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Lịch học preview khi chưa có conflict check */}
              {formData.schedule.length > 0 && (
                <div className="mt-4 bg-orange-50/50 rounded-xl border border-orange-200/40 p-4 backdrop-blur-sm shadow-inner">
                  <h4 className="text-sm font-semibold text-orange-700 mb-2 flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    Lịch học chi tiết
                  </h4>
                  <div className="space-y-1.5">
                    {formData.schedule.map((s, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-orange-900/70 font-medium">{DAY_NAMES[s.day]}</span>
                        <span className="text-orange-600 font-semibold">{s.start} - {s.end}</span>
                      </div>
                    ))}
                  </div>
                  {formData.start_date && formData.end_date && (
                    <div className="mt-3 pt-3 border-t border-orange-200/50 text-xs text-orange-600/70 font-medium flex items-center gap-1">
                      <span>📅</span>
                      <span>Từ {new Date(formData.start_date).toLocaleDateString('vi-VN')} đến {new Date(formData.end_date).toLocaleDateString('vi-VN')}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Thông tin bổ sung */}
              <div className="mt-auto pt-4">
                <div className="text-xs text-slate-500 bg-white rounded-lg p-3 border border-slate-200">
                  <p className="font-medium text-slate-700 mb-1">💡 Hướng dẫn</p>
                  <ul className="space-y-1">
                    <li>• Hệ thống tự động kiểm tra xung đột khi bạn điền đủ thông tin</li>
                    <li>• Xung đột xảy ra khi giáo viên hoặc phòng đã có lịch trùng</li>
                    <li>• Bạn vẫn có thể tạo lớp nếu chấp nhận xung đột</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 p-4 border-t bg-slate-50">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white shadow-md shadow-orange-500/20 transition-all duration-300"
            >
              {submitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  {isEditing ? 'Cập nhật' : 'Tạo lớp'}
                </>
              )}
            </Button>
          </div>
        </form>
      </SimpleModal>

      {/* Conflict Confirm Modal */}
      <ConflictConfirmModal
        isOpen={showConflictConfirm}
        onClose={() => {
          setShowConflictConfirm(false);
          setPendingSubmitEvent(null);
        }}
        onConfirm={handleConflictConfirm}
        messages={conflictMessages}
      />
    </>
  );
}

export default CreateClassModal;
