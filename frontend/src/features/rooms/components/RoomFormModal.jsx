/**
 * RoomFormModal Component
 * Modal form thêm/sửa phòng
 */

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EquipmentSelector } from './EquipmentSelector';
import { ROOM_TYPE_OPTIONS, STATUS_OPTIONS } from '../utils';

export function RoomFormModal({
  isOpen,
  onClose,
  formData,
  onFieldChange,
  onEquipmentToggle,
  centers = [],
  editingRoom,
  saving,
  onSave,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {editingRoom ? 'Chỉnh sửa phòng' : 'Thêm phòng mới'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
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
                onChange={(e) => onFieldChange('name', e.target.value)}
                placeholder="VD: Phòng 101"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label>Mã phòng</Label>
              <Input
                value={formData.code}
                onChange={(e) => onFieldChange('code', e.target.value)}
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
                onChange={(e) => onFieldChange('capacity', parseInt(e.target.value) || 20)}
                min={1}
              />
            </div>
            <div>
              <Label>Loại phòng</Label>
              <select
                value={formData.room_type}
                onChange={(e) => onFieldChange('room_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                {ROOM_TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label>Trung tâm *</Label>
            <select
              value={formData.center_id}
              onChange={(e) => onFieldChange('center_id', e.target.value)}
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
            <div className="mt-2">
              <EquipmentSelector
                selected={formData.equipment}
                onToggle={onEquipmentToggle}
              />
            </div>
          </div>

          <div>
            <Label>Trạng thái</Label>
            <select
              value={formData.status}
              onChange={(e) => onFieldChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <Label>Ghi chú</Label>
            <textarea
              value={formData.notes}
              onChange={(e) => onFieldChange('notes', e.target.value)}
              placeholder="Ghi chú thêm..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? 'Đang lưu...' : editingRoom ? 'Cập nhật' : 'Thêm phòng'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default RoomFormModal;
