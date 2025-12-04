/**
 * ExportScheduleModal - Modal xuất lịch dạy ra PDF/Excel
 */

import { useState } from 'react';
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
import { supabase } from '@/lib/supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ============================================
// EXPORT HELPERS
// ============================================

// Convert sessions to CSV format
const generateCSV = (sessions, dateRange) => {
  const headers = [
    'Ngày',
    'Thứ',
    'Giờ bắt đầu',
    'Giờ kết thúc',
    'Lớp học',
    'Mã lớp',
    'Giáo viên',
    'Phòng học',
    'Trạng thái',
    'Buổi số'
  ];
  
  const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const statusLabels = {
    scheduled: 'Chưa học',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy'
  };
  
  const rows = sessions.map(s => {
    const date = new Date(s.session_date);
    return [
      s.session_date,
      dayNames[date.getDay()],
      s.start_time?.substring(0, 5) || '',
      s.end_time?.substring(0, 5) || '',
      s.classes?.name || '',
      s.classes?.code || '',
      s.users?.full_name || '',
      s.classes?.rooms?.name || '',
      statusLabels[s.status] || s.status,
      s.session_number
    ];
  });
  
  // BOM for UTF-8
  const BOM = '\uFEFF';
  const csvContent = BOM + [headers, ...rows].map(row => row.join(',')).join('\n');
  
  return csvContent;
};

// Generate HTML for PDF export
const generatePDFHTML = (sessions, dateRange, title) => {
  const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const statusLabels = {
    scheduled: 'Chưa học',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy'
  };
  const statusColors = {
    scheduled: '#3b82f6',
    completed: '#10b981',
    cancelled: '#6b7280'
  };
  
  // Group by date
  const grouped = sessions.reduce((acc, s) => {
    if (!acc[s.session_date]) acc[s.session_date] = [];
    acc[s.session_date].push(s);
    return acc;
  }, {});
  
  const sortedDates = Object.keys(grouped).sort();
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Arial, sans-serif; 
          padding: 20px;
          color: #1e293b;
        }
        .header { 
          text-align: center; 
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #e2e8f0;
        }
        .header h1 { 
          font-size: 24px; 
          color: #4f46e5;
          margin-bottom: 5px;
        }
        .header p { 
          color: #64748b; 
          font-size: 14px;
        }
        .date-section {
          margin-bottom: 20px;
        }
        .date-header {
          background: #f1f5f9;
          padding: 8px 12px;
          font-weight: 600;
          border-radius: 6px;
          margin-bottom: 10px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }
        th {
          background: #4f46e5;
          color: white;
          padding: 10px 8px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
        }
        td {
          padding: 8px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 12px;
        }
        tr:hover { background: #f8fafc; }
        .status {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          color: #94a3b8;
          font-size: 11px;
        }
        @media print {
          body { padding: 0; }
          .date-section { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📅 Lịch Dạy</h1>
        <p>${title}</p>
        <p style="margin-top: 5px; font-size: 12px;">
          Tổng: ${sessions.length} buổi học
        </p>
      </div>
      
      ${sortedDates.map(date => {
        const daySessions = grouped[date];
        const d = new Date(date);
        return `
          <div class="date-section">
            <div class="date-header">
              ${dayNames[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}
              <span style="float: right; font-weight: normal; color: #64748b;">
                ${daySessions.length} buổi
              </span>
            </div>
            <table>
              <thead>
                <tr>
                  <th style="width: 60px;">Buổi</th>
                  <th style="width: 100px;">Thời gian</th>
                  <th>Lớp học</th>
                  <th>Giáo viên</th>
                  <th style="width: 80px;">Phòng</th>
                  <th style="width: 90px;">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                ${daySessions.map(s => `
                  <tr>
                    <td style="text-align: center; font-weight: 600;">#${s.session_number}</td>
                    <td>${(s.start_time || '').substring(0, 5)} - ${(s.end_time || '').substring(0, 5)}</td>
                    <td>
                      <strong>${s.classes?.name || 'N/A'}</strong>
                      <br><span style="color: #64748b; font-size: 11px;">${s.classes?.code || ''}</span>
                    </td>
                    <td>${s.users?.full_name || '-'}</td>
                    <td>${s.classes?.rooms?.name || '-'}</td>
                    <td>
                      <span class="status" style="background: ${statusColors[s.status]}20; color: ${statusColors[s.status]};">
                        ${statusLabels[s.status] || s.status}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }).join('')}
      
      <div class="footer">
        <p>Xuất từ Skill Master - ${new Date().toLocaleString('vi-VN')}</p>
      </div>
    </body>
    </html>
  `;
};

// ============================================
// MAIN COMPONENT
// ============================================
export function ExportScheduleModal({ 
  isOpen, 
  onClose, 
  sessions = [],
  dateRange = {}
}) {
  const [exporting, setExporting] = useState(null); // 'csv' | 'pdf' | null
  const [success, setSuccess] = useState(null);

  if (!isOpen) return null;

  const handleExportCSV = async () => {
    setExporting('csv');
    setSuccess(null);
    
    try {
      const csv = generateCSV(sessions, dateRange);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lich-day_${dateRange.startDate || 'all'}_${dateRange.endDate || 'dates'}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setSuccess('csv');
    } catch (error) {
      console.error('Export CSV error:', error);
      alert('Có lỗi khi xuất file CSV');
    } finally {
      setExporting(null);
    }
  };

  const handleExportPDF = async () => {
    setExporting('pdf');
    setSuccess(null);
    
    try {
      const title = dateRange.startDate && dateRange.endDate 
        ? `Từ ${dateRange.startDate} đến ${dateRange.endDate}`
        : 'Tất cả buổi học';
      
      const html = generatePDFHTML(sessions, dateRange, title);
      
      // Open print dialog
      const printWindow = window.open('', '_blank');
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      
      // Wait for content to load then print
      setTimeout(() => {
        printWindow.print();
        // printWindow.close();
      }, 500);
      
      setSuccess('pdf');
    } catch (error) {
      console.error('Export PDF error:', error);
      alert('Có lỗi khi xuất file PDF');
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
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md m-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Xuất Lịch Dạy</h2>
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
            {/* Excel/CSV */}
            <button
              onClick={handleExportCSV}
              disabled={exporting !== null}
              className="w-full flex items-center gap-4 p-4 border-2 border-slate-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group disabled:opacity-50"
            >
              <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
                <FileSpreadsheet className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-slate-900">Xuất Excel (CSV)</h3>
                <p className="text-sm text-slate-500">File .csv có thể mở bằng Excel</p>
              </div>
              {exporting === 'csv' ? (
                <Loader2 className="w-5 h-5 animate-spin text-green-600" />
              ) : success === 'csv' ? (
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
                <p className="text-sm text-slate-500">In hoặc lưu dạng PDF</p>
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
