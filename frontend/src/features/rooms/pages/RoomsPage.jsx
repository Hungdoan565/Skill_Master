/**
 * RoomsPage Component
 * Trang quản lý phòng học - refactored version
 */

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Phòng học</h1>
          <p className="text-gray-500 mt-1">Thiết lập phòng học cho các lớp</p>
        </div>
        <Button onClick={handleAddClick} className="gap-2">
          <Plus className="h-4 w-4" /> Thêm phòng
        </Button>
      </div>

      {/* Filters */}
      <RoomFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterCenter={filterCenter}
        onCenterChange={setFilterCenter}
        centers={centers}
      />

      {/* Stats Cards */}
      <RoomStatsCards stats={stats} />

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
