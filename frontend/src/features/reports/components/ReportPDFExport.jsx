import { gooeyToast } from 'goey-toast';
/**
 * ReportPDFExport Component - Export reports to PDF
 * 
 * Uses jsPDF with autoTable for reliable PDF generation from data
 * No html2canvas dependency - works with any CSS
 */

import { useState, useRef, useCallback } from 'react';
import { Download, FileText, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// PDF export function using jsPDF + autoTable
async function exportToPDFFromData(data, title, options = {}) {
    try {
        const { jsPDF } = await import('jspdf');
        await import('jspdf-autotable');

        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 15;

        // Header
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, margin, 20);

        // Metadata
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        let yPos = 28;

        if (options.className) {
            pdf.text(`Lớp học: ${options.className}`, margin, yPos);
            yPos += 6;
        }
        if (options.period) {
            pdf.text(`Kỳ báo cáo: ${options.period}`, margin, yPos);
            yPos += 6;
        }

        pdf.setFontSize(9);
        pdf.setTextColor(100);
        pdf.text(`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`, margin, yPos);
        yPos += 10;

        // Summary cards
        if (data.summary) {
            const summaryData = [
                ['Tỷ lệ đậu', `${data.summary.passRate || 0}%`],
                ['Điểm TB', data.summary.avgScore?.toFixed(2) || '0'],
                ['Điểm cao nhất', data.summary.maxScore || '0'],
                ['Điểm thấp nhất', data.summary.minScore || '0']
            ];

            pdf.autoTable({
                startY: yPos,
                head: [['Chỉ số', 'Giá trị']],
                body: summaryData,
                theme: 'grid',
                headStyles: { fillColor: [37, 99, 235], fontSize: 11 },
                columnStyles: {
                    0: { cellWidth: 50, fontStyle: 'bold' },
                    1: { cellWidth: 40, halign: 'center', fontSize: 12, textColor: [0, 128, 0] }
                },
                margin: { left: margin }
            });

            yPos = pdf.lastAutoTable.finalY + 10;
        }

        // Distribution table
        if (data.distribution?.length > 0) {
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(0);
            pdf.text('Phân bố điểm', margin, yPos);
            yPos += 6;

            const distData = data.distribution.map((item, idx) => [
                idx + 1,
                item.range,
                item.count || 0,
                `${item.percentage?.toFixed(1) || 0}%`
            ]);

            pdf.autoTable({
                startY: yPos,
                head: [['STT', 'Khoảng điểm', 'Số học viên', 'Tỷ lệ']],
                body: distData,
                theme: 'striped',
                headStyles: { fillColor: [37, 99, 235] },
                columnStyles: {
                    0: { cellWidth: 20, halign: 'center' },
                    1: { cellWidth: 60, halign: 'center' },
                    2: { cellWidth: 40, halign: 'center' },
                    3: { cellWidth: 30, halign: 'center' }
                },
                margin: { left: margin }
            });

            yPos = pdf.lastAutoTable.finalY + 10;
        }

        // Top students table
        if (data.topStudents?.length > 0) {
            if (yPos > pageHeight - 60) {
                pdf.addPage();
                yPos = margin + 10;
            }

            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Top học viên xuất sắc', margin, yPos);
            yPos += 6;

            const topData = data.topStudents.map((item, idx) => [
                idx + 1,
                item.studentName || 'N/A',
                item.courseName || 'N/A',
                item.finalScore?.toFixed(2) || '0',
                item.passed ? 'Đạt' : 'Không đạt'
            ]);

            pdf.autoTable({
                startY: yPos,
                head: [['STT', 'Học viên', 'Khóa học', 'Điểm', 'Kết quả']],
                body: topData,
                theme: 'striped',
                headStyles: { fillColor: [37, 99, 235] },
                columnStyles: {
                    0: { cellWidth: 15, halign: 'center' },
                    1: { cellWidth: 60 },
                    2: { cellWidth: 70 },
                    3: { cellWidth: 25, halign: 'center' },
                    4: { cellWidth: 30, halign: 'center' }
                },
                margin: { left: margin },
                didParseCell: function (data) {
                    if (data.column.index === 4 && data.cell.raw === 'Đạt') {
                        data.cell.styles.textColor = [0, 128, 0];
                        data.cell.styles.fontStyle = 'bold';
                    }
                }
            });
        }

        // Footer
        const totalPages = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setFontSize(8);
            pdf.setTextColor(150);
            pdf.text(
                `Trang ${i} / ${totalPages}`,
                pageWidth / 2,
                pageHeight - 10,
                { align: 'center' }
            );
        }

        pdf.save(`${options.filename || 'bao-cao'}.pdf`);
        return true;
    } catch (error) {
        console.error('PDF export error:', error);
        throw error;
    }
}

export function ReportPDFExport({
    reportData,
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

    const handleExport = useCallback(async () => {
        if (!reportData || exporting) return;

        setExporting(true);
        setExportSuccess(false);

        try {
            await exportToPDFFromData(reportData, reportTitle, {
                ...headerInfo,
                filename
            });

            setExportSuccess(true);
            setTimeout(() => setExportSuccess(false), 2000);
        } catch (error) {
            console.error('Export failed:', error);
            gooeyToast('Lỗi khi xuất PDF: ' + error.message);
        } finally {
            setExporting(false);
        }
    }, [reportData, reportTitle, headerInfo, filename, exporting]);

    // Button export
    return (
        <Button
            onClick={handleExport}
            disabled={disabled || exporting || !reportData}
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
                    Đang xuất...
                </>
            ) : exportSuccess ? (
                <>
                    <Check className="h-4 w-4 mr-2" />
                    Đã xuất
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
export function useReportPDFExport(reportData) {
    const [exporting, setExporting] = useState(false);

    const exportPDF = useCallback(async (options = {}) => {
        if (!reportData || exporting) return false;

        setExporting(true);
        try {
            await exportToPDFFromData(reportData, options.title || 'Báo cáo', options);
            return true;
        } catch (error) {
            console.error('Export failed:', error);
            return false;
        } finally {
            setExporting(false);
        }
    }, [reportData, exporting]);

    return { exporting, exportPDF };
}
