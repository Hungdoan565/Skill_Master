import { gooeyToast } from 'goey-toast';
/**
 * PrintPayslipModal Component
 * Modal in phiếu lương chuyên nghiệp
 * — React Portal để render ngoài layout stacking context
 * — Inline styles để preview & print giống nhau
 * — Logo thật từ assets
 */

import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, formatMonthYear, formatHours, getPayrollStatusLabel } from '../utils';
import logoSrc from '@/assets/logo.png';

// Convert logo to base64 for print window
let logoBase64 = '';
const canvas = document.createElement('canvas');
const img = new Image();
img.crossOrigin = 'anonymous';
img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext('2d').drawImage(img, 0, 0);
    try { logoBase64 = canvas.toDataURL('image/png'); } catch { logoBase64 = ''; }
};
img.src = logoSrc;

// Inline styles - renders identically in preview & print popup
const S = {
    payslip: {
        maxWidth: 780, margin: '0 auto', fontFamily: "'Segoe UI', 'Inter', sans-serif",
        color: '#1e293b', fontSize: 13, lineHeight: 1.6, background: '#fff',
    },
    accentBar: {
        height: 5, background: 'linear-gradient(90deg, #1e293b 0%, #dc2626 50%, #1e293b 100%)',
    },
    header: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 32px', borderBottom: '1px solid #e2e8f0',
    },
    brand: { display: 'flex', alignItems: 'center', gap: 12 },
    logoImg: { width: 44, height: 44, objectFit: 'contain' },
    brandH1: { fontSize: 15, fontWeight: 700, color: '#1e293b', margin: 0, lineHeight: 1.3 },
    brandSub: { fontSize: 10, color: '#64748b', margin: '2px 0 0' },
    periodBox: {
        textAlign: 'right', background: '#f8fafc', padding: '10px 18px', borderRadius: 8,
        border: '1px solid #e2e8f0',
    },
    periodLabel: { fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.2, color: '#64748b', fontWeight: 600, margin: 0 },
    periodValue: { fontSize: 18, fontWeight: 700, color: '#1e293b', margin: '2px 0 0' },
    title: {
        textAlign: 'center', padding: '18px 32px 6px', fontSize: 16,
        fontWeight: 700, letterSpacing: 3, color: '#1e293b', margin: 0,
    },
    section: { padding: '16px 32px' },
    sectionBorder: { borderTop: '1px solid #f1f5f9' },
    sectionTitle: {
        fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5,
        color: '#94a3b8', fontWeight: 600, marginBottom: 12, paddingBottom: 6,
        borderBottom: '1px solid #e2e8f0',
    },
    infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 32px' },
    infoRow: { display: 'flex', justifyContent: 'space-between', padding: '5px 0' },
    infoLabel: { color: '#64748b', fontSize: 12 },
    infoValue: { fontWeight: 600, fontSize: 12, color: '#1e293b' },
    statRow: { display: 'flex', gap: 12 },
    statBox: {
        flex: 1, background: '#f8fafc', borderRadius: 8, padding: '16px 12px',
        textAlign: 'center', border: '1px solid #e2e8f0',
    },
    statNum: { fontSize: 22, fontWeight: 700, margin: 0, color: '#1e293b' },
    statLabel: { fontSize: 10, color: '#64748b', marginTop: 4 },
    table: { width: '100%', borderCollapse: 'collapse', margin: '4px 0' },
    th: {
        background: '#f8fafc', padding: '9px 10px', fontSize: 10, textTransform: 'uppercase',
        letterSpacing: 0.8, color: '#475569', fontWeight: 600, textAlign: 'left',
        borderBottom: '2px solid #e2e8f0',
    },
    thRight: { textAlign: 'right' },
    td: { padding: '8px 10px', fontSize: 12, borderBottom: '1px solid #f1f5f9', color: '#334155' },
    tdRight: { textAlign: 'right', color: '#334155' },
    tdBold: { textAlign: 'right', fontWeight: 600, color: '#1e293b' },
    tdIdx: { color: '#94a3b8', width: 28, textAlign: 'center' },
    summaryRow: { display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #f1f5f9' },
    summaryLabel: { color: '#475569', fontSize: 13 },
    summaryValue: { fontWeight: 600, fontSize: 13, color: '#1e293b' },
    summaryBonus: { fontWeight: 600, fontSize: 13, color: '#16a34a' },
    summaryDeduction: { fontWeight: 600, fontSize: 13, color: '#dc2626' },
    netBox: {
        background: '#f8fafc', borderRadius: 10,
        padding: '18px 24px', marginTop: 12, display: 'flex',
        justifyContent: 'space-between', alignItems: 'center',
        border: '2px solid #1e293b',
    },
    netLabel: { fontSize: 14, fontWeight: 700, color: '#1e293b', margin: 0 },
    netAmount: { fontSize: 26, fontWeight: 700, color: '#dc2626', margin: 0 },
    noteBox: {
        background: '#fffbeb', border: '1px solid #fde68a', padding: '10px 14px',
        borderRadius: 8, fontSize: 12, color: '#92400e',
    },
    sigRow: { display: 'flex', justifyContent: 'space-between', gap: 14, marginTop: 8 },
    sigBox: {
        flex: 1, textAlign: 'center', padding: '12px 8px',
        border: '1px dashed #cbd5e1', borderRadius: 8,
    },
    sigTitle: { fontSize: 11, fontWeight: 600, color: '#475569', margin: 0 },
    sigSpace: { height: 52 },
    sigName: { fontSize: 10, color: '#64748b', margin: 0 },
    footer: {
        padding: '14px 32px', background: '#f8fafc', borderTop: '1px solid #e2e8f0',
        display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8',
    },
    badge: (status) => {
        const colors = {
            draft:    { bg: '#f1f5f9', color: '#475569' },
            pending:  { bg: '#fef3c7', color: '#92400e' },
            approved: { bg: '#dcfce7', color: '#166534' },
            paid:     { bg: '#dbeafe', color: '#1e40af' },
        };
        const c = colors[status] || colors.draft;
        return {
            display: 'inline-block', padding: '2px 10px', borderRadius: 20,
            fontSize: 11, fontWeight: 600, background: c.bg, color: c.color,
        };
    },
};

function PayslipContent({ data, useBase64Logo }) {
    const logoUrl = useBase64Logo && logoBase64 ? logoBase64 : logoSrc;
    return (
        <div style={S.payslip}>
            <div style={S.accentBar} />

            {/* Header: logo + brand + period */}
            <div style={S.header}>
                <div style={S.brand}>
                    <img src={logoUrl} alt="Skill Master" style={S.logoImg} />
                    <div>
                        <p style={S.brandH1}>SKILL MASTER</p>
                        <p style={S.brandSub}>Trung tâm Đào tạo & Phát triển Kỹ năng</p>
                    </div>
                </div>
                <div style={S.periodBox}>
                    <p style={S.periodLabel}>Kỳ lương</p>
                    <p style={S.periodValue}>{formatMonthYear(data.period_month, data.period_year)}</p>
                </div>
            </div>

            <h2 style={S.title}>PHIẾU LƯƠNG GIÁO VIÊN</h2>

            {/* Teacher info */}
            <div style={{ ...S.section, ...S.sectionBorder }}>
                <div style={S.sectionTitle}>Thông tin giáo viên</div>
                <div style={S.infoGrid}>
                    <div style={S.infoRow}>
                        <span style={S.infoLabel}>Họ và tên</span>
                        <span style={S.infoValue}>{data.teacher?.full_name}</span>
                    </div>
                    <div style={S.infoRow}>
                        <span style={S.infoLabel}>Trạng thái</span>
                        <span style={S.badge(data.status)}>{getPayrollStatusLabel(data.status)}</span>
                    </div>
                    <div style={S.infoRow}>
                        <span style={S.infoLabel}>Email</span>
                        <span style={{ ...S.infoValue, fontSize: 11 }}>{data.teacher?.email}</span>
                    </div>
                    <div style={S.infoRow}>
                        <span style={S.infoLabel}>Lương/giờ</span>
                        <span style={S.infoValue}>{formatCurrency(data.teacher?.hourly_rate || 150000)}</span>
                    </div>
                </div>
            </div>

            {/* Stat cards */}
            <div style={{ ...S.section, ...S.sectionBorder }}>
                <div style={S.sectionTitle}>Tổng hợp buổi dạy</div>
                <div style={S.statRow}>
                    <div style={S.statBox}>
                        <p style={{ ...S.statNum, color: '#1e40af' }}>{data.total_sessions || 0}</p>
                        <p style={S.statLabel}>Buổi dạy</p>
                    </div>
                    <div style={S.statBox}>
                        <p style={{ ...S.statNum, color: '#0891b2' }}>{formatHours(data.total_hours)}</p>
                        <p style={S.statLabel}>Tổng giờ</p>
                    </div>
                    <div style={S.statBox}>
                        <p style={{ ...S.statNum, color: '#16a34a', fontSize: 18 }}>{formatCurrency(data.base_salary)}</p>
                        <p style={S.statLabel}>Lương cơ bản</p>
                    </div>
                </div>
            </div>

            {/* Sessions detail */}
            {data.sessions && data.sessions.length > 0 && (
                <div style={{ ...S.section, ...S.sectionBorder }}>
                    <div style={S.sectionTitle}>Chi tiết buổi dạy</div>
                    <table style={S.table}>
                        <thead>
                            <tr>
                                <th style={{ ...S.th, width: 28, textAlign: 'center' }}>#</th>
                                <th style={S.th}>Ngày</th>
                                <th style={S.th}>Lớp</th>
                                <th style={{ ...S.th, ...S.thRight }}>Giờ</th>
                                <th style={{ ...S.th, ...S.thRight }}>Đơn giá</th>
                                <th style={{ ...S.th, ...S.thRight }}>Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.sessions.map((session, idx) => {
                                const hours = parseFloat(session.duration_hours) || 0;
                                const rate = parseFloat(session.teacher_rate) || parseFloat(data.teacher?.hourly_rate) || 150000;
                                return (
                                    <tr key={idx} style={idx % 2 === 1 ? { background: '#fafbfc' } : {}}>
                                        <td style={S.tdIdx}>{idx + 1}</td>
                                        <td style={S.td}>{formatDate(session.session_date)}</td>
                                        <td style={S.td}>{session.classes?.name || '—'}</td>
                                        <td style={{ ...S.td, ...S.tdRight }}>{formatHours(hours)}</td>
                                        <td style={{ ...S.td, ...S.tdRight }}>{formatCurrency(rate)}</td>
                                        <td style={{ ...S.td, ...S.tdBold }}>{formatCurrency(hours * rate)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Salary breakdown */}
            <div style={{ ...S.section, ...S.sectionBorder }}>
                <div style={S.sectionTitle}>Chi tiết lương</div>
                <div style={S.summaryRow}>
                    <span style={S.summaryLabel}>Thu nhập giờ dạy ({formatHours(data.total_hours)} giờ)</span>
                    <span style={S.summaryValue}>{formatCurrency(data.base_salary)}</span>
                </div>
                {(data.fixed_salary > 0) && (
                    <div style={S.summaryRow}>
                        <span style={S.summaryLabel}>Lương cố định tháng</span>
                        <span style={S.summaryValue}>{formatCurrency(data.fixed_salary)}</span>
                    </div>
                )}
                <div style={S.summaryRow}>
                    <span style={S.summaryLabel}>Thưởng</span>
                    <span style={S.summaryBonus}>+{formatCurrency(data.bonus || 0)}</span>
                </div>
                <div style={{ ...S.summaryRow, borderBottom: 'none' }}>
                    <span style={S.summaryLabel}>Khấu trừ</span>
                    <span style={S.summaryDeduction}>-{formatCurrency(data.deduction || 0)}</span>
                </div>
                <div style={S.netBox}>
                    <p style={S.netLabel}>THỰC NHẬN</p>
                    <p style={S.netAmount}>{formatCurrency(data.net_salary)}</p>
                </div>
            </div>

            {/* Notes */}
            {data.notes && (
                <div style={{ ...S.section, ...S.sectionBorder }}>
                    <div style={S.noteBox}>📝 {data.notes}</div>
                </div>
            )}

            {/* Signatures */}
            <div style={{ ...S.section, ...S.sectionBorder }}>
                <div style={S.sigRow}>
                    <div style={S.sigBox}>
                        <p style={S.sigTitle}>Người lập</p>
                        <div style={S.sigSpace} />
                        <p style={S.sigName}>(Ký, ghi rõ họ tên)</p>
                    </div>
                    <div style={S.sigBox}>
                        <p style={S.sigTitle}>Người duyệt</p>
                        <div style={S.sigSpace} />
                        <p style={S.sigName}>{data.approver?.full_name || '(Ký, ghi rõ họ tên)'}</p>
                    </div>
                    <div style={S.sigBox}>
                        <p style={S.sigTitle}>Người nhận</p>
                        <div style={S.sigSpace} />
                        <p style={S.sigName}>{data.teacher?.full_name || '(Ký, ghi rõ họ tên)'}</p>
                    </div>
                </div>
            </div>

            <div style={S.footer}>
                <span>Skill Master Center • Phiếu lương giáo viên</span>
                <span>Ngày in: {new Date().toLocaleDateString('vi-VN')}</span>
            </div>
        </div>
    );
}

export function PrintPayslipModal({ isOpen, onClose, payrollData }) {
    const printRef = useRef(null);

    if (!isOpen || !payrollData) return null;

    const handlePrint = () => {
        const el = printRef.current;
        if (!el) return;
        const w = window.open('', '_blank');
        if (!w) { gooeyToast.warning('Vui lòng cho phép popup để in phiếu lương'); return; }

        // In print window, swap logo src to base64 so it renders offline
        let html = el.innerHTML;
        if (logoBase64) {
            html = html.replace(new RegExp(logoSrc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), logoBase64);
        }

        w.document.write(`<!DOCTYPE html><html><head>
            <title>Phiếu lương - ${payrollData.teacher?.full_name} - ${payrollData.period_month}/${payrollData.period_year}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Segoe UI', 'Inter', sans-serif; padding: 16px; color: #1e293b; }
                @media print { body { padding: 0; } }
            </style>
        </head><body>${html}</body></html>`);
        w.document.close();
        w.focus();
        setTimeout(() => { w.print(); w.close(); }, 400);
    };

    // Portal renders at document.body — escapes layout stacking context
    return createPortal(
        <div
            style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
            {/* Backdrop */}
            <div
                style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
                onClick={onClose}
            />

            {/* Modal */}
            <div
                style={{
                    position: 'relative', zIndex: 1, width: '100%', maxWidth: 850,
                    maxHeight: '92vh', overflow: 'auto', borderRadius: 12,
                    background: '#fff', boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
                    margin: '0 16px', border: '1px solid #e2e8f0',
                }}
            >
                {/* Toolbar */}
                <div
                    style={{
                        position: 'sticky', top: 0, background: 'rgba(255,255,255,0.97)',
                        backdropFilter: 'blur(8px)', borderBottom: '1px solid #e2e8f0',
                        padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        zIndex: 10,
                    }}
                >
                    <h2 className="text-base font-semibold flex items-center gap-2.5 text-slate-700">
                        <div className="p-1.5 bg-indigo-100 rounded-lg">
                            <Printer className="h-4 w-4 text-indigo-600" />
                        </div>
                        Xem trước phiếu lương
                    </h2>
                    <div className="flex items-center gap-2">
                        <Button size="sm" onClick={handlePrint} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4">
                            <Printer className="h-3.5 w-3.5" /> In phiếu lương
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Preview — paper simulation */}
                <div style={{ padding: 24, background: '#f1f5f9', minHeight: 400 }}>
                    <div ref={printRef} style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
                        <PayslipContent data={payrollData} />
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default PrintPayslipModal;
