/**
 * Export Centers to Excel
 * 
 * Utility function xuất danh sách trung tâm ra file Excel
 * Format chuẩn báo cáo Việt Nam với styling đẹp
 */

import { STATUS_CONFIG } from './constants';
import { formatWorkingHours, formatDate } from './formatters';

/**
 * Xuất danh sách trung tâm ra file Excel
 * @param {Array} centers - Danh sách trung tâm cần xuất
 */
export async function exportCentersToExcel(centers) {
    if (!centers || centers.length === 0) {
        throw new Error('Không có dữ liệu để xuất');
    }

    // Dynamic import xlsx-js-style
    const XLSX = await import('xlsx-js-style');

    const today = new Date();
    const dateStr = today.toLocaleDateString('vi-VN');

    // ============================================
    // STYLES
    // ============================================
    const styles = createExcelStyles();

    // ============================================
    // BUILD WORKSHEET DATA
    // ============================================
    const wsData = [];

    // Header rows
    wsData.push([{ v: 'DANH SÁCH TRUNG TÂM', s: styles.title }]);
    wsData.push([{ v: 'HỆ THỐNG SKILL MASTER', s: styles.subtitle }]);
    wsData.push([{ v: `Ngày xuất: ${dateStr}`, s: styles.info }]);
    wsData.push([]);

    // Summary statistics
    const activeCount = centers.filter(c => c.status === 'active').length;
    const inactiveCount = centers.filter(c => c.status === 'inactive').length;
    const totalRooms = centers.reduce((sum, c) => sum + (c.rooms_count || 0), 0);
    const totalTeachers = centers.reduce((sum, c) => sum + (c.teachers_count || 0), 0);
    const totalStudents = centers.reduce((sum, c) => sum + (c.students_count || 0), 0);

    wsData.push([
        { v: `Tổng số: ${centers.length}`, s: styles.summaryLabel },
        { v: `Hoạt động: ${activeCount}`, s: styles.summaryGreen },
        { v: `Ngừng HĐ: ${inactiveCount}`, s: styles.summaryRed },
        { v: `Phòng: ${totalRooms}`, s: styles.summaryBlue },
        { v: `GV: ${totalTeachers}`, s: styles.summaryBlue },
        { v: `HV: ${totalStudents}`, s: styles.summaryBlue }
    ]);
    wsData.push([]);

    // Table headers
    const headers = [
        'STT', 'Mã', 'Tên trung tâm', 'Địa chỉ', 'Hotline', 'Email',
        'Phòng học', 'Giáo viên', 'Học viên', 'Quản lý', 'Trạng thái', 'Ngày tạo'
    ];
    wsData.push(headers.map(h => ({ v: h, s: styles.header })));

    // Data rows
    centers.forEach((center, idx) => {
        const row = [
            { v: idx + 1, s: styles.cellCenter },
            { v: center.code || '-', s: styles.cellCode },
            { v: center.name || '-', s: styles.cellName },
            { v: center.address || '-', s: styles.cell },
            { v: center.hotline || '-', s: styles.cellCenter },
            { v: center.email || '-', s: styles.cell },
            { v: center.rooms_count || 0, s: styles.cellNumber },
            { v: center.teachers_count || 0, s: styles.cellNumber },
            { v: center.students_count || 0, s: styles.cellNumber },
            { v: center.manager?.full_name || 'Chưa có', s: styles.cell },
            { v: STATUS_CONFIG[center.status]?.label || center.status, s: center.status === 'active' ? styles.cellActive : styles.cellInactive },
            { v: formatDate(center.created_at), s: styles.cellCenter }
        ];
        wsData.push(row);
    });

    // Footer
    wsData.push([]);
    wsData.push([
        { v: '', s: {} },
        { v: '', s: {} },
        { v: '', s: {} },
        { v: '', s: {} },
        { v: '', s: {} },
        { v: '', s: {} },
        { v: totalRooms, s: styles.footerNumber },
        { v: totalTeachers, s: styles.footerNumber },
        { v: totalStudents, s: styles.footerNumber },
        { v: '', s: {} },
        { v: '', s: {} },
        { v: 'TỔNG', s: styles.footerLabel }
    ]);

    // ============================================
    // CREATE WORKSHEET
    // ============================================
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Column widths
    ws['!cols'] = [
        { wch: 5 },   // STT
        { wch: 10 },  // Mã
        { wch: 30 },  // Tên
        { wch: 40 },  // Địa chỉ
        { wch: 15 },  // Hotline
        { wch: 25 },  // Email
        { wch: 10 },  // Phòng
        { wch: 10 },  // GV
        { wch: 10 },  // HV
        { wch: 20 },  // Quản lý
        { wch: 12 },  // Trạng thái
        { wch: 12 }   // Ngày tạo
    ];

    // Merge cells for header
    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } }, // Title
        { s: { r: 1, c: 0 }, e: { r: 1, c: 11 } }, // Subtitle
        { s: { r: 2, c: 0 }, e: { r: 2, c: 11 } }  // Date
    ];

    // ============================================
    // CREATE WORKBOOK AND DOWNLOAD
    // ============================================
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Danh sách trung tâm');

    // Generate filename
    const filename = `DanhSachTrungTam_${today.toISOString().slice(0, 10)}.xlsx`;

    // Download
    XLSX.writeFile(wb, filename);

    return { success: true, filename };
}

/**
 * Tạo styles cho Excel
 */
function createExcelStyles() {
    return {
        title: {
            font: { bold: true, sz: 18, color: { rgb: '1F2937' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            fill: { fgColor: { rgb: 'EEF2FF' } }
        },
        subtitle: {
            font: { bold: true, sz: 12, color: { rgb: '4F46E5' } },
            alignment: { horizontal: 'center', vertical: 'center' }
        },
        info: {
            font: { sz: 10, color: { rgb: '6B7280' } },
            alignment: { horizontal: 'center', vertical: 'center' }
        },
        summaryLabel: {
            font: { bold: true, sz: 11, color: { rgb: '1F2937' } },
            fill: { fgColor: { rgb: 'F3F4F6' } },
            alignment: { horizontal: 'center', vertical: 'center' }
        },
        summaryGreen: {
            font: { bold: true, sz: 11, color: { rgb: '059669' } },
            fill: { fgColor: { rgb: 'D1FAE5' } },
            alignment: { horizontal: 'center', vertical: 'center' }
        },
        summaryRed: {
            font: { bold: true, sz: 11, color: { rgb: 'DC2626' } },
            fill: { fgColor: { rgb: 'FEE2E2' } },
            alignment: { horizontal: 'center', vertical: 'center' }
        },
        summaryBlue: {
            font: { bold: true, sz: 11, color: { rgb: '2563EB' } },
            fill: { fgColor: { rgb: 'DBEAFE' } },
            alignment: { horizontal: 'center', vertical: 'center' }
        },
        header: {
            font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '4F46E5' } },
            alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
            border: {
                top: { style: 'thin', color: { rgb: '4F46E5' } },
                bottom: { style: 'thin', color: { rgb: '4F46E5' } },
                left: { style: 'thin', color: { rgb: '4F46E5' } },
                right: { style: 'thin', color: { rgb: '4F46E5' } }
            }
        },
        cell: {
            font: { sz: 10, color: { rgb: '374151' } },
            alignment: { vertical: 'center', wrapText: true },
            border: {
                top: { style: 'thin', color: { rgb: 'E5E7EB' } },
                bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
                left: { style: 'thin', color: { rgb: 'E5E7EB' } },
                right: { style: 'thin', color: { rgb: 'E5E7EB' } }
            }
        },
        cellCenter: {
            font: { sz: 10, color: { rgb: '374151' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
                top: { style: 'thin', color: { rgb: 'E5E7EB' } },
                bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
                left: { style: 'thin', color: { rgb: 'E5E7EB' } },
                right: { style: 'thin', color: { rgb: 'E5E7EB' } }
            }
        },
        cellCode: {
            font: { bold: true, sz: 10, color: { rgb: '4F46E5' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
                top: { style: 'thin', color: { rgb: 'E5E7EB' } },
                bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
                left: { style: 'thin', color: { rgb: 'E5E7EB' } },
                right: { style: 'thin', color: { rgb: 'E5E7EB' } }
            }
        },
        cellName: {
            font: { bold: true, sz: 10, color: { rgb: '1F2937' } },
            alignment: { vertical: 'center' },
            border: {
                top: { style: 'thin', color: { rgb: 'E5E7EB' } },
                bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
                left: { style: 'thin', color: { rgb: 'E5E7EB' } },
                right: { style: 'thin', color: { rgb: 'E5E7EB' } }
            }
        },
        cellNumber: {
            font: { sz: 10, color: { rgb: '374151' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            numFmt: '#,##0',
            border: {
                top: { style: 'thin', color: { rgb: 'E5E7EB' } },
                bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
                left: { style: 'thin', color: { rgb: 'E5E7EB' } },
                right: { style: 'thin', color: { rgb: 'E5E7EB' } }
            }
        },
        cellActive: {
            font: { bold: true, sz: 10, color: { rgb: '059669' } },
            fill: { fgColor: { rgb: 'D1FAE5' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
                top: { style: 'thin', color: { rgb: 'E5E7EB' } },
                bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
                left: { style: 'thin', color: { rgb: 'E5E7EB' } },
                right: { style: 'thin', color: { rgb: 'E5E7EB' } }
            }
        },
        cellInactive: {
            font: { bold: true, sz: 10, color: { rgb: '6B7280' } },
            fill: { fgColor: { rgb: 'F3F4F6' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
                top: { style: 'thin', color: { rgb: 'E5E7EB' } },
                bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
                left: { style: 'thin', color: { rgb: 'E5E7EB' } },
                right: { style: 'thin', color: { rgb: 'E5E7EB' } }
            }
        },
        footerLabel: {
            font: { bold: true, sz: 11, color: { rgb: '1F2937' } },
            fill: { fgColor: { rgb: 'F3F4F6' } },
            alignment: { horizontal: 'right', vertical: 'center' },
            border: {
                top: { style: 'medium', color: { rgb: '4F46E5' } }
            }
        },
        footerNumber: {
            font: { bold: true, sz: 11, color: { rgb: '4F46E5' } },
            fill: { fgColor: { rgb: 'EEF2FF' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            numFmt: '#,##0',
            border: {
                top: { style: 'medium', color: { rgb: '4F46E5' } }
            }
        }
    };
}

export default exportCentersToExcel;
