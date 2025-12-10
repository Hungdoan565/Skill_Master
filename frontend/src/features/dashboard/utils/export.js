/**
 * Export Utilities for Dashboard
 * Export dashboard data to CSV/JSON formats
 */

/**
 * Export dashboard summary to CSV
 */
export function exportDashboardToCSV(data) {
  if (!data) return;

  const { stats, revenueChart, courseDistribution, recentStudents } = data;
  
  // Prepare CSV content
  let csv = 'SKILL MASTER - BÁO CÁO DASHBOARD\n';
  csv += `Ngày xuất: ${new Date().toLocaleString('vi-VN')}\n\n`;
  
  // Stats section
  csv += 'THỐNG KÊ TỔNG QUAN\n';
  csv += 'Chỉ số,Giá trị\n';
  csv += `Tổng doanh thu,${stats?.revenue?.formatted || '0đ'}\n`;
  csv += `Học viên ghi danh,${stats?.newStudents?.value || 0}\n`;
  csv += `Lớp hoạt động,${stats?.activeClasses?.value || 0}\n`;
  csv += `Công nợ cần thu,${stats?.debt?.formatted || '0đ'}\n\n`;
  
  // Revenue chart
  if (revenueChart && revenueChart.length > 0) {
    csv += 'DOANH THU THEO THÁNG\n';
    csv += 'Tháng,Doanh thu\n';
    revenueChart.forEach(item => {
      csv += `${item.label || item.month},${item.revenue || 0}\n`;
    });
    csv += '\n';
  }
  
  // Course distribution
  if (courseDistribution && courseDistribution.length > 0) {
    csv += 'PHÂN BỐ HỌC VIÊN THEO KHÓA HỌC\n';
    csv += 'Khóa học,Số lượng\n';
    courseDistribution.forEach(item => {
      csv += `${item.name},${item.value || 0}\n`;
    });
    csv += '\n';
  }
  
  // Recent students
  if (recentStudents && recentStudents.length > 0) {
    csv += 'HỌC VIÊN MỚI\n';
    csv += 'Tên,Email,Khóa học,Thời gian\n';
    recentStudents.forEach(student => {
      csv += `${student.name || 'N/A'},${student.email || ''},${student.course || ''},${student.time || ''}\n`;
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

