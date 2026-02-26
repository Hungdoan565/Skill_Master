import { toast } from "sonner";
/**
 * CertificateListPage - Danh sách tất cả chứng chỉ đã cấp
 * 
 * Features:
 * - Hiển thị danh sách chứng chỉ theo dạng bảng
 * - Lọc theo loại, học viên, ngày cấp
 * - Tìm kiếm theo tên học viên hoặc số hiệu
 * - Xem chi tiết và in chứng chỉ
 * - Hủy chứng chỉ (nếu có quyền)
 */

import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Award,
    Search,
    Filter,
    Download,
    Printer,
    Eye,
    XCircle,
    Calendar,
    User,
    FileText,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Loader2,
    CheckCircle,
    AlertCircle,
    X,
    Copy,
    Check,
    Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { formatDate } from '../utils';
import { CertificateTemplate } from '../components/CertificateTemplates';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Certificate status config
const STATUS_CONFIG = {
    issued: {
        label: 'Đang hiệu lực',
        icon: CheckCircle,
        color: 'bg-green-100 text-green-700',
    },
    active: {
        label: 'Đang hiệu lực',
        icon: CheckCircle,
        color: 'bg-green-100 text-green-700',
    },
    revoked: {
        label: 'Đã hủy',
        icon: XCircle,
        color: 'bg-red-100 text-red-700',
    },
    expired: {
        label: 'Đã hết hạn',
        icon: AlertCircle,
        color: 'bg-gray-100 text-gray-700',
    },
};

export function CertificateListPage() {
    const navigate = useNavigate();
    const { session, isAdmin } = useAuth();
    const printRef = useRef(null);

    // States
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState(''); // Empty = show all
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Modal states - MVP simple approach
    const [selectedCertificate, setSelectedCertificate] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [copied, setCopied] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);

    // Certificate types for filter
    const [certificateTypes, setCertificateTypes] = useState([]);

    // Fetch certificates
    useEffect(() => {
        fetchCertificates();
        fetchCertificateTypes();
    }, []);

    const fetchCertificates = async () => {
        setLoading(true);
        console.log('=== FETCHING CERTIFICATES LIST ===');
        console.log('API URL:', API_URL);
        console.log('Has session:', !!session);
        console.log('Has token:', !!session?.access_token);

        try {
            const url = `${API_URL}/api/admin/certificates?limit=100`;
            console.log('Fetching from:', url);

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`,
                },
            });

            console.log('Response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('Certificates data:', data);
                console.log('Number of certificates:', data.data?.length || data.certificates?.length || 0);

                // API returns { data: [...], pagination: {...} }
                const certs = data.data || data.certificates || [];
                console.log('Certificates array:', certs);

                // Log first certificate to see structure
                if (certs.length > 0) {
                    console.log('First certificate:', certs[0]);
                    console.log('First certificate ID:', certs[0].id);
                }

                setCertificates(certs);
            } else {
                console.error('Failed to fetch certificates:', response.status);
            }
        } catch (error) {
            console.error('Error fetching certificates:', error);
        }
        setLoading(false);
    };

    const fetchCertificateTypes = async () => {
        try {
            const response = await fetch(`${API_URL}/api/admin/certificate-types`, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setCertificateTypes(data.data || data.types || []);
            }
        } catch (error) {
            console.error('Error fetching certificate types:', error);
        }
    };

    // Filter certificates
    const filteredCertificates = useMemo(() => {
        let result = certificates;

        // Search by student name or certificate number
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(cert =>
                cert.student_name?.toLowerCase().includes(term) ||
                cert.certificate_number?.toLowerCase().includes(term)
            );
        }

        // Filter by type
        if (typeFilter) {
            result = result.filter(cert => cert.certificate_type_id === typeFilter);
        }

        // Filter by status
        if (statusFilter) {
            result = result.filter(cert => cert.status === statusFilter);
        }

        // Filter by date range
        if (dateFrom) {
            result = result.filter(cert => new Date(cert.issued_at) >= new Date(dateFrom));
        }
        if (dateTo) {
            result = result.filter(cert => new Date(cert.issued_at) <= new Date(dateTo));
        }

        return result;
    }, [certificates, searchTerm, typeFilter, statusFilter, dateFrom, dateTo]);

    // Pagination
    const totalPages = Math.ceil(filteredCertificates.length / itemsPerPage);
    const paginatedCertificates = filteredCertificates.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Handle print certificate - Open print modal (MVP simple approach)
    const handlePrint = (certificate) => {
        setSelectedCertificate(certificate);
        setShowPrintModal(true);
    };

    // Handle view certificate - Open view modal (MVP simple approach)
    const handleView = (certificate) => {
        setSelectedCertificate(certificate);
        setShowViewModal(true);
    };

    // Generate template-specific HTML for printing
    const generateTemplateHTML = (cert, certType, category) => {
        const formatDate = (dateStr) => {
            if (!dateStr) return 'N/A';
            return new Date(dateStr).toLocaleDateString('vi-VN', {
                day: '2-digit', month: '2-digit', year: 'numeric'
            });
        };

        const formatDateEn = (dateStr) => {
            if (!dateStr) return 'N/A';
            return new Date(dateStr).toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric'
            });
        };

        // Template styles based on category
        const templates = {
            // TEMPLATE 1: Classic Gold (Language - Anh ngữ)
            language: {
                background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fed7aa 100%)',
                borderColor: '#d4af37',
                titleFont: "'Cormorant Garamond', 'Times New Roman', serif",
                primaryColor: '#92400e',
                secondaryColor: '#b45309',
                accentBg: 'linear-gradient(90deg, #fef3c7, #fffbeb, #fef3c7)',
                sealColor: '#d4af37',
                cornerStyle: 'ornate'
            },
            // TEMPLATE 2: Modern Blue (Office - Tin học)
            office: {
                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #e0e7ff 100%)',
                borderColor: '#3b82f6',
                titleFont: "'Inter', 'Segoe UI', sans-serif",
                primaryColor: '#1e40af',
                secondaryColor: '#3b82f6',
                accentBg: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
                sealColor: '#3b82f6',
                cornerStyle: 'modern'
            },
            // TEMPLATE 3: Professional Purple (Programming - Lập trình)
            programming: {
                background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 50%, #ede9fe 100%)',
                borderColor: '#7c3aed',
                titleFont: "'JetBrains Mono', 'Consolas', monospace",
                primaryColor: '#5b21b6',
                secondaryColor: '#7c3aed',
                accentBg: 'linear-gradient(90deg, #7c3aed, #a855f7)',
                sealColor: '#7c3aed',
                cornerStyle: 'tech'
            },
            // TEMPLATE 4: Elegant Warm (Soft Skills - Kỹ năng mềm)
            soft_skill: {
                background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 50%, #fed7aa 100%)',
                borderColor: '#ea580c',
                titleFont: "'Playfair Display', 'Georgia', serif",
                primaryColor: '#c2410c',
                secondaryColor: '#ea580c',
                accentBg: 'linear-gradient(90deg, #fdba74, #fb923c, #fdba74)',
                sealColor: '#ea580c',
                cornerStyle: 'elegant'
            }
        };

        const t = templates[category] || templates.language;

        // Generate corner decorations based on style
        const cornerDecorations = {
            ornate: `
                <div class="corner corner-tl">❧</div>
                <div class="corner corner-tr">❧</div>
                <div class="corner corner-bl">❧</div>
                <div class="corner corner-br">❧</div>
            `,
            modern: `
                <div class="corner-modern corner-tl"></div>
                <div class="corner-modern corner-tr"></div>
                <div class="corner-modern corner-bl"></div>
                <div class="corner-modern corner-br"></div>
            `,
            tech: `
                <div class="corner-tech corner-tl">&lt;/&gt;</div>
                <div class="corner-tech corner-tr">&lt;/&gt;</div>
                <div class="corner-tech corner-bl">&lt;/&gt;</div>
                <div class="corner-tech corner-br">&lt;/&gt;</div>
            `,
            elegant: `
                <div class="corner-elegant corner-tl">✦</div>
                <div class="corner-elegant corner-tr">✦</div>
                <div class="corner-elegant corner-bl">✦</div>
                <div class="corner-elegant corner-br">✦</div>
            `
        };

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Chứng chỉ - ${cert.certificate_number}</title>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Great+Vibes&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Playfair+Display:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { size: A4 landscape; margin: 0; }
        body { 
            font-family: ${t.titleFont};
            background: #f1f5f9;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .certificate {
            width: 297mm;
            height: 210mm;
            background: ${t.background};
            position: relative;
            overflow: hidden;
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
        }
        /* Borders */
        .border-outer {
            position: absolute;
            inset: 16px;
            border: 4px double ${t.borderColor};
            border-radius: 8px;
            opacity: 0.7;
        }
        .border-inner {
            position: absolute;
            inset: 24px;
            border: 2px solid ${t.borderColor};
            border-radius: 4px;
            opacity: 0.5;
        }
        .border-innermost {
            position: absolute;
            inset: 28px;
            border: 1px solid ${t.borderColor};
            border-radius: 2px;
            opacity: 0.3;
        }
        /* Corner decorations */
        .corner {
            position: absolute;
            font-size: 32px;
            color: ${t.borderColor};
            opacity: 0.8;
        }
        .corner-tl { top: 35px; left: 35px; transform: rotate(-45deg); }
        .corner-tr { top: 35px; right: 35px; transform: rotate(45deg); }
        .corner-bl { bottom: 35px; left: 35px; transform: rotate(-135deg); }
        .corner-br { bottom: 35px; right: 35px; transform: rotate(135deg); }
        .corner-modern {
            position: absolute;
            width: 60px;
            height: 60px;
            border: 4px solid ${t.borderColor};
        }
        .corner-modern.corner-tl { top: 30px; left: 30px; border-right: none; border-bottom: none; border-radius: 8px 0 0 0; }
        .corner-modern.corner-tr { top: 30px; right: 30px; border-left: none; border-bottom: none; border-radius: 0 8px 0 0; }
        .corner-modern.corner-bl { bottom: 30px; left: 30px; border-right: none; border-top: none; border-radius: 0 0 0 8px; }
        .corner-modern.corner-br { bottom: 30px; right: 30px; border-left: none; border-top: none; border-radius: 0 0 8px 0; }
        .corner-tech {
            position: absolute;
            font-family: 'JetBrains Mono', monospace;
            font-size: 14px;
            color: ${t.borderColor};
            opacity: 0.6;
            padding: 8px;
            border: 2px solid ${t.borderColor};
            border-radius: 4px;
        }
        .corner-tech.corner-tl { top: 30px; left: 30px; }
        .corner-tech.corner-tr { top: 30px; right: 30px; }
        .corner-tech.corner-bl { bottom: 30px; left: 30px; }
        .corner-tech.corner-br { bottom: 30px; right: 30px; }
        .corner-elegant {
            position: absolute;
            font-size: 24px;
            color: ${t.borderColor};
            opacity: 0.7;
        }
        .corner-elegant.corner-tl { top: 40px; left: 40px; }
        .corner-elegant.corner-tr { top: 40px; right: 40px; }
        .corner-elegant.corner-bl { bottom: 40px; left: 40px; }
        .corner-elegant.corner-br { bottom: 40px; right: 40px; }
        /* Content */
        .content {
            position: relative;
            height: 100%;
            padding: 50px 80px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
        }
        .logo {
            width: 70px;
            height: 70px;
            background: ${t.accentBg};
            border-radius: ${category === 'office' ? '12px' : '50%'};
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.15);
        }
        .logo svg {
            width: 40px;
            height: 40px;
            color: white;
        }
        .center-name {
            font-size: 22px;
            font-weight: 700;
            color: ${t.primaryColor};
            letter-spacing: 0.3em;
            text-transform: uppercase;
            margin-bottom: 4px;
        }
        .center-slogan {
            font-size: 12px;
            color: ${t.secondaryColor};
            letter-spacing: 0.15em;
            margin-bottom: 20px;
        }
        .cert-type {
            font-size: 14px;
            color: #64748b;
            font-style: italic;
            margin-bottom: 8px;
        }
        .title {
            font-size: 42px;
            font-weight: 700;
            color: ${t.primaryColor};
            letter-spacing: 0.15em;
            text-transform: uppercase;
            margin-bottom: 4px;
        }
        .title-sub {
            font-size: 16px;
            color: #64748b;
            margin-bottom: 20px;
        }
        .recipient-intro {
            font-size: 13px;
            color: #64748b;
            margin-bottom: 8px;
        }
        .recipient-name {
            font-family: 'Great Vibes', cursive;
            font-size: 42px;
            color: #1e293b;
            margin-bottom: 8px;
            padding: 8px 40px;
            border-top: 2px solid ${t.borderColor}40;
            border-bottom: 2px solid ${t.borderColor}40;
        }
        .course-intro {
            font-size: 14px;
            color: #64748b;
            margin: 16px 0 8px;
        }
        .course-name {
            font-size: 24px;
            font-weight: 700;
            color: ${t.primaryColor};
            margin-bottom: 4px;
        }
        .provider {
            font-size: 13px;
            color: #64748b;
        }
        .grade-badge {
            display: inline-block;
            margin: 16px 0;
            padding: 10px 32px;
            background: ${t.accentBg};
            border: 2px solid ${t.borderColor}80;
            border-radius: 30px;
            font-size: 16px;
            font-weight: 600;
            color: ${t.primaryColor};
        }
        .details {
            display: flex;
            justify-content: center;
            gap: 50px;
            margin: 16px 0;
            font-size: 13px;
            color: #475569;
        }
        .detail-item {
            text-align: center;
        }
        .detail-label {
            font-size: 11px;
            color: #94a3b8;
            margin-bottom: 2px;
        }
        .detail-value {
            font-weight: 600;
            color: #334155;
            font-family: ${category === 'programming' ? "'JetBrains Mono', monospace" : 'inherit'};
        }
        .signatures {
            display: flex;
            justify-content: space-between;
            width: 100%;
            max-width: 600px;
            margin-top: 24px;
        }
        .signature {
            text-align: center;
            min-width: 180px;
        }
        .sig-line {
            width: 160px;
            height: 48px;
            border-bottom: 2px solid #64748b;
            margin: 0 auto 8px;
        }
        .sig-name {
            font-size: 13px;
            font-weight: 600;
            color: #334155;
        }
        .sig-title {
            font-size: 11px;
            color: #64748b;
        }
        /* Seal */
        .seal {
            position: absolute;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            width: 80px;
            height: 80px;
            border: 3px double ${t.sealColor};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 700;
            color: ${t.sealColor};
            letter-spacing: 0.1em;
            text-transform: uppercase;
            background: white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        /* QR Code placeholder */
        .qr-section {
            position: absolute;
            bottom: 30px;
            right: 40px;
            text-align: center;
        }
        .qr-code {
            width: 60px;
            height: 60px;
            border: 2px solid ${t.borderColor}60;
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            color: #94a3b8;
        }
        .qr-label {
            font-size: 10px;
            color: #94a3b8;
            margin-top: 4px;
        }
        /* Print button */
        .print-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            background: ${t.primaryColor};
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            z-index: 1000;
            font-family: system-ui, sans-serif;
        }
        .print-btn:hover { opacity: 0.9; }
        @media print {
            body { padding: 0; background: white; }
            .print-btn { display: none; }
            .certificate { box-shadow: none; }
        }
    </style>
</head>
<body>
    <button class="print-btn" onclick="window.print()">🖨️ In chứng chỉ</button>
    <div class="certificate">
        <div class="border-outer"></div>
        <div class="border-inner"></div>
        <div class="border-innermost"></div>
        ${cornerDecorations[t.cornerStyle]}
        
        <div class="content">
            <!-- Logo -->
            <div class="logo">
                <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path d="M12 15l-2 5l9 -4l-9 4l-2 -5m4 0a7 7 0 1 0 0 -14a7 7 0 0 0 0 14" />
                </svg>
            </div>
            
            <!-- Header -->
            <div class="center-name">Skill Master</div>
            <div class="center-slogan">${category === 'language' ? 'Language Training & Education Center' :
                category === 'office' ? 'Digital Skills Training Center' :
                    category === 'programming' ? 'Technology & Development Academy' :
                        'Professional Development Institute'
            }</div>
            
            <!-- Title -->
            <div class="cert-type">proudly presents this</div>
            <div class="title">Certificate</div>
            <div class="title-sub">of ${certType?.is_external ? 'Achievement' : 'Completion'}</div>
            
            <!-- Recipient -->
            <div class="recipient-intro">This is to certify that</div>
            <div class="recipient-name">${cert.student_name || 'N/A'}</div>
            
            <!-- Course -->
            <div class="course-intro">has successfully completed the requirements for</div>
            <div class="course-name">${certType?.name || cert.course_name || 'N/A'}</div>
            ${certType?.provider ? `<div class="provider">Certified by: ${certType.provider}</div>` : ''}
            
            <!-- Grade -->
            ${cert.grade ? `<div class="grade-badge">Grade: ${cert.grade.toUpperCase()}</div>` : ''}
            
            <!-- Details -->
            <div class="details">
                <div class="detail-item">
                    <div class="detail-label">Certificate No.</div>
                    <div class="detail-value">${cert.certificate_number}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Completion Date</div>
                    <div class="detail-value">${formatDateEn(cert.completion_date)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Issue Date</div>
                    <div class="detail-value">${formatDateEn(cert.issued_at)}</div>
                </div>
            </div>
            
            <!-- Signatures -->
            <div class="signatures">
                <div class="signature">
                    <div class="sig-line"></div>
                    <div class="sig-name">Center Director</div>
                    <div class="sig-title">Authorized Signature</div>
                </div>
                <div class="signature">
                    <div class="sig-line"></div>
                    <div class="sig-name">Academic Director</div>
                    <div class="sig-title">Authorized Signature</div>
                </div>
            </div>
            
            <!-- Seal -->
            <div class="seal">OFFICIAL</div>
        </div>
        
        <!-- QR Code -->
        <div class="qr-section">
            <div class="qr-code">QR</div>
            <div class="qr-label">Scan to verify</div>
        </div>
    </div>
</body>
</html>`;
    };

    // Print certificate using popup window
    const doPrint = () => {
        if (!selectedCertificate) return;

        const printWindow = window.open('', '_blank', 'width=1200,height=800');
        if (!printWindow) {
            toast('Vui lòng cho phép popup để in chứng chỉ');
            return;
        }

        const cert = selectedCertificate;
        const certType = cert.certificate_type || {};
        const category = certType.category || 'language';

        const html = generateTemplateHTML(cert, certType, category);

        printWindow.document.write(html);
        printWindow.document.close();
    };

    // Copy certificate number
    const copyCode = () => {
        if (selectedCertificate) {
            navigator.clipboard.writeText(selectedCertificate.certificate_number);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Handle revoke certificate
    const handleRevoke = async (certificate) => {
        if (!confirm(`Bạn có chắc muốn hủy chứng chỉ ${certificate.certificate_number}?`)) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/admin/certificates/${certificate.id}/revoke`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                toast('Đã hủy chứng chỉ thành công');
                fetchCertificates();
            } else {
                const error = await response.json();
                toast(error.message || 'Có lỗi xảy ra khi hủy chứng chỉ');
            }
        } catch (error) {
            console.error('Error revoking certificate:', error);
            toast('Có lỗi xảy ra khi hủy chứng chỉ');
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/admin/certificates')}
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Quay lại
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Danh sách chứng chỉ</h1>
                        <p className="text-slate-500 mt-1">
                            Tất cả chứng chỉ đã cấp ({filteredCertificates.length})
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Tìm theo tên hoặc số hiệu..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Certificate Type */}
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Tất cả loại chứng chỉ</option>
                            {certificateTypes.map(type => (
                                <option key={type.id} value={type.id}>
                                    {type.name}
                                </option>
                            ))}
                        </select>

                        {/* Status */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="issued">Đang hiệu lực</option>
                            <option value="revoked">Đã hủy</option>
                            <option value="expired">Đã hết hạn</option>
                        </select>

                        {/* Date Range */}
                        <div className="flex items-center gap-2">
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                placeholder="Từ ngày"
                            />
                            <span className="text-slate-400">-</span>
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                placeholder="Đến ngày"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Certificates Table */}
            {loading ? (
                <Card>
                    <CardContent className="py-12 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </CardContent>
                </Card>
            ) : paginatedCertificates.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Award className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                        <p className="text-slate-500">Không tìm thấy chứng chỉ nào</p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-full whitespace-nowrap md:whitespace-normal">
                                <thead className="bg-slate-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                            STT
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                            Số hiệu
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                            Học viên
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                            Loại chứng chỉ
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                            Xếp loại
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                            Ngày cấp
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                            Trạng thái
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {paginatedCertificates.map((cert, index) => {
                                        const statusConfig = STATUS_CONFIG[cert.status] || STATUS_CONFIG['issued'];
                                        const StatusIcon = statusConfig.icon;

                                        return (
                                            <tr key={cert.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3 text-sm text-slate-600">
                                                    {(currentPage - 1) * itemsPerPage + index + 1}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <Award className="h-4 w-4 text-blue-500" />
                                                        <span className="text-sm font-medium text-slate-900">
                                                            {cert.certificate_number}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-900">
                                                    {cert.student_name}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-600">
                                                    {cert.course_name || '-'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {cert.grade ? (
                                                        <Badge className="bg-green-100 text-green-700">
                                                            {cert.grade}
                                                        </Badge>
                                                    ) : cert.scores && Object.keys(cert.scores).length > 0 ? (
                                                        <div className="text-sm text-slate-700">
                                                            {/* IELTS: Hiển thị Overall hoặc trung bình 4 kỹ năng */}
                                                            {cert.scores.overall ? (
                                                                <span className="font-medium">Overall: {cert.scores.overall}</span>
                                                            ) : cert.scores.listening !== undefined ? (
                                                                <span className="font-medium">
                                                                    L:{cert.scores.listening} R:{cert.scores.reading} W:{cert.scores.writing} S:{cert.scores.speaking}
                                                                </span>
                                                            ) : cert.scores.total !== undefined ? (
                                                                /* TOEIC */
                                                                <span className="font-medium">{cert.scores.total} điểm</span>
                                                            ) : cert.scores.score !== undefined ? (
                                                                /* MOS, etc */
                                                                <span className="font-medium">{cert.scores.score} điểm</span>
                                                            ) : (
                                                                <span className="text-slate-400">Có điểm</span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-slate-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-600">
                                                    {formatDate(cert.issued_at)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge className={statusConfig.color}>
                                                        <StatusIcon className="h-3 w-3 mr-1" />
                                                        {statusConfig.label}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleView(cert)}
                                                            title="Xem chi tiết"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handlePrint(cert)}
                                                            title="In chứng chỉ"
                                                        >
                                                            <Printer className="h-4 w-4" />
                                                        </Button>
                                                        {isAdmin && (cert.status === 'issued' || cert.status === 'active') && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleRevoke(cert)}
                                                                title="Hủy chứng chỉ"
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            >
                                                                <XCircle className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-slate-500">
                        Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredCertificates.length)} / {filteredCertificates.length} chứng chỉ
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <div className="flex items-center gap-2">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }

                                return (
                                    <Button
                                        key={pageNum}
                                        variant={currentPage === pageNum ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setCurrentPage(pageNum)}
                                        className="w-10"
                                    >
                                        {pageNum}
                                    </Button>
                                );
                            })}
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* View Certificate Modal - MVP Simple */}
            {showViewModal && selectedCertificate && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowViewModal(false)}>
                    <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="flex items-center gap-2">
                                <Award className="h-5 w-5 text-blue-600" />
                                Chi tiết chứng chỉ
                            </CardTitle>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowViewModal(false)}
                                className="h-8 w-8 p-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Certificate Number */}
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                <div>
                                    <p className="text-sm text-slate-500">Số hiệu chứng chỉ</p>
                                    <p className="font-mono font-bold text-lg text-slate-900">
                                        {selectedCertificate.certificate_number}
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={copyCode}
                                    className="gap-2"
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
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm text-slate-500">Học viên</p>
                                    <p className="font-medium text-slate-900">{selectedCertificate.student_name}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-slate-500">Khóa học/Loại chứng chỉ</p>
                                    <p className="font-medium text-slate-900">
                                        {selectedCertificate.course_name || selectedCertificate.certificate_type?.name || '-'}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-slate-500">Xếp loại</p>
                                    <p className="font-medium text-slate-900">{selectedCertificate.grade || '-'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-slate-500">Ngày cấp</p>
                                    <p className="font-medium text-slate-900">
                                        {selectedCertificate.issued_at ? formatDate(selectedCertificate.issued_at) : '-'}
                                    </p>
                                </div>
                                {selectedCertificate.completion_date && (
                                    <div className="space-y-1">
                                        <p className="text-sm text-slate-500">Ngày hoàn thành</p>
                                        <p className="font-medium text-slate-900">
                                            {formatDate(selectedCertificate.completion_date)}
                                        </p>
                                    </div>
                                )}
                                {selectedCertificate.expiry_date && (
                                    <div className="space-y-1">
                                        <p className="text-sm text-slate-500">Hiệu lực đến</p>
                                        <p className="font-medium text-slate-900">
                                            {formatDate(selectedCertificate.expiry_date)}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Scores if available */}
                            {selectedCertificate.scores && Object.keys(selectedCertificate.scores).length > 0 && (
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-blue-600 font-medium mb-2">Điểm số chi tiết</p>
                                    <div className="grid grid-cols-3 gap-2 text-sm">
                                        {Object.entries(selectedCertificate.scores).map(([key, value]) => (
                                            <div key={key} className="flex justify-between">
                                                <span className="text-slate-600 capitalize">{key}:</span>
                                                <span className="font-medium">{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Status */}
                            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <span className="text-green-700 font-medium">
                                    {STATUS_CONFIG[selectedCertificate.status]?.label || 'Đang hiệu lực'}
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <Button variant="outline" onClick={() => setShowViewModal(false)}>
                                    Đóng
                                </Button>
                                <Button onClick={() => { setShowViewModal(false); handlePrint(selectedCertificate); }}>
                                    <Printer className="h-4 w-4 mr-2" />
                                    In chứng chỉ
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Print Certificate Modal - MVP Simple */}
            {showPrintModal && selectedCertificate && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowPrintModal(false)}>
                    <Card className="max-w-md w-full bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="flex items-center gap-2">
                                <Printer className="h-5 w-5 text-blue-600" />
                                In chứng chỉ
                            </CardTitle>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowPrintModal(false)}
                                className="h-8 w-8 p-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-slate-600">
                                Bạn muốn in chứng chỉ <strong>{selectedCertificate.certificate_number}</strong>
                                của học viên <strong>{selectedCertificate.student_name}</strong>?
                            </p>

                            <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600">
                                <p className="font-medium text-slate-900 mb-2">Thông tin in:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Kích thước: A4 ngang (Landscape)</li>
                                    <li>Nên dùng giấy dày để in đẹp hơn</li>
                                    <li>Có thể in màu hoặc đen trắng</li>
                                </ul>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <Button variant="outline" onClick={() => setShowPrintModal(false)}>
                                    Hủy
                                </Button>
                                <Button onClick={doPrint} className="gap-2">
                                    <Printer className="h-4 w-4" />
                                    Mở cửa sổ in
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

export default CertificateListPage;
