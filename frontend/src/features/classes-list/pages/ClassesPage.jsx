/**
 * ClassesPage - Trang danh sách lớp học
 * Enhanced with advanced filtering and export/import capabilities
 */

import { useEffect, useState, useMemo } from 'react';
import { Plus, BarChart3, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Feature imports
import { useClassesList, useClassForm, useFormOptions, useAdvancedFilters } from '../hooks';
import {
  ClassesTable,
  ClassFilters,
  BulkActionBar,
  CreateClassModal,
  DeleteClassModal,
  BulkDeleteModal,
  AdvancedFiltersDrawer,
  FilterChips,
  ExportButton,
  ImportModal,
  TablePagination
} from '../components';
import { STATUS_CONFIG, API_URL } from '../utils';
import { supabase } from '@/lib/supabaseClient';

// Helper: Get auth headers for API calls
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Chưa đăng nhập');
  return { Authorization: `Bearer ${session.access_token}` };
};

export function ClassesPage() {
  // State
  const [modalOpen, setModalOpen] = useState(false);
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    classItem: null,
    error: null
  });
  const [bulkDeleteModal, setBulkDeleteModal] = useState({
    isOpen: false,
    error: null
  });
  const [deleting, setDeleting] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkStatusLoading, setBulkStatusLoading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Advanced Filters Hook
  const {
    filters,
    savedFilters,
    updateFilter,
    updateFilters,
    resetFilters,
    removeFilter,
    saveFilterPreset,
    loadFilterPreset,
    deleteFilterPreset,
    getActiveFilterCount
  } = useAdvancedFilters();

  // Hooks
  const {
    classes,
    loading,
    selectedIds,
    error,
    fetchClasses,
    deleteClass,
    deleteMultipleClasses,
    filterClasses,
    toggleSelectItem,
    toggleSelectAll,
    clearSelection,
    clearError
  } = useClassesList();

  const {
    formData,
    selectedDays,
    startTime,
    endTime,
    submitting,
    isEditing,
    editingClass,
    formError,
    validationErrors,
    resetForm,
    loadClassData,
    toggleDay,
    updateField,
    handleCourseChange,
    handleStartDateChange,
    regenerateName,
    submitForm,
    setStartTime,
    setEndTime,
    clearFormError,
    clearValidationError
  } = useClassForm();

  const {
    courses,
    teachers,
    centers,
    rooms,
    fetchAllOptions,
    getRoomsByCenter,
    getRoomById
  } = useFormOptions();

  // Fetch data on mount
  useEffect(() => {
    fetchClasses();
    fetchAllOptions();
  }, [fetchClasses, fetchAllOptions]);

  // Refetch when smartFilter changes (server-side filter)
  useEffect(() => {
    if (filters.smartFilter) {
      fetchClasses({ smartFilter: filters.smartFilter });
    } else {
      fetchClasses();
    }
  }, [filters.smartFilter, fetchClasses]);

  // Filtered classes - using advanced filters
  const filteredClasses = useMemo(() => {
    return filterClasses(filters);
  }, [filterClasses, filters]);

  // Paginated classes - client-side pagination
  const paginatedClasses = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredClasses.slice(startIndex, startIndex + pageSize);
  }, [filteredClasses, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredClasses.length / pageSize);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top of table
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle page size change
  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page
  };

  // Check if user is SUPER_ADMIN (simplified check)
  const isSuperAdmin = useMemo(() => {
    // This should ideally come from auth context
    // For now, show center filter if there are multiple centers
    return centers.length > 1;
  }, [centers]);

  // Modal handlers
  const openModal = (classItem = null) => {
    if (classItem) {
      loadClassData(classItem);
    } else {
      resetForm(centers[0]?.id || '');
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    resetForm();
    clearFormError();
  };

  // Clone class - pre-fill form with existing class data
  const handleCloneClass = (classItem) => {
    if (!classItem) return;

    // Load class data but mark as new (not editing)
    loadClassData(classItem);

    // Reset fields that should be different for clone
    const today = new Date().toISOString().split('T')[0];
    updateField('code', `${classItem.code}_COPY`);
    updateField('name', `${classItem.name} (Bản sao)`);
    updateField('start_date', '');
    updateField('end_date', '');
    updateField('status', 'upcoming');

    // Clear editing state so it creates a new class
    resetForm(classItem.center_id);
    loadClassData({
      ...classItem,
      id: undefined, // Remove ID so it creates new
      code: `${classItem.code}_COPY`,
      name: `${classItem.name} (Bản sao)`,
      start_date: '',
      end_date: '',
      status: 'upcoming'
    });

    setModalOpen(true);
  };

  // Form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await submitForm();
      closeModal();
      fetchClasses();
    } catch (error) {
      // Error đã được set trong hook, không cần làm gì thêm
      console.error('Form submit error:', error);
    }
  };

  // Delete single class
  const handleDelete = async () => {
    if (!deleteModal.classItem) return;
    setDeleting(true);
    setDeleteModal(prev => ({ ...prev, error: null }));

    try {
      await deleteClass(deleteModal.classItem.id);
      setDeleteModal({ isOpen: false, classItem: null, error: null });
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi xóa lớp học';
      setDeleteModal(prev => ({ ...prev, error: errorMessage }));
    } finally {
      setDeleting(false);
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setBulkDeleting(true);
    setBulkDeleteModal(prev => ({ ...prev, error: null }));

    try {
      await deleteMultipleClasses(selectedIds);
      setBulkDeleteModal({ isOpen: false, error: null });
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi xóa. Một số lớp có thể có học viên đang ghi danh.';
      setBulkDeleteModal(prev => ({ ...prev, error: errorMessage }));
    } finally {
      setBulkDeleting(false);
    }
  };

  // Bulk export
  const handleBulkExport = async () => {
    const selectedClasses = classes.filter(cls => selectedIds.includes(cls.id));
    if (selectedClasses.length === 0) return;

    // Import export utility
    const { exportSelectedClasses } = await import('../utils/export');
    exportSelectedClasses(selectedClasses);

    // Clear selection after export
    clearSelection();
  };

  // Bulk notify - Navigate to notifications page with selected classes
  const handleBulkNotify = () => {
    if (selectedIds.length === 0) return;

    // Store selected class IDs in sessionStorage for notifications page
    sessionStorage.setItem('notifyClassIds', JSON.stringify(selectedIds));

    // Navigate to notifications page
    window.location.href = '/admin/notifications?source=classes';
  };

  // Bulk status change
  const handleBulkStatusChange = async (newStatus) => {
    if (selectedIds.length === 0) return;

    setBulkStatusLoading(true);
    try {
      // Update each selected class status via API
      const headers = await getAuthHeaders();

      await Promise.all(
        selectedIds.map(id =>
          fetch(`${API_URL}/api/admin/classes/${id}`, {
            method: 'PUT',
            headers: {
              ...headers,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
          })
        )
      );

      // Refresh list after update
      await fetchClasses();
      clearSelection();

      // Show success message (could use toast here)
      console.log(`Đã cập nhật ${selectedIds.length} lớp sang trạng thái: ${newStatus}`);
    } catch (error) {
      console.error('Error updating class statuses:', error);
    } finally {
      setBulkStatusLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Quản lý Lớp học
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            Quản lý danh sách, lịch trình và sĩ số các lớp học của trung tâm
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton
            data={filteredClasses}
            filename="danh-sach-lop-hoc"
            courses={courses}
            teachers={teachers}
            centers={centers}
          />
          <Button
            variant="outline"
            onClick={() => setImportModalOpen(true)}
            className="hover:bg-slate-50 transition-all duration-300"
          >
            <Upload className="mr-2 h-4 w-4" />
            Nhập dữ liệu
          </Button>
          <Button
            onClick={() => openModal()}
            className="bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white shadow-lg shadow-orange-500/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Mở lớp mới
          </Button>
        </div>
      </div>

      {/* Main Content Card */}
      <Card>
        <CardHeader className="pb-3">
          <ClassFilters
            searchTerm={filters.search}
            onSearchChange={(value) => updateFilter('search', value)}
            statusFilter={filters.status}
            onStatusChange={(value) => updateFilter('status', value)}
            smartFilter={filters.smartFilter}
            onSmartFilterChange={(value) => updateFilter('smartFilter', value)}
            totalCount={filteredClasses.length}
            activeFilterCount={getActiveFilterCount()}
            onOpenAdvancedFilters={() => setAdvancedFiltersOpen(true)}
          />

          {/* Filter Chips */}
          <FilterChips
            filters={filters}
            onRemoveFilter={removeFilter}
            onClearAll={resetFilters}
            courses={courses}
            teachers={teachers}
            centers={centers}
            statusConfig={STATUS_CONFIG}
          />
        </CardHeader>

        <CardContent>
          {/* Network Error Banner */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-red-800">Lỗi kết nối</p>
                  <p className="text-sm text-red-600">{error.message}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  clearError();
                  error.retry?.();
                }}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Thử lại
              </Button>
            </div>
          )}

          {/* Bulk Action Bar */}
          <BulkActionBar
            selectedCount={selectedIds.length}
            onClearSelection={clearSelection}
            onBulkDelete={() => setBulkDeleteModal({ isOpen: true, error: null })}
            onBulkExport={handleBulkExport}
            onBulkNotify={handleBulkNotify}
            onBulkStatusChange={handleBulkStatusChange}
            bulkStatusLoading={bulkStatusLoading}
          />

          {/* Classes Table */}
          <ClassesTable
            classes={paginatedClasses}
            loading={loading}
            searchTerm={filters.search}
            statusFilter={filters.status}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelectItem}
            onToggleSelectAll={() => toggleSelectAll(paginatedClasses)}
            onEdit={openModal}
            onDelete={(cls) => setDeleteModal({ isOpen: true, classItem: cls, error: null })}
            onClone={handleCloneClass}
            onOpenModal={() => openModal()}
          />

          {/* Pagination */}
          {!loading && filteredClasses.length > 0 && (
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={filteredClasses.length}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              className="border-t"
            />
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <CreateClassModal
        isOpen={modalOpen}
        onClose={closeModal}
        formData={formData}
        selectedDays={selectedDays}
        startTime={startTime}
        endTime={endTime}
        submitting={submitting}
        isEditing={isEditing}
        editingClass={editingClass}
        formError={formError}
        validationErrors={validationErrors}
        courses={courses}
        teachers={teachers}
        centers={centers}
        rooms={rooms}
        onUpdateField={updateField}
        onToggleDay={toggleDay}
        onSetStartTime={setStartTime}
        onSetEndTime={setEndTime}
        onCourseChange={(v) => handleCourseChange(v, courses)}
        onStartDateChange={(v) => handleStartDateChange(v, courses)}
        onRegenerateName={() => regenerateName(courses)}
        onSubmit={handleSubmit}
        onClearValidationError={clearValidationError}
        getRoomsByCenter={getRoomsByCenter}
        getRoomById={getRoomById}
      />

      {/* Delete Confirmation Modal */}
      <DeleteClassModal
        isOpen={deleteModal.isOpen}
        classItem={deleteModal.classItem}
        deleting={deleting}
        error={deleteModal.error}
        onClose={() => setDeleteModal({ isOpen: false, classItem: null, error: null })}
        onConfirm={handleDelete}
      />

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={bulkDeleteModal.isOpen}
        selectedIds={selectedIds}
        classes={classes}
        deleting={bulkDeleting}
        error={bulkDeleteModal.error}
        onClose={() => setBulkDeleteModal({ isOpen: false, error: null })}
        onConfirm={handleBulkDelete}
      />

      {/* Advanced Filters Drawer */}
      <AdvancedFiltersDrawer
        isOpen={advancedFiltersOpen}
        onClose={() => setAdvancedFiltersOpen(false)}
        filters={filters}
        onApplyFilters={updateFilters}
        onResetFilters={resetFilters}
        courses={courses}
        teachers={teachers}
        centers={centers}
        savedFilters={savedFilters}
        onSaveFilter={saveFilterPreset}
        onLoadFilter={loadFilterPreset}
        onDeleteFilter={deleteFilterPreset}
        showCenterFilter={isSuperAdmin}
      />

      {/* Import Modal */}
      <ImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImportSuccess={() => {
          setImportModalOpen(false);
          fetchClasses();
        }}
        courses={courses}
        teachers={teachers}
        centers={centers}
      />
    </div>
  );
}

export default ClassesPage;
