/**
 * EquipmentSelector Component
 * Chọn thiết bị cho phòng
 */

import { Monitor, Projector, Wind, Video, MoreHorizontal } from 'lucide-react';
import { EQUIPMENT_LABELS, EQUIPMENT_LIST } from '../utils';

// Icon mapping cho thiết bị
const equipmentIcons = {
  projector: Projector,
  computers: Monitor,
  air_conditioner: Wind,
  video_conference: Video,
  whiteboard: MoreHorizontal
};

export function EquipmentSelector({ selected = [], onToggle }) {
  return (
    <div className="flex flex-wrap gap-2">
      {EQUIPMENT_LIST.map(key => {
        const isSelected = selected.includes(key);
        const Icon = equipmentIcons[key] || MoreHorizontal;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onToggle(key)}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border transition-colors ${
              isSelected 
                ? 'bg-blue-100 border-blue-300 text-blue-700' 
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Icon className="h-4 w-4" />
            {EQUIPMENT_LABELS[key]}
          </button>
        );
      })}
    </div>
  );
}

export default EquipmentSelector;
