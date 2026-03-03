/**
 * RoomFormModal Component - Redesigned
 * Modal form thêm/sửa phòng học với style đồng bộ (gradient cam-đỏ)
 * Auto-generate mã phòng, suggest capacity theo loại phòng
 */

import { useState, useEffect, useMemo } from 'react';
import {
  X,
  DoorOpen,
  Loader2,
  Building2,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EquipmentSelector } from './EquipmentSelector';
import { ROOM_TYPE_OPTIONS, STATUS_OPTIONS } from '../utils';

// Default capacity by room type
const CAPACITY_SUGGESTIONS = {
  standard: { default: 30, min: 15, max: 50, label: 'Phòng học thường: 15-50 chỗ' },
  lab: { default: 20, min: 10, max: 30, label: 'Phòng Lab: 10-30 chỗ' },
  meeting: { default: 12, min: 6, max: 20, label: 'Phòng họp: 6-20 chỗ' },
  online: { default: 1, min: 1, max: 5, label: 'Phòng online: 1-5 chỗ' }
};

// Auto-generate room code from name
const generateRoomCode = (name) => {
  if (!name) return '';

  const cleaned = name.trim();

  // Priority 1: Extract pattern {Letter}{Number}-{Number} (e.g., "E2-01", "A3-12", "Phòng E2-01")
  const complexPattern = cleaned.match(/([A-Z]\d+[-]\d+)/i);
  if (complexPattern) {
    return complexPattern[1].toUpperCase(); // "E2-01" -> "E2-01"
  }

  // Priority 2: Extract pattern {Letter}{Number} (e.g., "LAB1", "MTG2", "Lab E2")
  const simplePattern = cleaned.match(/([A-Z]+\d+)/i);
  if (simplePattern) {
    return simplePattern[1].toUpperCase(); // "LAB1" -> "LAB1"
  }

  // Priority 3: Build from keywords + numbers
  const lowerCleaned = cleaned.toLowerCase();
  const numbers = cleaned.match(/\d+/g);
  const number = numbers ? numbers.join('') : '';

  let prefix = 'R'; // Default: Room
  if (lowerCleaned.includes('lab') || lowerCleaned.includes('máy tính')) prefix = 'LAB';
  else if (lowerCleaned.includes('họp') || lowerCleaned.includes('meeting')) prefix = 'MTG';
  else if (lowerCleaned.includes('online') || lowerCleaned.includes('ảo')) prefix = 'ONL';

  return number ? `${prefix}${number}` : prefix;
};

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
  formError,
  onClearError,
}) {
  const [autoCode, setAutoCode] = useState(!editingRoom); // Auto-generate code by default for new rooms
  const [showCapacityHint, setShowCapacityHint] = useState(false);

  // Reset autoCode when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setAutoCode(!editingRoom);
      setShowCapacityHint(false);
    }
  }, [isOpen, editingRoom]);

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !saving) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, saving, onClose]);

  // Auto-generate code when name changes (only if autoCode is enabled)
  useEffect(() => {
    if (autoCode && !editingRoom && formData.name) {
      const generatedCode = generateRoomCode(formData.name);
      if (generatedCode !== formData.code) {
        onFieldChange('code', generatedCode);
      }
    }
  }, [formData.name, autoCode, editingRoom, formData.code, onFieldChange]);

  // Get current capacity suggestion
  const capacitySuggestion = useMemo(() => {
    return CAPACITY_SUGGESTIONS[formData.room_type] || CAPACITY_SUGGESTIONS.standard;
  }, [formData.room_type]);

  // Validation
  const validation = useMemo(() => {
    const errors = {};
    if (!formData.name?.trim()) errors.name = 'Vui lòng nhập tên phòng';
    if (!formData.center_id) errors.center_id = 'Vui lòng chọn trung tâm';
    if (formData.capacity < 1) errors.capacity = 'Sức chứa phải >= 1';
    return errors;
  }, [formData.name, formData.center_id, formData.capacity]);

  const isValid = Object.keys(validation).length === 0;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="room-form-modal-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">

        {/* Header - Gradient cam-đỏ */}
        <div className="bg-linear-to-r from-red-500 to-orange-500 px-6 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <DoorOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 id="room-form-modal-title" className="text-lg font-semibold text-white">
                  {editingRoom ? 'Chỉnh sửa phòng' : 'Thêm phòng mới'}
                </h2>
                <p className="text-sm text-white/80">
                  {editingRoom ? `Cập nhật thông tin ${editingRoom.name}` : 'Điền thông tin phòng học'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Form Error Display */}
          {formError && (
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-700">{formError}</p>
              </div>
              <button
                onClick={onClearError}
                className="p-1 hover:bg-red-100 rounded transition-colors"
                aria-label="Đóng thông báo lỗi"
              >
                <X className="w-4 h-4 text-red-500" />
              </button>
            </div>
          )}

          {/* Row 1: Tên phòng + Mã phòng */}
          <div className="grid grid-cols-5 gap-4">
            <div className="col-span-3">
              <Label className="text-slate-700 font-medium">
                Tên phòng <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => onFieldChange('name', e.target.value)}
                placeholder="VD: Phòng 101, Lab Máy tính..."
                className={`mt-1.5 ${validation.name ? 'border-red-300 focus:ring-red-500' : ''}`}
              />
              {validation.name && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {validation.name}
                </p>
              )}
            </div>

            <div className="col-span-2">
              <div className="flex items-center justify-between">
                <Label className="text-slate-700 font-medium">Mã phòng</Label>
                {!editingRoom && (
                  <button
                    type="button"
                    onClick={() => setAutoCode(!autoCode)}
                    className={`text-xs flex items-center gap-1 px-2 py-0.5 rounded-full transition-colors ${autoCode
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    {autoCode ? 'Tự động' : 'Thủ công'}
                  </button>
                )}
              </div>
              <Input
                value={formData.code}
                onChange={(e) => {
                  setAutoCode(false);
                  onFieldChange('code', e.target.value.toUpperCase());
                }}
                placeholder="P101"
                className="mt-1.5"
                disabled={autoCode && !editingRoom}
              />
            </div>
          </div>

          {/* Row 2: Loại phòng + Sức chứa */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-700 font-medium">Loại phòng</Label>
              <select
                value={formData.room_type}
                onChange={(e) => onFieldChange('room_type', e.target.value)}
                className="w-full mt-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              >
                {ROOM_TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label className="text-slate-700 font-medium">Sức chứa</Label>
                <button
                  type="button"
                  onClick={() => setShowCapacityHint(!showCapacityHint)}
                  className="text-slate-400 hover:text-orange-500 transition-colors"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
              <div className="relative mt-1.5">
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => onFieldChange('capacity', parseInt(e.target.value) || 1)}
                    min={1}
                    className={validation.capacity ? 'border-red-300' : ''}
                    style={{ width: '80px', textAlign: 'right' }}
                  />
                  <span className="text-xs text-slate-400 ml-1">chỗ</span>
                </div>
              </div>
              {showCapacityHint && (
                <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> {capacitySuggestion.label}
                </p>
              )}
            </div>
          </div>

          {/* Row 3: Trung tâm */}
          <div>
            <Label className="text-slate-700 font-medium">
              <Building2 className="w-4 h-4 inline mr-1.5" />
              Trung tâm <span className="text-red-500">*</span>
            </Label>
            <select
              value={formData.center_id}
              onChange={(e) => onFieldChange('center_id', e.target.value)}
              className={`w-full mt-1.5 px-3 py-2 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${validation.center_id ? 'border-red-300' : 'border-slate-200'
                }`}
            >
              <option value="">-- Chọn trung tâm --</option>
              {centers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {validation.center_id && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {validation.center_id}
              </p>
            )}
            {centers.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                Chưa có trung tâm nào. Vui lòng tạo trung tâm trước.
              </p>
            )}
          </div>

          {/* Row 4: Thiết bị */}
          <div>
            <Label className="text-slate-700 font-medium mb-2 block">
              Thiết bị có sẵn
            </Label>
            <EquipmentSelector
              selected={formData.equipment}
              onToggle={onEquipmentToggle}
            />
            <p className="text-xs text-slate-500 mt-2">
              Chọn các thiết bị có trong phòng để dễ quản lý và xếp lịch
            </p>
          </div>

          {/* Row 5: Trạng thái */}
          <div>
            <Label className="text-slate-700 font-medium">Trạng thái</Label>
            <div className="grid grid-cols-3 gap-2 mt-1.5">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onFieldChange('status', opt.value)}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all
                    ${formData.status === opt.value
                      ? opt.value === 'active'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : opt.value === 'maintenance'
                          ? 'border-amber-500 bg-amber-50 text-amber-700'
                          : 'border-slate-400 bg-slate-50 text-slate-600'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }
                  `}
                >
                  {opt.value === 'active' && <CheckCircle2 className="w-4 h-4 inline mr-1" />}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Row 6: Ghi chú */}
          <div>
            <Label className="text-slate-700 font-medium">Ghi chú</Label>
            <textarea
              value={formData.notes}
              onChange={(e) => onFieldChange('notes', e.target.value)}
              placeholder="Thông tin thêm về phòng học..."
              rows={2}
              className="w-full mt-1.5 px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            <span className="text-red-500">*</span> Bắt buộc
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button
              onClick={onSave}
              disabled={saving || !isValid}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : editingRoom ? (
                'Cập nhật'
              ) : (
                <>
                  <DoorOpen className="w-4 h-4 mr-2" />
                  Thêm phòng
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoomFormModal;
