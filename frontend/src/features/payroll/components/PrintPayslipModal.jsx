import { gooeyToast } from 'goey-toast';
/**
 * PrintPayslipModal Component
 * Modal để in phiếu lương PDF
 */

import { useRef } from 'react';
import { X, Printer, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, formatMonthYear, formatHours, getPayrollStatusLabel } from '../utils';

export function PrintPayslipModal({
    isOpen,
    onClose,
    payrollData,
}) {
    const printRef = useRef(null);

    if (!isOpen || !payrollData) return null;

    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            gooeyToast.warning('Vui lòng cho phép popup để in phiếu lương');
            return;
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Phiếu lương - ${payrollData.teacher?.full_name} - Tháng ${payrollData.period_month}/${payrollData.period_year}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { 
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                        padding: 20px;
                        color: #333;
                    }
                    .payslip { 
                        max-width: 800px; 
                        margin: 0 auto; 
                        border: 2px solid #333;
                        padding: 20px;
                    }
                    .header { 
                        text-align: center; 
                        border-bottom: 2px solid #333; 
                        padding-bottom: 15px; 
                        margin-bottom: 20px;
                    }
                    .header h1 { font-size: 24px; color: #1e40af; margin-bottom: 5px; }
                    .header h2 { font-size: 18px; font-weight: normal; }
                    .info-row { 
                        display: flex; 
                        justify-content: space-between; 
                        margin-bottom: 10px;
                        padding: 5px 0;
                    }
                    .info-row.bordered { border-bottom: 1px dashed #ccc; }
                    .section { margin: 20px 0; }
                    .section-title { 
                        font-weight: bold; 
                        font-size: 14px;
                        background: #f0f0f0;
                        padding: 8px;
                        margin-bottom: 10px;
                    }
                    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                    th, td { 
                        border: 1px solid #ddd; 
                        padding: 8px; 
                        text-align: left; 
                        font-size: 12px;
                    }
                    th { background: #f5f5f5; font-weight: 600; }
                    .text-right { text-align: right; }
                    .total-row { 
                        font-weight: bold; 
                        font-size: 16px;
                        background: #e0f2fe;
                    }
                    .footer { 
                        margin-top: 30px; 
                        display: flex; 
                        justify-content: space-between;
                    }
                    .signature { text-align: center; width: 200px; }
                    .signature-line { 
                        border-top: 1px solid #333; 
                        margin-top: 60px; 
                        padding-top: 5px;
                    }
                    .amount-positive { color: #16a34a; }
                    .amount-negative { color: #dc2626; }
                    @media print {
                        body { padding: 0; }
                        .payslip { border: none; }
                    }
                </style>
            </head>
            <body>
                ${printContent.innerHTML}
            </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.focus();

        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-auto rounded-lg bg-white shadow-xl mx-4">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Printer className="h-5 w-5 text-indigo-600" />
                        In phiếu lương
                    </h2>
                    <div className="flex items-center gap-2">
                        <Button onClick={handlePrint} className="gap-2">
                            <Printer className="h-4 w-4" />
                            In
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* Print Preview */}
                <div className="p-6 bg-slate-100">
                    <div ref={printRef} className="bg-white p-8 shadow-lg">
                        <div className="payslip">
                            {/* Header */}
                            <div className="header">
                                <h1>SKILL MASTER CENTER</h1>
                                <h2>PHIẾU LƯƠNG GIÁO VIÊN</h2>
                                <p style={{ marginTop: '10px', fontSize: '14px' }}>
                                    {formatMonthYear(payrollData.period_month, payrollData.period_year)}
                                </p>
                            </div>

                            {/* Teacher Info */}
                            <div className="section">
                                <div className="section-title">THÔNG TIN GIÁO VIÊN</div>
                                <div className="info-row bordered">
                                    <span>Họ và tên:</span>
                                    <strong>{payrollData.teacher?.full_name}</strong>
                                </div>
                                <div className="info-row bordered">
                                    <span>Email:</span>
                                    <span>{payrollData.teacher?.email}</span>
                                </div>
                                <div className="info-row bordered">
                                    <span>Mức lương/giờ:</span>
                                    <span>{formatCurrency(payrollData.teacher?.hourly_rate || 150000)}</span>
                                </div>
                                <div className="info-row">
                                    <span>Trạng thái:</span>
                                    <span>{getPayrollStatusLabel(payrollData.status)}</span>
                                </div>
                            </div>

                            {/* Sessions Summary */}
                            <div className="section">
                                <div className="section-title">TỔNG HỢP BUỔI DẠY</div>
                                <div className="info-row bordered">
                                    <span>Số buổi dạy:</span>
                                    <span>{payrollData.total_sessions} buổi</span>
                                </div>
                                <div className="info-row">
                                    <span>Tổng số giờ:</span>
                                    <span>{formatHours(payrollData.total_hours)}</span>
                                </div>
                            </div>

                            {/* Sessions Detail */}
                            {payrollData.sessions && payrollData.sessions.length > 0 && (
                                <div className="section">
                                    <div className="section-title">CHI TIẾT BUỔI DẠY</div>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Ngày</th>
                                                <th>Lớp</th>
                                                <th className="text-right">Số giờ</th>
                                                <th className="text-right">Rate</th>
                                                <th className="text-right">Thành tiền</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {payrollData.sessions.map((session, idx) => {
                                                const hours = parseFloat(session.duration_hours) || 0;
                                                const rate = parseFloat(session.teacher_rate) || parseFloat(payrollData.teacher?.hourly_rate) || 150000;
                                                return (
                                                    <tr key={idx}>
                                                        <td>{formatDate(session.session_date)}</td>
                                                        <td>{session.classes?.name || 'N/A'}</td>
                                                        <td className="text-right">{formatHours(hours)}</td>
                                                        <td className="text-right">{formatCurrency(rate)}</td>
                                                        <td className="text-right">{formatCurrency(hours * rate)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Salary Breakdown */}
                            <div className="section">
                                <div className="section-title">CHI TIẾT LƯƠNG</div>
                                <table>
                                    <tbody>
                                        <tr>
                                            <td>Thu nhập giờ dạy ({formatHours(payrollData.total_hours)} giờ)</td>
                                            <td className="text-right">{formatCurrency(payrollData.base_salary)}</td>
                                        </tr>
                                        {(payrollData.fixed_salary > 0) && (
                                            <tr>
                                                <td>Lương cố định tháng</td>
                                                <td className="text-right">{formatCurrency(payrollData.fixed_salary)}</td>
                                            </tr>
                                        )}
                                        <tr>
                                            <td>Thưởng</td>
                                            <td className="text-right amount-positive">+{formatCurrency(payrollData.bonus || 0)}</td>
                                        </tr>
                                        <tr>
                                            <td>Khấu trừ</td>
                                            <td className="text-right amount-negative">-{formatCurrency(payrollData.deduction || 0)}</td>
                                        </tr>
                                        <tr className="total-row">
                                            <td><strong>THỰC NHẬN</strong></td>
                                            <td className="text-right"><strong>{formatCurrency(payrollData.net_salary)}</strong></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Notes */}
                            {payrollData.notes && (
                                <div className="section">
                                    <div className="section-title">GHI CHÚ</div>
                                    <p style={{ padding: '10px', background: '#fffbeb', border: '1px solid #fbbf24' }}>
                                        {payrollData.notes}
                                    </p>
                                </div>
                            )}

                            {/* Signatures */}
                            <div className="footer">
                                <div className="signature">
                                    <p>Người lập</p>
                                    <div className="signature-line">
                                        <p>(Ký, ghi rõ họ tên)</p>
                                    </div>
                                </div>
                                <div className="signature">
                                    <p>Người duyệt</p>
                                    <div className="signature-line">
                                        <p>{payrollData.approver?.full_name || '(Ký, ghi rõ họ tên)'}</p>
                                    </div>
                                </div>
                                <div className="signature">
                                    <p>Người nhận</p>
                                    <div className="signature-line">
                                        <p>(Ký, ghi rõ họ tên)</p>
                                    </div>
                                </div>
                            </div>

                            {/* Print Date */}
                            <div style={{ marginTop: '20px', textAlign: 'right', fontSize: '12px', color: '#666' }}>
                                Ngày in: {new Date().toLocaleDateString('vi-VN')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PrintPayslipModal;
