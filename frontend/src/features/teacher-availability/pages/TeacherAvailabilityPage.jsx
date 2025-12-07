import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
    Clock,
    Plus,
    Trash2,
    Save,
    RefreshCw,
    XCircle,
    CheckCircle,
    AlertTriangle
} from 'lucide-react';
import { useTeacherAvailability } from '@/features/teacher-dashboard';

const DAYS_OF_WEEK = [
    { value: 1, label: 'Thứ 2', short: 'T2' },
    { value: 2, label: 'Thứ 3', short: 'T3' },
    { value: 3, label: 'Thứ 4', short: 'T4' },
    { value: 4, label: 'Thứ 5', short: 'T5' },
    { value: 5, label: 'Thứ 6', short: 'T6' },
    { value: 6, label: 'Thứ 7', short: 'T7' },
    { value: 0, label: 'Chủ nhật', short: 'CN' }
];

const TIME_SLOTS = [
    '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
    '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'
];

/**
 * Teacher Availability Page - Quản lý lịch trống của giáo viên
 */
export function TeacherAvailabilityPage() {
    const { availability, loading, saving, error, updateAvailability, refetch } = useTeacherAvailability();
    const [localSlots, setLocalSlots] = useState([]);
    const [hasChanges, setHasChanges] = useState(false);
    const [saveMessage, setSaveMessage] = useState(null);

    // Sync local state with fetched data
    useMemo(() => {
        if (availability && availability.length > 0) {
            setLocalSlots(availability.map(slot => ({
                ...slot,
                _id: slot.id || Math.random().toString(36).substr(2, 9)
            })));
        } else {
            setLocalSlots([]);
        }
        setHasChanges(false);
    }, [availability]);

    // Group slots by day for display
    const slotsByDay = useMemo(() => {
        const grouped = {};
        DAYS_OF_WEEK.forEach(day => {
            grouped[day.value] = localSlots.filter(s => s.day_of_week === day.value);
        });
        return grouped;
    }, [localSlots]);

    // Add new slot
    const addSlot = (dayOfWeek) => {
        const newSlot = {
            _id: Math.random().toString(36).substr(2, 9),
            day_of_week: dayOfWeek,
            start_time: '09:00',
            end_time: '12:00',
            type: 'available',
            isNew: true
        };
        setLocalSlots([...localSlots, newSlot]);
        setHasChanges(true);
    };

    // Update slot
    const updateSlot = (slotId, field, value) => {
        setLocalSlots(localSlots.map(slot =>
            slot._id === slotId ? { ...slot, [field]: value } : slot
        ));
        setHasChanges(true);
    };

    // Remove slot
    const removeSlot = (slotId) => {
        setLocalSlots(localSlots.filter(slot => slot._id !== slotId));
        setHasChanges(true);
    };

    // Save changes
    const handleSave = async () => {
        const slotsToSave = localSlots.map(({ _id, isNew, ...slot }) => ({
            day_of_week: slot.day_of_week,
            start_time: slot.start_time,
            end_time: slot.end_time,
            type: slot.type || 'available'
        }));

        const result = await updateAvailability(slotsToSave);

        if (result.success) {
            setSaveMessage({ type: 'success', text: 'Đã lưu lịch trống thành công!' });
            setHasChanges(false);
        } else {
            setSaveMessage({ type: 'error', text: result.error || 'Có lỗi xảy ra' });
        }

        setTimeout(() => setSaveMessage(null), 3000);
    };

    // Discard changes
    const handleDiscard = () => {
        setLocalSlots(availability.map(slot => ({
            ...slot,
            _id: slot.id || Math.random().toString(36).substr(2, 9)
        })));
        setHasChanges(false);
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải lịch trống...</p>
                </div>
            </div>
        );
    }

    if (error && !localSlots.length) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center p-6 bg-red-50 rounded-xl max-w-md">
                    <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-red-700 mb-2">Đã có lỗi xảy ra</h2>
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={refetch}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">⏰ Lịch trống</h1>
                    <p className="text-gray-500 mt-1">
                        Cập nhật lịch trống để admin có thể xếp lịch dạy phù hợp cho bạn
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {hasChanges && (
                        <>
                            <button
                                onClick={handleDiscard}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Hủy thay đổi
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                                {saving ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                Lưu thay đổi
                            </button>
                        </>
                    )}
                    <button
                        onClick={refetch}
                        className="p-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        title="Làm mới"
                    >
                        <RefreshCw className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Save Message */}
            {saveMessage && (
                <div className={cn(
                    'mb-6 p-4 rounded-lg flex items-center gap-3',
                    saveMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                )}>
                    {saveMessage.type === 'success' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    {saveMessage.text}
                </div>
            )}

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                        <h3 className="font-medium text-blue-900">Hướng dẫn</h3>
                        <p className="text-sm text-blue-700 mt-1">
                            Thêm các khung giờ bạn có thể dạy trong tuần. Admin sẽ dựa vào lịch này để xếp lịch dạy phù hợp.
                            Bạn có thể thêm nhiều khung giờ cho mỗi ngày.
                        </p>
                    </div>
                </div>
            </div>

            {/* Availability Grid */}
            <div className="space-y-4">
                {DAYS_OF_WEEK.map((day) => {
                    const daySlots = slotsByDay[day.value] || [];

                    return (
                        <div
                            key={day.value}
                            className="bg-white rounded-xl border overflow-hidden"
                        >
                            {/* Day Header */}
                            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
                                <div className="flex items-center gap-3">
                                    <span className="w-10 h-10 flex items-center justify-center bg-blue-100 text-blue-700 font-bold rounded-lg">
                                        {day.short}
                                    </span>
                                    <span className="font-medium text-gray-900">{day.label}</span>
                                    <span className="text-sm text-gray-500">
                                        ({daySlots.length} khung giờ)
                                    </span>
                                </div>
                                <button
                                    onClick={() => addSlot(day.value)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                    <Plus className="h-4 w-4" />
                                    Thêm
                                </button>
                            </div>

                            {/* Day Slots */}
                            <div className="p-4">
                                {daySlots.length === 0 ? (
                                    <p className="text-center text-gray-500 py-4">
                                        Chưa có lịch trống. Nhấn "Thêm" để thêm khung giờ.
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {daySlots.map((slot) => (
                                            <div
                                                key={slot._id}
                                                className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                                            >
                                                <Clock className="h-5 w-5 text-gray-400" />

                                                {/* Start Time */}
                                                <div className="flex items-center gap-2">
                                                    <label className="text-sm text-gray-600">Từ:</label>
                                                    <select
                                                        value={slot.start_time}
                                                        onChange={(e) => updateSlot(slot._id, 'start_time', e.target.value)}
                                                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    >
                                                        {TIME_SLOTS.map((time) => (
                                                            <option key={time} value={time}>{time}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* End Time */}
                                                <div className="flex items-center gap-2">
                                                    <label className="text-sm text-gray-600">Đến:</label>
                                                    <select
                                                        value={slot.end_time}
                                                        onChange={(e) => updateSlot(slot._id, 'end_time', e.target.value)}
                                                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    >
                                                        {TIME_SLOTS.map((time) => (
                                                            <option key={time} value={time}>{time}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Type */}
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        value={slot.type || 'available'}
                                                        onChange={(e) => updateSlot(slot._id, 'type', e.target.value)}
                                                        className={cn(
                                                            'px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                                                            slot.type === 'preferred' ? 'border-green-300 bg-green-50 text-green-700' : 'border-gray-300'
                                                        )}
                                                    >
                                                        <option value="available">Có thể dạy</option>
                                                        <option value="preferred">Ưu tiên</option>
                                                    </select>
                                                </div>

                                                {/* Remove */}
                                                <button
                                                    onClick={() => removeSlot(slot._id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-auto"
                                                    title="Xóa"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Sticky Save Bar (when has changes) */}
            {hasChanges && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-50">
                    <div className="max-w-5xl mx-auto flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                            <span className="inline-block w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
                            Có thay đổi chưa được lưu
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleDiscard}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Lưu thay đổi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TeacherAvailabilityPage;
