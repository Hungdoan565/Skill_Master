import { toast } from "sonner";
/**
 * CertificateBulkPrintPage - Trang in nhiều chứng chỉ cùng lúc
 * 
 * Nhận data từ localStorage và render tất cả certificates với template đẹp
 * Tự động mở print dialog
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CertificateTemplate } from '../components/CertificateTemplates';
import { Loader2 } from 'lucide-react';

export function CertificateBulkPrintPage() {
    const navigate = useNavigate();
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get data from localStorage
        const printData = localStorage.getItem('certificates_print_data');

        if (!printData) {
            toast('Không tìm thấy dữ liệu in. Vui lòng thử lại.');
            navigate(-1);
            return;
        }

        try {
            const data = JSON.parse(printData);
            setCertificates(data.certificates || []);
            setLoading(false);

            // Auto print after render
            setTimeout(() => {
                window.print();
                // Clean up
                localStorage.removeItem('certificates_print_data');
            }, 1000);
        } catch (error) {
            console.error('Error parsing print data:', error);
            toast('Dữ liệu in không hợp lệ');
            navigate(-1);
        }
    }, [navigate]);

    // Print styles
    useEffect(() => {
        // Add print styles
        const style = document.createElement('style');
        style.textContent = `
            @media print {
                @page {
                    size: A4 landscape;
                    margin: 0;
                }
                
                body {
                    margin: 0;
                    padding: 0;
                }
                
                .certificate-container {
                    page-break-after: always;
                    width: 297mm;
                    height: 210mm;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .certificate-container:last-child {
                    page-break-after: avoid;
                }
                
                .no-print {
                    display: none !important;
                }
            }
            
            @media screen {
                body {
                    background: #f1f5f9;
                    padding: 20px;
                }
                
                .certificate-container {
                    margin-bottom: 30px;
                    padding: 20px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-slate-600">Đang chuẩn bị in...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Print button for screen view */}
            <div className="no-print fixed top-4 right-4 z-50">
                <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg"
                >
                    In lại
                </button>
                <button
                    onClick={() => navigate(-1)}
                    className="ml-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 shadow-lg"
                >
                    Quay lại
                </button>
            </div>

            {/* Certificates */}
            {certificates.map((cert, index) => (
                <div key={index} className="certificate-container">
                    <CertificateTemplate
                        certificate={{
                            student_name: cert.student_name,
                            certificate_number: cert.certificate_number,
                            completion_date: cert.completion_date,
                            issued_at: cert.issued_at,
                            grade: cert.grade,
                            scores: cert.scores,
                            center: cert.center,
                        }}
                        certificateType={cert.certificateType}
                        centerInfo={cert.center}
                        template={cert.template}
                    />
                </div>
            ))}
        </div>
    );
}

export default CertificateBulkPrintPage;
