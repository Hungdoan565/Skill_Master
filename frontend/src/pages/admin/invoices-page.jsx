import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/auth-context';
import { 
  Receipt, Search, Download, Filter, Calendar, 
  TrendingUp, DollarSign, AlertCircle, CheckCircle2, Clock,
  ChevronLeft, ChevronRight, X, Eye, CreditCard, 
  Loader2, Banknote, QrCode, Smartphone, Copy, Check, RefreshCw,
  FileText, Users, Building2, ArrowUpRight, MoreHorizontal
} from 'lucide-react';
import { Button } from '../../components/ui/button';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ============================================
// BANK CONFIG - VietQR
// ============================================
const BANK_CONFIG = {
  bankId: 'MB',
  accountNo: '0971268268',
  accountName: 'NGUYEN VAN A',
  template: 'compact2'
};

// ============================================
// UTILITY FUNCTIONS
// ============================================
const formatCurrency = (value) => {
  if (!value) return '';
  const number = value.toString().replace(/[^0-9]/g, '');
  return number.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// ============================================
// STAT CARD COMPONENT
// ============================================
const StatCard = ({ title, value, icon: Icon, description, accentColor = 'red', onClick }) => {
  const accentClasses = {
    red: 'from-red-500 to-orange-500 shadow-red-500/25',
    emerald: 'from-emerald-500 to-teal-500 shadow-emerald-500/25',
    amber: 'from-amber-500 to-orange-500 shadow-amber-500/25',
    blue: 'from-blue-500 to-indigo-500 shadow-blue-500/25',
  };

  return (
    <div 
      className={`group relative bg-white rounded-2xl p-5 shadow-sm shadow-stone-900/5 border border-stone-200/60
                  hover:shadow-lg hover:shadow-stone-900/10 hover:border-stone-300/60
                  transition-all duration-300 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl 
                        bg-gradient-to-br ${accentClasses[accentColor]} shadow-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-zinc-500">{title}</p>
          <p className="font-display text-2xl font-bold text-zinc-900 tracking-tight mt-0.5">
            {value}
          </p>
          {description && (
            <p className="text-xs text-zinc-400 mt-1">{description}</p>
          )}
        </div>
        {onClick && (
          <ArrowUpRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
        )}
      </div>
    </div>
  );
};

// ============================================
// STATUS BADGE COMPONENT
// ============================================
const StatusBadge = ({ status }) => {
  const statusConfig = {
    unpaid: { label: 'Chưa thanh toán', className: 'bg-red-100 text-red-700 border-red-200' },
    partial: { label: 'Đang đợi', className: 'bg-amber-100 text-amber-700 border-amber-200' },
    paid: { label: 'Đã thanh toán', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    cancelled: { label: 'Đã hủy', className: 'bg-zinc-100 text-zinc-600 border-zinc-200' },
    refunded: { label: 'Hoàn tiền', className: 'bg-purple-100 text-purple-700 border-purple-200' },
  };

  const config = statusConfig[status] || statusConfig.unpaid;

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}>
      {config.label}
    </span>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
function InvoicesPage() {
  const { session } = useAuth();
  
  // Data states
  const [invoices, setInvoices] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Debounce search - auto search sau 400ms ngừng gõ
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      // Reset về trang 1 khi search thay đổi
      if (searchTerm !== debouncedSearch) {
        setPagination(prev => ({ ...prev, page: 1 }));
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,  // Giảm xuống 10 để dễ test phân trang
    total: 0,
    totalPages: 0
  });
  
  // Modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [invoiceDetail, setInvoiceDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  // Payment form
  const [paymentData, setPaymentData] = useState({ amount: '', method: 'cash', notes: '' });
  const [processing, setProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Toast
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // ============================================
  // FETCH DATA
  // ============================================
  const fetchInvoices = useCallback(async () => {
    if (!session?.access_token) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy: 'created_at',
        sortOrder: 'desc'
      });
      
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (debouncedSearch.trim()) {
        params.append('search', debouncedSearch.trim());
      }
      if (dateRange.start) {
        params.append('startDate', dateRange.start);
      }
      if (dateRange.end) {
        params.append('endDate', dateRange.end);
      }

      const res = await fetch(`${API_URL}/api/invoices?${params}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      
      const result = await res.json();
      if (result.success) {
        setInvoices(result.data || []);
        setPagination(prev => ({
          ...prev,
          total: result.pagination?.total || 0,
          totalPages: result.pagination?.totalPages || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      showToast('Lỗi khi tải danh sách hóa đơn', 'error');
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, pagination.page, pagination.limit, statusFilter, debouncedSearch, dateRange.start, dateRange.end]);

  const fetchStatistics = useCallback(async () => {
    if (!session?.access_token) return;
    
    setLoadingStats(true);
    try {
      const res = await fetch(`${API_URL}/api/invoices/statistics`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      
      const result = await res.json();
      if (result.success) {
        setStatistics(result.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoadingStats(false);
    }
  }, [session?.access_token]);

  const fetchInvoiceDetail = async (invoiceId) => {
    if (!session?.access_token || !invoiceId) return;
    
    setLoadingDetail(true);
    try {
      const res = await fetch(`${API_URL}/api/invoices/${invoiceId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      
      const result = await res.json();
      if (result.success) {
        setInvoiceDetail(result.data);
      }
    } catch (error) {
      console.error('Error fetching invoice detail:', error);
      showToast('Lỗi khi tải chi tiết hóa đơn', 'error');
    } finally {
      setLoadingDetail(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // ============================================
  // HANDLERS
  // ============================================
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Debounce đã handle việc search, chỉ cần reset page khi submit form
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const openPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    const remaining = (invoice.final_amount || 0) - (invoice.paid_amount || 0);
    setPaymentData({ 
      amount: remaining > 0 ? remaining.toString() : '', 
      method: 'cash', 
      notes: '' 
    });
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedInvoice(null);
    setPaymentData({ amount: '', method: 'cash', notes: '' });
    setCopied(false);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedInvoice || !paymentData.amount) return;

    const amount = parseInt(paymentData.amount.replace(/[^0-9]/g, ''));
    if (amount <= 0) {
      showToast('Số tiền phải lớn hơn 0', 'error');
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch(`${API_URL}/api/invoices/${selectedInvoice.id}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          amount,
          payment_method: paymentData.method,
          notes: paymentData.notes
        })
      });

      const result = await res.json();
      if (result.success) {
        showToast(`Đã thu ${amount.toLocaleString()}đ thành công!`, 'success');
        closePaymentModal();
        fetchInvoices();
        fetchStatistics();
      } else {
        showToast(result.message || 'Lỗi khi thanh toán', 'error');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      showToast('Lỗi khi xử lý thanh toán', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const openDetailModal = async (invoice) => {
    setShowDetailModal(true);
    await fetchInvoiceDetail(invoice.id);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setInvoiceDetail(null);
  };

  // ============================================
  // EXPORT EXCEL - Chuẩn Kế toán Việt Nam
  // ============================================
  const handleExport = async () => {
    try {
      const XLSX = await import('xlsx-js-style');
      
      // Thống kê
      const totalAmount = invoices.reduce((sum, inv) => sum + (inv.final_amount || 0), 0);
      const totalPaid = invoices.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0);
      const totalDebt = totalAmount - totalPaid;
      
      const today = new Date();
      const monthYear = today.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });

      // ========== STYLES CHUẨN KẾ TOÁN (10/10) ==========
      
      // Border chuẩn
      const thinBorder = {
        top: { style: "thin", color: { rgb: "D1D5DB" } },
        bottom: { style: "thin", color: { rgb: "D1D5DB" } },
        left: { style: "thin", color: { rgb: "D1D5DB" } },
        right: { style: "thin", color: { rgb: "D1D5DB" } },
      };
      
      // Title - Xanh Navy
      const titleStyle = {
        font: { bold: true, sz: 16, color: { rgb: "FFFFFF" }, name: "Arial" },
        fill: { fgColor: { rgb: "1E3A8A" } },
        alignment: { horizontal: "center", vertical: "center" },
      };
      
      const subtitleStyle = {
        font: { bold: true, sz: 12, color: { rgb: "1E3A8A" }, name: "Arial" },
        alignment: { horizontal: "center", vertical: "center" },
      };
      
      const infoStyle = {
        font: { sz: 10, italic: true, color: { rgb: "6B7280" }, name: "Arial" },
        alignment: { horizontal: "center" },
      };
      
      // Summary - Nền xanh nhạt
      const summaryLabelStyle = {
        font: { bold: true, sz: 11, color: { rgb: "1E3A8A" }, name: "Arial" },
        fill: { fgColor: { rgb: "DBEAFE" } },
        alignment: { horizontal: "right", vertical: "center" },
        border: { bottom: { style: "thin", color: { rgb: "93C5FD" } } }
      };
      
      const summaryValueStyle = {
        font: { bold: true, sz: 12, color: { rgb: "047857" }, name: "Arial" },
        fill: { fgColor: { rgb: "DBEAFE" } },
        alignment: { horizontal: "right", vertical: "center" },
        numFmt: '#,##0  ', // Padding phải 2 spaces
        border: { bottom: { style: "thin", color: { rgb: "93C5FD" } } }
      };
      
      const summaryDebtStyle = {
        font: { bold: true, sz: 12, color: { rgb: "DC2626" }, name: "Arial" },
        fill: { fgColor: { rgb: "FEE2E2" } },
        alignment: { horizontal: "right", vertical: "center" },
        numFmt: '#,##0  ',
        border: { bottom: { style: "thin", color: { rgb: "FCA5A5" } } }
      };
      
      // Table Header - Xanh đậm
      const headerStyle = {
        font: { bold: true, sz: 10, color: { rgb: "FFFFFF" }, name: "Arial" },
        fill: { fgColor: { rgb: "1E40AF" } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: {
          top: { style: "medium", color: { rgb: "1E3A8A" } },
          bottom: { style: "medium", color: { rgb: "1E3A8A" } },
          left: { style: "thin", color: { rgb: "3B82F6" } },
          right: { style: "thin", color: { rgb: "3B82F6" } },
        }
      };
      
      // Cell Text - Căn trái (mặc định cho text dài)
      const cellTextStyle = {
        font: { sz: 10, name: "Arial" },
        alignment: { horizontal: "left", vertical: "center" },
        border: thinBorder,
      };
      
      // Cell Center - Căn giữa (cho STT, Mã, SĐT)
      const cellCenterStyle = {
        font: { sz: 10, name: "Arial" },
        alignment: { horizontal: "center", vertical: "center" },
        border: thinBorder,
      };
      
      // Cell Date - Căn giữa + format ngày (FIX TAM GIÁC XANH)
      const cellDateStyle = {
        font: { sz: 10, name: "Arial" },
        alignment: { horizontal: "center", vertical: "center" },
        border: thinBorder,
        numFmt: 'dd/mm/yyyy', // Format ngày chuẩn Việt Nam
      };
      
      // Helper format date thủ công để đảm bảo dd/mm/yyyy
      const formatDateVN = (dateStr) => {
        if (!dateStr) return null;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return null;
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      };
      
      // Currency - Căn phải + format số + padding
      const currencyStyle = {
        font: { sz: 10, name: "Arial" },
        alignment: { horizontal: "right", vertical: "center" },
        border: thinBorder,
        numFmt: '#,##0  ', // Padding 2 spaces bên phải
      };
      
      const currencyPaidStyle = {
        font: { sz: 10, name: "Arial", color: { rgb: "047857" } },
        alignment: { horizontal: "right", vertical: "center" },
        border: thinBorder,
        numFmt: '#,##0  ',
      };
      
      const currencyDebtStyle = {
        font: { sz: 10, bold: true, name: "Arial", color: { rgb: "DC2626" } },
        fill: { fgColor: { rgb: "FEF2F2" } },
        alignment: { horizontal: "right", vertical: "center" },
        border: thinBorder,
        numFmt: '#,##0  ',
      };
      
      const currencyZeroStyle = {
        font: { sz: 10, name: "Arial", color: { rgb: "9CA3AF" } },
        alignment: { horizontal: "right", vertical: "center" },
        border: thinBorder,
        numFmt: '#,##0  ',
      };
      
      // Status badges - TÔ NỀN thay vì chỉ tô chữ
      const statusPaidStyle = {
        font: { sz: 9, bold: true, name: "Arial", color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "10B981" } }, // Green background
        alignment: { horizontal: "center", vertical: "center" },
        border: thinBorder,
      };
      
      const statusUnpaidStyle = {
        font: { sz: 9, bold: true, name: "Arial", color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "EF4444" } }, // Red background
        alignment: { horizontal: "center", vertical: "center" },
        border: thinBorder,
      };
      
      const statusPartialStyle = {
        font: { sz: 9, bold: true, name: "Arial", color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "F59E0B" } }, // Amber background
        alignment: { horizontal: "center", vertical: "center" },
        border: thinBorder,
      };
      
      const statusCancelledStyle = {
        font: { sz: 9, bold: true, name: "Arial", color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "6B7280" } }, // Gray background
        alignment: { horizontal: "center", vertical: "center" },
        border: thinBorder,
      };
      
      // Payment method style
      const paymentMethodStyle = {
        font: { sz: 9, name: "Arial" },
        alignment: { horizontal: "center", vertical: "center" },
        border: thinBorder,
      };
      
      // Footer total style
      const footerLabelStyle = {
        font: { bold: true, sz: 11, color: { rgb: "1E3A8A" }, name: "Arial" },
        fill: { fgColor: { rgb: "E0E7FF" } },
        alignment: { horizontal: "right", vertical: "center" },
        border: {
          top: { style: "medium", color: { rgb: "1E3A8A" } },
          bottom: { style: "medium", color: { rgb: "1E3A8A" } },
        }
      };
      
      const footerValueStyle = {
        font: { bold: true, sz: 11, name: "Arial" },
        fill: { fgColor: { rgb: "E0E7FF" } },
        alignment: { horizontal: "right", vertical: "center" },
        numFmt: '#,##0  ',
        border: {
          top: { style: "medium", color: { rgb: "1E3A8A" } },
          bottom: { style: "medium", color: { rgb: "1E3A8A" } },
        }
      };
      
      // Signature style
      const signatureLabelStyle = {
        font: { bold: true, sz: 10, color: { rgb: "374151" }, name: "Arial" },
        alignment: { horizontal: "center", vertical: "center" },
      };
      
      const signatureLineStyle = {
        font: { italic: true, sz: 9, color: { rgb: "6B7280" }, name: "Arial" },
        alignment: { horizontal: "center", vertical: "center" },
      };

      // ========== BUILD DATA ==========
      const wsData = [];
      
      // Row 0: Title
      wsData.push([{ v: 'BÁO CÁO CÔNG NỢ HỌC PHÍ', s: titleStyle }]);
      // Row 1: Center name
      wsData.push([{ v: 'TRUNG TÂM ĐÀO TẠO SKILL MASTER', s: subtitleStyle }]);
      // Row 2: Period
      wsData.push([{ v: `Kỳ báo cáo: ${monthYear}`, s: infoStyle }]);
      // Row 3: Export info
      wsData.push([{ v: `Ngày lập: ${today.toLocaleDateString('vi-VN')} | Người lập: Admin`, s: infoStyle }]);
      // Row 4: Empty
      wsData.push([]);
      
      // Row 5: Summary section
      const summaryRow = [];
      for (let i = 0; i < 14; i++) summaryRow.push({ v: '', s: {} });
      summaryRow[1] = { v: 'TỔNG HỌC PHÍ:', s: summaryLabelStyle };
      summaryRow[2] = { v: totalAmount, t: 'n', s: summaryValueStyle };
      summaryRow[4] = { v: 'ĐÃ THU:', s: summaryLabelStyle };
      summaryRow[5] = { v: totalPaid, t: 'n', s: summaryValueStyle };
      summaryRow[7] = { v: 'CÒN NỢ:', s: { ...summaryLabelStyle, fill: { fgColor: { rgb: "FEE2E2" } } } };
      summaryRow[8] = { v: totalDebt, t: 'n', s: summaryDebtStyle };
      wsData.push(summaryRow);
      
      // Row 6: Empty
      wsData.push([]);
      
      // Row 7: Column headers
      const headers = ['STT', 'Mã hóa đơn', 'Học viên', 'Email', 'SĐT', 'Lớp học', 'Khóa học', 'Học phí', 'Đã thanh toán', 'Còn nợ', 'PTTT', 'Trạng thái', 'Ngày tạo', 'Hạn TT'];
      wsData.push(headers.map(h => ({ v: h, s: headerStyle })));
      
      // Data rows
      invoices.forEach((inv, idx) => {
        const debt = (inv.final_amount || 0) - (inv.paid_amount || 0);
        const statusText = {
          unpaid: 'Chưa TT',
          partial: 'Một phần',
          paid: 'Đã TT',
          cancelled: 'Đã hủy',
          refunded: 'Hoàn tiền'
        }[inv.status] || inv.status;
        
        // PTTT logic
        const paymentMethod = inv.paid_amount > 0 ? 'CK' : '—';
        
        // Status style mapping
        const getStatusStyle = (status) => {
          switch(status) {
            case 'paid': return statusPaidStyle;
            case 'partial': return statusPartialStyle;
            case 'cancelled': 
            case 'refunded': return statusCancelledStyle;
            default: return statusUnpaidStyle;
          }
        };
        
        // Alternate row color (zebra striping)
        const rowBg = idx % 2 === 1 ? { fill: { fgColor: { rgb: "F9FAFB" } } } : {};
        
        wsData.push([
          // STT - Căn giữa
          { v: idx + 1, t: 'n', s: { ...cellCenterStyle, ...rowBg } },
          // Mã HĐ - Căn giữa, in đậm, màu xanh
          { v: inv.invoice_code || '', s: { ...cellCenterStyle, ...rowBg, font: { sz: 10, bold: true, name: "Arial", color: { rgb: "1E40AF" } } } },
          // Học viên - Căn trái
          { v: inv.student?.full_name || '', s: { ...cellTextStyle, ...rowBg } },
          // Email - Căn trái, màu xám
          { v: inv.student?.email || '', s: { ...cellTextStyle, ...rowBg, font: { sz: 9, name: "Arial", color: { rgb: "6B7280" } } } },
          // SĐT - Căn giữa
          { v: inv.student?.phone || '', s: { ...cellCenterStyle, ...rowBg } },
          // Lớp - Căn trái, in đậm
          { v: inv.class?.code || '', s: { ...cellTextStyle, ...rowBg, font: { sz: 10, bold: true, name: "Arial" } } },
          // Khóa học - Căn trái
          { v: inv.class?.course?.title || '', s: { ...cellTextStyle, ...rowBg, font: { sz: 9, name: "Arial" } } },
          // Học phí - Số, căn phải, format
          { v: inv.final_amount || 0, t: 'n', s: { ...currencyStyle, ...rowBg } },
          // Đã TT - Số, màu xanh
          { v: inv.paid_amount || 0, t: 'n', s: { ...currencyPaidStyle, ...rowBg } },
          // Còn nợ - Số, màu đỏ nếu > 0
          { v: debt, t: 'n', s: debt > 0 ? currencyDebtStyle : { ...currencyZeroStyle, ...rowBg } },
          // PTTT - Căn giữa
          { v: paymentMethod, s: { ...paymentMethodStyle, ...rowBg } },
          // Trạng thái - Badge với nền màu
          { v: statusText, s: getStatusStyle(inv.status) },
          // Ngày tạo - String format dd/mm/yyyy (tránh Excel auto-format sai)
          { v: formatDateVN(inv.created_at) || '—', s: { ...cellCenterStyle, ...rowBg } },
          // Hạn TT - String format dd/mm/yyyy
          { v: formatDateVN(inv.due_date) || '—', s: { ...cellCenterStyle, ...rowBg } },
        ]);
      });
      
      // Empty row before footer
      wsData.push([]);
      
      // Footer: Tổng cộng
      const footerRow = [];
      for (let i = 0; i < 14; i++) footerRow.push({ v: '', s: footerLabelStyle });
      footerRow[6] = { v: 'TỔNG CỘNG:', s: footerLabelStyle };
      footerRow[7] = { v: totalAmount, t: 'n', s: footerValueStyle };
      footerRow[8] = { v: totalPaid, t: 'n', s: { ...footerValueStyle, font: { bold: true, sz: 11, name: "Arial", color: { rgb: "047857" } } } };
      footerRow[9] = { v: totalDebt, t: 'n', s: { ...footerValueStyle, font: { bold: true, sz: 11, name: "Arial", color: { rgb: "DC2626" } } } };
      wsData.push(footerRow);
      
      // Signature section (cách 3 dòng)
      wsData.push([]);
      wsData.push([]);
      wsData.push([]);
      
      // Signature row - đặt ở vị trí có đủ width
      const signatureRow1 = [];
      for (let i = 0; i < 14; i++) signatureRow1.push({ v: '', s: {} });
      signatureRow1[1] = { v: 'Người lập biểu', s: signatureLabelStyle }; // Cột B (Mã hóa đơn - rộng)
      signatureRow1[10] = { v: 'Giám đốc trung tâm', s: signatureLabelStyle }; // Cột K
      wsData.push(signatureRow1);
      
      const signatureRow2 = [];
      for (let i = 0; i < 14; i++) signatureRow2.push({ v: '', s: {} });
      signatureRow2[1] = { v: '(Ký, ghi rõ họ tên)', s: signatureLineStyle };
      signatureRow2[10] = { v: '(Ký, đóng dấu)', s: signatureLineStyle };
      wsData.push(signatureRow2);

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      // Merge cells
      const signatureRowIdx = wsData.length - 2; // Row của "Người lập biểu"
      const signatureRow2Idx = wsData.length - 1; // Row của "(Ký, ghi rõ họ tên)"
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 13 } }, // Title
        { s: { r: 1, c: 0 }, e: { r: 1, c: 13 } }, // Center name
        { s: { r: 2, c: 0 }, e: { r: 2, c: 13 } }, // Period
        { s: { r: 3, c: 0 }, e: { r: 3, c: 13 } }, // Export date
        // Merge signature cells (span 3 cột)
        { s: { r: signatureRowIdx, c: 1 }, e: { r: signatureRowIdx, c: 3 } }, // Người lập biểu (B-D)
        { s: { r: signatureRowIdx, c: 10 }, e: { r: signatureRowIdx, c: 12 } }, // Giám đốc trung tâm (K-M)
        { s: { r: signatureRow2Idx, c: 1 }, e: { r: signatureRow2Idx, c: 3 } }, // (Ký, ghi rõ họ tên)
        { s: { r: signatureRow2Idx, c: 10 }, e: { r: signatureRow2Idx, c: 12 } }, // (Ký, đóng dấu)
      ];

      // Column widths - tăng width cho cột để hiện đủ chữ
      ws['!cols'] = [
        { wch: 5 },   // STT
        { wch: 20 },  // Mã hóa đơn
        { wch: 20 },  // Học viên (tăng để đủ chỗ signature)
        { wch: 24 },  // Email
        { wch: 12 },  // SĐT
        { wch: 16 },  // Lớp
        { wch: 26 },  // Khóa học
        { wch: 15 },  // Học phí
        { wch: 15 },  // Đã TT
        { wch: 15 },  // Còn nợ
        { wch: 20 },  // PTTT (tăng để đủ chỗ signature "Giám đốc trung tâm")
        { wch: 12 },  // Trạng thái
        { wch: 12 },  // Ngày tạo
        { wch: 12 },  // Hạn TT
      ];

      // Row heights
      ws['!rows'] = [
        { hpt: 30 },  // Title
        { hpt: 22 },  // Center
        { hpt: 18 },  // Period
        { hpt: 16 },  // Date
        { hpt: 8 },   // Empty
        { hpt: 28 },  // Summary
        { hpt: 8 },   // Empty
        { hpt: 26 },  // Headers
      ];

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Báo cáo Công nợ');

      // Filename
      const dateStr = today.toISOString().split('T')[0];
      const filename = `BaoCaoCongNo_SkillMaster_${dateStr}.xlsx`;

      XLSX.writeFile(wb, filename);
      showToast(`Đã xuất ${invoices.length} hóa đơn ra file Excel`, 'success');
    } catch (error) {
      console.error('Error exporting:', error);
      showToast('Lỗi khi xuất Excel. Vui lòng thử lại.', 'error');
    }
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ============ HEADER ============ */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">Quản lý Hóa đơn</h1>
              <p className="text-sm text-zinc-500 mt-1">Theo dõi công nợ và thanh toán học phí</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { fetchInvoices(); fetchStatistics(); }}
                disabled={loading}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Làm mới
              </Button>
              <Button
                size="sm"
                onClick={handleExport}
                disabled={invoices.length === 0}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Download className="w-4 h-4" />
                Xuất Excel
              </Button>
            </div>
          </div>
        </div>

        {/* ============ KPI CARDS ============ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Tổng thu tháng này"
            value={loadingStats ? '...' : `${(statistics?.monthlyRevenue || 0).toLocaleString()}đ`}
            icon={TrendingUp}
            description={`Tổng đã thu: ${(statistics?.totalRevenue || 0).toLocaleString()}đ`}
            accentColor="emerald"
          />
          <StatCard
            title="Tổng còn nợ"
            value={loadingStats ? '...' : `${(statistics?.totalDebt || 0).toLocaleString()}đ`}
            icon={AlertCircle}
            description={`${statistics?.counts?.unpaid || 0} hóa đơn chưa thanh toán`}
            accentColor="red"
            onClick={() => handleStatusFilter('unpaid')}
          />
          <StatCard
            title="Đang đợi thanh toán"
            value={loadingStats ? '...' : (statistics?.counts?.partial || 0)}
            icon={Clock}
            description="Hóa đơn thanh toán một phần"
            accentColor="amber"
            onClick={() => handleStatusFilter('partial')}
          />
          <StatCard
            title="Đã hoàn thành"
            value={loadingStats ? '...' : (statistics?.counts?.paid || 0)}
            icon={CheckCircle2}
            description="Hóa đơn đã thanh toán đủ"
            accentColor="blue"
            onClick={() => handleStatusFilter('paid')}
          />
        </div>

        {/* ============ TOOLBAR ============ */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200/60 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 min-w-[250px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Tìm mã hóa đơn, tên học viên, SĐT..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>
            </form>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="h-10 px-3 rounded-lg border border-zinc-200 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="unpaid">Chưa thanh toán</option>
              <option value="partial">Thanh toán một phần</option>
              <option value="paid">Đã thanh toán</option>
              <option value="cancelled">Đã hủy</option>
            </select>

            {/* Date Range */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-zinc-400" />
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="h-10 px-3 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
              <span className="text-zinc-400">—</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="h-10 px-3 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>

            {/* Clear Filters */}
            {(statusFilter !== 'all' || dateRange.start || dateRange.end || searchTerm) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter('all');
                  setDateRange({ start: '', end: '' });
                  setSearchTerm('');
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="text-zinc-500 hover:text-zinc-700"
              >
                <X className="w-4 h-4 mr-1" />
                Xóa lọc
              </Button>
            )}
          </div>
        </div>

        {/* ============ DATA TABLE ============ */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200/60 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
              <Receipt className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-medium">Không có hóa đơn nào</p>
              <p className="text-sm text-zinc-400 mt-1">Thử thay đổi bộ lọc để xem thêm</p>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                        Mã hóa đơn
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                        Học viên
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                        Lớp học
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                        Tổng tiền
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                        Đã thanh toán
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                        Còn nợ
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {invoices.map((invoice) => {
                      const remaining = (invoice.final_amount || 0) - (invoice.paid_amount || 0);
                      return (
                        <tr key={invoice.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-zinc-400" />
                              <span className="font-mono text-sm font-medium text-zinc-900">
                                {invoice.invoice_code}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-400 mt-0.5 ml-6">
                              {formatDate(invoice.created_at)}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white text-xs font-semibold">
                                {invoice.student?.full_name?.charAt(0) || '?'}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-zinc-900">
                                  {invoice.student?.full_name || 'N/A'}
                                </p>
                                <p className="text-xs text-zinc-500">
                                  {invoice.student?.phone || invoice.student?.email || ''}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-zinc-900">
                              {invoice.class?.name || 'N/A'}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {invoice.class?.course?.title || ''}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-semibold text-zinc-900">
                              {(invoice.final_amount || 0).toLocaleString()}đ
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-medium text-emerald-600">
                              {(invoice.paid_amount || 0).toLocaleString()}đ
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`text-sm font-semibold ${remaining > 0 ? 'text-red-600' : 'text-zinc-400'}`}>
                              {remaining > 0 ? `${remaining.toLocaleString()}đ` : '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <StatusBadge status={invoice.status} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => openDetailModal(invoice)}
                                className="p-2 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
                                title="Xem chi tiết"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                                <button
                                  onClick={() => openPaymentModal(invoice)}
                                  className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                                  title="Thu tiền"
                                >
                                  <CreditCard className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-4 py-3 border-t border-zinc-200 flex items-center justify-between">
                <p className="text-sm text-zinc-600">
                  Hiển thị <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> - <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> / <span className="font-medium">{pagination.total}</span> hóa đơn
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  {/* Page numbers */}
                  {pagination.totalPages > 1 && (
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.page >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                              pageNum === pagination.page
                                ? 'bg-red-500 text-white'
                                : 'text-zinc-600 hover:bg-zinc-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  
                  {pagination.totalPages <= 1 && (
                    <span className="text-sm text-zinc-500 px-2">Trang 1</span>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ============ PAYMENT MODAL ============ */}
        {showPaymentModal && selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => !processing && closePaymentModal()} />
            
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 text-white flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white/20 rounded-lg">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">Thu học phí - {selectedInvoice.student?.full_name}</h3>
                      <p className="text-xs text-emerald-100">{selectedInvoice.invoice_code}</p>
                    </div>
                  </div>
                  <button 
                    onClick={closePaymentModal}
                    disabled={processing}
                    className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {/* Payment Summary */}
                <div className="px-4 py-2 flex gap-2 border-b border-slate-100">
                  <div className="flex-1 p-2 bg-slate-50 rounded-lg text-center">
                    <p className="text-xs text-slate-500">Tổng</p>
                    <p className="text-sm font-bold text-slate-900">
                      {(selectedInvoice.final_amount || 0).toLocaleString()}đ
                    </p>
                  </div>
                  <div className="flex-1 p-2 bg-emerald-50 rounded-lg text-center">
                    <p className="text-xs text-emerald-600">Đã đóng</p>
                    <p className="text-sm font-bold text-emerald-700">
                      {(selectedInvoice.paid_amount || 0).toLocaleString()}đ
                    </p>
                  </div>
                  <div className="flex-1 p-2 bg-red-50 rounded-lg text-center">
                    <p className="text-xs text-red-600">Còn nợ</p>
                    <p className="text-sm font-bold text-red-600">
                      {((selectedInvoice.final_amount || 0) - (selectedInvoice.paid_amount || 0)).toLocaleString()}đ
                    </p>
                  </div>
                </div>

                {/* Form */}
                <div className="px-4 py-3 space-y-3">
                  {/* Amount Input */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Số tiền thực đóng <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={formatCurrency(paymentData.amount)}
                        onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                        placeholder="Nhập số tiền..."
                        className="w-full h-10 pl-8 pr-10 rounded-lg border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        autoFocus
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-500">VNĐ</span>
                    </div>
                    {/* Quick amount buttons */}
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {(() => {
                        const remaining = (selectedInvoice.final_amount || 0) - (selectedInvoice.paid_amount || 0);
                        return remaining > 0 && (
                          <button
                            onClick={() => setPaymentData({ ...paymentData, amount: remaining.toString() })}
                            className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition-colors"
                          >
                            Đóng đủ
                          </button>
                        );
                      })()}
                      {[1000000, 2000000, 5000000].filter(v => v <= ((selectedInvoice.final_amount || 0) - (selectedInvoice.paid_amount || 0))).map(amount => (
                        <button
                          key={amount}
                          onClick={() => setPaymentData({ ...paymentData, amount: amount.toString() })}
                          className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors"
                        >
                          {(amount / 1000000).toFixed(0)}tr
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      Phương thức thanh toán
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => { setPaymentData({ ...paymentData, method: 'cash' }); setCopied(false); }}
                        className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border-2 transition-all text-sm ${
                          paymentData.method === 'cash'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 hover:border-slate-300 text-slate-600'
                        }`}
                      >
                        <Banknote className="w-4 h-4" />
                        <span className="font-medium">Tiền mặt</span>
                      </button>
                      <button
                        onClick={() => { setPaymentData({ ...paymentData, method: 'bank_transfer' }); setCopied(false); }}
                        className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border-2 transition-all text-sm ${
                          paymentData.method === 'bank_transfer'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 hover:border-slate-300 text-slate-600'
                        }`}
                      >
                        <QrCode className="w-4 h-4" />
                        <span className="font-medium">Chuyển khoản</span>
                      </button>
                    </div>

                    {/* VietQR Section */}
                    {paymentData.method === 'bank_transfer' && paymentData.amount && (
                      <div className="mt-3 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 bg-white p-2 rounded-lg shadow-sm border border-blue-100">
                            <img 
                              src={`https://img.vietqr.io/image/${BANK_CONFIG.bankId}-${BANK_CONFIG.accountNo}-${BANK_CONFIG.template}.png?amount=${parseInt(paymentData.amount.replace(/[^0-9]/g, '')) || 0}&addInfo=${encodeURIComponent(`HP ${selectedInvoice.student?.full_name?.split(' ').pop() || ''} ${selectedInvoice.invoice_code || ''}`)}&accountName=${encodeURIComponent(BANK_CONFIG.accountName)}`}
                              alt="VietQR Code"
                              className="w-28 h-28 object-contain"
                            />
                          </div>
                          <div className="flex-1 flex flex-col justify-between text-xs">
                            <div>
                              <div className="flex items-center gap-1 mb-1">
                                <Smartphone className="w-3 h-3 text-blue-600" />
                                <span className="font-medium text-blue-700">VietQR</span>
                              </div>
                              <p className="text-slate-500">NH: <span className="font-semibold text-slate-700">{BANK_CONFIG.bankId}</span></p>
                              <p className="text-slate-500">STK: <span className="font-semibold text-slate-700">{BANK_CONFIG.accountNo}</span></p>
                              <p className="text-slate-500 truncate">CTK: <span className="font-semibold text-slate-700">{BANK_CONFIG.accountName}</span></p>
                            </div>
                            <div className="mt-2">
                              <p className="text-slate-500 mb-0.5">Nội dung CK:</p>
                              <div className="flex items-center gap-1 bg-white rounded border border-blue-200 p-1">
                                <code className="flex-1 text-xs font-mono text-blue-700 truncate">
                                  HP {selectedInvoice.student?.full_name?.split(' ').pop() || ''} {selectedInvoice.invoice_code}
                                </code>
                                <button
                                  onClick={() => {
                                    const content = `HP ${selectedInvoice.student?.full_name?.split(' ').pop() || ''} ${selectedInvoice.invoice_code}`;
                                    navigator.clipboard.writeText(content);
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 2000);
                                  }}
                                  className={`p-1 rounded transition-colors ${
                                    copied ? 'bg-emerald-100 text-emerald-600' : 'hover:bg-blue-100 text-blue-600'
                                  }`}
                                >
                                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            </div>
                            <div className="mt-2 px-2 py-1 bg-emerald-100 rounded text-center">
                              <p className="text-xs font-bold text-emerald-700">
                                {parseInt(paymentData.amount.replace(/[^0-9]/g, '') || 0).toLocaleString('vi-VN')}đ
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Ghi chú (tùy chọn)
                    </label>
                    <textarea
                      value={paymentData.notes}
                      onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                      placeholder="VD: Đóng trước 50%, hẹn đóng nốt tuần sau..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={closePaymentModal}
                  disabled={processing}
                >
                  Hủy
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handlePaymentSubmit}
                  disabled={processing || !paymentData.amount}
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                      Xác nhận thu
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ============ DETAIL MODAL ============ */}
        {showDetailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={closeDetailModal} />
            
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-zinc-700 to-zinc-800 px-4 py-3 text-white flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white/20 rounded-lg">
                      <FileText className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-semibold">Chi tiết hóa đơn</h3>
                  </div>
                  <button onClick={closeDetailModal} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {loadingDetail ? (
                  <div className="flex items-center justify-center h-48">
                    <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
                  </div>
                ) : invoiceDetail ? (
                  <div className="space-y-4">
                    {/* Invoice Info */}
                    <div className="p-4 bg-zinc-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-lg font-bold text-zinc-900">
                          {invoiceDetail.invoice_code}
                        </span>
                        <StatusBadge status={invoiceDetail.status} />
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-zinc-500">Ngày tạo</p>
                          <p className="font-medium">{formatDate(invoiceDetail.created_at)}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500">Hạn thanh toán</p>
                          <p className="font-medium">{formatDate(invoiceDetail.due_date) || '—'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Student & Class */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-medium text-blue-600">Học viên</span>
                        </div>
                        <p className="font-semibold text-zinc-900">{invoiceDetail.student?.full_name}</p>
                        <p className="text-xs text-zinc-500">{invoiceDetail.student?.email}</p>
                        <p className="text-xs text-zinc-500">{invoiceDetail.student?.phone}</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="w-4 h-4 text-purple-600" />
                          <span className="text-xs font-medium text-purple-600">Lớp học</span>
                        </div>
                        <p className="font-semibold text-zinc-900">{invoiceDetail.class?.name}</p>
                        <p className="text-xs text-zinc-500">{invoiceDetail.class?.course?.title}</p>
                      </div>
                    </div>

                    {/* Payment Summary */}
                    <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-100">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-xs text-zinc-500">Tổng tiền</p>
                          <p className="text-lg font-bold text-zinc-900">
                            {(invoiceDetail.final_amount || 0).toLocaleString()}đ
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-emerald-600">Đã thanh toán</p>
                          <p className="text-lg font-bold text-emerald-600">
                            {(invoiceDetail.paid_amount || 0).toLocaleString()}đ
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-red-600">Còn nợ</p>
                          <p className="text-lg font-bold text-red-600">
                            {((invoiceDetail.final_amount || 0) - (invoiceDetail.paid_amount || 0)).toLocaleString()}đ
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Payment History */}
                    {invoiceDetail.payments && invoiceDetail.payments.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-zinc-700 mb-2">Lịch sử thanh toán</h4>
                        <div className="space-y-2">
                          {invoiceDetail.payments.map((payment) => (
                            <div key={payment.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
                              <div>
                                <p className="text-sm font-medium text-zinc-900">
                                  +{(payment.amount || 0).toLocaleString()}đ
                                </p>
                                <p className="text-xs text-zinc-500">
                                  {formatDate(payment.payment_date)} • {payment.payment_method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}
                                </p>
                              </div>
                              <p className="text-xs text-zinc-500">
                                Thu bởi: {payment.receiver?.full_name || 'N/A'}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 text-zinc-500">
                    Không thể tải thông tin hóa đơn
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 px-4 py-3 bg-zinc-50 border-t border-zinc-200">
                <Button variant="outline" className="w-full" onClick={closeDetailModal}>
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ============ TOAST ============ */}
        {toast.show && (
          <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border ${
              toast.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <p className="text-sm font-medium">{toast.message}</p>
              <button 
                onClick={() => setToast({ show: false, message: '', type: 'success' })}
                className="ml-2 p-0.5 hover:bg-white/50 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default InvoicesPage;
