/**
 * SessionRescheduleModal Component
 * Modal for rescheduling a session to a different date/time
 */

import { useState, useEffect } from 'react';
import {
    X,
    Calendar,
    Clock,
    User,
    MapPin,
    AlertCircle,
    Loader2,
    CheckCircle,
    ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function SessionRescheduleModal({
    isOpen,
    onClose,
    session,
    availableTeachers = [],
    availableRooms = [],
    onSubmit,
    loading = false
}) {
    const [formData, setFormData] = useState({
        session_date: '',
        start_time: '',
        end_time: '',
        teacher_id: '',
        room_id: '',
        reason: ''
    });
    const [conflicts, setConflicts] = useState([]);
    const [checkingConflicts, setCheckingConflicts] = useState(false);

    // Initialize form when session changes
    useEffect(() => {
        if (session) {
            setFormData({
                session_date: session.session_date || session.date || '',
                start_time: session.start_time || '',
                end_time: session.end_time || '',
                teacher_id: session.teacher_id || session.teacher?.id || '',
                room_id: session.room_id || '',
                reason: ''
            });
            setConflicts([]);
        }
    }, [session]);

    const handleClose = () => {
        setFormData({
            session_date: '',
            start_time: '',
            end_time: '',
            teacher_id: '',
            room_id: '',
            reason: ''
        });
        setConflicts([]);
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const updates = {
            session_date: formData.session_date,
            start_time: formData.start_time,
            end_time: formData.end_time,
            reason: formData.reason
        };

        // Only include teacher/room if changed
        if (formData.teacher_id !== (session?.teacher_id || session?.teacher?.id)) {
            updates.teacher_id = formData.teacher_id || null;
        }
        if (formData.room_id !== session?.room_id) {
            updates.room_id = formData.room_id || null;
        }

        await onSubmit(session.id, updates);
        handleClose();
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('vi-VN', {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const hasChanges = session && (
        formData.session_date !== (session.session_date || session.date) ||
        formData.start_time !== session.start_time ||
        formData.end_time !== session.end_time ||
        formData.teacher_id !== (session.teacher_id || session.teacher?.id || '') ||
        formData.room_id !== (session.room_id || '')
    );

    if (!isOpen || !session) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-amber-500 to-orange-500">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">
                                Dời lịch buổi học
                            </h2>
                            <p className="text-sm text-white/80">
                                Buổi {session.session_number}
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

                <form onSubmit={handleSubmit}>
                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Current Schedule Info */}
                        <div className="p-4 bg-slate-50 rounded-xl">
                            <h4 className="text-sm font-medium text-slate-500 mb-2">Lịch hiện tại</h4>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-slate-700">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    <span>{formatDate(session.session_date || session.date)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-700">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                    <span>{session.start_time} - {session.end_time}</span>
                                </div>
                            </div>
                            {session.teacher && (
                                <div className="flex items-center gap-2 text-slate-600 mt-2">
                                    <User className="w-4 h-4 text-slate-400" />
                                    <span>{session.teacher.full_name || session.teacher}</span>
                                </div>
                            )}
                        </div>

                        {/* Arrow indicator */}
                        <div className="flex justify-center">
                            <div className="p-2 bg-amber-100 rounded-full">
                                <ArrowRight className="w-5 h-5 text-amber-600 rotate-90" />
                            </div>
                        </div>

                        {/* New Schedule Form */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium text-slate-700">Lịch mới</h4>

                            {/* Date */}
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-2 block">
                                    Ngày học mới <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="date"
                                    value={formData.session_date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, session_date: e.target.value }))}
                                    required
                                    className="w-full"
                                />
                            </div>

                            {/* Time */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-2 block">
                                        Giờ bắt đầu <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        type="time"
                                        value={formData.start_time}
                                        onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                                        required
                                        className="w-full"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-2 block">
                                        Giờ kết thúc <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        type="time"
                                        value={formData.end_time}
                                        onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                                        required
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            {/* Teacher */}
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-2 block">
                                    Giáo viên
                                </label>
                                <select
                                    value={formData.teacher_id}
                                    onChange={(e) => setFormData(prev => ({ ...prev, teacher_id: e.target.value }))}
                                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400"
                                >
                                    <option value="">-- Giữ nguyên hoặc bỏ trống --</option>
                                    {availableTeachers.map(teacher => (
                                        <option key={teacher.id} value={teacher.id}>
                                            {teacher.full_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Room */}
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-2 block">
                                    Phòng học
                                </label>
                                <select
                                    value={formData.room_id}
                                    onChange={(e) => setFormData(prev => ({ ...prev, room_id: e.target.value }))}
                                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400"
                                >
                                    <option value="">-- Chọn phòng --</option>
                                    {availableRooms.map(room => (
                                        <option key={room.id} value={room.id}>
                                            {room.name} {room.capacity && `(${room.capacity} chỗ)`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Reason */}
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-2 block">
                                    Lý do dời lịch
                                </label>
                                <textarea
                                    value={formData.reason}
                                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                                    rows={2}
                                    placeholder="VD: GV bận, ngày lễ, yêu cầu từ học viên..."
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 resize-none"
                                />
                            </div>

                            {/* Conflicts Warning */}
                            {conflicts.length > 0 && (
                                <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-red-900">Phát hiện xung đột</h4>
                                            <ul className="text-sm text-red-700 mt-1 space-y-1">
                                                {conflicts.map((conflict, idx) => (
                                                    <li key={idx}>• {conflict}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 bg-slate-50">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={loading}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            disabled={!hasChanges || loading}
                            className="bg-amber-600 hover:bg-amber-700"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Đang lưu...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Cập nhật lịch
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default SessionRescheduleModal;
