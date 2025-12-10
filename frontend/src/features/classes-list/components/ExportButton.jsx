/**
 * ExportButton Component
 * Button with dropdown menu for exporting data in various formats
 */

import { useState, useRef, useEffect } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  Check,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Export utilities
const exportToCSV = (data, columns, filename) => {
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

const exportToJSON = (data, filename) => {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  downloadBlob(blob, `${filename}.json`);
};

const exportToExcel = async (data, columns, filename) => {
  // Check if XLSX is available
  try {
    const XLSX = await import('xlsx');
    
    // Prepare data for Excel
    const worksheetData = [
      columns.map(col => col.label), // Header row
      ...data.map(item => columns.map(col => col.accessor(item) ?? ''))
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    return true;
  } catch (error) {
    console.error('XLSX library not available, falling back to CSV:', error);
    return false;
  }
};

const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Default columns for class export
const DEFAULT_CLASS_COLUMNS = [
  { key: 'code', label: 'Mã lớp', accessor: (d) => d.code },
  { key: 'name', label: 'Tên lớp', accessor: (d) => d.name },
  { key: 'course', label: 'Khóa học', accessor: (d) => d.courses?.title || '' },
  { key: 'teacher', label: 'Giáo viên', accessor: (d) => d.teacher?.full_name || d.users?.full_name || '' },
  { key: 'center', label: 'Trung tâm', accessor: (d) => d.centers?.name || '' },
  { key: 'room', label: 'Phòng', accessor: (d) => d.rooms?.name || d.room || '' },
  { key: 'start_date', label: 'Ngày bắt đầu', accessor: (d) => d.start_date || '' },
  { key: 'end_date', label: 'Ngày kết thúc', accessor: (d) => d.end_date || '' },
  { key: 'status', label: 'Trạng thái', accessor: (d) => {
    const statusMap = {
      upcoming: 'Sắp mở',
      ongoing: 'Đang học',
      completed: 'Đã kết thúc',
      cancelled: 'Đã hủy'
    };
    return statusMap[d.status] || d.status;
  }},
  { key: 'enrolled_count', label: 'Số học viên', accessor: (d) => d.enrolled_count || 0 },
  { key: 'max_students', label: 'Sức chứa tối đa', accessor: (d) => d.max_students || 0 },
  { key: 'created_at', label: 'Ngày tạo', accessor: (d) => d.created_at ? new Date(d.created_at).toLocaleDateString('vi-VN') : '' }
];

export function ExportButton({ 
  data = [], 
  columns = DEFAULT_CLASS_COLUMNS,
  filename = 'export',
  title = 'Xuất dữ liệu',
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState(columns.map(c => c.key));
  const [exporting, setExporting] = useState(false);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowColumnSelector(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleColumn = (key) => {
    setSelectedColumns(prev => 
      prev.includes(key) 
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };

  const getActiveColumns = () => {
    return columns.filter(col => selectedColumns.includes(col.key));
  };

  const handleExport = async (format) => {
    setExporting(true);
    try {
      const activeColumns = getActiveColumns();
      const timestamp = new Date().toISOString().split('T')[0];
      const exportFilename = `${filename}_${timestamp}`;

      switch (format) {
        case 'excel':
          const success = await exportToExcel(data, activeColumns, exportFilename);
          if (!success) {
            // Fallback to CSV if Excel export fails
            exportToCSV(data, activeColumns, exportFilename);
          }
          break;
        case 'csv':
          exportToCSV(data, activeColumns, exportFilename);
          break;
        case 'json':
          exportToJSON(data, exportFilename);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setExporting(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || data.length === 0 || exporting}
      >
        {exporting ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Download className="w-4 h-4 mr-2" />
        )}
        {title}
        <ChevronDown className="w-4 h-4 ml-2" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
          {/* Export Format Options */}
          <div className="p-2 border-b border-slate-100">
            <p className="text-xs font-medium text-slate-500 px-2 py-1">Định dạng xuất</p>
            <button
              onClick={() => handleExport('excel')}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-md"
            >
              <FileSpreadsheet className="w-4 h-4 text-green-600" />
              <span>Excel (.xlsx)</span>
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-md"
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <span>CSV (.csv)</span>
            </button>
            <button
              onClick={() => handleExport('json')}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-md"
            >
              <FileText className="w-4 h-4 text-amber-600" />
              <span>JSON (.json)</span>
            </button>
          </div>

          {/* Column Selector Toggle */}
          <div className="p-2">
            <button
              onClick={() => setShowColumnSelector(!showColumnSelector)}
              className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-md"
            >
              {showColumnSelector ? 'Ẩn' : 'Chọn'} cột xuất ({selectedColumns.length}/{columns.length})
            </button>

            {showColumnSelector && (
              <div className="mt-2 max-h-48 overflow-y-auto border-t border-slate-100 pt-2">
                {columns.map(col => (
                  <label
                    key={col.key}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-slate-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedColumns.includes(col.key)}
                      onChange={() => toggleColumn(col.key)}
                      className="rounded border-slate-300"
                    />
                    <span className="text-slate-700">{col.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="px-4 py-2 bg-slate-50 text-xs text-slate-500 border-t border-slate-100 rounded-b-lg">
            Xuất {data.length} bản ghi
          </div>
        </div>
      )}
    </div>
  );
}

export default ExportButton;
