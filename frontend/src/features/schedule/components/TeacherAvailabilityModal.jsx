/**
 * TeacherAvailabilityModal - Modal quản lý lịch trống của giáo viên
 * Dùng chung schema teacher_availability với teacher portal
 */

import { useEffect, useMemo, useState } from 'react';
import {
    X,
    UserCog,
    Loader2,
    AlertCircle,
    Clock,
    Calendar,
    Plus,
    Trash2,
    Save,
    RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TimeSelect } from '@/components/ui/time-select';
import { supabase } from '@/lib/supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const DAYS_OF_WEEK = [
    { value: 1, label: 'Thứ 2', short: 'T2' },
    { value: 2, label: 'Thứ 3', short: 'T3' },
    { value: 3, label: 'Thứ 4', short: 'T4' },
    { value: 4, label: 'Thứ 5', short: 'T5' },
    { value: 5, label: 'Thứ 6', short: 'T6' },
    { value: 6, label: 'Thứ 7', short: 'T7' },
    { value: 0, label: 'Chủ nhật', short: 'CN' }
];

const SLOT_TYPE_OPTIONS = [
    { value: 'available', label: 'Có thể dạy' },
    { value: 'preferred', label: 'Ưu tiên' }
];

const formatDateTime = (value) => {
    if (!value) return '--';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '--';
    return date.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit'
    });
};

const normalizeDay = (value) => {
    if (value === null || value === undefined || value === '') return 1;
    const num = Number(value);
    if (!Number.isFinite(num)) return 1;

    // legacy mapping: 2..8 => 1..0
    if (num >= 2 && num <= 8) {
        return num === 8 ? 0 : num - 1;
    }

    if (num >= 0 && num <= 6) return num;
    return 1;
};

const normalizeTime = (value, fallback = '08:00') => {
    if (!value || typeof value !== 'string') return fallback;
    return value.slice(0, 5);
};

const normalizeSlot = (slot, index = 0) => ({
    id: slot.id || `slot-${Date.now()}-${index}`,
    day_of_week: normalizeDay(slot.day_of_week),
    start_time: normalizeTime(slot.start_time, '08:00'),
    end_time: normalizeTime(slot.end_time, '10:00'),
    type: slot.type === 'preferred' ? 'preferred' : 'available'
});

const serializeSlotsForCompare = (slots = []) => JSON.stringify(
    [...slots]
        .map((slot) => ({
            day_of_week: normalizeDay(slot.day_of_week),
            start_time: normalizeTime(slot.start_time),
            end_time: normalizeTime(slot.end_time),
            type: slot.type === 'preferred' ? 'preferred' : 'available'
        }))
        .sort((a, b) => {
            if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
            return a.start_time.localeCompare(b.start_time);
        })
);

export function TeacherAvailabilityModal({
    isOpen,
    onClose,
    teacher,
    onSuccess
}) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loadingTeachers, setLoadingTeachers] = useState(false);
    const [error, setError] = useState(null);

    const [teachers, setTeachers] = useState([]);
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [sourceSlots, setSourceSlots] = useState([]);
    const [draftSlots, setDraftSlots] = useState([]);

    useEffect(() => {
        if (!isOpen) return;
        setError(null);
        setSourceSlots([]);
        setDraftSlots([]);

        if (teacher?.id) {
            setSelectedTeacher(teacher);
            return;
        }

        setSelectedTeacher(null);
    }, [isOpen, teacher]);

    useEffect(() => {
        if (!isOpen || teacher?.id) return;

        const fetchTeachers = async () => {
            setLoadingTeachers(true);
            setError(null);

            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) throw new Error('Chưa đăng nhập');

                const response = await fetch(`${API_URL}/api/teachers`, {
                    headers: { Authorization: `Bearer ${session.access_token}` }
                });
                const json = await response.json();
                if (!response.ok) throw new Error(json?.message || 'Không tải được danh sách giáo viên');

                const teacherList = json?.data || [];
                setTeachers(teacherList);

                if (!selectedTeacher?.id && teacherList.length > 0) {
                    const sorted = [...teacherList].sort((a, b) => {
                        const aDate = new Date(a.updated_at || a.created_at || 0).getTime();
                        const bDate = new Date(b.updated_at || b.created_at || 0).getTime();
                        return bDate - aDate;
                    });
                    setSelectedTeacher(sorted[0]);
                }
            } catch (fetchError) {
                setError(fetchError.message || 'Không tải được danh sách giáo viên');
            } finally {
                setLoadingTeachers(false);
            }
        };

        fetchTeachers();
    }, [isOpen, teacher?.id, selectedTeacher?.id]);

    useEffect(() => {
        if (!isOpen || !selectedTeacher?.id) return;

        const fetchAvailability = async () => {
            setLoading(true);
            setError(null);

            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) throw new Error('Chưa đăng nhập');

                const response = await fetch(`${API_URL}/api/admin/teacher-availability/${selectedTeacher.id}`, {
                    headers: { Authorization: `Bearer ${session.access_token}` }
                });
                const json = await response.json();
                if (!response.ok) throw new Error(json?.message || 'Không tải được lịch giáo viên');

                const normalized = (json?.data || []).map((slot, index) => normalizeSlot(slot, index));
                setSourceSlots(normalized);
                setDraftSlots(normalized);
            } catch (fetchError) {
                setError(fetchError.message || 'Không tải được lịch giáo viên');
            } finally {
                setLoading(false);
            }
        };

        fetchAvailability();
    }, [isOpen, selectedTeacher?.id]);

    const groupedByDay = useMemo(() => {
        const grouped = DAYS_OF_WEEK.reduce((acc, day) => ({ ...acc, [day.value]: [] }), {});
        draftSlots.forEach((slot) => {
            const day = normalizeDay(slot.day_of_week);
            if (!grouped[day]) grouped[day] = [];
            grouped[day].push(slot);
        });

        Object.keys(grouped).forEach((dayKey) => {
            grouped[dayKey].sort((a, b) => a.start_time.localeCompare(b.start_time));
        });

        return grouped;
    }, [draftSlots]);

    const hasChanges = useMemo(() => (
        serializeSlotsForCompare(sourceSlots) !== serializeSlotsForCompare(draftSlots)
    ), [sourceSlots, draftSlots]);

    const filteredTeachers = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();
        if (!keyword) return teachers;
        return teachers.filter((item) => (
            `${item.full_name || ''} ${item.email || ''}`.toLowerCase().includes(keyword)
        ));
    }, [teachers, searchTerm]);

    const addSlot = (dayOfWeek) => {
        setDraftSlots((prev) => ([
            ...prev,
            {
                id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                day_of_week: dayOfWeek,
                start_time: '08:00',
                end_time: '10:00',
                type: 'available'
            }
        ]));
    };

    const updateSlot = (slotId, field, value) => {
        setDraftSlots((prev) => prev.map((slot) => (
            slot.id === slotId ? { ...slot, [field]: value } : slot
        )));
    };

    const removeSlot = (slotId) => {
        setDraftSlots((prev) => prev.filter((slot) => slot.id !== slotId));
    };

    const resetChanges = () => {
        setDraftSlots(sourceSlots);
    };

    const handleSave = async () => {
        if (!selectedTeacher?.id) {
            setError('Vui lòng chọn giáo viên');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Chưa đăng nhập');

            const payload = draftSlots.map((slot) => ({
                day_of_week: normalizeDay(slot.day_of_week),
                start_time: normalizeTime(slot.start_time, '08:00'),
                end_time: normalizeTime(slot.end_time, '10:00'),
                type: slot.type === 'preferred' ? 'preferred' : 'available'
            }));

            const response = await fetch(`${API_URL}/api/admin/teacher-availability/${selectedTeacher.id}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ slots: payload })
            });

            const json = await response.json();
            if (!response.ok) throw new Error(json?.message || 'Không thể lưu lịch giáo viên');

            const refreshed = await fetch(`${API_URL}/api/admin/teacher-availability/${selectedTeacher.id}`, {
                headers: { Authorization: `Bearer ${session.access_token}` }
            });
            const refreshedJson = await refreshed.json();

            const normalized = (refreshedJson?.data || []).map((slot, index) => normalizeSlot(slot, index));
            setSourceSlots(normalized);
            setDraftSlots(normalized);
            onSuccess?.();
        } catch (saveError) {
            setError(saveError.message || 'Không thể lưu lịch giáo viên');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <div
                className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl m-4 max-h-[92vh] overflow-hidden flex flex-col"
                role="dialog"
                aria-modal="true"
                aria-labelledby="teacher-avail-dialog-title"
            >
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <UserCog className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white" id="teacher-avail-dialog-title">Lịch Rảnh/Bận Giáo Viên</h2>
                                <p className="text-orange-100 text-sm">
                                    {selectedTeacher?.full_name || 'Chọn giáo viên để xem lịch đã gửi'}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    {selectedTeacher?.id ? (
                        loading ? (
                            <div className="py-10 text-center">
                                <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
                                <p className="text-sm text-slate-500 dark:text-gray-400 mt-2">Đang tải lịch giáo viên...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                                {!teacher?.id && (
                                    <aside className="lg:col-span-4 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden h-fit">
                                        <div className="p-3 border-b border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50">
                                            <p className="text-sm font-semibold text-slate-900 dark:text-gray-100">Giảng viên</p>
                                            <Input
                                                value={searchTerm}
                                                onChange={(event) => setSearchTerm(event.target.value)}
                                                placeholder="Tìm theo tên/email..."
                                                className="mt-2"
                                            />
                                        </div>

                                        <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100 dark:divide-gray-700">
                                            {loadingTeachers ? (
                                                <div className="p-4 text-sm text-slate-500 dark:text-gray-400 flex items-center gap-2">
                                                    <Loader2 className="w-4 h-4 animate-spin" /> Đang tải...
                                                </div>
                                            ) : filteredTeachers.length === 0 ? (
                                                <div className="p-4 text-sm text-slate-500 dark:text-gray-400">Không có giảng viên phù hợp</div>
                                            ) : filteredTeachers.map((item) => {
                                                const active = item.id === selectedTeacher?.id;
                                                return (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => setSelectedTeacher(item)}
                                                        className={`w-full text-left px-3 py-3 transition-colors ${active ? 'bg-indigo-50 dark:bg-indigo-900/30 border-l-2 border-l-indigo-500' : 'hover:bg-slate-50 dark:hover:bg-gray-700'}`}
                                                    >
                                                        <p className="text-sm font-medium text-slate-900 dark:text-gray-100">{item.full_name}</p>
                                                        <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">{item.email}</p>
                                                        <p className="text-[11px] text-slate-400 dark:text-gray-500 mt-1">
                                                            Cập nhật: {formatDateTime(item.updated_at || item.created_at)}
                                                        </p>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </aside>
                                )}

                                <section className={teacher?.id ? 'col-span-1' : 'lg:col-span-8'}>
                                    <div className="space-y-4">
                                        <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-4 py-3 text-sm text-blue-800 dark:text-blue-300">
                                            Admin đang xem trực tiếp dữ liệu giáo viên đã gửi từ hệ thống lịch trống.
                                        </div>

                                        {DAYS_OF_WEEK.map((day) => {
                                            const slots = groupedByDay[day.value] || [];

                                            return (
                                                <div key={day.value} className="rounded-xl border border-slate-200 dark:border-gray-700 overflow-hidden">
                                                    <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-gray-800/50 border-b border-slate-200 dark:border-gray-700">
                                                        <div className="flex items-center gap-3">
                                                            <span className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-semibold flex items-center justify-center">
                                                                {day.short}
                                                            </span>
                                                            <div>
                                                                <p className="font-semibold text-slate-900 dark:text-gray-100">{day.label}</p>
                                                                <p className="text-xs text-slate-500 dark:text-gray-400">{slots.length} khung giờ</p>
                                                            </div>
                                                        </div>

                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="gap-1.5"
                                                            onClick={() => addSlot(day.value)}
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                            Thêm
                                                        </Button>
                                                    </div>

                                                    <div className="p-3 space-y-2">
                                                        {slots.length === 0 ? (
                                                            <div className="py-4 text-center text-sm text-slate-500 dark:text-gray-400">
                                                                Chưa có lịch trống cho ngày này.
                                                            </div>
                                                        ) : (
                                                            slots.map((slot) => (
                                                                <div key={slot.id} className="p-3 rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col lg:flex-row lg:items-end gap-3">
                                                                    <div className="flex items-center gap-2 text-slate-700 dark:text-gray-300 shrink-0">
                                                                        <Clock className="w-4 h-4" />
                                                                        <span className="text-sm font-medium">Khung giờ</span>
                                                                    </div>

                                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
                                                                        <div>
                                                                            <label className="text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1 block">TỪ</label>
                                                                            <TimeSelect
                                                                                value={normalizeTime(slot.start_time, '08:00')}
                                                                                onChange={(val) => updateSlot(slot.id, 'start_time', val)}
                                                                                className="w-full"
                                                                            />
                                                                        </div>

                                                                        <div>
                                                                            <label className="text-xs font-semibold text-slate-600 mb-1 block">ĐẾN</label>
                                                                            <TimeSelect
                                                                                value={normalizeTime(slot.end_time, '10:00')}
                                                                                onChange={(val) => updateSlot(slot.id, 'end_time', val)}
                                                                                className="w-full"
                                                                            />
                                                                        </div>

                                                                        <div>
                                                                            <label className="text-xs font-semibold text-slate-600 mb-1 block">LOẠI</label>
                                                                            <select
                                                                                value={slot.type || 'available'}
                                                                                onChange={(event) => updateSlot(slot.id, 'type', event.target.value)}
                                                                                className="w-full px-3 py-2 border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-200 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                                            >
                                                                                {SLOT_TYPE_OPTIONS.map((option) => (
                                                                                    <option key={option.value} value={option.value}>{option.label}</option>
                                                                                ))}
                                                                            </select>
                                                                        </div>
                                                                    </div>

                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                                                                        onClick={() => removeSlot(slot.id)}
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            </div>
                        )
                    ) : !loadingTeachers && (
                        <div className="py-10 text-center text-slate-500 dark:text-gray-400">
                            <Calendar className="w-10 h-10 mx-auto text-slate-300 dark:text-gray-600" />
                            <p className="mt-2">Chọn giáo viên để xem lịch trống đã gửi</p>
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 bg-slate-50 dark:bg-gray-800 border-t dark:border-gray-700 shrink-0 flex items-center justify-between gap-3">
                    <div className="text-xs text-slate-500 dark:text-gray-400">
                        {hasChanges ? 'Có thay đổi chưa lưu' : 'Dữ liệu đã đồng bộ'}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={onClose}>Đóng</Button>

                        <Button
                            variant="outline"
                            onClick={resetChanges}
                            disabled={!hasChanges || saving}
                            className="gap-1.5"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Hoàn tác
                        </Button>

                        <Button
                            onClick={handleSave}
                            disabled={!selectedTeacher?.id || !hasChanges || saving}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Lưu thay đổi
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TeacherAvailabilityModal;
