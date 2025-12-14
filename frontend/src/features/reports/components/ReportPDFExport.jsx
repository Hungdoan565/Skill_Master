/**
 * ReportPDFExport Component - Export reports to PDF with charts
 * 
 * Uses html2canvas + jsPDF for high-quality PDF generation
 * Following the pattern from ClassAnalyticsPage
 */

import { useState, useRef, useCallback } from 'react';
import { Download, FileText, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// PDF export function using dynamic imports
async function exportToPDF(element, filename, options = {}) {
    const {
        title = 'Báo cáo',
        orientation = 'landscape',
        format = 'a4',
        margin = 10,
        includeHeader = true,
        headerInfo = {}
    } = options;

    try {
        // Dynamic imports for better code splitting
        const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
            import('html2canvas'),
            import('jspdf')
        ]);

        // Capture element as canvas
        const canvas = await html2canvas(element, {
            scale: 2, // Higher resolution
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: element.scrollWidth,
            windowHeight: element.scrollHeight
        });

        // Create PDF
        const pdf = new jsPDF({
            orientation,
            unit: 'mm',
            format
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const contentWidth = pageWidth - (margin * 2);

        // Calculate header height
        let yOffset = margin;

        if (includeHeader) {
            // Add title
            pdf.setFontSize(18);
            pdf.setFont('helvetica', 'bold');
            pdf.text(title, margin, yOffset + 8);
            yOffset += 12;

            // Add metadata
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(100);

            if (headerInfo.period) {
                pdf.text(`Kỳ báo cáo: ${headerInfo.period}`, margin, yOffset + 4);
                yOffset += 5;
            }
            if (headerInfo.className) {
                pdf.text(`Lớp học: ${headerInfo.className}`, margin, yOffset + 4);
                yOffset += 5;
            }
            if (headerInfo.centerName) {
                pdf.text(`Trung tâm: ${headerInfo.centerName}`, margin, yOffset + 4);
                yOffset += 5;
            }

            // Export date
            pdf.text(`Xuất ngày: ${new Date().toLocaleDateString('vi-VN')}`, margin, yOffset + 4);
            yOffset += 10;

            // Divider line
            pdf.setDrawColor(200);
            pdf.line(margin, yOffset, pageWidth - margin, yOffset);
            yOffset += 5;
        }

        // Calculate image dimensions
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const availableHeight = pageHeight - yOffset - margin;

        // Add image (may span multiple pages)
        const imgData = canvas.toDataURL('image/png');

        if (imgHeight <= availableHeight) {
            // Fits on one page
            pdf.addImage(imgData, 'PNG', margin, yOffset, imgWidth, imgHeight);
        } else {
            // Multi-page
            let remainingHeight = imgHeight;
            let sourceY = 0;
            let isFirstPage = true;

            while (remainingHeight > 0) {
                if (!isFirstPage) {
                    pdf.addPage();
                    yOffset = margin;
                }

                const pageImgHeight = isFirstPage ? availableHeight : pageHeight - (margin * 2);
                const sourceHeight = (pageImgHeight * canvas.height) / imgHeight;

                // Create a new canvas for this page section
                const pageCanvas = document.createElement('canvas');
                pageCanvas.width = canvas.width;
                pageCanvas.height = Math.min(sourceHeight, canvas.height - sourceY);

                const ctx = pageCanvas.getContext('2d');
                ctx.drawImage(
                    canvas,
                    0, sourceY, canvas.width, pageCanvas.height,
                    0, 0, canvas.width, pageCanvas.height
                );

                const pageImgData = pageCanvas.toDataURL('image/png');
                const actualHeight = (pageCanvas.height * imgWidth) / canvas.width;

                pdf.addImage(pageImgData, 'PNG', margin, yOffset, imgWidth, actualHeight);

                sourceY += pageCanvas.height;
                remainingHeight -= pageImgHeight;
                isFirstPage = false;
            }
        }

        // Add footer with page numbers
        const totalPages = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setFontSize(8);
            pdf.setTextColor(150);
            pdf.text(
                `Trang ${i} / ${totalPages}`,
                pageWidth / 2,
                pageHeight - 5,
                { align: 'center' }
            );
        }

        // Save
        pdf.save(`${filename}.pdf`);
        return true;
    } catch (error) {
        console.error('PDF export error:', error);
        throw error;
    }
}

export function ReportPDFExport({
    contentRef,
    reportTitle,
    filename = 'bao-cao',
    headerInfo = {},
    disabled = false,
    className,
    variant = 'default',
    size = 'default'
}) {
    const [exporting, setExporting] = useState(false);
    const [exportSuccess, setExportSuccess] = useState(false);

    const handleExport = useCallback(async (options = {}) => {
        if (!contentRef?.current || exporting) return;

        setExporting(true);
        setExportSuccess(false);

        try {
            await exportToPDF(contentRef.current, filename, {
                title: reportTitle,
                headerInfo,
                orientation: 'landscape', // Default to landscape for reports
                ...options
            });
            setExportSuccess(true);
            setTimeout(() => setExportSuccess(false), 2000);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Lỗi khi xuất PDF: ' + error.message);
        } finally {
            setExporting(false);
        }
    }, [contentRef, filename, reportTitle, headerInfo, exporting]);

    // Simple button export
    return (
        <Button
            onClick={() => handleExport()}
            disabled={disabled || exporting}
            variant="outline"
            size={size}
            className={cn(
                exportSuccess && 'bg-green-50 border-green-500 text-green-600',
                className
            )}
        >
            {exporting ? (
                <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang xuất PDF...
                </>
            ) : exportSuccess ? (
                <>
                    <Check className="h-4 w-4 mr-2" />
                    Đã xuất PDF
                </>
            ) : (
                <>
                    <FileText className="h-4 w-4 mr-2" />
                    Xuất PDF
                </>
            )}
        </Button>
    );
}

// Hook for easier usage
export function useReportPDFExport() {
    const contentRef = useRef(null);
    const [exporting, setExporting] = useState(false);

    const exportPDF = useCallback(async (options = {}) => {
        if (!contentRef.current || exporting) return false;

        setExporting(true);
        try {
            await exportToPDF(contentRef.current, options.filename || 'bao-cao', options);
            return true;
        } catch (error) {
            console.error('Export failed:', error);
            return false;
        } finally {
            setExporting(false);
        }
    }, [exporting]);

    return { contentRef, exporting, exportPDF };
}
