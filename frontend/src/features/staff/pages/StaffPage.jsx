/**
 * StaffPage Component
 * Trang quản lý nhân viên - Full features version
 */

import { useEffect, useState, useCallback } from 'react';
import { UserPlus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { gooeyToast } from 'goey-toast';
import { useAuth } from '@/contexts/auth-context';
import { useStaff, useStaffForm } from '../hooks';
import {
  StaffFilters,
  StaffTable,
  CreateStaffModal,
  EditStaffModal,
  DeleteStaffModal,
  StaffDetailModal,
  EmptyStaffState,
  LoadingState,
} from '../components';

export function StaffPage() {
  const { isSuperAdmin, isManager, profile } = useAuth();
  const staffTitle = isManager?.() ? 'Đội ngũ trung tâm' : 'Quản lý Nhân sự';
  const staffSubtitle = isManager?.()
    ? `Theo dõi và điều phối nhân sự tại ${profile?.centers?.name || 'trung tâm đang phụ trách'}`
    : 'Danh sách giáo viên và quản lý trung tâm';

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Modal states
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState({ isOpen: false, staff: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, staff: null });
  const [detailModal, setDetailModal] = useState({ isOpen: false, staff: null, loading: false });

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Hook
  const {
    staff,
    loading,
    centers,
    fetchStaff,
    fetchCenters,
    createStaff,
    getStaffDetail,
    updateStaff,
    deleteStaff,
    restoreStaff,
    filterStaff,
    lockUser,
    unlockUser,
    resetUserPassword,
  } = useStaff();

  // Form hook for create modal
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

  // Fetch data on mount
  useEffect(() => {
    fetchStaff(roleFilter);
    fetchCenters();
  }, [fetchStaff, fetchCenters, roleFilter]);

  // Filter staff locally by search
  const filteredStaff = filterStaff(searchTerm);

  // Toast helper
  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  }, []);

  // ============================================
  // HANDLERS
  // ============================================

  // Create modal handlers
  const closeCreateModal = () => {
    setCreateModal(false);
    resetForm();
  };

  const onCreateSubmit = async () => {
    const result = await handleSubmit(createStaff);
    if (!result.success && result.error) {
      showToast(result.error, 'error');
    }
  };

  // View detail handler
  const handleViewDetail = useCallback(async (member) => {
    setDetailModal({ isOpen: true, staff: null, loading: true });
    try {
      const detail = await getStaffDetail(member.id);
      setDetailModal({ isOpen: true, staff: detail, loading: false });
    } catch (error) {
      showToast('Lỗi khi tải thông tin nhân viên', 'error');
      setDetailModal({ isOpen: false, staff: null, loading: false });
    }
  }, [getStaffDetail, showToast]);

  // Edit handlers
  const handleEditClick = useCallback((member) => {
    setEditModal({ isOpen: true, staff: member });
  }, []);

  const handleEditSubmit = useCallback(async (staffId, formData) => {
    setActionLoading(true);
    try {
      await updateStaff(staffId, formData);
      showToast('Cập nhật nhân viên thành công');
      setEditModal({ isOpen: false, staff: null });
    } catch (error) {
      showToast(error.message || 'Có lỗi xảy ra', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [updateStaff, showToast]);

  // Delete handlers
  const handleDeleteClick = useCallback((member) => {
    setDeleteModal({ isOpen: true, staff: member });
  }, []);

  const handleDeleteConfirm = useCallback(async (staffId, permanent) => {
    setActionLoading(true);
    try {
      const result = await deleteStaff(staffId, permanent);
      showToast(result.message);
      setDeleteModal({ isOpen: false, staff: null });
    } catch (error) {
      showToast(error.message || 'Có lỗi xảy ra', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [deleteStaff, showToast]);

  // Restore handler
  const handleRestore = useCallback(async (staffId) => {
    try {
      const result = await restoreStaff(staffId);
      showToast(result.message);
    } catch (error) {
      showToast(error.message || 'Có lỗi xảy ra', 'error');
    }
  }, [restoreStaff, showToast]);

  // Lock user handler (SUPER_ADMIN)
  const handleLockUser = useCallback(async (userId) => {
    try {
      await lockUser(userId);
      gooeyToast.success('Đã khóa tài khoản');
    } catch (error) {
      gooeyToast.error(error.message || 'Không thể khóa tài khoản');
    }
  }, [lockUser]);

  // Unlock user handler (SUPER_ADMIN)
  const handleUnlockUser = useCallback(async (userId) => {
    try {
      await unlockUser(userId);
      gooeyToast.success('Đã mở khóa tài khoản');
    } catch (error) {
      gooeyToast.error(error.message || 'Không thể mở khóa tài khoản');
    }
  }, [unlockUser]);

  // Reset password handler (SUPER_ADMIN)
  const handleResetPassword = useCallback(async (userId) => {
    try {
      await resetUserPassword(userId);
      gooeyToast.success('Đã gửi link đặt lại mật khẩu');
    } catch (error) {
      gooeyToast.error(error.message || 'Không thể gửi link đặt lại mật khẩu');
    }
  }, [resetUserPassword]);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    fetchStaff(roleFilter);
  }, [fetchStaff, roleFilter]);

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${toast.type === 'success'
          ? 'bg-green-500 text-white'
          : 'bg-red-500 text-white'
          }`}>
          {toast.message}
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{staffTitle}</h1>
          <p className="text-muted-foreground">{staffSubtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => setCreateModal(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Thêm nhân viên
          </Button>
        </div>
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
              onAddClick={() => setCreateModal(true)}
            />
          ) : (
            <StaffTable
              staff={filteredStaff}
              onViewDetail={handleViewDetail}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              onRestore={handleRestore}
              onLockUser={handleLockUser}
              onUnlockUser={handleUnlockUser}
              onResetPassword={handleResetPassword}
              isSuperAdmin={isSuperAdmin?.() || false}
            />
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateStaffModal
        isOpen={createModal}
        onClose={closeCreateModal}
        formData={formData}
        onFieldChange={updateField}
        onSubmit={onCreateSubmit}
        submitting={submitting}
        successMessage={successMessage}
        copiedPassword={copiedPassword}
        onCopyPassword={copyPassword}
        onAddAnother={addAnother}
      />

      <EditStaffModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, staff: null })}
        staff={editModal.staff}
        centers={centers}
        onSubmit={handleEditSubmit}
        submitting={actionLoading}
      />

      <DeleteStaffModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, staff: null })}
        staff={deleteModal.staff}
        onConfirm={handleDeleteConfirm}
        deleting={actionLoading}
      />

      <StaffDetailModal
        isOpen={detailModal.isOpen}
        onClose={() => setDetailModal({ isOpen: false, staff: null, loading: false })}
        staff={detailModal.staff}
        loading={detailModal.loading}
      />
    </div>
  );
}

export default StaffPage;
