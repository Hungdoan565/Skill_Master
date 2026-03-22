import { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { TimeSelect } from '@/components/ui/time-select';
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

const SLOT_TYPE_STYLES = {
    available: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300',
    preferred: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
};

const DAYS_OF_WEEK = [
    { value: 1, label: 'Thứ 2', short: 'T2' },
    { value: 2, label: 'Thứ 3', short: 'T3' },
    { value: 3, label: 'Thứ 4', short: 'T4' },
    { value: 4, label: 'Thứ 5', short: 'T5' },
    { value: 5, label: 'Thứ 6', short: 'T6' },
    { value: 6, label: 'Thứ 7', short: 'T7' },
    { value: 0, label: 'Chủ nhật', short: 'CN' }
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
    useEffect(() => {
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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Đang tải lịch trống...</p>
                </div>
            </div>
        );
    }

    if (error && !localSlots.length) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center p-6 bg-red-500/10 rounded-2xl max-w-md">
                    <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-red-500 mb-2">Đã có lỗi xảy ra</h2>
                    <p className="text-red-500 mb-4">{error}</p>
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
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Clock className="h-6 w-6 text-blue-500" />
                        Lịch trống
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Cập nhật lịch trống để admin có thể xếp lịch dạy phù hợp cho bạn
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {hasChanges && (
                        <>
                            <button
                                onClick={handleDiscard}
                                className="px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-colors"
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
                        className="p-2 text-muted-foreground bg-card border border-border rounded-lg hover:bg-muted transition-colors"
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
                    saveMessage.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
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
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 mb-6">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                        <h3 className="font-medium text-blue-500">Hướng dẫn</h3>
                        <p className="text-sm text-blue-500 mt-1">
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
                    const totalDuration = daySlots.reduce((sum, slot) => {
                        const [sh = 0, sm = 0] = String(slot.start_time || '00:00').split(':').map(Number);
                        const [eh = 0, em = 0] = String(slot.end_time || '00:00').split(':').map(Number);
                        const startMinutes = sh * 60 + sm;
                        const endMinutes = eh * 60 + em;
                        return sum + Math.max(endMinutes - startMinutes, 0);
                    }, 0);
                    const totalHours = (totalDuration / 60).toFixed(totalDuration % 60 === 0 ? 0 : 1);

                    return (
                        <div
                            key={day.value}
                            className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
                        >
                            {/* Day Header */}
                            <div className="flex items-center justify-between px-4 py-3.5 bg-muted border-b border-border">
                                <div className="flex items-center gap-3">
                                    <span className="w-10 h-10 flex items-center justify-center bg-blue-500/20 text-blue-500 font-bold rounded-xl">
                                        {day.short}
                                    </span>
                                    <div className="space-y-0.5">
                                        <p className="font-semibold text-foreground">{day.label}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {daySlots.length} khung giờ • {totalHours} giờ khả dụng
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => addSlot(day.value)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                    <Plus className="h-4 w-4" />
                                    Thêm
                                </button>
                            </div>

                            {/* Day Slots */}
                            <div className="p-4">
                                {daySlots.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-4">
                                        Chưa có lịch trống. Nhấn "Thêm" để thêm khung giờ.
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {daySlots.map((slot) => (
                                            <div
                                                key={slot._id}
                                                className="p-3.5 bg-muted rounded-xl border border-border"
                                            >
                                                <div className="flex flex-col lg:flex-row lg:items-center gap-3.5">
                                                    <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                                                        <Clock className="h-5 w-5" />
                                                        <span className="text-sm font-medium">Khung giờ</span>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 flex-1">
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Từ</label>
                                                            <TimeSelect
                                                                value={slot.start_time}
                                                                onChange={(val) => updateSlot(slot._id, 'start_time', val)}
                                                                className="w-full"
                                                            />
                                                        </div>

                                                        <div className="space-y-1">
                                                            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Đến</label>
                                                            <TimeSelect
                                                                value={slot.end_time}
                                                                onChange={(val) => updateSlot(slot._id, 'end_time', val)}
                                                                className="w-full"
                                                            />
                                                        </div>

                                                        <div className="space-y-1">
                                                            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Loại</label>
                                                            <select
                                                                value={slot.type || 'available'}
                                                                onChange={(e) => updateSlot(slot._id, 'type', e.target.value)}
                                                                className={cn(
                                                                    'w-full px-3 py-2 border rounded-lg text-sm bg-card text-foreground focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                                                                    SLOT_TYPE_STYLES[slot.type || 'available'] || 'border-border'
                                                                )}
                                                            >
                                                                <option value="available">Có thể dạy</option>
                                                                <option value="preferred">Ưu tiên</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div className="flex lg:block">
                                                        <button
                                                            onClick={() => removeSlot(slot._id)}
                                                            className="inline-flex items-center gap-1.5 p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors ml-auto"
                                                            title="Xóa"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                            <span className="text-sm lg:hidden">Xóa</span>
                                                        </button>
                                                    </div>
                                                </div>
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
                <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t border-border shadow-lg p-4 z-50">
                    <div className="max-w-5xl mx-auto flex items-center justify-between">
                        <p className="text-sm text-muted-foreground font-medium">
                            <span className="inline-block w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
                            Có thay đổi chưa được lưu
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleDiscard}
                                className="px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
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
