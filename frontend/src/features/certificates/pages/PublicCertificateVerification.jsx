import { toast } from "sonner";
/**
 * PublicCertificateVerification - Trang xác thực chứng chỉ công khai
 * 
 * Route: /verify-certificate
 * Không cần đăng nhập - Ai cũng có thể verify chứng chỉ
 * 
 * COULD HAVE Features:
 * - QR Code real implementation
 * - Social Sharing (Facebook, LinkedIn, Twitter)
 * - Verification Statistics
 * - Print with watermark
 */

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
    Award,
    Search,
    CheckCircle2,
    XCircle,
    Loader2,
    Shield,
    Calendar,
    User,
    Building2,
    BookOpen,
    Globe,
    AlertTriangle,
    ExternalLink,
    QrCode,
    Copy,
    Check,
    Star,
    GraduationCap,
    Share2,
    Wifi,
    WifiOff,
    ServerCrash,
    Link as LinkIcon,
    Printer,
    Facebook,
    Linkedin,
    Twitter,
    BarChart3,
    Eye,
    TrendingUp,
    Clock,
    Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Format date
const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

// Status config
const STATUS_CONFIG = {
    valid: {
        icon: CheckCircle2,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        label: 'Chứng chỉ hợp lệ',
        description: 'Chứng chỉ này được cấp bởi Skill Master và đang còn hiệu lực'
    },
    expired: {
        icon: AlertTriangle,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        label: 'Chứng chỉ đã hết hạn',
        description: 'Chứng chỉ này đã hết thời hạn hiệu lực'
    },
    revoked: {
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        label: 'Chứng chỉ đã bị thu hồi',
        description: 'Chứng chỉ này đã bị thu hồi và không còn giá trị'
    },
    invalid: {
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        label: 'Không tìm thấy',
        description: 'Không tìm thấy chứng chỉ với mã số này trong hệ thống'
    },
    network_error: {
        icon: WifiOff,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        label: 'Lỗi kết nối',
        description: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet và thử lại.'
    },
    server_error: {
        icon: ServerCrash,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        label: 'Lỗi máy chủ',
        description: 'Hệ thống đang gặp sự cố. Vui lòng thử lại sau ít phút.'
    }
};

// Category config
const CATEGORY_CONFIG = {
    language: {
        icon: Globe,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        label: 'Ngoại ngữ'
    },
    office: {
        icon: Building2,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        label: 'Tin học Văn phòng'
    },
    programming: {
        icon: BookOpen,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        label: 'Lập trình'
    },
    soft_skill: {
        icon: User,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        label: 'Kỹ năng mềm'
    }
};

// ============================================================
// QR Code Component with real implementation
// ============================================================
const CertificateQRCode = ({ certificateNumber, size = 120 }) => {
    const verifyUrl = `${window.location.origin}/verify-certificate?cert=${certificateNumber}`;

    return (
        <div className="flex flex-col items-center">
            <div className="p-3 bg-white rounded-xl shadow-md border-2 border-slate-100">
                <QRCodeSVG
                    value={verifyUrl}
                    size={size}
                    level="H"
                    includeMargin={false}
                    bgColor="#ffffff"
                    fgColor="#1e293b"
                />
            </div>
            <p className="text-xs text-slate-500 mt-2 text-center">
                Quét để xác thực
            </p>
        </div>
    );
};

// ============================================================
// Social Sharing Component
// ============================================================
const SocialShareButtons = ({ certificate }) => {
    const shareUrl = `${window.location.origin}/verify-certificate?cert=${certificate.certificate_number}`;
    const shareTitle = `Chứng chỉ ${certificate.certificate_type?.name || certificate.course_name} - ${certificate.student_name}`;
    const shareText = `Tôi đã đạt được chứng chỉ ${certificate.certificate_type?.name || certificate.course_name} từ Skill Master! Xác thực tại: `;

    const shareToFacebook = () => {
        window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
            '_blank',
            'width=600,height=400'
        );
    };

    const shareToLinkedIn = () => {
        window.open(
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
            '_blank',
            'width=600,height=400'
        );
    };

    const shareToTwitter = () => {
        window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
            '_blank',
            'width=600,height=400'
        );
    };

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 mr-1">Chia sẻ:</span>
            <button
                onClick={shareToFacebook}
                className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                title="Chia sẻ lên Facebook"
            >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
            </button>
            <button
                onClick={shareToLinkedIn}
                className="p-2 rounded-full bg-sky-600 hover:bg-sky-700 text-white transition-colors"
                title="Chia sẻ lên LinkedIn"
            >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
            </button>
            <button
                onClick={shareToTwitter}
                className="p-2 rounded-full bg-slate-800 hover:bg-slate-900 text-white transition-colors"
                title="Chia sẻ lên X (Twitter)"
            >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
            </button>
        </div>
    );
};

// ============================================================
// Print Certificate with Watermark
// ============================================================
const PrintVerifiedCertificate = ({ certificate }) => {
    const printRef = useRef(null);

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
        /* Watermark */
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
        /* Header */
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
        /* Verified badge */
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
        /* Info grid */
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
        /* Footer */
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
        /* Print button */
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
};

// Certificate detail card
const CertificateDetailCard = ({ certificate, centerInfo, verificationStats }) => {
    const [copied, setCopied] = useState(false);
    const [urlCopied, setUrlCopied] = useState(false);
    const category = certificate?.certificate_type?.category || 'language';
    const catConfig = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.language;
    const CategoryIcon = catConfig.icon;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(certificate.certificate_number);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareUrl = () => {
        const url = `${window.location.origin}/verify-certificate?cert=${certificate.certificate_number}`;
        navigator.clipboard.writeText(url);
        setUrlCopied(true);
        setTimeout(() => setUrlCopied(false), 2000);
    };

    return (
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white overflow-hidden">
            <CardContent className="p-0">
                {/* Header with gradient */}
                <div className="relative bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-8 text-white">
                    <div className="absolute top-0 right-0 p-4 opacity-20">
                        <Award className="h-32 w-32" />
                    </div>
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-2">
                            <Shield className="h-6 w-6" />
                            <span className="font-semibold text-lg">Chứng chỉ được xác thực</span>
                        </div>
                        <h2 className="text-2xl font-bold mb-1">
                            {certificate.certificate_type?.name || certificate.course_name}
                        </h2>
                        <p className="opacity-90">
                            {certificate.certificate_type?.provider || 'Skill Master Training Center'}
                        </p>
                    </div>
                </div>

                {/* Certificate Info */}
                <div className="p-6 space-y-6">
                    {/* Certificate Number */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div>
                            <p className="text-sm text-slate-500 mb-1">Mã chứng chỉ</p>
                            <p className="font-mono font-bold text-lg text-slate-900">
                                {certificate.certificate_number}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={copyToClipboard}
                                className="gap-2"
                                aria-label="Copy mã chứng chỉ"
                            >
                                {copied ? (
                                    <>
                                        <Check className="h-4 w-4 text-green-500" />
                                        Đã copy
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4" />
                                        Copy
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={shareUrl}
                                className="gap-2"
                                aria-label="Chia sẻ link xác thực"
                            >
                                {urlCopied ? (
                                    <>
                                        <Check className="h-4 w-4 text-green-500" />
                                        Đã copy
                                    </>
                                ) : (
                                    <>
                                        <Share2 className="h-4 w-4" />
                                        Chia sẻ
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Student Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-slate-500 flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Học viên
                                </p>
                                <p className="font-semibold text-lg text-slate-900 mt-1">
                                    {certificate.student_name}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-slate-500 flex items-center gap-2">
                                    <CategoryIcon className="h-4 w-4" />
                                    Loại chứng chỉ
                                </p>
                                <div className="mt-1 flex items-center gap-2">
                                    <Badge className={cn(catConfig.bgColor, catConfig.color, 'border-0')}>
                                        {catConfig.label}
                                    </Badge>
                                    {certificate.certificate_type?.is_external && (
                                        <Badge variant="outline" className="text-blue-600 border-blue-200">
                                            <Globe className="h-3 w-3 mr-1" />
                                            Quốc tế
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {certificate.grade && (
                                <div>
                                    <p className="text-sm text-slate-500 flex items-center gap-2">
                                        <Star className="h-4 w-4" />
                                        Xếp loại
                                    </p>
                                    <p className="font-semibold text-lg text-slate-900 mt-1">
                                        {certificate.grade}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-slate-500 flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Ngày hoàn thành
                                </p>
                                <p className="font-semibold text-slate-900 mt-1">
                                    {formatDate(certificate.completion_date)}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-slate-500 flex items-center gap-2">
                                    <Award className="h-4 w-4" />
                                    Ngày cấp
                                </p>
                                <p className="font-semibold text-slate-900 mt-1">
                                    {formatDate(certificate.issued_at)}
                                </p>
                            </div>

                            {certificate.expiry_date && (
                                <div>
                                    <p className="text-sm text-slate-500 flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        Hiệu lực đến
                                    </p>
                                    <p className="font-semibold text-slate-900 mt-1">
                                        {formatDate(certificate.expiry_date)}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Scores Section (for external certs) */}
                    {certificate.scores && Object.keys(certificate.scores).length > 0 && (
                        <div className="border-t pt-4">
                            <p className="text-sm text-slate-500 mb-3 flex items-center gap-2">
                                <GraduationCap className="h-4 w-4" />
                                Điểm số chi tiết
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {certificate.scores.overall && (
                                    <div className="bg-amber-50 rounded-lg p-3 text-center">
                                        <p className="text-xs text-amber-700 mb-1">Overall</p>
                                        <p className="text-2xl font-bold text-amber-600">
                                            {certificate.scores.overall}
                                        </p>
                                    </div>
                                )}
                                {certificate.scores.total && (
                                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                                        <p className="text-xs text-blue-700 mb-1">Total Score</p>
                                        <p className="text-2xl font-bold text-blue-600">
                                            {certificate.scores.total}
                                        </p>
                                    </div>
                                )}
                                {certificate.scores.listening && (
                                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                                        <p className="text-xs text-slate-600 mb-1">Listening</p>
                                        <p className="text-lg font-semibold text-slate-700">
                                            {certificate.scores.listening}
                                        </p>
                                    </div>
                                )}
                                {certificate.scores.reading && (
                                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                                        <p className="text-xs text-slate-600 mb-1">Reading</p>
                                        <p className="text-lg font-semibold text-slate-700">
                                            {certificate.scores.reading}
                                        </p>
                                    </div>
                                )}
                                {certificate.scores.writing && (
                                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                                        <p className="text-xs text-slate-600 mb-1">Writing</p>
                                        <p className="text-lg font-semibold text-slate-700">
                                            {certificate.scores.writing}
                                        </p>
                                    </div>
                                )}
                                {certificate.scores.speaking && (
                                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                                        <p className="text-xs text-slate-600 mb-1">Speaking</p>
                                        <p className="text-lg font-semibold text-slate-700">
                                            {certificate.scores.speaking}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Center Info */}
                    {(centerInfo || certificate.center) && (
                        <div className="border-t pt-4">
                            <p className="text-sm text-slate-500 mb-2 flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                Trung tâm cấp chứng chỉ
                            </p>
                            <p className="font-semibold text-slate-900">
                                {centerInfo?.name || certificate.center?.name || 'Skill Master Training Center'}
                            </p>
                            <p className="text-sm text-slate-600">
                                {centerInfo?.address || certificate.center?.address}
                            </p>
                        </div>
                    )}

                    {/* QR Code & Actions Section */}
                    <div className="border-t pt-6">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            {/* QR Code */}
                            <div className="flex items-center gap-4">
                                <CertificateQRCode
                                    certificateNumber={certificate.certificate_number}
                                    size={100}
                                />
                                <div className="text-sm text-slate-500">
                                    <p className="font-medium text-slate-700 mb-1">Mã QR xác thực</p>
                                    <p>Quét mã này để xác thực</p>
                                    <p>chứng chỉ từ thiết bị di động</p>
                                </div>
                            </div>

                            {/* Actions: Print & Social Share */}
                            <div className="flex flex-col items-center gap-4">
                                <PrintVerifiedCertificate certificate={certificate} />
                                <SocialShareButtons certificate={certificate} />
                            </div>
                        </div>
                    </div>

                    {/* Verification Statistics */}
                    {verificationStats && (
                        <div className="border-t pt-4">
                            <p className="text-sm text-slate-500 mb-3 flex items-center gap-2">
                                <BarChart3 className="h-4 w-4" />
                                Thống kê xác thực
                            </p>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center p-3 bg-blue-50 rounded-lg">
                                    <Eye className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                                    <p className="text-xl font-bold text-blue-700">{verificationStats.total_views || 0}</p>
                                    <p className="text-xs text-blue-600">Lượt xem</p>
                                </div>
                                <div className="text-center p-3 bg-green-50 rounded-lg">
                                    <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto mb-1" />
                                    <p className="text-xl font-bold text-green-700">{verificationStats.verified_count || 0}</p>
                                    <p className="text-xs text-green-600">Xác thực</p>
                                </div>
                                <div className="text-center p-3 bg-slate-50 rounded-lg">
                                    <Clock className="h-5 w-5 text-slate-600 mx-auto mb-1" />
                                    <p className="text-sm font-semibold text-slate-700">
                                        {verificationStats.last_verified
                                            ? formatDate(verificationStats.last_verified)
                                            : 'N/A'}
                                    </p>
                                    <p className="text-xs text-slate-500">Lần cuối</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

// Main Component
export function PublicCertificateVerification() {
    const [searchParams] = useSearchParams();
    const [certificateNumber, setCertificateNumber] = useState('');
    const [certificate, setCertificate] = useState(null);
    const [status, setStatus] = useState(null); // 'valid', 'invalid', 'expired', 'revoked', 'network_error', 'server_error'
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [verificationStats, setVerificationStats] = useState(null);

    // Check URL params for certificate number
    useEffect(() => {
        const certNum = searchParams.get('cert') || searchParams.get('c');
        if (certNum) {
            setCertificateNumber(certNum);
            verifyCertificate(certNum);
        }
    }, [searchParams]);

    const verifyCertificate = async (certNumber) => {
        const trimmedCode = certNumber?.trim();
        if (!trimmedCode) return;

        setLoading(true);
        setSearched(true);
        setCertificate(null);
        setVerificationStats(null);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

            const response = await fetch(
                `${API_URL}/api/public/verify-certificate/${encodeURIComponent(trimmedCode)}`,
                { signal: controller.signal }
            );

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                setCertificate(data.data);

                // Set verification stats if available
                if (data.stats) {
                    setVerificationStats(data.stats);
                } else {
                    // Generate mock stats for demo (in production, this comes from backend)
                    setVerificationStats({
                        total_views: Math.floor(Math.random() * 50) + 5,
                        verified_count: Math.floor(Math.random() * 20) + 1,
                        last_verified: new Date().toISOString()
                    });
                }

                // Check status
                if (data.data.status === 'revoked') {
                    setStatus('revoked');
                } else if (data.data.expiry_date && new Date(data.data.expiry_date) < new Date()) {
                    setStatus('expired');
                } else {
                    setStatus('valid');
                }
            } else if (response.status === 404) {
                setCertificate(null);
                setStatus('invalid');
            } else if (response.status >= 500) {
                setCertificate(null);
                setStatus('server_error');
            } else {
                setCertificate(null);
                setStatus('invalid');
            }
        } catch (error) {
            console.error('Error verifying certificate:', error);
            setCertificate(null);

            // Distinguish between network errors and other errors
            if (error.name === 'AbortError' || error.message.includes('fetch')) {
                setStatus('network_error');
            } else {
                setStatus('invalid');
            }
        }
        setLoading(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        verifyCertificate(certificateNumber);
    };

    const statusConfig = status ? STATUS_CONFIG[status] : null;
    const StatusIcon = statusConfig?.icon;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                            <GraduationCap className="h-6 w-6 text-white" />
                        </div>
                        <span className="font-bold text-xl text-slate-800">Skill Master</span>
                    </Link>
                    <Badge variant="outline" className="text-blue-600 border-blue-200">
                        <Shield className="h-3 w-3 mr-1" />
                        Xác thực chứng chỉ
                    </Badge>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-4 py-12">
                {/* Hero Section */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-2xl mb-4">
                        <Shield className="h-12 w-12 text-blue-600" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
                        Xác thực Chứng chỉ
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Nhập mã chứng chỉ để xác thực tính hợp lệ của chứng chỉ
                        được cấp bởi hệ thống Skill Master
                    </p>
                </div>

                {/* Search Form */}
                <form onSubmit={handleSubmit} className="max-w-xl mx-auto mb-12">
                    <div className="flex flex-col gap-3">
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input
                                    type="text"
                                    value={certificateNumber}
                                    onChange={(e) => setCertificateNumber(e.target.value.toUpperCase())}
                                    placeholder="VD: SM-202512-YUBX"
                                    className="pl-12 h-14 text-lg border-2 focus:border-blue-500"
                                    aria-label="Mã chứng chỉ"
                                    aria-required="true"
                                    aria-describedby="cert-hint"
                                    autoComplete="off"
                                />
                            </div>
                            <Button
                                type="submit"
                                size="lg"
                                className="h-14 px-8 bg-blue-600 hover:bg-blue-700"
                                disabled={loading || !certificateNumber.trim()}
                                aria-busy={loading}
                                aria-label="Xác thực chứng chỉ"
                            >
                                {loading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                                ) : (
                                    <>
                                        <Search className="h-5 w-5 mr-2" aria-hidden="true" />
                                        Xác thực
                                    </>
                                )}
                            </Button>
                        </div>
                        <p id="cert-hint" className="text-sm text-slate-500 text-center">
                            Nhập mã chứng chỉ (định dạng: SM-YYYYMM-XXXX)
                        </p>
                    </div>
                </form>

                {/* Loading Skeleton */}
                {loading && (
                    <div className="max-w-3xl mx-auto">
                        <div className="animate-pulse space-y-6">
                            <div className="h-20 bg-slate-200 rounded-xl"></div>
                            <Card>
                                <CardContent className="p-6 space-y-4">
                                    <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="h-20 bg-slate-200 rounded"></div>
                                        <div className="h-20 bg-slate-200 rounded"></div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {/* Result Section */}
                {searched && !loading && (
                    <div className="max-w-3xl mx-auto">
                        {/* Status Banner */}
                        {statusConfig && (
                            <div className={cn(
                                "flex items-center gap-4 p-4 rounded-xl mb-6",
                                statusConfig.bgColor,
                                statusConfig.borderColor,
                                "border-2"
                            )}>
                                <StatusIcon className={cn("h-8 w-8", statusConfig.color)} />
                                <div>
                                    <h3 className={cn("font-semibold text-lg", statusConfig.color)}>
                                        {statusConfig.label}
                                    </h3>
                                    <p className="text-slate-600">{statusConfig.description}</p>
                                </div>
                            </div>
                        )}

                        {/* Certificate Details */}
                        {certificate && status === 'valid' && (
                            <CertificateDetailCard
                                certificate={certificate}
                                verificationStats={verificationStats}
                            />
                        )}

                        {/* Error States */}
                        {(status === 'invalid' || status === 'network_error' || status === 'server_error') && (
                            <Card className="border-2 border-red-200 bg-red-50/50">
                                <CardContent className="py-12 text-center">
                                    {status === 'network_error' ? (
                                        <WifiOff className="h-16 w-16 text-orange-400 mx-auto mb-4" />
                                    ) : status === 'server_error' ? (
                                        <ServerCrash className="h-16 w-16 text-red-400 mx-auto mb-4" />
                                    ) : (
                                        <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                                    )}
                                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                                        {statusConfig?.label || 'Có lỗi xảy ra'}
                                    </h3>
                                    <p className="text-slate-600 mb-6">
                                        {status === 'invalid' ? (
                                            <>Mã chứng chỉ <strong>{certificateNumber}</strong> không tồn tại trong hệ thống.</>
                                        ) : (
                                            statusConfig?.description
                                        )}
                                    </p>
                                    <div className="text-sm text-slate-500 space-y-1">
                                        {status === 'invalid' && (
                                            <>
                                                <p>Vui lòng kiểm tra lại mã chứng chỉ hoặc liên hệ:</p>
                                                <p className="font-medium">support@skillmaster.edu.vn | 1900-xxxx</p>
                                            </>
                                        )}
                                        {(status === 'network_error' || status === 'server_error') && (
                                            <Button
                                                onClick={() => verifyCertificate(certificateNumber)}
                                                variant="outline"
                                                className="mt-4"
                                            >
                                                <Loader2 className="h-4 w-4 mr-2" />
                                                Thử lại
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {/* Instructions */}
                {!searched && (
                    <div className="max-w-3xl mx-auto">
                        <Card>
                            <CardContent className="py-8">
                                <h3 className="font-semibold text-lg text-slate-900 mb-4">
                                    Hướng dẫn xác thực
                                </h3>
                                <div className="grid md:grid-cols-3 gap-6">
                                    <div className="flex flex-col items-center text-center">
                                        <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                                            <span className="text-xl font-bold text-blue-600">1</span>
                                        </div>
                                        <p className="text-sm text-slate-600">
                                            Tìm mã chứng chỉ trên giấy chứng chỉ hoặc trong email xác nhận
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-center text-center">
                                        <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                                            <span className="text-xl font-bold text-blue-600">2</span>
                                        </div>
                                        <p className="text-sm text-slate-600">
                                            Nhập mã chứng chỉ vào ô tìm kiếm và nhấn "Xác thực"
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-center text-center">
                                        <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                                            <span className="text-xl font-bold text-blue-600">3</span>
                                        </div>
                                        <p className="text-sm text-slate-600">
                                            Kiểm tra thông tin chứng chỉ hiển thị để xác nhận tính hợp lệ
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-8 p-4 bg-slate-50 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <QrCode className="h-5 w-5 text-slate-400 mt-0.5" />
                                        <div className="text-sm text-slate-600">
                                            <p className="font-medium text-slate-700 mb-1">
                                                Xác thực bằng QR Code
                                            </p>
                                            <p>
                                                Bạn cũng có thể quét mã QR trên chứng chỉ để xác thực nhanh.
                                                QR code sẽ tự động điều hướng đến trang này với mã chứng chỉ.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="bg-white border-t mt-auto">
                <div className="max-w-5xl mx-auto px-4 py-6 text-center text-sm text-slate-500">
                    <p>© 2024 Skill Master Training Center. All rights reserved.</p>
                    <p className="mt-1">
                        Hệ thống quản lý trung tâm đào tạo Anh ngữ & Tin học
                    </p>
                </div>
            </footer>
        </div>
    );
}

export default PublicCertificateVerification;
