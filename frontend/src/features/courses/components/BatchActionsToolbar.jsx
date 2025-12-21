/**
 * BatchActionsToolbar - Thanh công cụ thao tác hàng loạt
 */

import { useState } from 'react';
import {
    Trash2, CheckCircle, XCircle, Download,
    Loader2, AlertTriangle, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { API_URL } from '../utils';

export function BatchActionsToolbar({
    selectedIds,
    onClearSelection,
    accessToken,
    onSuccess
}) {
    const [loading, setLoading] = useState(false);
    const [action, setAction] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);

    const count = selectedIds.length;

    if (count === 0) return null;

    // Bulk update status
    const handleBulkStatus = async (status) => {
        setLoading(true);
        setAction(`status-${status}`);

        try {
            await Promise.all(
                selectedIds.map(id =>
                    axios.patch(
                        `${API_URL}/api/courses/${id}`,
                        { status },
                        { headers: { Authorization: `Bearer ${accessToken}` } }
                    )
                )
            );
            onSuccess?.();
            onClearSelection();
        } catch (err) {
            console.error('Bulk status update failed:', err);
            alert('Có lỗi xảy ra khi cập nhật trạng thái');
        } finally {
            setLoading(false);
            setAction(null);
        }
    };

    // Bulk delete
    const handleBulkDelete = async () => {
        setLoading(true);
        setAction('delete');

        try {
            await Promise.all(
                selectedIds.map(id =>
                    axios.delete(`${API_URL}/api/courses/${id}`, {
                        headers: { Authorization: `Bearer ${accessToken}` }
                    })
                )
            );
            onSuccess?.();
            onClearSelection();
        } catch (err) {
            console.error('Bulk delete failed:', err);
            alert('Có lỗi xảy ra khi xóa khóa học');
        } finally {
            setLoading(false);
            setAction(null);
            setShowConfirm(false);
        }
    };

    // Export to CSV
    const handleExport = () => {
        setAction('export');
        // Simple CSV export - would need course data passed in for real implementation
        alert(`Export ${count} khóa học sang CSV - Feature coming soon!`);
        setAction(null);
    };

    // Confirm action
    const handleConfirm = (actionType) => {
        setConfirmAction(actionType);
        setShowConfirm(true);
    };

    const executeConfirmedAction = () => {
        if (confirmAction === 'delete') {
            handleBulkDelete();
        }
    };

    return (
        <>
            <div className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg mb-4 animate-in slide-in-from-top-2 duration-200">
                {/* Selection Count */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-100 rounded-lg">
                    <span className="text-sm font-medium text-indigo-700">
                        Đã chọn: <strong>{count}</strong> khóa học
                    </span>
                </div>

                <div className="h-6 w-px bg-indigo-200" />

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {/* Activate */}
                    <Button
                        size="sm"
                        variant="outline"
                        className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                        onClick={() => handleBulkStatus('active')}
                        disabled={loading}
                    >
                        {loading && action === 'status-active' ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                            <CheckCircle className="w-4 h-4 mr-1" />
                        )}
                        Kích hoạt
                    </Button>

                    {/* Deactivate */}
                    <Button
                        size="sm"
                        variant="outline"
                        className="text-orange-600 border-orange-300 hover:bg-orange-50"
                        onClick={() => handleBulkStatus('inactive')}
                        disabled={loading}
                    >
                        {loading && action === 'status-inactive' ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                            <XCircle className="w-4 h-4 mr-1" />
                        )}
                        Tạm ngưng
                    </Button>

                    {/* Export */}
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleExport}
                        disabled={loading}
                    >
                        <Download className="w-4 h-4 mr-1" />
                        Export
                    </Button>

                    {/* Delete */}
                    <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                        onClick={() => handleConfirm('delete')}
                        disabled={loading}
                    >
                        {loading && action === 'delete' ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                            <Trash2 className="w-4 h-4 mr-1" />
                        )}
                        Xóa
                    </Button>
                </div>

                {/* Clear Selection */}
                <div className="ml-auto">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onClearSelection}
                        disabled={loading}
                    >
                        <X className="w-4 h-4 mr-1" />
                        Bỏ chọn
                    </Button>
                </div>
            </div>

            {/* Confirm Dialog */}
            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setShowConfirm(false)}
                    />
                    <div className="relative bg-white rounded-xl shadow-2xl p-6 max-w-md mx-4 animate-in zoom-in-95">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-red-100 rounded-full">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Xác nhận xóa</h3>
                                <p className="text-sm text-gray-500">Hành động này không thể hoàn tác</p>
                            </div>
                        </div>

                        <p className="text-gray-600 mb-6">
                            Bạn có chắc chắn muốn xóa <strong>{count}</strong> khóa học đã chọn?
                        </p>

                        <div className="flex justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setShowConfirm(false)}
                                disabled={loading}
                            >
                                Hủy
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={executeConfirmedAction}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Đang xóa...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Xóa {count} khóa học
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default BatchActionsToolbar;
