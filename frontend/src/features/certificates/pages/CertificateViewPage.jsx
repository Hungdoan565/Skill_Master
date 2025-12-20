/**
 * CertificateViewPage - Trang xem chi tiết chứng chỉ
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Award, ArrowLeft, Printer, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { CertificateTemplate } from '../components/CertificateTemplates';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function CertificateViewPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { session } = useAuth();
    const [certificate, setCertificate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchCertificate();
    }, [id]);

    const fetchCertificate = async () => {
        try {
            const response = await fetch(`${API_URL}/api/admin/certificates/${id}`, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setCertificate(data.data || data);
            } else {
                setError('Không tìm thấy chứng chỉ');
            }
        } catch (err) {
            console.error('Error fetching certificate:', err);
            setError('Có lỗi xảy ra khi tải chứng chỉ');
        }
        setLoading(false);
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error || !certificate) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <Award className="h-16 w-16 text-slate-300 mb-4" />
                <h2 className="text-xl font-semibold text-slate-900 mb-2">
                    {error || 'Không tìm thấy chứng chỉ'}
                </h2>
                <Button onClick={() => navigate(-1)} variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Quay lại
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100">
            {/* Header - hide on print */}
            <div className="print:hidden bg-white shadow-sm border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button onClick={() => navigate(-1)} variant="ghost" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Quay lại
                        </Button>
                        <div>
                            <h1 className="text-lg font-semibold text-slate-900">
                                Chứng chỉ #{certificate.certificate_number}
                            </h1>
                            <p className="text-sm text-slate-500">
                                {certificate.student_name} - {certificate.course_name}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={handlePrint} variant="outline">
                            <Printer className="h-4 w-4 mr-2" />
                            In
                        </Button>
                    </div>
                </div>
            </div>

            {/* Certificate Preview */}
            <div className="p-6 flex justify-center">
                <div className="shadow-xl rounded-lg overflow-hidden">
                    <CertificateTemplate
                        certificate={{
                            student_name: certificate.student_name,
                            certificate_number: certificate.certificate_number,
                            completion_date: certificate.completion_date,
                            issued_at: certificate.issued_at,
                            grade: certificate.grade,
                            scores: certificate.scores || {},
                            center: certificate.center,
                        }}
                        certificateType={certificate.certificate_type}
                        centerInfo={certificate.center}
                        template="modern-blue"
                    />
                </div>
            </div>

            {/* Print styles */}
            <style>{`
                @media print {
                    @page {
                        size: A4 landscape;
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}

export default CertificateViewPage;
