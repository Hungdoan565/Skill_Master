/**
 * CreateClassModal Component - Modal tạo/sửa lớp học
 */

import { 
  Calendar as CalendarIcon, RefreshCw, Check, AlertTriangle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SimpleModal } from './SimpleModal';
import { Select } from './Select';
import { ConflictCard } from './ConflictCard';
import { DAYS_OF_WEEK, DAY_NAMES, STATUS_CONFIG } from '../utils';
import { useConflictCheck } from '../hooks';

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
  // Helpers
  getRoomsByCenter,
  getRoomById
}) {
  // Get selected room
  const selectedRoom = getRoomById(formData.room_id);

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
      alert(`Sĩ số tối đa (${formData.max_students}) không được vượt quá sức chứa phòng (${selectedRoom.capacity} chỗ)`);
      return;
    }

    if (isConflict) {
      const confirm = window.confirm(`Phát hiện xung đột lịch học. Bạn vẫn muốn tiếp tục?`);
      if (!confirm) return;
    }

    onSubmit(e);
  };

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? '✏️ Chỉnh sửa Lớp học' : '🎓 Mở lớp mới'}
      size="2xl"
    >
      <form onSubmit={handleSubmit}>
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
                    onChange={(e) => onUpdateField('name', e.target.value)}
                    required
                    className="h-9 text-sm flex-1"
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
              </div>
            </div>

            {/* Khóa học */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Khóa học <span className="text-red-500">*</span></Label>
              <Select
                value={formData.course_id}
                onChange={(v) => onCourseChange(v)}
                placeholder="Chọn khóa học"
                options={courses.map(c => ({ value: c.id, label: `${c.code} - ${c.title}` }))}
              />
            </div>

            {/* Giáo viên */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1">
                Giáo viên
                {formData.teacher_id && <span className="text-slate-400">(Xem lịch bên phải)</span>}
              </Label>
              <Select
                value={formData.teacher_id}
                onChange={(v) => onUpdateField('teacher_id', v)}
                placeholder="Chọn giáo viên"
                options={teachers.map(t => ({ value: t.id, label: t.full_name || t.email }))}
              />
            </div>

            {/* Trung tâm & Phòng học */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Trung tâm</Label>
                <Select
                  value={formData.center_id}
                  onChange={(v) => {
                    onUpdateField('center_id', v);
                    onUpdateField('room_id', '');
                  }}
                  placeholder="Chọn"
                  options={centers.map(c => ({ value: c.id, label: c.name }))}
                />
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
                <Label className="text-xs font-medium">Ngày khai giảng</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => onStartDateChange(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Ngày kết thúc</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => onUpdateField('end_date', e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            {/* Chọn thứ trong tuần */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Chọn thứ trong tuần</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onToggleDay(value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                      selectedDays.includes(value)
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Giờ bắt đầu & Kết thúc */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Giờ bắt đầu</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => onSetStartTime(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Giờ kết thúc</Label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => onSetEndTime(e.target.value)}
                  className="h-9 text-sm"
                />
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
                  className={`h-9 text-sm ${
                    selectedRoom && formData.max_students > selectedRoom.capacity 
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
              <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                <div className="flex items-start gap-2">
                  <CalendarIcon className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-indigo-800">
                    <p className="font-medium">Lịch học đã chọn:</p>
                    <p className="text-indigo-700">
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
          <Button type="submit" disabled={submitting}>
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
  );
}

export default CreateClassModal;
