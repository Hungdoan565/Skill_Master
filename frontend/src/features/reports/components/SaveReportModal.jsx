/**
 * SaveReportModal Component
 * 
 * Modal đẹp để lưu báo cáo thay thế browser prompt()
 * Style tương tự EditInvoiceModal - gradient header
 */

import { useState, useEffect } from 'react';
import {
    X,
    Save,
    Loader2,
    FileText,
    Type,
    Globe,
    Clock,
    Mail,
    AlertCircle,
    CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { REPORT_TYPE_LABELS, DATE_PRESETS } from '../utils/constants';

// Labels for filter keys in Vietnamese
const FILTER_LABELS = {
    datePreset: 'Khoảng thời gian',
    groupBy: 'Nhóm theo',
    centerId: 'Trung tâm',
    courseId: 'Khóa học',
    classId: 'Lớp học',
    selectedCourseId: 'Khóa học',
    selectedClassId: 'Lớp học',
    customDates: 'Ngày tùy chọn',
};

// Values mapping
const GROUPBY_LABELS = {
    day: 'Ngày',
    week: 'Tuần',
    month: 'Tháng',
};

/**
 * Format filters object to readable display array
 */
function formatFiltersForDisplay(filters) {
    const result = [];

    for (const [key, value] of Object.entries(filters)) {
        // Skip empty values
        if (value === '' || value === null || value === undefined) continue;

        // Skip customDates if empty
        if (key === 'customDates') {
            if (value.start && value.end) {
                result.push({
                    label: 'Từ ngày',
                    value: `${value.start} đến ${value.end}`
                });
            }
            continue;
        }

        const label = FILTER_LABELS[key] || key;
        let displayValue = value;

        // Convert values to readable format
        if (key === 'datePreset') {
            const preset = DATE_PRESETS.find(p => p.value === value);
            displayValue = preset?.label || value;
        } else if (key === 'groupBy') {
            displayValue = GROUPBY_LABELS[value] || value;
        }

        result.push({ label, value: displayValue });
    }

    return result;
}

export function SaveReportModal({
    isOpen,
    onClose,
    onSave,
    reportType,
    filters = {},
    saving = false
}) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        isPublic: false,
        schedule: null, // null = no schedule, 'daily', 'weekly', 'monthly'
        emailRecipients: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setFormData({
                name: `Báo cáo ${REPORT_TYPE_LABELS[reportType] || reportType} - ${new Date().toLocaleDateString('vi-VN')}`,
                description: '',
                isPublic: false,
                schedule: null,
                emailRecipients: ''
            });
            setError('');
            setSuccess(false);
        }
    }, [isOpen, reportType]);

    // ESC key handler
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && !saving) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, saving, onClose]);

    const updateField = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            setError('Vui lòng nhập tên báo cáo');
            return;
        }

        try {
            // Parse email recipients
            const emailList = formData.emailRecipients
                ? formData.emailRecipients.split(',').map(e => e.trim()).filter(e => e)
                : [];

            const result = await onSave({
                name: formData.name.trim(),
                description: formData.description.trim(),
                reportType,
                filters,
                isPublic: formData.isPublic,
                schedule: formData.schedule,
                emailRecipients: emailList
            });

            if (result) {
                setSuccess(true);
                setTimeout(() => {
                    onClose();
                }, 1500);
            }
        } catch (err) {
            setError(err.message || 'Có lỗi xảy ra khi lưu báo cáo');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={() => !saving && onClose()}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">

                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-4 text-white shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <Save className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">Lưu báo cáo</h3>
                                <p className="text-sm text-indigo-100">
                                    {REPORT_TYPE_LABELS[reportType] || 'Báo cáo'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={saving}
                            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                {success ? (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900">Đã lưu báo cáo!</h4>
                        <p className="text-sm text-gray-500 mt-1">Bạn có thể xem lại trong mục "Báo cáo đã lưu"</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                        <div className="p-5 space-y-4">

                            {/* Error message */}
                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    {error}
                                </div>
                            )}

                            {/* Report Name */}
                            <div>
                                <Label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                    <Type className="w-4 h-4 text-gray-400" />
                                    Tên báo cáo <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => updateField('name', e.target.value)}
                                    placeholder="VD: Báo cáo doanh thu tháng 12"
                                    className="mt-1"
                                    autoFocus
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <Label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-gray-400" />
                                    Mô tả (tùy chọn)
                                </Label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => updateField('description', e.target.value)}
                                    placeholder="Ghi chú thêm về báo cáo này..."
                                    rows={2}
                                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Public toggle */}
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-gray-400" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">Chia sẻ với trung tâm</p>
                                        <p className="text-xs text-gray-500">Nhân viên khác có thể xem</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => updateField('isPublic', !formData.isPublic)}
                                    className={`relative w-11 h-6 rounded-full transition-colors ${formData.isPublic ? 'bg-indigo-600' : 'bg-gray-300'
                                        }`}
                                >
                                    <span
                                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.isPublic ? 'translate-x-5' : ''
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Schedule (optional feature) */}
                            <div>
                                <Label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-gray-400" />
                                    Lịch gửi tự động (tùy chọn)
                                </Label>
                                <select
                                    value={formData.schedule || ''}
                                    onChange={(e) => updateField('schedule', e.target.value || null)}
                                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">Không tự động gửi</option>
                                    <option value="daily">Hàng ngày</option>
                                    <option value="weekly">Hàng tuần</option>
                                    <option value="monthly">Hàng tháng</option>
                                </select>
                            </div>

                            {/* Email recipients (show if schedule is set) */}
                            {formData.schedule && (
                                <div>
                                    <Label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        Email nhận báo cáo
                                    </Label>
                                    <Input
                                        value={formData.emailRecipients}
                                        onChange={(e) => updateField('emailRecipients', e.target.value)}
                                        placeholder="email1@example.com, email2@example.com"
                                        className="mt-1"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Phân cách bằng dấu phẩy</p>
                                </div>
                            )}

                            {/* Filters preview */}
                            {Object.keys(filters).length > 0 && (
                                <div className="p-3 bg-indigo-50 rounded-lg">
                                    <p className="text-xs font-medium text-indigo-700 mb-2">Bộ lọc đã áp dụng:</p>
                                    <div className="space-y-1">
                                        {formatFiltersForDisplay(filters).map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-xs">
                                                <span className="text-indigo-500">•</span>
                                                <span className="font-medium text-indigo-700">{item.label}:</span>
                                                <span className="text-indigo-600">{item.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-4 bg-gray-50 border-t flex items-center justify-end gap-3 shrink-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                disabled={saving}
                            >
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                disabled={saving || !formData.name.trim()}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Đang lưu...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Lưu báo cáo
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

export default SaveReportModal;
