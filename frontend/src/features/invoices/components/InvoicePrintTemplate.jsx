/**
 * InvoicePrintTemplate
 * 
 * Professional invoice following industry standards:
 * - Single A4 page (portrait)
 * - Itemized breakdown
 * - Dual signature fields
 * - Blue theme
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
export function InvoicePrintTemplate({ invoice, payments = [] }) {
    if (!invoice) return null;

    const printDate = new Date();
    const formattedDate = printDate.toLocaleDateString('vi-VN');
    const formattedTime = printDate.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
    });

    // Calculate amounts
    const originalAmount = invoice.original_amount || 0;
    const discountAmount = invoice.discount_amount || 0;
    const finalAmount = invoice.final_amount || 0;
    const paidAmount = invoice.paid_amount || 0;
    const remainingAmount = finalAmount - paidAmount;

    return (
        <div className="invoice-container">
            {/* Custom print styles */}
            <style>{`
                .invoice-container {
                    width: 210mm;
                    min-height: 297mm;
                    padding: 15mm;
                    font-family: 'Times New Roman', serif;
                    font-size: 11pt;
                    background: white;
                    color: #000;
                    box-sizing: border-box;
                    margin: 0 auto;
                }
                @media print {
                    .invoice-container {
                        width: 210mm;
                        height: 297mm;
                        margin: 0;
                        padding: 15mm;
                        page-break-inside: avoid;
                    }
                }
            `}</style>

            {/* Header Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8mm', borderBottom: '2px solid #2563eb', paddingBottom: '4mm' }}>
                {/* Left: Logo & Company */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4mm' }}>
                    <img
                        src={logoImage}
                        alt="Skill Master Academy"
                        style={{ width: '16mm', height: '16mm', objectFit: 'contain' }}
                    />
                    <div>
                        <div style={{ fontWeight: 'bold', fontSize: '14pt' }}>Skill Master Academy</div>
                        <div style={{ fontSize: '9pt', color: '#666' }}>
                            📍 Số 123, Đường ABC, Quận XYZ, TP. Hồ Chí Minh<br />
                            📞 0909 123 456 | 📧 contact@skillmaster.vn
                        </div>
                    </div>
                </div>

                {/* Right: Invoice Title */}
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '18pt', fontWeight: 'bold', color: '#2563eb' }}>HÓA ĐƠN</div>
                    <div style={{ fontSize: '10pt', color: '#666' }}>Invoice</div>
                    <div style={{ fontSize: '11pt', fontFamily: 'monospace', marginTop: '2mm' }}>
                        Mã HĐ: {invoice.invoice_code}
                    </div>
                    <div style={{ fontSize: '9pt', color: '#666', marginTop: '1mm' }}>
                        Ngày lập: {new Date(invoice.created_at).toLocaleDateString('vi-VN')}
                    </div>
                </div>
            </div>

            {/* Info Grid: 2 columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6mm', marginBottom: '8mm' }}>
                {/* Left Column: Student Info */}
                <div style={{ background: '#f8f8f8', padding: '4mm', borderRadius: '2mm', fontSize: '10pt' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '2mm', color: '#2563eb' }}>THÔNG TIN HỌC VIÊN</div>
                    <InfoRow label="Họ tên" value={invoice.student?.full_name || '—'} />
                    <InfoRow label="SĐT" value={invoice.student?.phone || '—'} />
                    <InfoRow label="Email" value={invoice.student?.email || '—'} />
                </div>

                {/* Right Column: Course Info */}
                <div style={{ background: '#f8f8f8', padding: '4mm', borderRadius: '2mm', fontSize: '10pt' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '2mm', color: '#2563eb' }}>THÔNG TIN KHÓA HỌC</div>
                    <InfoRow label="Lớp" value={invoice.class?.name || '—'} />
                    <InfoRow label="Khóa học" value={invoice.class?.course?.name || invoice.class?.course?.title || '—'} />
                    <InfoRow label="Thời gian" value={`${invoice.class?.start_date ? new Date(invoice.class.start_date).toLocaleDateString('vi-VN') : '—'} - ${invoice.class?.end_date ? new Date(invoice.class.end_date).toLocaleDateString('vi-VN') : '—'}`} />
                </div>
            </div>

            {/* Invoice Details Table */}
            <div style={{ marginBottom: '8mm' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '2mm', color: '#2563eb', fontSize: '11pt' }}>CHI TIẾT HÓA ĐƠN</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
                    <thead>
                        <tr style={{ background: '#2563eb', color: 'white' }}>
                            <th style={{ padding: '2mm', textAlign: 'center', width: '10%' }}>STT</th>
                            <th style={{ padding: '2mm', textAlign: 'left', width: '40%' }}>Diễn giải</th>
                            <th style={{ padding: '2mm', textAlign: 'right', width: '15%' }}>Số tiền</th>
                            <th style={{ padding: '2mm', textAlign: 'right', width: '15%' }}>Giảm giá</th>
                            <th style={{ padding: '2mm', textAlign: 'right', width: '20%' }}>Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style={{ borderBottom: '1px solid #ddd' }}>
                            <td style={{ padding: '2mm', textAlign: 'center' }}>1</td>
                            <td style={{ padding: '2mm' }}>Học phí khóa {invoice.class?.course?.name || invoice.class?.course?.title || 'học'}</td>
                            <td style={{ padding: '2mm', textAlign: 'right' }}>{originalAmount.toLocaleString()}đ</td>
                            <td style={{ padding: '2mm', textAlign: 'right' }}>{discountAmount > 0 ? `-${discountAmount.toLocaleString()}đ` : '0đ'}</td>
                            <td style={{ padding: '2mm', textAlign: 'right', fontWeight: 'bold' }}>{finalAmount.toLocaleString()}đ</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Payment History Table (only show if there are payments) */}
            {payments && payments.length > 0 && (
                <div style={{ marginBottom: '8mm' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '2mm', color: '#2563eb', fontSize: '11pt' }}>LỊCH SỬ THANH TOÁN</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
                        <thead>
                            <tr style={{ background: '#f3f4f6', color: '#374151', borderBottom: '2px solid #ddd' }}>
                                <th style={{ padding: '2mm', textAlign: 'left', width: '25%' }}>Ngày</th>
                                <th style={{ padding: '2mm', textAlign: 'left', width: '30%' }}>Phương thức</th>
                                <th style={{ padding: '2mm', textAlign: 'right', width: '25%' }}>Số tiền</th>
                                <th style={{ padding: '2mm', textAlign: 'center', width: '20%' }}>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((payment, index) => (
                                <tr key={payment.id || index} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '2mm' }}>{new Date(payment.created_at).toLocaleDateString('vi-VN')} {new Date(payment.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</td>
                                    <td style={{ padding: '2mm' }}>{PAYMENT_METHOD_LABELS[payment.payment_method] || payment.payment_method}</td>
                                    <td style={{ padding: '2mm', textAlign: 'right', color: '#16a34a', fontWeight: '500' }}>{Number(payment.amount).toLocaleString()}đ</td>
                                    <td style={{ padding: '2mm', textAlign: 'center' }}>
                                        {payment.verification_status === 'verified' ? (
                                            <span style={{ color: '#16a34a' }}>Đã xác nhận</span>
                                        ) : payment.verification_status === 'rejected' ? (
                                            <span style={{ color: '#dc2626' }}>Đã từ chối</span>
                                        ) : (
                                            <span style={{ color: '#d97706' }}>Chờ xác nhận</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Summary Section */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '6mm' }}>
                <table style={{ width: '50%', fontSize: '11pt', borderCollapse: 'collapse' }}>
                    <tbody>
                        <tr>
                            <td style={{ padding: '2mm', fontWeight: 'bold', textAlign: 'right' }}>Tổng học phí:</td>
                            <td style={{ padding: '2mm', textAlign: 'right', fontWeight: 'bold' }}>{finalAmount.toLocaleString()}đ</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '2mm', fontWeight: 'bold', textAlign: 'right' }}>Đã thanh toán:</td>
                            <td style={{ padding: '2mm', textAlign: 'right', color: '#16a34a', fontWeight: 'bold' }}>{paidAmount.toLocaleString()}đ</td>
                        </tr>
                        <tr style={{ borderTop: '2px solid #2563eb' }}>
                            <td style={{ padding: '2mm', fontWeight: 'bold', textAlign: 'right' }}>CÒN LẠI:</td>
                            <td style={{ padding: '2mm', textAlign: 'right', color: remainingAmount > 0 ? '#dc2626' : '#16a34a', fontWeight: 'bold', fontSize: '12pt' }}>
                                {remainingAmount.toLocaleString()}đ
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Amount in words */}
            <div style={{ background: '#eff6ff', padding: '3mm 4mm', borderRadius: '2mm', marginBottom: '8mm', fontSize: '11pt', border: '1px solid #bfdbfe' }}>
                <strong>Bằng chữ (Tổng học phí):</strong> {numberToVietnameseWords(finalAmount)}
            </div>

            {/* Signature Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10mm', marginTop: '10mm' }}>
                <SignatureBox title="Người lập" subtitle="(Ký, ghi rõ họ tên)" />
                <SignatureBox title="Học viên / Phụ huynh" subtitle="(Ký, ghi rõ họ tên)" name={invoice.student?.full_name} />
            </div>

            {/* Spacer to push footer to bottom if needed, though with absolute print it might not matter */}
            <div style={{ flexGrow: 1 }}></div>

            {/* Footer */}
            <div style={{ marginTop: '20mm', paddingTop: '3mm', borderTop: '1px solid #ddd', textAlign: 'center', fontSize: '9pt', color: '#999' }}>
                Cảm ơn bạn đã đồng hành cùng Skill Master Academy!<br />
                In lúc: {formattedDate} {formattedTime}
            </div>
        </div>
    );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function InfoRow({ label, value }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5mm' }}>
            <span style={{ color: '#666' }}>{label}:</span>
            <span style={{ fontWeight: '500', maxWidth: '70%', textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
        </div>
    );
}

function SignatureBox({ title, subtitle, name }) {
    return (
        <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 'bold', fontSize: '11pt' }}>{title}</div>
            <div style={{ fontSize: '9pt', color: '#999', marginBottom: '15mm' }}>{subtitle}</div>
            <div style={{ borderBottom: '1px dashed #ccc', height: '10mm', margin: '0 10mm' }}></div>
            {name && <div style={{ fontSize: '10pt', marginTop: '2mm', fontWeight: '500' }}>{name}</div>}
        </div>
    );
}

export default InvoicePrintTemplate;
