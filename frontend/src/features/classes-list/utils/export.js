/**
 * Export utilities for classes-list feature
 * Extracted from ExportButton for reuse
 */

// Download blob as file
export const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};

// Export to CSV
export const exportToCSV = (data, columns, filename) => {
    const headers = columns.map(col => col.label).join(',');
    const rows = data.map(item =>
        columns.map(col => {
            let value = col.accessor(item);
            // Handle values with commas or quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                value = `"${value.replace(/"/g, '""')}"`;
            }
            return value ?? '';
        }).join(',')
    );

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `${filename}.csv`);
};

// Export to JSON
export const exportToJSON = (data, filename) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    downloadBlob(blob, `${filename}.json`);
};

// Export to Excel (with fallback to CSV)
export const exportToExcel = async (data, columns, filename) => {
    try {
        const XLSX = await import('xlsx');

        const worksheetData = [
            columns.map(col => col.label),
            ...data.map(item => columns.map(col => col.accessor(item) ?? ''))
        ];

        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

        XLSX.writeFile(workbook, `${filename}.xlsx`);
        return true;
    } catch (error) {
        console.warn('XLSX library not available, falling back to CSV');
        return false;
    }
};

// Default columns for class export
export const CLASS_EXPORT_COLUMNS = [
    { key: 'code', label: 'Mã lớp', accessor: (d) => d.code },
    { key: 'name', label: 'Tên lớp', accessor: (d) => d.name },
    { key: 'course', label: 'Khóa học', accessor: (d) => d.courses?.title || '' },
    { key: 'teacher', label: 'Giáo viên', accessor: (d) => d.teacher?.full_name || d.users?.full_name || '' },
    { key: 'center', label: 'Trung tâm', accessor: (d) => d.centers?.name || '' },
    { key: 'room', label: 'Phòng', accessor: (d) => d.rooms?.name || d.room || '' },
    { key: 'start_date', label: 'Ngày bắt đầu', accessor: (d) => d.start_date || '' },
    { key: 'end_date', label: 'Ngày kết thúc', accessor: (d) => d.end_date || '' },
    {
        key: 'status', label: 'Trạng thái', accessor: (d) => {
            const statusMap = {
                upcoming: 'Sắp mở',
                ongoing: 'Đang học',
                completed: 'Đã kết thúc',
                cancelled: 'Đã hủy'
            };
            return statusMap[d.status] || d.status;
        }
    },
    { key: 'enrolled_count', label: 'Số học viên', accessor: (d) => d.enrolled_count || 0 },
    { key: 'max_students', label: 'Sức chứa tối đa', accessor: (d) => d.max_students || 0 },
];

/**
 * Export selected classes to CSV
 */
export const exportSelectedClasses = (selectedClasses) => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `lop-hoc-da-chon_${timestamp}`;
    exportToCSV(selectedClasses, CLASS_EXPORT_COLUMNS, filename);
};
