/**
 * DeleteHolidayModal - Xác nhận xóa ngày lễ
 */

import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DeleteHolidayModal({ isOpen, onClose, holiday, onConfirm, submitting }) {
    if (!isOpen || !holiday) return null;

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50" 
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            Xác nhận xóa
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-gray-600 mb-4">
                        Bạn có chắc chắn muốn xóa ngày lễ này?
                    </p>
                    
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <p className="font-medium text-gray-900">{holiday.name}</p>
                        <p className="text-sm text-gray-500 mt-1">
                            Ngày: {formatDate(holiday.date)}
                        </p>
                        {holiday.is_recurring && (
                            <span className="inline-block mt-2 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded">
                                Lặp lại hàng năm
                            </span>
                        )}
                    </div>

                    <p className="text-sm text-gray-500">
                        Hành động này không thể hoàn tác.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={submitting}
                    >
                        Hủy
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={submitting}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        {submitting ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Đang xóa...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Trash2 className="h-4 w-4" />
                                Xóa
                            </span>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default DeleteHolidayModal;
