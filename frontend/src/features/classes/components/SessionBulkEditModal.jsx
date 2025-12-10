/**
 * SessionBulkEditModal Component
 * Modal for bulk editing multiple sessions at once
 */

import { useState, useMemo } from 'react';
import {
    X,
    Clock,
    User,
    MapPin,
    Calendar,
    CheckCircle,
    AlertCircle,
    Loader2,
    Settings,
    Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function SessionBulkEditModal({
    isOpen,
    onClose,
    selectedSessions = [],
    availableTeachers = [],
    availableRooms = [],
    onSubmit,
    loading = false
}) {
    const [editMode, setEditMode] = useState('time'); // time, teacher, room, status
    const [formData, setFormData] = useState({
        start_time: '',
        end_time: '',
        teacher_id: '',
        room_id: '',
        status: ''
    });
    const [confirmStep, setConfirmStep] = useState(false);

    // Reset form when modal opens/closes
    const handleClose = () => {
        setFormData({
            start_time: '',
            end_time: '',
            teacher_id: '',
            room_id: '',
            status: ''
        });
        setEditMode('time');
        setConfirmStep(false);
        onClose();
    };

    // Get summary of changes
    const changesSummary = useMemo(() => {
        const changes = [];

        if (editMode === 'time' && (formData.start_time || formData.end_time)) {
            if (formData.start_time) changes.push(`Giờ bắt đầu: ${formData.start_time}`);
            if (formData.end_time) changes.push(`Giờ kết thúc: ${formData.end_time}`);
        }

        if (editMode === 'teacher' && formData.teacher_id) {
            const teacher = availableTeachers.find(t => t.id === formData.teacher_id);
            changes.push(`Giáo viên: ${teacher?.full_name || 'N/A'}`);
        }

        if (editMode === 'room' && formData.room_id) {
            const room = availableRooms.find(r => r.id === formData.room_id);
            changes.push(`Phòng: ${room?.name || 'N/A'}`);
        }

        if (editMode === 'status' && formData.status) {
            const statusLabels = {
                scheduled: 'Đã lên lịch',
                completed: 'Đã hoàn thành',
                cancelled: 'Đã hủy'
            };
            changes.push(`Trạng thái: ${statusLabels[formData.status]}`);
        }

        return changes;
    }, [editMode, formData, availableTeachers, availableRooms]);

    const handleSubmit = async () => {
        if (!confirmStep) {
            setConfirmStep(true);
            return;
        }

        const updates = {};

        if (editMode === 'time') {
            if (formData.start_time) updates.start_time = formData.start_time;
            if (formData.end_time) updates.end_time = formData.end_time;
        } else if (editMode === 'teacher') {
            updates.teacher_id = formData.teacher_id || null;
        } else if (editMode === 'room') {
            updates.room_id = formData.room_id || null;
        } else if (editMode === 'status') {
            updates.status = formData.status;
        }

        await onSubmit(selectedSessions.map(s => s.id), updates);
        handleClose();
    };

    const canSubmit = useMemo(() => {
        if (editMode === 'time') return formData.start_time || formData.end_time;
        if (editMode === 'teacher') return formData.teacher_id !== '';
        if (editMode === 'room') return formData.room_id !== '';
        if (editMode === 'status') return formData.status !== '';
        return false;
    }, [editMode, formData]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-indigo-500 to-purple-500">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Settings className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">
                                Chỉnh sửa hàng loạt
                            </h2>
                            <p className="text-sm text-white/80">
                                {selectedSessions.length} buổi học được chọn
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

                {/* Content */}
                <div className="p-6">
                    {!confirmStep ? (
                        <>
                            {/* Edit Mode Selection */}
                            <div className="mb-6">
                                <label className="text-sm font-medium text-slate-700 mb-3 block">
                                    Chọn thuộc tính cần sửa
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setEditMode('time')}
                                        className={`
                      flex items-center gap-3 p-4 rounded-xl border-2 transition-all
                      ${editMode === 'time'
                                                ? 'border-indigo-500 bg-indigo-50'
                                                : 'border-slate-200 hover:border-slate-300'
                                            }
                    `}
                                    >
                                        <Clock className={`w-5 h-5 ${editMode === 'time' ? 'text-indigo-600' : 'text-slate-400'}`} />
                                        <span className={`font-medium ${editMode === 'time' ? 'text-indigo-900' : 'text-slate-700'}`}>
                                            Giờ học
                                        </span>
                                    </button>

                                    <button
                                        onClick={() => setEditMode('teacher')}
                                        className={`
                      flex items-center gap-3 p-4 rounded-xl border-2 transition-all
                      ${editMode === 'teacher'
                                                ? 'border-indigo-500 bg-indigo-50'
                                                : 'border-slate-200 hover:border-slate-300'
                                            }
                    `}
                                    >
                                        <User className={`w-5 h-5 ${editMode === 'teacher' ? 'text-indigo-600' : 'text-slate-400'}`} />
                                        <span className={`font-medium ${editMode === 'teacher' ? 'text-indigo-900' : 'text-slate-700'}`}>
                                            Giáo viên
                                        </span>
                                    </button>

                                    <button
                                        onClick={() => setEditMode('room')}
                                        className={`
                      flex items-center gap-3 p-4 rounded-xl border-2 transition-all
                      ${editMode === 'room'
                                                ? 'border-indigo-500 bg-indigo-50'
                                                : 'border-slate-200 hover:border-slate-300'
                                            }
                    `}
                                    >
                                        <MapPin className={`w-5 h-5 ${editMode === 'room' ? 'text-indigo-600' : 'text-slate-400'}`} />
                                        <span className={`font-medium ${editMode === 'room' ? 'text-indigo-900' : 'text-slate-700'}`}>
                                            Phòng học
                                        </span>
                                    </button>

                                    <button
                                        onClick={() => setEditMode('status')}
                                        className={`
                      flex items-center gap-3 p-4 rounded-xl border-2 transition-all
                      ${editMode === 'status'
                                                ? 'border-indigo-500 bg-indigo-50'
                                                : 'border-slate-200 hover:border-slate-300'
                                            }
                    `}
                                    >
                                        <CheckCircle className={`w-5 h-5 ${editMode === 'status' ? 'text-indigo-600' : 'text-slate-400'}`} />
                                        <span className={`font-medium ${editMode === 'status' ? 'text-indigo-900' : 'text-slate-700'}`}>
                                            Trạng thái
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Edit Form based on mode */}
                            <div className="space-y-4">
                                {editMode === 'time' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-slate-700 mb-2 block">
                                                Giờ bắt đầu
                                            </label>
                                            <Input
                                                type="time"
                                                value={formData.start_time}
                                                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                                                className="w-full"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-slate-700 mb-2 block">
                                                Giờ kết thúc
                                            </label>
                                            <Input
                                                type="time"
                                                value={formData.end_time}
                                                onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                                                className="w-full"
                                            />
                                        </div>
                                    </div>
                                )}

                                {editMode === 'teacher' && (
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 mb-2 block">
                                            Chọn giáo viên
                                        </label>
                                        <select
                                            value={formData.teacher_id}
                                            onChange={(e) => setFormData(prev => ({ ...prev, teacher_id: e.target.value }))}
                                            className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                                        >
                                            <option value="">-- Chọn giáo viên --</option>
                                            <option value="null">Bỏ giáo viên (để trống)</option>
                                            {availableTeachers.map(teacher => (
                                                <option key={teacher.id} value={teacher.id}>
                                                    {teacher.full_name}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-slate-500 mt-2">
                                            <AlertCircle className="w-3 h-3 inline mr-1" />
                                            Lưu ý: Hệ thống không kiểm tra xung đột khi sửa hàng loạt
                                        </p>
                                    </div>
                                )}

                                {editMode === 'room' && (
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 mb-2 block">
                                            Chọn phòng học
                                        </label>
                                        <select
                                            value={formData.room_id}
                                            onChange={(e) => setFormData(prev => ({ ...prev, room_id: e.target.value }))}
                                            className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                                        >
                                            <option value="">-- Chọn phòng --</option>
                                            <option value="null">Bỏ phòng (để trống)</option>
                                            {availableRooms.map(room => (
                                                <option key={room.id} value={room.id}>
                                                    {room.name} {room.capacity && `(${room.capacity} chỗ)`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {editMode === 'status' && (
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 mb-2 block">
                                            Trạng thái mới
                                        </label>
                                        <div className="space-y-2">
                                            {[
                                                { value: 'scheduled', label: 'Đã lên lịch', color: 'blue' },
                                                { value: 'completed', label: 'Đã hoàn thành', color: 'green' },
                                                { value: 'cancelled', label: 'Đã hủy', color: 'red' }
                                            ].map(option => (
                                                <label
                                                    key={option.value}
                                                    className={`
                            flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                            ${formData.status === option.value
                                                            ? `border-${option.color}-500 bg-${option.color}-50`
                                                            : 'border-slate-200 hover:border-slate-300'
                                                        }
                          `}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="status"
                                                        value={option.value}
                                                        checked={formData.status === option.value}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                                                        className="sr-only"
                                                    />
                                                    <div className={`
                            w-4 h-4 rounded-full border-2 flex items-center justify-center
                            ${formData.status === option.value
                                                            ? `border-${option.color}-500`
                                                            : 'border-slate-300'
                                                        }
                          `}>
                                                        {formData.status === option.value && (
                                                            <div className={`w-2 h-2 rounded-full bg-${option.color}-500`} />
                                                        )}
                                                    </div>
                                                    <span className="font-medium text-slate-700">{option.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        /* Confirmation Step */
                        <div className="space-y-4">
                            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                                    <div>
                                        <h4 className="font-semibold text-amber-900">Xác nhận thay đổi</h4>
                                        <p className="text-sm text-amber-700 mt-1">
                                            Bạn sẽ áp dụng thay đổi cho {selectedSessions.length} buổi học.
                                            Hành động này không thể hoàn tác.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-xl">
                                <h4 className="font-medium text-slate-900 mb-2">Nội dung thay đổi:</h4>
                                <ul className="space-y-1">
                                    {changesSummary.map((change, idx) => (
                                        <li key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                                            <CheckCircle className="w-4 h-4 text-indigo-500" />
                                            {change}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-xl">
                                <h4 className="font-medium text-slate-900 mb-2">Các buổi học bị ảnh hưởng:</h4>
                                <div className="max-h-32 overflow-y-auto space-y-1">
                                    {selectedSessions.slice(0, 5).map(session => (
                                        <div key={session.id} className="flex items-center gap-2 text-sm text-slate-600">
                                            <Calendar className="w-3 h-3" />
                                            Buổi {session.session_number} - {new Date(session.session_date || session.date).toLocaleDateString('vi-VN')}
                                        </div>
                                    ))}
                                    {selectedSessions.length > 5 && (
                                        <p className="text-xs text-slate-400 italic">
                                            ... và {selectedSessions.length - 5} buổi khác
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 bg-slate-50">
                    {confirmStep && (
                        <Button
                            variant="outline"
                            onClick={() => setConfirmStep(false)}
                            disabled={loading}
                        >
                            Quay lại
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={loading}
                    >
                        Hủy
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!canSubmit || loading}
                        className="bg-indigo-600 hover:bg-indigo-700"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Đang xử lý...
                            </>
                        ) : confirmStep ? (
                            'Xác nhận'
                        ) : (
                            'Tiếp tục'
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default SessionBulkEditModal;
