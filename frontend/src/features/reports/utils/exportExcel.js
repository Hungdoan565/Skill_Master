/**
 * Export Reports to Excel
 * 
 * Utility functions xuất báo cáo ra file Excel
 * Theo chuẩn kế toán Việt Nam - Professional Business Report Format
 * 
 * REFACTORED: Following invoices/exportExcel.js best practices
 * - Fixed column counts matching actual data
 * - Proper merge cells
 * - Consistent signature positioning
 * - Full row fills with empty cells
 */

import { PAYMENT_METHOD_LABELS } from './constants';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format date to Vietnamese locale
 */
function formatDateVN(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('vi-VN');
}

/**
 * Create Excel styles - Professional Business Format
 */
function createExcelStyles() {
    const thinBorder = {
        top: { style: 'thin', color: { rgb: 'D1D5DB' } },
        bottom: { style: 'thin', color: { rgb: 'D1D5DB' } },
        left: { style: 'thin', color: { rgb: 'D1D5DB' } },
        right: { style: 'thin', color: { rgb: 'D1D5DB' } },
    };

    const mediumBorder = {
        top: { style: 'medium', color: { rgb: '1E3A8A' } },
        bottom: { style: 'medium', color: { rgb: '1E3A8A' } },
        left: { style: 'medium', color: { rgb: '1E3A8A' } },
        right: { style: 'medium', color: { rgb: '1E3A8A' } },
    };

    const summaryBorder = {
        top: { style: 'thin', color: { rgb: '93C5FD' } },
        bottom: { style: 'thin', color: { rgb: '93C5FD' } },
        left: { style: 'thin', color: { rgb: '93C5FD' } },
        right: { style: 'thin', color: { rgb: '93C5FD' } },
    };

    return {
        // Header styles - CENTERED
        title: {
            font: { bold: true, sz: 16, color: { rgb: 'FFFFFF' }, name: 'Arial' },
            fill: { fgColor: { rgb: '1E3A8A' } },
            alignment: { horizontal: 'center', vertical: 'center' },
        },
        subtitle: {
            font: { bold: true, sz: 12, color: { rgb: '1E3A8A' }, name: 'Arial' },
            alignment: { horizontal: 'center', vertical: 'center' },
        },
        info: {
            font: { sz: 10, color: { rgb: '6B7280' }, name: 'Arial', italic: true },
            alignment: { horizontal: 'center', vertical: 'center' },
        },

        // Section title
        sectionTitle: {
            font: { bold: true, sz: 11, color: { rgb: '1E3A8A' }, name: 'Arial' },
            fill: { fgColor: { rgb: 'E0E7FF' } },
            alignment: { horizontal: 'left', vertical: 'center' },
            border: mediumBorder,
        },

        // Table header
        header: {
            font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' }, name: 'Arial' },
            fill: { fgColor: { rgb: '1E40AF' } },
            alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
            border: mediumBorder,
        },

        // Cell styles
        cellText: {
            font: { sz: 10, name: 'Arial' },
            alignment: { horizontal: 'left', vertical: 'center' },
            border: thinBorder,
        },
        cellCenter: {
            font: { sz: 10, name: 'Arial' },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: thinBorder,
        },
        cellNumber: {
            font: { sz: 10, name: 'Arial' },
            alignment: { horizontal: 'right', vertical: 'center' },
            numFmt: '#,##0',
            border: thinBorder,
        },
        cellCurrency: {
            font: { sz: 10, name: 'Arial' },
            alignment: { horizontal: 'right', vertical: 'center' },
            numFmt: '#,##0',
            border: thinBorder,
        },

        // Summary box styles - with full border
        summaryBox: {
            fill: { fgColor: { rgb: 'DBEAFE' } },
            border: summaryBorder,
        },
        summaryLabel: {
            font: { bold: true, sz: 11, color: { rgb: '1E3A8A' }, name: 'Arial' },
            fill: { fgColor: { rgb: 'DBEAFE' } },
            alignment: { horizontal: 'right', vertical: 'center' },
            border: summaryBorder,
        },
        summaryValue: {
            font: { bold: true, sz: 12, color: { rgb: '047857' }, name: 'Arial' },
            fill: { fgColor: { rgb: 'DBEAFE' } },
            alignment: { horizontal: 'left', vertical: 'center' },
            numFmt: '#,##0',
            border: summaryBorder,
        },
        summaryBad: {
            font: { bold: true, sz: 12, color: { rgb: 'DC2626' }, name: 'Arial' },
            fill: { fgColor: { rgb: 'FEE2E2' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: { ...summaryBorder, color: { rgb: 'FCA5A5' } },
        },

        // Status styles
        good: {
            font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' }, name: 'Arial' },
            fill: { fgColor: { rgb: '10B981' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: thinBorder,
        },
        bad: {
            font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' }, name: 'Arial' },
            fill: { fgColor: { rgb: 'EF4444' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: thinBorder,
        },

        // Alt row for zebra striping
        altRowBg: { fgColor: { rgb: 'F9FAFB' } },

        // Footer total row
        footerLabel: {
            font: { bold: true, sz: 11, color: { rgb: '1E3A8A' }, name: 'Arial' },
            fill: { fgColor: { rgb: 'E0E7FF' } },
            alignment: { horizontal: 'right', vertical: 'center' },
            border: mediumBorder,
        },
        footerValue: {
            font: { bold: true, sz: 11, color: { rgb: '047857' }, name: 'Arial' },
            fill: { fgColor: { rgb: 'E0E7FF' } },
            alignment: { horizontal: 'right', vertical: 'center' },
            numFmt: '#,##0',
            border: mediumBorder,
        },

        // Signature section
        signatureLabel: {
            font: { bold: true, sz: 10, color: { rgb: '374151' }, name: 'Arial' },
            alignment: { horizontal: 'center', vertical: 'center' },
        },
        signatureLine: {
            font: { italic: true, sz: 9, color: { rgb: '6B7280' }, name: 'Arial' },
            alignment: { horizontal: 'center', vertical: 'center' },
        },
    };
}

/**
 * Calculate optimal column width based on content
 * @param {Array} wsData - Worksheet data array
 * @param {number} colIndex - Column index
 * @param {number} minWidth - Minimum width (default 8)
 * @param {number} maxWidth - Maximum width (default 50)
 * @param {Array} mergedRanges - Array of merged cell ranges to skip
 * @returns {number} Optimal column width
 */
function calculateColumnWidth(wsData, colIndex, minWidth = 8, maxWidth = 50, mergedRanges = []) {
    let maxLen = minWidth;

    for (let rowIdx = 0; rowIdx < wsData.length; rowIdx++) {
        const row = wsData[rowIdx];
        if (!row || !row[colIndex]) continue;

        // Skip rows that are part of merged cells in this column
        const isMerged = mergedRanges.some(merge =>
            rowIdx >= merge.s.r && rowIdx <= merge.e.r &&
            colIndex >= merge.s.c && colIndex <= merge.e.c &&
            merge.s.c !== merge.e.c // Only skip if merged horizontally
        );
        if (isMerged) continue;

        const cell = row[colIndex];
        let value = '';

        // Handle cell object or direct value
        if (typeof cell === 'object' && cell !== null) {
            value = cell.v !== undefined ? String(cell.v) : '';
        } else {
            value = String(cell);
        }

        // Skip section titles (they will be merged)
        if (value.match(/^[IVX]+\./)) continue;

        // Calculate display length (Vietnamese characters count as 1.5)
        let displayLen = 0;
        for (const char of value) {
            // Vietnamese characters and special chars
            if (char.charCodeAt(0) > 127) {
                displayLen += 1.5;
            } else {
                displayLen += 1;
            }
        }

        // Add padding
        displayLen = Math.ceil(displayLen) + 2;

        if (displayLen > maxLen) {
            maxLen = displayLen;
        }
    }

    return Math.min(maxLen, maxWidth);
}

/**
 * Auto-calculate column widths for worksheet
 * @param {Array} wsData - Worksheet data array
 * @param {Array} defaultWidths - Default widths for each column [{min, max, default}]
 * @param {Array} mergedRanges - Array of merged cell ranges
 * @returns {Array} Column width configuration for xlsx
 */
function autoFitColumns(wsData, defaultWidths = [], mergedRanges = []) {
    if (!wsData || wsData.length === 0) return [];

    const colCount = Math.max(...wsData.map(row => row?.length || 0));
    const cols = [];

    for (let i = 0; i < colCount; i++) {
        const config = defaultWidths[i] || {};
        const minW = config.min || 6;
        const maxW = config.max || 45;
        const defaultW = config.default || 12;

        const calculatedWidth = calculateColumnWidth(wsData, i, minW, maxW, mergedRanges);
        const finalWidth = Math.max(calculatedWidth, defaultW);

        cols.push({ wch: finalWidth });
    }

    return cols;
}

/**
 * Create empty row with specified column count
 */
function createEmptyRow(colCount, style = {}) {
    const row = [];
    for (let i = 0; i < colCount; i++) {
        row.push({ v: '', s: style });
    }
    return row;
}

/**
 * Create header rows (title, subtitle, info) - all cells filled
 */
function createHeaderRows(title, subtitle, periodText, colCount, styles) {
    const rows = [];
    const today = new Date();

    // Title row - fill all cells
    const titleRow = createEmptyRow(colCount, styles.title);
    titleRow[0] = { v: title, s: styles.title };
    rows.push(titleRow);

    // Subtitle row
    const subtitleRow = createEmptyRow(colCount, styles.subtitle);
    subtitleRow[0] = { v: subtitle, s: styles.subtitle };
    rows.push(subtitleRow);

    // Period row
    const periodRow = createEmptyRow(colCount, styles.info);
    periodRow[0] = { v: periodText, s: styles.info };
    rows.push(periodRow);

    // Date row
    const dateRow = createEmptyRow(colCount, styles.info);
    dateRow[0] = { v: `Ngày lập: ${formatDateVN(today)} | Người lập: Admin`, s: styles.info };
    rows.push(dateRow);

    return rows;
}

/**
 * Create signature rows - fixed positioning
 */
function createSignatureRows(colCount, styles) {
    const row1 = createEmptyRow(colCount, {});
    const row2 = createEmptyRow(colCount, {});

    // Position: column 0 and column (colCount - 2) for balance
    const rightPos = colCount - 1;

    row1[0] = { v: 'Người lập biểu', s: styles.signatureLabel };
    row1[rightPos] = { v: 'Giám đốc trung tâm', s: styles.signatureLabel };
    row2[0] = { v: '(Ký, ghi rõ họ tên)', s: styles.signatureLine };
    row2[rightPos] = { v: '(Ký, đóng dấu)', s: styles.signatureLine };

    return [row1, row2];
}

/**
 * Create section title row - spans all columns
 * @param {string} text - Section title text
 * @param {number} colCount - Total column count
 * @param {object} styles - Style object
 * @returns {Array} Row array with title in first cell
 */
function createSectionTitleRow(text, colCount, styles) {
    const row = createEmptyRow(colCount, styles.sectionTitle);
    row[0] = { v: text, s: styles.sectionTitle };
    return row;
}

/**
 * Create footer total row
 */
function createFooterRow(colCount, labelCol, values, styles) {
    const row = createEmptyRow(colCount, styles.footerLabel);
    row[labelCol] = { v: 'TỔNG CỘNG', s: styles.footerLabel };

    values.forEach(({ col, value, isGreen }) => {
        row[col] = {
            v: value,
            t: typeof value === 'number' ? 'n' : 's',
            s: isGreen ? styles.footerValue : styles.footerLabel
        };
    });

    return row;
}

/**
 * Apply merge cells for header rows
 */
function getHeaderMerges(colCount) {
    const lastCol = colCount - 1;
    return [
        { s: { r: 0, c: 0 }, e: { r: 0, c: lastCol } },  // Title
        { s: { r: 1, c: 0 }, e: { r: 1, c: lastCol } },  // Subtitle
        { s: { r: 2, c: 0 }, e: { r: 2, c: lastCol } },  // Period
        { s: { r: 3, c: 0 }, e: { r: 3, c: lastCol } },  // Date
    ];
}

/**
 * Find and create merges for section title rows
 * @param {Array} wsData - Worksheet data
 * @param {number} colCount - Total column count
 * @returns {Array} Array of merge ranges for section titles
 */
function getSectionTitleMerges(wsData, colCount) {
    const merges = [];
    const lastCol = colCount - 1;

    wsData.forEach((row, rowIdx) => {
        if (!row || !row[0]) return;
        const firstCell = row[0];
        const value = typeof firstCell === 'object' ? firstCell.v : firstCell;

        // Check if this is a section title (starts with I., II., III., etc.)
        if (typeof value === 'string' && value.match(/^[IVX]+\./)) {
            merges.push({ s: { r: rowIdx, c: 0 }, e: { r: rowIdx, c: lastCol } });
        }
    });

    return merges;
}

// ============================================================
// REVENUE REPORT EXPORT
// ============================================================
export async function exportRevenueReport(data, period) {
    if (!data) throw new Error('Không có dữ liệu để xuất');

    const XLSX = await import('xlsx-js-style');
    const styles = createExcelStyles();
    const wsData = [];

    // Fixed column count = 4 (STT, Tên, Giá trị, Tỷ lệ/Số GD)
    const COL_COUNT = 4;
    const today = new Date();

    // ============ HEADER SECTION ============
    const periodText = `Kỳ báo cáo: ${period?.startDate || 'N/A'} - ${period?.endDate || 'N/A'}`;
    const headerRows = createHeaderRows('BÁO CÁO DOANH THU', 'TRUNG TÂM ĐÀO TẠO SKILL MASTER', periodText, COL_COUNT, styles);
    wsData.push(...headerRows);
    wsData.push(createEmptyRow(COL_COUNT, {}));

    // ============ SUMMARY BOX ============
    const summaryRow1 = createEmptyRow(COL_COUNT, styles.summaryBox);
    summaryRow1[0] = { v: 'TỔNG DOANH THU:', s: styles.summaryLabel };
    summaryRow1[1] = { v: data.summary?.totalRevenue || 0, t: 'n', s: styles.summaryValue };
    summaryRow1[2] = { v: 'SỐ GIAO DỊCH:', s: styles.summaryLabel };
    summaryRow1[3] = { v: data.summary?.totalTransactions || 0, t: 'n', s: styles.summaryValue };
    wsData.push(summaryRow1);

    const summaryRow2 = createEmptyRow(COL_COUNT, styles.summaryBox);
    const growthVal = data.summary?.growthPercent || 0;
    summaryRow2[0] = { v: 'TĂNG TRƯỞNG:', s: styles.summaryLabel };
    summaryRow2[1] = { v: `${growthVal >= 0 ? '+' : ''}${growthVal}%`, s: growthVal >= 0 ? styles.good : styles.bad };
    summaryRow2[2] = { v: '', s: styles.summaryBox };
    summaryRow2[3] = { v: '', s: styles.summaryBox };
    wsData.push(summaryRow2);
    wsData.push(createEmptyRow(COL_COUNT, {}));

    // ============ REVENUE BY TIME ============
    let totalRevenue = 0;
    let totalCount = 0;

    if (data.chartData?.length > 0) {
        wsData.push(createSectionTitleRow('I. DOANH THU THEO THỜI GIAN', COL_COUNT, styles));
        wsData.push(createEmptyRow(COL_COUNT, {}));
        wsData.push([
            { v: 'STT', s: styles.header },
            { v: 'Ngày', s: styles.header },
            { v: 'Doanh thu (VNĐ)', s: styles.header },
            { v: 'Số giao dịch', s: styles.header },
        ]);

        data.chartData.forEach((item, idx) => {
            const altBg = idx % 2 === 1 ? { fill: styles.altRowBg } : {};
            wsData.push([
                { v: idx + 1, t: 'n', s: { ...styles.cellCenter, ...altBg } },
                { v: item.date, s: { ...styles.cellCenter, ...altBg } },
                { v: item.revenue || 0, t: 'n', s: { ...styles.cellCurrency, ...altBg } },
                { v: item.count || 0, t: 'n', s: { ...styles.cellNumber, ...altBg } },
            ]);
            totalRevenue += item.revenue || 0;
            totalCount += item.count || 0;
        });

        // Footer row
        wsData.push([
            { v: '', s: styles.footerLabel },
            { v: 'TỔNG CỘNG', s: styles.footerLabel },
            { v: totalRevenue, t: 'n', s: styles.footerValue },
            { v: totalCount, t: 'n', s: styles.footerValue },
        ]);
        wsData.push(createEmptyRow(COL_COUNT, {}));
        wsData.push(createEmptyRow(COL_COUNT, {}));
    }

    // ============ REVENUE BY PAYMENT METHOD ============
    if (data.byPaymentMethod?.length > 0) {
        wsData.push(createSectionTitleRow('II. THEO PHƯƠNG THỨC THANH TOÁN', COL_COUNT, styles));
        wsData.push(createEmptyRow(COL_COUNT, {}));
        wsData.push([
            { v: 'STT', s: styles.header },
            { v: 'Phương thức', s: styles.header },
            { v: 'Doanh thu (VNĐ)', s: styles.header },
            { v: 'Tỷ lệ (%)', s: styles.header },
        ]);

        const totalPM = data.byPaymentMethod.reduce((sum, i) => sum + (i.value || 0), 0);
        data.byPaymentMethod.forEach((item, idx) => {
            const pct = totalPM > 0 ? ((item.value / totalPM) * 100).toFixed(1) : 0;
            const altBg = idx % 2 === 1 ? { fill: styles.altRowBg } : {};
            wsData.push([
                { v: idx + 1, t: 'n', s: { ...styles.cellCenter, ...altBg } },
                { v: PAYMENT_METHOD_LABELS[item.name] || item.name, s: { ...styles.cellText, ...altBg } },
                { v: item.value || 0, t: 'n', s: { ...styles.cellCurrency, ...altBg } },
                { v: `${pct}%`, s: { ...styles.cellCenter, ...altBg } },
            ]);
        });

        // Footer
        wsData.push([
            { v: '', s: styles.footerLabel },
            { v: 'TỔNG CỘNG', s: styles.footerLabel },
            { v: totalPM, t: 'n', s: styles.footerValue },
            { v: '100%', s: styles.footerValue },
        ]);
        wsData.push(createEmptyRow(COL_COUNT, {}));
        wsData.push(createEmptyRow(COL_COUNT, {}));
    }

    // ============ REVENUE BY COURSE ============
    if (data.byCourse?.length > 0) {
        wsData.push(createSectionTitleRow('III. THEO KHÓA HỌC', COL_COUNT, styles));
        wsData.push(createEmptyRow(COL_COUNT, {}));
        wsData.push([
            { v: 'STT', s: styles.header },
            { v: 'Khóa học', s: styles.header },
            { v: 'Doanh thu (VNĐ)', s: styles.header },
            { v: 'Tỷ lệ (%)', s: styles.header },
        ]);

        const totalCourse = data.byCourse.reduce((sum, i) => sum + (i.value || 0), 0);
        data.byCourse.forEach((item, idx) => {
            const pct = totalCourse > 0 ? ((item.value / totalCourse) * 100).toFixed(1) : 0;
            const altBg = idx % 2 === 1 ? { fill: styles.altRowBg } : {};
            wsData.push([
                { v: idx + 1, t: 'n', s: { ...styles.cellCenter, ...altBg } },
                { v: item.name, s: { ...styles.cellText, ...altBg } },
                { v: item.value || 0, t: 'n', s: { ...styles.cellCurrency, ...altBg } },
                { v: `${pct}%`, s: { ...styles.cellCenter, ...altBg } },
            ]);
        });

        // Footer
        wsData.push([
            { v: '', s: styles.footerLabel },
            { v: 'TỔNG CỘNG', s: styles.footerLabel },
            { v: totalCourse, t: 'n', s: styles.footerValue },
            { v: '100%', s: styles.footerValue },
        ]);
    }

    // ============ SIGNATURE SECTION ============
    wsData.push(createEmptyRow(COL_COUNT, {}));
    wsData.push(createEmptyRow(COL_COUNT, {}));
    wsData.push(createEmptyRow(COL_COUNT, {}));
    const signatureRows = createSignatureRows(COL_COUNT, styles);
    wsData.push(...signatureRows);

    // ============ CREATE WORKSHEET ============
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Merge cells for headers and section titles
    const headerMerges = getHeaderMerges(COL_COUNT);
    const sectionMerges = getSectionTitleMerges(wsData, COL_COUNT);
    ws['!merges'] = [...headerMerges, ...sectionMerges];

    // Auto-fit column widths với merge awareness
    ws['!cols'] = autoFitColumns(wsData, [
        { min: 5, max: 8, default: 6 },    // STT
        { min: 25, max: 45, default: 35 }, // Text column (Khóa học, Phương thức)
        { min: 15, max: 25, default: 18 }, // Currency/Value
        { min: 10, max: 18, default: 12 }, // Percent/Number
    ], ws['!merges']);

    // Row heights for header
    ws['!rows'] = [
        { hpt: 30 },  // Title
        { hpt: 22 },  // Subtitle
        { hpt: 18 },  // Info 1
        { hpt: 16 },  // Info 2
    ];

    // Create workbook and download
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Doanh thu');

    const dateStr = today.toISOString().split('T')[0];
    XLSX.writeFile(wb, `BaoCao_DoanhThu_${dateStr}.xlsx`);
}

// ============================================================
// ENROLLMENT REPORT EXPORT
// ============================================================
export async function exportEnrollmentReport(data, period) {
    if (!data) throw new Error('Không có dữ liệu để xuất');

    const XLSX = await import('xlsx-js-style');
    const styles = createExcelStyles();
    const wsData = [];

    // Section I: 4 columns, Section II: 6 columns
    // Use 6 columns for consistency
    const COL_COUNT = 6;
    const today = new Date();

    // ============ HEADER SECTION ============
    const periodText = `Kỳ báo cáo: ${period?.startDate || 'N/A'} - ${period?.endDate || 'N/A'}`;
    const headerRows = createHeaderRows('BÁO CÁO TUYỂN SINH', 'TRUNG TÂM ĐÀO TẠO SKILL MASTER', periodText, COL_COUNT, styles);
    wsData.push(...headerRows);
    wsData.push(createEmptyRow(COL_COUNT, {}));

    // ============ SUMMARY BOX ============
    const summaryRow1 = createEmptyRow(COL_COUNT, styles.summaryBox);
    summaryRow1[0] = { v: 'TỔNG GHI DANH:', s: styles.summaryLabel };
    summaryRow1[1] = { v: data.summary?.totalEnrollments || 0, t: 'n', s: styles.summaryValue };
    summaryRow1[2] = { v: 'ĐANG HỌC:', s: styles.summaryLabel };
    summaryRow1[3] = { v: data.summary?.activeEnrollments || 0, t: 'n', s: styles.summaryValue };
    summaryRow1[4] = { v: 'TỶ LỆ NGHỈ:', s: styles.summaryLabel };
    summaryRow1[5] = { v: `${data.summary?.dropRate || 0}%`, s: styles.summaryBad };
    wsData.push(summaryRow1);
    wsData.push(createEmptyRow(COL_COUNT, {}));

    // ============ ENROLLMENT BY COURSE ============
    if (data.byCourse?.length > 0) {
        wsData.push(createSectionTitleRow('I. THỐNG KÊ THEO KHÓA HỌC', COL_COUNT, styles));
        wsData.push(createEmptyRow(COL_COUNT, {}));

        // Section I uses 4 columns
        const headerRow = createEmptyRow(COL_COUNT, styles.header);
        headerRow[0] = { v: 'STT', s: styles.header };
        headerRow[1] = { v: 'Khóa học', s: styles.header };
        headerRow[2] = { v: 'Số lượng', s: styles.header };
        headerRow[3] = { v: 'Tỷ lệ (%)', s: styles.header };
        wsData.push(headerRow);

        const total = data.byCourse.reduce((sum, i) => sum + (i.value || 0), 0);
        data.byCourse.forEach((item, idx) => {
            const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
            const altBg = idx % 2 === 1 ? { fill: styles.altRowBg } : {};
            const row = createEmptyRow(COL_COUNT, altBg);
            row[0] = { v: idx + 1, t: 'n', s: { ...styles.cellCenter, ...altBg } };
            row[1] = { v: item.name, s: { ...styles.cellText, ...altBg } };
            row[2] = { v: item.value || 0, t: 'n', s: { ...styles.cellNumber, ...altBg } };
            row[3] = { v: `${pct}%`, s: { ...styles.cellCenter, ...altBg } };
            wsData.push(row);
        });

        // Footer
        const footerRow = createEmptyRow(COL_COUNT, styles.footerLabel);
        footerRow[1] = { v: 'TỔNG CỘNG', s: styles.footerLabel };
        footerRow[2] = { v: total, t: 'n', s: styles.footerValue };
        footerRow[3] = { v: '100%', s: styles.footerValue };
        wsData.push(footerRow);
        wsData.push(createEmptyRow(COL_COUNT, {}));
        wsData.push(createEmptyRow(COL_COUNT, {}));
    }

    // ============ RECENT ENROLLMENTS ============
    if (data.recentEnrollments?.length > 0) {
        wsData.push(createSectionTitleRow('II. GHI DANH GẦN ĐÂY', COL_COUNT, styles));
        wsData.push(createEmptyRow(COL_COUNT, {}));
        wsData.push([
            { v: 'STT', s: styles.header },
            { v: 'Học viên', s: styles.header },
            { v: 'Email', s: styles.header },
            { v: 'Khóa học', s: styles.header },
            { v: 'Lớp', s: styles.header },
            { v: 'Ngày ghi danh', s: styles.header },
        ]);

        data.recentEnrollments.forEach((item, idx) => {
            const altBg = idx % 2 === 1 ? { fill: styles.altRowBg } : {};
            wsData.push([
                { v: idx + 1, t: 'n', s: { ...styles.cellCenter, ...altBg } },
                { v: item.studentName || 'N/A', s: { ...styles.cellText, ...altBg } },
                { v: item.studentEmail || '', s: { ...styles.cellText, ...altBg } },
                { v: item.courseName || 'N/A', s: { ...styles.cellText, ...altBg } },
                { v: item.className || 'N/A', s: { ...styles.cellCenter, ...altBg } },
                { v: formatDateVN(item.createdAt), s: { ...styles.cellCenter, ...altBg } },
            ]);
        });

        // Footer
        const footerRow = createEmptyRow(COL_COUNT, styles.footerLabel);
        footerRow[1] = { v: 'TỔNG CỘNG', s: styles.footerLabel };
        footerRow[2] = { v: data.recentEnrollments.length, t: 'n', s: styles.footerValue };
        footerRow[3] = { v: 'học viên', s: styles.footerLabel };
        wsData.push(footerRow);
    }

    // ============ SIGNATURE SECTION ============
    wsData.push(createEmptyRow(COL_COUNT, {}));
    wsData.push(createEmptyRow(COL_COUNT, {}));
    wsData.push(createEmptyRow(COL_COUNT, {}));
    const signatureRows = createSignatureRows(COL_COUNT, styles);
    wsData.push(...signatureRows);

    // ============ CREATE WORKSHEET ============
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Merge cells for headers and section titles
    const headerMerges = getHeaderMerges(COL_COUNT);
    const sectionMerges = getSectionTitleMerges(wsData, COL_COUNT);
    ws['!merges'] = [...headerMerges, ...sectionMerges];

    // Auto-fit column widths với merge awareness
    ws['!cols'] = autoFitColumns(wsData, [
        { min: 5, max: 8, default: 6 },     // STT
        { min: 20, max: 35, default: 25 },  // Học viên
        { min: 25, max: 40, default: 32 },  // Email
        { min: 25, max: 40, default: 30 },  // Khóa học
        { min: 18, max: 28, default: 22 },  // Lớp
        { min: 12, max: 18, default: 15 },  // Ngày ghi danh
    ], ws['!merges']);

    // Row heights for header
    ws['!rows'] = [
        { hpt: 30 },  // Title
        { hpt: 22 },  // Subtitle
        { hpt: 18 },  // Info 1
        { hpt: 16 },  // Info 2
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tuyển sinh');

    const dateStr = today.toISOString().split('T')[0];
    XLSX.writeFile(wb, `BaoCao_TuyenSinh_${dateStr}.xlsx`);
}

// ============================================================
// ATTENDANCE REPORT EXPORT
// ============================================================
export async function exportAttendanceReport(data, period) {
    if (!data) throw new Error('Không có dữ liệu để xuất');

    const XLSX = await import('xlsx-js-style');
    const styles = createExcelStyles();
    const wsData = [];

    // Use 5 columns for consistency
    const COL_COUNT = 5;
    const today = new Date();

    // ============ HEADER SECTION ============
    const periodText = `Kỳ báo cáo: ${period?.startDate || 'N/A'} - ${period?.endDate || 'N/A'}`;
    const headerRows = createHeaderRows('BÁO CÁO CHUYÊN CẦN', 'TRUNG TÂM ĐÀO TẠO SKILL MASTER', periodText, COL_COUNT, styles);
    wsData.push(...headerRows);
    wsData.push(createEmptyRow(COL_COUNT, {}));

    // ============ SUMMARY BOX ============
    const attendRate = data.summary?.attendanceRate || 0;
    const summaryRow1 = createEmptyRow(COL_COUNT, styles.summaryBox);
    summaryRow1[0] = { v: 'TỶ LỆ ĐI HỌC:', s: styles.summaryLabel };
    summaryRow1[1] = { v: `${attendRate}%`, s: attendRate >= 80 ? styles.good : styles.bad };
    summaryRow1[2] = { v: '', s: styles.summaryBox };
    summaryRow1[3] = { v: 'TỔNG BUỔI HỌC:', s: styles.summaryLabel };
    summaryRow1[4] = { v: data.summary?.totalRecords || 0, t: 'n', s: styles.summaryValue };
    wsData.push(summaryRow1);
    wsData.push(createEmptyRow(COL_COUNT, {}));

    // ============ ATTENDANCE BY STATUS ============
    if (data.byStatus?.length > 0) {
        wsData.push(createSectionTitleRow('I. THỐNG KÊ THEO TRẠNG THÁI', COL_COUNT, styles));
        wsData.push(createEmptyRow(COL_COUNT, {}));

        // 4 columns for this section
        const headerRow = createEmptyRow(COL_COUNT, styles.header);
        headerRow[0] = { v: 'STT', s: styles.header };
        headerRow[1] = { v: 'Trạng thái', s: styles.header };
        headerRow[2] = { v: 'Số lượng', s: styles.header };
        headerRow[3] = { v: 'Tỷ lệ (%)', s: styles.header };
        wsData.push(headerRow);

        const total = data.byStatus.reduce((sum, i) => sum + (i.value || 0), 0);
        data.byStatus.forEach((item, idx) => {
            const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
            const altBg = idx % 2 === 1 ? { fill: styles.altRowBg } : {};
            const row = createEmptyRow(COL_COUNT, altBg);
            row[0] = { v: idx + 1, t: 'n', s: { ...styles.cellCenter, ...altBg } };
            row[1] = { v: item.name, s: { ...styles.cellText, ...altBg } };
            row[2] = { v: item.value || 0, t: 'n', s: { ...styles.cellNumber, ...altBg } };
            row[3] = { v: `${pct}%`, s: { ...styles.cellCenter, ...altBg } };
            wsData.push(row);
        });

        // Footer
        const footerRow = createEmptyRow(COL_COUNT, styles.footerLabel);
        footerRow[1] = { v: 'TỔNG CỘNG', s: styles.footerLabel };
        footerRow[2] = { v: total, t: 'n', s: styles.footerValue };
        footerRow[3] = { v: '100%', s: styles.footerValue };
        wsData.push(footerRow);
        wsData.push(createEmptyRow(COL_COUNT, {}));
        wsData.push(createEmptyRow(COL_COUNT, {}));
    }

    // ============ LOW ATTENDANCE STUDENTS ============
    if (data.lowAttendanceStudents?.length > 0) {
        wsData.push(createSectionTitleRow('II. HỌC VIÊN CẦN CHÚ Ý (Tỷ lệ < 70%)', COL_COUNT, styles));
        wsData.push(createEmptyRow(COL_COUNT, {}));
        wsData.push([
            { v: 'STT', s: styles.header },
            { v: 'Học viên', s: styles.header },
            { v: 'Tổng buổi', s: styles.header },
            { v: 'Có mặt', s: styles.header },
            { v: 'Tỷ lệ', s: styles.header },
        ]);

        data.lowAttendanceStudents.forEach((item, idx) => {
            const altBg = idx % 2 === 1 ? { fill: styles.altRowBg } : {};
            wsData.push([
                { v: idx + 1, t: 'n', s: { ...styles.cellCenter, ...altBg } },
                { v: item.name || 'N/A', s: { ...styles.cellText, ...altBg } },
                { v: item.total || 0, t: 'n', s: { ...styles.cellNumber, ...altBg } },
                { v: item.present || 0, t: 'n', s: { ...styles.cellNumber, ...altBg } },
                { v: `${item.rate || 0}%`, s: styles.bad },
            ]);
        });

        // Footer
        wsData.push([
            { v: '', s: styles.footerLabel },
            { v: 'TỔNG CỘNG', s: styles.footerLabel },
            { v: data.lowAttendanceStudents.length, t: 'n', s: styles.footerValue },
            { v: 'học viên', s: styles.footerLabel },
            { v: '', s: styles.footerLabel },
        ]);
    }

    // ============ SIGNATURE SECTION ============
    wsData.push(createEmptyRow(COL_COUNT, {}));
    wsData.push(createEmptyRow(COL_COUNT, {}));
    wsData.push(createEmptyRow(COL_COUNT, {}));
    const signatureRows = createSignatureRows(COL_COUNT, styles);
    wsData.push(...signatureRows);

    // ============ CREATE WORKSHEET ============
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Merge cells for headers and section titles
    const headerMerges = getHeaderMerges(COL_COUNT);
    const sectionMerges = getSectionTitleMerges(wsData, COL_COUNT);
    ws['!merges'] = [...headerMerges, ...sectionMerges];

    // Auto-fit column widths với merge awareness
    ws['!cols'] = autoFitColumns(wsData, [
        { min: 5, max: 8, default: 6 },     // STT
        { min: 25, max: 40, default: 30 },  // Học viên / Trạng thái
        { min: 12, max: 18, default: 14 },  // Tổng buổi
        { min: 12, max: 18, default: 14 },  // Có mặt
        { min: 10, max: 15, default: 12 },  // Tỷ lệ
    ], ws['!merges']);

    // Row heights
    ws['!rows'] = [
        { hpt: 30 },  // Title
        { hpt: 22 },  // Subtitle
        { hpt: 18 },  // Info 1
        { hpt: 16 },  // Info 2
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Chuyên cần');

    const dateStr = today.toISOString().split('T')[0];
    XLSX.writeFile(wb, `BaoCao_ChuyenCan_${dateStr}.xlsx`);
}

// ============================================================
// GRADES REPORT EXPORT
// ============================================================
export async function exportGradesReport(data) {
    if (!data) throw new Error('Không có dữ liệu để xuất');

    const XLSX = await import('xlsx-js-style');
    const styles = createExcelStyles();
    const wsData = [];

    // Use 5 columns for consistency
    const COL_COUNT = 5;
    const today = new Date();

    // ============ HEADER SECTION ============
    const headerRows = createHeaderRows('BÁO CÁO KẾT QUẢ HỌC TẬP', 'TRUNG TÂM ĐÀO TẠO SKILL MASTER', '', COL_COUNT, styles);
    // Remove period row since grades report doesn't use period
    headerRows.splice(2, 1);
    wsData.push(...headerRows);
    wsData.push(createEmptyRow(COL_COUNT, {}));

    // ============ SUMMARY BOX ============
    const passRate = data.summary?.passRate || 0;
    const summaryRow1 = createEmptyRow(COL_COUNT, styles.summaryBox);
    summaryRow1[0] = { v: 'TỶ LỆ ĐẬU:', s: styles.summaryLabel };
    summaryRow1[1] = { v: `${passRate}%`, s: passRate >= 70 ? styles.good : styles.bad };
    summaryRow1[2] = { v: '', s: styles.summaryBox };
    summaryRow1[3] = { v: 'ĐIỂM TB:', s: styles.summaryLabel };
    summaryRow1[4] = { v: data.summary?.avgScore || 0, t: 'n', s: styles.summaryValue };
    wsData.push(summaryRow1);

    const summaryRow2 = createEmptyRow(COL_COUNT, styles.summaryBox);
    summaryRow2[0] = { v: 'ĐIỂM CAO NHẤT:', s: styles.summaryLabel };
    summaryRow2[1] = { v: data.summary?.maxScore || 0, t: 'n', s: styles.good };
    summaryRow2[2] = { v: '', s: styles.summaryBox };
    summaryRow2[3] = { v: 'ĐIỂM THẤP NHẤT:', s: styles.summaryLabel };
    summaryRow2[4] = { v: data.summary?.minScore || 0, t: 'n', s: styles.summaryBad };
    wsData.push(summaryRow2);
    wsData.push(createEmptyRow(COL_COUNT, {}));

    // ============ SCORE DISTRIBUTION ============
    if (data.distribution?.length > 0) {
        wsData.push(createSectionTitleRow('I. PHÂN BỐ ĐIỂM', COL_COUNT, styles));
        wsData.push(createEmptyRow(COL_COUNT, {}));

        // 4 columns for this section
        const headerRow = createEmptyRow(COL_COUNT, styles.header);
        headerRow[0] = { v: 'STT', s: styles.header };
        headerRow[1] = { v: 'Khoảng điểm', s: styles.header };
        headerRow[2] = { v: 'Số học viên', s: styles.header };
        headerRow[3] = { v: 'Tỷ lệ (%)', s: styles.header };
        wsData.push(headerRow);

        const total = data.distribution.reduce((sum, i) => sum + (i.count || 0), 0);
        data.distribution.forEach((item, idx) => {
            const pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : 0;
            const altBg = idx % 2 === 1 ? { fill: styles.altRowBg } : {};
            const row = createEmptyRow(COL_COUNT, altBg);
            row[0] = { v: idx + 1, t: 'n', s: { ...styles.cellCenter, ...altBg } };
            row[1] = { v: item.range, s: { ...styles.cellCenter, ...altBg } };
            row[2] = { v: item.count || 0, t: 'n', s: { ...styles.cellNumber, ...altBg } };
            row[3] = { v: `${pct}%`, s: { ...styles.cellCenter, ...altBg } };
            wsData.push(row);
        });

        // Footer
        const footerRow = createEmptyRow(COL_COUNT, styles.footerLabel);
        footerRow[1] = { v: 'TỔNG CỘNG', s: styles.footerLabel };
        footerRow[2] = { v: total, t: 'n', s: styles.footerValue };
        footerRow[3] = { v: '100%', s: styles.footerValue };
        wsData.push(footerRow);
        wsData.push(createEmptyRow(COL_COUNT, {}));
        wsData.push(createEmptyRow(COL_COUNT, {}));
    }

    // ============ TOP STUDENTS ============
    if (data.topStudents?.length > 0) {
        wsData.push(createSectionTitleRow('II. TOP HỌC VIÊN XUẤT SẮC', COL_COUNT, styles));
        wsData.push(createEmptyRow(COL_COUNT, {}));
        wsData.push([
            { v: 'STT', s: styles.header },
            { v: 'Học viên', s: styles.header },
            { v: 'Khóa học', s: styles.header },
            { v: 'Điểm', s: styles.header },
            { v: 'Kết quả', s: styles.header },
        ]);

        data.topStudents.forEach((item, idx) => {
            const altBg = idx % 2 === 1 ? { fill: styles.altRowBg } : {};
            wsData.push([
                { v: idx + 1, t: 'n', s: { ...styles.cellCenter, ...altBg } },
                { v: item.studentName || 'N/A', s: { ...styles.cellText, ...altBg } },
                { v: item.courseName || 'N/A', s: { ...styles.cellText, ...altBg } },
                { v: item.finalScore || 0, t: 'n', s: { ...styles.cellNumber, ...altBg } },
                { v: item.passed ? 'Đạt' : 'Không đạt', s: item.passed ? styles.good : styles.bad },
            ]);
        });
        wsData.push(createEmptyRow(COL_COUNT, {}));
        wsData.push(createEmptyRow(COL_COUNT, {}));
    }

    // ============ LOW SCORE STUDENTS ============
    if (data.lowScoreStudents?.length > 0) {
        wsData.push(createSectionTitleRow('III. HỌC VIÊN CẦN HỖ TRỢ', COL_COUNT, styles));
        wsData.push(createEmptyRow(COL_COUNT, {}));

        // 4 columns for this section
        const headerRow = createEmptyRow(COL_COUNT, styles.header);
        headerRow[0] = { v: 'STT', s: styles.header };
        headerRow[1] = { v: 'Học viên', s: styles.header };
        headerRow[2] = { v: 'Khóa học', s: styles.header };
        headerRow[3] = { v: 'Điểm', s: styles.header };
        wsData.push(headerRow);

        data.lowScoreStudents.forEach((item, idx) => {
            const altBg = idx % 2 === 1 ? { fill: styles.altRowBg } : {};
            const row = createEmptyRow(COL_COUNT, altBg);
            row[0] = { v: idx + 1, t: 'n', s: { ...styles.cellCenter, ...altBg } };
            row[1] = { v: item.studentName || 'N/A', s: { ...styles.cellText, ...altBg } };
            row[2] = { v: item.courseName || 'N/A', s: { ...styles.cellText, ...altBg } };
            row[3] = { v: item.finalScore || 0, t: 'n', s: styles.bad };
            wsData.push(row);
        });

        // Footer
        const footerRow = createEmptyRow(COL_COUNT, styles.footerLabel);
        footerRow[1] = { v: 'TỔNG CỘNG', s: styles.footerLabel };
        footerRow[2] = { v: data.lowScoreStudents.length, t: 'n', s: styles.footerValue };
        footerRow[3] = { v: 'học viên', s: styles.footerLabel };
        wsData.push(footerRow);
    }

    // ============ SIGNATURE SECTION ============
    wsData.push(createEmptyRow(COL_COUNT, {}));
    wsData.push(createEmptyRow(COL_COUNT, {}));
    wsData.push(createEmptyRow(COL_COUNT, {}));
    const signatureRows = createSignatureRows(COL_COUNT, styles);
    wsData.push(...signatureRows);

    // ============ CREATE WORKSHEET ============
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Merge cells for headers and section titles (only 3 header rows for grades)
    const headerMerges = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: COL_COUNT - 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: COL_COUNT - 1 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: COL_COUNT - 1 } },
    ];
    const sectionMerges = getSectionTitleMerges(wsData, COL_COUNT);
    ws['!merges'] = [...headerMerges, ...sectionMerges];

    // Auto-fit column widths với merge awareness - INCREASED FOR FULL DISPLAY
    ws['!cols'] = autoFitColumns(wsData, [
        { min: 6, max: 10, default: 8 },     // STT - increased
        { min: 25, max: 45, default: 35 },   // Học viên - increased
        { min: 30, max: 50, default: 40 },   // Khóa học - increased
        { min: 12, max: 18, default: 15 },   // Điểm - increased
        { min: 15, max: 22, default: 18 },   // Kết quả - increased
    ], ws['!merges']);

    // Row heights
    ws['!rows'] = [
        { hpt: 30 },  // Title
        { hpt: 22 },  // Subtitle
        { hpt: 16 },  // Info
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Kết quả học tập');

    const dateStr = today.toISOString().split('T')[0];
    XLSX.writeFile(wb, `BaoCao_KetQuaHocTap_${dateStr}.xlsx`);
}

// ============================================================
// STAFF REPORT EXPORT
// ============================================================
export async function exportStaffReport(data, period) {
    if (!data) throw new Error('Không có dữ liệu để xuất');

    const XLSX = await import('xlsx-js-style');
    const styles = createExcelStyles();
    const wsData = [];

    // Use 7 columns for staff data
    const COL_COUNT = 7;
    const today = new Date();

    // ============ HEADER SECTION ============
    const periodText = `Kỳ báo cáo: ${period?.startDate || 'N/A'} - ${period?.endDate || 'N/A'}`;
    const headerRows = createHeaderRows('BÁO CÁO NHÂN SỰ - LƯƠNG', 'TRUNG TÂM ĐÀO TẠO SKILL MASTER', periodText, COL_COUNT, styles);
    wsData.push(...headerRows);
    wsData.push(createEmptyRow(COL_COUNT, {}));

    // ============ SUMMARY BOX ============
    const summaryRow1 = createEmptyRow(COL_COUNT, styles.summaryBox);
    summaryRow1[0] = { v: 'TỔNG NHÂN SỰ:', s: styles.summaryLabel };
    summaryRow1[1] = { v: data.summary?.totalStaff || 0, t: 'n', s: styles.summaryValue };
    summaryRow1[2] = { v: '', s: styles.summaryBox };
    summaryRow1[3] = { v: 'GIÁO VIÊN:', s: styles.summaryLabel };
    summaryRow1[4] = { v: data.summary?.teachers || 0, t: 'n', s: styles.summaryValue };
    summaryRow1[5] = { v: 'TỔNG GIỜ DẠY:', s: styles.summaryLabel };
    summaryRow1[6] = { v: `${data.summary?.totalHours || 0}h`, s: styles.summaryValue };
    wsData.push(summaryRow1);
    wsData.push(createEmptyRow(COL_COUNT, {}));

    // ============ STAFF LIST ============
    let totalSessions = 0;
    let totalHours = 0;
    let totalPay = 0;

    if (data.staffList?.length > 0) {
        wsData.push(createSectionTitleRow('I. BẢNG CHẤM CÔNG VÀ LƯƠNG', COL_COUNT, styles));
        wsData.push(createEmptyRow(COL_COUNT, {}));
        wsData.push([
            { v: 'STT', s: styles.header },
            { v: 'Họ và tên', s: styles.header },
            { v: 'Email', s: styles.header },
            { v: 'Chức vụ', s: styles.header },
            { v: 'Số buổi', s: styles.header },
            { v: 'Số giờ', s: styles.header },
            { v: 'Lương (VNĐ)', s: styles.header },
        ]);

        data.staffList.forEach((item, idx) => {
            const altBg = idx % 2 === 1 ? { fill: styles.altRowBg } : {};
            wsData.push([
                { v: idx + 1, t: 'n', s: { ...styles.cellCenter, ...altBg } },
                { v: item.name || 'N/A', s: { ...styles.cellText, ...altBg } },
                { v: item.email || '', s: { ...styles.cellText, ...altBg } },
                { v: item.role || 'N/A', s: { ...styles.cellCenter, ...altBg } },
                { v: item.sessions || 0, t: 'n', s: { ...styles.cellNumber, ...altBg } },
                { v: item.hours || 0, t: 'n', s: { ...styles.cellNumber, ...altBg } },
                { v: item.totalPay || 0, t: 'n', s: { ...styles.cellCurrency, ...altBg } },
            ]);
            totalSessions += item.sessions || 0;
            totalHours += item.hours || 0;
            totalPay += item.totalPay || 0;
        });

        // Footer TỔNG CỘNG
        wsData.push([
            { v: '', s: styles.footerLabel },
            { v: '', s: styles.footerLabel },
            { v: '', s: styles.footerLabel },
            { v: 'TỔNG CỘNG', s: styles.footerLabel },
            { v: totalSessions, t: 'n', s: styles.footerValue },
            { v: totalHours, t: 'n', s: styles.footerValue },
            { v: totalPay, t: 'n', s: styles.footerValue },
        ]);
    }

    // ============ SIGNATURE SECTION ============
    wsData.push(createEmptyRow(COL_COUNT, {}));
    wsData.push(createEmptyRow(COL_COUNT, {}));
    wsData.push(createEmptyRow(COL_COUNT, {}));
    const signatureRows = createSignatureRows(COL_COUNT, styles);
    wsData.push(...signatureRows);

    // ============ CREATE WORKSHEET ============
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Merge cells for headers and section titles
    const headerMerges = getHeaderMerges(COL_COUNT);
    const sectionMerges = getSectionTitleMerges(wsData, COL_COUNT);
    ws['!merges'] = [...headerMerges, ...sectionMerges];

    // Auto-fit column widths với merge awareness
    ws['!cols'] = autoFitColumns(wsData, [
        { min: 5, max: 8, default: 6 },     // STT
        { min: 20, max: 35, default: 25 },  // Họ tên
        { min: 25, max: 40, default: 32 },  // Email
        { min: 12, max: 20, default: 15 },  // Chức vụ
        { min: 10, max: 15, default: 12 },  // Số buổi
        { min: 10, max: 15, default: 12 },  // Số giờ
        { min: 15, max: 25, default: 18 },  // Lương
    ], ws['!merges']);

    // Row heights
    ws['!rows'] = [
        { hpt: 30 },  // Title
        { hpt: 22 },  // Subtitle
        { hpt: 18 },  // Info 1
        { hpt: 16 },  // Info 2
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Nhân sự - Lương');

    const dateStr = today.toISOString().split('T')[0];
    XLSX.writeFile(wb, `BaoCao_NhanSu_${dateStr}.xlsx`);
}

// ============================================================
// COURSES REPORT EXPORT
// ============================================================
export async function exportCoursesReport(data) {
    if (!data) throw new Error('Không có dữ liệu để xuất');

    const XLSX = await import('xlsx-js-style');
    const styles = createExcelStyles();
    const wsData = [];

    // Use 7 columns for course data
    const COL_COUNT = 7;
    const today = new Date();

    // ============ HEADER SECTION ============
    const headerRows = createHeaderRows('BÁO CÁO KHÓA HỌC', 'TRUNG TÂM ĐÀO TẠO SKILL MASTER', '', COL_COUNT, styles);
    // Remove period row since courses report doesn't use period
    headerRows.splice(2, 1);
    wsData.push(...headerRows);
    wsData.push(createEmptyRow(COL_COUNT, {}));

    // ============ SUMMARY BOX ============
    const summaryRow1 = createEmptyRow(COL_COUNT, styles.summaryBox);
    summaryRow1[0] = { v: 'TỔNG KHÓA HỌC:', s: styles.summaryLabel };
    summaryRow1[1] = { v: data.summary?.totalCourses || 0, t: 'n', s: styles.summaryValue };
    summaryRow1[2] = { v: '', s: styles.summaryBox };
    summaryRow1[3] = { v: 'TỔNG LỚP:', s: styles.summaryLabel };
    summaryRow1[4] = { v: data.summary?.totalClasses || 0, t: 'n', s: styles.summaryValue };
    summaryRow1[5] = { v: '', s: styles.summaryBox };
    summaryRow1[6] = { v: '', s: styles.summaryBox };
    wsData.push(summaryRow1);

    const summaryRow2 = createEmptyRow(COL_COUNT, styles.summaryBox);
    summaryRow2[0] = { v: 'TỔNG DOANH THU:', s: styles.summaryLabel };
    summaryRow2[1] = { v: data.summary?.totalRevenue || 0, t: 'n', s: styles.summaryValue };
    summaryRow2[2] = { v: '', s: styles.summaryBox };
    summaryRow2[3] = { v: 'TỔNG HỌC VIÊN:', s: styles.summaryLabel };
    summaryRow2[4] = { v: data.summary?.totalStudents || 0, t: 'n', s: styles.summaryValue };
    summaryRow2[5] = { v: '', s: styles.summaryBox };
    summaryRow2[6] = { v: '', s: styles.summaryBox };
    wsData.push(summaryRow2);
    wsData.push(createEmptyRow(COL_COUNT, {}));

    // ============ COURSE STATS ============
    let totalClasses = 0;
    let totalEnrollments = 0;
    let totalRevenue = 0;

    if (data.courseStats?.length > 0) {
        wsData.push(createSectionTitleRow('I. THỐNG KÊ CHI TIẾT THEO KHÓA HỌC', COL_COUNT, styles));
        wsData.push(createEmptyRow(COL_COUNT, {}));
        wsData.push([
            { v: 'STT', s: styles.header },
            { v: 'Mã', s: styles.header },
            { v: 'Tên khóa học', s: styles.header },
            { v: 'Danh mục', s: styles.header },
            { v: 'Số lớp', s: styles.header },
            { v: 'Học viên', s: styles.header },
            { v: 'Doanh thu (VNĐ)', s: styles.header },
        ]);

        data.courseStats.forEach((item, idx) => {
            const altBg = idx % 2 === 1 ? { fill: styles.altRowBg } : {};
            wsData.push([
                { v: idx + 1, t: 'n', s: { ...styles.cellCenter, ...altBg } },
                { v: item.code || 'N/A', s: { ...styles.cellCenter, ...altBg } },
                { v: item.title || 'N/A', s: { ...styles.cellText, ...altBg } },
                { v: item.category || 'N/A', s: { ...styles.cellCenter, ...altBg } },
                { v: item.totalClasses || 0, t: 'n', s: { ...styles.cellNumber, ...altBg } },
                { v: item.totalEnrollments || 0, t: 'n', s: { ...styles.cellNumber, ...altBg } },
                { v: item.totalRevenue || 0, t: 'n', s: { ...styles.cellCurrency, ...altBg } },
            ]);
            totalClasses += item.totalClasses || 0;
            totalEnrollments += item.totalEnrollments || 0;
            totalRevenue += item.totalRevenue || 0;
        });

        // Footer TỔNG CỘNG
        wsData.push([
            { v: '', s: styles.footerLabel },
            { v: '', s: styles.footerLabel },
            { v: '', s: styles.footerLabel },
            { v: 'TỔNG CỘNG', s: styles.footerLabel },
            { v: totalClasses, t: 'n', s: styles.footerValue },
            { v: totalEnrollments, t: 'n', s: styles.footerValue },
            { v: totalRevenue, t: 'n', s: styles.footerValue },
        ]);
    }

    // ============ SIGNATURE SECTION ============
    wsData.push(createEmptyRow(COL_COUNT, {}));
    wsData.push(createEmptyRow(COL_COUNT, {}));
    wsData.push(createEmptyRow(COL_COUNT, {}));
    const signatureRows = createSignatureRows(COL_COUNT, styles);
    wsData.push(...signatureRows);

    // ============ CREATE WORKSHEET ============
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Merge cells for headers and section titles (only 3 header rows for courses)
    const headerMerges = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: COL_COUNT - 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: COL_COUNT - 1 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: COL_COUNT - 1 } },
    ];
    const sectionMerges = getSectionTitleMerges(wsData, COL_COUNT);
    ws['!merges'] = [...headerMerges, ...sectionMerges];

    // Auto-fit column widths với merge awareness
    ws['!cols'] = autoFitColumns(wsData, [
        { min: 5, max: 8, default: 6 },     // STT
        { min: 10, max: 18, default: 14 },  // Mã khóa học
        { min: 25, max: 45, default: 35 },  // Tên khóa học
        { min: 15, max: 25, default: 18 },  // Danh mục
        { min: 10, max: 15, default: 12 },  // Số lớp
        { min: 10, max: 15, default: 12 },  // Học viên
        { min: 15, max: 25, default: 18 },  // Doanh thu
    ], ws['!merges']);

    // Row heights
    ws['!rows'] = [
        { hpt: 30 },  // Title
        { hpt: 22 },  // Subtitle
        { hpt: 16 },  // Info
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Khóa học');

    const dateStr = today.toISOString().split('T')[0];
    XLSX.writeFile(wb, `BaoCao_KhoaHoc_${dateStr}.xlsx`);
}

// ============================================================
// GENERIC EXPORT FUNCTION
// ============================================================
export async function exportReportToExcel(reportType, data, period) {
    switch (reportType) {
        case 'revenue':
            return exportRevenueReport(data, period);
        case 'enrollment':
            return exportEnrollmentReport(data, period);
        case 'attendance':
            return exportAttendanceReport(data, period);
        case 'grades':
            return exportGradesReport(data);
        case 'staff':
            return exportStaffReport(data, period);
        case 'courses':
            return exportCoursesReport(data);
        default:
            throw new Error(`Loại báo cáo không hỗ trợ: ${reportType}`);
    }
}
