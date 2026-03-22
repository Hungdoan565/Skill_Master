/**
 * AuditTrailModal Component
 * Modal hiển thị lịch sử thay đổi của bảng lương — human-readable diffs
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, History, FileText, Edit, CheckCircle, Trash2, Loader2, ChevronDown, ChevronUp,
    ArrowRight, Clock, User, DollarSign, Banknote, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '../utils';

const ACTION_CONFIG = {
    created:        { label: 'Tạo mới',         icon: FileText,    bgColor: 'bg-blue-500/10',   iconBg: 'bg-blue-500/15',   iconColor: 'text-blue-600',  dotColor: 'bg-blue-500' },
    updated:        { label: 'Cập nhật',         icon: Edit,        bgColor: 'bg-amber-500/10',  iconBg: 'bg-amber-500/15',  iconColor: 'text-amber-600', dotColor: 'bg-amber-500' },
    status_changed: { label: 'Đổi trạng thái',   icon: CheckCircle, bgColor: 'bg-green-500/10',  iconBg: 'bg-green-500/15',  iconColor: 'text-green-600', dotColor: 'bg-green-500' },
    deleted:        { label: 'Xóa',              icon: Trash2,      bgColor: 'bg-red-500/10',    iconBg: 'bg-red-500/15',    iconColor: 'text-red-600',   dotColor: 'bg-red-500' },
};

const STATUS_CONFIG = {
    draft:    { label: 'Nháp',          className: 'bg-muted  text-muted-foreground' },
    pending:  { label: 'Chờ duyệt',     className: 'bg-amber-500/10  text-amber-700 dark:text-amber-300' },
    approved: { label: 'Đã duyệt',      className: 'bg-green-500/10  text-green-700 dark:text-green-300' },
    paid:     { label: 'Đã thanh toán',  className: 'bg-blue-500/10   text-blue-700 dark:text-blue-300' },
};

// Map raw field names to human-readable Vietnamese labels
const FIELD_LABELS = {
    bonus:            'Thưởng',
    deduction:        'Khấu trừ',
    notes:            'Ghi chú',
    base_salary:      'Lương cơ bản',
    net_salary:       'Thực nhận',
    total_sessions:   'Số buổi',
    total_hours:      'Tổng giờ',
    status:           'Trạng thái',
    approved_by:      'Người duyệt',
    approved_at:      'Thời gian duyệt',
    paid_at:          'Thời gian thanh toán',
    paid_by:          'Người thanh toán',
    payment_method:   'Phương thức',
    payment_reference: 'Mã giao dịch',
    payment_proof_url: 'Ảnh xác nhận',
    fixed_salary:     'Lương cố định',
};

const MONEY_FIELDS = ['bonus', 'deduction', 'base_salary', 'net_salary', 'fixed_salary'];
const SKIP_FIELDS = ['id', 'teacher_id', 'period_month', 'period_year', 'created_at', 'updated_at', 'created_by', 'compensation_id'];

function formatFieldValue(field, value) {
    if (value === null || value === undefined) return '—';
    if (MONEY_FIELDS.includes(field)) return formatCurrency(value);
    if (field === 'status') return STATUS_CONFIG[value]?.label || value;
    if (field === 'total_hours') return `${value}h`;
    if (field === 'total_sessions') return `${value} buổi`;
    if (field === 'approved_at' || field === 'paid_at') {
        return new Date(value).toLocaleString('vi-VN');
    }
    if (field === 'payment_method') {
        const methods = { bank_transfer: 'Chuyển khoản', cash: 'Tiền mặt', momo: 'MoMo' };
        return methods[value] || value;
    }
    return String(value);
}

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] || { label: status, className: 'bg-muted text-muted-foreground' };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.className}`}>
            {cfg.label}
        </span>
    );
}

function ChangedFields({ oldValues, newValues }) {
    if (!oldValues && !newValues) return null;

    const allFields = new Set([
        ...Object.keys(oldValues || {}),
        ...Object.keys(newValues || {})
    ]);

    const changes = [];
    allFields.forEach(field => {
        if (SKIP_FIELDS.includes(field)) return;
        const oldVal = oldValues?.[field];
        const newVal = newValues?.[field];
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            changes.push({ field, oldVal, newVal });
        }
    });

    if (changes.length === 0) return <p className="text-sm text-muted-foreground italic">Không có thay đổi chi tiết</p>;

    return (
        <div className="space-y-2">
            {changes.map(({ field, oldVal, newVal }) => {
                const label = FIELD_LABELS[field] || field;
                const isStatus = field === 'status';
                const isMoney = MONEY_FIELDS.includes(field);

                return (
                    <div key={field} className="flex items-center gap-2 text-sm bg-card px-3 py-2 rounded-lg border border-border">
                        {isMoney ? (
                            <DollarSign className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        ) : (
                            <Edit className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className="text-muted-foreground font-medium min-w-[90px]">{label}</span>

                        {oldVal !== null && oldVal !== undefined ? (
                            <>
                                {isStatus ? (
                                    <StatusBadge status={oldVal} />
                                ) : (
                                    <span className="text-muted-foreground line-through text-xs">{formatFieldValue(field, oldVal)}</span>
                                )}
                                <ArrowRight className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" />
                            </>
                        ) : null}

                        {isStatus ? (
                            <StatusBadge status={newVal} />
                        ) : (
                            <span className={`font-semibold ${isMoney && newVal > (oldVal || 0) ? 'text-green-600' : isMoney && newVal < (oldVal || 0) ? 'text-red-600' : 'text-foreground'}`}>
                                {formatFieldValue(field, newVal)}
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function AuditLogItem({ log, isFirst, isLast }) {
    const [expanded, setExpanded] = useState(false);
    const config = ACTION_CONFIG[log.action] || ACTION_CONFIG.updated;
    const Icon = config.icon;
    const hasDetails = log.old_values || log.new_values;

    const quickSummary = () => {
        if (log.action === 'status_changed' && log.old_values?.status && log.new_values?.status) {
            return (
                <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={log.old_values.status} />
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <StatusBadge status={log.new_values.status} />
                </div>
            );
        }
        if (log.action === 'created' && log.new_values?.net_salary) {
            return (
                <div className="flex items-center gap-1.5 mt-1 text-sm">
                    <Banknote className="h-3.5 w-3.5 text-green-500" />
                    <span className="text-green-600 font-semibold">{formatCurrency(log.new_values.net_salary)}</span>
                </div>
            );
        }
        if (log.action === 'updated') {
            const changed = [];
            const fields = ['bonus', 'deduction', 'notes', 'base_salary'];
            fields.forEach(f => {
                if (log.old_values?.[f] !== log.new_values?.[f]) {
                    changed.push(FIELD_LABELS[f] || f);
                }
            });
            if (changed.length > 0) {
                return <p className="text-sm text-muted-foreground mt-1">Thay đổi: {changed.join(', ')}</p>;
            }
        }
        return null;
    };

    return (
        <div className="relative flex gap-4">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full ${config.dotColor} ring-4 ring-card z-10 mt-1.5`}></div>
                {!isLast && <div className="w-0.5 flex-1 bg-border mt-1"></div>}
            </div>

            {/* Content card */}
            <div className={`flex-1 mb-4 rounded-xl border border-border overflow-hidden transition-all duration-200 ${expanded ? config.bgColor : 'bg-card hover:bg-muted/50'}`}>
                <div
                    className="p-4 cursor-pointer"
                    onClick={() => hasDetails && setExpanded(!expanded)}
                >
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${config.iconBg}`}>
                                <Icon className={`h-4 w-4 ${config.iconColor}`} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-sm text-foreground">{config.label}</span>
                                    {log.notes && (
                                        <span className="text-xs text-muted-foreground italic">• {log.notes}</span>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {new Date(log.changed_at).toLocaleString('vi-VN')}
                                    </span>
                                    {log.changed_by_user && (
                                        <span className="flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            {log.changed_by_user.full_name}
                                        </span>
                                    )}
                                </div>

                                {!expanded && quickSummary()}
                            </div>
                        </div>

                        {hasDetails && (
                            <button className="p-1 rounded hover:bg-muted transition-colors">
                                {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                            </button>
                        )}
                    </div>
                </div>

                {/* Expanded details — human-readable diffs */}
                {expanded && hasDetails && (
                    <div className="px-4 pb-4 pt-0">
                        <div className="border-t border-border pt-3">
                            <ChangedFields oldValues={log.old_values} newValues={log.new_values} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export function AuditTrailModal({ isOpen, onClose, payrollId, fetchAuditTrail }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && payrollId && fetchAuditTrail) {
            setLoading(true);
            fetchAuditTrail(payrollId)
                .then(data => setLogs(data || []))
                .catch(err => { console.error('Error fetching audit trail:', err); setLogs([]); })
                .finally(() => setLoading(false));
        }
    }, [isOpen, payrollId, fetchAuditTrail]);

    if (!isOpen) return null;

    return createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose} />

            <div className="relative z-10 w-full max-w-lg max-h-[85vh] overflow-hidden rounded-xl bg-card shadow-2xl mx-4 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-gradient-to-r from-indigo-500/10 to-blue-500/10">
                    <h2 className="text-lg font-semibold flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/15 rounded-lg">
                            <History className="h-4 w-4 text-indigo-600" />
                        </div>
                        Lịch sử thay đổi
                    </h2>
                    <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-muted">
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                            <div className="p-4 bg-muted rounded-full mb-3">
                                <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
                            </div>
                            <p className="text-sm">Đang tải lịch sử...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                            <div className="p-4 bg-muted rounded-full mb-3">
                                <History className="h-8 w-8" />
                            </div>
                            <p className="font-medium text-muted-foreground">Chưa có lịch sử thay đổi</p>
                            <p className="text-sm mt-1">Hoặc chức năng audit trail chưa được kích hoạt</p>
                        </div>
                    ) : (
                        <div>
                            {logs.map((log, idx) => (
                                <AuditLogItem
                                    key={log.id}
                                    log={log}
                                    isFirst={idx === 0}
                                    isLast={idx === logs.length - 1}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-border bg-muted/30 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                        {logs.length > 0 ? `${logs.length} bản ghi thay đổi` : 'Không có bản ghi'}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Tạo</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Sửa</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Trạng thái</span>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default AuditTrailModal;
