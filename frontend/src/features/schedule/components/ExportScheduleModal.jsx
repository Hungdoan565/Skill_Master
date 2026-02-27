/**
 * ExportScheduleModal - Modal xuất lịch dạy ra Excel/PDF
 * Professional export with xlsx-js-style styling and print-ready PDF
 */

import { useState, useEffect } from 'react';
import {
  X,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Calendar,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

// ============================================
// CONSTANTS
// ============================================

const DAY_NAMES = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

const STATUS_LABELS = {
  upcoming: 'Chưa dạy',
  scheduled: 'Chưa dạy',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

const STATUS_COLORS_HEX = {
  upcoming: '3B82F6',
  scheduled: '3B82F6',
  completed: '10B981',
  cancelled: '6B7280',
};

// ============================================
// SHARED HELPERS
// ============================================

function formatDateVN(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function getRoomName(session) {
  return session.rooms?.name || session.classes?.rooms?.name || '-';
}

function getSessionStats(sessions) {
  const total = sessions.length;
  const completed = sessions.filter(s => s.status === 'completed').length;
  const upcoming = sessions.filter(s => s.status === 'upcoming' || s.status === 'scheduled').length;
  const cancelled = sessions.filter(s => s.status === 'cancelled').length;
  return { total, completed, upcoming, cancelled };
}

// ============================================
// EXCEL EXPORT — Following exportExcel.js patterns
// ============================================

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
    infoLeft: {
      font: { sz: 10, color: { rgb: '6B7280' }, name: 'Arial', italic: true },
      alignment: { horizontal: 'left', vertical: 'center' },
    },
    infoRight: {
      font: { sz: 10, color: { rgb: '6B7280' }, name: 'Arial', italic: true },
      alignment: { horizontal: 'right', vertical: 'center' },
    },
    sectionTitle: {
      font: { bold: true, sz: 11, color: { rgb: '1E3A8A' }, name: 'Arial' },
      fill: { fgColor: { rgb: 'E0E7FF' } },
      alignment: { horizontal: 'left', vertical: 'center' },
      border: mediumBorder,
    },
    header: {
      font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' }, name: 'Arial' },
      fill: { fgColor: { rgb: '1E40AF' } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: mediumBorder,
    },
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
      border: summaryBorder,
    },
    altRowBg: { fgColor: { rgb: 'F9FAFB' } },
    footerLabel: {
      font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' }, name: 'Arial' },
      fill: { fgColor: { rgb: '4338CA' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: mediumBorder,
    },
    footerValue: {
      font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' }, name: 'Arial' },
      fill: { fgColor: { rgb: '4338CA' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: mediumBorder,
    },
    signatureLabel: {
      font: { bold: true, sz: 10, color: { rgb: '374151' }, name: 'Arial' },
      alignment: { horizontal: 'center', vertical: 'center' },
    },
    signatureLine: {
      font: { italic: true, sz: 9, color: { rgb: '6B7280' }, name: 'Arial' },
      alignment: { horizontal: 'center', vertical: 'center' },
    },
    // Status-specific cell styles
    statusCompleted: {
      font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' }, name: 'Arial' },
      fill: { fgColor: { rgb: '10B981' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: thinBorder,
    },
    statusUpcoming: {
      font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' }, name: 'Arial' },
      fill: { fgColor: { rgb: '3B82F6' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: thinBorder,
    },
    statusCancelled: {
      font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' }, name: 'Arial' },
      fill: { fgColor: { rgb: '6B7280' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: thinBorder,
    },
  };
}

function createEmptyRow(colCount, style = {}) {
  const row = [];
  for (let i = 0; i < colCount; i++) {
    row.push({ v: '', s: style });
  }
  return row;
}

function getStatusStyle(status, styles) {
  if (status === 'completed') return styles.statusCompleted;
  if (status === 'cancelled') return styles.statusCancelled;
  return styles.statusUpcoming;
}

function calculateColumnWidth(wsData, colIndex, minWidth = 8, maxWidth = 50, mergedRanges = []) {
  let maxLen = minWidth;
  for (let rowIdx = 0; rowIdx < wsData.length; rowIdx++) {
    const row = wsData[rowIdx];
    if (!row || !row[colIndex]) continue;

    const isMerged = mergedRanges.some(merge =>
      rowIdx >= merge.s.r && rowIdx <= merge.e.r &&
      colIndex >= merge.s.c && colIndex <= merge.e.c &&
      merge.s.c !== merge.e.c
    );
    if (isMerged) continue;

    const cell = row[colIndex];
    let value = '';
    if (typeof cell === 'object' && cell !== null) {
      value = cell.v !== undefined ? String(cell.v) : '';
    } else {
      value = String(cell);
    }

    if (value.match(/^[IVX]+\./)) continue;

    let displayLen = 0;
    for (const char of value) {
      if (char.charCodeAt(0) > 127) {
        displayLen += 1.5;
      } else {
        displayLen += 1;
      }
    }
    displayLen = Math.ceil(displayLen) + 2;

    if (displayLen > maxLen) {
      maxLen = displayLen;
    }
  }
  return Math.min(maxLen, maxWidth);
}

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

async function handleExcelExport(sessions, dateRange) {
  const XLSX = await import('xlsx-js-style');
  const styles = createExcelStyles();
  const wsData = [];
  const COL_COUNT = 11; // STT, Ngày, Thứ, Thời gian, Lớp học, Mã lớp, Giáo viên, Phòng học, Trạng thái, Buổi số, Chủ đề
  const today = new Date();
  const stats = getSessionStats(sessions);

  // ============ ROW 0: Title ============
  const titleRow = createEmptyRow(COL_COUNT, styles.title);
  titleRow[0] = { v: 'BÁO CÁO LỊCH DẠY', s: styles.title };
  wsData.push(titleRow);

  // ============ ROW 1: Subtitle ============
  const subtitleRow = createEmptyRow(COL_COUNT, styles.subtitle);
  subtitleRow[0] = { v: 'TRUNG TÂM ĐÀO TẠO SKILL MASTER', s: styles.subtitle };
  wsData.push(subtitleRow);

  // ============ ROW 2: Period ============
  const periodText = dateRange.startDate && dateRange.endDate
    ? `Từ ${formatDateVN(dateRange.startDate)} đến ${formatDateVN(dateRange.endDate)}`
    : 'Tất cả các buổi học';
  const periodRow = createEmptyRow(COL_COUNT, styles.info);
  periodRow[0] = { v: periodText, s: styles.info };
  wsData.push(periodRow);

  // ============ ROW 3: Date + Author ============
  const dateRow = createEmptyRow(COL_COUNT, styles.info);
  dateRow[0] = { v: `Ngày xuất: ${formatDateVN(today)}`, s: styles.infoLeft };
  dateRow[6] = { v: 'Người lập: Admin', s: styles.infoRight };
  wsData.push(dateRow);

  // ============ ROW 4: Empty separator ============
  wsData.push(createEmptyRow(COL_COUNT, {}));

  // ============ ROW 5-6: Summary box ============
  const summaryRow1 = createEmptyRow(COL_COUNT, styles.summaryBox);
  summaryRow1[0] = { v: 'TỔNG QUAN', s: { ...styles.summaryLabel, alignment: { horizontal: 'center', vertical: 'center' } } };
  summaryRow1[2] = { v: 'Tổng buổi học:', s: styles.summaryLabel };
  summaryRow1[3] = { v: stats.total, t: 'n', s: styles.summaryValue };
  summaryRow1[5] = { v: 'Hoàn thành:', s: styles.summaryLabel };
  summaryRow1[6] = { v: stats.completed, t: 'n', s: styles.summaryValue };
  summaryRow1[8] = { v: 'Chưa dạy:', s: styles.summaryLabel };
  summaryRow1[9] = { v: stats.upcoming, t: 'n', s: styles.summaryValue };
  wsData.push(summaryRow1);

  const summaryRow2 = createEmptyRow(COL_COUNT, styles.summaryBox);
  summaryRow2[2] = { v: 'Đã hủy:', s: styles.summaryLabel };
  summaryRow2[3] = { v: stats.cancelled, t: 'n', s: { ...styles.summaryValue, font: { bold: true, sz: 12, color: { rgb: stats.cancelled > 0 ? 'DC2626' : '047857' }, name: 'Arial' } } };
  wsData.push(summaryRow2);

  // ============ ROW 7: Empty separator ============
  wsData.push(createEmptyRow(COL_COUNT, {}));

  // ============ ROW 8: Section title ============
  const sectionRow = createEmptyRow(COL_COUNT, styles.sectionTitle);
  sectionRow[0] = { v: 'I. CHI TIẾT LỊCH DẠY', s: styles.sectionTitle };
  wsData.push(sectionRow);

  // ============ ROW 9: Table headers ============
  wsData.push([
    { v: 'STT', s: styles.header },
    { v: 'Ngày', s: styles.header },
    { v: 'Thứ', s: styles.header },
    { v: 'Thời gian', s: styles.header },
    { v: 'Lớp học', s: styles.header },
    { v: 'Mã lớp', s: styles.header },
    { v: 'Giáo viên', s: styles.header },
    { v: 'Phòng học', s: styles.header },
    { v: 'Trạng thái', s: styles.header },
    { v: 'Buổi số', s: styles.header },
    { v: 'Chủ đề', s: styles.header },
  ]);

  // ============ ROW 10+: Data rows ============
  const sortedSessions = [...sessions].sort((a, b) => {
    const dateCompare = (a.session_date || '').localeCompare(b.session_date || '');
    if (dateCompare !== 0) return dateCompare;
    return (a.start_time || '').localeCompare(b.start_time || '');
  });

  sortedSessions.forEach((s, idx) => {
    const date = new Date(s.session_date);
    const altBg = idx % 2 === 1 ? { fill: styles.altRowBg } : {};
    const timeStr = `${(s.start_time || '').substring(0, 5)} - ${(s.end_time || '').substring(0, 5)}`;
    const statusStyle = getStatusStyle(s.status, styles);

    wsData.push([
      { v: idx + 1, t: 'n', s: { ...styles.cellCenter, ...altBg } },
      { v: formatDateVN(s.session_date), s: { ...styles.cellCenter, ...altBg } },
      { v: DAY_NAMES[date.getDay()], s: { ...styles.cellCenter, ...altBg } },
      { v: timeStr, s: { ...styles.cellCenter, ...altBg } },
      { v: s.classes?.name || 'N/A', s: { ...styles.cellText, ...altBg } },
      { v: s.classes?.code || '', s: { ...styles.cellCenter, ...altBg } },
      { v: s.users?.full_name || '-', s: { ...styles.cellText, ...altBg } },
      { v: getRoomName(s), s: { ...styles.cellCenter, ...altBg } },
      { v: STATUS_LABELS[s.status] || s.status, s: statusStyle },
      { v: s.session_number || '', t: s.session_number ? 'n' : 's', s: { ...styles.cellCenter, ...altBg } },
      { v: s.topic || '', s: { ...styles.cellText, ...altBg } },
    ]);
  });

  // ============ Footer: TỔNG CỘNG row ============
  wsData.push([
    { v: '', s: styles.footerLabel },
    { v: '', s: styles.footerLabel },
    { v: '', s: styles.footerLabel },
    { v: 'TỔNG CỘNG', s: styles.footerLabel },
    { v: `${stats.total} buổi`, s: styles.footerValue },
    { v: '', s: styles.footerLabel },
    { v: '', s: styles.footerLabel },
    { v: '', s: styles.footerLabel },
    { v: `${stats.completed} hoàn thành`, s: styles.footerValue },
    { v: '', s: styles.footerLabel },
    { v: '', s: styles.footerLabel },
  ]);

  // ============ Empty rows before signature ============
  wsData.push(createEmptyRow(COL_COUNT, {}));
  wsData.push(createEmptyRow(COL_COUNT, {}));

  // ============ Signature section ============
  const sigRow1 = createEmptyRow(COL_COUNT, {});
  sigRow1[0] = { v: 'Người lập biểu', s: styles.signatureLabel };
  sigRow1[7] = { v: 'Giám đốc trung tâm', s: styles.signatureLabel };
  wsData.push(sigRow1);

  const sigRow2 = createEmptyRow(COL_COUNT, {});
  sigRow2[0] = { v: '(Ký, ghi rõ họ tên)', s: styles.signatureLine };
  sigRow2[7] = { v: '(Ký, đóng dấu)', s: styles.signatureLine };
  wsData.push(sigRow2);

  // ============ CREATE WORKSHEET ============
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Merge cells
  const lastCol = COL_COUNT - 1;
  const sigRow1Idx = 10 + sortedSessions.length + 3;
  const sigRow2Idx = sigRow1Idx + 1;
  const merges = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: lastCol } },  // Title
    { s: { r: 1, c: 0 }, e: { r: 1, c: lastCol } },  // Subtitle
    { s: { r: 2, c: 0 }, e: { r: 2, c: lastCol } },  // Period
    { s: { r: 3, c: 0 }, e: { r: 3, c: 4 } },         // Date text
    { s: { r: 3, c: 6 }, e: { r: 3, c: lastCol } },   // Author text
    { s: { r: 5, c: 0 }, e: { r: 5, c: 1 } },         // TỔNG QUAN
    { s: { r: 6, c: 0 }, e: { r: 6, c: 1 } },         // Summary row 2 bg
    { s: { r: 8, c: 0 }, e: { r: 8, c: lastCol } },   // Section title
    // Signature merges
    { s: { r: sigRow1Idx, c: 0 }, e: { r: sigRow1Idx, c: 3 } },    // Người lập biểu
    { s: { r: sigRow1Idx, c: 7 }, e: { r: sigRow1Idx, c: lastCol } }, // Giám đốc trung tâm
    { s: { r: sigRow2Idx, c: 0 }, e: { r: sigRow2Idx, c: 3 } },    // (Ký, ghi rõ họ tên)
    { s: { r: sigRow2Idx, c: 7 }, e: { r: sigRow2Idx, c: lastCol } }, // (Ký, đóng dấu)
  ];
  ws['!merges'] = merges;

  // Column widths
  ws['!cols'] = autoFitColumns(wsData, [
    { min: 6, max: 8, default: 6 },      // STT
    { min: 12, max: 18, default: 14 },    // Ngày
    { min: 10, max: 14, default: 12 },    // Thứ
    { min: 14, max: 20, default: 16 },    // Thời gian
    { min: 22, max: 42, default: 28 },    // Lớp học
    { min: 16, max: 26, default: 20 },    // Mã lớp
    { min: 20, max: 32, default: 24 },    // Giáo viên
    { min: 10, max: 18, default: 14 },    // Phòng học
    { min: 12, max: 18, default: 14 },    // Trạng thái
    { min: 8, max: 14, default: 10 },     // Buổi số
    { min: 22, max: 42, default: 28 },    // Chủ đề
  ], merges);

  // Row heights
  const rowHeights = [
    { hpt: 35 },  // Title
    { hpt: 25 },  // Subtitle
    { hpt: 22 },  // Period
    { hpt: 20 },  // Date/Author
    { hpt: 10 },  // Separator
    { hpt: 22 },  // Summary 1
    { hpt: 22 },  // Summary 2
    { hpt: 10 },  // Separator
    { hpt: 22 },  // Section title
    { hpt: 28 },  // Table headers
  ];
  // Data rows
  for (let i = 0; i < sortedSessions.length; i++) {
    rowHeights.push({ hpt: 22 });
  }
  // Footer
  rowHeights.push({ hpt: 25 });
  // Empty + signature
  rowHeights.push({ hpt: 10 }, { hpt: 10 }, { hpt: 30 }, { hpt: 22 });

  ws['!rows'] = rowHeights;

  // Create workbook and download
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Lịch dạy');

  const fileName = `lich-day_${dateRange.startDate || 'all'}_${dateRange.endDate || 'dates'}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

// ============================================
// PDF EXPORT — Professional print document
// ============================================

function generatePDFHTML(sessions, dateRange) {
  const today = new Date();
  const stats = getSessionStats(sessions);

  const periodText = dateRange.startDate && dateRange.endDate
    ? `Từ ${formatDateVN(dateRange.startDate)} đến ${formatDateVN(dateRange.endDate)}`
    : 'Tất cả các buổi học';

  // Group by date
  const grouped = sessions.reduce((acc, s) => {
    if (!acc[s.session_date]) acc[s.session_date] = [];
    acc[s.session_date].push(s);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort();

  const statusColorMap = {
    upcoming: '#3b82f6',
    scheduled: '#3b82f6',
    completed: '#10b981',
    cancelled: '#6b7280',
  };

  const statusBgMap = {
    upcoming: '#eff6ff',
    scheduled: '#eff6ff',
    completed: '#ecfdf5',
    cancelled: '#f9fafb',
  };

  const dateGroupsHTML = sortedDates.map(date => {
    const daySessions = grouped[date];
    const d = new Date(date);
    const dayName = DAY_NAMES[d.getDay()];
    const dateFormatted = formatDateVN(date);

    const rowsHTML = daySessions.map((s, idx) => {
      const bgColor = idx % 2 === 1 ? '#f8fafc' : '#ffffff';
      const statusColor = statusColorMap[s.status] || '#6b7280';
      const statusBg = statusBgMap[s.status] || '#f9fafb';
      const statusLabel = STATUS_LABELS[s.status] || s.status;
      const timeStr = `${(s.start_time || '').substring(0, 5)} - ${(s.end_time || '').substring(0, 5)}`;

      return `
        <tr style="background: ${bgColor};">
          <td style="text-align: center; font-weight: 600;">${idx + 1}</td>
          <td style="text-align: center;">${timeStr}</td>
          <td>
            <strong>${s.classes?.name || 'N/A'}</strong>
            <br><span style="color: #64748b; font-size: 10px;">${s.classes?.code || ''}</span>
          </td>
          <td>${s.users?.full_name || '-'}</td>
          <td style="text-align: center;">${getRoomName(s)}</td>
          <td style="text-align: center;">
            <span style="display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 10px; font-weight: 600; color: ${statusColor}; background: ${statusBg}; border: 1px solid ${statusColor}30;">
              ${statusLabel}
            </span>
          </td>
        </tr>`;
    }).join('');

    return `
      <div class="date-section">
        <div class="date-header">
          ${dayName}, ${dateFormatted} <span class="date-count">${daySessions.length} buổi</span>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 40px;">STT</th>
              <th style="width: 100px;">Thời gian</th>
              <th>Lớp học</th>
              <th style="width: 140px;">Giáo viên</th>
              <th style="width: 65px;">Phòng</th>
              <th style="width: 95px;">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHTML}
          </tbody>
        </table>
      </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Báo cáo Lịch Dạy</title>
  <style>
    @page {
      size: A4;
      margin: 18mm 15mm 20mm 15mm;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Times New Roman', Times, serif;
      color: #1e293b;
      font-size: 13px;
      line-height: 1.5;
    }

    /* Organization header */
    .org-header {
      text-align: center;
      padding-bottom: 12px;
      border-bottom: 3px double #1E3A8A;
      margin-bottom: 18px;
    }
    .org-name {
      font-size: 15px;
      font-weight: bold;
      color: #1E3A8A;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .org-subtitle {
      font-size: 12px;
      color: #64748b;
      margin-top: 2px;
    }

    /* Document title */
    .doc-title {
      text-align: center;
      margin: 20px 0 8px 0;
    }
    .doc-title h1 {
      font-size: 22px;
      font-weight: bold;
      color: #1E3A8A;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .doc-period {
      text-align: center;
      font-size: 13px;
      color: #475569;
      font-style: italic;
      margin-bottom: 16px;
    }

    /* Summary stats */
    .summary-row {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .stat-box {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 16px;
      text-align: center;
      min-width: 110px;
    }
    .stat-box .stat-value {
      font-size: 20px;
      font-weight: bold;
      display: block;
    }
    .stat-box .stat-label {
      font-size: 11px;
      color: #64748b;
      display: block;
      margin-top: 2px;
    }
    .stat-total { border-color: #1E3A8A; background: #eff6ff; }
    .stat-total .stat-value { color: #1E3A8A; }
    .stat-completed { border-color: #10b981; background: #ecfdf5; }
    .stat-completed .stat-value { color: #047857; }
    .stat-upcoming { border-color: #3b82f6; background: #eff6ff; }
    .stat-upcoming .stat-value { color: #1d4ed8; }
    .stat-cancelled { border-color: #6b7280; background: #f9fafb; }
    .stat-cancelled .stat-value { color: #374151; }

    /* Date sections */
    .date-section {
      margin-bottom: 16px;
    }
    .date-header {
      background: #f1f5f9;
      padding: 6px 12px;
      font-weight: bold;
      font-size: 13px;
      color: #1e293b;
      border-left: 4px solid #1E3A8A;
      margin-bottom: 4px;
    }
    .date-count {
      float: right;
      font-weight: normal;
      color: #64748b;
      font-size: 12px;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
    }
    th {
      background: #1E3A8A;
      color: white;
      padding: 7px 6px;
      text-align: left;
      font-size: 11px;
      font-weight: bold;
      font-family: Arial, sans-serif;
    }
    td {
      padding: 6px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 12px;
      vertical-align: middle;
    }

    /* Signature section */
    .signature-section {
      margin-top: 40px;
      page-break-inside: avoid;
    }
    .signature-date {
      text-align: right;
      font-style: italic;
      font-size: 12px;
      color: #475569;
      margin-bottom: 16px;
    }
    .signature-row {
      display: flex;
      justify-content: space-between;
      padding: 0 40px;
    }
    .signature-col {
      text-align: center;
      min-width: 180px;
    }
    .signature-col .sig-title {
      font-weight: bold;
      font-size: 13px;
      color: #1e293b;
    }
    .signature-col .sig-sub {
      font-style: italic;
      font-size: 11px;
      color: #6b7280;
      margin-top: 4px;
    }

    /* Footer */
    .footer {
      margin-top: 40px;
      text-align: center;
      color: #94a3b8;
      font-size: 10px;
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
    }

    /* Print */
    @media print {
      body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .date-section { page-break-inside: avoid; }
      .signature-section { page-break-inside: avoid; }
      .summary-row { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="org-header">
    <div class="org-name">Trung tâm đào tạo Skill Master</div>
    <div class="org-subtitle">Hệ thống quản lý đào tạo chuyên nghiệp</div>
  </div>

  <div class="doc-title">
    <h1>Báo cáo Lịch Dạy</h1>
  </div>
  <div class="doc-period">${periodText}</div>

  <div class="summary-row">
    <div class="stat-box stat-total">
      <span class="stat-value">${stats.total}</span>
      <span class="stat-label">Tổng buổi học</span>
    </div>
    <div class="stat-box stat-completed">
      <span class="stat-value">${stats.completed}</span>
      <span class="stat-label">Hoàn thành</span>
    </div>
    <div class="stat-box stat-upcoming">
      <span class="stat-value">${stats.upcoming}</span>
      <span class="stat-label">Chưa dạy</span>
    </div>
    <div class="stat-box stat-cancelled">
      <span class="stat-value">${stats.cancelled}</span>
      <span class="stat-label">Đã hủy</span>
    </div>
  </div>

  ${dateGroupsHTML}

  <div class="signature-section">
    <div class="signature-date">Ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}</div>
    <div class="signature-row">
      <div class="signature-col">
        <div class="sig-title">Người lập biểu</div>
        <div class="sig-sub">(Ký, ghi rõ họ tên)</div>
      </div>
      <div class="signature-col">
        <div class="sig-title">Giám đốc trung tâm</div>
        <div class="sig-sub">(Ký, đóng dấu)</div>
      </div>
    </div>
  </div>

  <div class="footer">
    Xuất từ Skill Master &mdash; ${formatDateVN(today)} ${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}
  </div>
</body>
</html>`;
}

// ============================================
// MAIN COMPONENT
// ============================================
export function ExportScheduleModal({
  isOpen,
  onClose,
  sessions = [],
  dateRange = {}
}) {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(null); // 'excel' | 'pdf' | null
  const [success, setSuccess] = useState(null);

  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleExportExcel = async () => {
    setExporting('excel');
    setSuccess(null);

    try {
      await handleExcelExport(sessions, dateRange);
      setSuccess('excel');
    } catch (error) {
      console.error('Export Excel error:', error);
      toast.error('Có lỗi khi xuất file Excel');
    } finally {
      setExporting(null);
    }
  };

  const handleExportPDF = async () => {
    setExporting('pdf');
    setSuccess(null);

    try {
      const html = generatePDFHTML(sessions, dateRange);

      const printWindow = window.open('', '_blank');
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();

      setTimeout(() => {
        printWindow.print();
      }, 500);

      setSuccess('pdf');
    } catch (error) {
      console.error('Export PDF error:', error);
      toast.error('Có lỗi khi xuất file PDF');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md m-4 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-dialog-title"
      >
        {/* Header */}
        <div className="bg-linear-to-r from-indigo-600 to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2
                  className="text-lg font-semibold text-white"
                  id="export-dialog-title"
                >Xuất Lịch Dạy</h2>
                <p className="text-indigo-100 text-sm">{sessions.length} buổi học</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Date range info */}
          {dateRange.startDate && dateRange.endDate && (
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-600">
                {dateRange.startDate} → {dateRange.endDate}
              </span>
            </div>
          )}

          {/* Export options */}
          <div className="space-y-3">
            {/* Excel */}
            <button
              onClick={handleExportExcel}
              disabled={exporting !== null}
              className="w-full flex items-center gap-4 p-4 border-2 border-slate-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group disabled:opacity-50"
            >
              <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
                <FileSpreadsheet className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-slate-900">Xuất Excel (.xlsx)</h3>
                <p className="text-sm text-slate-500">File Excel có định dạng chuyên nghiệp</p>
              </div>
              {exporting === 'excel' ? (
                <Loader2 className="w-5 h-5 animate-spin text-green-600" />
              ) : success === 'excel' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Download className="w-5 h-5 text-slate-400 group-hover:text-green-600" />
              )}
            </button>

            {/* PDF */}
            <button
              onClick={handleExportPDF}
              disabled={exporting !== null}
              className="w-full flex items-center gap-4 p-4 border-2 border-slate-200 rounded-xl hover:border-red-500 hover:bg-red-50 transition-all group disabled:opacity-50"
            >
              <div className="p-3 bg-red-100 rounded-xl group-hover:bg-red-200 transition-colors">
                <FileText className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-slate-900">Xuất PDF</h3>
                <p className="text-sm text-slate-500">In hoặc lưu dạng PDF chuyên nghiệp</p>
              </div>
              {exporting === 'pdf' ? (
                <Loader2 className="w-5 h-5 animate-spin text-red-600" />
              ) : success === 'pdf' ? (
                <CheckCircle className="w-5 h-5 text-red-600" />
              ) : (
                <Download className="w-5 h-5 text-slate-400 group-hover:text-red-600" />
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t">
          <Button
            variant="outline"
            className="w-full"
            onClick={onClose}
          >
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ExportScheduleModal;
