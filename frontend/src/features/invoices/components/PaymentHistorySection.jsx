/**
 * PaymentHistorySection Component
 * 
 * Hiển thị lịch sử thanh toán cho một hóa đơn.
 * Admin có thể verify/reject bank transfers từ đây.
 */

import { useState, useEffect, useCallback } from 'react';
import {
    History, Check, X, Clock, AlertCircle,
    CreditCard, Banknote, Image, Loader2,
    CheckCircle2, XCircle, Printer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '../utils/formatters';

export function PaymentHistorySection({
    invoiceId,
    payments = [],
    loading = false,
    onVerify,
    onReject,
    onRefresh,
    onPrintReceipt  // NEW: handler to open receipt modal
}) {
    const [actionLoading, setActionLoading] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectInput, setShowRejectInput] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);

    const handleVerify = async (paymentId) => {
        setActionLoading(paymentId);
        try {
            await onVerify?.(paymentId);
            onRefresh?.();
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (paymentId) => {
        if (!rejectReason.trim()) return;
        setActionLoading(paymentId);
        try {
            await onReject?.(paymentId, rejectReason);
            setShowRejectInput(null);
            setRejectReason('');
            onRefresh?.();
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Đang tải lịch sử thanh toán...
            </div>
        );
    }

    if (!payments.length) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Chưa có thanh toán nào</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <History className="w-4 h-4" />
                Lịch sử thanh toán ({payments.length})
            </div>

            <div className="space-y-2">
                {payments.map((payment, index) => (
                    <PaymentRow
                        key={payment.id}
                        payment={payment}
                        index={index + 1}
                        actionLoading={actionLoading}
                        showRejectInput={showRejectInput}
                        rejectReason={rejectReason}
                        onVerify={handleVerify}
                        onRejectClick={() => setShowRejectInput(payment.id)}
                        onRejectCancel={() => { setShowRejectInput(null); setRejectReason(''); }}
                        onRejectConfirm={() => handleReject(payment.id)}
                        onRejectReasonChange={setRejectReason}
                        onPreviewImage={setPreviewImage}
                        onPrintReceipt={onPrintReceipt}
                    />
                ))}
            </div>

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
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute top-4 right-4 p-2 bg-white/80 rounded-full hover:bg-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function PaymentRow({
    payment,
    index,
    actionLoading,
    showRejectInput,
    rejectReason,
    onVerify,
    onRejectClick,
    onRejectCancel,
    onRejectConfirm,
    onRejectReasonChange,
    onPreviewImage,
    onPrintReceipt
}) {
    const isLoading = actionLoading === payment.id;
    const isPending = payment.verification_status === 'pending';
    const isVerified = payment.verification_status === 'verified';
    const isRejected = payment.verification_status === 'rejected';
    const isCash = payment.payment_method === 'cash';
    const isBank = payment.payment_method === 'bank_transfer';

    const confirmationMethodLabels = {
        cash_direct: 'Tiền mặt trực tiếp',
        auto_reconciliation: 'Hệ thống tự động',
        student_upload: 'Học sinh tải lên',
        manual: 'Thủ công',
        bulk_manual: 'Xác nhận hàng loạt'
    };

    const statusConfig = {
        pending: {
            icon: Clock,
            color: 'text-amber-600 bg-amber-50 border-amber-200',
            label: 'Chờ xác nhận'
        },
        verified: {
            icon: CheckCircle2,
            color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
            label: 'Đã xác nhận'
        },
        rejected: {
            icon: XCircle,
            color: 'text-red-600 bg-red-50 border-red-200',
            label: 'Đã từ chối'
        }
    };

    const status = statusConfig[payment.verification_status] || statusConfig.verified;
    const StatusIcon = status.icon;

    return (
        <div className={`p-3 rounded-lg border ${status.color}`}>
            <div className="flex items-start gap-3">
                {/* Index & Icon */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center text-xs font-bold text-muted-foreground border">
                    #{index}
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            {isCash ? (
                                <Banknote className="w-4 h-4 text-emerald-600" />
                            ) : (
                                <CreditCard className="w-4 h-4 text-blue-600" />
                            )}
                            <span className="font-semibold text-foreground">
                                {formatCurrency(payment.amount)}
                            </span>
                        </div>

                        {/* Status Badge */}
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                        </span>
                    </div>

                    {/* Details */}
                    <div className="mt-1 text-xs text-muted-foreground space-y-0.5">
                        <p>
                            {isCash ? 'Tiền mặt' : 'Chuyển khoản'} • {new Date(payment.created_at).toLocaleString('vi-VN')}
                        </p>
                        {payment.received_by_user?.full_name && (
                            <p>Thu bởi: {payment.received_by_user.full_name}</p>
                        )}
                        {isVerified && payment.verified_by_user?.full_name && (
                            <p>Xác nhận bởi: {payment.verified_by_user.full_name}</p>
                        )}
                        {isVerified && payment.confirmation_method && (
                            <p>Phương thức: {confirmationMethodLabels[payment.confirmation_method] || payment.confirmation_method}</p>
                        )}
                        {isVerified && payment.verified_at && (
                            <p>Xác nhận lúc: {new Date(payment.verified_at).toLocaleString('vi-VN')}</p>
                        )}
                        {isRejected && payment.rejection_reason && (
                            <p className="text-red-600">Lý do: {payment.rejection_reason}</p>
                        )}
                    </div>

                    {/* Bank Proof Image */}
                    {isBank && payment.bank_proof_url && (
                        <button
                            onClick={() => onPreviewImage(payment.bank_proof_url)}
                            className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline"
                        >
                            <Image className="w-3 h-3" />
                            Xem ảnh chuyển khoản
                        </button>
                    )}

                    {/* Print Receipt Button - Only for verified payments */}
                    {isVerified && onPrintReceipt && (
                        <button
                            onClick={() => onPrintReceipt(payment)}
                            className="mt-2 flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 hover:underline"
                        >
                            <Printer className="w-3 h-3" />
                            In biên nhận
                        </button>
                    )}

                    {/* Pending Actions */}
                    {isPending && isBank && (
                        <div className="mt-3">
                            {showRejectInput === payment.id ? (
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={rejectReason}
                                        onChange={(e) => onRejectReasonChange(e.target.value)}
                                        placeholder="Nhập lý do từ chối..."
                                        className="w-full px-3 py-1.5 text-sm border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                        autoFocus
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={onRejectCancel}
                                            disabled={isLoading}
                                        >
                                            Hủy
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={onRejectConfirm}
                                            disabled={isLoading || !rejectReason.trim()}
                                        >
                                            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Xác nhận từ chối'}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        className="bg-emerald-600 hover:bg-emerald-700"
                                        onClick={() => onVerify(payment.id)}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                            <>
                                                <Check className="w-3 h-3 mr-1" />
                                                Xác nhận
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                        onClick={onRejectClick}
                                        disabled={isLoading}
                                    >
                                        <X className="w-3 h-3 mr-1" />
                                        Từ chối
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PaymentHistorySection;
