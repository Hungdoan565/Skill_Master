/**
 * PayrollPage Component
 * Trang quản lý bảng lương giáo viên
 */

import { useEffect, useState, useCallback } from 'react';
import { DollarSign, Users, FileText, Download, Printer, History } from 'lucide-react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { gooeyToast } from 'goey-toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { usePayroll } from '../hooks';
import {
    PayrollFilters,
    PayrollStats,
    TeachersPayrollTable,
    PayrollTable,
    PayrollDetailModal,
    GeneratePayrollModal,
    EditPayrollModal,
    DeletePayrollModal,
    BulkGeneratePayrollModal,
    PrintPayslipModal,
    AuditTrailModal,
    PaymentProofModal,
} from '../components';
import { getCurrentMonth } from '../utils';

export function PayrollPage() {


    // Filters
    const currentPeriod = getCurrentMonth();
    const [month, setMonth] = useState(currentPeriod.month);
    const [year, setYear] = useState(currentPeriod.year);
    const [statusFilter, setStatusFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // View mode: 'teachers' | 'payrolls'
    const [viewMode, setViewMode] = useState('teachers');

    // Modal states
    const [generateModal, setGenerateModal] = useState({ isOpen: false, teacher: null, submitting: false });
    const [detailModal, setDetailModal] = useState({ isOpen: false, payroll: null, data: null, loading: false });
    const [editModal, setEditModal] = useState({ isOpen: false, payroll: null, submitting: false });
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, payroll: null, submitting: false });
    const [bulkGenerateModal, setBulkGenerateModal] = useState({ isOpen: false, submitting: false });
    const [printModal, setPrintModal] = useState({ isOpen: false, payrollData: null });
    const [auditModal, setAuditModal] = useState({ isOpen: false, payrollId: null });
    const [statusConfirm, setStatusConfirm] = useState({ isOpen: false, payrollId: null, status: null, message: '' });
    const [paymentProofModal, setPaymentProofModal] = useState({ isOpen: false, payroll: null, submitting: false });

    const {
        payrolls,
        teachers,
        stats,
        loading,
        fetchPayrolls,
        fetchStats,
        fetchTeachers,
        generatePayroll,
        bulkGeneratePayroll,
        fetchPayrollDetail,
        updatePayroll,
        updatePayrollStatus,
        deletePayroll,
        exportPayroll,
        fetchAuditTrail,
        submitPaymentProof,
    } = usePayroll();

    // Load data when filters change
    useEffect(() => {
        fetchStats(month, year);
        fetchTeachers(month, year);
        fetchPayrolls({ month, year, status: statusFilter });
    }, [month, year, statusFilter, fetchStats, fetchTeachers, fetchPayrolls]);

    // Filter teachers locally by search
    const filteredTeachers = teachers.filter(t =>
        !searchTerm ||
        t.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filter payrolls locally by search
    const filteredPayrolls = payrolls.filter(p =>
        !searchTerm ||
        p.teacher?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.teacher?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Handle generate payroll
    const handleGenerateClick = (teacher) => {
        setGenerateModal({ isOpen: true, teacher, submitting: false });
    };

    const handleGenerateSubmit = async (data) => {
        setGenerateModal(prev => ({ ...prev, submitting: true }));
        try {
            await generatePayroll(data);
            setGenerateModal({ isOpen: false, teacher: null, submitting: false });
            // Refresh data
            fetchTeachers(month, year);
            fetchPayrolls({ month, year, status: statusFilter });
            fetchStats(month, year);
            gooeyToast.success('Tạo bảng lương thành công!');
        } catch (error) {
            console.error('Error generating payroll:', error);
            gooeyToast.error(error.message || 'Có lỗi xảy ra khi tạo bảng lương');
            setGenerateModal(prev => ({ ...prev, submitting: false }));
        }
    };

    // Handle view payroll detail
    const handleViewPayroll = async (payroll) => {
        setDetailModal({ isOpen: true, payroll, data: null, loading: true });
        try {
            const data = await fetchPayrollDetail(payroll.id);
            setDetailModal(prev => ({ ...prev, data, loading: false }));
        } catch (error) {
            console.error('Error fetching payroll detail:', error);
            setDetailModal(prev => ({ ...prev, loading: false }));
        }
    };

    // Handle edit payroll
    const handleEditClick = (payroll) => {
        setEditModal({ isOpen: true, payroll, submitting: false });
    };

    const handleEditSubmit = async (payrollId, data) => {
        setEditModal(prev => ({ ...prev, submitting: true }));
        try {
            await updatePayroll(payrollId, data);
            setEditModal({ isOpen: false, payroll: null, submitting: false });
            fetchStats(month, year);
            gooeyToast.success('Cập nhật bảng lương thành công!');
        } catch (error) {
            console.error('Error updating payroll:', error);
            gooeyToast.error(error.message || 'Có lỗi xảy ra khi cập nhật');
            setEditModal(prev => ({ ...prev, submitting: false }));
        }
    };

    // Handle delete payroll
    const handleDeleteClick = (payroll) => {
        setDeleteModal({ isOpen: true, payroll, submitting: false });
    };

    const handleDeleteConfirm = async (payrollId) => {
        setDeleteModal(prev => ({ ...prev, submitting: true }));
        try {
            await deletePayroll(payrollId);
            setDeleteModal({ isOpen: false, payroll: null, submitting: false });
            // Refresh data
            fetchTeachers(month, year);
            fetchStats(month, year);
            gooeyToast.success('Đã xóa bảng lương!');
        } catch (error) {
            console.error('Error deleting payroll:', error);
            gooeyToast.error(error.message || 'Có lỗi xảy ra khi xóa');
            setDeleteModal(prev => ({ ...prev, submitting: false }));
        }
    };

    // Handle update status with confirmation
    const handleUpdateStatus = (payrollId, status, payroll = null) => {
        // For "paid" status, open payment proof modal instead
        if (status === 'paid' && payroll) {
            setPaymentProofModal({ isOpen: true, payroll, submitting: false });
            return;
        }

        const messages = {
            pending: 'Bạn có chắc muốn gửi duyệt bảng lương này?',
            approved: 'Xác nhận duyệt bảng lương? Sessions sẽ bị khóa không thể chỉnh sửa.',
            paid: 'Xác nhận đã thanh toán cho giáo viên?',
            draft: 'Trả bảng lương về trạng thái nháp?'
        };
        setStatusConfirm({
            isOpen: true,
            payrollId,
            status,
            message: messages[status] || 'Xác nhận thay đổi trạng thái?'
        });
    };

    // Handle payment proof submit
    const handlePaymentProofSubmit = async (payrollId, data) => {
        setPaymentProofModal(prev => ({ ...prev, submitting: true }));
        try {
            await submitPaymentProof(payrollId, data);
            setPaymentProofModal({ isOpen: false, payroll: null, submitting: false });
            fetchStats(month, year);
            fetchTeachers(month, year);
            fetchPayrolls({ month, year, status: statusFilter });
            gooeyToast.success('Đã thanh toán thành công!');
        } catch (error) {
            console.error('Error submitting payment proof:', error);
            gooeyToast.error(error.message || 'Có lỗi xảy ra khi thanh toán');
            setPaymentProofModal(prev => ({ ...prev, submitting: false }));
        }
    };

    const handleStatusConfirm = async () => {
        const { payrollId, status } = statusConfirm;
        setStatusConfirm(prev => ({ ...prev, isOpen: false }));

        try {
            await updatePayrollStatus(payrollId, status);
            fetchStats(month, year);
            fetchTeachers(month, year);

            const statusLabels = {
                paid: 'Đã thanh toán',
                approved: 'Đã duyệt',
                pending: 'Chờ duyệt',
                draft: 'Nháp'
            };
            gooeyToast.success(`Đã cập nhật trạng thái thành "${statusLabels[status]}"`);
        } catch (error) {
            console.error('Error updating status:', error);
            gooeyToast.error(error.message || 'Có lỗi xảy ra khi cập nhật trạng thái');
        }
    };

    // Handle bulk generate payroll
    const handleBulkGenerateClick = () => {
        setBulkGenerateModal({ isOpen: true, submitting: false });
    };

    const handleBulkGenerateSubmit = async (data) => {
        setBulkGenerateModal(prev => ({ ...prev, submitting: true }));
        try {
            const result = await bulkGeneratePayroll(data);
            // Refresh data
            fetchTeachers(month, year);
            fetchPayrolls({ month, year, status: statusFilter });
            fetchStats(month, year);
            gooeyToast.success(result.message || 'Tạo bảng lương hàng loạt thành công!');
            return result;
        } catch (error) {
            console.error('Error bulk generating:', error);
            gooeyToast.error(error.message || 'Có lỗi xảy ra');
            throw error;
        } finally {
            setBulkGenerateModal(prev => ({ ...prev, submitting: false }));
        }
    };

    // Handle export to Excel
    const handleExport = async () => {
        try {
            gooeyToast.info('Đang xuất file Excel...');
            await exportPayroll(month, year);
            gooeyToast.success('Đã tải xuống file Excel!');
        } catch (error) {
            console.error('Error exporting:', error);
            gooeyToast.error('Có lỗi xảy ra khi xuất file');
        }
    };

    // Handle print payslip
    const handlePrintPayslip = async (payroll) => {
        try {
            const data = await fetchPayrollDetail(payroll.id);
            setPrintModal({ isOpen: true, payrollData: data });
        } catch (error) {
            console.error('Error fetching for print:', error);
            gooeyToast.error('Không thể tải dữ liệu để in');
        }
    };

    // Handle view audit trail
    const handleViewAudit = (payrollId) => {
        setAuditModal({ isOpen: true, payrollId });
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Quản lý Bảng lương</h1>
                    <p className="text-muted-foreground">
                        Tính lương và quản lý thanh toán cho giáo viên
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {/* Bulk Generate Button */}
                    <Button
                        variant="outline"
                        onClick={handleBulkGenerateClick}
                        className="gap-2"
                    >
                        <Users className="h-4 w-4" />
                        Tạo hàng loạt
                    </Button>

                    {/* Export Button */}
                    <Button
                        variant="outline"
                        onClick={handleExport}
                        className="gap-2"
                    >
                        <Download className="h-4 w-4" />
                        Xuất Excel
                    </Button>

                    {/* Current Period Badge */}
                    <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2 border border-green-200">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium text-green-700">
                            Tháng {month}/{year}
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <PayrollStats stats={stats} loading={loading} />

            {/* Filters & View Toggle */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <PayrollFilters
                            month={month}
                            year={year}
                            status={statusFilter}
                            onMonthChange={setMonth}
                            onYearChange={setYear}
                            onStatusChange={setStatusFilter}
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                        />

                        {/* View Toggle */}
                        <div className="flex items-center gap-2 border rounded-lg p-1">
                            <Button
                                size="sm"
                                variant={viewMode === 'teachers' ? 'default' : 'ghost'}
                                onClick={() => setViewMode('teachers')}
                            >
                                <Users className="mr-1 h-4 w-4" />
                                Giáo viên
                            </Button>
                            <Button
                                size="sm"
                                variant={viewMode === 'payrolls' ? 'default' : 'ghost'}
                                onClick={() => setViewMode('payrolls')}
                            >
                                <FileText className="mr-1 h-4 w-4" />
                                Bảng lương ({payrolls.length})
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    {viewMode === 'teachers' ? (
                        <TeachersPayrollTable
                            teachers={filteredTeachers}
                            onGeneratePayroll={handleGenerateClick}
                            onViewPayroll={handleViewPayroll}
                            loading={loading}
                        />
                    ) : (
                        <PayrollTable
                            payrolls={filteredPayrolls}
                            onView={handleViewPayroll}
                            onEdit={handleEditClick}
                            onDelete={handleDeleteClick}
                            onUpdateStatus={handleUpdateStatus}
                            onPrint={handlePrintPayslip}
                            onViewAudit={handleViewAudit}
                            loading={loading}
                        />
                    )}
                </CardContent>
            </Card>

            {/* Modals */}
            <GeneratePayrollModal
                isOpen={generateModal.isOpen}
                onClose={() => setGenerateModal({ isOpen: false, teacher: null, submitting: false })}
                teacher={generateModal.teacher}
                onSubmit={handleGenerateSubmit}
                submitting={generateModal.submitting}
            />

            <PayrollDetailModal
                isOpen={detailModal.isOpen}
                onClose={() => setDetailModal({ isOpen: false, payroll: null, data: null, loading: false })}
                payroll={detailModal.payroll}
                detailData={detailModal.data}
                loading={detailModal.loading}
                onPrint={() => detailModal.data && setPrintModal({ isOpen: true, payrollData: detailModal.data })}
            />

            <EditPayrollModal
                isOpen={editModal.isOpen}
                onClose={() => setEditModal({ isOpen: false, payroll: null, submitting: false })}
                payroll={editModal.payroll}
                onSubmit={handleEditSubmit}
                submitting={editModal.submitting}
            />

            <DeletePayrollModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, payroll: null, submitting: false })}
                payroll={deleteModal.payroll}
                onConfirm={handleDeleteConfirm}
                submitting={deleteModal.submitting}
            />

            <BulkGeneratePayrollModal
                isOpen={bulkGenerateModal.isOpen}
                onClose={() => setBulkGenerateModal({ isOpen: false, submitting: false })}
                teachers={teachers}
                month={month}
                year={year}
                onSubmit={handleBulkGenerateSubmit}
                submitting={bulkGenerateModal.submitting}
            />

            <PrintPayslipModal
                isOpen={printModal.isOpen}
                onClose={() => setPrintModal({ isOpen: false, payrollData: null })}
                payrollData={printModal.payrollData}
            />

            <AuditTrailModal
                isOpen={auditModal.isOpen}
                onClose={() => setAuditModal({ isOpen: false, payrollId: null })}
                payrollId={auditModal.payrollId}
                fetchAuditTrail={fetchAuditTrail}
            />

            <PaymentProofModal
                isOpen={paymentProofModal.isOpen}
                onClose={() => setPaymentProofModal({ isOpen: false, payroll: null, submitting: false })}
                payroll={paymentProofModal.payroll}
                onSubmit={handlePaymentProofSubmit}
                submitting={paymentProofModal.submitting}
            />

            {/* Status Change Confirmation Dialog */}
            <ConfirmDialog
                isOpen={statusConfirm.isOpen}
                onClose={() => setStatusConfirm({ isOpen: false, payrollId: null, status: null, message: '' })}
                onConfirm={handleStatusConfirm}
                title="Xác nhận thay đổi"
                message={statusConfirm.message}
                variant={statusConfirm.status === 'approved' || statusConfirm.status === 'paid' ? 'info' : 'warning'}
                confirmText="Xác nhận"
                cancelText="Hủy"
            />
        </div>
    );
}

export default PayrollPage;
