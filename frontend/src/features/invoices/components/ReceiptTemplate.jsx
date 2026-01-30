/**
 * ReceiptTemplate V2 - Best Practices Edition
 * 
 * Professional payment receipt following industry standards:
 * - Single A5 page (landscape)
 * - Itemized breakdown
 * - Dual signature fields
 * - Compact layout
 */

import { PAYMENT_METHOD_LABELS } from '../utils/constants';
import logoImage from '@/assets/logo.png';

// ============================================
// UTILITY: Number to Vietnamese Words
// ============================================
function numberToVietnameseWords(num) {
    if (!num || num === 0) return 'Không đồng';

    const units = ['', 'nghìn', 'triệu', 'tỷ'];
    const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

    const readThreeDigits = (n) => {
        if (n === 0) return '';
        let result = '';
        const hundreds = Math.floor(n / 100);
        const tens = Math.floor((n % 100) / 10);
        const ones = n % 10;

        if (hundreds > 0) result += digits[hundreds] + ' trăm ';
        if (tens > 0) {
            if (tens === 1) result += 'mười ';
            else result += digits[tens] + ' mươi ';
        } else if (hundreds > 0 && ones > 0) {
            result += 'lẻ ';
        }
        if (ones > 0) {
            if (tens > 1 && ones === 1) result += 'mốt';
            else if (tens > 0 && ones === 5) result += 'lăm';
            else result += digits[ones];
        }
        return result.trim();
    };

    let result = '';
    let unitIndex = 0;
    let n = Math.abs(Math.floor(num));

    while (n > 0) {
        const chunk = n % 1000;
        if (chunk > 0) {
            const chunkText = readThreeDigits(chunk);
            result = chunkText + (units[unitIndex] ? ' ' + units[unitIndex] : '') + ' ' + result;
        }
        n = Math.floor(n / 1000);
        unitIndex++;
    }

    result = result.trim();
    result = result.charAt(0).toUpperCase() + result.slice(1) + ' đồng';
    return result;
}

// ============================================
// MAIN COMPONENT
// ============================================
export function ReceiptTemplate({ invoice, payment }) {
    if (!invoice || !payment) return null;

    const paymentDate = new Date(payment.created_at);
    const formattedDate = paymentDate.toLocaleDateString('vi-VN');
    const formattedTime = paymentDate.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
    });

    // Calculate amounts
    const totalAmount = invoice.final_amount || 0;
    const previousPaid = (invoice.paid_amount || 0) - payment.amount;
    const thisPayment = payment.amount || 0;
    const remaining = totalAmount - (invoice.paid_amount || 0);

    return (
        <div className="receipt-container">
            {/* Custom print styles */}
            <style>{`
        .receipt-container {
          width: 210mm;
          min-height: 148mm;
          max-height: 148mm;
          padding: 8mm;
          font-family: 'Times New Roman', serif;
          font-size: 11pt;
          background: white;
          color: #000;
          box-sizing: border-box;
          overflow: hidden;
        }
        @media print {
          .receipt-container {
            width: 210mm;
            height: 148mm;
            margin: 0;
            padding: 8mm;
            page-break-inside: avoid;
          }
        }
      `}</style>

            {/* Header Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4mm', borderBottom: '2px solid #16a34a', paddingBottom: '3mm' }}>
                {/* Left: Logo & Company */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '3mm' }}>
                    <img
                        src={logoImage}
                        alt="Skill Master Academy"
                        style={{ width: '12mm', height: '12mm', objectFit: 'contain' }}
                    />
                    <div>
                        <div style={{ fontWeight: 'bold', fontSize: '12pt' }}>Skill Master Academy</div>
<div style={{ fontSize: '8pt', color: '#666' }}>
                            📞 0909 123 456 | 📧 contact@skillmaster.vn
                        </div>
                    </div>
                </div>

                {/* Right: Receipt Title */}
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14pt', fontWeight: 'bold', color: '#16a34a' }}>PHIẾU THU</div>
                    <div style={{ fontSize: '9pt', color: '#666' }}>Payment Receipt</div>
                    <div style={{ fontSize: '10pt', fontFamily: 'monospace', marginTop: '1mm' }}>
                        #{invoice.invoice_code}
                    </div>
                </div>
            </div>

            {/* Info Grid: 2 columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4mm', marginBottom: '4mm' }}>
                {/* Left Column: Student Info */}
                <div style={{ background: '#f8f8f8', padding: '3mm', borderRadius: '2mm', fontSize: '10pt' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '2mm', color: '#16a34a' }}>THÔNG TIN HỌC VIÊN</div>
                    <InfoRow label="Họ tên" value={invoice.student?.full_name || '—'} />
                    <InfoRow label="SĐT" value={invoice.student?.phone || '—'} />
                    <InfoRow label="Email" value={invoice.student?.email || '—'} />
                </div>

                {/* Right Column: Course Info */}
                <div style={{ background: '#f8f8f8', padding: '3mm', borderRadius: '2mm', fontSize: '10pt' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '2mm', color: '#16a34a' }}>THÔNG TIN KHÓA HỌC</div>
                    <InfoRow label="Lớp" value={invoice.class?.name || '—'} />
                    <InfoRow label="Khóa học" value={invoice.class?.course?.name || '—'} />
                    <InfoRow label="Thời gian" value={`${invoice.class?.start_date ? new Date(invoice.class.start_date).toLocaleDateString('vi-VN') : '—'} - ${invoice.class?.end_date ? new Date(invoice.class.end_date).toLocaleDateString('vi-VN') : '—'}`} />
                </div>
            </div>

            {/* Payment Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '3mm', fontSize: '10pt' }}>
                <thead>
                    <tr style={{ background: '#16a34a', color: 'white' }}>
                        <th style={{ padding: '2mm', textAlign: 'left', borderRadius: '2mm 0 0 0' }}>Diễn giải</th>
                        <th style={{ padding: '2mm', textAlign: 'right', width: '25%' }}>Số tiền</th>
                        <th style={{ padding: '2mm', textAlign: 'center', width: '20%', borderRadius: '0 2mm 0 0' }}>Ghi chú</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style={{ borderBottom: '1px solid #ddd' }}>
                        <td style={{ padding: '2mm' }}>Học phí khóa {invoice.class?.course?.name || 'học'}</td>
                        <td style={{ padding: '2mm', textAlign: 'right' }}>{totalAmount.toLocaleString()}đ</td>
                        <td style={{ padding: '2mm', textAlign: 'center', color: '#666' }}>Tổng</td>
                    </tr>
                    {previousPaid > 0 && (
                        <tr style={{ borderBottom: '1px solid #ddd' }}>
                            <td style={{ padding: '2mm' }}>Đã thanh toán trước</td>
                            <td style={{ padding: '2mm', textAlign: 'right', color: '#16a34a' }}>-{previousPaid.toLocaleString()}đ</td>
                            <td style={{ padding: '2mm', textAlign: 'center', color: '#666' }}>Đã đóng</td>
                        </tr>
                    )}
                    <tr style={{ background: '#e8f5e9', fontWeight: 'bold' }}>
                        <td style={{ padding: '2mm' }}>
                            💳 Thanh toán lần này ({PAYMENT_METHOD_LABELS[payment.payment_method] || payment.payment_method})
                        </td>
                        <td style={{ padding: '2mm', textAlign: 'right', color: '#16a34a', fontSize: '11pt' }}>
                            {thisPayment.toLocaleString()}đ
                        </td>
                        <td style={{ padding: '2mm', textAlign: 'center' }}>
                            {formattedDate}
                        </td>
                    </tr>
                    {remaining > 0 && (
                        <tr style={{ borderTop: '2px solid #16a34a' }}>
                            <td style={{ padding: '2mm', fontWeight: 'bold' }}>CÒN NỢ</td>
                            <td style={{ padding: '2mm', textAlign: 'right', color: '#dc2626', fontWeight: 'bold' }}>
                                {remaining.toLocaleString()}đ
                            </td>
                            <td></td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Amount in words */}
            <div style={{ background: '#fffbeb', padding: '2mm 3mm', borderRadius: '2mm', marginBottom: '3mm', fontSize: '10pt', border: '1px solid #fbbf24' }}>
                <strong>Bằng chữ:</strong> {numberToVietnameseWords(thisPayment)}
            </div>

            {/* Notes */}
            {payment.notes && (
                <div style={{ fontSize: '9pt', color: '#666', marginBottom: '3mm' }}>
                    <strong>Ghi chú:</strong> {payment.notes}
                </div>
            )}

            {/* Signature Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10mm', marginTop: '4mm' }}>
                <SignatureBox title="Thu ngân" subtitle="(Ký, ghi rõ họ tên)" name={payment.received_by_user?.full_name} />
                <SignatureBox title="Học viên / Phụ huynh" subtitle="(Ký, ghi rõ họ tên)" />
            </div>

            {/* Footer */}
            <div style={{ marginTop: '4mm', paddingTop: '2mm', borderTop: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', fontSize: '8pt', color: '#999' }}>
                <span>📍 Số 123, Đường ABC, Quận XYZ, TP. Hồ Chí Minh</span>
                <span>In lúc: {formattedDate} {formattedTime}</span>
            </div>
        </div>
    );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function InfoRow({ label, value }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1mm' }}>
            <span style={{ color: '#666' }}>{label}:</span>
            <span style={{ fontWeight: '500', maxWidth: '60%', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</span>
        </div>
    );
}

function SignatureBox({ title, subtitle, name }) {
    return (
        <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 'bold', fontSize: '10pt' }}>{title}</div>
            <div style={{ fontSize: '8pt', color: '#999', marginBottom: '8mm' }}>{subtitle}</div>
            <div style={{ borderBottom: '1px dashed #ccc', height: '8mm' }}></div>
            {name && <div style={{ fontSize: '9pt', marginTop: '1mm' }}>{name}</div>}
        </div>
    );
}

export default ReceiptTemplate;
