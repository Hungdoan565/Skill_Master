import { toast } from "sonner";
/**
 * PrintVerifiedCertificate - Print certificate with watermark
 * Extracted from PublicCertificateVerification
 */

import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PrintVerifiedCertificate({ certificate }) {
    const handlePrint = () => {
        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (!printWindow) {
            toast('Vui lòng cho phép popup để in');
            return;
        }

        const verifyUrl = `${window.location.origin}/verify-certificate?cert=${certificate.certificate_number}`;
        const certType = certificate.certificate_type || {};

        printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Xác nhận chứng chỉ - ${certificate.certificate_number}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { size: A4 portrait; margin: 20mm; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: white;
            color: #1e293b;
            line-height: 1.6;
        }
        .container {
            max-width: 700px;
            margin: 0 auto;
            padding: 40px;
            position: relative;
        }
        .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-30deg);
            font-size: 100px;
            font-weight: bold;
            color: rgba(34, 197, 94, 0.08);
            white-space: nowrap;
            pointer-events: none;
            z-index: 0;
        }
        .content { position: relative; z-index: 1; }
        .header {
            text-align: center;
            padding-bottom: 24px;
            border-bottom: 3px solid #22c55e;
            margin-bottom: 24px;
        }
        .logo {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #3b82f6, #6366f1);
            border-radius: 16px;
            margin: 0 auto 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 32px;
        }
        .title { font-size: 28px; color: #22c55e; margin-bottom: 8px; }
        .subtitle { color: #64748b; font-size: 14px; }
        .verified-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: #dcfce7;
            color: #166534;
            padding: 12px 24px;
            border-radius: 50px;
            font-weight: 600;
            margin: 24px 0;
        }
        .verified-badge svg { width: 24px; height: 24px; }
        .info-section { margin: 24px 0; }
        .info-title {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #94a3b8;
            margin-bottom: 8px;
        }
        .info-value { font-size: 18px; font-weight: 600; color: #1e293b; }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin: 24px 0;
        }
        .info-box {
            padding: 16px;
            background: #f8fafc;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
        }
        .verify-url {
            font-family: monospace;
            font-size: 12px;
            color: #3b82f6;
            word-break: break-all;
        }
        .timestamp {
            font-size: 11px;
            color: #94a3b8;
            margin-top: 12px;
        }
        .print-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
        }
        @media print {
            .print-btn { display: none; }
            .watermark { position: absolute; }
        }
    </style>
</head>
<body>
    <button class="print-btn" onclick="window.print()">🖨️ In</button>
    <div class="watermark">VERIFIED COPY</div>
    <div class="container">
        <div class="content">
            <div class="header">
                <div class="logo">🎓</div>
                <h1 class="title">XÁC NHẬN CHỨNG CHỈ</h1>
                <p class="subtitle">Certificate Verification Confirmation</p>
            </div>
            
            <div style="text-align: center;">
                <div class="verified-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 12l2 2 4-4"/>
                        <circle cx="12" cy="12" r="10"/>
                    </svg>
                    CHỨNG CHỈ HỢP LỆ
                </div>
            </div>
            
            <div class="info-section">
                <div class="info-title">Mã chứng chỉ</div>
                <div class="info-value" style="font-family: monospace; font-size: 24px; color: #3b82f6;">
                    ${certificate.certificate_number}
                </div>
            </div>
            
            <div class="info-grid">
                <div class="info-box">
                    <div class="info-title">Họ và tên</div>
                    <div class="info-value">${certificate.student_name}</div>
                </div>
                <div class="info-box">
                    <div class="info-title">Loại chứng chỉ</div>
                    <div class="info-value">${certType.name || certificate.course_name || 'N/A'}</div>
                </div>
                <div class="info-box">
                    <div class="info-title">Ngày cấp</div>
                    <div class="info-value">${certificate.issued_at ? new Date(certificate.issued_at).toLocaleDateString('vi-VN') : 'N/A'}</div>
                </div>
                <div class="info-box">
                    <div class="info-title">Xếp loại</div>
                    <div class="info-value">${certificate.grade || 'N/A'}</div>
                </div>
            </div>
            
            ${certificate.scores && Object.keys(certificate.scores).length > 0 ? `
            <div class="info-section" style="background: #fef3c7; padding: 16px; border-radius: 8px;">
                <div class="info-title" style="color: #92400e;">Điểm số chi tiết</div>
                <div style="display: flex; gap: 24px; margin-top: 8px; flex-wrap: wrap;">
                    ${Object.entries(certificate.scores).map(([key, value]) => `
                        <div>
                            <span style="color: #92400e; text-transform: capitalize;">${key}:</span>
                            <strong style="color: #78350f; margin-left: 4px;">${value}</strong>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
            
            <div class="footer">
                <p style="font-size: 13px; color: #64748b; margin-bottom: 8px;">
                    Xác thực trực tuyến tại:
                </p>
                <p class="verify-url">${verifyUrl}</p>
                <p class="timestamp">
                    Được xác thực lúc: ${new Date().toLocaleString('vi-VN')}
                </p>
                <p style="font-size: 11px; color: #94a3b8; margin-top: 16px;">
                    © ${new Date().getFullYear()} Skill Master Training Center
                </p>
            </div>
        </div>
    </div>
</body>
</html>
        `);
        printWindow.document.close();
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-2"
        >
            <Printer className="h-4 w-4" />
            In xác nhận
        </Button>
    );
}

export default PrintVerifiedCertificate;
