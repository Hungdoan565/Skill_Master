import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Plus, Search, Edit2, Trash2, X, Building2, Users,
  Monitor, Projector, Wind, Video, MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Helper lấy auth headers
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    headers: {
      Authorization: `Bearer ${session?.access_token}`
    }
  };
};

// Icon mapping cho thiết bị
const equipmentIcons = {
  projector: Projector,
  computers: Monitor,
  air_conditioner: Wind,
  video_conference: Video,
  whiteboard: MoreHorizontal
};

const equipmentLabels = {
  projector: 'Máy chiếu',
  computers: 'Máy tính',
  air_conditioner: 'Điều hòa',
  video_conference: 'Video Conference',
  whiteboard: 'Bảng trắng'
};

// Status Badge Component
const StatusBadge = ({ status }) => {
  const config = {
    active: { label: 'Hoạt động', className: 'bg-green-100 text-green-700' },
    maintenance: { label: 'Bảo trì', className: 'bg-yellow-100 text-yellow-700' },
    inactive: { label: 'Ngừng hoạt động', className: 'bg-gray-100 text-gray-600' }
  };
  const { label, className } = config[status] || config.active;
  return <Badge className={className}>{label}</Badge>;
};

// Room Type Badge
const RoomTypeBadge = ({ type }) => {
  const config = {
    standard: { label: 'Phòng học', className: 'bg-blue-100 text-blue-700' },
    lab: { label: 'Phòng Lab', className: 'bg-purple-100 text-purple-700' },
    meeting: { label: 'Phòng họp', className: 'bg-orange-100 text-orange-700' },
    online: { label: 'Online', className: 'bg-cyan-100 text-cyan-700' }
  };
  const { label, className } = config[type] || config.standard;
  return <Badge className={className}>{label}</Badge>;
};

// Equipment Tags
const EquipmentTags = ({ equipment = [] }) => {
  if (!equipment || equipment.length === 0) return <span className="text-gray-400 text-sm">Chưa có thiết bị</span>;
  
  return (
    <div className="flex flex-wrap gap-1">
      {equipment.map((item, idx) => {
        const Icon = equipmentIcons[item] || MoreHorizontal;
        return (
          <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
            <Icon className="h-3 w-3" />
            {equipmentLabels[item] || item}
          </span>
        );
      })}
    </div>
  );
};

export function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCenter, setFilterCenter] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    capacity: 20,
    room_type: 'standard',
    equipment: [],
    center_id: '',
    notes: '',
    status: 'active'
  });
  const [saving, setSaving] = useState(false);

  // Fetch data
  useEffect(() => {
    fetchRooms();
    fetchCenters();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const config = await getAuthHeaders();
      const res = await axios.get(`${API_URL}/api/rooms`, config);
      setRooms(res.data.data || []);
    } catch (err) {
      console.error('Error fetching rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCenters = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/centers`);
      setCenters(res.data.data || []);
    } catch (err) {
      console.error('Error fetching centers:', err);
    }
  };

  // Filter rooms
  const filteredRooms = rooms.filter(room => {
    const matchSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       room.code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCenter = !filterCenter || room.center_id === filterCenter;
    return matchSearch && matchCenter;
  });

  // Modal handlers
  const openCreateModal = () => {
    setEditingRoom(null);
    setFormData({
      name: '',
      code: '',
      capacity: 20,
      room_type: 'standard',
      equipment: [],
      center_id: centers[0]?.id || '',
      notes: '',
      status: 'active'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (room) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      code: room.code || '',
      capacity: room.capacity,
      room_type: room.room_type || 'standard',
      equipment: room.equipment || [],
      center_id: room.center_id,
      notes: room.notes || '',
      status: room.status
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRoom(null);
  };

  // Toggle equipment
  const toggleEquipment = (item) => {
    setFormData(prev => ({
      ...prev,
      equipment: prev.equipment.includes(item)
        ? prev.equipment.filter(e => e !== item)
        : [...prev.equipment, item]
    }));
  };

  // Save room
  const handleSave = async () => {
    if (!formData.name || !formData.center_id) {
      alert('Vui lòng nhập tên phòng và chọn trung tâm');
      return;
    }

    try {
      setSaving(true);
      const config = await getAuthHeaders();

      if (editingRoom) {
        await axios.put(`${API_URL}/api/admin/rooms/${editingRoom.id}`, formData, config);
      } else {
        await axios.post(`${API_URL}/api/admin/rooms`, formData, config);
      }

      await fetchRooms();
      closeModal();
    } catch (err) {
      console.error('Error saving room:', err);
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  // Delete room
  const handleDelete = async (room) => {
    if (!confirm(`Xóa phòng "${room.name}"?`)) return;

    try {
      const config = await getAuthHeaders();
      await axios.delete(`${API_URL}/api/admin/rooms/${room.id}`, config);
      await fetchRooms();
    } catch (err) {
      console.error('Error deleting room:', err);
      alert(err.response?.data?.message || 'Không thể xóa phòng');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Phòng học</h1>
          <p className="text-gray-500 mt-1">Thiết lập phòng học cho các lớp</p>
        </div>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="h-4 w-4" /> Thêm phòng
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Tìm theo tên hoặc mã phòng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={filterCenter}
          onChange={(e) => setFilterCenter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
        >
          <option value="">Tất cả trung tâm</option>
          {centers.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rooms.length}</p>
                <p className="text-xs text-gray-500">Tổng phòng</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {rooms.reduce((sum, r) => sum + (r.capacity || 0), 0)}
                </p>
                <p className="text-xs text-gray-500">Tổng sức chứa</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Monitor className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {rooms.filter(r => r.room_type === 'lab').length}
                </p>
                <p className="text-xs text-gray-500">Phòng Lab</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Wind className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {rooms.filter(r => r.status === 'maintenance').length}
                </p>
                <p className="text-xs text-gray-500">Đang bảo trì</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rooms Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Đang tải...</div>
      ) : filteredRooms.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Chưa có phòng học nào</p>
          <Button onClick={openCreateModal} variant="outline" className="mt-4">
            Thêm phòng đầu tiên
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRooms.map(room => (
            <Card key={room.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {room.name}
                      {room.code && (
                        <span className="text-sm font-normal text-gray-400">({room.code})</span>
                      )}
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">{room.centers?.name}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditModal(room)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(room)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <RoomTypeBadge type={room.room_type} />
                  <StatusBadge status={room.status} />
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {room.capacity} chỗ
                  </span>
                </div>
                <EquipmentTags equipment={room.equipment} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingRoom ? 'Chỉnh sửa phòng' : 'Thêm phòng mới'}
              </h2>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <Label>Tên phòng *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="VD: Phòng 101"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label>Mã phòng</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    placeholder="VD: P101"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Sức chứa</Label>
                  <Input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value) || 20})}
                    min={1}
                  />
                </div>
                <div>
                  <Label>Loại phòng</Label>
                  <select
                    value={formData.room_type}
                    onChange={(e) => setFormData({...formData, room_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    <option value="standard">Phòng học</option>
                    <option value="lab">Phòng Lab</option>
                    <option value="meeting">Phòng họp</option>
                    <option value="online">Online</option>
                  </select>
                </div>
              </div>

              <div>
                <Label>Trung tâm *</Label>
                <select
                  value={formData.center_id}
                  onChange={(e) => setFormData({...formData, center_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="">Chọn trung tâm</option>
                  {centers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Thiết bị</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.keys(equipmentLabels).map(key => {
                    const isSelected = formData.equipment.includes(key);
                    const Icon = equipmentIcons[key] || MoreHorizontal;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleEquipment(key)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                          isSelected 
                            ? 'bg-blue-100 border-blue-300 text-blue-700' 
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {equipmentLabels[key]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label>Trạng thái</Label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="active">Hoạt động</option>
                  <option value="maintenance">Đang bảo trì</option>
                  <option value="inactive">Ngừng hoạt động</option>
                </select>
              </div>

              <div>
                <Label>Ghi chú</Label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Ghi chú thêm..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
              <Button variant="outline" onClick={closeModal}>Hủy</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Đang lưu...' : editingRoom ? 'Cập nhật' : 'Thêm phòng'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoomsPage;
