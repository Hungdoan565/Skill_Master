/**
 * Export Utilities for Dashboard
 * Export dashboard data to CSV/JSON formats
 */

/**
 * Escape CSV field - handle commas, quotes, and newlines
 */
function escapeCSVField(field) {
  if (field === null || field === undefined) return '';
  const str = String(field);
  // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Format date range for display
 */
function formatDateRange(dateRange) {
  if (!dateRange?.start || !dateRange?.end) return 'Tất cả thời gian';
  const start = new Date(dateRange.start).toLocaleDateString('vi-VN');
  const end = new Date(dateRange.end).toLocaleDateString('vi-VN');
  return `${start} - ${end}`;
}

/**
 * Export dashboard summary to CSV
 */
export function exportDashboardToCSV(data, dateRange = null) {
  if (!data) return;

  const { stats, revenueChart, courseDistribution, recentStudents, paymentOverview, todaySchedule } = data;

  // Prepare CSV content
  let csv = 'SKILL MASTER - BÁO CÁO DASHBOARD\n';
  csv += `Ngày xuất: ${new Date().toLocaleString('vi-VN')}\n`;
  csv += `Kỳ báo cáo: ${formatDateRange(dateRange)}\n\n`;

  // Stats section
  csv += 'THỐNG KÊ TỔNG QUAN\n';
  csv += 'Chỉ số,Giá trị\n';
  csv += `Tổng doanh thu,${escapeCSVField(stats?.revenue?.formatted || '0đ')}\n`;
  csv += `Học viên ghi danh,${stats?.newStudents?.value || 0}\n`;
  csv += `Lớp hoạt động,${stats?.activeClasses?.value || 0}\n`;
  csv += `Công nợ cần thu,${escapeCSVField(stats?.debt?.formatted || '0đ')}\n\n`;

  // Payment overview
  if (paymentOverview) {
    csv += 'TỔNG QUAN THANH TOÁN\n';
    csv += 'Trạng thái,Số lượng,Số tiền\n';
    csv += `Đã thanh toán,${paymentOverview.counts?.paid || 0},${escapeCSVField(paymentOverview.amounts?.totalPaidFormatted || '0đ')}\n`;
    csv += `Chờ thanh toán,${paymentOverview.counts?.pending || 0},${escapeCSVField(paymentOverview.amounts?.totalPendingFormatted || '0đ')}\n`;
    csv += `Quá hạn,${paymentOverview.counts?.overdue || 0},${escapeCSVField(paymentOverview.amounts?.totalOverdueFormatted || '0đ')}\n\n`;
  }

  // Revenue chart
  if (revenueChart && revenueChart.length > 0) {
    csv += 'DOANH THU THEO THÁNG\n';
    csv += 'Tháng,Doanh thu\n';
    revenueChart.forEach(item => {
      csv += `${escapeCSVField(item.label || item.month)},${item.revenue || 0}\n`;
    });
    csv += '\n';
  }

  // Course distribution
  if (courseDistribution && courseDistribution.length > 0) {
    csv += 'PHÂN BỐ HỌC VIÊN THEO KHÓA HỌC\n';
    csv += 'Khóa học,Số lượng,Tỷ lệ (%)\n';
    const total = courseDistribution.reduce((sum, item) => sum + (item.value || 0), 0);
    courseDistribution.forEach(item => {
      const percentage = total > 0 ? ((item.value || 0) / total * 100).toFixed(1) : 0;
      csv += `${escapeCSVField(item.name)},${item.value || 0},${percentage}\n`;
    });
    csv += '\n';
  }

  // Recent students
  if (recentStudents && recentStudents.length > 0) {
    csv += 'HỌC VIÊN MỚI GHI DANH\n';
    csv += 'Tên,Email,Khóa học,Mã lớp,Trạng thái,Thời gian\n';
    recentStudents.forEach(student => {
      const statusMap = { paid: 'Đã TT', partial: 'TT một phần', pending: 'Chờ TT', cancelled: 'Đã hủy' };
      csv += `${escapeCSVField(student.name || 'N/A')},${escapeCSVField(student.email || '')},${escapeCSVField(student.course || '')},${escapeCSVField(student.class_code || '')},${statusMap[student.status] || student.status || ''},${escapeCSVField(student.time || '')}\n`;
    });
    csv += '\n';
  }

  // Today's schedule
  if (todaySchedule?.sessions && todaySchedule.sessions.length > 0) {
    csv += 'LỊCH HỌC HÔM NAY\n';
    csv += 'Thời gian,Lớp,Khóa học,Giáo viên,Trạng thái\n';
    todaySchedule.sessions.forEach(session => {
      const statusMap = { scheduled: 'Đã lên lịch', completed: 'Hoàn thành', cancelled: 'Đã hủy' };
      csv += `${escapeCSVField(session.time)},${escapeCSVField(session.class_code || '')},${escapeCSVField(session.course || '')},${escapeCSVField(session.teacher || '')},${statusMap[session.status] || session.status || ''}\n`;
    });
  }

  // Create download link
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  const timestamp = new Date().toISOString().split('T')[0];

  link.setAttribute('href', url);
  link.setAttribute('download', `Dashboard_Report_${timestamp}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export dashboard summary to JSON
 */
export function exportDashboardToJSON(data) {
  if (!data) return;
  
  const exportData = {
    exportDate: new Date().toISOString(),
    ...data
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  const timestamp = new Date().toISOString().split('T')[0];
  
  link.setAttribute('href', url);
  link.setAttribute('download', `Dashboard_Data_${timestamp}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

