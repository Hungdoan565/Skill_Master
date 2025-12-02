/**
 * RoomsPage Component
 * Trang quản lý phòng học - refactored version với header đẹp
 */

import { useEffect, useState } from 'react';
import { Plus, DoorOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRooms, useCenters, useRoomForm } from '../hooks';
import {
  RoomStatsCards,
  RoomFilters,
  RoomsGrid,
  RoomFormModal,
} from '../components';

export function RoomsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCenter, setFilterCenter] = useState('');

  const { rooms, loading, fetchRooms, createRoom, updateRoom, deleteRoom, filterRooms, getStats } = useRooms();
  const { centers, fetchCenters } = useCenters();
  const {
    formData,
    updateField,
    toggleEquipment,
    editingRoom,
    isModalOpen,
    saving,
    openCreateModal,
    openEditModal,
    closeModal,
    handleSave,
  } = useRoomForm();

  // Fetch data on mount
  useEffect(() => {
    fetchRooms();
    fetchCenters();
  }, [fetchRooms, fetchCenters]);

  // Filter rooms
  const filteredRooms = filterRooms(searchTerm, filterCenter);
  const stats = getStats();

  // Handle delete
  const handleDelete = async (room) => {
    if (!confirm(`Xóa phòng "${room.name}"?`)) return;

    try {
      await deleteRoom(room.id);
      await fetchRooms();
    } catch (err) {
      console.error('Error deleting room:', err);
      alert(err.response?.data?.message || 'Không thể xóa phòng');
    }
  };

  // Handle save
  const onSave = () => {
    handleSave(createRoom, updateRoom, fetchRooms);
  };

  // Handle add with default center
  const handleAddClick = () => {
    openCreateModal(centers[0]?.id || '');
  };

  return (
    <div className="space-y-6">
      {/* Page Header - Style giống các trang khác */}
      <div className="bg-white border-b border-slate-200 -mx-6 -mt-6 px-6 py-5 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-linear-to-br from-red-500 to-orange-500 rounded-xl shadow-lg shadow-orange-500/20">
              <DoorOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Quản lý Phòng học</h1>
              <p className="text-slate-500 mt-0.5">Thiết lập phòng học cho các lớp</p>
            </div>
          </div>
          <Button 
            onClick={handleAddClick} 
            className="gap-2 bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/25"
          >
            <Plus className="h-4 w-4" /> Thêm phòng
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <RoomStatsCards stats={stats} />

      {/* Filters */}
      <RoomFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterCenter={filterCenter}
        onCenterChange={setFilterCenter}
        centers={centers}
      />

      {/* Rooms Grid */}
      <RoomsGrid
        rooms={filteredRooms}
        loading={loading}
        onEdit={openEditModal}
        onDelete={handleDelete}
        onAddClick={handleAddClick}
      />

      {/* Modal */}
      <RoomFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        formData={formData}
        onFieldChange={updateField}
        onEquipmentToggle={toggleEquipment}
        centers={centers}
        editingRoom={editingRoom}
        saving={saving}
        onSave={onSave}
      />
    </div>
  );
}

export default RoomsPage;
