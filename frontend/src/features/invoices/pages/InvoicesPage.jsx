/**
 * InvoicesPage - Main Page Component
 * 
 * ============================================
 * REFACTORED VERSION - Invoice Reform
 * ============================================
 * 
 * Đây là "Orchestrator" - chỉ làm nhiệm vụ:
 * 1. Gọi các hooks để lấy data
 * 2. Ghép các component con lại với nhau
 * 3. Truyền props xuống các component
 * 
 * NEW FEATURES:
 * - Tạo hóa đơn thủ công
 * - Sửa hóa đơn
 * - Hủy hóa đơn
 * - Hoàn tiền
 */

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useSearchParams } from 'react-router-dom';
import { Download, RefreshCw, Plus, FileText, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Feature imports
import {
  InvoiceStats,
  InvoiceFilters,
  InvoiceTable,
  PaymentModal,
  InvoiceDetailModal,
  TransactionsTab,
  Toast,
  CreateInvoiceModal,
  EditInvoiceModal,
  CancelInvoiceModal,
  RefundInvoiceModal
} from '../components';

import {
  useInvoices,
  useInvoiceStats,
  usePayment,
  useTransactions
} from '../hooks';

import { API_URL } from '../utils/constants';
import { exportInvoicesToExcel } from '../utils/exportExcel';

export function InvoicesPage() {
  const { session } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // ============================================
  // HOOKS - Data & Logic
  // ============================================
  const {
    invoices,
    loading,
    pagination,
    filters,
    handlePageChange,
    handleFilterChange,
    resetFilters,
    hasActiveFilters,
    refresh: refreshInvoices
  } = useInvoices();

  const {
    statistics,
    loading: loadingStats,
    refresh: refreshStats
  } = useInvoiceStats();

  // Transactions Tab hook
  const transactions = useTransactions();

  // ============================================
  // LOCAL STATE - UI only
  // ============================================
  const [activeTab, setActiveTab] = useState('invoices'); // 'invoices' | 'transactions'
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Invoice Detail Modal
  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    invoice: null,
    loading: false
  });

  // New modals state
  const [createModal, setCreateModal] = useState(false);
  const [createModalData, setCreateModalData] = useState(null);
  const [editModal, setEditModal] = useState({ isOpen: false, invoice: null });
  const [cancelModal, setCancelModal] = useState({ isOpen: false, invoice: null });
  const [refundModal, setRefundModal] = useState({ isOpen: false, invoice: null });

  // ============================================
  // TOAST HELPERS
  // ============================================
  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  }, []);

  const closeToast = useCallback(() => {
    setToast({ show: false, message: '', type: 'success' });
  }, []);

  // ============================================
  // AUTO-OPEN CREATE MODAL FROM URL
  // ============================================
  useEffect(() => {
    const shouldCreate = searchParams.get('create');
    if (shouldCreate === 'true') {
      // Lấy tất cả params từ URL
      const enrollmentId = searchParams.get('enrollment_id');
      const studentId = searchParams.get('student_id');
      const studentName = searchParams.get('student_name');
      const classId = searchParams.get('class_id');
      const className = searchParams.get('class_name');
      const courseName = searchParams.get('course_name');
      const amount = searchParams.get('amount');
      const type = searchParams.get('type');

      // Mở modal với pre-fill data đầy đủ
      setCreateModalData({
        enrollment_id: enrollmentId,
        student_id: studentId,
        student_name: studentName,
        class_id: classId,
        class_name: className,
        course_name: courseName,
        amount: parseFloat(amount) || 0,
        invoice_type: type || 'tuition', // Default học phí
        auto_description: `Thu học phí - ${className || 'N/A'} - ${studentName || 'N/A'}`,
        locked: true // Lock student và class fields
      });
      setCreateModal(true);

      // Clean URL sau khi mở modal
      const cleanParams = new URLSearchParams(searchParams);
      cleanParams.delete('create');
      cleanParams.delete('enrollment_id');
      cleanParams.delete('student_id');
      cleanParams.delete('student_name');
      cleanParams.delete('class_id');
      cleanParams.delete('class_name');
      cleanParams.delete('course_name');
      cleanParams.delete('amount');
      cleanParams.delete('type');
      setSearchParams(cleanParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // ============================================
  // PAYMENT HOOK - With callbacks
  // ============================================
  const payment = usePayment({
    onSuccess: (message) => {
      showToast(message, 'success');
      refreshInvoices();
      refreshStats();
    },
    onError: (message) => {
      showToast(message, 'error');
    }
  });

  // ============================================
  // HANDLERS
  // ============================================
  const handleRefresh = useCallback(() => {
    refreshInvoices();
    refreshStats();
  }, [refreshInvoices, refreshStats]);

  // Toggle status filter: click lần 1 = filter, click lần 2 = reset
  const handleStatusClick = useCallback((status) => {
    if (filters.status === status) {
      // Đang filter status này rồi → reset về all
      handleFilterChange('status', 'all');
    } else {
      handleFilterChange('status', status);
    }
  }, [filters.status, handleFilterChange]);

  // Toggle overdue filter
  const handleOverdueClick = useCallback(() => {
    if (filters.overdueOnly) {
      // Đang filter overdue rồi → reset
      handleFilterChange('overdueOnly', false);
    } else {
      handleFilterChange('overdueOnly', true);
    }
  }, [filters.overdueOnly, handleFilterChange]);

  // Handler khi click vào "Tổng thu tháng này" 
  // → Toggle filter các hóa đơn đã thanh toán trong tháng hiện tại
  const handleMonthlyRevenueClick = useCallback(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const dateStart = firstDay.toISOString().split('T')[0];
    const dateEnd = lastDay.toISOString().split('T')[0];

    // Check nếu đang filter monthly revenue → reset
    const isCurrentlyFiltered =
      filters.status === 'paid' &&
      filters.dateStart === dateStart &&
      filters.dateEnd === dateEnd;

    if (isCurrentlyFiltered) {
      // Reset tất cả filters
      resetFilters();
    } else {
      // Set multiple filters: paid status + current month
      handleFilterChange('status', 'paid');
      handleFilterChange('dateStart', dateStart);
      handleFilterChange('dateEnd', dateEnd);
    }
  }, [filters.status, filters.dateStart, filters.dateEnd, handleFilterChange, resetFilters]);

  // Modal success callback with refresh
  const handleModalSuccess = useCallback((message) => {
    showToast(message, 'success');
    refreshInvoices();
    refreshStats();
  }, [showToast, refreshInvoices, refreshStats]);

  // Open action modals
  const handleEdit = useCallback((invoice) => {
    setEditModal({ isOpen: true, invoice });
  }, []);

  const handleCancel = useCallback((invoice) => {
    setCancelModal({ isOpen: true, invoice });
  }, []);

  const handleRefund = useCallback((invoice) => {
    setRefundModal({ isOpen: true, invoice });
  }, []);

  const handleViewDetail = useCallback(async (invoice) => {
    setDetailModal({ isOpen: true, invoice: null, loading: true });

    try {
      const res = await fetch(`${API_URL}/api/invoices/${invoice.id}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      const result = await res.json();

      if (result.success) {
        setDetailModal({ isOpen: true, invoice: result.data, loading: false });
        // Fetch payments for this invoice
        payment.fetchPayments(invoice.id);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error fetching invoice detail:', error);
      showToast('Lỗi khi tải chi tiết hóa đơn', 'error');
      setDetailModal({ isOpen: false, invoice: null, loading: false });
    }
  }, [session?.access_token, showToast, payment]);

  const handleCloseDetail = useCallback(() => {
    setDetailModal({ isOpen: false, invoice: null, loading: false });
  }, []);

  const handleExport = useCallback(async () => {
    try {
      await exportInvoicesToExcel(invoices);
      showToast(`Đã xuất ${invoices.length} hóa đơn ra file Excel`, 'success');
    } catch (error) {
      console.error('Export error:', error);
      showToast('Lỗi khi xuất Excel. Vui lòng thử lại.', 'error');
    }
  }, [invoices, showToast]);

  // ============================================
  // RENDER - Clean JSX
  // ============================================
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <PageHeader
          onRefresh={handleRefresh}
          onExport={handleExport}
          onCreate={() => setCreateModal(true)}
          loading={loading}
          canExport={invoices.length > 0}
        />

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'invoices'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
          >
            <FileText className="w-4 h-4" />
            Hóa đơn
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'transactions'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            Giao dịch
            {transactions.summary?.totalPending > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-xs bg-amber-500 text-white">
                {transactions.summary.totalPending}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'invoices' ? (
          <>
            {/* KPI Stats */}
            <InvoiceStats
              statistics={statistics}
              loading={loadingStats}
              onStatusClick={handleStatusClick}
              onOverdueClick={handleOverdueClick}
              onMonthlyRevenueClick={handleMonthlyRevenueClick}
            />

            {/* Filters */}
            <InvoiceFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={resetFilters}
              hasActiveFilters={hasActiveFilters}
            />

            {/* Data Table */}
            <InvoiceTable
              invoices={invoices}
              loading={loading}
              pagination={pagination}
              onPageChange={handlePageChange}
              onViewDetail={handleViewDetail}
              onPayment={payment.openPayment}
              onEdit={handleEdit}
              onCancel={handleCancel}
              onRefund={handleRefund}
            />
          </>
        ) : (
          /* Transactions Tab */
          <TransactionsTab
            transactions={transactions.transactions}
            loading={transactions.loading}
            summary={transactions.summary}
            pagination={transactions.pagination}
            filters={transactions.filters}
            selectedIds={transactions.selectedIds}
            onFilterChange={transactions.handleFilterChange}
            onResetFilters={transactions.resetFilters}
            onPageChange={transactions.handlePageChange}
            onToggleSelect={transactions.toggleSelect}
            onSelectAll={transactions.selectAll}
            onBulkVerify={transactions.bulkVerify}
            onRefresh={transactions.fetchTransactions}
          />
        )}

        {/* Payment Modal */}
        <PaymentModal
          isOpen={payment.isOpen}
          invoice={payment.selectedInvoice}
          formData={payment.formData}
          processing={payment.processing}
          onClose={payment.closePayment}
          onFormChange={payment.updateFormData}
          onSubmit={payment.submitPayment}
        />

        {/* Detail Modal */}
        <InvoiceDetailModal
          isOpen={detailModal.isOpen}
          invoice={detailModal.invoice}
          loading={detailModal.loading}
          onClose={handleCloseDetail}
          payments={payment.payments}
          loadingPayments={payment.loadingPayments}
          onVerifyPayment={payment.verifyPayment}
          onRejectPayment={payment.rejectPayment}
          onRefreshPayments={() => detailModal.invoice && payment.fetchPayments(detailModal.invoice.id)}
        />

        {/* Create Invoice Modal */}
        <CreateInvoiceModal
          isOpen={createModal}
          onClose={() => {
            setCreateModal(false);
            setCreateModalData(null);
          }}
          onSuccess={handleModalSuccess}
          initialData={createModalData}
        />

        {/* Edit Invoice Modal */}
        <EditInvoiceModal
          isOpen={editModal.isOpen}
          invoice={editModal.invoice}
          onClose={() => setEditModal({ isOpen: false, invoice: null })}
          onSuccess={handleModalSuccess}
        />

        {/* Cancel Invoice Modal */}
        <CancelInvoiceModal
          isOpen={cancelModal.isOpen}
          invoice={cancelModal.invoice}
          onClose={() => setCancelModal({ isOpen: false, invoice: null })}
          onSuccess={handleModalSuccess}
        />

        {/* Refund Invoice Modal */}
        <RefundInvoiceModal
          isOpen={refundModal.isOpen}
          invoice={refundModal.invoice}
          onClose={() => setRefundModal({ isOpen: false, invoice: null })}
          onSuccess={handleModalSuccess}
        />

        {/* Toast Notification */}
        <Toast
          show={toast.show}
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />

      </div>
    </div>
  );
}

// ============================================
// PAGE HEADER - Simple sub-component
// ============================================
function PageHeader({ onRefresh, onExport, onCreate, loading, canExport }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Quản lý Hóa đơn</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Theo dõi công nợ và thanh toán học phí
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          <Button
            size="sm"
            onClick={onExport}
            disabled={!canExport}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Download className="w-4 h-4" />
            Xuất Excel
          </Button>
          <Button
            size="sm"
            onClick={onCreate}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4" />
            Tạo hóa đơn
          </Button>
        </div>
      </div>
    </div>
  );
}

export default InvoicesPage;
