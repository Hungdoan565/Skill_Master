/**
 * AuditTrailModal Component
 * Modal hiển thị lịch sử thay đổi của bảng lương
 */

import { useState, useEffect } from 'react';
import { X, History, FileText, Edit, CheckCircle, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatCurrency } from '../utils';

const ACTION_CONFIG = {
    created: { label: 'Tạo mới', icon: FileText, color: 'bg-blue-100 text-blue-700' },
    updated: { label: 'Cập nhật', icon: Edit, color: 'bg-yellow-100 text-yellow-700' },
    status_changed: { label: 'Đổi trạng thái', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
    deleted: { label: 'Xóa', icon: Trash2, color: 'bg-red-100 text-red-700' },
};

const STATUS_LABELS = {
    draft: 'Nháp',
    pending: 'Chờ duyệt',
    approved: 'Đã duyệt',
    paid: 'Đã thanh toán'
};

function AuditLogItem({ log }) {
    const [expanded, setExpanded] = useState(false);
    const config = ACTION_CONFIG[log.action] || ACTION_CONFIG.updated;
    const Icon = config.icon;

    const formatChanges = () => {
        if (log.action === 'status_changed' && log.old_values && log.new_values) {
            const oldStatus = log.old_values.status;
            const newStatus = log.new_values.status;
            return (
                <div className="text-sm">
                    <span className="text-slate-500">{STATUS_LABELS[oldStatus] || oldStatus}</span>
                    <span className="mx-2">→</span>
                    <span className="font-medium">{STATUS_LABELS[newStatus] || newStatus}</span>
                </div>
            );
        }

        if (log.action === 'updated' && log.old_values && log.new_values) {
            const changes = [];
            const fields = ['bonus', 'deduction', 'notes'];

            fields.forEach(field => {
                if (log.old_values[field] !== log.new_values[field]) {
                    if (field === 'bonus' || field === 'deduction') {
                        changes.push(
                            <div key={field} className="text-sm">
                                <span className="capitalize">{field === 'bonus' ? 'Thưởng' : 'Khấu trừ'}: </span>
                                <span className="text-slate-500">{formatCurrency(log.old_values[field])}</span>
                                <span className="mx-2">→</span>
                                <span className="font-medium">{formatCurrency(log.new_values[field])}</span>
                            </div>
                        );
                    } else if (field === 'notes') {
                        changes.push(
                            <div key={field} className="text-sm">
                                <span>Ghi chú đã được cập nhật</span>
                            </div>
                        );
                    }
                }
            });

            return changes.length > 0 ? changes : <span className="text-sm text-slate-500">Có thay đổi</span>;
        }

        if (log.action === 'created' && log.new_values) {
            return (
                <div className="text-sm">
                    Lương: {formatCurrency(log.new_values.net_salary)}
                </div>
            );
        }

        return null;
    };

    return (
        <div className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
            <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${config.color}`}>
                    <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{config.label}</span>
                        <span className="text-xs text-muted-foreground">
                            {new Date(log.changed_at).toLocaleString('vi-VN')}
                        </span>
                    </div>

                    {log.changed_by_user && (
                        <div className="text-sm text-muted-foreground mb-2">
                            bởi {log.changed_by_user.full_name}
                        </div>
                    )}

                    {formatChanges()}

                    {/* Expand/Collapse raw data */}
                    {(log.old_values || log.new_values) && (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="text-xs text-indigo-600 hover:underline mt-2"
                        >
                            {expanded ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                        </button>
                    )}

                    {expanded && (
                        <div className="mt-2 p-3 bg-slate-100 rounded text-xs font-mono overflow-auto max-h-40">
                            {log.old_values && (
                                <div className="mb-2">
                                    <strong className="text-red-600">- Trước:</strong>
                                    <pre className="whitespace-pre-wrap">
                                        {JSON.stringify(log.old_values, null, 2)}
                                    </pre>
                                </div>
                            )}
                            {log.new_values && (
                                <div>
                                    <strong className="text-green-600">+ Sau:</strong>
                                    <pre className="whitespace-pre-wrap">
                                        {JSON.stringify(log.new_values, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export function AuditTrailModal({
    isOpen,
    onClose,
    payrollId,
    fetchAuditTrail,
}) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && payrollId && fetchAuditTrail) {
            setLoading(true);
            fetchAuditTrail(payrollId)
                .then(data => {
                    setLogs(data || []);
                })
                .catch(err => {
                    console.error('Error fetching audit trail:', err);
                    setLogs([]);
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [isOpen, payrollId, fetchAuditTrail]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-xl max-h-[80vh] overflow-hidden rounded-lg bg-white shadow-xl mx-4 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <History className="h-5 w-5 text-indigo-600" />
                        Lịch sử thay đổi
                    </h2>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <Loader2 className="h-8 w-8 animate-spin mb-2" />
                            <p>Đang tải...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <History className="h-12 w-12 mb-2" />
                            <p>Chưa có lịch sử thay đổi</p>
                            <p className="text-sm mt-1">Hoặc chức năng audit trail chưa được kích hoạt</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {logs.map((log) => (
                                <AuditLogItem key={log.id} log={log} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-slate-50">
                    <p className="text-xs text-muted-foreground">
                        Hiển thị {logs.length} bản ghi thay đổi
                    </p>
                </div>
            </div>
        </div>
    );
}

export default AuditTrailModal;
