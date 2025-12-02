/**
 * ClassesPage - Trang danh sách lớp học
 */

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Feature imports
import { useClassesList, useClassForm, useFormOptions } from '../hooks';
import {
  ClassesTable,
  ClassFilters,
  BulkActionBar,
  CreateClassModal,
  DeleteClassModal,
  BulkDeleteModal
} from '../components';

export function ClassesPage() {
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, classItem: null });
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Hooks
  const {
    classes,
    loading,
    selectedIds,
    fetchClasses,
    deleteClass,
    deleteMultipleClasses,
    filterClasses,
    toggleSelectItem,
    toggleSelectAll,
    clearSelection
  } = useClassesList();

  const {
    formData,
    selectedDays,
    startTime,
    endTime,
    submitting,
    isEditing,
    editingClass,
    resetForm,
    loadClassData,
    toggleDay,
    updateField,
    handleCourseChange,
    handleStartDateChange,
    regenerateName,
    submitForm,
    setStartTime,
    setEndTime
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

  // Filtered classes
  const filteredClasses = filterClasses(searchTerm, statusFilter);

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
  };

  // Form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await submitForm();
      closeModal();
      fetchClasses();
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  // Delete single class
  const handleDelete = async () => {
    if (!deleteModal.classItem) return;
    setDeleting(true);

    try {
      await deleteClass(deleteModal.classItem.id);
      setDeleteModal({ isOpen: false, classItem: null });
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setDeleting(false);
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setBulkDeleting(true);

    try {
      await deleteMultipleClasses(selectedIds);
      setBulkDeleteModal(false);
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi xóa');
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Lớp học</h1>
          <p className="text-muted-foreground">Danh sách các lớp học của trung tâm</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="mr-2 h-4 w-4" />
          Mở lớp mới
        </Button>
      </div>

      {/* Main Content Card */}
      <Card>
        <CardHeader className="pb-3">
          <ClassFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            totalCount={filteredClasses.length}
          />
        </CardHeader>
        
        <CardContent>
          {/* Bulk Action Bar */}
          <BulkActionBar
            selectedCount={selectedIds.length}
            onClearSelection={clearSelection}
            onBulkDelete={() => setBulkDeleteModal(true)}
          />

          {/* Classes Table */}
          <ClassesTable
            classes={filteredClasses}
            loading={loading}
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelectItem}
            onToggleSelectAll={() => toggleSelectAll(filteredClasses)}
            onEdit={openModal}
            onDelete={(cls) => setDeleteModal({ isOpen: true, classItem: cls })}
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
        getRoomsByCenter={getRoomsByCenter}
        getRoomById={getRoomById}
      />

      {/* Delete Confirmation Modal */}
      <DeleteClassModal
        isOpen={deleteModal.isOpen}
        classItem={deleteModal.classItem}
        deleting={deleting}
        onClose={() => setDeleteModal({ isOpen: false, classItem: null })}
        onConfirm={handleDelete}
      />

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={bulkDeleteModal}
        selectedIds={selectedIds}
        classes={classes}
        deleting={bulkDeleting}
        onClose={() => setBulkDeleteModal(false)}
        onConfirm={handleBulkDelete}
      />
    </div>
  );
}

export default ClassesPage;
