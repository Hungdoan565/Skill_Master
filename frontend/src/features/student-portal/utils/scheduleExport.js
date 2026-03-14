import logoImageUrl from '@/assets/logo.png';

const DAY_NAMES = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

const STATUS_LABELS = {
  scheduled: 'Sắp tới',
  in_progress: 'Đang học',
  completed: 'Đã học',
  cancelled: 'Đã hủy',
};

const STATUS_COLORS_RGB = {
  scheduled: [37, 99, 235],
  in_progress: [202, 138, 4],
  completed: [22, 163, 74],
  cancelled: [220, 38, 38],
};

const STATUS_COLORS_HEX = {
  scheduled: '2563EB',
  in_progress: 'CA8A04',
  completed: '16A34A',
  cancelled: 'DC2626',
};

const FALLBACK_STATUS = 'scheduled';
const PDF_FONT_FAMILY = 'NotoSansVI';
const PDF_FONT_REGULAR_FILE = 'NotoSans-Regular.ttf';
const PDF_FONT_BOLD_FILE = 'NotoSans-Bold.ttf';
const PDF_FONT_REGULAR_URL = '/fonts/NotoSans-Regular.ttf';
const PDF_FONT_BOLD_URL = '/fonts/NotoSans-Bold.ttf';

let pdfFontPayloadPromise;

function normalizeStatus(status) {
  return STATUS_LABELS[status] ? status : FALLBACK_STATUS;
}

function toSafeDate(value) {
  if (!value) return null;
  const candidate = new Date(value);
  if (!Number.isNaN(candidate.getTime())) return candidate;
  const normalized = new Date(`${String(value).split('T')[0]}T00:00:00`);
  if (!Number.isNaN(normalized.getTime())) return normalized;
  return null;
}

function formatDateVN(value) {
  const date = toSafeDate(value);
  if (!date) return '--/--/----';
  return date.toLocaleDateString('vi-VN');
}

function getDayName(value) {
  const date = toSafeDate(value);
  if (!date) return '-';
  return DAY_NAMES[date.getDay()] || '-';
}

function formatTime(value) {
  if (!value) return '--:--';
  return String(value).slice(0, 5);
}

function formatDateKey(value) {
  const date = toSafeDate(value);
  if (!date) return '0000-00-00';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getScopeLabel(classScope) {
  return classScope === 'all_enrolled' ? 'Đã và đang học' : 'Lớp đang học';
}

function normalizeSessions(sessions = []) {
  return sessions
    .map((session, index) => {
      const status = normalizeStatus(session?.status);
      const dateKey = formatDateKey(session?.sessionDate);
      return {
        id: session?.sessionId || `session-${index + 1}`,
        stt: index + 1,
        dateKey,
        dateLabel: formatDateVN(session?.sessionDate),
        dayLabel: getDayName(session?.sessionDate),
        timeLabel: `${formatTime(session?.startTime)} - ${formatTime(session?.endTime)}`,
        className: session?.className || '-',
        courseName: session?.courseName || '-',
        teacherName: session?.teacherName || '-',
        roomName: session?.roomName || '-',
        sessionNumber: session?.sessionNumber || '-',
        status,
        statusLabel: STATUS_LABELS[status] || STATUS_LABELS[FALLBACK_STATUS],
      };
    })
    .sort((a, b) => {
      if (a.dateKey !== b.dateKey) return a.dateKey.localeCompare(b.dateKey);
      return a.timeLabel.localeCompare(b.timeLabel);
    })
    .map((item, index) => ({ ...item, stt: index + 1 }));
}

function buildFileStamp(currentDate = new Date()) {
  const date = toSafeDate(currentDate) || new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function createExcelStyles() {
  const border = {
    top: { style: 'thin', color: { rgb: 'CBD5E1' } },
    bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
    left: { style: 'thin', color: { rgb: 'CBD5E1' } },
    right: { style: 'thin', color: { rgb: 'CBD5E1' } },
  };

  return {
    brand: {
      font: { bold: true, sz: 17, color: { rgb: 'FFFFFF' }, name: 'Arial' },
      fill: { fgColor: { rgb: '0F4C81' } },
      alignment: { horizontal: 'center', vertical: 'center' },
    },
    title: {
      font: { bold: true, sz: 13, color: { rgb: '0F4C81' }, name: 'Arial' },
      alignment: { horizontal: 'center', vertical: 'center' },
    },
    subtitle: {
      font: { italic: true, sz: 10, color: { rgb: '475569' }, name: 'Arial' },
      alignment: { horizontal: 'center', vertical: 'center' },
    },
    metaLabel: {
      font: { bold: true, sz: 10, color: { rgb: '1E293B' }, name: 'Arial' },
      fill: { fgColor: { rgb: 'DBEAFE' } },
      border,
      alignment: { horizontal: 'left', vertical: 'center' },
    },
    metaValue: {
      font: { sz: 10, color: { rgb: '0F172A' }, name: 'Arial' },
      fill: { fgColor: { rgb: 'EFF6FF' } },
      border,
      alignment: { horizontal: 'left', vertical: 'center' },
    },
    header: {
      font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' }, name: 'Arial' },
      fill: { fgColor: { rgb: '1D4ED8' } },
      border,
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    },
    cellLeft: {
      font: { sz: 10, color: { rgb: '0F172A' }, name: 'Arial' },
      border,
      alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
    },
    cellCenter: {
      font: { sz: 10, color: { rgb: '0F172A' }, name: 'Arial' },
      border,
      alignment: { horizontal: 'center', vertical: 'center' },
    },
    altRowFill: { fgColor: { rgb: 'F8FAFC' } },
    signatureTitle: {
      font: { bold: true, sz: 10, color: { rgb: '334155' }, name: 'Arial' },
      alignment: { horizontal: 'center', vertical: 'center' },
    },
    signatureHint: {
      font: { italic: true, sz: 9, color: { rgb: '64748B' }, name: 'Arial' },
      alignment: { horizontal: 'center', vertical: 'center' },
    },
    signatureDate: {
      font: { italic: true, sz: 10, color: { rgb: '334155' }, name: 'Arial' },
      alignment: { horizontal: 'right', vertical: 'center' },
    },
  };
}

function emptyStyledRow(length, style) {
  return Array.from({ length }, () => ({ v: '', s: style }));
}

function toDataUrl(imageUrl) {
  return fetch(imageUrl)
    .then((response) => response.blob())
    .then(
      (blob) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        })
    );
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

async function fetchFontAsBase64(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Không thể tải font PDF từ ${url}`);
  }
  const buffer = await response.arrayBuffer();
  return arrayBufferToBase64(buffer);
}

async function getPdfFontPayload() {
  if (!pdfFontPayloadPromise) {
    pdfFontPayloadPromise = Promise.all([
      fetchFontAsBase64(PDF_FONT_REGULAR_URL),
      fetchFontAsBase64(PDF_FONT_BOLD_URL),
    ]).then(([regular, bold]) => ({ regular, bold }));
  }
  return pdfFontPayloadPromise;
}

async function registerVietnamesePdfFonts(doc) {
  const payload = await getPdfFontPayload();
  doc.addFileToVFS(PDF_FONT_REGULAR_FILE, payload.regular);
  doc.addFont(PDF_FONT_REGULAR_FILE, PDF_FONT_FAMILY, 'normal');
  doc.addFileToVFS(PDF_FONT_BOLD_FILE, payload.bold);
  doc.addFont(PDF_FONT_BOLD_FILE, PDF_FONT_FAMILY, 'bold');
}

export async function exportScheduleToExcel({
  sessions = [],
  currentDate = new Date(),
  rangeLabel = '',
  classScope = 'active',
  classLabel = 'Tất cả lớp',
  studentName = 'Học viên',
} = {}) {
  const normalized = normalizeSessions(sessions);
  if (normalized.length === 0) {
    throw new Error('No schedule sessions to export');
  }

  const XLSX = await import('xlsx-js-style');
  const styles = createExcelStyles();
  const columnCount = 10;
  const wsData = [];

  wsData.push([{ v: 'SKILL MASTER ACADEMY', s: styles.brand }]);
  wsData.push([{ v: 'THỜI KHÓA BIỂU HỌC VIÊN', s: styles.title }]);
  wsData.push([{ v: `Báo cáo ngày ${new Date().toLocaleDateString('vi-VN')}`, s: styles.subtitle }]);
  wsData.push(emptyStyledRow(columnCount, {}));

  const metaRow1 = emptyStyledRow(columnCount, styles.metaValue);
  metaRow1[0] = { v: 'Học viên', s: styles.metaLabel };
  metaRow1[1] = { v: studentName, s: styles.metaValue };
  metaRow1[5] = { v: 'Phạm vi', s: styles.metaLabel };
  metaRow1[6] = { v: getScopeLabel(classScope), s: styles.metaValue };
  wsData.push(metaRow1);

  const metaRow2 = emptyStyledRow(columnCount, styles.metaValue);
  metaRow2[0] = { v: 'Lớp học', s: styles.metaLabel };
  metaRow2[1] = { v: classLabel, s: styles.metaValue };
  metaRow2[5] = { v: 'Khoảng thời gian', s: styles.metaLabel };
  metaRow2[6] = { v: rangeLabel || '-', s: styles.metaValue };
  wsData.push(metaRow2);

  wsData.push(emptyStyledRow(columnCount, {}));

  const headerRowIndex = wsData.length;
  wsData.push([
    { v: 'STT', s: styles.header },
    { v: 'Ngày học', s: styles.header },
    { v: 'Thứ', s: styles.header },
    { v: 'Thời gian', s: styles.header },
    { v: 'Lớp', s: styles.header },
    { v: 'Khóa học', s: styles.header },
    { v: 'Giáo viên', s: styles.header },
    { v: 'Phòng', s: styles.header },
    { v: 'Buổi', s: styles.header },
    { v: 'Trạng thái', s: styles.header },
  ]);

  normalized.forEach((item, index) => {
    const isAlt = index % 2 === 1;
    const fill = isAlt ? styles.altRowFill : null;
    const statusColor = STATUS_COLORS_HEX[item.status] || STATUS_COLORS_HEX[FALLBACK_STATUS];

    const centerCell = (value) => ({
      v: value,
      s: {
        ...styles.cellCenter,
        ...(fill ? { fill } : {}),
      },
    });

    const leftCell = (value) => ({
      v: value,
      s: {
        ...styles.cellLeft,
        ...(fill ? { fill } : {}),
      },
    });

    wsData.push([
      centerCell(item.stt),
      centerCell(item.dateLabel),
      centerCell(item.dayLabel),
      centerCell(item.timeLabel),
      leftCell(item.className),
      leftCell(item.courseName),
      leftCell(item.teacherName),
      leftCell(item.roomName),
      centerCell(item.sessionNumber),
      {
        v: item.statusLabel,
        s: {
          ...styles.cellCenter,
          font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' }, name: 'Arial' },
          fill: { fgColor: { rgb: statusColor } },
        },
      },
    ]);
  });

  wsData.push(emptyStyledRow(columnCount, {}));

  const summaryRow = emptyStyledRow(columnCount, styles.metaValue);
  summaryRow[0] = { v: 'Tổng buổi học', s: styles.metaLabel };
  summaryRow[1] = { v: normalized.length, s: styles.metaValue };
  summaryRow[5] = { v: 'Ngày xuất', s: styles.metaLabel };
  summaryRow[6] = { v: new Date().toLocaleString('vi-VN'), s: styles.metaValue };
  wsData.push(summaryRow);

  wsData.push(emptyStyledRow(columnCount, {}));

  const today = new Date();
  const signDateRow = emptyStyledRow(columnCount, {});
  signDateRow[6] = {
    v: `Ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`,
    s: styles.signatureDate,
  };
  wsData.push(signDateRow);

  const signTitleRow = emptyStyledRow(columnCount, {});
  signTitleRow[1] = { v: 'Học viên', s: styles.signatureTitle };
  signTitleRow[7] = { v: 'Cố vấn học tập', s: styles.signatureTitle };
  wsData.push(signTitleRow);

  wsData.push(emptyStyledRow(columnCount, {}));
  wsData.push(emptyStyledRow(columnCount, {}));
  wsData.push(emptyStyledRow(columnCount, {}));

  const signHintRow = emptyStyledRow(columnCount, {});
  signHintRow[1] = { v: '(Ký, ghi rõ họ tên)', s: styles.signatureHint };
  signHintRow[7] = { v: '(Ký, ghi rõ họ tên)', s: styles.signatureHint };
  wsData.push(signHintRow);

  const worksheet = XLSX.utils.aoa_to_sheet(wsData);

  const summaryRowIndex = headerRowIndex + normalized.length + 2;
  const signDateRowIndex = summaryRowIndex + 2;
  const signTitleRowIndex = summaryRowIndex + 3;
  const signHintRowIndex = summaryRowIndex + 7;

  const merges = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 9 } },
    { s: { r: 4, c: 1 }, e: { r: 4, c: 4 } },
    { s: { r: 4, c: 6 }, e: { r: 4, c: 9 } },
    { s: { r: 5, c: 1 }, e: { r: 5, c: 4 } },
    { s: { r: 5, c: 6 }, e: { r: 5, c: 9 } },
    { s: { r: summaryRowIndex, c: 1 }, e: { r: summaryRowIndex, c: 4 } },
    { s: { r: summaryRowIndex, c: 6 }, e: { r: summaryRowIndex, c: 9 } },
    { s: { r: signDateRowIndex, c: 6 }, e: { r: signDateRowIndex, c: 9 } },
    { s: { r: signTitleRowIndex, c: 1 }, e: { r: signTitleRowIndex, c: 3 } },
    { s: { r: signTitleRowIndex, c: 7 }, e: { r: signTitleRowIndex, c: 9 } },
    { s: { r: signHintRowIndex, c: 1 }, e: { r: signHintRowIndex, c: 3 } },
    { s: { r: signHintRowIndex, c: 7 }, e: { r: signHintRowIndex, c: 9 } },
  ];

  worksheet['!merges'] = merges;
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 13 },
    { wch: 10 },
    { wch: 14 },
    { wch: 24 },
    { wch: 24 },
    { wch: 20 },
    { wch: 14 },
    { wch: 8 },
    { wch: 13 },
  ];
  worksheet['!rows'] = wsData.map((_, index) => {
    if (index === 0) return { hpt: 28 };
    if (index === 1) return { hpt: 24 };
    if (index === 2) return { hpt: 20 };
    if (index === headerRowIndex) return { hpt: 28 };
    return { hpt: 22 };
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'ThoiKhoaBieu');

  const fileName = `thoi-khoa-bieu-skill-master-${buildFileStamp(currentDate)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

export async function exportScheduleToPDF({
  sessions = [],
  currentDate = new Date(),
  rangeLabel = '',
  classScope = 'active',
  classLabel = 'Tất cả lớp',
  studentName = 'Học viên',
} = {}) {
  const normalized = normalizeSessions(sessions);
  if (normalized.length === 0) {
    throw new Error('No schedule sessions to export');
  }

  const [{ jsPDF }, autoTableModule] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const autoTable = autoTableModule?.default || autoTableModule?.autoTable;
  await registerVietnamesePdfFonts(doc);

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;

  doc.setFillColor(15, 76, 129);
  doc.rect(0, 0, pageWidth, 36, 'F');

  try {
    const logoDataUrl = await toDataUrl(logoImageUrl);
    doc.addImage(logoDataUrl, 'PNG', margin, 7, 18, 18);
  } catch {
    // Fallback when logo cannot be loaded in runtime.
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont(PDF_FONT_FAMILY, 'bold');
  doc.setFontSize(14);
  doc.text('SKILL MASTER ACADEMY', pageWidth / 2, 14, { align: 'center' });
  doc.setFontSize(12);
  doc.text('THỜI KHÓA BIỂU HỌC VIÊN', pageWidth / 2, 22, { align: 'center' });
  doc.setFont(PDF_FONT_FAMILY, 'normal');
  doc.setFontSize(9);
  doc.text(`Xuất lúc: ${new Date().toLocaleString('vi-VN')}`, pageWidth / 2, 29, { align: 'center' });

  doc.setTextColor(15, 23, 42);
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(margin, 40, pageWidth - margin * 2, 24, 2, 2, 'F');

  doc.setFont(PDF_FONT_FAMILY, 'bold');
  doc.setFontSize(9.5);
  doc.text('Học viên:', margin + 3, 47);
  doc.text('Phạm vi:', margin + 3, 53);
  doc.text('Lớp học:', margin + 3, 59);

  doc.setFont(PDF_FONT_FAMILY, 'normal');
  doc.text(studentName || '-', margin + 24, 47);
  doc.text(getScopeLabel(classScope), margin + 24, 53);
  doc.text(classLabel || '-', margin + 24, 59);

  doc.setFont(PDF_FONT_FAMILY, 'bold');
  doc.text('Khoảng thời gian:', pageWidth / 2 + 8, 47);
  doc.text('Tổng buổi:', pageWidth / 2 + 8, 53);
  doc.text('Ngày báo cáo:', pageWidth / 2 + 8, 59);

  doc.setFont(PDF_FONT_FAMILY, 'normal');
  doc.text(rangeLabel || '-', pageWidth / 2 + 37, 47);
  doc.text(String(normalized.length), pageWidth / 2 + 37, 53);
  doc.text(formatDateVN(currentDate), pageWidth / 2 + 37, 59);

  const tableBody = normalized.map((item) => [
    item.stt,
    item.dateLabel,
    item.dayLabel,
    item.timeLabel,
    item.className,
    item.courseName,
    item.statusLabel,
  ]);

  const tableOptions = {
    startY: 70,
    head: [['#', 'Ngày', 'Thứ', 'Giờ học', 'Lớp', 'Khóa học', 'Trạng thái']],
    body: tableBody,
    theme: 'grid',
    styles: {
      font: PDF_FONT_FAMILY,
      fontSize: 8.5,
      cellPadding: 2,
      textColor: [15, 23, 42],
      lineColor: [203, 213, 225],
      lineWidth: 0.15,
      valign: 'middle',
    },
    headStyles: {
      font: PDF_FONT_FAMILY,
      fillColor: [29, 78, 216],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 20 },
      2: { halign: 'center', cellWidth: 15 },
      3: { halign: 'center', cellWidth: 24 },
      4: { halign: 'left', cellWidth: 38 },
      5: { halign: 'left', cellWidth: 48 },
      6: { halign: 'center', cellWidth: 22 },
    },
    didParseCell(data) {
      if (data.section === 'body' && data.column.index === 6) {
        const statusValue = data.row.raw[6];
        const original = normalized[data.row.index]?.status;
        if (statusValue && original) {
          const color = STATUS_COLORS_RGB[original] || STATUS_COLORS_RGB[FALLBACK_STATUS];
          data.cell.styles.fillColor = color;
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  };

  if (typeof doc.autoTable === 'function') {
    doc.autoTable(tableOptions);
  } else if (typeof autoTable === 'function') {
    autoTable(doc, tableOptions);
  } else {
    throw new Error('PDF table renderer is not available');
  }

  let signatureY = doc.lastAutoTable.finalY + 14;
  if (signatureY > 238) {
    doc.addPage();
    signatureY = 30;
  }

  const today = new Date();
  doc.setTextColor(51, 65, 85);
  doc.setFont(PDF_FONT_FAMILY, 'normal');
  doc.setFontSize(10);
  doc.text(`Ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`, pageWidth - margin, signatureY, {
    align: 'right',
  });

  doc.setFont(PDF_FONT_FAMILY, 'bold');
  doc.setFontSize(10.5);
  doc.text('Học viên', pageWidth * 0.26, signatureY + 10, { align: 'center' });
  doc.text('Cố vấn học tập', pageWidth * 0.74, signatureY + 10, { align: 'center' });

  doc.setFont(PDF_FONT_FAMILY, 'normal');
  doc.setFontSize(9);
  doc.text('(Ký, ghi rõ họ tên)', pageWidth * 0.26, signatureY + 15, { align: 'center' });
  doc.text('(Ký, ghi rõ họ tên)', pageWidth * 0.74, signatureY + 15, { align: 'center' });

  doc.setDrawColor(148, 163, 184);
  doc.line(pageWidth * 0.18, signatureY + 41, pageWidth * 0.34, signatureY + 41);
  doc.line(pageWidth * 0.66, signatureY + 41, pageWidth * 0.82, signatureY + 41);

  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setTextColor(100, 116, 139);
    doc.setFont(PDF_FONT_FAMILY, 'normal');
    doc.setFontSize(8);
    doc.text('Skill Master Academy - Báo cáo thời khóa biểu học viên', margin, 292);
    doc.text(`Trang ${page}/${totalPages}`, pageWidth - margin, 292, { align: 'right' });
  }

  const fileName = `thoi-khoa-bieu-skill-master-${buildFileStamp(currentDate)}.pdf`;
  doc.save(fileName);
}
