/**
 * RecurringSessionsBuilder Component
 * Modal for bulk creating recurring sessions with pattern configuration
 */

import { useState, useMemo } from 'react';
import {
    X,
    Calendar,
    Clock,
    AlertTriangle,
    Check,
    ChevronRight,
    ChevronLeft,
    Repeat,
    CalendarDays,
    Info,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Days of week configuration
const DAYS_CONFIG = [
    { value: 2, label: 'T2', fullLabel: 'Thứ 2' },
    { value: 3, label: 'T3', fullLabel: 'Thứ 3' },
    { value: 4, label: 'T4', fullLabel: 'Thứ 4' },
    { value: 5, label: 'T5', fullLabel: 'Thứ 5' },
    { value: 6, label: 'T6', fullLabel: 'Thứ 6' },
    { value: 7, label: 'T7', fullLabel: 'Thứ 7' },
    { value: 8, label: 'CN', fullLabel: 'Chủ nhật' }
];

// Frequency options
const FREQUENCY_OPTIONS = [
    { value: 'weekly', label: 'Hàng tuần', description: 'Lặp lại mỗi tuần' },
    { value: 'biweekly', label: '2 tuần/lần', description: 'Lặp lại mỗi 2 tuần' },
    { value: 'daily', label: 'Hàng ngày', description: 'Mỗi ngày trong tuần đã chọn' }
];

// Vietnamese holidays 2025-2026
const HOLIDAYS = new Set([
    '2025-01-01', '2025-01-28', '2025-01-29', '2025-01-30', '2025-01-31',
    '2025-02-01', '2025-02-02', '2025-02-03', '2025-04-30', '2025-05-01', '2025-09-02',
    '2026-01-01', '2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19', '2026-02-20'
]);

// Steps configuration
const STEPS = [
    { id: 1, title: 'Chọn lịch', description: 'Chọn ngày và giờ học' },
    { id: 2, title: 'Cài đặt', description: 'Thời gian và tần suất' },
    { id: 3, title: 'Xem trước', description: 'Kiểm tra trước khi tạo' }
];

// Helper: Map day value to JS day (0=Sunday, 1=Monday, ...)
const dayMapping = {
    2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 0
};

// Helper: Generate sessions from pattern
function generateSessions(pattern) {
    const {
        daysOfWeek,
        startTime,
        endTime,
        startDate,
        endDate,
        excludeDates,
        frequency
    } = pattern;

    if (!daysOfWeek.length || !startDate || !endDate || !startTime || !endTime) {
        return [];
    }

    const sessions = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const excludeSet = new Set(excludeDates);

    // Create set of JS days to check
    const scheduleDays = new Set(daysOfWeek.map(d => dayMapping[d]));

    let sessionNumber = 1;
    let weekCount = 0;
    let lastWeek = -1;

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay();
        const dateStr = d.toISOString().split('T')[0];
        const weekNumber = Math.floor((d - start) / (7 * 24 * 60 * 60 * 1000));

        // Track week changes for biweekly
        if (weekNumber !== lastWeek) {
            lastWeek = weekNumber;
            weekCount++;
        }

        // Skip biweekly odd weeks
        if (frequency === 'biweekly' && weekCount % 2 === 0) continue;

        // Check if this day is in schedule and not excluded
        if (scheduleDays.has(dayOfWeek) && !excludeSet.has(dateStr) && !HOLIDAYS.has(dateStr)) {
            sessions.push({
                session_number: sessionNumber++,
                session_date: dateStr,
                day_name: DAYS_CONFIG.find(dc => dayMapping[dc.value] === dayOfWeek)?.fullLabel || '',
                start_time: startTime,
                end_time: endTime,
                status: 'scheduled',
                isHoliday: false,
                isExcluded: false
            });
        }
    }

    return sessions;
}

export function RecurringSessionsBuilder({
    isOpen,
    onClose,
    onSubmit,
    classInfo,
    existingSessionsCount = 0,
    loading = false
}) {
    // State
    const [currentStep, setCurrentStep] = useState(1);
    const [pattern, setPattern] = useState({
        frequency: 'weekly',
        daysOfWeek: classInfo?.schedule?.map(s => s.day) || [],
        startTime: classInfo?.schedule?.[0]?.start || '18:00',
        endTime: classInfo?.schedule?.[0]?.end || '20:00',
        startDate: classInfo?.start_date || '',
        endDate: classInfo?.end_date || '',
        excludeDates: []
    });
    const [excludeInput, setExcludeInput] = useState('');

    // Generate preview sessions
    const previewSessions = useMemo(() => {
        return generateSessions(pattern);
    }, [pattern]);

    // Stats
    const stats = useMemo(() => {
        const total = previewSessions.length;
        const weekdays = previewSessions.filter(s => {
            const d = new Date(s.session_date).getDay();
            return d >= 1 && d <= 5;
        }).length;
        const weekends = total - weekdays;
        return { total, weekdays, weekends };
    }, [previewSessions]);

    // Handlers
    const updatePattern = (key, value) => {
        setPattern(prev => ({ ...prev, [key]: value }));
    };

    const toggleDay = (day) => {
        setPattern(prev => ({
            ...prev,
            daysOfWeek: prev.daysOfWeek.includes(day)
                ? prev.daysOfWeek.filter(d => d !== day)
                : [...prev.daysOfWeek, day].sort((a, b) => a - b)
        }));
    };

    const addExcludeDate = () => {
        if (excludeInput && !pattern.excludeDates.includes(excludeInput)) {
            updatePattern('excludeDates', [...pattern.excludeDates, excludeInput]);
            setExcludeInput('');
        }
    };

    const removeExcludeDate = (date) => {
        updatePattern('excludeDates', pattern.excludeDates.filter(d => d !== date));
    };

    const handleSubmit = () => {
        onSubmit({
            pattern,
            sessions: previewSessions
        });
    };

    const canProceed = () => {
        switch (currentStep) {
            case 1:
                return pattern.daysOfWeek.length > 0;
            case 2:
                return pattern.startDate && pattern.endDate && pattern.startTime && pattern.endTime;
            case 3:
                return previewSessions.length > 0 && previewSessions.length <= 100;
            default:
                return false;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <Repeat className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">Tạo nhiều buổi học</h2>
                            <p className="text-sm text-slate-500">
                                {classInfo?.name} • {existingSessionsCount} buổi hiện tại
                            </p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Steps Indicator */}
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between max-w-md mx-auto">
                        {STEPS.map((step, index) => (
                            <div key={step.id} className="flex items-center">
                                <div className="flex flex-col items-center">
                                    <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${currentStep > step.id
                                            ? 'bg-green-500 text-white'
                                            : currentStep === step.id
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-slate-200 text-slate-600'
                                        }
                  `}>
                                        {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
                                    </div>
                                    <div className="mt-1 text-center">
                                        <p className={`text-xs font-medium ${currentStep >= step.id ? 'text-slate-900' : 'text-slate-500'}`}>
                                            {step.title}
                                        </p>
                                    </div>
                                </div>
                                {index < STEPS.length - 1 && (
                                    <div className={`w-20 h-0.5 mx-2 ${currentStep > step.id ? 'bg-green-500' : 'bg-slate-200'}`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Step 1: Choose Schedule */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <div>
                                <Label className="text-base font-medium">Chọn các ngày trong tuần</Label>
                                <p className="text-sm text-slate-500 mt-1">Chọn những ngày sẽ có buổi học</p>
                                <div className="grid grid-cols-7 gap-2 mt-4">
                                    {DAYS_CONFIG.map(day => (
                                        <button
                                            key={day.value}
                                            onClick={() => toggleDay(day.value)}
                                            className={`
                        p-3 rounded-lg border-2 text-center transition-all
                        ${pattern.daysOfWeek.includes(day.value)
                                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                                }
                      `}
                                        >
                                            <div className="font-bold text-lg">{day.label}</div>
                                            <div className="text-xs mt-1">{day.fullLabel}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Frequency */}
                            <div>
                                <Label className="text-base font-medium">Tần suất lặp lại</Label>
                                <div className="grid grid-cols-3 gap-3 mt-3">
                                    {FREQUENCY_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => updatePattern('frequency', opt.value)}
                                            className={`
                        p-4 rounded-lg border-2 text-left transition-all
                        ${pattern.frequency === opt.value
                                                    ? 'border-indigo-500 bg-indigo-50'
                                                    : 'border-slate-200 hover:border-slate-300'
                                                }
                      `}
                                        >
                                            <div className="font-medium">{opt.label}</div>
                                            <div className="text-xs text-slate-500 mt-1">{opt.description}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Settings */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            {/* Date Range */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Ngày bắt đầu</Label>
                                    <Input
                                        type="date"
                                        value={pattern.startDate}
                                        onChange={(e) => updatePattern('startDate', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label>Ngày kết thúc</Label>
                                    <Input
                                        type="date"
                                        value={pattern.endDate}
                                        onChange={(e) => updatePattern('endDate', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            {/* Time Range */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Giờ bắt đầu</Label>
                                    <Input
                                        type="time"
                                        value={pattern.startTime}
                                        onChange={(e) => updatePattern('startTime', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label>Giờ kết thúc</Label>
                                    <Input
                                        type="time"
                                        value={pattern.endTime}
                                        onChange={(e) => updatePattern('endTime', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            {/* Exclude Dates */}
                            <div>
                                <Label>Ngày nghỉ thêm (không bắt buộc)</Label>
                                <p className="text-sm text-slate-500 mt-1">
                                    Các ngày lễ Việt Nam đã được tự động loại trừ
                                </p>
                                <div className="flex gap-2 mt-2">
                                    <Input
                                        type="date"
                                        value={excludeInput}
                                        onChange={(e) => setExcludeInput(e.target.value)}
                                        className="flex-1"
                                    />
                                    <Button onClick={addExcludeDate} variant="outline">
                                        Thêm
                                    </Button>
                                </div>
                                {pattern.excludeDates.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {pattern.excludeDates.map(date => (
                                            <span
                                                key={date}
                                                className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-sm"
                                            >
                                                {new Date(date).toLocaleDateString('vi-VN')}
                                                <button
                                                    onClick={() => removeExcludeDate(date)}
                                                    className="hover:text-red-600"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex items-start gap-2 p-4 bg-blue-50 rounded-lg">
                                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                                <div className="text-sm text-blue-700">
                                    <p className="font-medium">Lưu ý:</p>
                                    <ul className="list-disc list-inside mt-1 space-y-1">
                                        <li>Các ngày lễ Tết Nguyên Đán, 30/4, 1/5, 2/9 sẽ tự động được bỏ qua</li>
                                        <li>Tối đa 100 buổi học mỗi lần tạo</li>
                                        <li>Các buổi học hiện có sẽ được giữ nguyên</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Preview */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            {/* Stats Summary */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 bg-indigo-50 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-indigo-600">{stats.total}</div>
                                    <div className="text-sm text-slate-600">Tổng buổi học</div>
                                </div>
                                <div className="p-4 bg-green-50 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-green-600">{stats.weekdays}</div>
                                    <div className="text-sm text-slate-600">Ngày trong tuần</div>
                                </div>
                                <div className="p-4 bg-amber-50 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-amber-600">{stats.weekends}</div>
                                    <div className="text-sm text-slate-600">Cuối tuần</div>
                                </div>
                            </div>

                            {/* Warning if too many */}
                            {previewSessions.length > 100 && (
                                <div className="flex items-center gap-2 p-4 bg-red-50 rounded-lg text-red-700">
                                    <AlertTriangle className="w-5 h-5" />
                                    <span>Số buổi học vượt quá 100. Vui lòng điều chỉnh khoảng thời gian.</span>
                                </div>
                            )}

                            {/* Sessions List */}
                            <div>
                                <h3 className="font-medium mb-3">Danh sách buổi học ({previewSessions.length})</h3>
                                <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 sticky top-0">
                                            <tr>
                                                <th className="text-left p-3 font-medium">Buổi</th>
                                                <th className="text-left p-3 font-medium">Ngày</th>
                                                <th className="text-left p-3 font-medium">Thứ</th>
                                                <th className="text-left p-3 font-medium">Giờ học</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {previewSessions.map((session, index) => (
                                                <tr key={index} className="hover:bg-slate-50">
                                                    <td className="p-3">
                                                        <span className="font-medium">#{session.session_number}</span>
                                                    </td>
                                                    <td className="p-3">
                                                        {new Date(session.session_date).toLocaleDateString('vi-VN')}
                                                    </td>
                                                    <td className="p-3 text-slate-600">{session.day_name}</td>
                                                    <td className="p-3">
                                                        <span className="inline-flex items-center gap-1">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            {session.start_time} - {session.end_time}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50">
                    <Button
                        variant="outline"
                        onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                        disabled={currentStep === 1}
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Quay lại
                    </Button>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={onClose}>
                            Hủy
                        </Button>
                        {currentStep < 3 ? (
                            <Button
                                onClick={() => setCurrentStep(prev => Math.min(3, prev + 1))}
                                disabled={!canProceed()}
                            >
                                Tiếp tục
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                disabled={!canProceed() || loading}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Đang tạo...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4 mr-2" />
                                        Tạo {previewSessions.length} buổi học
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

export default RecurringSessionsBuilder;
