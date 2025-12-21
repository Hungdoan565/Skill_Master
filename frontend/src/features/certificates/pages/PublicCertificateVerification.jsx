/**
 * PublicCertificateVerification - Trang xác thực chứng chỉ công khai
 * 
 * Route: /public/verify-certificate
 * Không cần đăng nhập - Ai cũng có thể verify chứng chỉ
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
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

// Certificate detail card
const CertificateDetailCard = ({ certificate, centerInfo }) => {
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
        const url = `${window.location.origin}/public/verify-certificate?cert=${certificate.certificate_number}`;
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
                            <CertificateDetailCard certificate={certificate} />
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
