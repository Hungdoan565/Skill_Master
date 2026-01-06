/**
 * ReceiptTemplate Component
 * 
 * Template biên nhận thanh toán PDF-ready.
 * Có thể in trực tiếp hoặc export PDF.
 * 
 * @param {Object} invoice - Thông tin hóa đơn
 * @param {Object} payment - Thông tin thanh toán
 * @param {Object} centerInfo - Thông tin trung tâm
 */

import { forwardRef } from 'react';
import { Building2, Phone, Mail, MapPin, CheckCircle2 } from 'lucide-react';
import { formatDate, formatCurrency } from '../utils/formatters';
import { BANK_CONFIG, PAYMENT_METHOD_LABELS } from '../utils/constants';

// Default center info - should be passed from parent or fetched
const DEFAULT_CENTER_INFO = {
    name: 'Skill Master Academy',
    address: 'Số 123, Đường ABC, Quận XYZ, TP. Hồ Chí Minh',
    phone: '0909 123 456',
    email: 'contact@skillmaster.vn',
    taxCode: '0123456789'
};

export const ReceiptTemplate = forwardRef(function ReceiptTemplate({
    invoice,
    payment,
    centerInfo = DEFAULT_CENTER_INFO
}, ref) {
    if (!invoice || !payment) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                Không có dữ liệu để hiển thị
            </div>
        );
    }

    const remaining = (invoice.final_amount || 0) - (invoice.paid_amount || 0);

    return (
        <div
            ref={ref}
            className="bg-white w-[210mm] min-h-[148mm] mx-auto p-8 print:p-6 font-sans text-sm"
            style={{
                fontFamily: "'Inter', 'Roboto', sans-serif",
                color: '#1a1a1a'
            }}
        >
            {/* Header */}
            <div className="flex items-start justify-between border-b-2 border-emerald-600 pb-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-emerald-600 rounded-xl flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-emerald-700">{centerInfo.name}</h1>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {centerInfo.phone}
                            </span>
                            <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" /> {centerInfo.email}
                            </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="w-3 h-3" /> {centerInfo.address}
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-lg font-bold text-gray-800">BIÊN NHẬN</h2>
                    <p className="text-xs text-gray-500">Payment Receipt</p>
                    <div className="mt-2 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200">
                        <p className="font-mono font-bold text-emerald-700">
                            #{payment.id?.slice(0, 8).toUpperCase() || 'N/A'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Invoice & Payment Info */}
            <div className="grid grid-cols-2 gap-6 mb-6">
                {/* Left: Student & Invoice Info */}
                <div className="space-y-3">
                    <InfoRow label="Mã hóa đơn" value={invoice.invoice_code} mono />
                    <InfoRow label="Học viên" value={invoice.student?.full_name} bold />
                    <InfoRow label="Email" value={invoice.student?.email} />
                    <InfoRow label="SĐT" value={invoice.student?.phone} />
                    <InfoRow label="Lớp học" value={invoice.class?.name} />
                    <InfoRow label="Khóa học" value={invoice.class?.course?.title} />
                </div>

                {/* Right: Payment Details */}
                <div className="space-y-3">
                    <InfoRow label="Ngày thanh toán" value={formatDate(payment.created_at || payment.payment_date)} />
                    <InfoRow
                        label="Phương thức"
                        value={PAYMENT_METHOD_LABELS[payment.payment_method] || payment.payment_method}
                    />
                    {payment.payment_method === 'bank_transfer' && (
                        <>
                            <InfoRow label="Ngân hàng" value={BANK_CONFIG.bankId} />
                            <InfoRow label="STK" value={BANK_CONFIG.accountNo} />
                            <InfoRow label="Chủ TK" value={BANK_CONFIG.accountName} />
                        </>
                    )}
                    {payment.reference_code && (
                        <InfoRow label="Mã GD" value={payment.reference_code} mono />
                    )}
                </div>
            </div>

            {/* Amount Summary */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-100 mb-6">
                <div className="grid grid-cols-4 gap-4 text-center">
                    <AmountBox label="Tổng tiền" amount={invoice.final_amount} />
                    <AmountBox label="Đã đóng trước" amount={(invoice.paid_amount || 0) - (payment.amount || 0)} />
                    <AmountBox label="Số tiền lần này" amount={payment.amount} highlight />
                    <AmountBox label="Còn nợ" amount={remaining} danger={remaining > 0} />
                </div>
            </div>

            {/* Amount in Words */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-xs text-gray-500 mb-1">Bằng chữ:</p>
                <p className="font-medium text-gray-800 italic">
                    {numberToVietnameseWords(payment.amount || 0)} đồng
                </p>
            </div>

            {/* Notes */}
            {payment.notes && (
                <div className="mb-6">
                    <p className="text-xs text-gray-500 mb-1">Ghi chú:</p>
                    <p className="text-gray-700">{payment.notes}</p>
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-400">
                    <p>Mã số thuế: {centerInfo.taxCode}</p>
                    <p>Biên nhận này có giá trị pháp lý.</p>
                </div>
                <div className="text-center">
                    <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-2">
                        <span className="text-xs text-gray-400">Đã xác nhận</span>
                    </div>
                    <p className="text-xs text-gray-500">Thu ngân</p>
                </div>
            </div>

            {/* Status Stamp */}
            {payment.verification_status === 'verified' && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-15deg] opacity-10 pointer-events-none">
                    <div className="flex items-center gap-2 text-emerald-600">
                        <CheckCircle2 className="w-20 h-20" />
                        <span className="text-6xl font-bold">ĐÃ THANH TOÁN</span>
                    </div>
                </div>
            )}
        </div>
    );
});

// ============================================
// SUB-COMPONENTS
// ============================================

function InfoRow({ label, value, mono = false, bold = false }) {
    return (
        <div className="flex justify-between items-center">
            <span className="text-gray-500">{label}:</span>
            <span className={`text-gray-800 ${mono ? 'font-mono' : ''} ${bold ? 'font-semibold' : ''}`}>
                {value || '—'}
            </span>
        </div>
    );
}

function AmountBox({ label, amount, highlight = false, danger = false }) {
    let colorClass = 'text-gray-800';
    if (highlight) colorClass = 'text-emerald-700';
    if (danger) colorClass = 'text-red-600';

    return (
        <div>
            <p className={`text-xs ${danger ? 'text-red-500' : highlight ? 'text-emerald-600' : 'text-gray-500'}`}>
                {label}
            </p>
            <p className={`text-lg font-bold ${colorClass}`}>
                {formatCurrency(amount || 0)}
            </p>
        </div>
    );
}

// ============================================
// UTILITIES
// ============================================

/**
 * Chuyển số thành chữ tiếng Việt
 */
function numberToVietnameseWords(num) {
    if (num === 0) return 'Không';

    const units = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
    const positions = ['', 'nghìn', 'triệu', 'tỷ'];

    const parseThreeDigits = (n) => {
        const hundred = Math.floor(n / 100);
        const ten = Math.floor((n % 100) / 10);
        const unit = n % 10;

        let result = '';

        if (hundred > 0) {
            result += units[hundred] + ' trăm ';
        }

        if (ten > 1) {
            result += units[ten] + ' mươi ';
            if (unit === 1) result += 'mốt';
            else if (unit === 5) result += 'lăm';
            else if (unit > 0) result += units[unit];
        } else if (ten === 1) {
            result += 'mười ';
            if (unit === 5) result += 'lăm';
            else if (unit > 0) result += units[unit];
        } else if (unit > 0 && hundred > 0) {
            result += 'lẻ ' + units[unit];
        } else if (unit > 0) {
            result += units[unit];
        }

        return result.trim();
    };

    if (num >= 1e12) return 'Số quá lớn';

    const parts = [];
    let remaining = num;
    let position = 0;

    while (remaining > 0) {
        const chunk = remaining % 1000;
        if (chunk > 0) {
            const words = parseThreeDigits(chunk);
            parts.unshift(words + (positions[position] ? ' ' + positions[position] : ''));
        }
        remaining = Math.floor(remaining / 1000);
        position++;
    }

    const result = parts.join(' ').trim();
    return result.charAt(0).toUpperCase() + result.slice(1);
}

export default ReceiptTemplate;
