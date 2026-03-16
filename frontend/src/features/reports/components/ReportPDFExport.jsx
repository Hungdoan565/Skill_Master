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

async function loadFonts(pdf) {
    try {
        const [regRes, boldRes] = await Promise.all([
            fetch('/fonts/NotoSans-Regular.ttf'),
            fetch('/fonts/NotoSans-Bold.ttf')
        ]);
        
        if (!regRes.ok || !boldRes.ok) return false;
        
        const [regBuffer, boldBuffer] = await Promise.all([
            regRes.arrayBuffer(),
            boldRes.arrayBuffer()
        ]);
        
        const arrayBufferToBase64 = (buffer) => {
            let binary = '';
            const bytes = new Uint8Array(buffer);
            const len = bytes.byteLength;
            const chunkSize = 8192;
            for (let i = 0; i < len; i += chunkSize) {
                const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
                binary += String.fromCharCode.apply(null, chunk);
            }
            return window.btoa(binary);
        };

        pdf.addFileToVFS('NotoSans-Regular.ttf', arrayBufferToBase64(regBuffer));
        pdf.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal');
        
        pdf.addFileToVFS('NotoSans-Bold.ttf', arrayBufferToBase64(boldBuffer));
        pdf.addFont('NotoSans-Bold.ttf', 'NotoSans', 'bold');
        
        return true;
    } catch (err) {
        console.error("Lỗi tải font PDF:", err);
        return false;
    }
}

async function exportToPDFFromData(data, title, options = {}) {
    try {
        const { jsPDF } = await import('jspdf');
        const autoTableModule = await import('jspdf-autotable');
        const autoTable = autoTableModule.default || autoTableModule.autoTable || autoTableModule;

        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        const fontLoaded = await loadFonts(pdf);
        if (fontLoaded) {
            pdf.setFont('NotoSans');
        }

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 20;

        // BRAND COLORS
        const BRAND_PRIMARY = [37, 99, 235]; // Blue 600
        const BRAND_DARK = [15, 23, 42]; // Slate 900
        const BRAND_LIGHT = [241, 245, 249]; // Slate 100
        const TEXT_MAIN = [51, 65, 85]; // Slate 700
        const TEXT_MUTED = [100, 116, 139]; // Slate 500
        const SUCCESS_COLOR = [22, 163, 74];
        const ERROR_COLOR = [220, 38, 38];

        let yPos = margin;

        // ====== HEADER ======
        pdf.setFont(fontLoaded ? 'NotoSans' : 'helvetica', 'bold');
        pdf.setFontSize(22);
        pdf.setTextColor(...BRAND_PRIMARY);
        pdf.text('SKILL MASTER', margin, yPos + 6);
        
        pdf.setFontSize(9);
        pdf.setTextColor(...TEXT_MUTED);
        pdf.setFont(fontLoaded ? 'NotoSans' : 'helvetica', 'normal');
        pdf.text(`Thời gian xuất: ${new Date().toLocaleString('vi-VN')}`, pageWidth - margin, yPos, { align: 'right' });
        pdf.text(`Người xuất: Admin | Hệ thống nội bộ`, pageWidth - margin, yPos + 5, { align: 'right' });

        // Divider line
        yPos += 12;
        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.5);
        pdf.line(margin, yPos, pageWidth - margin, yPos);
        
        // ====== REPORT TITLE ======
        yPos += 15;
        pdf.setFont(fontLoaded ? 'NotoSans' : 'helvetica', 'bold');
        pdf.setFontSize(20);
        pdf.setTextColor(...BRAND_DARK);
        pdf.text(title.toUpperCase(), pageWidth / 2, yPos, { align: 'center' });
        
        // Context Info
        yPos += 8;
        pdf.setFontSize(11);
        pdf.setTextColor(...TEXT_MAIN);
        pdf.setFont(fontLoaded ? 'NotoSans' : 'helvetica', 'normal');
        
        let subtitleText = [];
        if (options.period) subtitleText.push(`Kỳ báo cáo: ${options.period}`);
        if (options.className) subtitleText.push(`Lớp: ${options.className}`);
        
        if (subtitleText.length > 0) {
            pdf.text(subtitleText.join('   |   '), pageWidth / 2, yPos, { align: 'center' });
        }
        
        yPos += 15;

        // Common table options
        const tableStyles = {
            theme: 'grid',
            headStyles: { fillColor: BRAND_DARK, textColor: 255, font: fontLoaded ? 'NotoSans' : 'helvetica', fontStyle: 'bold', fontSize: 10, halign: 'center', valign: 'middle' },
            styles: { font: fontLoaded ? 'NotoSans' : 'helvetica', fontSize: 10, textColor: TEXT_MAIN, cellPadding: 5, lineColor: [226, 232, 240] },
            alternateRowStyles: { fillColor: BRAND_LIGHT },
            margin: { left: margin, right: margin }
        };

        const renderGradesData = () => {
            if (data.summary) {
                const s = data.summary;
                autoTable(pdf, {
                    ...tableStyles,
                    startY: yPos,
                    head: [['TỔNG QUAN ĐIỂM SỐ', 'ĐẠT YÊU CẦU', 'ĐIỂM TRUNG BÌNH', 'ĐIỂM CAO NHẤT', 'ĐIỂM THẤP NHẤT']],
                    body: [['Chỉ số', `${s.passRate || 0}%`, s.avgScore?.toFixed(2) || '0', s.maxScore || '0', s.minScore || '0']],
                    headStyles: { ...tableStyles.headStyles, fillColor: BRAND_PRIMARY, fontSize: 10 },
                    bodyStyles: { fontStyle: 'bold', halign: 'center', fontSize: 12, textColor: BRAND_DARK }
                });
                yPos = pdf.previousAutoTable?.finalY ?? (yPos + 20);
                yPos += 15;
            }

            if (data.distribution?.length > 0) {
                pdf.setFontSize(13);
                pdf.setFont(fontLoaded ? 'NotoSans' : 'helvetica', 'bold');
                pdf.setTextColor(...BRAND_DARK);
                pdf.text('PHÂN BỐ ĐIỂM SỐ', margin, yPos);
                yPos += 6;

                autoTable(pdf, {
                    ...tableStyles,
                    startY: yPos,
                    head: [['STT', 'Khoảng điểm', 'Số lượng học viên', 'Tỷ lệ (%)']],
                    body: data.distribution.map((d, i) => [i + 1, d.range, d.count || 0, `${d.percentage?.toFixed(1) || 0}%`]),
                    columnStyles: { 0: { halign: 'center', cellWidth: 20 }, 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right', fontStyle: 'bold' } }
                });
                yPos = pdf.previousAutoTable?.finalY ?? (yPos + 40);
                yPos += 15;
            }

            if (data.topStudents?.length > 0) {
                if (yPos > pageHeight - 60) {
                    pdf.addPage();
                    yPos = margin + 10;
                }
                pdf.setFontSize(13);
                pdf.setFont(fontLoaded ? 'NotoSans' : 'helvetica', 'bold');
                pdf.setTextColor(...BRAND_DARK);
                pdf.text('DANH SÁCH HỌC VIÊN XUẤT SẮC', margin, yPos);
                yPos += 6;

                autoTable(pdf, {
                    ...tableStyles,
                    startY: yPos,
                    head: [['STT', 'Họ và tên', 'Khóa học', 'Mã lớp', 'Điểm TK', 'Kết quả']],
                    body: data.topStudents.map((s, i) => [i + 1, s.studentName || 'N/A', s.courseName || 'N/A', s.classCode || 'N/A', s.finalScore?.toFixed(2) || '0', s.passed ? 'Đạt' : 'Trượt']),
                    columnStyles: { 0: { halign: 'center', cellWidth: 15 }, 4: { halign: 'center', fontStyle: 'bold' }, 5: { halign: 'center', fontStyle: 'bold' } },
                    didParseCell: (data) => {
                        if (data.column.index === 5 && data.section === 'body') {
                            data.cell.styles.textColor = data.cell.raw === 'Đạt' ? SUCCESS_COLOR : ERROR_COLOR;
                        }
                    }
                });
            }
        };

        const renderAttendanceData = () => {
            if (data.summary) {
                const s = data.summary;
                autoTable(pdf, {
                    ...tableStyles,
                    startY: yPos,
                    head: [['TỔNG QUAN CHUYÊN CẦN', 'TỶ LỆ HIỆN DIỆN', 'TỔNG SỐ TIẾT', 'CÓ MẶT', 'VẮNG MẶT', 'ĐI TRỄ']],
                    body: [['Chỉ số', `${s.attendanceRate || 0}%`, s.totalRecords || 0, s.presentCount || 0, s.absentCount || 0, s.lateCount || 0]],
                    headStyles: { ...tableStyles.headStyles, fillColor: BRAND_PRIMARY, fontSize: 10 },
                    bodyStyles: { fontStyle: 'bold', halign: 'center', fontSize: 12, textColor: BRAND_DARK }
                });
                yPos = pdf.previousAutoTable?.finalY ?? (yPos + 20);
                yPos += 15;
            }

            if (data.lowAttendanceStudents?.length > 0) {
                pdf.setFontSize(13);
                pdf.setFont(fontLoaded ? 'NotoSans' : 'helvetica', 'bold');
                pdf.setTextColor(...BRAND_DARK);
                pdf.text('HỌC VIÊN CÓ TỶ LỆ CHUYÊN CẦN THẤP (<70%)', margin, yPos);
                yPos += 6;

                autoTable(pdf, {
                    ...tableStyles,
                    startY: yPos,
                    head: [['STT', 'Họ và tên', 'Khóa học', 'Mã lớp', 'Tổng tiết', 'Có mặt', 'Tỷ lệ']],
                    body: data.lowAttendanceStudents.map((s, i) => [i + 1, s.studentName || 'N/A', s.courseName || 'N/A', s.classCode || 'N/A', s.total || 0, s.present || 0, `${s.rate || 0}%`]),
                    columnStyles: { 0: { halign: 'center', cellWidth: 15 }, 4: { halign: 'center'}, 5: { halign: 'center' }, 6: { halign: 'center', fontStyle: 'bold', textColor: ERROR_COLOR } }
                });
            }
        };

        // Render based on specified type or inferred data structure
        if (options.reportType === 'attendance' || (data.byStatus && data.lowAttendanceStudents)) {
            renderAttendanceData();
        } else if (options.reportType === 'grades' || data.distribution) {
            renderGradesData();
        } else {
            pdf.setFontSize(12);
            pdf.setFont(fontLoaded ? 'NotoSans' : 'helvetica', 'italic');
            pdf.setTextColor(...TEXT_MUTED);
            pdf.text('Dữ liệu dạng bảng cho báo cáo này đang được cập nhật thiết kế in ấn.', pageWidth / 2, yPos, { align: 'center' });
        }

        // ====== FOOTER ======
        const totalPages = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            
            // Footer separator
            pdf.setDrawColor(226, 232, 240);
            pdf.setLineWidth(0.5);
            pdf.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

            pdf.setFontSize(8);
            pdf.setTextColor(...TEXT_MUTED);
            pdf.setFont(fontLoaded ? 'NotoSans' : 'helvetica', 'normal');
            
            pdf.text('Skill Master Education Center', margin, pageHeight - 10);
            pdf.text(`Trang ${i} / ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
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
