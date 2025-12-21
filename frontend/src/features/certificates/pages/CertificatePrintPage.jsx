/**
 * CertificatePrintPage - Trang in chứng chỉ
 * 
 * Hiển thị chứng chỉ dạng A4 để in
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Award, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCertificates } from '../hooks';
import { formatDate } from '../utils';
import axios from 'axios';
import { supabase } from '@/lib/supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Certificate Template Component
const CertificateTemplate = ({ certificate, type }) => {
    const scoreConfig = type?.score_config || {};

    // Format score display
    const formatScoreDisplay = () => {
        const scores = certificate.scores || {};

        if (scoreConfig.type === 'band') {
            // IELTS style
            return (
                <div className="text-center mt-4">
                    <p className="text-2xl font-bold text-indigo-700">
                        Overall Band Score: {scores.overall || '-'}
                    </p>
                    <div className="flex justify-center gap-8 mt-2 text-sm text-slate-600">
                        {scoreConfig.sub_scores?.map(key => (
                            <span key={key}>
                                {scoreConfig.labels?.[key] || key}: <strong>{scores[key] || '-'}</strong>
                            </span>
                        ))}
                    </div>
                </div>
            );
        }

        if (scoreConfig.type === 'numeric') {
            const total = scores.total || scores.score;
            return (
                <div className="text-center mt-4">
                    <p className="text-2xl font-bold text-indigo-700">
                        {scoreConfig.total_label || 'Score'}: {total || '-'}
                    </p>
                    {scoreConfig.sub_scores && scoreConfig.sub_scores.length > 0 && (
                        <div className="flex justify-center gap-8 mt-2 text-sm text-slate-600">
                            {scoreConfig.sub_scores.map(key => (
                                <span key={key}>
                                    {scoreConfig.labels?.[key] || key}: <strong>{scores[key] || '-'}</strong>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        if (certificate.grade) {
            return (
                <div className="text-center mt-4">
                    <p className="text-2xl font-bold text-indigo-700">
                        Xếp loại: {certificate.grade}
                    </p>
                </div>
            );
        }

        return null;
    };

    return (
        <div
            className="w-[210mm] min-h-[297mm] mx-auto bg-white shadow-2xl print:shadow-none"
            style={{
                backgroundImage: type?.template_preview_url ? `url(${type.template_preview_url})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}
        >
            {/* Certificate Content */}
            <div className="p-12 relative">
                {/* Decorative Border */}
                <div className="absolute inset-4 border-4 border-double border-amber-400 rounded-lg pointer-events-none" />
                <div className="absolute inset-6 border-2 border-amber-300 rounded-lg pointer-events-none" />

                {/* Content */}
                <div className="relative z-10 text-center pt-8">
                    {/* Logo/Header */}
                    <div className="flex justify-center mb-6">
                        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                            <Award className="h-12 w-12 text-white" />
                        </div>
                    </div>

                    {/* Center Name */}
                    <h1 className="text-2xl font-bold text-slate-800 uppercase tracking-wider">
                        {certificate.center?.name || 'Skill Master Training Center'}
                    </h1>

                    {/* Certificate Title */}
                    <div className="my-8">
                        <p className="text-lg text-slate-500 mb-2">Hereby certifies that</p>
                        <div className="py-4 border-y-2 border-amber-300 my-4">
                            <h2 className="text-4xl font-serif font-bold text-slate-900">
                                {certificate.student_name || certificate.student?.full_name}
                            </h2>
                        </div>
                    </div>

                    {/* Certificate Type & Description */}
                    <div className="my-8">
                        <p className="text-lg text-slate-600 mb-4">
                            has successfully completed the requirements for
                        </p>
                        <h3 className="text-3xl font-bold text-indigo-700">
                            {type?.name || certificate.course_name}
                        </h3>
                        {type?.provider && (
                            <p className="text-sm text-slate-500 mt-2">
                                Issued by: {type.provider}
                            </p>
                        )}
                    </div>

                    {/* Score Display */}
                    {formatScoreDisplay()}

                    {/* Certificate Details */}
                    <div className="mt-12 grid grid-cols-3 gap-8 text-sm">
                        <div>
                            <p className="text-slate-500">Certificate Number</p>
                            <p className="font-mono font-bold text-slate-800">
                                {certificate.certificate_number}
                            </p>
                        </div>
                        <div>
                            <p className="text-slate-500">Completion Date</p>
                            <p className="font-bold text-slate-800">
                                {formatDate(certificate.completion_date)}
                            </p>
                        </div>
                        <div>
                            <p className="text-slate-500">Issue Date</p>
                            <p className="font-bold text-slate-800">
                                {formatDate(certificate.issued_at)}
                            </p>
                        </div>
                    </div>

                    {/* External Certificate Info */}
                    {certificate.external_id && (
                        <div className="mt-6 p-4 bg-slate-50 rounded-lg inline-block">
                            <p className="text-sm text-slate-500">
                                Reference Number: <span className="font-mono font-bold">{certificate.external_id}</span>
                            </p>
                            {certificate.external_verify_url && (
                                <p className="text-xs text-slate-400 mt-1">
                                    Verify at: {certificate.external_verify_url}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Signature Section */}
                    <div className="mt-16 grid grid-cols-2 gap-16 px-12">
                        <div className="text-center">
                            <div className="h-16 border-b border-slate-300 mb-2" />
                            <p className="font-medium text-slate-700">Center Director</p>
                            <p className="text-sm text-slate-500">Authorized Signature</p>
                        </div>
                        <div className="text-center">
                            <div className="h-16 border-b border-slate-300 mb-2" />
                            <p className="font-medium text-slate-700">Program Manager</p>
                            <p className="text-sm text-slate-500">Authorized Signature</p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-12 pt-4 border-t border-slate-200 text-xs text-slate-400">
                        <p>This certificate is issued by {certificate.center?.name || 'Skill Master Training Center'}</p>
                        {certificate.center?.address && (
                            <p>{certificate.center.address}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Main Page Component
export function CertificatePrintPage() {
    const { id } = useParams();
    const [certificate, setCertificate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch certificate detail
    useEffect(() => {
        const fetchCertificate = async () => {
            try {
                setLoading(true);
                console.log('=== FETCHING CERTIFICATE FOR PRINT ===');
                console.log('Certificate ID:', id);
                console.log('API URL:', API_URL);

                const { data: { session } } = await supabase.auth.getSession();
                console.log('Has session:', !!session);
                console.log('Has token:', !!session?.access_token);

                const url = `${API_URL}/api/admin/certificates/${id}`;
                console.log('Fetching from:', url);

                const response = await axios.get(url, {
                    headers: {
                        Authorization: `Bearer ${session?.access_token}`
                    }
                });

                console.log('Response status:', response.status);
                console.log('Response data:', response.data);

                if (response.data?.success) {
                    setCertificate(response.data.data);
                } else {
                    console.error('Certificate not found in response');
                    setError('Không tìm thấy chứng chỉ');
                }
            } catch (err) {
                console.error('Error fetching certificate:', err);
                console.error('Error details:', err.response?.data);
                setError(`Không thể tải thông tin chứng chỉ: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchCertificate();
        } else {
            console.error('No certificate ID provided');
            setError('Thiếu mã chứng chỉ');
            setLoading(false);
        }
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (error || !certificate) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100">
                <div className="text-center">
                    <Award className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-500">{error || 'Không tìm thấy chứng chỉ'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 py-8 print:bg-white print:py-0">
            {/* Print Button - Hidden when printing */}
            <div className="fixed top-4 right-4 z-50 print:hidden">
                <Button onClick={handlePrint} className="shadow-lg">
                    <Printer className="h-4 w-4 mr-2" />
                    In chứng chỉ
                </Button>
            </div>

            {/* Certificate */}
            <CertificateTemplate
                certificate={certificate}
                type={certificate.certificate_type}
            />

            {/* Print Styles */}
            <style>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 0;
                    }
                    body {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>
        </div>
    );
}

export default CertificatePrintPage;
