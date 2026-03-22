/**
 * BulkSessionsModal - Tạo nhiều buổi học theo lịch định kỳ
 * Phase 1.3: Recurring Sessions Builder
 */

import { useState, useMemo, useCallback } from 'react';
import {
    X,
    Calendar,
    Clock,
    AlertTriangle,
    CheckCircle2,
    Loader2,
    ChevronLeft,
    ChevronRight,
    CalendarDays,
    Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TimeSelect } from '@/components/ui/time-select';

// Day configuration (Vietnamese week)
const DAYS_CONFIG = [
    { value: 2, label: 'Thứ 2', short: 'T2' },
    { value: 3, label: 'Thứ 3', short: 'T3' },
    { value: 4, label: 'Thứ 4', short: 'T4' },
    { value: 5, label: 'Thứ 5', short: 'T5' },
    { value: 6, label: 'Thứ 6', short: 'T6' },
    { value: 7, label: 'Thứ 7', short: 'T7' },
    { value: 8, label: 'Chủ nhật', short: 'CN' }
];

// Vietnamese holidays (2025-2026)
const HOLIDAYS = new Set([
    '2025-01-01', '2025-01-28', '2025-01-29', '2025-01-30', '2025-01-31',
    '2025-02-01', '2025-02-02', '2025-02-03', '2025-04-30', '2025-05-01', '2025-09-02',
    '2026-01-01', '2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19', '2026-02-20'
]);

// Steps
const STEPS = [
    { id: 1, title: 'Cấu hình lịch', description: 'Chọn ngày và giờ học' },
    { id: 2, title: 'Xem trước', description: 'Kiểm tra danh sách buổi học' },
    { id: 3, title: 'Xác nhận', description: 'Tạo buổi học' }
];

export function BulkSessionsModal({
    isOpen,
    onClose,
    classData,
    onSuccess,
    existingSessionsCount = 0
}) {
    // Current step
    const [currentStep, setCurrentStep] = useState(1);

    // Form state
    const [selectedDays, setSelectedDays] = useState(() => {
        // Initialize from class schedule if available
        if (classData?.schedule && Array.isArray(classData.schedule)) {
            return classData.schedule.map(s => s.day);
        }
        return [];
    });

    const [startTime, setStartTime] = useState(() => {
        if (classData?.schedule?.[0]?.start) {
            return classData.schedule[0].start;
        }
        return '18:00';
    });

    const [endTime, setEndTime] = useState(() => {
        if (classData?.schedule?.[0]?.end) {
            return classData.schedule[0].end;
        }
        return '20:00';
    });

    const [dateRange, setDateRange] = useState({
        start: classData?.start_date || new Date().toISOString().split('T')[0],
        end: classData?.end_date || ''
    });

    const [skipHolidays, setSkipHolidays] = useState(true);
    const [customExcludeDates, setCustomExcludeDates] = useState([]);

    // Loading and error states
    const [loading, setLoading] = useState(false);
    const [previewing, setPreviewing] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [conflicts, setConflicts] = useState([]);
    const [error, setError] = useState(null);

    // Toggle day selection
    const toggleDay = useCallback((day) => {
        setSelectedDays(prev =>
            prev.includes(day)
                ? prev.filter(d => d !== day)
                : [...prev, day].sort((a, b) => a - b)
        );
    }, []);

    // Generate preview sessions (client-side calculation)
    const previewSessions = useMemo(() => {
        if (!dateRange.start || !dateRange.end || selectedDays.length === 0) {
            return [];
        }

        // Day mapping: Vietnamese day (2-8) to JS getDay() (0-6)
        const dayMapping = {
            2: 1, // T2 -> Monday (1)
            3: 2, // T3 -> Tuesday (2)
            4: 3, // T4 -> Wednesday (3)
            5: 4, // T5 -> Thursday (4)
            6: 5, // T6 -> Friday (5)
            7: 6, // T7 -> Saturday (6)
            8: 0  // CN -> Sunday (0)
        };

        const scheduleDays = new Set(selectedDays.map(d => dayMapping[d]));
        const sessions = [];

        // Parse dates as local time to avoid timezone issues
        const [startYear, startMonth, startDay] = dateRange.start.split('-').map(Number);
        const [endYear, endMonth, endDay] = dateRange.end.split('-').map(Number);
        const start = new Date(startYear, startMonth - 1, startDay);
        const end = new Date(endYear, endMonth - 1, endDay);

        let sessionNumber = existingSessionsCount + 1;

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dayOfWeek = d.getDay();
            // Format date as YYYY-MM-DD without timezone conversion
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

            // Check if this day is in schedule
            if (!scheduleDays.has(dayOfWeek)) continue;

            // Check if should skip holiday
            if (skipHolidays && HOLIDAYS.has(dateStr)) continue;

            // Check if in custom exclude dates
            if (customExcludeDates.includes(dateStr)) continue;

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const sessionDate = new Date(d);
            sessionDate.setHours(0, 0, 0, 0);

            sessions.push({
                session_number: sessionNumber,
                session_date: dateStr,
                start_time: startTime,
                end_time: endTime,
                status: sessionDate < today ? 'completed' : 'upcoming',
                dayLabel: DAYS_CONFIG.find(dc => dc.value === selectedDays.find(sd => dayMapping[sd] === dayOfWeek))?.short || ''
            });
            sessionNumber++;
        }

        return sessions;
    }, [dateRange, selectedDays, startTime, endTime, skipHolidays, customExcludeDates, existingSessionsCount]);

    // Check for conflicts via API
    const checkConflicts = useCallback(async () => {
        if (previewSessions.length === 0) return;

        setPreviewing(true);
        setError(null);

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const token = localStorage.getItem('supabase_token') || '';

            // Get token from supabase session
            const { data: { session } } = await (await import('@/lib/supabaseClient')).supabase.auth.getSession();

            const response = await fetch(`${API_URL}/api/classes/${classData.id}/sessions/preview`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    schedule: selectedDays.map(day => ({
                        day,
                        start: startTime,
                        end: endTime
                    })),
                    start_date: dateRange.start,
                    end_date: dateRange.end,
                    skip_holidays: skipHolidays,
                    exclude_dates: customExcludeDates
                })
            });

            const data = await response.json();

            if (data.success) {
                setPreviewData(data.data);
                setConflicts(data.data.conflicts || []);
            } else {
                setError(data.message || 'Không thể kiểm tra xung đột');
            }
        } catch (err) {
            console.error('Preview error:', err);
            setError('Không thể kết nối server');
        } finally {
            setPreviewing(false);
        }
    }, [classData?.id, previewSessions, selectedDays, startTime, endTime, dateRange, skipHolidays, customExcludeDates]);

    // Create sessions
    const createSessions = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const { data: { session } } = await (await import('@/lib/supabaseClient')).supabase.auth.getSession();

            const response = await fetch(`${API_URL}/api/classes/${classData.id}/sessions/bulk`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    schedule: selectedDays.map(day => ({
                        day,
                        start: startTime,
                        end: endTime
                    })),
                    start_date: dateRange.start,
                    end_date: dateRange.end,
                    skip_holidays: skipHolidays,
                    exclude_dates: customExcludeDates,
                    replace_existing: false // Default: append, not replace
                })
            });

            const data = await response.json();

            if (data.success) {
                onSuccess?.(data.data);
                onClose();
            } else {
                setError(data.message || 'Không thể tạo buổi học');
            }
        } catch (err) {
            console.error('Create sessions error:', err);
            setError('Không thể kết nối server');
        } finally {
            setLoading(false);
        }
    }, [classData?.id, selectedDays, startTime, endTime, dateRange, skipHolidays, customExcludeDates, onSuccess, onClose]);

    // Navigation
    const goToStep = (step) => {
        if (step === 2) {
            // Validate before going to preview
            if (selectedDays.length === 0) {
                setError('Vui lòng chọn ít nhất 1 ngày học');
                return;
            }
            if (!dateRange.start || !dateRange.end) {
                setError('Vui lòng chọn ngày bắt đầu và kết thúc');
                return;
            }
            if (new Date(dateRange.end) < new Date(dateRange.start)) {
                setError('Ngày kết thúc phải sau ngày bắt đầu');
                return;
            }
            checkConflicts();
        }
        setError(null);
        setCurrentStep(step);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl flex items-center justify-center">
                            <CalendarDays className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Tạo nhiều buổi học</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Lớp: {classData?.name} • {existingSessionsCount} buổi hiện có
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    </button>
                </div>

                {/* Steps indicator */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        {STEPS.map((step, index) => (
                            <div key={step.id} className="flex items-center">
                                <div className="flex items-center gap-3">
                                    <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                    ${currentStep === step.id
                                            ? 'bg-indigo-600 dark:bg-indigo-500 text-white'
                                            : currentStep > step.id
                                                ? 'bg-green-500 text-white'
                                                : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                                        }
                  `}>
                                        {currentStep > step.id ? <CheckCircle2 className="w-5 h-5" /> : step.id}
                                    </div>
                                    <div className="hidden sm:block">
                                        <p className="text-sm font-medium text-slate-900 dark:text-slate-200">{step.title}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{step.description}</p>
                                    </div>
                                </div>
                                {index < STEPS.length - 1 && (
                                    <div className={`
                    w-12 h-0.5 mx-4
                    ${currentStep > step.id ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}
                  `} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Error message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400">
                            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {/* Step 1: Configuration */}
                    {currentStep === 1 && (
                        <Step1Config
                            selectedDays={selectedDays}
                            onToggleDay={toggleDay}
                            startTime={startTime}
                            endTime={endTime}
                            onStartTimeChange={setStartTime}
                            onEndTimeChange={setEndTime}
                            dateRange={dateRange}
                            onDateRangeChange={setDateRange}
                            skipHolidays={skipHolidays}
                            onSkipHolidaysChange={setSkipHolidays}
                            previewCount={previewSessions.length}
                        />
                    )}

                    {/* Step 2: Preview */}
                    {currentStep === 2 && (
                        <Step2Preview
                            sessions={previewSessions}
                            conflicts={conflicts}
                            loading={previewing}
                            onExcludeDate={(date) => setCustomExcludeDates(prev => [...prev, date])}
                            excludedDates={customExcludeDates}
                            onIncludeDate={(date) => setCustomExcludeDates(prev => prev.filter(d => d !== date))}
                        />
                    )}

                    {/* Step 3: Confirm */}
                    {currentStep === 3 && (
                        <Step3Confirm
                            sessionCount={previewSessions.length}
                            conflictCount={conflicts.length}
                            dateRange={dateRange}
                            selectedDays={selectedDays}
                            classData={classData}
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <Button
                        variant="outline"
                        onClick={() => currentStep > 1 ? goToStep(currentStep - 1) : onClose()}
                        className="dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        {currentStep > 1 ? 'Quay lại' : 'Hủy'}
                    </Button>

                    <div className="flex items-center gap-3">
                        {currentStep < 3 ? (
                            <Button
                                onClick={() => goToStep(currentStep + 1)}
                                disabled={previewing || (currentStep === 1 && previewSessions.length === 0)}
                            >
                                {previewing ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <ChevronRight className="w-4 h-4 mr-2" />
                                )}
                                Tiếp tục
                            </Button>
                        ) : (
                            <Button
                                onClick={createSessions}
                                disabled={loading || conflicts.length > 0}
                                className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                )}
                                Tạo {previewSessions.length} buổi học
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Step 1: Configuration Component
function Step1Config({
    selectedDays,
    onToggleDay,
    startTime,
    endTime,
    onStartTimeChange,
    onEndTimeChange,
    dateRange,
    onDateRangeChange,
    skipHolidays,
    onSkipHolidaysChange,
    previewCount
}) {
    return (
        <div className="space-y-6">
            {/* Day Selection */}
            <div>
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 block">
                    Chọn các ngày trong tuần có học
                </Label>
                <div className="flex flex-wrap gap-2">
                    {DAYS_CONFIG.map(day => (
                        <button
                            key={day.value}
                            onClick={() => onToggleDay(day.value)}
                            className={`
                px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all
                ${selectedDays.includes(day.value)
                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400'
                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                                }
              `}
                        >
                            {day.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Time Selection */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Giờ bắt đầu
                    </Label>
                    <TimeSelect
                        value={startTime}
                        onChange={(val) => onStartTimeChange(val)}
                        className="w-full"
                    />
                </div>
                <div>
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Giờ kết thúc
                    </Label>
                    <TimeSelect
                        value={endTime}
                        onChange={(val) => onEndTimeChange(val)}
                        className="w-full"
                    />
                </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Ngày bắt đầu
                    </Label>
                    <Input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => onDateRangeChange({ ...dateRange, start: e.target.value })}
                        className="dark:bg-slate-800 dark:border-slate-700"
                    />
                </div>
                <div>
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Ngày kết thúc
                    </Label>
                    <Input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => onDateRangeChange({ ...dateRange, end: e.target.value })}
                        className="dark:bg-slate-800 dark:border-slate-700"
                    />
                </div>
            </div>

            {/* Options */}
            <div className="flex items-center gap-3">
                <input
                    type="checkbox"
                    id="skipHolidays"
                    checked={skipHolidays}
                    onChange={(e) => onSkipHolidaysChange(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 dark:text-indigo-500 border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded focus:ring-indigo-500 dark:focus:ring-indigo-400"
                />
                <label htmlFor="skipHolidays" className="text-sm text-slate-700 dark:text-slate-300">
                    Bỏ qua các ngày lễ Việt Nam (Tết, 30/4, 1/5, 2/9...)
                </label>
            </div>

            {/* Preview count */}
            {previewCount > 0 && (
                <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg border border-indigo-100 dark:border-indigo-500/20">
                    <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                        <Info className="w-5 h-5" />
                        <span className="font-medium">
                            Dự kiến tạo {previewCount} buổi học
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

// Step 2: Preview Component
function Step2Preview({
    sessions,
    conflicts,
    loading,
    onExcludeDate,
    excludedDates,
    onIncludeDate
}) {
    const [filter, setFilter] = useState('all'); // 'all', 'conflicts'

    const filteredSessions = useMemo(() => {
        if (filter === 'conflicts') {
            return sessions.filter(s => conflicts.some(c => c.session_date === s.session_date));
        }
        return sessions;
    }, [sessions, filter, conflicts]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin mb-4" />
                <p className="text-slate-500 dark:text-slate-400">Đang kiểm tra xung đột...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Summary */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Tổng:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{sessions.length} buổi</span>
                </div>
                {conflicts.length > 0 && (
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm font-medium">{conflicts.length} xung đột</span>
                    </div>
                )}
            </div>

            {/* Conflicts warning */}
            {conflicts.length > 0 && (
                <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-amber-800 dark:text-amber-400">Phát hiện xung đột lịch</p>
                            <p className="text-sm text-amber-700 dark:text-amber-500 mt-1">
                                Có {conflicts.length} buổi học bị trùng với lớp khác hoặc lịch giáo viên.
                                Vui lòng loại bỏ các ngày xung đột trước khi tiếp tục.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Filter tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${filter === 'all'
                        ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                >
                    Tất cả ({sessions.length})
                </button>
                {conflicts.length > 0 && (
                    <button
                        onClick={() => setFilter('conflicts')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${filter === 'conflicts'
                            ? 'border-amber-600 text-amber-600 dark:border-amber-500 dark:text-amber-500'
                            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        Xung đột ({conflicts.length})
                    </button>
                )}
            </div>

            {/* Sessions list */}
            <div className="max-h-[400px] overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">Buổi</th>
                            <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">Ngày</th>
                            <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">Thời gian</th>
                            <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">Trạng thái</th>
                            <th className="px-4 py-3 text-center font-medium text-slate-600 dark:text-slate-300">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {filteredSessions.map((session, idx) => {
                            const hasConflict = conflicts.some(c => c.session_date === session.session_date);
                            const isExcluded = excludedDates.includes(session.session_date);

                            return (
                                <tr
                                    key={idx}
                                    className={`
                    ${hasConflict ? 'bg-amber-50 dark:bg-amber-500/10' : ''}
                    ${isExcluded ? 'bg-slate-100 dark:bg-slate-800 opacity-50' : 'dark:bg-transparent'}
                  `}
                                >
                                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                                        #{session.session_number}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                                        {session.dayLabel} - {formatDate(session.session_date)}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                                        {session.start_time} - {session.end_time}
                                    </td>
                                    <td className="px-4 py-3">
                                        {hasConflict ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium">
                                                <AlertTriangle className="w-3 h-3" />
                                                Xung đột
                                            </span>
                                        ) : isExcluded ? (
                                            <span className="text-slate-400 dark:text-slate-500 text-xs">Đã loại bỏ</span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                                                <CheckCircle2 className="w-3 h-3" />
                                                OK
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {!isExcluded ? (
                                            <button
                                                onClick={() => onExcludeDate(session.session_date)}
                                                className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
                                            >
                                                Loại bỏ
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => onIncludeDate(session.session_date)}
                                                className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                                            >
                                                Khôi phục
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// Step 3: Confirm Component
function Step3Confirm({ sessionCount, conflictCount, dateRange, selectedDays, classData }) {
    const dayLabels = selectedDays
        .map(d => DAYS_CONFIG.find(dc => dc.value === d)?.label)
        .filter(Boolean)
        .join(', ');

    return (
        <div className="space-y-6">
            <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    Sẵn sàng tạo buổi học
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                    Xác nhận thông tin bên dưới trước khi tạo
                </p>
            </div>

            {conflictCount > 0 && (
                <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-medium">
                            Còn {conflictCount} xung đột chưa được giải quyết
                        </span>
                    </div>
                    <p className="text-sm text-red-600 dark:text-red-500 mt-1">
                        Vui lòng quay lại bước trước và loại bỏ các buổi học bị xung đột
                    </p>
                </div>
            )}

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 space-y-4 border border-slate-100 dark:border-slate-700">
                <SummaryRow label="Lớp học" value={classData?.name} />
                <SummaryRow label="Số buổi" value={`${sessionCount} buổi`} highlight />
                <SummaryRow label="Ngày học" value={dayLabels} />
                <SummaryRow label="Từ ngày" value={formatDate(dateRange.start)} />
                <SummaryRow label="Đến ngày" value={formatDate(dateRange.end)} />
            </div>
        </div>
    );
}

// Helper components
function SummaryRow({ label, value, highlight }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-400">{label}</span>
            <span className={`font-medium ${highlight ? 'text-indigo-600 dark:text-indigo-400 text-lg' : 'text-slate-900 dark:text-slate-100'}`}>
                {value}
            </span>
        </div>
    );
}

// Helper functions
function formatDate(dateStr) {
    if (!dateStr) return '';
    // Parse date string as local time to avoid timezone issues
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('vi-VN', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

export default BulkSessionsModal;
