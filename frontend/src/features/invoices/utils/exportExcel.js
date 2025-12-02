/**
 * Export Invoices to Excel
 * 
 * Utility function xử lý xuất file Excel với format chuẩn kế toán Việt Nam.
 * Tách riêng khỏi UI component để:
 * 1. Dễ test độc lập
 * 2. Có thể tái sử dụng ở nhiều nơi
 * 3. Không làm phình UI component
 */

import { formatDateVN } from './formatters';

/**
 * Xuất danh sách hóa đơn ra file Excel
 * @param {Array} invoices - Danh sách hóa đơn cần xuất
 */
export async function exportInvoicesToExcel(invoices) {
  if (!invoices || invoices.length === 0) {
    throw new Error('Không có dữ liệu để xuất');
  }

  // Dynamic import xlsx-js-style
  const XLSX = await import('xlsx-js-style');

  // ============================================
  // CALCULATE TOTALS
  // ============================================
  const totalAmount = invoices.reduce((sum, inv) => sum + (inv.final_amount || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0);
  const totalDebt = totalAmount - totalPaid;

  const today = new Date();
  const monthYear = today.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });

  // ============================================
  // STYLES
  // ============================================
  const styles = createExcelStyles();

  // ============================================
  // BUILD WORKSHEET DATA
  // ============================================
  const wsData = [];

  // Header rows
  wsData.push([{ v: 'BÁO CÁO CÔNG NỢ HỌC PHÍ', s: styles.title }]);
  wsData.push([{ v: 'TRUNG TÂM ĐÀO TẠO SKILL MASTER', s: styles.subtitle }]);
  wsData.push([{ v: `Kỳ báo cáo: ${monthYear}`, s: styles.info }]);
  wsData.push([{ v: `Ngày lập: ${today.toLocaleDateString('vi-VN')} | Người lập: Admin`, s: styles.info }]);
  wsData.push([]);

  // Summary row
  const summaryRow = createSummaryRow(totalAmount, totalPaid, totalDebt, styles);
  wsData.push(summaryRow);
  wsData.push([]);

  // Table headers
  const headers = [
    'STT', 'Mã hóa đơn', 'Học viên', 'Email', 'SĐT', 
    'Lớp học', 'Khóa học', 'Học phí', 'Đã thanh toán', 
    'Còn nợ', 'PTTT', 'Trạng thái', 'Ngày tạo', 'Hạn TT'
  ];
  wsData.push(headers.map(h => ({ v: h, s: styles.header })));

  // Data rows
  invoices.forEach((inv, idx) => {
    wsData.push(createDataRow(inv, idx, styles));
  });

  // Footer
  wsData.push([]);
  wsData.push(createFooterRow(totalAmount, totalPaid, totalDebt, styles));

  // Signature section
  wsData.push([]);
  wsData.push([]);
  wsData.push([]);
  wsData.push(createSignatureRow1(styles));
  wsData.push(createSignatureRow2(styles));

  // ============================================
  // CREATE WORKSHEET
  // ============================================
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Merge cells
  const signatureRowIdx = wsData.length - 2;
  const signatureRow2Idx = wsData.length - 1;
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 13 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 13 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 13 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 13 } },
    { s: { r: signatureRowIdx, c: 1 }, e: { r: signatureRowIdx, c: 3 } },
    { s: { r: signatureRowIdx, c: 10 }, e: { r: signatureRowIdx, c: 12 } },
    { s: { r: signatureRow2Idx, c: 1 }, e: { r: signatureRow2Idx, c: 3 } },
    { s: { r: signatureRow2Idx, c: 10 }, e: { r: signatureRow2Idx, c: 12 } },
  ];

  // Column widths
  ws['!cols'] = [
    { wch: 5 },   // STT
    { wch: 20 },  // Mã hóa đơn
    { wch: 20 },  // Học viên
    { wch: 24 },  // Email
    { wch: 12 },  // SĐT
    { wch: 16 },  // Lớp
    { wch: 26 },  // Khóa học
    { wch: 15 },  // Học phí
    { wch: 15 },  // Đã TT
    { wch: 15 },  // Còn nợ
    { wch: 20 },  // PTTT
    { wch: 12 },  // Trạng thái
    { wch: 12 },  // Ngày tạo
    { wch: 12 },  // Hạn TT
  ];

  // Row heights
  ws['!rows'] = [
    { hpt: 30 },
    { hpt: 22 },
    { hpt: 18 },
    { hpt: 16 },
    { hpt: 8 },
    { hpt: 28 },
    { hpt: 8 },
    { hpt: 26 },
  ];

  // ============================================
  // CREATE WORKBOOK & DOWNLOAD
  // ============================================
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Báo cáo Công nợ');

  const dateStr = today.toISOString().split('T')[0];
  const filename = `BaoCaoCongNo_SkillMaster_${dateStr}.xlsx`;

  XLSX.writeFile(wb, filename);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function createExcelStyles() {
  const thinBorder = {
    top: { style: "thin", color: { rgb: "D1D5DB" } },
    bottom: { style: "thin", color: { rgb: "D1D5DB" } },
    left: { style: "thin", color: { rgb: "D1D5DB" } },
    right: { style: "thin", color: { rgb: "D1D5DB" } },
  };

  return {
    title: {
      font: { bold: true, sz: 16, color: { rgb: "FFFFFF" }, name: "Arial" },
      fill: { fgColor: { rgb: "1E3A8A" } },
      alignment: { horizontal: "center", vertical: "center" },
    },
    subtitle: {
      font: { bold: true, sz: 12, color: { rgb: "1E3A8A" }, name: "Arial" },
      alignment: { horizontal: "center", vertical: "center" },
    },
    info: {
      font: { sz: 10, italic: true, color: { rgb: "6B7280" }, name: "Arial" },
      alignment: { horizontal: "center" },
    },
    header: {
      font: { bold: true, sz: 10, color: { rgb: "FFFFFF" }, name: "Arial" },
      fill: { fgColor: { rgb: "1E40AF" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "medium", color: { rgb: "1E3A8A" } },
        bottom: { style: "medium", color: { rgb: "1E3A8A" } },
        left: { style: "thin", color: { rgb: "3B82F6" } },
        right: { style: "thin", color: { rgb: "3B82F6" } },
      }
    },
    summaryLabel: {
      font: { bold: true, sz: 11, color: { rgb: "1E3A8A" }, name: "Arial" },
      fill: { fgColor: { rgb: "DBEAFE" } },
      alignment: { horizontal: "right", vertical: "center" },
      border: { bottom: { style: "thin", color: { rgb: "93C5FD" } } }
    },
    summaryValue: {
      font: { bold: true, sz: 12, color: { rgb: "047857" }, name: "Arial" },
      fill: { fgColor: { rgb: "DBEAFE" } },
      alignment: { horizontal: "right", vertical: "center" },
      numFmt: '#,##0  ',
      border: { bottom: { style: "thin", color: { rgb: "93C5FD" } } }
    },
    summaryDebt: {
      font: { bold: true, sz: 12, color: { rgb: "DC2626" }, name: "Arial" },
      fill: { fgColor: { rgb: "FEE2E2" } },
      alignment: { horizontal: "right", vertical: "center" },
      numFmt: '#,##0  ',
      border: { bottom: { style: "thin", color: { rgb: "FCA5A5" } } }
    },
    cellText: {
      font: { sz: 10, name: "Arial" },
      alignment: { horizontal: "left", vertical: "center" },
      border: thinBorder,
    },
    cellCenter: {
      font: { sz: 10, name: "Arial" },
      alignment: { horizontal: "center", vertical: "center" },
      border: thinBorder,
    },
    currency: {
      font: { sz: 10, name: "Arial" },
      alignment: { horizontal: "right", vertical: "center" },
      border: thinBorder,
      numFmt: '#,##0  ',
    },
    currencyPaid: {
      font: { sz: 10, name: "Arial", color: { rgb: "047857" } },
      alignment: { horizontal: "right", vertical: "center" },
      border: thinBorder,
      numFmt: '#,##0  ',
    },
    currencyDebt: {
      font: { sz: 10, bold: true, name: "Arial", color: { rgb: "DC2626" } },
      fill: { fgColor: { rgb: "FEF2F2" } },
      alignment: { horizontal: "right", vertical: "center" },
      border: thinBorder,
      numFmt: '#,##0  ',
    },
    currencyZero: {
      font: { sz: 10, name: "Arial", color: { rgb: "9CA3AF" } },
      alignment: { horizontal: "right", vertical: "center" },
      border: thinBorder,
      numFmt: '#,##0  ',
    },
    statusPaid: {
      font: { sz: 9, bold: true, name: "Arial", color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "10B981" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: thinBorder,
    },
    statusUnpaid: {
      font: { sz: 9, bold: true, name: "Arial", color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "EF4444" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: thinBorder,
    },
    statusPartial: {
      font: { sz: 9, bold: true, name: "Arial", color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "F59E0B" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: thinBorder,
    },
    statusCancelled: {
      font: { sz: 9, bold: true, name: "Arial", color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "6B7280" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: thinBorder,
    },
    footerLabel: {
      font: { bold: true, sz: 11, color: { rgb: "1E3A8A" }, name: "Arial" },
      fill: { fgColor: { rgb: "E0E7FF" } },
      alignment: { horizontal: "right", vertical: "center" },
      border: {
        top: { style: "medium", color: { rgb: "1E3A8A" } },
        bottom: { style: "medium", color: { rgb: "1E3A8A" } },
      }
    },
    footerValue: {
      font: { bold: true, sz: 11, name: "Arial" },
      fill: { fgColor: { rgb: "E0E7FF" } },
      alignment: { horizontal: "right", vertical: "center" },
      numFmt: '#,##0  ',
      border: {
        top: { style: "medium", color: { rgb: "1E3A8A" } },
        bottom: { style: "medium", color: { rgb: "1E3A8A" } },
      }
    },
    signatureLabel: {
      font: { bold: true, sz: 10, color: { rgb: "374151" }, name: "Arial" },
      alignment: { horizontal: "center", vertical: "center" },
    },
    signatureLine: {
      font: { italic: true, sz: 9, color: { rgb: "6B7280" }, name: "Arial" },
      alignment: { horizontal: "center", vertical: "center" },
    },
  };
}

function createSummaryRow(totalAmount, totalPaid, totalDebt, styles) {
  const row = [];
  for (let i = 0; i < 14; i++) row.push({ v: '', s: {} });
  row[1] = { v: 'TỔNG HỌC PHÍ:', s: styles.summaryLabel };
  row[2] = { v: totalAmount, t: 'n', s: styles.summaryValue };
  row[4] = { v: 'ĐÃ THU:', s: styles.summaryLabel };
  row[5] = { v: totalPaid, t: 'n', s: styles.summaryValue };
  row[7] = { v: 'CÒN NỢ:', s: { ...styles.summaryLabel, fill: { fgColor: { rgb: "FEE2E2" } } } };
  row[8] = { v: totalDebt, t: 'n', s: styles.summaryDebt };
  return row;
}

function createDataRow(inv, idx, styles) {
  const debt = (inv.final_amount || 0) - (inv.paid_amount || 0);
  
  const statusText = {
    unpaid: 'Chưa TT',
    partial: 'Một phần',
    paid: 'Đã TT',
    cancelled: 'Đã hủy',
    refunded: 'Hoàn tiền'
  }[inv.status] || inv.status;

  const getStatusStyle = (status) => {
    switch(status) {
      case 'paid': return styles.statusPaid;
      case 'partial': return styles.statusPartial;
      case 'cancelled':
      case 'refunded': return styles.statusCancelled;
      default: return styles.statusUnpaid;
    }
  };

  const rowBg = idx % 2 === 1 ? { fill: { fgColor: { rgb: "F9FAFB" } } } : {};
  const paymentMethod = inv.paid_amount > 0 ? 'CK' : '—';

  return [
    { v: idx + 1, t: 'n', s: { ...styles.cellCenter, ...rowBg } },
    { v: inv.invoice_code || '', s: { ...styles.cellCenter, ...rowBg, font: { sz: 10, bold: true, name: "Arial", color: { rgb: "1E40AF" } } } },
    { v: inv.student?.full_name || '', s: { ...styles.cellText, ...rowBg } },
    { v: inv.student?.email || '', s: { ...styles.cellText, ...rowBg, font: { sz: 9, name: "Arial", color: { rgb: "6B7280" } } } },
    { v: inv.student?.phone || '', s: { ...styles.cellCenter, ...rowBg } },
    { v: inv.class?.code || '', s: { ...styles.cellText, ...rowBg, font: { sz: 10, bold: true, name: "Arial" } } },
    { v: inv.class?.course?.title || '', s: { ...styles.cellText, ...rowBg, font: { sz: 9, name: "Arial" } } },
    { v: inv.final_amount || 0, t: 'n', s: { ...styles.currency, ...rowBg } },
    { v: inv.paid_amount || 0, t: 'n', s: { ...styles.currencyPaid, ...rowBg } },
    { v: debt, t: 'n', s: debt > 0 ? styles.currencyDebt : { ...styles.currencyZero, ...rowBg } },
    { v: paymentMethod, s: { ...styles.cellCenter, ...rowBg } },
    { v: statusText, s: getStatusStyle(inv.status) },
    { v: formatDateVN(inv.created_at) || '—', s: { ...styles.cellCenter, ...rowBg } },
    { v: formatDateVN(inv.due_date) || '—', s: { ...styles.cellCenter, ...rowBg } },
  ];
}

function createFooterRow(totalAmount, totalPaid, totalDebt, styles) {
  const row = [];
  for (let i = 0; i < 14; i++) row.push({ v: '', s: styles.footerLabel });
  row[6] = { v: 'TỔNG CỘNG:', s: styles.footerLabel };
  row[7] = { v: totalAmount, t: 'n', s: styles.footerValue };
  row[8] = { v: totalPaid, t: 'n', s: { ...styles.footerValue, font: { bold: true, sz: 11, name: "Arial", color: { rgb: "047857" } } } };
  row[9] = { v: totalDebt, t: 'n', s: { ...styles.footerValue, font: { bold: true, sz: 11, name: "Arial", color: { rgb: "DC2626" } } } };
  return row;
}

function createSignatureRow1(styles) {
  const row = [];
  for (let i = 0; i < 14; i++) row.push({ v: '', s: {} });
  row[1] = { v: 'Người lập biểu', s: styles.signatureLabel };
  row[10] = { v: 'Giám đốc trung tâm', s: styles.signatureLabel };
  return row;
}

function createSignatureRow2(styles) {
  const row = [];
  for (let i = 0; i < 14; i++) row.push({ v: '', s: {} });
  row[1] = { v: '(Ký, ghi rõ họ tên)', s: styles.signatureLine };
  row[10] = { v: '(Ký, đóng dấu)', s: styles.signatureLine };
  return row;
}

export default exportInvoicesToExcel;
