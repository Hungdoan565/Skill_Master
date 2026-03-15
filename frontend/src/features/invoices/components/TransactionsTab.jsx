/**
 * TransactionsTab Component
 * 
 * Tab Giao dịch - Hiển thị tất cả payments với:
 * - Search by student name, invoice code
 * - Filter: Đã khớp | Chờ xử lý | Từ chối
 * - Bulk verify pending transactions
 * - Payment detail modal with verify/reject
 * - Image preview (portal to escape stacking)
 */

import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
    CheckCircle2, Clock, XCircle, CreditCard, Banknote,
    Check, Image, AlertCircle, Loader2, ChevronLeft, ChevronRight,
    RefreshCw, X, Eye, User, FileText, Calendar, MessageSquare,
    ShieldCheck, ShieldX, Search, Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '../utils/formatters';
import { gooeyToast } from 'goey-toast';
import { useAuth } from '@/contexts/auth-context';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
    const { session } = useAuth();
    const [previewImage, setPreviewImage] = useState(null);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [detailTx, setDetailTx] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [searchInput, setSearchInput] = useState(filters?.search || '');

    const handleBulkVerify = async () => {
        setBulkLoading(true);
        try {
            await onBulkVerify?.();
            gooeyToast.success('Đã duyệt hàng loạt thành công');
        } finally {
            setBulkLoading(false);
        }
    };

    const handleSearch = () => {
        onFilterChange?.('search', searchInput);
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') handleSearch();
    };

    const handleClearSearch = () => {
        setSearchInput('');
        onFilterChange?.('search', '');
    };

    const handleVerify = async (paymentId) => {
        setActionLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/payments/${paymentId}/verify`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.access_token}`
                }
            });
            const json = await res.json();
            if (json.success) {
                gooeyToast.success('Đã xác nhận thanh toán');
                setDetailTx(null);
                onRefresh?.();
            } else {
                gooeyToast.error(json.message || 'Có lỗi xảy ra');
            }
        } catch {
            gooeyToast.error('Không thể xác nhận thanh toán');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (paymentId) => {
        if (!rejectReason.trim()) {
            gooeyToast.error('Vui lòng nhập lý do từ chối');
            return;
        }
        setActionLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/payments/${paymentId}/reject`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ reason: rejectReason })
            });
            const json = await res.json();
            if (json.success) {
                gooeyToast.success('Đã từ chối thanh toán');
                setDetailTx(null);
                setRejectReason('');
                onRefresh?.();
            } else {
                gooeyToast.error(json.message || 'Có lỗi xảy ra');
            }
        } catch {
            gooeyToast.error('Không thể từ chối thanh toán');
        } finally {
            setActionLoading(false);
        }
    };

    // Status filter tabs
    const statusTabs = [
        { key: 'all', label: 'Tất cả', count: pagination?.total, color: null },
        { key: 'pending', label: 'Chờ xử lý', count: summary?.totalPending, color: 'amber' },
        { key: 'verified', label: 'Đã khớp', count: summary?.totalVerified, color: 'emerald' },
        { key: 'rejected', label: 'Từ chối', count: summary?.totalRejected, color: 'red' }
    ];

    const pendingCount = transactions.filter(t => t.verification_status === 'pending').length;
    const allPendingSelected = selectedIds.length > 0 && selectedIds.length === pendingCount;

    // Group transactions by student for better visual grouping
    const groupedByStudent = useMemo(() => {
        if (filters?.status !== 'pending') return null;
        const groups = {};
        transactions.forEach(tx => {
            const studentName = tx.invoice?.student?.full_name || 'Không xác định';
            if (!groups[studentName]) {
                groups[studentName] = { name: studentName, items: [], total: 0 };
            }
            groups[studentName].items.push(tx);
            groups[studentName].total += parseFloat(tx.amount || 0);
        });
        return Object.values(groups).sort((a, b) => b.items.length - a.items.length);
    }, [transactions, filters?.status]);

    const showGroupedView = filters?.status === 'pending' && groupedByStudent && groupedByStudent.length > 0;

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
                    active={filters?.status === 'pending'}
                    onClick={() => onFilterChange?.('status', filters?.status === 'pending' ? 'all' : 'pending')}
                />
                <SummaryCard
                    label="Đã xác nhận"
                    value={summary?.totalVerified || 0}
                    color="emerald"
                    icon={CheckCircle2}
                    active={filters?.status === 'verified'}
                    onClick={() => onFilterChange?.('status', filters?.status === 'verified' ? 'all' : 'verified')}
                />
                <SummaryCard
                    label="Từ chối"
                    value={summary?.totalRejected || 0}
                    color="red"
                    icon={XCircle}
                    active={filters?.status === 'rejected'}
                    onClick={() => onFilterChange?.('status', filters?.status === 'rejected' ? 'all' : 'rejected')}
                />
                <div className="bg-white rounded-xl p-4 border shadow-sm">
                    <p className="text-xs text-muted-foreground">Tổng GD</p>
                    <p className="text-2xl font-bold">{pagination?.total || 0}</p>
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-white rounded-xl border p-4 shadow-sm">
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Tìm theo tên học viên, mã hóa đơn, SĐT, email..."
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            className="pl-9 pr-8"
                        />
                        {searchInput && (
                            <button
                                onClick={handleClearSearch}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Filter Tabs + Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {statusTabs.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => onFilterChange?.('status', tab.key)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${filters?.status === tab.key
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

                        <div className="h-6 w-px bg-border mx-1" />

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

                {/* Active filters indicator */}
                {(filters?.search || filters?.status !== 'all') && (
                    <div className="mt-3 flex items-center gap-2 text-sm">
                        <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Đang lọc:</span>
                        {filters?.search && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs">
                                "{filters.search}"
                                <button onClick={handleClearSearch}>
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )}
                        {filters?.status !== 'all' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                                {statusTabs.find(t => t.key === filters.status)?.label}
                            </span>
                        )}
                        <button onClick={onResetFilters} className="text-xs text-muted-foreground hover:text-foreground underline ml-2">
                            Xóa bộ lọc
                        </button>
                    </div>
                )}
            </div>

            {/* Table — Grouped or Flat */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                        <AlertCircle className="w-12 h-12 mb-2 opacity-50" />
                        <p className="font-medium">Không có giao dịch nào</p>
                        {filters?.search && <p className="text-sm mt-1">Thử tìm kiếm với từ khóa khác</p>}
                    </div>
                ) : showGroupedView ? (
                    /* GROUPED VIEW — For pending tab, group by student */
                    <div className="divide-y">
                        {groupedByStudent.map(group => (
                            <div key={group.name}>
                                {/* Student Group Header */}
                                <div className="bg-amber-50/60 px-4 py-2.5 flex items-center justify-between border-b">
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-amber-600" />
                                        <span className="font-semibold text-sm">{group.name}</span>
                                        <span className="text-xs bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full">
                                            {group.items.length} GD
                                        </span>
                                    </div>
                                    <span className="text-sm font-semibold text-amber-700">
                                        {formatCurrency(group.total)}
                                    </span>
                                </div>
                                {/* Student's transactions */}
                                <table className="w-full">
                                    <tbody className="divide-y divide-dashed">
                                        {group.items.map(tx => (
                                            <TransactionRow
                                                key={tx.id}
                                                transaction={tx}
                                                isSelected={selectedIds.includes(tx.id)}
                                                onToggle={() => onToggleSelect?.(tx.id)}
                                                onPreviewImage={setPreviewImage}
                                                onViewDetail={setDetailTx}
                                                compact
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* FLAT VIEW — Default table */
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
                                    <th className="p-3 text-center">Chi tiết</th>
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
                                        onViewDetail={setDetailTx}
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

            {/* Image Preview Modal — Portal */}
            {previewImage && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80"
                    onClick={() => setPreviewImage(null)}
                >
                    <button
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/40 transition-colors"
                        onClick={() => setPreviewImage(null)}
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>
                    <div className="relative max-w-3xl max-h-[90vh] p-2" onClick={e => e.stopPropagation()}>
                        <img
                            src={previewImage}
                            alt="Minh chứng chuyển khoản"
                            className="max-w-full max-h-[85vh] object-contain rounded-lg"
                        />
                    </div>
                </div>,
                document.body
            )}

            {/* Payment Detail Modal — Portal */}
            {detailTx && createPortal(
                <PaymentDetailModal
                    tx={detailTx}
                    onClose={() => { setDetailTx(null); setRejectReason(''); }}
                    onVerify={handleVerify}
                    onReject={handleReject}
                    rejectReason={rejectReason}
                    setRejectReason={setRejectReason}
                    actionLoading={actionLoading}
                    onPreviewImage={setPreviewImage}
                />,
                document.body
            )}
        </div>
    );
}

// ============================================
// PAYMENT DETAIL MODAL
// ============================================

function PaymentDetailModal({ tx, onClose, onVerify, onReject, rejectReason, setRejectReason, actionLoading, onPreviewImage }) {
    const isPending = tx.verification_status === 'pending';
    const isVerified = tx.verification_status === 'verified';
    const isRejected = tx.verification_status === 'rejected';
    const isCash = tx.payment_method === 'cash';
    const [showRejectForm, setShowRejectForm] = useState(false);

    const statusConfig = {
        pending: { color: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50', label: 'Chờ xử lý', icon: Clock },
        verified: { color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', label: 'Đã xác nhận', icon: CheckCircle2 },
        rejected: { color: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50', label: 'Từ chối', icon: XCircle }
    };
    const status = statusConfig[tx.verification_status] || statusConfig.verified;
    const StatusIcon = status.icon;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Status Banner */}
                <div className={`px-6 py-4 rounded-t-2xl ${status.bg} border-b flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${status.color} text-white`}>
                            <StatusIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg">Chi tiết giao dịch</h2>
                            <span className={`text-sm font-medium ${status.text}`}>{status.label}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Invoice & Student Info */}
                    <div className="space-y-3">
                        <InfoRow icon={FileText} label="Mã hóa đơn" value={tx.invoice?.invoice_code || '—'} />
                        <InfoRow icon={User} label="Học viên" value={tx.invoice?.student?.full_name || '—'} />
                        <InfoRow icon={CreditCard} label="Hình thức" value={isCash ? 'Tiền mặt' : 'Chuyển khoản'} />
                        <InfoRow icon={Calendar} label="Thời gian" value={
                            `${new Date(tx.created_at).toLocaleDateString('vi-VN')} ${new Date(tx.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
                        } />
                    </div>

                    {/* Amount */}
                    <div className="rounded-xl bg-slate-50 p-4 border">
                        <p className="text-sm text-muted-foreground mb-1">Số tiền thanh toán</p>
                        <p className="text-2xl font-bold text-emerald-600">{formatCurrency(tx.amount)}</p>
                        {tx.invoice && (
                            <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                                <span>Tổng hóa đơn: {formatCurrency(tx.invoice.final_amount)}</span>
                                <span>Đã thu: {formatCurrency(tx.invoice.paid_amount)}</span>
                            </div>
                        )}
                    </div>

                    {/* Notes / Transfer Content */}
                    {tx.notes && (
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                                <p className="text-sm font-medium">Nội dung chuyển khoản</p>
                            </div>
                            <p className="text-sm bg-slate-50 rounded-lg p-3 border whitespace-pre-wrap">{tx.notes}</p>
                        </div>
                    )}

                    {/* Bank Proof Image */}
                    {tx.bank_proof_url && (
                        <div>
                            <p className="text-sm font-medium mb-2 flex items-center gap-2">
                                <Image className="w-4 h-4 text-muted-foreground" />
                                Minh chứng chuyển khoản
                            </p>
                            <button
                                className="w-full rounded-xl border-2 border-dashed border-blue-300 hover:border-blue-500 transition-colors overflow-hidden"
                                onClick={() => onPreviewImage(tx.bank_proof_url)}
                            >
                                <img
                                    src={tx.bank_proof_url}
                                    alt="Minh chứng"
                                    className="w-full max-h-48 object-cover"
                                />
                                <p className="text-xs text-blue-600 py-2">Click để xem phóng to</p>
                            </button>
                        </div>
                    )}

                    {/* Rejection reason if rejected */}
                    {isRejected && tx.rejection_reason && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm font-medium text-red-700">Lý do từ chối:</p>
                            <p className="text-sm text-red-600 mt-1">{tx.rejection_reason}</p>
                        </div>
                    )}

                    {/* Actions for pending */}
                    {isPending && (
                        <div className="space-y-3 pt-2 border-t">
                            {!showRejectForm ? (
                                <div className="flex gap-3">
                                    <Button
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-11"
                                        onClick={() => onVerify(tx.id)}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <ShieldCheck className="w-4 h-4 mr-2" />
                                        )}
                                        Xác nhận thanh toán
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="flex-1 border-red-300 text-red-600 hover:bg-red-50 h-11"
                                        onClick={() => setShowRejectForm(true)}
                                        disabled={actionLoading}
                                    >
                                        <ShieldX className="w-4 h-4 mr-2" />
                                        Từ chối
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-sm font-medium text-red-700">Lý do từ chối *</label>
                                        <Textarea
                                            value={rejectReason}
                                            onChange={e => setRejectReason(e.target.value)}
                                            placeholder="Nhập lý do từ chối..."
                                            className="mt-1 border-red-300 focus:border-red-500"
                                            rows={3}
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                            onClick={() => onReject(tx.id)}
                                            disabled={actionLoading || !rejectReason.trim()}
                                        >
                                            {actionLoading ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <ShieldX className="w-4 h-4 mr-2" />
                                            )}
                                            Xác nhận từ chối
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => { setShowRejectForm(false); setRejectReason(''); }}
                                            disabled={actionLoading}
                                        >
                                            Hủy
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Verified info */}
                    {isVerified && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            <p className="text-sm text-emerald-700 font-medium">
                                Thanh toán đã được xác nhận
                                {tx.verified_at && ` lúc ${new Date(tx.verified_at).toLocaleString('vi-VN')}`}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function InfoRow({ icon: Icon, label, value }) {
    return (
        <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon className="w-4 h-4" />
                {label}
            </span>
            <span className="text-sm font-medium">{value}</span>
        </div>
    );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function SummaryCard({ label, value, amount, color, icon: Icon, active, onClick }) {
    const colorClasses = {
        amber: 'bg-amber-50 text-amber-600 border-amber-200',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
        red: 'bg-red-50 text-red-600 border-red-200'
    };

    return (
        <button
            onClick={onClick}
            className={`rounded-xl p-4 border text-left transition-all ${
                active ? 'ring-2 ring-primary ring-offset-1 shadow-md' : 'hover:shadow-sm'
            } ${colorClasses[color] || 'bg-white'}`}
        >
            <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4" />
                <span className="text-xs font-medium">{label}</span>
            </div>
            <p className="text-2xl font-bold">{value}</p>
            {amount != null && (
                <p className="text-xs mt-1">{formatCurrency(amount)}</p>
            )}
        </button>
    );
}

function TransactionRow({ transaction, isSelected, onToggle, onPreviewImage, onViewDetail, compact }) {
    const tx = transaction;
    const isPending = tx.verification_status === 'pending';
    const isCash = tx.payment_method === 'cash';

    const statusConfig = {
        pending: { icon: Clock, color: 'text-amber-600 bg-amber-50', label: 'Chờ xử lý' },
        verified: { icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50', label: 'Đã khớp' },
        rejected: { icon: XCircle, color: 'text-red-600 bg-red-50', label: 'Từ chối' }
    };
    const status = statusConfig[tx.verification_status] || statusConfig.verified;
    const StatusIcon = status.icon;

    return (
        <tr className={`hover:bg-slate-50 ${isPending ? 'bg-amber-50/20' : ''}`}>
            <td className="p-3 w-10">
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
                {!compact && (
                    <p className="text-xs text-muted-foreground">
                        {tx.invoice?.student?.full_name || '—'}
                    </p>
                )}
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
            <td className="p-3 text-center">
                <button
                    onClick={() => onViewDetail(tx)}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                    title="Xem chi tiết"
                >
                    <Eye className="w-4 h-4 text-primary" />
                </button>
            </td>
        </tr>
    );
}

export default TransactionsTab;
