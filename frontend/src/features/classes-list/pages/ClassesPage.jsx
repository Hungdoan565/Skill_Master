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
  ImportModal
} from '../components';
import { STATUS_CONFIG } from '../utils';

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
  const handleBulkExport = () => {
    const selectedClasses = classes.filter(cls => selectedIds.includes(cls.id));
    // Reuse ExportButton logic
    console.log('Exporting selected classes:', selectedClasses);
    // TODO: Implement export logic
  };

  // Bulk notify
  const handleBulkNotify = () => {
    console.log('Sending notifications to selected classes:', selectedIds);
    // TODO: Implement notification logic
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Lớp học</h1>
          <p className="text-muted-foreground">Danh sách các lớp học của trung tâm</p>
        </div>
        <div className="flex items-center gap-2">
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
          >
            <Upload className="mr-2 h-4 w-4" />
            Nhập dữ liệu
          </Button>
          <Button onClick={() => openModal()}>
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
          />

          {/* Classes Table */}
          <ClassesTable
            classes={filteredClasses}
            loading={loading}
            searchTerm={filters.search}
            statusFilter={filters.status}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelectItem}
            onToggleSelectAll={() => toggleSelectAll(filteredClasses)}
            onEdit={openModal}
            onDelete={(cls) => setDeleteModal({ isOpen: true, classItem: cls, error: null })}
            onOpenModal={() => openModal()}
          />
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
