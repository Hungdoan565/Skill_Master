import XLSX from 'xlsx-js-style';

const STATUS_CONFIG = {
  active: {
    label: 'Hoạt động',
    textColor: '16A34A',
    bgColor: 'F0FDF4',
  },
  inactive: {
    label: 'Không hoạt động',
    textColor: 'DC2626',
    bgColor: 'FEF2F2',
  },
  suspended: {
    label: 'Tạm ngưng',
    textColor: 'EA580C',
    bgColor: 'FFF7ED',
  },
};

const TABLE_HEADERS = ['STT', 'Họ tên', 'Email', 'SĐT', 'Mã HV', 'Trạng thái', 'Ngày đăng ký'];

function calculateColumnWidth(value) {
  if (!value) return 8;
  const str = String(value);
  let width = 0;
  for (let i = 0; i < str.length; i++) {
    width += str.charCodeAt(i) > 127 ? 1.5 : 1;
  }
  return Math.max(width + 2, 8);
}

function formatDisplayDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('vi-VN');
}

function getStatusInfo(status) {
  return STATUS_CONFIG[status] || {
    label: status || 'Không xác định',
    textColor: '6B7280',
    bgColor: 'F3F4F6',
  };
}

function formatFileDate(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

function createStyles() {
  const thinBorder = {
    top: { style: 'thin', color: { rgb: 'D1D5DB' } },
    bottom: { style: 'thin', color: { rgb: 'D1D5DB' } },
    left: { style: 'thin', color: { rgb: 'D1D5DB' } },
    right: { style: 'thin', color: { rgb: 'D1D5DB' } },
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
    exportDate: {
      font: { italic: true, sz: 10, color: { rgb: '6B7280' }, name: 'Arial' },
      alignment: { horizontal: 'left', vertical: 'center' },
    },
    header: {
      font: { bold: true, sz: 10, color: { rgb: '1F2937' }, name: 'Arial' },
      fill: { fgColor: { rgb: 'E2E8F0' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: thinBorder,
    },
    cellText: {
      font: { sz: 10, color: { rgb: '111827' }, name: 'Arial' },
      alignment: { horizontal: 'left', vertical: 'center' },
      border: thinBorder,
    },
    cellCenter: {
      font: { sz: 10, color: { rgb: '111827' }, name: 'Arial' },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: thinBorder,
    },
    altRowFill: { fgColor: { rgb: 'F9FAFB' } },
    summary: {
      font: { bold: true, sz: 10, color: { rgb: '1F2937' }, name: 'Arial' },
      alignment: { horizontal: 'left', vertical: 'center' },
    },
  };
}

export function exportStudentsToExcel(students = [], centerName = 'Skill Master') {
  const styles = createStyles();
  const now = new Date();
  const exportDate = now.toLocaleDateString('vi-VN');
  const safeStudents = Array.isArray(students) ? students : [];
  const wsData = [];
  const columnCount = TABLE_HEADERS.length;

  wsData.push([{ v: String(centerName || 'Skill Master').toUpperCase(), s: styles.title }]);
  wsData.push([{ v: 'Danh sách học viên', s: styles.subtitle }]);
  wsData.push([{ v: `Xuất ngày: ${exportDate}`, s: styles.exportDate }]);
  wsData.push(['']);

  wsData.push(TABLE_HEADERS.map(header => ({ v: header, s: styles.header })));

  safeStudents.forEach((student, index) => {
    const statusInfo = getStatusInfo(student?.status);
    const rowFill = index % 2 === 1 ? { fill: styles.altRowFill } : {};
    const statusStyle = {
      ...styles.cellCenter,
      ...rowFill,
      font: {
        ...styles.cellCenter.font,
        bold: true,
        color: { rgb: statusInfo.textColor },
      },
      fill: { fgColor: { rgb: statusInfo.bgColor } },
    };

    wsData.push([
      { v: index + 1, t: 'n', s: { ...styles.cellCenter, ...rowFill } },
      { v: student?.full_name || '', s: { ...styles.cellText, ...rowFill } },
      { v: student?.email || '', s: { ...styles.cellText, ...rowFill } },
      { v: student?.phone || '', s: { ...styles.cellCenter, ...rowFill } },
      { v: student?.student_code || '', s: { ...styles.cellCenter, ...rowFill } },
      { v: statusInfo.label, s: statusStyle },
      { v: formatDisplayDate(student?.created_at), s: { ...styles.cellCenter, ...rowFill } },
    ]);
  });

  wsData.push(['']);

  const totalStudents = safeStudents.length;
  const activeCount = safeStudents.filter(student => student?.status === 'active').length;
  const inactiveCount = safeStudents.filter(student => student?.status === 'inactive').length;
  const suspendedCount = safeStudents.filter(student => student?.status === 'suspended').length;

  wsData.push([{ v: `Tổng số học viên: ${totalStudents}`, s: styles.summary }]);
  wsData.push([{ v: `Hoạt động: ${activeCount}`, s: { ...styles.summary, font: { ...styles.summary.font, color: { rgb: '16A34A' } } } }]);
  wsData.push([{ v: `Không hoạt động: ${inactiveCount}`, s: { ...styles.summary, font: { ...styles.summary.font, color: { rgb: 'DC2626' } } } }]);
  wsData.push([{ v: `Tạm ngưng: ${suspendedCount}`, s: { ...styles.summary, font: { ...styles.summary.font, color: { rgb: 'EA580C' } } } }]);

  const worksheet = XLSX.utils.aoa_to_sheet(wsData);
  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: columnCount - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: columnCount - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: columnCount - 1 } },
  ];

  const colWidths = TABLE_HEADERS.map((header, colIndex) => {
    let maxWidth = calculateColumnWidth(header);

    safeStudents.forEach((student, index) => {
      const statusInfo = getStatusInfo(student?.status);
      const valueByColumn = [
        index + 1,
        student?.full_name || '',
        student?.email || '',
        student?.phone || '',
        student?.student_code || '',
        statusInfo.label,
        formatDisplayDate(student?.created_at),
      ];
      const width = calculateColumnWidth(valueByColumn[colIndex]);
      if (width > maxWidth) {
        maxWidth = width;
      }
    });

    return { wch: Math.min(Math.max(maxWidth, 8), 40) };
  });

  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Học viên');

  XLSX.writeFile(workbook, `danh-sach-hoc-vien_${formatFileDate(now)}.xlsx`);
}
