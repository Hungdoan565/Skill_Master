/**
 * RoomsPage Component
 * Trang quản lý phòng học - 3 cấp: TRUNG TÂM → KHU → PHÒNG
 */

import { useEffect, useState, useMemo } from 'react';
import { Plus, DoorOpen, Home, ChevronRight, Upload } from 'lucide-react';
import { gooeyToast } from 'goey-toast';
import { Button } from '@/components/ui/button';
import { useRooms, useCenters, useRoomForm } from '../hooks';
import { groupRoomsByCenterAndZone, extractZoneFromCode } from '../utils';
import {
  CenterCard,
  ZoneCard,
  RoomListModal,
  RoomFormModal,
  DeleteRoomModal,
  ImportRoomsModal,
} from '../components';

export function RoomsPage() {
  // Navigation state: 'centers' | 'zones' | 'rooms'
  const [viewLevel, setViewLevel] = useState('centers');
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [roomListModal, setRoomListModal] = useState({ isOpen: false, zone: null, rooms: [] });

  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    room: null,
    error: null
  });
  const [deleting, setDeleting] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const { rooms, loading, fetchRooms, createRoom, updateRoom, deleteRoom } = useRooms();
  const { centers, fetchCenters } = useCenters();
  const {
    formData,
    updateField,
    toggleEquipment,
    editingRoom,
    isModalOpen,
    saving,
    formError,
    openCreateModal,
    openEditModal,
    closeModal,
    handleSave,
    clearFormError,
  } = useRoomForm();

  // Fetch data on mount
  useEffect(() => {
    fetchRooms();
    fetchCenters();
  }, [fetchRooms, fetchCenters]);

  // Group data by center and zone
  const centerData = useMemo(() => {
    return groupRoomsByCenterAndZone(rooms, centers);
  }, [rooms, centers]);

  // Get zones for selected center
  const zonesForSelectedCenter = useMemo(() => {
    if (!selectedCenter || !centerData[selectedCenter.id]) return {};
    return centerData[selectedCenter.id].zones;
  }, [centerData, selectedCenter]);

  // Navigation handlers
  const handleCenterClick = (center) => {
    setSelectedCenter(center);
    setViewLevel('zones');
  };

  const handleZoneClick = (zone, rooms) => {
    setRoomListModal({
      isOpen: true,
      zone,
      rooms,
      centerName: selectedCenter?.name || ''
    });
  };

  const handleBackToCenters = () => {
    setViewLevel('centers');
    setSelectedCenter(null);
  };

  const handleCloseRoomList = () => {
    setRoomListModal({ isOpen: false, zone: null, rooms: [], centerName: '' });
  };

  // Handle delete - open modal
  const handleDeleteClick = (room) => {
    setDeleteModal({ isOpen: true, room, error: null });
  };

  // Handle delete - confirm
  const handleDeleteConfirm = async () => {
    if (!deleteModal.room) return;
    setDeleting(true);
    setDeleteModal(prev => ({ ...prev, error: null }));

    try {
      await deleteRoom(deleteModal.room.id);
      setDeleteModal({ isOpen: false, room: null, error: null });
      await fetchRooms();
      // Close room list modal if open
      if (roomListModal.isOpen) {
        handleCloseRoomList();
      }
    } catch (err) {
      console.error('Error deleting room:', err);
      const errorMessage = err.response?.data?.message || 'Không thể xóa phòng';
      setDeleteModal(prev => ({ ...prev, error: errorMessage }));
    } finally {
      setDeleting(false);
    }
  };

  // Handle save
  const onSave = () => {
    handleSave(createRoom, updateRoom, () => {
      fetchRooms();
      // Refresh room list modal if open
      if (roomListModal.isOpen) {
        const updatedRooms = rooms.filter(r =>
          extractZoneFromCode(r.code) === roomListModal.zone &&
          r.center_id === selectedCenter?.id
        );
        setRoomListModal(prev => ({ ...prev, rooms: updatedRooms }));
      }
    });
  };

  // Handle add room with default center
  const handleAddClick = () => {
    const defaultCenterId = selectedCenter?.id || centers[0]?.id || '';
    openCreateModal(defaultCenterId);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white border-b border-slate-200 -mx-6 -mt-6 px-6 py-5 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl shadow-lg shadow-orange-500/20">
              <DoorOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Quản lý Phòng học</h1>
              <p className="text-slate-500 mt-0.5">
                {viewLevel === 'centers' && 'Chọn trung tâm để xem các khu'}
                {viewLevel === 'zones' && selectedCenter && `${selectedCenter.name} - Chọn khu để xem phòng`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setImportModalOpen(true)}
              className="gap-2"
            >
              <Upload className="h-4 w-4" /> Import Excel
            </Button>
            <Button
              onClick={handleAddClick}
              className="gap-2 bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25"
            >
              <Plus className="h-4 w-4" /> Thêm phòng
            </Button>
          </div>
        </div>

        {/* Breadcrumb */}
        {viewLevel === 'zones' && (
          <div className="flex items-center gap-2 mt-4 text-sm">
            <button
              onClick={handleBackToCenters}
              className="flex items-center gap-1 text-orange-600 hover:text-orange-700 font-medium"
            >
              <Home className="h-4 w-4" />
              Trung tâm
            </button>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <span className="text-slate-600">{selectedCenter?.name}</span>
          </div>
        )}
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Đang tải...</div>
      ) : viewLevel === 'centers' ? (
        /* Level 1: Display Centers */
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {centers.map(center => (
            <CenterCard
              key={center.id}
              center={center}
              stats={centerData[center.id]?.stats || { zones: 0, rooms: 0, capacity: 0 }}
              onClick={() => handleCenterClick(center)}
            />
          ))}
        </div>
      ) : viewLevel === 'zones' ? (
        /* Level 2: Display Zones */
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Object.keys(zonesForSelectedCenter).sort().map(zone => (
            <ZoneCard
              key={zone}
              zone={zone}
              rooms={zonesForSelectedCenter[zone]}
              onClick={() => handleZoneClick(zone, zonesForSelectedCenter[zone])}
            />
          ))}
          {Object.keys(zonesForSelectedCenter).length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              <DoorOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Chưa có khu nào trong trung tâm này</p>
              <Button onClick={handleAddClick} variant="outline" className="mt-4">
                Thêm phòng đầu tiên
              </Button>
            </div>
          )}
        </div>
      ) : null}

      {/* Room List Modal (Level 3) */}
      <RoomListModal
        isOpen={roomListModal.isOpen}
        onClose={handleCloseRoomList}
        zone={roomListModal.zone}
        centerName={roomListModal.centerName}
        rooms={roomListModal.rooms}
        onEdit={openEditModal}
        onDelete={handleDeleteClick}
      />

      {/* Form Modal */}
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
        formError={formError}
        onClearError={clearFormError}
      />

      {/* Delete Confirmation Modal */}
      <DeleteRoomModal
        isOpen={deleteModal.isOpen}
        room={deleteModal.room}
        deleting={deleting}
        error={deleteModal.error}
        onClose={() => setDeleteModal({ isOpen: false, room: null, error: null })}
        onConfirm={handleDeleteConfirm}
      />

      {/* Import Rooms Modal */}
      <ImportRoomsModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={(message) => {
          fetchRooms();
          setImportModalOpen(false);
          gooeyToast.success(message);
        }}
      />
    </div>
  );
}

export default RoomsPage;
