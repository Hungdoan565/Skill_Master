import * as XLSX from 'xlsx';

export function exportToExcel(data, columns, filename, centerName) {
  // columns: [{ key: 'field_name', header: 'Vietnamese Header' }]
  const header = columns.map((c) => c.header);
  const rows = data.map((row) => columns.map((c) => row[c.key] ?? ''));

  const ws = XLSX.utils.aoa_to_sheet([
    [centerName || 'Skill Master'],
    [`Xuất ngày: ${new Date().toLocaleDateString('vi-VN')}`],
    [],
    header,
    ...rows,
  ]);

  // Column widths
  ws['!cols'] = columns.map(() => ({ wch: 20 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
}
