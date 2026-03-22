/**
 * DeleteConfirmModal Component - Modal xác nhận xóa trung tâm
 */

import React from 'react';
import { AlertTriangle, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DeleteConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    center,
    loading = false
}) {
    if (!isOpen || !center) return null;

    return (
        <div className="fixed inset-0 z-[300] overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-zinc-800">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                            </div>
                            <h2 className="text-lg font-semibold text-foreground">
                                Xác nhận xóa
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                        >
                            <X className="h-5 w-5 text-muted-foreground" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6">
                        <p className="text-muted-foreground mb-4">
                            Bạn có chắc chắn muốn xóa trung tâm <strong className="text-foreground">{center.name}</strong>?
                        </p>

                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm">
                            <p className="text-amber-800 dark:text-amber-300">
                                <strong>Lưu ý:</strong> Trung tâm sẽ được đánh dấu là "Ngừng hoạt động"
                                và có thể được khôi phục sau này. Dữ liệu liên quan (phòng học, lớp học,
                                nhân viên) sẽ không bị xóa.
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-zinc-800 bg-gray-100 dark:bg-zinc-800 flex items-center justify-end gap-3 rounded-b-xl">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={() => onConfirm(center)}
                            disabled={loading}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {loading ? (
                                <>
                                    <span className="animate-spin mr-2">⏳</span>
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Xóa trung tâm
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DeleteConfirmModal;
