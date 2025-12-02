/**
 * StaffPage Component
 * Trang quản lý nhân viên - refactored version
 */

import { useEffect, useState, useCallback } from 'react';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { useStaff, useStaffForm } from '../hooks';
import {
  StaffFilters,
  StaffTable,
  CreateStaffModal,
  EmptyStaffState,
  LoadingState,
} from '../components';

export function StaffPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { staff, loading, fetchStaff, createStaff, filterStaff } = useStaff();
  
  const handleStaffCreated = useCallback(() => {
    fetchStaff(roleFilter);
  }, [fetchStaff, roleFilter]);
  
  const {
    formData,
    updateField,
    resetForm,
    submitting,
    handleSubmit,
    successMessage,
    copiedPassword,
    copyPassword,
    addAnother,
  } = useStaffForm(handleStaffCreated);

  // Fetch staff on mount and when filter changes
  useEffect(() => {
    fetchStaff(roleFilter);
  }, [fetchStaff, roleFilter]);

  // Filter staff locally by search
  const filteredStaff = filterStaff(searchTerm);

  // Handle modal close
  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  // Handle form submit
  const onSubmit = async () => {
    const result = await handleSubmit(createStaff);
    if (!result.success && result.error) {
      alert(result.error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Nhân sự</h1>
          <p className="text-muted-foreground">
            Danh sách giáo viên và quản lý trung tâm
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Thêm nhân viên
        </Button>
      </div>

      {/* Toolbar & Table */}
      <Card>
        <CardHeader className="pb-3">
          <StaffFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            roleFilter={roleFilter}
            onRoleChange={setRoleFilter}
            totalCount={filteredStaff.length}
          />
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <LoadingState />
          ) : filteredStaff.length === 0 ? (
            <EmptyStaffState 
              hasFilters={!!(searchTerm || roleFilter)}
              onAddClick={() => setIsModalOpen(true)}
            />
          ) : (
            <StaffTable 
              staff={filteredStaff}
              onEdit={(member) => console.log('Edit:', member)}
              onDelete={(member) => console.log('Delete:', member)}
            />
          )}
        </CardContent>
      </Card>

      {/* Modal Thêm nhân viên */}
      <CreateStaffModal
        isOpen={isModalOpen}
        onClose={closeModal}
        formData={formData}
        onFieldChange={updateField}
        onSubmit={onSubmit}
        submitting={submitting}
        successMessage={successMessage}
        copiedPassword={copiedPassword}
        onCopyPassword={copyPassword}
        onAddAnother={addAnother}
      />
    </div>
  );
}

export default StaffPage;
