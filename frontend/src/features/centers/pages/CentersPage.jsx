/**
 * CentersPage - Trang quản lý trung tâm (Enhanced Version)
 * 
 * Features:
 * - CRUD operations với Toast notifications
 * - Export Excel
 * - Pagination
 * - Loading states for actions
 * - Full stats display
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Plus, Building2, RefreshCw, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/components/ui/toast';
import { useCenters } from '../hooks';
import {
    CenterCard,
    CenterFormModal,
    CenterStatsCards,
    CenterFilters,
    AssignManagerModal,
    CenterDetailModal,
    DeleteConfirmModal,
    Pagination
} from '../components';
import { exportCentersToExcel } from '../utils';

// Số items mỗi trang
const PAGE_SIZE = 12;

export function CentersPage() {
    const { user, userRole } = useAuth();
    const { toast } = useToast();

    // Hooks
    const {
        centers,
        loading,
        error,
        fetchCenters,
        createCenter,
        updateCenter,
        deleteCenter,
        restoreCenter,
        assignManager,
        filterCenters
    } = useCenters();

    // Local state
    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        sortBy: 'name',
        hasManager: 'all'
    });
    const [currentPage, setCurrentPage] = useState(1);

    // Modal states
    const [showFormModal, setShowFormModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editingCenter, setEditingCenter] = useState(null);
    const [selectedCenterForAction, setSelectedCenterForAction] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [exporting, setExporting] = useState(false);

    // Permission check
    const canManage = userRole === 'SUPER_ADMIN';

    // Initial fetch với stats
    useEffect(() => {
        fetchCenters({ withStats: true });
    }, [fetchCenters]);

    // Filter centers
    const filteredCenters = useMemo(() => {
        let result = [...centers];

        // Filter by search
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            result = result.filter(c =>
                c.name?.toLowerCase().includes(searchLower) ||
                c.code?.toLowerCase().includes(searchLower) ||
                c.address?.toLowerCase().includes(searchLower) ||
                c.email?.toLowerCase().includes(searchLower)
            );
        }

        // Filter by status
        if (filters.status && filters.status !== 'all') {
            result = result.filter(c => c.status === filters.status);
        }

        // Filter by manager
        if (filters.hasManager === 'yes') {
            result = result.filter(c => c.manager_id);
        } else if (filters.hasManager === 'no') {
            result = result.filter(c => !c.manager_id);
        }

        // Sort
        if (filters.sortBy) {
            const isDesc = filters.sortBy.startsWith('-');
            const field = isDesc ? filters.sortBy.slice(1) : filters.sortBy;

            result.sort((a, b) => {
                let aVal = a[field];
                let bVal = b[field];

                if (field === 'name') {
                    aVal = aVal?.toLowerCase() || '';
                    bVal = bVal?.toLowerCase() || '';
                }

                if (aVal < bVal) return isDesc ? 1 : -1;
                if (aVal > bVal) return isDesc ? -1 : 1;
                return 0;
            });
        }

        return result;
    }, [centers, filters]);

    // Pagination
    const totalPages = Math.ceil(filteredCenters.length / PAGE_SIZE);
    const paginatedCenters = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return filteredCenters.slice(start, start + PAGE_SIZE);
    }, [filteredCenters, currentPage]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    // Overall stats
    const overallStats = useMemo(() => {
        const activeCount = centers.filter(c => c.status === 'active').length;
        const totalRooms = centers.reduce((sum, c) => sum + (c.rooms_count || 0), 0);
        const totalTeachers = centers.reduce((sum, c) => sum + (c.teachers_count || 0), 0);
        const totalStudents = centers.reduce((sum, c) => sum + (c.students_count || 0), 0);

        return {
            total: centers.length,
            active: activeCount,
            totalRooms,
            totalTeachers,
            totalStudents
        };
    }, [centers]);

    // Handlers
    const handleFilterChange = useCallback((newFilters) => {
        setFilters(newFilters);
    }, []);

    const handleClearFilters = useCallback(() => {
        setFilters({
            search: '',
            status: 'all',
            sortBy: 'name',
            hasManager: 'all'
        });
    }, []);

    const handleRefresh = useCallback(async () => {
        await fetchCenters({ withStats: true });
        toast.success('Đã làm mới dữ liệu');
    }, [fetchCenters, toast]);

    // Export handler
    const handleExport = useCallback(async () => {
        if (filteredCenters.length === 0) {
            toast.warning('Không có dữ liệu để xuất');
            return;
        }

        setExporting(true);
        try {
            const result = await exportCentersToExcel(filteredCenters);
            toast.success(`Đã xuất file ${result.filename}`, { title: 'Xuất Excel thành công' });
        } catch (err) {
            console.error('Export error:', err);
            toast.error(err.message || 'Không thể xuất file Excel');
        } finally {
            setExporting(false);
        }
    }, [filteredCenters, toast]);

    // Form modal handlers
    const handleOpenCreateModal = useCallback(() => {
        setEditingCenter(null);
        setShowFormModal(true);
    }, []);

    const handleOpenEditModal = useCallback((center) => {
        setEditingCenter(center);
        setShowFormModal(true);
    }, []);

    const handleCloseFormModal = useCallback(() => {
        setShowFormModal(false);
        setEditingCenter(null);
    }, []);

    const handleSubmitForm = useCallback(async (data) => {
        setActionLoading(true);
        try {
            let result;
            if (editingCenter?.id) {
                result = await updateCenter(editingCenter.id, data);
                toast.success(result.message || 'Cập nhật trung tâm thành công');
            } else {
                result = await createCenter(data);
                toast.success(result.message || 'Tạo trung tâm mới thành công');
            }

            handleCloseFormModal();
            await fetchCenters({ withStats: true });
        } catch (err) {
            console.error('Form submit error:', err);
            toast.error(err.message || 'Có lỗi xảy ra');
        } finally {
            setActionLoading(false);
        }
    }, [editingCenter, createCenter, updateCenter, fetchCenters, handleCloseFormModal, toast]);

    // Detail modal handlers
    const handleViewDetails = useCallback((center) => {
        setSelectedCenterForAction(center);
        setShowDetailModal(true);
    }, []);

    const handleCloseDetailModal = useCallback(() => {
        setShowDetailModal(false);
        setSelectedCenterForAction(null);
    }, []);

    // Assign manager handlers
    const handleOpenAssignModal = useCallback((center) => {
        setSelectedCenterForAction(center);
        setShowAssignModal(true);
    }, []);

    const handleCloseAssignModal = useCallback(() => {
        setShowAssignModal(false);
        setSelectedCenterForAction(null);
    }, []);

    const handleAssignManager = useCallback(async (managerId) => {
        if (!selectedCenterForAction?.id) return;

        setActionLoading(true);
        try {
            const result = await assignManager(selectedCenterForAction.id, managerId);
            toast.success(result.message || 'Gán quản lý thành công');
            handleCloseAssignModal();
            await fetchCenters({ withStats: true });
        } catch (err) {
            console.error('Assign manager error:', err);
            toast.error(err.message || 'Không thể gán quản lý');
        } finally {
            setActionLoading(false);
        }
    }, [selectedCenterForAction, assignManager, fetchCenters, handleCloseAssignModal, toast]);

    // Delete handlers
    const handleOpenDeleteModal = useCallback((center) => {
        setSelectedCenterForAction(center);
        setShowDeleteModal(true);
    }, []);

    const handleCloseDeleteModal = useCallback(() => {
        setShowDeleteModal(false);
        setSelectedCenterForAction(null);
    }, []);

    const handleConfirmDelete = useCallback(async (center) => {
        setActionLoading(true);
        try {
            const result = await deleteCenter(center.id);
            toast.success(result.message || 'Đã chuyển trung tâm sang trạng thái ngừng hoạt động');
            handleCloseDeleteModal();
            await fetchCenters({ withStats: true });
        } catch (err) {
            console.error('Delete error:', err);
            toast.error(err.message || 'Không thể xóa trung tâm');
        } finally {
            setActionLoading(false);
        }
    }, [deleteCenter, fetchCenters, handleCloseDeleteModal, toast]);

    // Restore handler
    const handleRestore = useCallback(async (center) => {
        setActionLoading(true);
        try {
            const result = await restoreCenter(center.id);
            toast.success(result.message || 'Khôi phục trung tâm thành công');
            await fetchCenters({ withStats: true });
        } catch (err) {
            console.error('Restore error:', err);
            toast.error(err.message || 'Không thể khôi phục trung tâm');
        } finally {
            setActionLoading(false);
        }
    }, [restoreCenter, fetchCenters, toast]);

    return (
        <div className="p-6 space-y-6">
            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Building2 className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
                        Quản lý Trung tâm
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Quản lý thông tin các chi nhánh, cơ sở của hệ thống
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Export button */}
                    <Button
                        variant="outline"
                        onClick={handleExport}
                        disabled={loading || exporting || filteredCenters.length === 0}
                        className="gap-2"
                    >
                        {exporting ? (
                            <>
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                Đang xuất...
                            </>
                        ) : (
                            <>
                                <FileSpreadsheet className="h-4 w-4" />
                                Xuất Excel
                            </>
                        )}
                    </Button>

                    {/* Refresh button */}
                    <Button
                        variant="outline"
                        onClick={handleRefresh}
                        disabled={loading}
                        className="gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Làm mới
                    </Button>

                    {/* Add button */}
                    {canManage && (
                        <Button
                            onClick={handleOpenCreateModal}
                            className="gap-2 bg-indigo-600 hover:bg-indigo-700"
                        >
                            <Plus className="h-4 w-4" />
                            Thêm trung tâm
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats cards */}
            <CenterStatsCards stats={overallStats} loading={loading} />

            {/* Filters */}
            <CenterFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
                totalResults={filteredCenters.length}
            />

            {/* Centers grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-card rounded-xl shadow animate-pulse">
                            <div className="h-24 bg-muted rounded-t-xl" />
                            <div className="p-6 space-y-4">
                                <div className="h-6 bg-muted rounded w-3/4" />
                                <div className="h-4 bg-muted rounded w-1/2" />
                                <div className="space-y-2">
                                    <div className="h-4 bg-muted rounded" />
                                    <div className="h-4 bg-muted rounded w-5/6" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredCenters.length === 0 ? (
                <div className="text-center py-12 bg-muted/50 rounded-xl">
                    <Building2 className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                        {filters.search || filters.status !== 'all'
                            ? 'Không tìm thấy trung tâm phù hợp'
                            : 'Chưa có trung tâm nào'
                        }
                    </h3>
                    <p className="text-muted-foreground mb-4">
                        {filters.search || filters.status !== 'all'
                            ? 'Thử thay đổi bộ lọc để tìm kiếm'
                            : 'Hãy tạo trung tâm đầu tiên của bạn'
                        }
                    </p>
                    {canManage && !filters.search && filters.status === 'all' && (
                        <Button onClick={handleOpenCreateModal} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Thêm trung tâm
                        </Button>
                    )}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedCenters.map((center) => (
                            <CenterCard
                                key={center.id}
                                center={center}
                                canManage={canManage}
                                onEdit={handleOpenEditModal}
                                onDelete={handleOpenDeleteModal}
                                onRestore={handleRestore}
                                onAssignManager={handleOpenAssignModal}
                                onViewDetails={handleViewDetails}
                            />
                        ))}
                    </div>

                    {/* Pagination */}
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredCenters.length}
                        pageSize={PAGE_SIZE}
                        onPageChange={setCurrentPage}
                        disabled={loading}
                    />
                </>
            )}

            {/* Modals */}
            <CenterFormModal
                isOpen={showFormModal}
                onClose={handleCloseFormModal}
                onSubmit={handleSubmitForm}
                initialData={editingCenter}
                loading={actionLoading}
            />

            <CenterDetailModal
                isOpen={showDetailModal}
                onClose={handleCloseDetailModal}
                center={selectedCenterForAction}
                onEdit={handleOpenEditModal}
                onAssignManager={handleOpenAssignModal}
                canManage={canManage}
            />

            <AssignManagerModal
                isOpen={showAssignModal}
                onClose={handleCloseAssignModal}
                center={selectedCenterForAction}
                onAssign={handleAssignManager}
                loading={actionLoading}
            />

            <DeleteConfirmModal
                isOpen={showDeleteModal}
                onClose={handleCloseDeleteModal}
                onConfirm={handleConfirmDelete}
                center={selectedCenterForAction}
                loading={actionLoading}
            />
        </div>
    );
}

export default CentersPage;
