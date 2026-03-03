/**
 * TransactionsTab Component
 * 
 * Tab Giao dịch - Hiển thị tất cả payments với:
 * - Filter: Đã khớp | Chờ xử lý | Từ chối
 * - Bulk verify pending transactions
 * - Quick image preview
 */

import { useState, useCallback } from 'react';
import {
    CheckCircle2, Clock, XCircle, CreditCard, Banknote,
    Check, Image, AlertCircle, Loader2, ChevronLeft, ChevronRight,
    Filter, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '../utils/formatters';

export function TransactionsTab({
    transactions = [],
    loading,
    summary,
    pagination,
    filters,
    selectedIds,
    onFilterChange,
    onResetFilters,
    onPageChange,
    onToggleSelect,
    onSelectAll,
    onBulkVerify,
    onRefresh
}) {
    const [previewImage, setPreviewImage] = useState(null);
    const [bulkLoading, setBulkLoading] = useState(false);

    const handleBulkVerify = async () => {
        setBulkLoading(true);
        try {
            await onBulkVerify?.();
        } finally {
            setBulkLoading(false);
        }
    };

    // Status filter tabs
    const statusTabs = [
        { key: 'all', label: 'Tất cả', count: null },
        { key: 'pending', label: 'Chờ xử lý', count: summary?.totalPending, color: 'amber' },
        { key: 'verified', label: 'Đã khớp', count: summary?.totalVerified, color: 'emerald' },
        { key: 'rejected', label: 'Từ chối', count: summary?.totalRejected, color: 'red' }
    ];

    const pendingCount = transactions.filter(t => t.verification_status === 'pending').length;
    const allPendingSelected = selectedIds.length > 0 && selectedIds.length === pendingCount;

    return (
        <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard
                    label="Chờ xử lý"
                    value={summary?.totalPending || 0}
                    amount={summary?.pendingAmount}
                    color="amber"
                    icon={Clock}
                />
                <SummaryCard
                    label="Đã xác nhận"
                    value={summary?.totalVerified || 0}
                    color="emerald"
                    icon={CheckCircle2}
                />
                <SummaryCard
                    label="Từ chối"
                    value={summary?.totalRejected || 0}
                    color="red"
                    icon={XCircle}
                />
                <div className="bg-white rounded-xl p-4 border shadow-sm">
                    <p className="text-xs text-muted-foreground">Tổng GD</p>
                    <p className="text-2xl font-bold">{pagination?.total || 0}</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex gap-2">
                    {statusTabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => onFilterChange?.('status', tab.key)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filters?.status === tab.key
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                }`}
                        >
                            {tab.label}
                            {tab.count != null && tab.count > 0 && (
                                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${tab.color === 'amber' ? 'bg-amber-200 text-amber-800' :
                                        tab.color === 'emerald' ? 'bg-emerald-200 text-emerald-800' :
                                            tab.color === 'red' ? 'bg-red-200 text-red-800' :
                                                'bg-gray-200 text-gray-800'
                                    }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={onRefresh}>
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Làm mới
                    </Button>
                    {selectedIds.length > 0 && (
                        <Button
                            size="sm"
                            onClick={handleBulkVerify}
                            disabled={bulkLoading}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {bulkLoading ? (
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                                <Check className="w-4 h-4 mr-1" />
                            )}
                            Duyệt {selectedIds.length} GD
                        </Button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                        <AlertCircle className="w-12 h-12 mb-2 opacity-50" />
                        <p>Không có giao dịch nào</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-full whitespace-nowrap md:whitespace-normal">
                            <thead className="bg-slate-50">
                                <tr className="text-left text-xs font-medium text-muted-foreground">
                                    <th className="p-3 w-10">
                                        <input
                                            type="checkbox"
                                            checked={allPendingSelected}
                                            onChange={onSelectAll}
                                            className="rounded"
                                            disabled={pendingCount === 0}
                                        />
                                    </th>
                                    <th className="p-3">Thời gian</th>
                                    <th className="p-3">Hóa đơn / Học viên</th>
                                    <th className="p-3">Nội dung CK</th>
                                    <th className="p-3 text-right">Số tiền</th>
                                    <th className="p-3 text-center">Trạng thái</th>
                                    <th className="p-3 text-center">Ảnh</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {transactions.map(tx => (
                                    <TransactionRow
                                        key={tx.id}
                                        transaction={tx}
                                        isSelected={selectedIds.includes(tx.id)}
                                        onToggle={() => onToggleSelect?.(tx.id)}
                                        onPreviewImage={setPreviewImage}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Trang {pagination.page} / {pagination.totalPages} ({pagination.total} giao dịch)
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange?.(pagination.page - 1)}
                            disabled={pagination.page <= 1}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange?.(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Image Preview Modal */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="relative max-w-3xl max-h-[90vh] p-2">
                        <img
                            src={previewImage}
                            alt="Bank proof"
                            className="max-w-full max-h-[85vh] object-contain rounded-lg"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function SummaryCard({ label, value, amount, color, icon: Icon }) {
    const colorClasses = {
        amber: 'bg-amber-50 text-amber-600 border-amber-200',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
        red: 'bg-red-50 text-red-600 border-red-200'
    };

    return (
        <div className={`rounded-xl p-4 border ${colorClasses[color] || 'bg-white'}`}>
            <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4" />
                <span className="text-xs font-medium">{label}</span>
            </div>
            <p className="text-2xl font-bold">{value}</p>
            {amount != null && (
                <p className="text-xs mt-1">{formatCurrency(amount)}</p>
            )}
        </div>
    );
}

function TransactionRow({ transaction, isSelected, onToggle, onPreviewImage }) {
    const tx = transaction;
    const isPending = tx.verification_status === 'pending';
    const isVerified = tx.verification_status === 'verified';
    const isRejected = tx.verification_status === 'rejected';
    const isCash = tx.payment_method === 'cash';

    const statusConfig = {
        pending: { icon: Clock, color: 'text-amber-600 bg-amber-50', label: 'Chờ xử lý' },
        verified: { icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50', label: 'Đã khớp' },
        rejected: { icon: XCircle, color: 'text-red-600 bg-red-50', label: 'Từ chối' }
    };
    const status = statusConfig[tx.verification_status] || statusConfig.verified;
    const StatusIcon = status.icon;

    return (
        <tr className={`hover:bg-slate-50 ${isPending ? 'bg-amber-50/30' : ''}`}>
            <td className="p-3">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={onToggle}
                    className="rounded"
                    disabled={!isPending}
                />
            </td>
            <td className="p-3 text-sm">
                <p className="font-medium">
                    {new Date(tx.created_at).toLocaleDateString('vi-VN')}
                </p>
                <p className="text-xs text-muted-foreground">
                    {new Date(tx.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </p>
            </td>
            <td className="p-3">
                <p className="font-mono text-sm font-medium text-primary">
                    {tx.invoice?.invoice_code || '—'}
                </p>
                <p className="text-xs text-muted-foreground">
                    {tx.invoice?.student?.full_name || '—'}
                </p>
            </td>
            <td className="p-3 max-w-[200px]">
                <p className="text-sm truncate" title={tx.notes || tx.reference_code}>
                    {tx.notes || tx.reference_code || '—'}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {isCash ? (
                        <>
                            <Banknote className="w-3 h-3" />
                            Tiền mặt
                        </>
                    ) : (
                        <>
                            <CreditCard className="w-3 h-3" />
                            Chuyển khoản
                        </>
                    )}
                </div>
            </td>
            <td className="p-3 text-right">
                <p className="font-semibold text-foreground">
                    {formatCurrency(tx.amount)}
                </p>
            </td>
            <td className="p-3 text-center">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {status.label}
                </span>
            </td>
            <td className="p-3 text-center">
                {tx.bank_proof_url ? (
                    <button
                        onClick={() => onPreviewImage(tx.bank_proof_url)}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                        title="Xem ảnh"
                    >
                        <Image className="w-4 h-4 text-blue-600" />
                    </button>
                ) : (
                    <span className="text-muted-foreground">—</span>
                )}
            </td>
        </tr>
    );
}

export default TransactionsTab;
